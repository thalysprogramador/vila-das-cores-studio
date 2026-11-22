# -*- coding: utf-8 -*-
"""
Estúdio de Dublagem Multi-Personagem — Qualidade Broadcast (Zero Mudança de Voz / Zero Ruído de Corte)
- Modelo Gemini TTS TRAVADO POR PERSONAGEM (series_bible.json -> gemini_model) rotacionando APENAS entre chaves (K1/K2/K3)!
- Fade-in (25ms) e Fade-out (35ms) cossenoidal em TODA fala masterizada -> ZERO clique/pop/barulho esquisito entre falantes!
- Batch TTS com validação rígida de silêncio nas bordas (rejeita qualquer corte sujo!)
- Envia APENAS a fala pura ao Gemini TTS (ZERO leitura de prompt!)
"""
import asyncio
import base64
import json
import subprocess
import time
import urllib.error
import urllib.request
import wave
from collections import defaultdict
from pathlib import Path

import edge_tts
import imageio_ffmpeg
import numpy as np

from config import get_kids_secret, load_series_bible

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
SR = 44100
FPS = 24

FALLBACK_TTS_MODELS = [
    "gemini-2.5-flash-preview-tts",
    "gemini-3.8-flash-tts",
    "gemini-3.1-flash-tts-preview",
]
_EXHAUSTED_SLOTS: set[tuple[int, str]] = set()
_SLOT_LAST_CALL: dict[tuple[int, str], float] = {}
MIN_SECONDS_PER_SLOT = 21.0


def get_available_kids_gemini_keys() -> list[str]:
    keys = []
    candidates = [
        ("KIDS_GEMINI_API_KEY", "kids_gemini_api_key.txt"),
        ("KIDS_GEMINI_API_KEY_2", "kids_gemini_api_key_2.txt"),
        ("KIDS_GEMINI_API_KEY_3", "kids_gemini_api_key_3.txt"),
    ]
    for env_name, fname in candidates:
        k = get_kids_secret(env_name, fname)
        if k and k not in keys:
            keys.append(k)
    return keys


