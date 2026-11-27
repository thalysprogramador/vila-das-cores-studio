# -*- coding: utf-8 -*-
"""
Showrunner IA Autônomo Multi-Atos + Diretor de Arte Script-to-Scene
- Expande automaticamente novos arcos de 5 episódios na memória da série conforme a história avança!
- Liberdade criativa total de cenários: cada Ato gera um cenário 2D SVG exclusivo a partir do roteiro
  via `scene_artist.py`, mantendo 100% a identidade visual da série (Bluey / Mundo Bita)!
- Garante 5 Atos × 10 falas (~7-8 minutos reais), elenco completo em grupo e Thumbnail única por episódio!
"""
import json
import urllib.request
from pathlib import Path

from config import STUDIO_ROOT, load_series_bible, load_series_memory, save_series_memory
from scene_artist import generate_custom_scene_for_act
from voice_studio import get_available_kids_gemini_keys

TEXT_MODELS = ["gemini-3-flash-preview", "gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"]
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
            "Inscreva-se na Vila das Cores para novas aventuras todos os dias! 💛❤️💙"
        ),
        "thumbnail_badge": "CADÊ AS CORES?!",
        "thumbnail_sub": "ARCO-ÍRIS!",
        "next_episode_hook": "No próximo episódio, a turma vai encontrar um ovo colorido misterioso na Floresta Mágica!",
        "custom_scenes": {},
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


def _ensure_season_arc(memory: dict, next_ep_num: int, bible: dict, api_keys: list[str]) -> dict:
    """
    Expansão autônoma da história!
    Quando a série termina o arco atual (ex.: Ep. 5 -> Ep. 6), planeja automaticamente
    o próximo bloco de 5 episódios com continuidade, novos lugares e novas lições!
    """
    arc = memory.get("season_arc") or []
    if any(int(a.get("ep", -1)) == next_ep_num for a in arc):
        return memory

    print(f"[SHOWRUNNER] Planejando autonomamente novo arco de 5 episódios (Ep. {next_ep_num} a {next_ep_num + 4})!", flush=True)
    history = memory.get("episodes_history", [])[-8:]
    arc_prompt = f"""Você é o Showrunner criativo da série infantil "{bible['series_title']}" (2 a 5 anos, PT-BR).
Elenco: Tico (ursinho), Lili (coelhinha artista), Dino Bip (dinossaurinho travesso), Dona Coruja Nina (coruja sábia).

HISTÓRICO JÁ EXIBIDO (NÃO repita temas nem cenários idênticos!):
{json.dumps(history, ensure_ascii=False)}

GANCHO DEIXADO NO ÚLTIMO EPISÓDIO:
{memory.get('next_episode_hook', 'Uma nova aventura mágica começa na Vila das Cores!')}

Crie o próximo arco contínuo de 5 episódios (Episódios {next_ep_num} até {next_ep_num + 4}), variando lugares mágicos (ex.: ponte musical/chuva de música, praia das conchas, padaria de biscoitos, trem arco-íris, fazendinha dos animais, montanha de neve, foguete das estrelas, escolinha das formas, casa na árvore) e lições educativas variadas (música/ritmo, números 1-10, animais e seus sons, formas, estações do ano, gentileza, higiene/rotina, cores avançadas).

Retorne JSON estrito:
{{
  "new_arc": [
    {{
      "ep": {next_ep_num},
      "title": "Título mágico curto",
      "lesson": "Lição educativa clara",
      "main_setting": "Lugar principal inédito deste episódio",
      "hook_next": "Gancho alegre ligando ao episódio {next_ep_num + 1}"
    }}
  ]
}}
"""
    try:
        res = _gemini_json(arc_prompt, api_keys)
        new_items = res.get("new_arc") or []
        if new_items:
            arc.extend(new_items)
            memory["season_arc"] = arc
            save_series_memory(memory)
    except Exception as err:
        print(f"[SHOWRUNNER] Aviso ao expandir arco: {err}", flush=True)
    return memory


