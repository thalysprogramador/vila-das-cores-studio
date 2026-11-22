# -*- coding: utf-8 -*-
"""
Motor Musical Infantil & Biblioteca SFX Cartoon (44.1kHz Estéreo)
Gera trilhas acolhedoras (marimba, ukulele suave, baixo redondo, shaker) e efeitos cartoon.
"""
import numpy as np
from scipy.signal import butter, lfilter

SR = 44100


def _midi_to_hz(midi_note: float) -> float:
    return 440.0 * (2.0 ** ((midi_note - 69.0) / 12.0))


def _marimba_note(freq: float, dur: float, amp: float = 0.24) -> np.ndarray:
    n = int(dur * SR)
    t = np.linspace(0.0, dur, n, endpoint=False)
    attack = np.minimum(1.0, t / 0.008)
    sig = (
        0.78 * np.sin(2 * np.pi * freq * t) * np.exp(-t * 5.0)
        + 0.16 * np.sin(2 * np.pi * freq * 2.0 * t) * np.exp(-t * 9.5)
        + 0.11 * np.sin(2 * np.pi * freq * 3.98 * t) * np.exp(-t * 17.0)
    )
    fade_out = np.minimum(1.0, np.linspace(dur, 0.0, n) / 0.015)
    return (sig * attack * fade_out * amp).astype(np.float32)


def _ukulele_chord(midi_notes: list[int], dur: float, amp: float = 0.13) -> np.ndarray:
    n = int(dur * SR)
    out = np.zeros(n, dtype=np.float32)
    for idx, mn in enumerate(midi_notes):
        delay = int(idx * 0.018 * SR)
        if delay >= n:
            continue
        rem = n - delay
        t = np.linspace(0.0, rem / SR, rem, endpoint=False)
        f = _midi_to_hz(mn)
        env = np.minimum(1.0, t / 0.006) * np.exp(-t * 3.8)
        tone = (
            0.70 * np.sin(2 * np.pi * f * t)
            + 0.22 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 3.5)
            + 0.08 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t * 7.0)
        )
        out[delay:] += (tone * env * (amp / max(1, len(midi_notes)))).astype(np.float32)
    return out


def _bass_note(midi_note: float, dur: float, amp: float = 0.16) -> np.ndarray:
    n = int(dur * SR)
    t = np.linspace(0.0, dur, n, endpoint=False)
    f = _midi_to_hz(midi_note)
    env = np.minimum(1.0, t / 0.012) * np.exp(-t * 3.0)
    sig = 0.85 * np.sin(2 * np.pi * f * t) + 0.15 * np.sin(2 * np.pi * f * 2 * t)
    return (sig * env * amp).astype(np.float32)


def _shaker_hit(dur: float = 0.06, amp: float = 0.032) -> np.ndarray:
    n = int(dur * SR)
    t = np.linspace(0.0, dur, n, endpoint=False)
    rng = np.random.default_rng(42)
    noise = rng.normal(0, 1, n)
    b, a = butter(3, [4500 / (SR / 2), 11000 / (SR / 2)], btype="band")
    filt = lfilter(b, a, noise)
    env = np.minimum(1.0, t / 0.005) * np.exp(-t * 48.0)
    return (filt * env * amp).astype(np.float32)


def place_audio(buf: np.ndarray, clip: np.ndarray, start_idx: int, gain: float = 1.0):
    if start_idx >= len(buf):
        return
    if start_idx < 0:
        clip = clip[-start_idx:]
        start_idx = 0
    end_idx = min(len(buf), start_idx + len(clip))
    seg_len = end_idx - start_idx
    if seg_len > 0:
        buf[start_idx:end_idx] += clip[:seg_len] * gain


