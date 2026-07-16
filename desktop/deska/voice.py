"""Voice pipeline — orchestrates wake→STT→process→TTS flow."""

import threading
import time

from . import config
from . import api as backend_api
from .stt import transcribe_audio
from .tts import speak
from .wake import WakeListener


class VoicePipeline:
    def __init__(self):
        self._running = False
        self._listener = WakeListener(on_wake=self._on_wake)

    def start(self):
        if self._running:
            return
        if not config.AUTH_TOKEN:
            print("DESKA: No auth token configured, voice pipeline not started")
            return

        backend_ok = backend_api.health_check()
        if not backend_ok:
            print("DESKA: Backend not reachable, voice pipeline not started")
            return

        self._running = True
        self._listener.start()
        print(f"DESKA: Listening for wake phrase '{config.WAKE_PHRASE}'")

    def stop(self):
        self._running = False
        self._listener.stop()

    def _on_wake(self, audio_array):
        if not self._running:
            return

        text = transcribe_audio(audio_array)
        if not text or not text.strip():
            return

        text_lower = text.strip().lower()
        print(f"DESKA heard: {text_lower}")

        if text_lower in ("stop listening", "go to sleep"):
            speak("Going to sleep.")
            self.stop()
            return

        if text_lower in ("start listening", "wake up"):
            speak("I am already listening.")
            return

        if text_lower == "status":
            backend_ok = backend_api.health_check()
            msg = "Backend is reachable." if backend_ok else "Backend is unreachable."
            speak(msg)
            return

        resp = backend_api.post("/api/reasoning", {"text": text, "language": config.DEFAULT_LANGUAGE})
        if resp.status_code == 200:
            data = resp.json()
            spoken = data.get("spoken_response", "")
            if spoken:
                speak(spoken)
        else:
            speak("I had trouble processing that request.")
