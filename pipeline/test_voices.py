# -*- coding: utf-8 -*-
"""
Teste Rápido das Vozes dos 4 Personagens (Tico, Lili, Dino Bip, Dona Nina).
Uso:
  1. Cole sua NOVA chave KIDS_GEMINI_API_KEY no arquivo .env
  2. Rode: python pipeline/test_voices.py
  3. Ouça o arquivo gerado em: output/teste_vozes_elenco.mp3
"""
import subprocess
import wave
from pathlib import Path

import numpy as np

from config import OUTPUT_DIR, TMP_DIR, load_series_bible
from voice_studio import FFMPEG_EXE, SR, read_wav_mono, synthesize_character_line

TEST_LINES = [
    ("tico", "Oi, amiguinho! Eu sou o Tico! Que alegria ter você aqui na Vila das Cores!"),
    ("lili", "E eu sou a Lili! Trouxe meus pincéis pra gente pintar um arco-íris bem lindo juntos!"),
    ("dino", "Raaawr-bip! Eu sou o Dino Bip! Adoro pular, brincar e comer biscoito! Hihi!"),
    ("nina", "Huhu! Seja muito bem-vindo à nossa vila, pequeno amigo. Vamos viver aventuras incríveis todos os dias!"),
]


def main():
    bible = load_series_bible()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    tmp_dir = TMP_DIR / "voice_test"
    tmp_dir.mkdir(parents=True, exist_ok=True)

    segments = []
    silence = np.zeros(int(0.45 * SR), dtype=np.float32)

    print("=== TESTE DO ELENCO DE DUBLAGEM — TICO & A VILA DAS CORES ===", flush=True)
    for sp, txt in TEST_LINES:
        wav_path = tmp_dir / f"sample_{sp}.wav"
        _, engine = synthesize_character_line(sp, txt, wav_path, bible=bible)
        print(f"  [{sp.upper():4s}] Motor: {engine}", flush=True)
        segments.append(read_wav_mono(wav_path))
        segments.append(silence)

    full = np.concatenate(segments)
    peak = float(np.max(np.abs(full)) + 1e-9)
    if peak > 0.92:
        full *= 0.92 / peak

    out_wav = tmp_dir / "teste_vozes_elenco.wav"
    with wave.open(str(out_wav), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(np.clip(full * 32767.0, -32768, 32767).astype(np.int16).tobytes())

    out_mp3 = OUTPUT_DIR / "teste_vozes_elenco.mp3"
    subprocess.run(
        [FFMPEG_EXE, "-y", "-i", str(out_wav), "-c:a", "libmp3lame", "-b:a", "192k", str(out_mp3)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print(f"\n[PRONTO] Amostra do elenco salva em: {out_mp3}", flush=True)


if __name__ == "__main__":
    main()
