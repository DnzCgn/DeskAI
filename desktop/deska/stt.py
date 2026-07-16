"""STT module — records audio and sends to the backend speech-to-text endpoint."""

import io
import wave

import numpy as np
import sounddevice as sd

from . import config, api

SAMPLE_RATE = 16000
RECORD_DURATION = 4.0  # seconds to record after wake word


def record_and_transcribe(duration=None):
    duration = duration or RECORD_DURATION
    audio = sd.rec(
        int(duration * SAMPLE_RATE),
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype=np.int16,
    )
    sd.wait()

    wav_buffer = io.BytesIO()
    with wave.open(wav_buffer, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(audio.tobytes())

    wav_buffer.seek(0)
    resp = api.post_speech_stt(wav_buffer)
    if resp.status_code != 200:
        return None
    return resp.json().get("text", "")


def transcribe_audio(audio_array):
    """Transcribe pre-recorded audio array from wake listener."""
    audio_int16 = (audio_array * 32767).astype(np.int16)
    wav_buffer = io.BytesIO()
    with wave.open(wav_buffer, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(audio_int16.tobytes())

    wav_buffer.seek(0)
    resp = api.post_speech_stt(wav_buffer)
    if resp.status_code != 200:
        return None
    return resp.json().get("text", "")
