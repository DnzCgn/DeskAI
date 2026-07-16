"""Wake word listener — continuous audio monitoring with energy-based detection."""

import threading
import time
from collections import deque

import sounddevice as sd
import numpy as np

from . import config

SAMPLE_RATE = 16000
CHUNK_DURATION = 0.1
ENERGY_THRESHOLD = 0.02
MIN_SILENCE_AFTER = 1.2
COOLDOWN_SECONDS = 2.0


class WakeListener:
    def __init__(self, on_wake):
        self._on_wake = on_wake
        self._running = False
        self._stream = None
        self._energy_buffer = deque(maxlen=10)
        self._last_spike = 0
        self._recording = False
        self._recorded_frames = []
        self._cooldown_until = 0

    def start(self):
        if self._running:
            return
        self._running = True
        self._stream = sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=1,
            dtype=np.float32,
            callback=self._audio_callback,
            blocksize=int(SAMPLE_RATE * CHUNK_DURATION),
        )
        self._stream.start()

    def stop(self):
        self._running = False
        if self._stream:
            self._stream.stop()
            self._stream.close()
            self._stream = None

    def _energy(self, data):
        return np.sqrt(np.mean(data ** 2))

    def _audio_callback(self, indata, _frames, _time_info, _status):
        if not self._running:
            return

        energy = self._energy(indata)
        self._energy_buffer.append(energy)

        if time.time() < self._cooldown_until:
            return

        avg_energy = sum(self._energy_buffer) / len(self._energy_buffer) if self._energy_buffer else 0
        now = time.time()

        if energy > avg_energy * 2.5 and energy > ENERGY_THRESHOLD:
            self._last_spike = now
            if not self._recording:
                self._recording = True
                self._recorded_frames = [indata.copy()]
        elif self._recording:
            self._recorded_frames.append(indata.copy())
            if now - self._last_spike > MIN_SILENCE_AFTER and len(self._recorded_frames) > 10:
                self._recording = False
                self._cooldown_until = now + COOLDOWN_SECONDS
                audio = np.concatenate(self._recorded_frames)
                self._recorded_frames = []
                threading.Thread(target=self._on_wake, args=(audio,), daemon=True).start()