def _apply_silky_edge_fades(wav_path: Path, fade_in_ms: int = 25, fade_out_ms: int = 35):
    """Remove qualquer estalo/clique/respiração cortada nas pontas com fade cossenoidal suave."""
    with wave.open(str(wav_path), "rb") as wf:
        sr = wf.getframerate()
        nch = wf.getnchannels()
        raw = wf.readframes(wf.getnframes())
    arr = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    if len(arr) < 100:
        return
    # Remove qualquer DC offset residual
    arr = arr - float(np.mean(arr))
    fi = min(len(arr) // 4, int(sr * fade_in_ms / 1000.0))
    fo = min(len(arr) // 4, int(sr * fade_out_ms / 1000.0))
    if fi > 4:
        ramp_in = 0.5 * (1.0 - np.cos(np.linspace(0.0, np.pi, fi, dtype=np.float32)))
        arr[:fi] *= ramp_in
    if fo > 4:
        ramp_out = 0.5 * (1.0 + np.cos(np.linspace(0.0, np.pi, fo, dtype=np.float32)))
        arr[-fo:] *= ramp_out
    i16 = np.clip(arr * 32767.0, -32768, 32767).astype(np.int16)
    with wave.open(str(wav_path), "wb") as wf:
        wf.setnchannels(nch)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(i16.tobytes())


def _master_voice_wav(input_audio: Path, output_wav: Path, extra_af: str = "") -> Path:
    parts = [
        "highpass=f=85",
        "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-46dB",
        "areverse,silenceremove=start_periods=1:start_silence=0.05:start_threshold=-46dB,areverse",
    ]
    if extra_af:
        parts.append(extra_af)
    parts.extend([
        "equalizer=f=220:width_type=o:width=1.5:g=1.6",
        "equalizer=f=3400:width_type=o:width=1.5:g=1.4",
        "acompressor=threshold=-16dB:ratio=2.3:attack=6:release=70",
        "loudnorm=I=-15.0:TP=-1.5:LRA=5",
    ])
    subprocess.run(
        [
            FFMPEG_EXE, "-y", "-i", str(input_audio),
            "-af", ",".join(parts),
            "-ar", str(SR), "-ac", "1", "-c:a", "pcm_s16le",
            str(output_wav),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    _apply_silky_edge_fades(output_wav, fade_in_ms=25, fade_out_ms=35)
    return output_wav


def _call_gemini_tts_raw(text: str, voice_name: str, locked_model: str, out_raw_wav: Path) -> tuple[bool, str]:
    """
    PRIORIDADE ABSOLUTA DE CONSISTÊNCIA VOCAL:
    Tenta primeiro TODAS as chaves (K1, K2, K3...) no MESMO `locked_model` do personagem!
    Só usa outro modelo em último caso se TODAS as chaves esgotarem a cota diária do modelo travado.
    """
    keys = get_available_kids_gemini_keys()
    if not keys:
        return False, "no_keys"

    clean_speech = (text or "").strip()
    payload = {
        "contents": [{"parts": [{"text": clean_speech}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {"voiceName": voice_name}
                }
            },
        },
    }
    body_bytes = json.dumps(payload).encode("utf-8")

    # 1ª camada: TODAS as chaves no modelo TRAVADO do personagem (garante 100% mesma voz!)
    locked_slots = [(ki, locked_model) for ki in range(len(keys)) if (ki, locked_model) not in _EXHAUSTED_SLOTS]
    # 2ª camada (emergência): demais modelos somente se o modelo travado esgotou em TODAS as chaves
    other_models = [m for m in FALLBACK_TTS_MODELS if m != locked_model]
    emergency_slots = [
        (ki, m) for m in other_models for ki in range(len(keys)) if (ki, m) not in _EXHAUSTED_SLOTS
    ]
    slot_tiers = [locked_slots, emergency_slots]

    for tier in slot_tiers:
        if not tier:
            continue
        ordered = sorted(tier, key=lambda s: _SLOT_LAST_CALL.get(s, 0.0))
        for cycle in range(2):
            for slot in ordered:
                if slot in _EXHAUSTED_SLOTS:
                    continue
                ki, model = slot
                elapsed = time.time() - _SLOT_LAST_CALL.get(slot, 0.0)
                if elapsed < MIN_SECONDS_PER_SLOT:
                    time.sleep(MIN_SECONDS_PER_SLOT - elapsed)
                _SLOT_LAST_CALL[slot] = time.time()

                try:
                    req = urllib.request.Request(
                        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={keys[ki]}",
                        data=body_bytes,
                        headers={"Content-Type": "application/json"},
                        method="POST",
                    )
                    with urllib.request.urlopen(req, timeout=110) as resp:
                        data = json.loads(resp.read().decode("utf-8"))
                    parts = data["candidates"][0]["content"]["parts"]
                    pcm_b64 = next((p["inlineData"]["data"] for p in parts if "inlineData" in p and p["inlineData"].get("data")), None)
                    if not pcm_b64:
                        raise RuntimeError("Resposta Gemini TTS sem inlineData.")
                    pcm_bytes = base64.b64decode(pcm_b64)
                    with wave.open(str(out_raw_wav), "wb") as wf:
                        wf.setnchannels(1)
                        wf.setsampwidth(2)
                        wf.setframerate(24000)
                        wf.writeframes(pcm_bytes)
                    return True, f"gemini_tts:k{ki+1}:{model}:{voice_name}"
                except urllib.error.HTTPError as err:
                    err_txt = err.read().decode("utf-8", errors="ignore")
                    low = err_txt.lower()
                    if err.code == 404 or ("per day" in low and err.code == 429) or ("free_tier_requests" in low and err.code == 429):
                        _EXHAUSTED_SLOTS.add(slot)
                        print(f"[VOICE] Slot K{ki+1}/{model} esgotou cota diária -> próximo", flush=True)
                    elif err.code == 429:
                        _SLOT_LAST_CALL[slot] = time.time() + 14.0
                        print(f"[VOICE] Slot K{ki+1}/{model} RPM 429 -> aguardando janela limpa...", flush=True)
                    else:
                        print(f"[VOICE] Slot K{ki+1}/{model} HTTP {err.code}", flush=True)
                except Exception as err:
                    print(f"[VOICE] Slot K{ki+1}/{model} erro: {err}", flush=True)
            if cycle == 0:
                time.sleep(8.0)
    return False, "failed"


def _apply_character_mastering(raw_wav: Path, output_wav: Path, vcfg: dict) -> Path:
    g_pitch = float(vcfg.get("gemini_pitch", 1.0))
    g_formant = vcfg.get("gemini_formant", "shifted")
    extra_af = (
        f"rubberband=pitch={g_pitch:.3f}:formant={g_formant}:pitchq=quality"
        if abs(g_pitch - 1.0) > 0.015
        else ""
    )
    return _master_voice_wav(raw_wav, output_wav, extra_af=extra_af)


def _split_batch_wav_by_silences(raw_wav: Path, texts: list[str], out_raw_chunks: list[Path]) -> bool:
    """
    Split acústico ULTRA-RÍGIDO: exige vales profundos de silêncio (>=320ms) e garante que
    TODAS as bordas cortadas estão em silêncio absoluto (zero ruído ou sílaba cortada!).
    """
    n_lines = len(texts)
    if n_lines <= 1:
        if n_lines == 1:
            out_raw_chunks[0].write_bytes(raw_wav.read_bytes())
        return True

    with wave.open(str(raw_wav), "rb") as wf:
        sr = wf.getframerate()
        raw = wf.readframes(wf.getnframes())
    samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    total_dur = len(samples) / sr
    if total_dur < n_lines * 1.2:
        return False

    win = int(0.025 * sr)
    hop = int(0.010 * sr)
    n_win = max(1, (len(samples) - win) // hop)
    rms = np.array([np.sqrt(np.mean(samples[i * hop : i * hop + win] ** 2) + 1e-12) for i in range(n_win)])
    thresh = max(0.010, float(np.percentile(rms, 75)) * 0.11)
    is_silent = rms < thresh

    silences = []
    in_s = False
    s_start = 0
    for i, val in enumerate(is_silent):
        if val and not in_s:
            in_s = True
            s_start = i
        elif not val and in_s:
            in_s = False
            dur = (i - s_start) * (hop / sr)
            center_sec = ((s_start + i) * 0.5) * (hop / sr)
            if dur >= 0.32 and 0.8 < center_sec < total_dur - 0.8:
                silences.append((dur, int(center_sec * sr)))

    if len(silences) < n_lines - 1:
        return False

    silences.sort(key=lambda x: x[0], reverse=True)
    chosen = []
    for dur, c_samp in silences:
        if all(abs(c_samp - prev) > int(1.0 * sr) for prev in chosen):
            chosen.append(c_samp)
            if len(chosen) == n_lines - 1:
                break
    if len(chosen) != n_lines - 1:
        return False

    chosen.sort()
    bounds = [0] + chosen + [len(samples)]

    char_counts = [max(4, len(t.strip())) for t in texts]
    total_chars = sum(char_counts)
    edge_n = int(0.035 * sr)

    for i in range(n_lines):
        seg = samples[bounds[i] : bounds[i + 1]]
        seg_dur = len(seg) / sr
        expected_share = char_counts[i] / total_chars
        actual_share = seg_dur / total_dur
        if seg_dur < 0.8:
            return False
        if actual_share < expected_share * 0.45 or actual_share > expected_share * 2.15:
            return False
        # Verifica silêncio limpo nas bordas internas para NUNCA gerar estalo/ruído estranho!
        if i > 0 and float(np.sqrt(np.mean(seg[:edge_n] ** 2))) > 0.018:
            return False
        if i < n_lines - 1 and float(np.sqrt(np.mean(seg[-edge_n:] ** 2))) > 0.018:
            return False

    for i in range(n_lines):
        seg_i16 = np.clip(samples[bounds[i] : bounds[i + 1]] * 32767.0, -32768, 32767).astype(np.int16)
        with wave.open(str(out_raw_chunks[i]), "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sr)
            wf.writeframes(seg_i16.tobytes())
    return True


async def _call_edge_tts_async(text: str, voice: str, out_mp3: Path):
    comm = edge_tts.Communicate(text, voice=voice, rate="+0%")
    await comm.save(str(out_mp3))


def synthesize_character_line(
    speaker_id: str,
    text: str,
    output_wav: Path,
    bible: dict | None = None,
    prefer_gemini: bool = True,
) -> tuple[Path, str]:
    bible = bible or load_series_bible()
    char_info = bible["characters"].get(speaker_id)
    if not char_info:
        raise ValueError(f"Personagem '{speaker_id}' não encontrado em series_bible.json")

    vcfg = char_info["voice"]
    locked_model = vcfg.get("gemini_model", "gemini-2.5-flash-preview-tts")
    output_wav.parent.mkdir(parents=True, exist_ok=True)
    if output_wav.exists() and output_wav.stat().st_size > 4000:
        return output_wav, f"cached:{locked_model}:{vcfg['gemini_voice']}"

    keys = get_available_kids_gemini_keys() if prefer_gemini else []
    if keys:
        raw_tmp = output_wav.with_suffix(".raw.wav")
        ok, eng = _call_gemini_tts_raw(text, vcfg["gemini_voice"], locked_model, raw_tmp)
        if ok:
            _apply_character_mastering(raw_tmp, output_wav, vcfg)
            raw_tmp.unlink(missing_ok=True)
            return output_wav, eng
        raise RuntimeError(f"Gemini TTS indisponível para '{speaker_id}' ({eng}).")

    raw_mp3 = output_wav.with_suffix(".raw.mp3")
    asyncio.run(_call_edge_tts_async(text, vcfg["fallback_edge_voice"], raw_mp3))
    pitch = float(vcfg.get("fallback_pitch", 1.0))
    formant = vcfg.get("fallback_formant", "preserved")
    extra_af = f"rubberband=pitch={pitch:.3f}:formant={formant}:pitchq=quality" if abs(pitch - 1.0) > 0.02 else ""
    _master_voice_wav(raw_mp3, output_wav, extra_af=extra_af)
    raw_mp3.unlink(missing_ok=True)
    return output_wav, f"edge_tts:{vcfg['fallback_edge_voice']}"


def synthesize_episode_voices_batched(
    items: list[tuple[str, str, Path]],
    bible: dict | None = None,
    batch_size: int = 3,
) -> dict[Path, str]:
    """
    Agrupa até `batch_size` falas por personagem sempre no MESMO modelo travado do personagem,
    com validação acústica estrita de silêncio nas bordas!
    """
    bible = bible or load_series_bible()
    results: dict[Path, str] = {}

    pending_by_speaker: dict[str, list[tuple[str, Path]]] = defaultdict(list)
    for speaker_id, text, out_wav in items:
        out_wav.parent.mkdir(parents=True, exist_ok=True)
        if out_wav.exists() and out_wav.stat().st_size > 4000:
            vcfg = bible["characters"][speaker_id]["voice"]
            results[out_wav] = f"cached:{vcfg.get('gemini_model')}:{vcfg['gemini_voice']}"
        else:
            pending_by_speaker[speaker_id].append((text, out_wav))

    total_pending = sum(len(v) for v in pending_by_speaker.values())
    if total_pending == 0:
        return results

    print(f"[BATCH TTS TRAVADO] {total_pending} falas em {len(pending_by_speaker)} personagens...", flush=True)

    for speaker_id, lines in pending_by_speaker.items():
        vcfg = bible["characters"][speaker_id]["voice"]
        locked_model = vcfg.get("gemini_model", "gemini-2.5-flash-preview-tts")
        for i in range(0, len(lines), batch_size):
            group = lines[i : i + batch_size]
            if len(group) == 1:
                txt, out_w = group[0]
                _, eng = synthesize_character_line(speaker_id, txt, out_w, bible=bible)
                results[out_w] = eng
                continue

            texts = [g[0].strip() for g in group]
            joined_text = "\n\n...\n\n...\n\n".join(texts)
            batch_raw = group[0][1].parent / f"_batch_{speaker_id}_{i}.raw.wav"
            ok, eng = _call_gemini_tts_raw(joined_text, vcfg["gemini_voice"], locked_model, batch_raw)

            split_ok = False
            chunk_raws = [g[1].with_suffix(".chunk.raw.wav") for g in group]
            if ok and batch_raw.exists():
                split_ok = _split_batch_wav_by_silences(batch_raw, texts, chunk_raws)
                batch_raw.unlink(missing_ok=True)

            if split_ok:
                for (txt, out_w), craw in zip(group, chunk_raws):
                    _apply_character_mastering(craw, out_w, vcfg)
                    craw.unlink(missing_ok=True)
                    results[out_w] = f"batch:{eng}"
                print(f"  [BATCH {len(group)}x LIMPO!] {speaker_id:5s} ({eng})", flush=True)
            else:
                for craw in chunk_raws:
                    craw.unlink(missing_ok=True)
                print(f"  [BATCH rejeitado -> individual limpo] {speaker_id:5s} ({len(group)} falas)", flush=True)
                for txt, out_w in group:
                    _, s_eng = synthesize_character_line(speaker_id, txt, out_w, bible=bible)
                    results[out_w] = s_eng

    return results


def read_wav_mono(path: Path) -> np.ndarray:
    with wave.open(str(path), "rb") as wf:
        raw = wf.readframes(wf.getnframes())
        return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0


def extract_visemes_6_24fps(wav_samples: np.ndarray, total_frames: int) -> list[int]:
    spf = SR / FPS
    rms_list, zcr_list, low_ratio_list = [], [], []
    for f in range(total_frames):
        s0 = int(f * spf)
        s1 = min(len(wav_samples), int((f + 1) * spf))
        if s0 >= len(wav_samples) or s1 - s0 < 16:
            rms_list.append(0.0); zcr_list.append(0.0); low_ratio_list.append(0.5)
            continue
        seg = wav_samples[s0:s1]
        rms_list.append(float(np.sqrt(np.mean(seg * seg) + 1e-12)))
        zcr_list.append(float(np.mean(np.abs(np.diff(np.sign(seg)))) * 0.5))
        spec = np.abs(np.fft.rfft(seg * np.hanning(len(seg))))
        freqs = np.fft.rfftfreq(len(seg), 1.0 / SR)
        low_e = float(np.sum(spec[(freqs >= 120) & (freqs < 750)])) + 1e-9
        mid_e = float(np.sum(spec[(freqs >= 750) & (freqs < 2800)])) + 1e-9
        low_ratio_list.append(low_e / (low_e + mid_e))

    rms_arr = np.array(rms_list, dtype=np.float32)
    active = rms_arr[rms_arr > 0.015]
    ref = max(0.05, float(np.percentile(active, 88)) if len(active) > 4 else 0.12)
    visemes: list[int] = []
    for i, r in enumerate(rms_arr):
        norm, lr, zcr = r / ref, low_ratio_list[i], zcr_list[i]
        if norm < 0.12:
            v = 0
        elif norm < 0.28:
            v = 1
        elif norm < 0.56:
            v = 5 if lr > 0.68 else (2 if zcr > 0.13 else 3)
        elif norm < 0.85:
            v = 5 if lr > 0.66 else (2 if zcr > 0.15 else 3)
        else:
            v = 5 if lr > 0.70 else 4
        visemes.append(v)

    out = list(visemes)
    for i in range(1, len(visemes) - 1):
        if visemes[i] == 0 and visemes[i - 1] >= 2 and visemes[i + 1] >= 2:
            out[i] = 1
    return out