def synth_sfx(name: str) -> np.ndarray:
    if name == "boing":
        dur = 0.52
        t = np.linspace(0, dur, int(dur * SR), endpoint=False)
        freq = 165 + 240 * (1 - np.exp(-t * 7.0)) + 55 * np.sin(2 * np.pi * 16 * t) * np.exp(-t * 3.5)
        phase = 2 * np.pi * np.cumsum(freq) / SR
        env = np.minimum(1.0, t / 0.01) * np.exp(-t * 5.0)
        return (0.45 * np.sin(phase) * env + 0.12 * np.sin(2 * phase) * env).astype(np.float32)

    if name == "pop":
        dur = 0.16
        t = np.linspace(0, dur, int(dur * SR), endpoint=False)
        freq = np.minimum(320 * np.exp(t * 14.0), 1350)
        phase = 2 * np.pi * np.cumsum(freq) / SR
        env = np.minimum(1.0, t / 0.005) * np.exp(-t * 28.0)
        return (0.55 * np.sin(phase) * env).astype(np.float32)

    if name == "ding":
        dur = 0.85
        t = np.linspace(0, dur, int(dur * SR), endpoint=False)
        sig = (
            0.55 * np.sin(2 * np.pi * 1046.5 * t) * np.exp(-t * 4.5)
            + 0.25 * np.sin(2 * np.pi * 2093.0 * t) * np.exp(-t * 7.5)
            + 0.12 * np.sin(2 * np.pi * 3136.0 * t) * np.exp(-t * 11.0)
        )
        return (sig * np.minimum(1.0, t / 0.004) * 0.55).astype(np.float32)

    if name == "sparkle":
        out = np.zeros(int(1.25 * SR), dtype=np.float32)
        for i, mn in enumerate([72, 76, 79, 84, 88, 91, 96]):
            place_audio(out, _marimba_note(_midi_to_hz(mn), 0.45, amp=0.22), int(i * 0.085 * SR))
        return out

    if name == "whoosh":
        dur = 0.65
        t = np.linspace(0, dur, int(dur * SR), endpoint=False)
        noise = np.random.default_rng(123).normal(0, 1, len(t))
        b, a = butter(3, [350 / (SR / 2), 2600 / (SR / 2)], btype="band")
        return (lfilter(b, a, noise) * (np.sin(np.pi * t / dur) ** 1.6) * 0.35).astype(np.float32)

    if name == "blow_wind":
        dur = 1.4
        t = np.linspace(0, dur, int(dur * SR), endpoint=False)
        noise = np.random.default_rng(77).normal(0, 1, len(t))
        b, a = butter(3, [420 / (SR / 2), 1800 / (SR / 2)], btype="band")
        whistle = 0.06 * np.sin(2 * np.pi * (520 + 90 * np.sin(2 * np.pi * 1.4 * t)) * t)
        return ((lfilter(b, a, noise) * 0.32 + whistle) * (np.sin(np.pi * t / dur) ** 1.2)).astype(np.float32)

    if name == "applause_claps":
        out = np.zeros(int(2.0 * SR), dtype=np.float32)
        rng = np.random.default_rng(99)
        b, a = butter(3, [900 / (SR / 2), 3800 / (SR / 2)], btype="band")
        for i in range(6):
            for jitter in (0.0, 0.015, 0.032):
                ct = np.linspace(0, 0.09, int(0.09 * SR), endpoint=False)
                clap = lfilter(b, a, rng.normal(0, 1, len(ct))) * np.exp(-ct * 42.0) * 0.35
                place_audio(out, clap.astype(np.float32), int((i * 0.28 + jitter) * SR))
        return out

    if name == "rainbow_fanfare":
        out = np.zeros(int(2.2 * SR), dtype=np.float32)
        for t0, mn in [(0.0, 60), (0.12, 64), (0.24, 67), (0.36, 72), (0.50, 76), (0.65, 79), (0.82, 84)]:
            place_audio(out, _marimba_note(_midi_to_hz(mn), 0.75, amp=0.24), int(t0 * SR))
        place_audio(out, _ukulele_chord([60, 64, 67, 72], 1.2, amp=0.25), int(0.80 * SR))
        return out

    return np.zeros(int(0.2 * SR), dtype=np.float32)


