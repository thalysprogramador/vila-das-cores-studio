# -*- coding: utf-8 -*-
"""
Showrunner IA da Série — Tico & A Vila das Cores
Gera roteiros completos com memória contínua entre episódios + REGRA DE ELENCO EM CONJUNTO
(sempre exibe todos os personagens da cena juntos, nunca 1 personagem isolado!).
Para o Episódio 1 oficial, usa o roteiro mestre validado estilo TV com todos os 4 personagens!
"""
import json
import sys
import urllib.request
from pathlib import Path

from config import STUDIO_ROOT, load_series_bible, load_series_memory
from voice_studio import get_available_kids_gemini_keys

TEXT_MODELS = ["gemini-3.1-flash-lite", "gemini-3-flash-preview", "gemini-3.8-flash", "gemini-2.5-flash"]
VALID_SCENES = {"plaza_grey", "plaza_rainbow", "garden_red", "sunflower_yellow", "pond_blue", "forest_mystery", "starry_night"}
VALID_ACTIONS = {"idle", "wave", "jump", "bounce", "clap", "celebrate", "dance", "trip", "look_up", "think", "blow", "walk_in", "fly_in", "fly_idle"}
VALID_EMOTIONS = {"happy", "excited", "surprised", "curious", "sad", "thinking", "proud", "laughing"}
VALID_CAMERAS = {"wide", "closeup_tico", "closeup_lili", "closeup_dino", "closeup_nina", "sky", "props"}
VALID_MOODS = {"intro", "curious", "happy", "playful", "gentle", "magical", "celebration"}

# Posições padrão em grupo para garantir que a turma SEMPRE apareça junta e bem enquadrada!
DEFAULT_GROUP_SLOTS = {
    "tico": {"x": 280, "y": 565, "facing": "right"},
    "lili": {"x": 500, "y": 565, "facing": "right"},
    "dino": {"x": 725, "y": 565, "facing": "left"},
    "nina": {"x": 980, "y": 385, "facing": "left"},
}


def _build_official_episode_1() -> dict:
    """
    Roteiro oficial de estreia (Episódio 1) — mesma história amada no piloto, com TODOS os
    personagens juntos nas cenas em grupo, todas as interações educativas (morangos 1-2-3,
    joaninha, girassóis acordando, peixinho pulando, sopro da bolha azul, mistura das cores)
    e os 2 melhores cortes de Shorts já marcados com precisão!
    """
    from episode_01_beats import EPISODE_BEATS  # noqa: WPS433

    # Usa todos os beats ricos (~6-7 min de história real pura com vozes Gemini TTS travadas!)
    beats = [dict(b) for b in EPISODE_BEATS]

    return {
        "episode_number": 1,
        "episode_title": "O Mistério do Arco-Íris Sumido!",
        "summary": "O arco-íris da Vila das Cores ficou cinza e Tico, Lili, Dino Bip e Dona Nina encontraram o vermelho na horta de morangos, o amarelo nos girassóis e o azul na lagoa das bolhas para devolver todas as cores!",
        "lesson": "Cores primárias (vermelho, amarelo, azul), mistura de cores (laranja, verde, roxo), contagem 1-3 e trabalho em equipe",
        "youtube_title": "O Mistério do Arco-Íris Sumido! 🌈 Aprenda as Cores — Tico & A Vila das Cores (Ep. 01)",
        "youtube_description": (
            "🌈 Bem-vindo ao Episódio 1 de Tico & A Vila das Cores! 🐻🐰🦖🦉\n\n"
            "Oh não! O grande Arco-Íris da Vila das Cores ficou cinza! Venha ajudar o ursinho Tico, "
            "a coelhinha Lili, o dinossaurinho Dino Bip e a sábia Dona Coruja Nina a encontrar o "
            "VERMELHO na Horta dos Morangos, o AMARELO no Campo dos Girassóis e o AZUL na Lagoa das Bolhas!\n\n"
            "✨ Neste episódio as crianças de 2 a 5 anos aprendem:\n"
            "• Cores primárias (Vermelho, Amarelo e Azul)\n"
            "• Como misturar cores (Laranja, Verde e Roxo)\n"
            "• Contagem de 1 a 3 e trabalho em equipe!\n\n"
            "Inscreva-se na Vila das Cores para novas aventuras todos os dias! 💛❤️💙"
        ),
        "thumbnail_badge": "CADÊ AS CORES?!",
        "next_episode_hook": "No próximo episódio, a turma vai encontrar um ovo colorido misterioso na floresta!",
        # Índices dentre os beats de diálogo (a2_04..a2_07 contagem 1-2-3 + a4_03..a4_06 sopro da bolha azul!)
        "shorts_highlights": [
            {
                "start_beat_index": 13,
                "end_beat_index": 17,
                "hook_badge": "VAMOS CONTAR 1, 2, 3!",
                "short_title": "Você consegue contar os morangos com o Tico? 🍓🌈 #shorts",
            },
            {
                "start_beat_index": 27,
                "end_beat_index": 31,
                "hook_badge": "ASSOPRA COM A TURMA!",
                "short_title": "Ajude o Tico, a Lili e o Dino Bip a estourar a bolha azul! 🫧💙 #shorts",
            },
        ],
        "beats": beats,
    }


