"""TTS module — sends text to the backend and plays the returned audio."""

from . import api
from . import audio


def speak(text):
    """Send text to backend TTS and play the returned audio."""
    resp = api.post_speech_tts(text)
    if resp.status_code != 200:
        return False
    return audio.play_wav_bytes(resp.content)
