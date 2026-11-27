# -*- coding: utf-8 -*-
"""
Diretor de Arte Vetorial IA (Script-to-Scene) — Tico & A Vila das Cores
Lê o roteiro exato de cada Ato e cria um cenário 2D SVG exclusivo no estilo oficial da série
(estilo Bluey / Mundo Bita, contornos #3D261C, gradientes suaves, objetos exatos da história!)
+ valida/higieniza o SVG para renderização 100% segura em 1080p no Remotion.
"""
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

from voice_studio import get_available_kids_gemini_keys

ART_MODELS = ["gemini-3-flash-preview", "gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"]
ALLOWED_FX = {"none", "sparkles", "musical_notes", "rain_rainbow", "snow", "bubbles", "petals", "fireflies", "stars", "hearts"}

FORBIDDEN_TAGS = {"script", "foreignobject", "iframe", "object", "embed", "image", "style", "a"}


def _call_gemini_art_json(prompt: str, api_keys: list[str]) -> dict:
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.72,
            "responseMimeType": "application/json",
        },
    }
    body = json.dumps(payload).encode("utf-8")
    last_err = None
    for ki, api_key in enumerate(api_keys):
        for model in ART_MODELS:
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
                print(f"[SCENE ARTIST] K{ki+1}/{model} falhou ({err}) -> próximo", flush=True)
    raise RuntimeError(f"Scene Artist falhou em todos os modelos: {last_err}")