def _gemini_json(prompt: str, api_keys: list[str]) -> dict:
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.78,
            "responseMimeType": "application/json",
        },
    }
    body = json.dumps(payload).encode("utf-8")
    last_err = None
    for ki, api_key in enumerate(api_keys):
        for model in TEXT_MODELS:
            try:
                req = urllib.request.Request(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
                    data=body,
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=120) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                txt = "".join(p.get("text", "") for p in data["candidates"][0]["content"]["parts"]).strip()
                return json.loads(txt)
            except Exception as err:
                last_err = err
                print(f"[SHOWRUNNER] K{ki+1}/{model} falhou ({err}) -> próximo", flush=True)
    raise RuntimeError(f"Showrunner falhou em todas as chaves/modelos Gemini: {last_err}")


def _ensure_ensemble_chars(beat_chars: list[dict], speaker: str, scene: str, beat_index: int, valid_ids: set[str]) -> list[dict]:
    """
    REGRA DE OURO DE ELENCO EM GRUPO:
    Exceto nos 2 primeiros beats do gancho, SEMPRE garante que Tico, Lili e Dino Bip
    estejam presentes juntos em cena (e Dona Nina sempre que falar ou em cenas da pracinha),
    evitando que os personagens fiquem aparecendo sozinhos um de cada vez!
    """
    by_id = {}
    for ch in beat_chars:
        cid = ch.get("id")
        if cid in valid_ids:
            by_id[cid] = {
                "id": cid,
                "x": int(max(180, min(1080, ch.get("x", DEFAULT_GROUP_SLOTS.get(cid, {}).get("x", 500))))),
                "y": int(max(360, min(585, ch.get("y", DEFAULT_GROUP_SLOTS.get(cid, {}).get("y", 565))))),
                "facing": "left" if ch.get("facing") == "left" else "right",
                "emotion": ch.get("emotion") if ch.get("emotion") in VALID_EMOTIONS else "happy",
                "action": ch.get("action") if ch.get("action") in VALID_ACTIONS else "idle",
            }

    # Garante o falante na cena
    if speaker in valid_ids and speaker not in by_id:
        slot = DEFAULT_GROUP_SLOTS.get(speaker, {"x": 500, "y": 565, "facing": "right"})
        by_id[speaker] = {"id": speaker, **slot, "emotion": "happy", "action": "bounce"}

    # A partir do beat 2, toda a turma principal ("tico", "lili", "dino") fica reunida em tela!
    if beat_index >= 2:
        for core_id in ("tico", "lili", "dino"):
            if core_id in valid_ids and core_id not in by_id:
                slot = DEFAULT_GROUP_SLOTS[core_id]
                by_id[core_id] = {
                    "id": core_id,
                    **slot,
                    "emotion": "happy",
                    "action": "idle",
                }
        if scene == "plaza_rainbow" and "nina" in valid_ids and "nina" not in by_id:
            by_id["nina"] = {"id": "nina", **DEFAULT_GROUP_SLOTS["nina"], "emotion": "happy", "action": "fly_idle"}

    # Garante espaçamento horizontal limpo se 2 personagens vieram empilhados no mesmo X
    ordered = list(by_id.values())
    ground_chars = [c for c in ordered if c["id"] != "nina"]
    xs = [c["x"] for c in ground_chars]
    if len(ground_chars) >= 2 and (max(xs) - min(xs) < 160 or len(set(round(x / 80) for x in xs)) < len(ground_chars)):
        presets = [280, 500, 725, 920]
        for idx, c in enumerate(ground_chars):
            c["x"] = presets[idx % len(presets)]
            c["y"] = 565
            c["facing"] = "left" if idx == len(ground_chars) - 1 else "right"
    for c in ordered:
        if c["id"] == "nina":
            c["x"] = max(920, min(1040, c["x"]))
            c["y"] = min(420, c["y"])
            c["facing"] = "left"
    return ordered


