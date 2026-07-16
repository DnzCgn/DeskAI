import threading

import pystray
from PIL import Image, ImageDraw

from . import config
from .api import health_check


def _create_icon_image(size=64):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    margin = size // 8
    draw.rounded_rectangle((margin, margin, size - margin, size - margin), radius=size // 4, fill=(16, 185, 129))
    inner = size // 4
    draw.ellipse((inner, inner, 3 * inner, 3 * inner), fill=(255, 255, 255))
    icon_path = config.ICON_PATH
    icon_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(icon_path, "PNG")
    return img


def _on_quit(icon):
    icon.stop()


def _on_show_status(icon):
    backend_ok = health_check()
    status = "connected" if backend_ok else "unreachable"
    icon.notify(f"DESKA backend: {status}", title="DESKA")


def run_tray():
    icon = pystray.Icon(
        "deska",
        _create_icon_image(),
        "DESKA",
        menu=pystray.Menu(
            pystray.MenuItem("Show status", _on_show_status),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Quit", _on_quit),
        ),
    )
    icon.run()
