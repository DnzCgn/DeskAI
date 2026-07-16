"""Audio utilities — raw audio playback for TTS responses."""

import io
import wave

import numpy as np
import sounddevice as sd


def play_wav_bytes(data):
    """Play WAV audio bytes through default output device."""
    buffer = io.BytesIO(data)
    try:
        with wave.open(buffer, "rb") as wf:
            audio = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16)
            sd.play(audio, samplerate=wf.getframerate())
            sd.wait()
        return True
    except Exception:
        return False
