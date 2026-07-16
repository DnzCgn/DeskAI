"""WebSocket client — connects to backend /ws, listens for remote commands."""

import json
import threading
import time
import uuid

try:
    import websocket
except ImportError:
    websocket = None

from . import config
from .commands import COMMAND_HANDLERS


def _generate_device_id():
    return uuid.uuid4().hex[:12]


class WSClient:
    def __init__(self, device_id=None):
        self._device_id = device_id or config.DEVICE_ID or _generate_device_id()
        self._running = False
        self._ws = None
        self._thread = None

    def start(self):
        if websocket is None:
            print("DESKA: websocket-client not installed, remote commands disabled")
            return
        if not config.AUTH_TOKEN:
            print("DESKA: No auth token configured, remote commands disabled")
            return
        self._running = True
        self._thread = threading.Thread(target=self._connect_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False
        if self._ws:
            self._ws.close()

    def _connect_loop(self):
        while self._running:
            try:
                self._connect()
            except Exception as e:
                print(f"DESKA WS: connection error: {e}")
            if self._running:
                time.sleep(5)

    def _connect(self):
        ws_url = config.BACKEND_URL.replace("http://", "ws://", 1).replace("https://", "wss://", 1)
        url = f"{ws_url}/ws?token={config.AUTH_TOKEN}&deviceId={self._device_id}"

        self._ws = websocket.WebSocketApp(
            url,
            on_open=self._on_open,
            on_message=self._on_message,
            on_close=self._on_close,
            on_error=self._on_error,
        )
        self._ws.run_forever()

    def _on_open(self, ws):
        print(f"DESKA WS: connected as device {self._device_id}")

    def _on_message(self, ws, raw):
        try:
            msg = json.loads(raw)
            if msg.get("type") == "command":
                self._handle_command(msg.get("command"), msg.get("payload", {}))
        except json.JSONDecodeError:
            pass

    def _handle_command(self, command, payload):
        handler = COMMAND_HANDLERS.get(command)
        if not handler:
            return
        try:
            result = handler(payload) if payload else handler()
            if self._ws:
                self._ws.send(json.dumps({
                    "type": "command_result",
                    "command": command,
                    "result": result,
                }))
        except Exception as e:
            print(f"DESKA WS: command '{command}' failed: {e}")

    def _on_close(self, ws, close_status_code, close_msg):
        self._ws = None
        print(f"DESKA WS: disconnected (code={close_status_code})")

    def _on_error(self, ws, error):
        print(f"DESKA WS: error: {error}")
