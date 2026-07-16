import requests

from . import config


def post(path, data=None):
    url = f"{config.BACKEND_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if config.AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {config.AUTH_TOKEN}"
    return requests.post(url, json=data, headers=headers, timeout=30)


def get(path):
    url = f"{config.BACKEND_URL}{path}"
    headers = {}
    if config.AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {config.AUTH_TOKEN}"
    return requests.get(url, headers=headers, timeout=30)


def health_check():
    try:
        resp = get("/health")
        return resp.status_code == 200
    except Exception:
        return False


def post_speech_stt(wav_buffer):
    url = f"{config.BACKEND_URL}/api/speech/stt"
    headers = {}
    if config.AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {config.AUTH_TOKEN}"
    return requests.post(url, files={"audio": ("recording.wav", wav_buffer, "audio/wav")}, headers=headers, timeout=30)


def post_speech_tts(text):
    url = f"{config.BACKEND_URL}/api/speech/tts"
    headers = {"Content-Type": "application/json"}
    if config.AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {config.AUTH_TOKEN}"
    return requests.post(url, json={"text": text}, headers=headers, timeout=30)
