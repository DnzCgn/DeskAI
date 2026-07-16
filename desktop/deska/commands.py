"""Command handlers for remote device control."""

import platform
import subprocess
import socket


def handle_restart(payload=None):
    system = platform.system()
    try:
        if system == "Windows":
            subprocess.Popen(["shutdown", "/r", "/t", "30", "/c", "DESKA remote restart in 30 seconds"])
        elif system == "Darwin":
            subprocess.Popen(["osascript", "-e", 'tell app "System Events" to restart'])
        else:
            subprocess.Popen(["shutdown", "-r", "+1", "DESKA remote restart in 1 minute"])
        return {"restarted": True, "system": system}
    except Exception as e:
        return {"restarted": False, "error": str(e)}


def handle_shutdown(payload=None):
    system = platform.system()
    try:
        if system == "Windows":
            subprocess.Popen(["shutdown", "/s", "/t", "30", "/c", "DESKA remote shutdown in 30 seconds"])
        elif system == "Darwin":
            subprocess.Popen(["osascript", "-e", 'tell app "System Events" to shut down'])
        else:
            subprocess.Popen(["shutdown", "-h", "+1", "DESKA remote shutdown in 1 minute"])
        return {"shutdown": True, "system": system}
    except Exception as e:
        return {"shutdown": False, "error": str(e)}


def handle_update(payload=None):
    return {"updated": False, "message": "Update check not yet implemented"}


def handle_status(payload=None):
    try:
        hostname = socket.gethostname()
        system = platform.system()
        release = platform.release()
        return {"hostname": hostname, "system": system, "release": release, "status": "online"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


COMMAND_HANDLERS = {
    "restart": handle_restart,
    "shutdown": handle_shutdown,
    "update": handle_update,
    "status": handle_status,
}
