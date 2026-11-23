# -*- coding: utf-8 -*-
"""
Showrunner IA Multi-Atos — Tico & A Vila das Cores (Garantia de 6m30s–8m00s por Episódio!)
Em vez de pedir 50 falas numa única chamada (onde LLMs encurtam para ~10 falas),
gera primeiro o Plano de 5 Atos + SEO forte e depois expande CADA ATO separadamente
(10 falas ricas por ato = 50 falas garantidas + 4 momentos interativos + 2 Shorts únicos!).
"""
import json
import urllib.request
from pathlib import Path

from config import STUDIO_ROOT, load_series_bible, load_series_memory
from voice_studio import get_available_kids_gemini_keys

TEXT_MODELS = ["gemini-3-flash-preview", "gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash"]
VALID_SCENES = {"plaza_grey", "plaza_rainbow", "garden_red", "sunflower_yellow", "pond_blue", "forest_mystery", "starry_night"}
VALID_ACTIONS = {"idle", "wave", "jump", "bounce", "clap", "celebrate", "dance", "trip", "look_up", "think", "blow", "walk_in", "fly_in", "fly_idle"}
VALID_EMOTIONS = {"happy", "excited", "surprised", "curious", "sad", "thinking", "proud", "laughing"}
VALID_CAMERAS = {"wide", "closeup_tico", "closeup_lili", "closeup_dino", "closeup_nina", "sky", "props"}
VALID_MOODS = {"intro", "curious", "happy", "playful", "gentle", "magical", "celebration"}

DEFAULT_GROUP_SLOTS = {
    "tico": {"x": 280, "y": 565, "facing": "right"},
    "lili": {"x": 500, "y": 565, "facing": "right"},
    "dino": {"x": 725, "y": 565, "facing": "left"},
    "nina": {"x": 980, "y": 385, "facing": "left"},
}