def generate_next_episode_script() -> dict:
    memory = load_series_memory()
    next_ep_num = int(memory.get("last_episode_number", 0)) + 1

    # Episódio 1 oficial usa o roteiro mestre completo estilo TV já validado com o usuário!
    if next_ep_num == 1:
        print("[SHOWRUNNER] Carregando Roteiro Mestre Oficial do Episódio 1 (Elenco Completo em Grupo)!", flush=True)
        return _build_official_episode_1()

    api_keys = get_available_kids_gemini_keys()
    if not api_keys:
        raise RuntimeError(
            "Nenhuma KIDS_GEMINI_API_KEY configurada! Crie uma chave na nova conta Google "
            "e salve em VilaDasCoresStudio/_kids_secrets/kids_gemini_api_key.txt."
        )

    bible = load_series_bible()
    active_chars = {
        cid: {
            "name": c["display_name"],
            "species": c["species"],
            "personality": c["personality"],
            "catchphrase": c["catchphrase"],
        }
        for cid, c in bible["characters"].items()
        if c.get("active", True)
    }

    planned = next((a for a in memory.get("season_arc", []) if a["ep"] == next_ep_num), None)
    recent_history = memory.get("episodes_history", [])[-5:]

    prompt = f"""Você é o Showrunner chefe da série infantil animada brasileira "{bible['series_title']}" (público: 2 a 5 anos, estilo Bluey + Mundo Bita + Pocoyo).

ELENCO ATIVO FIXO (use APENAS estes IDs em speaker e chars):
{json.dumps(active_chars, ensure_ascii=False, indent=2)}

CENÁRIOS DISPONÍVEIS:
{json.dumps(bible['locations'], ensure_ascii=False)}

MEMÓRIA DOS ÚLTIMOS EPISÓDIOS (mantenha continuidade natural!):
{json.dumps(recent_history, ensure_ascii=False, indent=2)}

PRÓXIMO EPISÓDIO A CRIAR:
- Número: Episódio {next_ep_num} (Temporada {memory.get('season', 1)})
- Gancho deixado anteriormente: {memory.get('next_episode_hook', '')}
- Plano sugerido: {json.dumps(planned, ensure_ascii=False) if planned else 'Crie uma aventura educativa nova usando cores, contagem 1-5, amizade e trabalho em equipe!'}

REGRAS OBRIGATÓRIAS DE QUALIDADE (NÍVEL TV / MILHÕES DE VIEWS):
1. Crie entre 44 e 52 falas alegres, carinhosas e claras para crianças de 2 a 5 anos (duração alvo: 6 a 8 minutos completos!).
2. REGRA DE ELENCO EM GRUPO (MUITO IMPORTANTE!): Em praticamente TODAS as cenas, coloque OS 3 AMIGOS JUNTOS EM `chars` (tico em x=280, lili em x=500, dino em x=725, e nina em x=980 y=385 quando participar) reagindo com emoções e ações (`wave`, `bounce`, `clap`, `jump`, `dance`, `laughing`). NUNCA deixe só 1 personagem solitário na tela quando a turma está junta!
3. Inclua pelo menos 4 momentos INTERATIVOS olhando para a câmera (contar 1-2-3-4-5, apontar cores, bater palmas ou assoprar — com post_pause_sec = 1.6 e interactive_prompt curto!).
4. Inclua 2 momentos engraçados do Dino Bip e 1 lição acolhedora da Dona Coruja Nina.
5. Marque EXATAMENTE 2 melhores momentos (25 a 40 segundos cada) em "shorts_highlights" para virarem 2 YouTube Shorts verticais!
6. Retorne JSON estrito neste formato (note TODOS os amigos juntos em `chars`!):
{{
  "episode_number": {next_ep_num},
  "episode_title": "Título curto e mágico",
  "summary": "Resumo em 2 frases para a memória da série",
  "lesson": "Lição educativa do episódio",
  "youtube_title": "Título SEO infantil amigável (até 85 caracteres)",
  "youtube_description": "Descrição calorosa para pais e crianças com emojis",
  "thumbnail_badge": "PALAVRA CURTA (ex: OVO MÁGICO!)",
  "next_episode_hook": "Gancho para o próximo episódio",
  "shorts_highlights": [
    {{"start_beat_index": 8, "end_beat_index": 12, "hook_badge": "DINO TRAPALHÃO!", "short_title": "Dino Bip fez a turma rir muito! #shorts"}},
    {{"start_beat_index": 26, "end_beat_index": 30, "hook_badge": "VAMOS CONTAR!", "short_title": "Você consegue contar com o Tico? #shorts"}}
  ],
  "beats": [
    {{
      "id": "ep{next_ep_num}_01",
      "type": "dialogue",
      "scene": "plaza_rainbow",
      "bgm_mood": "happy",
      "speaker": "tico",
      "text": "Oi, amiguinho! ...",
      "post_pause_sec": 0.45,
      "camera": "wide",
      "chars": [
        {{"id": "tico", "x": 280, "y": 565, "facing": "right", "emotion": "excited", "action": "wave"}},
        {{"id": "lili", "x": 500, "y": 565, "facing": "right", "emotion": "happy", "action": "wave"}},
        {{"id": "dino", "x": 725, "y": 565, "facing": "left", "emotion": "excited", "action": "bounce"}}
      ],
      "props": {{"rainbow_level": 6, "orbs_collected": []}},
      "sfx": [{{"name": "sparkle", "offset_sec": 0.1, "gain": 0.55}}]
    }}
  ]
}}
"""
    raw = _gemini_json(prompt, api_keys)

    valid_char_ids = set(active_chars.keys())
    clean_beats = []
    prev_scene = None
    for i, b in enumerate(raw.get("beats", [])):
        scene = b.get("scene", "plaza_rainbow")
        if scene not in VALID_SCENES:
            scene = "plaza_rainbow"
        speaker = b.get("speaker")
        if speaker not in valid_char_ids:
            speaker = "tico"

        # Insere transição lúdica automática quando muda de cenário!
        if prev_scene is not None and scene != prev_scene and i >= 2:
            t_kind = "bubble" if scene == "pond_blue" else ("rainbow" if scene == "plaza_rainbow" else "cloud")
            t_col = "#2E86DE" if scene == "pond_blue" else ("#FFD43B" if scene == "sunflower_yellow" else "#FF6B81")
            clean_beats.append({
                "id": f"trans_{i}",
                "type": "transition",
                "scene": scene,
                "bgm_mood": "playful",
                "speaker": None,
                "duration_sec": 1.4,
                "camera": "wide",
                "chars": [],
                "props": {"transition_kind": t_kind, "transition_color": t_col},
                "sfx": [{"name": "whoosh", "offset_sec": 0.1, "gain": 0.55}],
            })
        prev_scene = scene

        chars = _ensure_ensemble_chars(b.get("chars", []), speaker, scene, i, valid_char_ids)
        clean_beats.append({
            "id": b.get("id") or f"ep{next_ep_num}_{i:02d}",
            "type": "dialogue",
            "scene": scene,
            "bgm_mood": b.get("bgm_mood") if b.get("bgm_mood") in VALID_MOODS else "happy",
            "speaker": speaker,
            "text": (b.get("text") or "Oi, amiguinho!").strip(),
            "post_pause_sec": float(b.get("post_pause_sec", 0.45)),
            "camera": b.get("camera") if b.get("camera") in VALID_CAMERAS else "wide",
            "chars": chars,
            "props": b.get("props") if isinstance(b.get("props"), dict) else {},
            "sfx": b.get("sfx") if isinstance(b.get("sfx"), list) else [],
        })

    intro_beats = [
        {
            "id": "intro_theme",
            "type": "intro_sequence",
            "scene": "intro_stage",
            "bgm_mood": "intro",
            "speaker": None,
            "duration_sec": 8.5,
            "camera": "wide",
            "chars": [
                {"id": "tico", "x": 360, "y": 560, "facing": "right", "emotion": "excited", "action": "dance"},
                {"id": "lili", "x": 560, "y": 565, "facing": "right", "emotion": "happy", "action": "wave"},
                {"id": "dino", "x": 760, "y": 560, "facing": "left", "emotion": "excited", "action": "jump"},
                {"id": "nina", "x": 960, "y": 430, "facing": "left", "emotion": "happy", "action": "fly_idle"},
            ],
            "props": {"rainbow_level": 6, "show_logo": True},
            "sfx": [{"name": "rainbow_fanfare", "offset_sec": 0.2, "gain": 0.65}],
        },
        {
            "id": "title_card",
            "type": "dialogue",
            "scene": "title_card",
            "bgm_mood": "happy",
            "speaker": "nina",
            "text": f"Tico e a Vila das Cores! Episódio {next_ep_num}: {raw.get('episode_title', 'Uma Nova Aventura!')}",
            "post_pause_sec": 0.65,
            "camera": "wide",
            "chars": [],
            "props": {
                "episode": f"EPISÓDIO {next_ep_num}",
                "title": raw.get("episode_title", "Uma Nova Aventura!"),
            },
            "sfx": [{"name": "ding", "offset_sec": 0.1, "gain": 0.6}],
        },
    ]
    outro_beat = {
        "id": "outro_card",
        "type": "outro_card",
        "scene": "outro_stage",
        "bgm_mood": "intro",
        "speaker": None,
        "duration_sec": 5.5,
        "camera": "wide",
        "chars": [
            {"id": "tico", "x": 360, "y": 575, "facing": "right", "emotion": "happy", "action": "wave"},
            {"id": "lili", "x": 560, "y": 575, "facing": "right", "emotion": "happy", "action": "wave"},
            {"id": "dino", "x": 760, "y": 575, "facing": "left", "emotion": "happy", "action": "wave"},
            {"id": "nina", "x": 960, "y": 435, "facing": "left", "emotion": "happy", "action": "fly_idle"},
        ],
        "props": {"rainbow_level": 6, "show_outro": True},
        "sfx": [{"name": "sparkle", "offset_sec": 0.4, "gain": 0.6}],
    }

    hook = clean_beats[:2]
    body = clean_beats[2:]
    raw["beats"] = hook + intro_beats + body + [outro_beat]
    return raw