def generate_mood_loop(mood: str, bars: int = 4) -> np.ndarray:
    moods = {
        "intro": {
            "bpm": 124,
            "chords": [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]],
            "bass": [48, 53, 55, 48],
            "melody": [
                (0.0, 72), (0.5, 76), (1.0, 79), (1.5, 76), (2.0, 81), (2.5, 79), (3.0, 76),
                (4.0, 77), (4.5, 81), (5.0, 84), (5.5, 81), (6.0, 79), (6.5, 76), (7.0, 74),
                (8.0, 79), (8.5, 83), (9.0, 86), (9.5, 83), (10.0, 84), (10.5, 81), (11.0, 79),
                (12.0, 76), (12.5, 79), (13.0, 84), (14.0, 84), (15.0, 79),
            ],
        },
        "happy": {
            "bpm": 112,
            "chords": [[60, 64, 67], [67, 71, 74], [69, 72, 76], [65, 69, 72]],
            "bass": [48, 55, 57, 53],
            "melody": [
                (0.0, 76), (1.0, 79), (1.5, 76), (2.0, 72), (3.0, 74),
                (4.0, 74), (5.0, 79), (6.0, 76), (7.0, 74),
                (8.0, 72), (9.0, 76), (10.0, 81), (11.0, 79),
                (12.0, 77), (13.0, 76), (14.0, 74), (15.0, 72),
            ],
        },
        "playful": {
            "bpm": 118,
            "chords": [[60, 64, 67], [65, 69, 72], [60, 64, 67], [67, 71, 74]],
            "bass": [48, 53, 48, 55],
            "melody": [
                (0.0, 79), (0.5, 76), (1.0, 79), (2.0, 84), (3.0, 79),
                (4.0, 81), (4.5, 77), (5.0, 81), (6.0, 84), (7.0, 81),
                (8.0, 79), (8.5, 76), (9.0, 72), (10.0, 76), (11.0, 79),
                (12.0, 74), (13.0, 79), (14.0, 76), (15.0, 74),
            ],
        },
        "curious": {
            "bpm": 102,
            "chords": [[60, 64, 67], [62, 65, 69], [67, 71, 74], [60, 64, 67]],
            "bass": [48, 50, 55, 48],
            "melody": [
                (0.0, 76), (1.0, 74), (2.0, 72), (3.0, 76),
                (4.0, 77), (5.0, 76), (6.0, 74), (7.0, 77),
                (8.0, 79), (9.0, 76), (10.0, 74), (11.0, 71),
                (12.0, 72), (13.5, 76), (14.5, 79),
            ],
        },
        "gentle": {
            "bpm": 92,
            "chords": [[65, 69, 72], [60, 64, 67], [62, 65, 69], [67, 71, 74]],
            "bass": [53, 48, 50, 55],
            "melody": [
                (0.0, 77), (1.5, 81), (2.5, 79),
                (4.0, 76), (5.5, 79), (6.5, 76),
                (8.0, 74), (9.5, 77), (10.5, 76),
                (12.0, 74), (14.0, 79),
            ],
        },
        "magical": {
            "bpm": 108,
            "chords": [[60, 64, 67, 71], [65, 69, 72, 76], [67, 71, 74, 79], [60, 64, 67, 72]],
            "bass": [48, 53, 55, 48],
            "melody": [
                (0.0, 84), (0.75, 79), (1.5, 83), (2.5, 79),
                (4.0, 81), (4.75, 76), (5.5, 81), (6.5, 84),
                (8.0, 86), (8.75, 83), (9.5, 79), (10.5, 83),
                (12.0, 84), (13.0, 88), (14.0, 84),
            ],
        },
        "celebration": {
            "bpm": 128,
            "chords": [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]],
            "bass": [48, 53, 55, 48],
            "melody": [
                (0.0, 72), (0.5, 76), (1.0, 79), (1.5, 84), (2.0, 83), (2.5, 81), (3.0, 79),
                (4.0, 81), (4.5, 84), (5.0, 81), (5.5, 77), (6.0, 79), (7.0, 76),
                (8.0, 79), (8.5, 83), (9.0, 86), (9.5, 83), (10.0, 84), (11.0, 79),
                (12.0, 84), (12.5, 84), (13.0, 86), (13.5, 88), (14.0, 84),
            ],
        },
    }
    cfg = moods.get(mood, moods["happy"])
    beat_sec = 60.0 / cfg["bpm"]
    total_beats = bars * 4
    buf = np.zeros(int(total_beats * beat_sec * SR), dtype=np.float32)
    shaker = _shaker_hit()

    for bar in range(bars):
        chord = cfg["chords"][bar % len(cfg["chords"])]
        bass_mn = cfg["bass"][bar % len(cfg["bass"])]
        for b in range(4):
            pos = int((bar * 4 + b) * beat_sec * SR)
            if b in (0, 2):
                place_audio(buf, _bass_note(bass_mn if b == 0 else bass_mn + 7, beat_sec * 1.4, amp=0.14), pos)
            place_audio(buf, _ukulele_chord(chord, beat_sec * 0.9, amp=0.12 if b in (0, 2) else 0.08), pos)
            if mood in ("intro", "playful", "happy", "celebration"):
                place_audio(buf, shaker, pos + int(0.5 * beat_sec * SR))

    for beat_pos, mn in cfg["melody"]:
        if beat_pos < total_beats:
            place_audio(buf, _marimba_note(_midi_to_hz(mn), beat_sec * 1.2, amp=0.16), int(beat_pos * beat_sec * SR))
    return buf
