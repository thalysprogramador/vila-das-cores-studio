# -*- coding: utf-8 -*-
"""
Configuração 100% isolada do projeto Tico & A Vila das Cores.
REGRA DE ISOLAMENTO: nunca lê variáveis ou pastas do ReactFactory.
"""
import json
import os
from pathlib import Path

from dotenv import load_dotenv

STUDIO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = STUDIO_ROOT / "data"
SECRETS_DIR = STUDIO_ROOT / "_kids_secrets"
BRANDING_DIR = STUDIO_ROOT / "branding"
REMOTION_DIR = STUDIO_ROOT / "studio"
OUTPUT_DIR = STUDIO_ROOT / "output"
TMP_DIR = STUDIO_ROOT / "_tmp_work"

# Carrega .env local (se existir) sem sobrescrever variáveis de ambiente da nuvem (GitHub Actions)
load_dotenv(STUDIO_ROOT / ".env", override=False)


def get_kids_secret(env_name: str, fallback_filename: str | None = None) -> str | None:
    """Lê apenas secrets exclusivos do canal infantil (KIDS_*)."""
    val = (os.environ.get(env_name) or "").strip()
    if val:
        return val
    if fallback_filename:
        p = SECRETS_DIR / fallback_filename
        if p.exists():
            txt = p.read_text(encoding="utf-8").strip()
            if txt:
                return txt
    return None


def load_series_bible() -> dict:
    return json.loads((DATA_DIR / "series_bible.json").read_text(encoding="utf-8"))


def load_series_memory() -> dict:
    return json.loads((DATA_DIR / "series_memory.json").read_text(encoding="utf-8"))


def save_series_memory(mem: dict) -> None:
    (DATA_DIR / "series_memory.json").write_text(
        json.dumps(mem, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