def sanitize_and_namespace_svg(raw_svg: str, prefix: str) -> str | None:
    """
    Higieniza e valida o SVG gerado pela IA:
    - Garante XML válido com ElementTree
    - Remove qualquer tag insegura ou texto indesejado
    - Prefixa todos os IDs (gradientes/clips) para nunca colidir entre cenas!
    - Retorna o miolo interno (inner SVG) pronto para montar dentro de <g> no Remotion 1280x720.
    """
    if not raw_svg or "<" not in raw_svg:
        return None
    s = raw_svg.strip()
    # Remove markdown fences se vierem
    s = re.sub(r"^```(?:svg|xml)?\s*", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\s*```$", "", s)
    # Garante wrapper <svg> para parsear com ElementTree
    if not s.lower().startswith("<svg"):
        s = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">{s}</svg>'
    # Remove declarações XML se existirem
    s = re.sub(r"<\?xml[^>]*\?>", "", s).strip()

    try:
        root = ET.fromstring(s)
    except ET.ParseError as err:
        print(f"[SCENE ARTIST] SVG inválido ({err}) -> usando fallback seguro", flush=True)
        return None

    # Limpa namespaces {http://www.w3.org/2000/svg} das tags
    def strip_ns(tag: str) -> str:
        return tag.split("}", 1)[-1] if "}" in tag else tag

    # Coleta todos os IDs para re-prefixar
    id_map: dict[str, str] = {}
    for elem in root.iter():
        elem.tag = strip_ns(elem.tag)
        if "id" in elem.attrib:
            old_id = elem.attrib["id"]
            new_id = f"{prefix}_{old_id}"
            id_map[old_id] = new_id
            elem.attrib["id"] = new_id

    # Remove elementos proibidos ou <text> (evita texto rabiscado pela IA no fundo!)
    def clean_children(parent):
        to_remove = []
        for child in list(parent):
            tag_low = child.tag.lower()
            if tag_low in FORBIDDEN_TAGS or tag_low == "text":
                to_remove.append(child)
                continue
            # Remove event handlers (onclick etc.) e atualiza referências url(#id)
            for k in list(child.attrib.keys()):
                if k.lower().startswith("on"):
                    del child.attrib[k]
                    continue
                val = child.attrib[k]
                if "url(#" in val:
                    for old_id, new_id in id_map.items():
                        val = val.replace(f"url(#{old_id})", f"url(#{new_id})")
                    child.attrib[k] = val
                elif k.endswith("href") and val.startswith("#") and val[1:] in id_map:
                    child.attrib[k] = f"#{id_map[val[1:]]}"
            clean_children(child)
        for child in to_remove:
            parent.remove(child)

    clean_children(root)

    # Verifica que gerou uma cena rica de verdade (pelo menos 10 elementos gráficos)
    shape_count = sum(
        1 for el in root.iter()
        if el.tag.lower() in {"rect", "circle", "ellipse", "path", "polygon", "line", "polyline"}
    )
    if shape_count < 10:
        print(f"[SCENE ARTIST] SVG muito simples ({shape_count} formas) -> rejeitado", flush=True)
        return None

    inner_parts = [ET.tostring(child, encoding="unicode") for child in list(root)]
    return "".join(inner_parts)


def generate_custom_scene_for_act(
    episode_title: str,
    act_num: int,
    location_name: str,
    act_goal: str,
    key_objects: list[str],
    sample_dialogues: list[str],
    api_keys: list[str] | None = None,
) -> dict:
    """
    Gera um cenário vetorial 2D 1280x720 SOB MEDIDA para este Ato do roteiro!
    Retorna: {
      "location_name": str,
      "svg_inner": str | None,
      "fx": str (partículas animadas a 24fps),
      "sky_mood": "day" | "sunset" | "night" | "space",
      "accent_color": "#HEX",
      "thumb_bg_top": "#HEX",
      "thumb_bg_bottom": "#HEX"
    }
    """
    api_keys = api_keys or get_available_kids_gemini_keys()
    if not api_keys:
        return {"location_name": location_name, "svg_inner": None, "fx": "sparkles", "sky_mood": "day", "accent_color": "#FF4757"}

    objs_str = ", ".join(key_objects) if key_objects else "elementos alegres da história"
    dial_preview = "\n".join(f"- {d}" for d in sample_dialogues[:5])

    prompt = f"""Você é o Diretor de Arte 2D chefe da série infantil animada "Tico & A Vila das Cores" (estilo Bluey + Mundo Bita + Peppa Pig, para crianças de 2 a 5 anos).

TAREFA: Crie um cenário de fundo vetorial SVG LINDO, RICO, COLORIDO e 100% FIEL ao que está acontecendo neste Ato do episódio!

CONTEXTO DO ATO {act_num} ("{episode_title}"):
- Local da cena: {location_name}
- O que acontece aqui: {act_goal}
- Objetos principais citados na história que DEVEM aparecer bem visíveis e fofos: {objs_str}
- Trechos reais das falas dos personagens nesta cena:
{dial_preview}

REGRAS VISUAIS OBRIGATÓRIAS (PARA CASAR PERFEITAMENTE COM OS PERSONAGENS):
1. Canvas exato: `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">...</svg>`
2. ESTILO OFICIAL DA SÉRIE:
   - Objetos, árvores, casas e móveis usam contornos marrons quentes `stroke="#3D261C"` com `stroke-width="3"` a `"4"` e cantos arredondados (`stroke-linejoin="round"`, `stroke-linecap="round"`).
   - Nuvens, colinas distantes e brilhos de luz NÃO devem ter contorno (`stroke="none"`) para ficarem fofos e suaves sem linhas cruzadas internas!
   - Use `<defs>` com `<linearGradient>` / `<radialGradient>` suaves e luminosos (cores vibrantes pastel-alegres de livro infantil!) + pelo menos 2 planos de colinas/fundo + detalhes ricos (flores, arbustos, árvores, janelas, brilhos).
   - Desenhe em camadas de profundidade: (1) Céu/parede em gradiente cobrindo 0..1280 x 0..720; (2) Fundo distante (colinas, nuvens fofas, janelas, planetas, árvores, sol/lua); (3) Plano médio; (4) Chão/gramado/piso/areia na faixa `y=485..720`.
3. ZONA LIVRE PARA OS PERSONAGENS (CRÍTICO!):
   - Os nossos personagens articulados (Tico, Lili e Dino Bip) vão ficar de pé na faixa `x=160..800, y=555..580` (e a coruja Dona Nina voa em `x=960, y=380`).
   - Portanto, mantenha o chão em `x=140..820, y=490..720` limpo e aberto, e coloque os **OBJETOS PRINCIPAIS DA HISTÓRIA** (ex.: mesa de frutas, instrumentos musicais, castelo de areia, foguete, quadro escolar, árvore com o boné, fogueira/tenda, etc.) em destaque bonito na **METADE DIREITA (`x=820..1240, y=220..660`)**, no céu (`y=40..280`) ou no cenário de fundo (`y=260..480`)!
4. PROIBIDO:
   - NUNCA desenhe pessoas, ursos, coelhos, dinossauros ou corujas no SVG (nossos personagens animados entram por cima!).
   - NUNCA coloque tags `<text>` ou letras dentro do SVG.
   - Use entre 25 e 75 formas vetoriais bem desenhadas e caprichadas (nada minimalista demais, nem gigante demais).

Retorne JSON estrito:
{{
  "sky_mood": "day | sunset | night | space",
  "fx": "none | sparkles | musical_notes | rain_rainbow | snow | bubbles | petals | fireflies | stars | hearts",
  "accent_color": "#HEX vibrante que combine com este cenário",
  "thumb_bg_top": "#HEX cor do topo para a thumbnail",
  "thumb_bg_bottom": "#HEX cor de baixo para a thumbnail",
  "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1280 720\\">...</svg>"
}}
"""
    try:
        res = _call_gemini_art_json(prompt, api_keys)
        svg_inner = sanitize_and_namespace_svg(res.get("svg", ""), prefix=f"sc_a{act_num}")
        fx = res.get("fx", "sparkles")
        if fx not in ALLOWED_FX:
            fx = "sparkles"
        sky_mood = res.get("sky_mood", "day")
        if sky_mood not in {"day", "sunset", "night", "space"}:
            sky_mood = "day"
        return {
            "location_name": location_name,
            "svg_inner": svg_inner,
            "fx": fx,
            "sky_mood": sky_mood,
            "accent_color": res.get("accent_color", "#FF4757"),
            "thumb_bg_top": res.get("thumb_bg_top", "#38B6FF"),
            "thumb_bg_bottom": res.get("thumb_bg_bottom", "#FFF3B0"),
        }
    except Exception as err:
        print(f"[SCENE ARTIST] Erro ao gerar cenário '{location_name}': {err}", flush=True)
        return {
            "location_name": location_name,
            "svg_inner": None,
            "fx": "sparkles",
            "sky_mood": "day",
            "accent_color": "#FF4757",
            "thumb_bg_top": "#38B6FF",
            "thumb_bg_bottom": "#FFF3B0",
        }