def _ensure_ensemble_chars(beat_chars: list[dict], speaker: str, act_num: int, beat_index: int, valid_ids: set[str]) -> list[dict]:
    by_id = {}
    for ch in beat_chars:
        cid = ch.get("id")
        if cid in valid_ids:
            by_id[cid] = {
                "id": cid,
                "x": int(max(180, min(800 if cid != "nina" else 1040, ch.get("x", DEFAULT_GROUP_SLOTS.get(cid, {}).get("x", 500))))),
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
        if act_num in (1, 5) and "nina" in valid_ids and "nina" not in by_id:
            by_id["nina"] = {"id": "nina", **DEFAULT_GROUP_SLOTS["nina"], "emotion": "happy", "action": "fly_idle"}

    # Mantém a turma bem espaçada na zona livre à esquerda/centro (x: 240..740), deixando x: 820..1240 livre pros objetos da cena!
    ordered = list(by_id.values())
    ground_chars = [c for c in ordered if c["id"] != "nina"]
    presets = [255, 465, 675, 780]
    ground_chars.sort(key=lambda c: ("tico", "lili", "dino").index(c["id"]) if c["id"] in ("tico", "lili", "dino") else 9)
    for idx, c in enumerate(ground_chars):
        c["x"] = presets[idx % len(presets)]
        c["y"] = 565
        c["facing"] = "left" if idx == len(ground_chars) - 1 else "right"
    for c in ordered:
        if c["id"] == "nina":
            c["x"] = 965
            c["y"] = 375
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
    memory = _ensure_season_arc(memory, next_ep_num, bible, api_keys)

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
    planned = next((a for a in memory.get("season_arc", []) if int(a.get("ep", -1)) == next_ep_num), None)
    recent_history = memory.get("episodes_history", [])[-6:]

    # =========================================================================
    # ETAPA 1: PLANO LIVRE DOS 5 ATOS (CRIANDO LOCAIS E OBJETOS EXATOS DA HISTÓRIA!)
    # =========================================================================
    plan_prompt = f"""Você é o Showrunner chefe da série infantil animada brasileira "{bible['series_title']}" (2 a 5 anos, estilo Bluey + Mundo Bita + Pocoyo).

ELENCO ATIVO: {json.dumps(active_chars, ensure_ascii=False)}
MEMÓRIA RECENTE: {json.dumps(recent_history, ensure_ascii=False)}

PRÓXIMO EPISÓDIO: Episódio {next_ep_num} (Temporada {memory.get('season', 1)})
Gancho anterior: {memory.get('next_episode_hook', '')}
Plano sugerido: {json.dumps(planned, ensure_ascii=False) if planned else 'Crie uma aventura educativa nova super criativa!'}

LIBERDADE TOTAL DE CENÁRIOS:
- Você NÃO está preso a cenários fixos! Invente os locais exatos e mágicos que combinam 100% com a história (ex.: "Ponte do Xilofone Colorido", "Praia dos Castelos de Areia", "Padaria de Biscoitos do Dino", "Observatório das Estrelas", "Fazendinha dos Animais", "Jardim das Nuvens Musicais")!
- Para cada um dos 5 Atos, informe `location_name` e `key_objects` (os 3 a 5 objetos exatos que o Diretor de Arte vai desenhar naquela cena para bater 100% com o que os personagens falam!).
- O `youtube_title` DEVE começar com um termo educativo forte que pais buscam na Smart TV (ex.: "APRENDA MÚSICA E RITMO! 🎵 ..." ou "ANIMAIS E SEUS SONS! 🐮 ...") seguido pelo título curto e "— Tico & A Vila das Cores (Ep. {next_ep_num:02d})", máximo 92 caracteres!

Retorne JSON estrito:
{{
  "episode_number": {next_ep_num},
  "episode_title": "Título curto e mágico",
  "summary": "Resumo em 2 frases para a memória da série",
  "lesson": "Lição educativa clara",
  "youtube_title": "TEMA EDUCATIVO FORTE! Emoji Título — Tico & A Vila das Cores (Ep. {next_ep_num:02d})",
  "youtube_description": "Descrição completa e calorosa para pais e crianças com emojis e tópicos do que a criança aprende",
  "thumbnail_badge": "2 A 3 PALAVRAS FORTES (ex: CHUVA MUSICAL!)",
  "thumbnail_sub": "1 A 2 PALAVRAS (ex: VAMOS CANTAR!)",
  "hero_thumb_act": 3,
  "next_episode_hook": "Gancho alegre ligando ao Episódio {next_ep_num + 1}",
  "short_1_title": "Título criativo e único sobre a cena engraçada deste episódio #shorts",
  "short_1_badge": "2 A 3 PALAVRAS DO SHORT 1",
  "short_2_title": "Título criativo e único sobre o momento interativo deste episódio #shorts",
  "short_2_badge": "2 A 3 PALAVRAS DO SHORT 2",
  "acts": [
    {{"act": 1, "location_name": "Nome do Local 1", "mood": "curious", "key_objects": ["obj1", "obj2", "obj3"], "goal": "Gancho inicial, descoberta do mistério do dia e plano da turma"}},
    {{"act": 2, "location_name": "Nome do Local 2", "mood": "playful", "key_objects": ["obj1", "obj2", "obj3"], "goal": "Primeira pista + piada fofa do Dino Bip + interação 1 com a criança"}},
    {{"act": 3, "location_name": "Nome do Local 3", "mood": "happy", "key_objects": ["obj1", "obj2", "obj3"], "goal": "Clímax visual super colorido + desafio educativo com a criança"}},
    {{"act": 4, "location_name": "Nome do Local 4", "mood": "playful", "key_objects": ["obj1", "obj2", "obj3"], "goal": "Trabalho em equipe + interação de movimento (palmas/pulo/sopro/contagem)"}},
    {{"act": 5, "location_name": "Nome do Local 5", "mood": "celebration", "key_objects": ["obj1", "obj2", "obj3"], "goal": "Resolução mágica, lição da Dona Nina, comemoração com confetes e gancho do próximo ep"}}
  ]
}}
"""
    plan = _gemini_json(plan_prompt, api_keys)
    acts_plan = (plan.get("acts") or [])[:5]
    while len(acts_plan) < 5:
        n = len(acts_plan) + 1
        acts_plan.append({
            "act": n,
            "location_name": f"Pracinha Mágica da Vila das Cores (Ato {n})",
            "mood": "celebration" if n == 5 else "happy",
            "key_objects": ["arco-íris brilhante", "balões coloridos", "flores sorridentes"],
            "goal": "Aventura alegre em equipe com interação educativa",
        })

    # =========================================================================
    # ETAPA 2: EXPANDE CADA ATO (10 FALAS) + GERA CENÁRIO SVG SOB MEDIDA POR ATO!
    # =========================================================================
    all_raw_beats = []
    custom_scenes: dict[str, dict] = {}
    location_to_key: dict[str, str] = {}
    valid_char_ids = set(active_chars.keys())
    prev_summary = ""

    for idx_a, act_obj in enumerate(acts_plan, start=1):
        act_num = int(act_obj.get("act", idx_a))
        loc_name = (act_obj.get("location_name") or f"Cenário Mágico {act_num}").strip()
        key_objs = act_obj.get("key_objects") or []
        act_mood = act_obj.get("mood", "happy")
        if act_mood not in VALID_MOODS:
            act_mood = "happy"

        # Reutiliza a chave se dois atos se passam exatamente no mesmo local!
        loc_norm = loc_name.lower()
        if loc_norm in location_to_key:
            scene_key = location_to_key[loc_norm]
        else:
            scene_key = f"ep{next_ep_num}_act{act_num}"
            location_to_key[loc_norm] = scene_key

        act_prompt = f"""Você está escrevendo o ATO {act_num} de 5 do Episódio {next_ep_num} ("{plan.get('episode_title')}") da série infantil "Tico & A Vila das Cores" (2 a 5 anos, PT-BR).

LOCAL EXATO DESTE ATO: {loc_name}
OBJETOS VISÍVEIS NO CENÁRIO DESTE ATO: {json.dumps(key_objs, ensure_ascii=False)}
OBJETIVO DO ATO {act_num}: {act_obj.get('goal')}
LIÇÃO DO EPISÓDIO: {plan.get('lesson')}
O QUE ACONTECEU ANTES: {prev_summary or 'Início do episódio!'}
PERSONAGENS: tico (ursinho), lili (coelhinha), dino (dinossaurinho travesso), nina (coruja sábia).

REGRAS OBRIGATÓRIAS:
1. Escreva EXATAMENTE 10 falas (beats) neste ato! Cada fala com 14 a 25 palavras naturais e alegres para crianças de 2 a 5 anos.
2. Fale DIRETAMENTE sobre os objetos que estão visíveis neste cenário ({', '.join(key_objs)}) para que a imagem e a fala combinem 100%!
3. Alterne os personagens falando (`tico`, `lili`, `dino`, `nina`) e SEMPRE inclua `tico`, `lili` e `dino` juntos em `chars`.
4. Inclua 1 momento INTERATIVO falando com a criança em casa neste ato (com `post_pause_sec: 1.7` e `props.interactive_prompt` curto de até 4 palavras!).
5. No Ato 5, coloque `props.confetti: true` nas últimas 4 falas e termine chamando para o próximo episódio: "{plan.get('next_episode_hook')}".

Retorne JSON estrito:
{{
  "act_recap": "Resumo em 1 frase do que aconteceu neste ato",
  "beats": [
    {{
      "speaker": "tico",
      "text": "Fala alegre e natural de 15 a 24 palavras comentando o cenário e interagindo com a criança!",
      "post_pause_sec": 0.5,
      "camera": "wide",
      "chars": [
        {{"id": "tico", "x": 255, "y": 565, "facing": "right", "emotion": "excited", "action": "wave"}},
        {{"id": "lili", "x": 465, "y": 565, "facing": "right", "emotion": "happy", "action": "bounce"}},
        {{"id": "dino", "x": 675, "y": 565, "facing": "left", "emotion": "excited", "action": "jump"}}
      ],
      "props": {{}},
      "sfx": [{{"name": "sparkle", "offset_sec": 0.15, "gain": 0.5}}]
    }}
  ]
}}
"""
        act_res = _gemini_json(act_prompt, api_keys)
        act_beats = act_res.get("beats") or []
        prev_summary = (prev_summary + " " + (act_res.get("act_recap") or "")).strip()[-500:]
        print(f"[SHOWRUNNER] Ato {act_num}/5 ({loc_name}): {len(act_beats)} falas geradas!", flush=True)

        # Gera cenário 2D SVG EXCLUSIVO para este Ato a partir das falas reais!
        if scene_key not in custom_scenes:
            sample_dials = [b.get("text", "") for b in act_beats[:6]]
            print(f"[SCENE ARTIST] Desenhando cenário exclusivo '{loc_name}' ({scene_key})...", flush=True)
            scene_asset = generate_custom_scene_for_act(
                episode_title=plan.get("episode_title", ""),
                act_num=act_num,
                location_name=loc_name,
                act_goal=act_obj.get("goal", ""),
                key_objects=key_objs,
                sample_dialogues=sample_dials,
                api_keys=api_keys,
            )
            custom_scenes[scene_key] = scene_asset
            ok_tag = "SVG EXCLUSIVO OK!" if scene_asset.get("svg_inner") else "fallback clássico"
            print(f"[SCENE ARTIST] {scene_key} -> {ok_tag} (fx={scene_asset.get('fx')}, mood={scene_asset.get('sky_mood')})", flush=True)

        for bi, b in enumerate(act_beats):
            b["_scene"] = scene_key
            b["_mood"] = act_mood
            b["_act"] = act_num
            all_raw_beats.append(b)

    # Monta beats finais com transições suaves entre cenários
    clean_beats = []
    prev_scene = None
    for i, b in enumerate(all_raw_beats):
        scene = b.get("_scene", "plaza_rainbow")
        speaker = b.get("speaker") if b.get("speaker") in valid_char_ids else "tico"

        if prev_scene is not None and scene != prev_scene and i >= 2:
            sc_meta = custom_scenes.get(scene, {})
            t_col = sc_meta.get("accent_color") or "#FFD43B"
            t_kind = "bubble" if sc_meta.get("fx") == "bubbles" else ("rainbow" if b.get("_act") == 5 else "cloud")
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

        chars = _ensure_ensemble_chars(b.get("chars", []), speaker, int(b.get("_act", 1)), i, valid_char_ids)
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

    # Escolhe o cenário customizado mais bonito para ser o fundo EXCLUSIVO da Thumbnail deste episódio!
    hero_act = int(plan.get("hero_thumb_act", 3))
    preferred_key = f"ep{next_ep_num}_act{hero_act}"
    thumb_key = preferred_key if (preferred_key in custom_scenes and custom_scenes[preferred_key].get("svg_inner")) else next(
        (k for k, v in custom_scenes.items() if v.get("svg_inner")), None
    )

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
    plan["custom_scenes"] = custom_scenes
    plan["thumbnail_scene_key"] = thumb_key
    plan["thumbnail_accent"] = (custom_scenes.get(thumb_key or "", {}) or {}).get("accent_color", "#FF4757")
    plan["beats"] = final_beats
    return plan
