# -*- coding: utf-8 -*-
"""
Uploader YouTube Data API v3 100% ISOLADO para o Canal Infantil (COPPA Compliant).
Suporta rotação automática de cota entre Projeto GCP Kids #1 e #2 (até 20.000 unidades/dia!).
Usa exclusivamente KIDS_YOUTUBE_TOKEN_B64 (e opcionalmente KIDS_YOUTUBE_TOKEN_2_B64).
"""
import base64
import json
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from config import get_kids_secret


def _available_token_slots() -> list[tuple[str, str]]:
    slots = []
    if get_kids_secret("KIDS_YOUTUBE_TOKEN_B64", "kids_youtube_token_b64.txt"):
        slots.append(("KIDS_YOUTUBE_TOKEN_B64", "kids_youtube_token_b64.txt"))
    if get_kids_secret("KIDS_YOUTUBE_TOKEN_2_B64", "kids_youtube_token_2_b64.txt"):
        slots.append(("KIDS_YOUTUBE_TOKEN_2_B64", "kids_youtube_token_2_b64.txt"))
    if not slots:
        raise RuntimeError(
            "KIDS_YOUTUBE_TOKEN_B64 não encontrado. Rode primeiro: "
            "python pipeline/setup_kids_youtube_auth.py"
        )
    return slots


def _get_access_token(env_name: str, fallback_file: str) -> str:
    b64_data = get_kids_secret(env_name, fallback_file)
    info = json.loads(base64.b64decode(b64_data).decode("utf-8"))
    payload = urllib.parse.urlencode({
        "client_id": info["client_id"],
        "client_secret": info["client_secret"],
        "refresh_token": info["refresh_token"],
        "grant_type": "refresh_token",
    }).encode("utf-8")
    req = urllib.request.Request(
        info.get("token_uri", "https://oauth2.googleapis.com/token"),
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))["access_token"]


def _resumable_upload(video_path: Path, metadata: dict) -> tuple[str, str]:
    video_bytes = video_path.read_bytes()
    slots = _available_token_slots()
    last_err = None

    for idx, (env_name, ffile) in enumerate(slots, start=1):
        try:
            access_token = _get_access_token(env_name, ffile)
            init_req = urllib.request.Request(
                "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
                data=json.dumps(metadata).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json; charset=UTF-8",
                    "X-Upload-Content-Length": str(len(video_bytes)),
                    "X-Upload-Content-Type": "video/mp4",
                },
                method="POST",
            )
            with urllib.request.urlopen(init_req, timeout=60) as resp:
                upload_url = resp.headers["Location"]

            put_req = urllib.request.Request(
                upload_url,
                data=video_bytes,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Length": str(len(video_bytes)),
                    "Content-Type": "video/mp4",
                },
                method="PUT",
            )
            with urllib.request.urlopen(put_req, timeout=600) as resp:
                video_id = json.loads(resp.read().decode("utf-8"))["id"]
            print(f"[KIDS UPLOADER] Publicado via Projeto Kids #{idx}: https://youtu.be/{video_id}", flush=True)
            return video_id, access_token
        except urllib.error.HTTPError as err:
            body = err.read().decode("utf-8", errors="replace")[:300]
            last_err = f"HTTP {err.code}: {body}"
            if err.code == 403 and "quotaExceeded" in body:
                print(f"[KIDS UPLOADER] Projeto Kids #{idx} sem cota -> tentando próximo...", flush=True)
                continue
            raise
    raise RuntimeError(f"Todos os projetos YouTube Kids falharam: {last_err}")


def upload_kids_episode(
    video_path: Path,
    title: str,
    description: str,
    tags: list[str],
    thumbnail_path: Path | None = None,
    privacy_status: str = "public",
) -> str:
    metadata = {
        "snippet": {
            "title": title[:100],
            "description": description[:4900],
            "tags": tags[:20],
            "categoryId": "1",
            "defaultLanguage": "pt-BR",
            "defaultAudioLanguage": "pt-BR",
        },
        "status": {
            "privacyStatus": privacy_status,
            "selfDeclaredMadeForKids": True,
            "embeddable": True,
        },
    }
    video_id, access_token = _resumable_upload(video_path, metadata)

    if thumbnail_path and thumbnail_path.exists():
        mime = "image/png" if thumbnail_path.suffix.lower() == ".png" else "image/jpeg"
        th_req = urllib.request.Request(
            f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={video_id}&uploadType=media",
            data=thumbnail_path.read_bytes(),
            headers={"Authorization": f"Bearer {access_token}", "Content-Type": mime},
            method="POST",
        )
        try:
            with urllib.request.urlopen(th_req, timeout=60):
                print("[KIDS UPLOADER] Thumbnail enviada com sucesso!", flush=True)
        except Exception as err:
            print(f"[KIDS UPLOADER] Aviso thumbnail: {err}", flush=True)

    playlist_id = get_kids_secret("KIDS_SEASON1_PLAYLIST_ID")
    if playlist_id:
        pl_req = urllib.request.Request(
            "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
            data=json.dumps({
                "snippet": {
                    "playlistId": playlist_id,
                    "resourceId": {"kind": "youtube#video", "videoId": video_id},
                }
            }).encode("utf-8"),
            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(pl_req, timeout=30):
                print(f"[KIDS UPLOADER] Adicionado à Playlist {playlist_id}!", flush=True)
        except Exception as err:
            print(f"[KIDS UPLOADER] Aviso playlist: {err}", flush=True)

    return video_id


def upload_kids_short(
    video_path: Path,
    title: str,
    episode_number: int,
    episode_video_id: str | None = None,
    privacy_status: str = "public",
    publish_at_iso: str | None = None,
) -> str:
    """Publica (ou agenda via publishAt!) um Short vertical (1080x1920) dos melhores momentos do episódio!"""
    clean_title = title.strip()
    if "#shorts" not in clean_title.lower():
        clean_title = f"{clean_title[:88]} #shorts"
    ep_link = f"\nAssista o Episódio {episode_number} completo no canal: https://youtu.be/{episode_video_id}" if episode_video_id else ""
    desc = (
        f"🌈 Melhor momento do Episódio {episode_number} de Tico & A Vila das Cores! 🐻🐰🦖🦉"
        f"{ep_link}\n\n#shorts #desenhoinfantil #ticoeaviladascores #cores #criancas"
    )
    status_obj = {
        "privacyStatus": "private" if publish_at_iso else privacy_status,
        "selfDeclaredMadeForKids": True,
        "embeddable": True,
    }
    if publish_at_iso:
        status_obj["publishAt"] = publish_at_iso

    metadata = {
        "snippet": {
            "title": clean_title[:100],
            "description": desc,
            "tags": ["shorts", "desenho infantil", "tico e a vila das cores", "desenho animado", "criancas"],
            "categoryId": "1",
            "defaultLanguage": "pt-BR",
            "defaultAudioLanguage": "pt-BR",
        },
        "status": status_obj,
    }
    video_id, _ = _resumable_upload(video_path, metadata)
    return video_id