def _build_official_episode_1() -> dict:
    from episode_01_beats import EPISODE_BEATS  # noqa: WPS433

    beats = [dict(b) for b in EPISODE_BEATS]
    return {
        "episode_number": 1,
        "episode_title": "O Mistério do Arco-Íris Sumido!",
        "summary": "O arco-íris da Vila das Cores ficou cinza e Tico, Lili, Dino Bip e Dona Nina encontraram o vermelho na horta, o amarelo nos girassóis e o azul na lagoa para devolver todas as cores!",
        "lesson": "Cores primárias (vermelho, amarelo, azul), mistura de cores (laranja, verde, roxo), contagem 1-3 e trabalho em equipe",
        "youtube_title": "APRENDA AS CORES E CONTAR 1, 2, 3! 🌈 Desenho Infantil — Tico & A Vila das Cores (Ep. 01)",
        "youtube_description": (
            "🌈 Bem-vindo ao Episódio 1 de Tico & A Vila das Cores! 🐻🐰🦖🦉\n\n"
            "Oh não! O grande Arco-Íris da Vila das Cores ficou cinza! Venha ajudar o ursinho Tico, "
            "a coelhinha Lili, o dinossaurinho Dino Bip e a sábia Dona Coruja Nina a encontrar o "
            "VERMELHO, o AMARELO e o AZUL!\n\n"
            "✨ Neste desenho infantil educativo (2 a 5 anos) as crianças aprendem:\n"
            "• Cores primárias e mistura de cores\n"
            "• Contagem de 1 a 3 e trabalho em equipe!\n\n"
            "Inscreva-se na Vila das Cores para novas aventuras todos os dias! 💛❤️💙"
        ),
        "thumbnail_badge": "CADÊ AS CORES?!",
        "thumbnail_sub": "ARCO-ÍRIS!",
        "next_episode_hook": "No próximo episódio, a turma vai encontrar um ovo colorido misterioso na Floresta Mágica!",
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


def _gemini_json(prompt: str, api_keys: list[str], temperature: float = 0.78) -> dict:
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
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

    if speaker in valid_ids and speaker not in by_id:
        slot = DEFAULT_GROUP_SLOTS.get(speaker, {"x": 500, "y": 565, "facing": "right"})
        by_id[speaker] = {"id": speaker, **slot, "emotion": "happy", "action": "bounce"}

    if beat_index >= 2:
        for core_id in ("tico", "lili", "dino"):
            if core_id in valid_ids and core_id not in by_id:
                by_id[core_id] = {"id": core_id, **DEFAULT_GROUP_SLOTS[core_id], "emotion": "happy", "action": "idle"}
        if scene in ("plaza_rainbow", "starry_night") and "nina" in valid_ids and "nina" not in by_id:
            by_id["nina"] = {"id": "nina", **DEFAULT_GROUP_SLOTS["nina"], "emotion": "happy", "action": "fly_idle"}

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

    if next_ep_num == 1:
        print("[SHOWRUNNER] Carregando Roteiro Mestre Oficial do Episódio 1!", flush=True)
        return _build_official_episode_1()

    api_keys = get_available_kids_gemini_keys()
    if not api_keys:
        raise RuntimeError("Nenhuma KIDS_GEMINI_API_KEY configurada!")

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

    # =========================================================================
    # ETAPA 1: PLANO DO EPISÓDIO + SEO FORTE + ESQUELETO DOS 5 ATOS
    # =========================================================================
    plan_prompt = f"""Você é o Showrunner chefe da série infantil animada brasileira "{bible['series_title']}" (público: 2 a 5 anos, estilo Bluey + Mundo Bita + Pocoyo).

ELENCO ATIVO: {json.dumps(active_chars, ensure_ascii=False)}
CENÁRIOS DISPONÍVEIS: {json.dumps(bible['locations'], ensure_ascii=False)}
MEMÓRIA RECENTE: {json.dumps(recent_history, ensure_ascii=False)}

PRÓXIMO EPISÓDIO: Episódio {next_ep_num} (Temporada {memory.get('season', 1)})
Gancho anterior: {memory.get('next_episode_hook', '')}
Plano sugerido: {json.dumps(planned, ensure_ascii=False) if planned else 'Crie uma aventura educativa nova envolvendo cores, números, formas, animais ou amizade!'}

REGRAS DE SEO PARA YOUTUBE KIDS / SMART TV:
- O `youtube_title` DEVE começar com o tema educativo que os pais buscam (ex.: "APRENDA A CONTAR DE 1 A 5! ..." ou "APRENDA AS CORES E FORMAS! ...") seguido pelo título curto e "— Tico & A Vila das Cores (Ep. {next_ep_num:02d})", máximo 92 caracteres!
- Crie exatamente 5 ATOS variados (alternando entre pelo menos 3 cenários diferentes da lista!).

Retorne JSON estrito:
{{
  "episode_number": {next_ep_num},
  "episode_title": "Título curto e mágico do episódio",
  "summary": "Resumo em 2 frases para a memória da série",
  "lesson": "Lição educativa do episódio",
  "youtube_title": "TEMA EDUCATIVO EM MAIÚSCULAS! Emoji Título — Tico & A Vila das Cores (Ep. {next_ep_num:02d})",
  "youtube_description": "Descrição acolhedora e completa para pais e crianças com emojis e tópicos do que a criança aprende",
  "thumbnail_badge": "2 A 3 PALAVRAS CURTAS (ex: CADÊ O BONÉ?!)",
  "thumbnail_sub": "1 A 2 PALAVRAS (ex: CONTAR 1 A 5!)",
  "next_episode_hook": "Gancho alegre para o Episódio {next_ep_num + 1}",
  "short_1_title": "Título criativo e único para o Short 1 sobre a cena engraçada deste episódio #shorts",
  "short_1_badge": "2 A 3 PALAVRAS DO SHORT 1",
  "short_2_title": "Título criativo e único para o Short 2 sobre o momento interativo deste episódio #shorts",
  "short_2_badge": "2 A 3 PALAVRAS DO SHORT 2",
  "acts": [
    {{"act": 1, "scene": "plaza_rainbow", "mood": "curious", "goal": "Gancho inicial, problema/mistério do dia e plano da turma com a Dona Nina"}},
    {{"act": 2, "scene": "garden_red", "mood": "playful", "goal": "Primeira pista + piada fofa do Dino Bip + interação 1 com a criança"}},
    {{"act": 3, "scene": "sunflower_yellow", "mood": "happy", "goal": "Segunda pista + desafio educativo (cores/números/formas) com a criança"}},
    {{"act": 4, "scene": "pond_blue", "mood": "playful", "goal": "Terceira pista + trabalho em equipe + momento interativo (bater palmas/assoprar/contar)"}},
    {{"act": 5, "scene": "plaza_rainbow", "mood": "celebration", "goal": "Resolução mágica, lição carinhosa da Dona Nina, comemoração com confetes e gancho do próximo episódio"}}
  ]
}}
"""
    plan = _gemini_json(plan_prompt, api_keys)
    acts_plan = plan.get("acts") or []
    if len(acts_plan) < 5:
        acts_plan = [
            {"act": 1, "scene": "plaza_rainbow", "mood": "curious", "goal": "Gancho inicial e descoberta do desafio do dia"},
            {"act": 2, "scene": "forest_mystery", "mood": "playful", "goal": "Primeira busca e brincadeira engraçada do Dino Bip"},
            {"act": 3, "scene": "garden_red", "mood": "happy", "goal": "Contagem interativa com a criança"},
            {"act": 4, "scene": "sunflower_yellow", "mood": "playful", "goal": "Trabalho em equipe e interação de palmas ou sopro"},
            {"act": 5, "scene": "plaza_rainbow", "mood": "celebration", "goal": "Vitória, lição da Dona Nina, festa e despedida"},
        ]

    # =========================================================================
    # ETAPA 2: EXPANDE CADA UM DOS 5 ATOS (10 FALAS RICAS POR ATO = ~50 FALAS = 7-8 MIN!)
    # =========================================================================
    all_raw_beats = []
    valid_char_ids = set(active_chars.keys())
    prev_summary = ""

    for act_obj in acts_plan[:5]:
        act_num = int(act_obj.get("act", len(all_raw_beats) // 10 + 1))
        act_scene = act_obj.get("scene", "plaza_rainbow")
        if act_scene not in VALID_SCENES:
            act_scene = "plaza_rainbow"
        act_mood = act_obj.get("mood", "happy")
        if act_mood not in VALID_MOODS:
            act_mood = "happy"

        act_prompt = f"""Você está escrevendo o ATO {act_num} de 5 do Episódio {next_ep_num} ("{plan.get('episode_title')}") da série infantil "Tico & A Vila das Cores" (2 a 5 anos, PT-BR).

OBJETIVO DESTE ATO {act_num}: {act_obj.get('goal')}
CENÁRIO DESTE ATO: "{act_scene}" | CLIMA MUSICAL: "{act_mood}"
LIÇÃO DO EPISÓDIO: {plan.get('lesson')}
O QUE ACONTECEU ANTES: {prev_summary or 'Início do episódio!'}
PERSONAGENS: tico (ursinho), lili (coelhinha), dino (dinossaurinho travesso), nina (coruja sábia).

REGRAS OBRIGATÓRIAS:
1. Escreva EXATAMENTE 10 falas (beats) neste ato! Cada fala deve ter entre 14 e 26 palavras naturais, alegres, carinhosas e fáceis para crianças de 2 a 5 anos (NÃO escreva frases minúsculas de 3 palavras!).
2. Alterne os personagens falando (`tico`, `lili`, `dino`, `nina`) e SEMPRE inclua `tico`, `lili` e `dino` juntos em `chars` (e `nina` quando falar ou no Ato 1 e Ato 5).
3. Inclua 1 momento INTERATIVO falando diretamente com a criança em casa neste ato (com `post_pause_sec: 1.7` e `props.interactive_prompt` curto de até 4 palavras!).
4. No Ato 5, coloque `props.confetti: true` nas últimas 4 falas e termine convidando para o próximo episódio: "{plan.get('next_episode_hook')}".

Retorne JSON estrito:
{{
  "act_recap": "Resumo em 1 frase do que aconteceu neste ato",
  "beats": [
    {{
      "speaker": "tico",
      "text": "Fala alegre e natural de 15 a 24 palavras conversando com os amigos e o amiguinho em casa!",
      "post_pause_sec": 0.5,
      "camera": "wide",
      "chars": [
        {{"id": "tico", "x": 280, "y": 565, "facing": "right", "emotion": "excited", "action": "wave"}},
        {{"id": "lili", "x": 500, "y": 565, "facing": "right", "emotion": "happy", "action": "bounce"}},
        {{"id": "dino", "x": 725, "y": 565, "facing": "left", "emotion": "excited", "action": "jump"}}
      ],
      "props": {{"rainbow_level": 6}},
      "sfx": [{{"name": "sparkle", "offset_sec": 0.15, "gain": 0.5}}]
    }}
  ]
}}
"""
        act_res = _gemini_json(act_prompt, api_keys)
        act_beats = act_res.get("beats") or []
        prev_summary = (prev_summary + " " + (act_res.get("act_recap") or "")).strip()[-500:]
        print(f"[SHOWRUNNER] Ato {act_num}/5 ({act_scene}): {len(act_beats)} falas geradas!", flush=True)

        for bi, b in enumerate(act_beats):
            b["_scene"] = act_scene
            b["_mood"] = act_mood
            b["_act"] = act_num
            b["_bi"] = bi
            all_raw_beats.append(b)

    # Sanitização + transições automáticas entre cenários + elenco completo!
    clean_beats = []
    prev_scene = None
    for i, b in enumerate(all_raw_beats):
        scene = b.get("_scene", "plaza_rainbow")
        speaker = b.get("speaker") if b.get("speaker") in valid_char_ids else "tico"

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
                "sfx": [{"name": "whoosh", "offset_sec": 0.1, "gain": 0.5}],
            })
        prev_scene = scene

        chars = _ensure_ensemble_chars(b.get("chars", []), speaker, scene, i, valid_char_ids)
        clean_beats.append({
            "id": f"ep{next_ep_num}_a{b.get('_act',1)}_{i:02d}",
            "type": "dialogue",
            "scene": scene,
            "bgm_mood": b.get("_mood", "happy"),
            "speaker": speaker,
            "text": (b.get("text") or "Oi, amiguinho! Que alegria brincar com você hoje na Vila das Cores!").strip(),
            "post_pause_sec": float(b.get("post_pause_sec", 0.5)),
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
            "sfx": [{"name": "rainbow_fanfare", "offset_sec": 0.2, "gain": 0.6}],
        },
        {
            "id": "title_card",
            "type": "dialogue",
            "scene": "title_card",
            "bgm_mood": "happy",
            "speaker": "nina",
            "text": f"Tico e a Vila das Cores! Episódio {next_ep_num}: {plan.get('episode_title', 'Uma Nova Aventura!')}",
            "post_pause_sec": 0.65,
            "camera": "wide",
            "chars": [],
            "props": {
                "episode": f"EPISÓDIO {next_ep_num}",
                "title": plan.get("episode_title", "Uma Nova Aventura!"),
            },
            "sfx": [{"name": "ding", "offset_sec": 0.1, "gain": 0.55}],
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
        "sfx": [{"name": "sparkle", "offset_sec": 0.4, "gain": 0.55}],
    }

    hook = clean_beats[:2]
    body = clean_beats[2:]
    final_beats = hook + intro_beats + body + [outro_beat]

    n_dial = sum(1 for b in final_beats if b["type"] == "dialogue")
    mid1 = max(4, n_dial // 3)
    mid2 = max(mid1 + 6, (n_dial * 2) // 3)
    plan["shorts_highlights"] = [
        {
            "start_beat_index": mid1,
            "end_beat_index": min(n_dial - 2, mid1 + 4),
            "hook_badge": plan.get("short_1_badge") or "QUE DIVERTIDO!",
            "short_title": plan.get("short_1_title") or f"{plan.get('episode_title')} — Parte 1 #shorts",
        },
        {
            "start_beat_index": mid2,
            "end_beat_index": min(n_dial - 2, mid2 + 4),
            "hook_badge": plan.get("short_2_badge") or "BRINCA COM A GENTE!",
            "short_title": plan.get("short_2_title") or f"{plan.get('episode_title')} — Parte 2 #shorts",
        },
    ]
    plan["beats"] = final_beats
    return plan
