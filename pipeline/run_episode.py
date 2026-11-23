# -*- coding: utf-8 -*-
"""
Orquestrador Completo de Episódio Full HD 1080p — Tico & A Vila das Cores
Uso:
  python pipeline/run_episode.py                 # Gera próximo episódio em 1080p local (sem upload)
  python pipeline/run_episode.py --upload        # Gera + publica no YouTube Kids + atualiza memória
"""
import argparse
import json
import math
import os
import shutil
import subprocess
import wave
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

from config import (
    OUTPUT_DIR,
    REMOTION_DIR,
    TMP_DIR,
    load_series_bible,
    load_series_memory,
    save_series_memory,
)
from music_sfx import SR, generate_mood_loop, place_audio, synth_sfx
from showrunner import generate_next_episode_script
from voice_studio import (
    FFMPEG_EXE,
    FPS,
    extract_visemes_6_24fps,
    read_wav_mono,
    synthesize_episode_voices_batched,
)
from youtube_kids_uploader import upload_kids_episode, upload_kids_short


def build_audio_and_timeline(episode_data: dict, work_dir: Path) -> tuple[Path, Path]:
    bible = load_series_bible()
    pub_dir = REMOTION_DIR / "public"
    pub_dir.mkdir(parents=True, exist_ok=True)

    beats = episode_data["beats"]
    # Etapa 1: Sintetiza TODAS as falas em lote inteligente por personagem (economiza ~3x de cota TTS!)
    dialogue_items = [
        (beat["speaker"], beat["text"], work_dir / f"{idx:03d}_{beat['id']}.wav")
        for idx, beat in enumerate(beats)
        if beat["type"] == "dialogue"
    ]
    engines_map = synthesize_episode_voices_batched(dialogue_items, bible=bible, batch_size=3)

    voice_placements = []
    sfx_placements = []
    mood_segments = []
    timeline_beats = []

    cur_frame = 0
    for idx, beat in enumerate(beats):
        bid = beat["id"]
        btype = beat["type"]
        mood = beat.get("bgm_mood", "happy")

        if btype == "dialogue":
            wav_path = work_dir / f"{idx:03d}_{bid}.wav"
            engine = engines_map.get(wav_path, "gemini_tts")
            print(f"  [{idx+1:02d}/{len(beats)}] {beat['speaker']:5s} ({engine}): {beat['text'][:55]}...", flush=True)
            samples = read_wav_mono(wav_path)
            speech_sec = len(samples) / SR
            post_pause = float(beat.get("post_pause_sec", 0.45))
            speech_frames = max(1, int(math.ceil(speech_sec * FPS)))
            pause_frames = int(round(post_pause * FPS))
            dur_frames = speech_frames + pause_frames

            visemes = extract_visemes_6_24fps(samples, speech_frames) + [0] * pause_frames
            start_s = int(cur_frame * SR / FPS)
            voice_placements.append((start_s, samples))
            mood_segments.append((start_s, start_s + len(samples), mood, True))
            if pause_frames > 0:
                mood_segments.append((start_s + len(samples), int((cur_frame + dur_frames) * SR / FPS), mood, False))
        else:
            dur_frames = max(1, int(round(float(beat.get("duration_sec", 2.0)) * FPS)))
            visemes = []
            mood_segments.append((int(cur_frame * SR / FPS), int((cur_frame + dur_frames) * SR / FPS), mood, False))

        for ev in beat.get("sfx", []):
            sfx_placements.append((int((cur_frame / FPS + float(ev.get("offset_sec", 0.0))) * SR), ev["name"], float(ev.get("gain", 0.6))))

        timeline_beats.append({
            **beat,
            "startFrame": cur_frame,
            "endFrame": cur_frame + dur_frames,
            "durationFrames": dur_frames,
            "mouthFrames": visemes,
        })
        cur_frame += dur_frames

    total_frames = cur_frame
    total_sec = total_frames / FPS
    total_samples = int(math.ceil(total_sec * SR)) + SR // 2

    mood_loops = {m: generate_mood_loop(m, bars=4) for m in ("intro", "curious", "happy", "playful", "gentle", "magical", "celebration")}
    sfx_bank = {k: synth_sfx(k) for k in ("boing", "pop", "ding", "sparkle", "whoosh", "blow_wind", "applause_claps", "rainbow_fanfare")}

    # Mixagem contínua estilo estúdio de TV:
    # 1) Mescla trechos contíguos do mesmo humor musical (evita cortes/estalos entre falas!)
    merged_moods = []
    for seg_s, seg_e, mood, _ in mood_segments:
        seg_s = max(0, min(total_samples, seg_s))
        seg_e = max(seg_s, min(total_samples, seg_e))
        if seg_e <= seg_s:
            continue
        if merged_moods and merged_moods[-1][2] == mood:
            merged_moods[-1] = (merged_moods[-1][0], seg_e, mood)
        else:
            merged_moods.append((seg_s, seg_e, mood))

    bgm_track = np.zeros(total_samples, dtype=np.float32)
    xfade = int(0.45 * SR)
    for idx_m, (seg_s, seg_e, mood) in enumerate(merged_moods):
        # Estende suavemente para crossfade sem buraco nem estalo
        ext_s = max(0, seg_s - (xfade // 2 if idx_m > 0 else 0))
        ext_e = min(total_samples, seg_e + (xfade // 2 if idx_m < len(merged_moods) - 1 else 0))
        seg_n = ext_e - ext_s
        if seg_n <= 0:
            continue
        loop = mood_loops.get(mood, mood_loops["happy"])
        chunk = loop[(np.arange(seg_n) + ext_s) % len(loop)].copy()
        ef = min(xfade, seg_n // 3)
        if ef > 16:
            ramp = 0.5 * (1.0 - np.cos(np.linspace(0.0, np.pi, ef, dtype=np.float32)))
            chunk[:ef] *= ramp
            chunk[-ef:] *= ramp[::-1]
        bgm_track[ext_s:ext_e] += chunk

    # 2) Curva de ducking ultra-suave (sem saltos abruptos entre falantes!)
    target_gain = np.full(total_samples, 0.32, dtype=np.float32)
    for seg_s, seg_e, mood, is_speaking in mood_segments:
        seg_s = max(0, min(total_samples, seg_s))
        seg_e = max(seg_s, min(total_samples, seg_e))
        if seg_e > seg_s:
            target_gain[seg_s:seg_e] = 0.48 if mood == "intro" else (0.14 if is_speaking else 0.32)
    # Suaviza a curva de volume com média móvel de 300ms (zero clique!)
    smooth_win = int(0.30 * SR)
    kernel = np.ones(smooth_win, dtype=np.float32) / smooth_win
    smooth_gain = np.convolve(target_gain, kernel, mode="same")
    bgm_track *= smooth_gain

    voice_track = np.zeros(total_samples, dtype=np.float32)
    for start_s, samples in voice_placements:
        place_audio(voice_track, samples, start_s, gain=0.98)

    sfx_track = np.zeros(total_samples, dtype=np.float32)
    for start_s, sfx_name, gain in sfx_placements:
        clip = sfx_bank.get(sfx_name)
        if clip is not None:
            place_audio(sfx_track, clip, start_s, gain=gain * 0.52)

    # Estéreo limpo e quente
    left = voice_track + bgm_track * 0.96 + sfx_track * 0.90
    right = voice_track + np.roll(bgm_track, int(0.006 * SR)) * 0.96 + sfx_track * 0.90
    stereo = np.stack([left, right], axis=1)
    peak = float(np.max(np.abs(stereo)) + 1e-9)
    if peak > 0.92:
        stereo *= 0.92 / peak

    master_wav = work_dir / "master.wav"
    with wave.open(str(master_wav), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(np.clip(stereo * 32767.0, -32768, 32767).astype(np.int16).tobytes())

    master_mp3 = pub_dir / "episode_master.mp3"
    subprocess.run(
        [FFMPEG_EXE, "-y", "-i", str(master_wav), "-c:a", "libmp3lame", "-b:a", "192k", "-ar", str(SR), str(master_mp3)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    tl_path = pub_dir / "episode_timeline.json"
    tl_path.write_text(
        json.dumps(
            {
                "seriesTitle": bible["series_title"],
                "episodeNumber": episode_data["episode_number"],
                "episodeTitle": episode_data["episode_title"],
                "thumbnailBadge": episode_data.get("thumbnail_badge", "NOVA AVENTURA!"),
                "thumbnailSub": episode_data.get("thumbnail_sub", "VILA DAS CORES!"),
                "fps": FPS,
                "width": 1920,
                "height": 1080,
                "totalFrames": total_frames,
                "durationSec": round(total_sec, 2),
                "audioFile": "episode_master.mp3",
                "beats": timeline_beats,
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    return master_mp3, tl_path


def _remotion_extra_args() -> list[str]:
    args = []
    # Reutiliza cache local do Chromium se existir na máquina (evita download de 200MB)
    local_chrome = REMOTION_DIR.parent.parent / "ReactFactory" / "studio" / "node_modules" / ".remotion" / "chrome-headless-shell" / "win64" / "chrome-headless-shell-win64" / "chrome-headless-shell.exe"
    if local_chrome.exists():
        args.append(f"--browser-executable={local_chrome}")
    cpus = os.cpu_count() or 4
    if cpus >= 12:
        args.append("--concurrency=10")
    return args


def render_episode_and_shorts(ep_num: int, episode_data: dict, timeline_path: Path, make_shorts: bool = True) -> tuple[Path, Path, list[dict]]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_mp4 = OUTPUT_DIR / f"Tico_VilaDasCores_Ep{ep_num:02d}_1080p.mp4"
    out_thumb = OUTPUT_DIR / f"Tico_VilaDasCores_Ep{ep_num:02d}_thumb.png"

    cli = REMOTION_DIR / "node_modules" / ".bin" / ("remotion.cmd" if Path("C:/").exists() else "remotion")
    extra = _remotion_extra_args()
    cmd_video = [
        str(cli), "render", "src/index.ts", "Episode1080p", str(out_mp4),
        "--codec=h264", "--crf=19", "--audio-bitrate=192k", *extra,
    ]
    subprocess.run(cmd_video, cwd=str(REMOTION_DIR), check=True)

    cmd_thumb = [
        str(cli), "still", "src/index.ts", "EpisodeThumb", str(out_thumb), "--frame=0", *extra,
    ]
    subprocess.run(cmd_thumb, cwd=str(REMOTION_DIR), check=True)

    shorts_rendered = []
    if make_shorts:
        tl = json.loads(timeline_path.read_text(encoding="utf-8"))
        dialogue_beats = [b for b in tl["beats"] if b["type"] == "dialogue"]
        highlights = episode_data.get("shorts_highlights") or []
        if len(highlights) < 2 and len(dialogue_beats) >= 12:
            # Seleção automática inteligente: 1 corte no início/meio + 1 corte no clímax!
            mid1 = max(2, len(dialogue_beats) // 3)
            mid2 = max(mid1 + 5, (len(dialogue_beats) * 2) // 3)
            highlights = [
                {
                    "start_beat_index": mid1,
                    "end_beat_index": min(len(dialogue_beats) - 1, mid1 + 4),
                    "hook_badge": "QUE DIVERTIDO!",
                    "short_title": f"Momento fofo do Ep. {ep_num} de Tico & A Vila das Cores! #shorts",
                },
                {
                    "start_beat_index": mid2,
                    "end_beat_index": min(len(dialogue_beats) - 1, mid2 + 4),
                    "hook_badge": "BRINCA COM A GENTE!",
                    "short_title": f"Aventura mágica no Ep. {ep_num} da Vila das Cores! #shorts",
                },
            ]

        for s_idx, hl in enumerate(highlights[:2], start=1):
            b_start_i = max(0, min(len(dialogue_beats) - 2, int(hl.get("start_beat_index", 4))))
            b_end_i = max(b_start_i + 1, min(len(dialogue_beats) - 1, int(hl.get("end_beat_index", b_start_i + 4))))
            sf = int(dialogue_beats[b_start_i]["startFrame"])
            ef = int(dialogue_beats[b_end_i]["endFrame"])
            # Limita o Short entre 18s e 45s (zona de ouro de retenção!)
            ef = min(ef, sf + 45 * FPS)
            if ef - sf < 15 * FPS:
                ef = min(int(tl["totalFrames"]), sf + 25 * FPS)

            short_mp4 = OUTPUT_DIR / f"Tico_VilaDasCores_Ep{ep_num:02d}_Short{s_idx}.mp4"
            props_file = OUTPUT_DIR / f"_short_{s_idx}_props.json"
            props_file.write_text(
                json.dumps({
                    "clipStartFrame": sf,
                    "clipEndFrame": ef,
                    "hookBadge": hl.get("hook_badge", "VILA DAS CORES!"),
                }, ensure_ascii=False),
                encoding="utf-8",
            )
            cmd_short = [
                str(cli), "render", "src/index.ts", "Short1080x1920", str(short_mp4),
                "--codec=h264", "--crf=20", "--audio-bitrate=192k",
                f"--props={props_file}", *extra,
            ]
            print(f"=== RENDERIZANDO SHORT #{s_idx} (1080x1920, {(ef - sf)/FPS:.1f}s) ===", flush=True)
            subprocess.run(cmd_short, cwd=str(REMOTION_DIR), check=True)
            props_file.unlink(missing_ok=True)
            shorts_rendered.append({
                "path": short_mp4,
                "title": hl.get("short_title") or f"Tico & A Vila das Cores Ep. {ep_num} - Parte {s_idx} #shorts",
            })

    return out_mp4, out_thumb, shorts_rendered


def main():
    parser = argparse.ArgumentParser(description="Produtora Automática Full HD — Tico & A Vila das Cores")
    parser.add_argument("--upload", action="store_true", help="Publica o episódio + 2 Shorts no novo canal YouTube Kids")
    parser.add_argument("--no-shorts", action="store_true", help="Não gera os 2 Shorts derivados")
    parser.add_argument("--privacy", default="public", choices=["public", "unlisted", "private"])
    parser.add_argument("--keep-tmp", action="store_true", help="Mantém WAVs temporários após o render")
    args = parser.parse_args()

    print("=== SHOWRUNNER: GERANDO ROTEIRO (7-8 MIN) COM MEMÓRIA DA SÉRIE ===", flush=True)
    episode_data = generate_next_episode_script()
    ep_num = int(episode_data["episode_number"])
    print(f"[EPISÓDIO {ep_num}] {episode_data['episode_title']}", flush=True)

    work_dir = TMP_DIR / f"ep_{ep_num:02d}"
    work_dir.mkdir(parents=True, exist_ok=True)

    print("=== ESTÚDIO DE VOZES & MIXAGEM ===", flush=True)
    _, tl_path = build_audio_and_timeline(episode_data, work_dir)

    print("=== RENDERIZANDO FULL HD 1080p + 2 SHORTS (REMOTION) ===", flush=True)
    out_mp4, out_thumb, shorts_rendered = render_episode_and_shorts(
        ep_num, episode_data, tl_path, make_shorts=not args.no_shorts
    )

    video_id = None
    short_ids = []
    if args.upload:
        video_id = upload_kids_episode(
            video_path=out_mp4,
            title=episode_data.get("youtube_title") or f"Tico & A Vila das Cores — Ep. {ep_num}: {episode_data['episode_title']}",
            description=episode_data.get("youtube_description", ""),
            tags=["desenho infantil", "tico e a vila das cores", "aprender cores", "desenho animado", "criancas 2 a 5 anos"],
            thumbnail_path=out_thumb,
            privacy_status=args.privacy,
        )
        # Agenda Shorts automaticamente nos picos 12:30 BRT (15:30Z) e 17:30 BRT (20:30Z) quando privacy == "public"!
        now_utc = datetime.now(timezone.utc)
        short_schedule_utc_hours = [(15, 30), (20, 30)]
        for s_i, sh in enumerate(shorts_rendered):
            pub_iso = None
            if args.privacy == "public" and s_i < len(short_schedule_utc_hours):
                hh, mm = short_schedule_utc_hours[s_i]
                cand = now_utc.replace(hour=hh, minute=mm, second=0, microsecond=0)
                if (cand - now_utc).total_seconds() > 900:  # pelo menos 15 min no futuro
                    pub_iso = cand.strftime("%Y-%m-%dT%H:%M:%SZ")
            sid = upload_kids_short(
                video_path=sh["path"],
                title=sh["title"],
                episode_number=ep_num,
                episode_video_id=video_id,
                privacy_status=args.privacy,
                publish_at_iso=pub_iso,
            )
            short_ids.append(sid)

    # Atualiza memória viva da série para continuidade no próximo episódio!
    mem = load_series_memory()
    mem["last_episode_number"] = ep_num
    mem["next_episode_hook"] = episode_data.get("next_episode_hook", "")
    mem.setdefault("episodes_history", []).append({
        "ep": ep_num,
        "title": episode_data["episode_title"],
        "summary": episode_data.get("summary", ""),
        "lesson": episode_data.get("lesson", ""),
        "youtube_id": video_id,
        "short_ids": short_ids,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    save_series_memory(mem)

    if not args.keep_tmp:
        shutil.rmtree(work_dir, ignore_errors=True)
    print(f"\n[CONCLUÍDO] Episódio {ep_num} + {len(shorts_rendered)} Shorts prontos!", flush=True)


if __name__ == "__main__":
    main()
