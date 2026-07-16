#!/usr/bin/env python3
import sys
import threading

from deska import config
from deska.storage import init_db
from deska.tray import run_tray
from deska.voice import VoicePipeline
from deska.ws_client import WSClient


def main():
    init_db()

    voice = VoicePipeline()
    voice_thread = threading.Thread(target=voice.start, daemon=True)
    voice_thread.start()

    ws = WSClient()
    ws_thread = threading.Thread(target=ws.start, daemon=True)
    ws_thread.start()

    tray_thread = threading.Thread(target=run_tray, daemon=True)
    tray_thread.start()

    try:
        tray_thread.join()
    except KeyboardInterrupt:
        sys.exit(0)


if __name__ == "__main__":
    main()
