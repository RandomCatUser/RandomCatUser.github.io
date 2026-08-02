"""
Live Server — A lightweight Python live server inspired by VS Code Live Server.

Single-file application providing:
  - Local HTTP server with automatic port selection (5500, 5501, 5502, …)
  - Recursive file watching with sane ignore patterns
  - WebSocket-based live reload
      • CSS files trigger a hot reload (stylesheet swap, no page refresh)
      • Any other watched file triggers a full page reload
  - In-memory HTML client injection (user files are NEVER modified)
  - Dashboard with server state and timestamped logs
  - Keyboard commands: R = restart, O = open browser, C = clear, Q = quit
  - Path-traversal protection

Dependencies (Python 3.12+):
    pip install fastapi uvicorn watchdog
Optional (recommended for colored output):
    pip install rich
"""

from __future__ import annotations

import asyncio
import json
import mimetypes
import os
import socket
import sys
import threading
import time
import urllib.parse
import webbrowser
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Optional, Set

# ----------------------- Optional: rich -----------------------
try:
    from rich.align import Align
    from rich.console import Console
    from rich.text import Text
    _console: Optional[Console] = Console()
    RICH_AVAILABLE = True
except ImportError:  # pragma: no cover - rich is optional
    _console = None
    RICH_AVAILABLE = False

# ----------------------- Required -----------------------
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, HTMLResponse, Response
import uvicorn
from watchdog.events import FileSystemEvent, FileSystemEventHandler
from watchdog.observers import Observer


# ============================================================
# Constants
# ============================================================

BANNER = (
    "╔══════════════════════════════╗\n"
    "║         Live Server          ║\n"
    "║   Simple Python Live Server  ║\n"
    "╚══════════════════════════════╝"
)

DEFAULT_PORT = 5500
MAX_PORT_ATTEMPTS = 100
HOST = "localhost"

# Directories to never watch or descend into.
IGNORED_DIRS = frozenset({
    ".git", "node_modules", "__pycache__", ".venv", "dist", "build",
})

# File extensions to watch for live reload.
WATCHED_EXTENSIONS = frozenset({
    ".html", ".css", ".js", ".json", ".txt",
    ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico",
    ".woff", ".woff2", ".ttf",
})

# Ensure common types are properly recognised on every platform.
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/json", ".json")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("font/woff", ".woff")
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("font/ttf", ".ttf")


# ============================================================
# Injected browser client
# ============================================================

# The script is injected *in memory* before </body> on every HTML response.
# It connects to /ws and reacts to reload events.
CLIENT_SCRIPT = b"""
<script>
(function() {
    'use strict';
    var wsUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
    var ws = null;
    var reconnectTimer = null;

    function showNotification(filename) {
        var notif = document.getElementById('live-server-notif');
        if (!notif) {
            notif = document.createElement('div');
            notif.id = 'live-server-notif';
            notif.style.cssText = [
                'position:fixed','bottom:20px','right:20px',
                'background:#2563eb','color:#fff','padding:12px 20px',
                'border-radius:8px','font-family:system-ui,-apple-system,sans-serif',
                'font-size:14px','z-index:2147483647',
                'box-shadow:0 4px 12px rgba(0,0,0,0.25)',
                'opacity:0','transition:opacity 0.3s ease',
                'max-width:280px','word-break:break-all','pointer-events:none'
            ].join(';');
            document.body.appendChild(notif);
        }
        notif.innerHTML =
            '<div style="font-weight:600;margin-bottom:4px;">Reloaded</div>' +
            '<div>' + filename + '</div>';
        notif.style.opacity = '1';
        clearTimeout(notif._timer);
        notif._timer = setTimeout(function() { notif.style.opacity = '0'; }, 1000);
    }

    function hotReloadCss(filename) {
        var base = filename.split('/').pop();
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(function(link) {
            var href = link.getAttribute('href') || '';
            var cleanHref = href.split('?')[0];
            if (cleanHref === filename ||
                cleanHref.endsWith('/' + filename) ||
                cleanHref === base ||
                cleanHref.endsWith('/' + base)) {
                link.setAttribute('href', cleanHref + '?v=' + Date.now());
            }
        });
    }

    function connect() {
        try {
            ws = new WebSocket(wsUrl);
        } catch (e) {
            scheduleReconnect();
            return;
        }
        ws.onopen = function() { console.log('[Live Server] connected'); };
        ws.onmessage = function(event) {
            var data;
            try { data = JSON.parse(event.data); } catch (e) { return; }
            if (data.type === 'reload') {
                showNotification(data.filename || 'file');
                if (data.kind === 'css') {
                    hotReloadCss(data.filename || '');
                } else {
                    setTimeout(function() { location.reload(); }, 150);
                }
            } else if (data.type === 'full-reload') {
                location.reload();
            }
        };
        ws.onclose = function() { scheduleReconnect(); };
        ws.onerror = function() { try { ws.close(); } catch (e) {} };
    }

    function scheduleReconnect() {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connect, 1000);
    }

    connect();
})();
</script>
"""


# ============================================================
# Utility helpers
# ============================================================

def print_banner() -> None:
    """Display the application banner."""
    if RICH_AVAILABLE and _console is not None:
        _console.print(Align.center(Text(BANNER)))
    else:
        print(BANNER)


def is_port_available(host: str, port: int) -> bool:
    """Return True if a TCP port can be bound on `host`."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind((host, port))
            return True
        except OSError:
            return False


def find_available_port(host: str = HOST, start: int = DEFAULT_PORT,
                        max_attempts: int = MAX_PORT_ATTEMPTS) -> Optional[int]:
    """Find the first available port starting from `start`."""
    for i in range(max_attempts):
        port = start + i
        if is_port_available(host, port):
            return port
    return None


def now_str() -> str:
    return datetime.now().strftime("%H:%M:%S")


def clear_terminal() -> None:
    os.system("cls" if os.name == "nt" else "clear")


def safe_relative_path(path: Path, root: Path) -> str:
    """Return a forward-slash relative path for `path` against `root`."""
    try:
        return str(path.resolve().relative_to(root.resolve())).replace("\\", "/")
    except (ValueError, OSError):
        return path.name


# ============================================================
# File watcher
# ============================================================

class FileChangeHandler(FileSystemEventHandler):
    """Watchdog handler that triggers live reload on file changes."""

    def __init__(self, server: "LiveServer") -> None:
        super().__init__()
        self.server = server
        # Debounce table: path -> last-event timestamp (seconds).
        self._debounce: dict[str, float] = {}

    # ---------- helpers ----------
    def _process(self, event: FileSystemEvent, count_change: bool = False) -> None:
        if event.is_directory:
            return
        path = Path(event.src_path)
        if not self._should_watch(path):
            return
        # Watchdog often emits several events for a single save.
        key = str(path)
        ts = time.time()
        last = self._debounce.get(key, 0.0)
        if ts - last < 0.3:
            return
        self._debounce[key] = ts
        if count_change:
            self.server.refresh_watched_count()
        self.server.on_file_changed(path)

    @staticmethod
    def _should_watch(path: Path) -> bool:
        for part in path.parts:
            if part in IGNORED_DIRS:
                return False
        return path.suffix.lower() in WATCHED_EXTENSIONS

    # ---------- watchdog callbacks ----------
    def on_modified(self, event: FileSystemEvent) -> None:
        self._process(event, count_change=False)

    def on_created(self, event: FileSystemEvent) -> None:
        self._process(event, count_change=True)

    def on_deleted(self, event: FileSystemEvent) -> None:
        if event.is_directory:
            return
        path = Path(event.src_path)
        if not self._should_watch(path):
            return
        self.server.refresh_watched_count()
        self.server.on_file_changed(path)


# ============================================================
# Live Server
# ============================================================

class LiveServer:
    """The main live server: HTTP + WebSocket + file watcher."""

    def __init__(self, project_path: Path) -> None:
        self.project_path: Path = project_path.resolve()
        self.host: str = HOST
        self.port: Optional[int] = None

        self.clients: Set[WebSocket] = set()
        self.watched_count: int = 0
        self.last_change: str = "—"

        self.running: bool = True
        self._restart_requested: bool = False

        self.observer: Optional[Observer] = None
        self.server: Optional[uvicorn.Server] = None
        self.loop: Optional[asyncio.AbstractEventLoop] = None

        self._lock = threading.Lock()

        # FastAPI with a lifespan handler to capture the running event loop.
        server_ref = self

        @asynccontextmanager
        async def _lifespan(_app: FastAPI):
            server_ref.loop = asyncio.get_running_loop()
            yield
            server_ref.loop = None

        self.app: FastAPI = FastAPI(
            lifespan=_lifespan,
            docs_url=None,
            redoc_url=None,
            openapi_url=None,
        )
        self._setup_routes()

    # ---------------- Routes ----------------

    def _setup_routes(self) -> None:
        @self.app.websocket("/ws")
        async def ws_endpoint(websocket: WebSocket) -> None:
            await websocket.accept()
            with self._lock:
                self.clients.add(websocket)
            count = len(self.clients)
            self._log(f"Browser connected\n\nClients: {count}", "green")
            try:
                # Keep the socket open; we don't expect inbound messages.
                while True:
                    await websocket.receive_text()
            except WebSocketDisconnect:
                pass
            except Exception:
                # Any unexpected socket error is treated as a disconnect.
                pass
            finally:
                with self._lock:
                    self.clients.discard(websocket)
                count = len(self.clients)
                self._log(f"Browser disconnected\n\nClients: {count}", "yellow")

        @self.app.get("/")
        async def index() -> Response:
            return await self._serve_path(self.project_path / "index.html")

        @self.app.get("/{full_path:path}")
        async def serve(full_path: str) -> Response:
            decoded = urllib.parse.unquote(full_path)
            target = self.project_path / decoded
            return await self._serve_path(target)

    async def _serve_path(self, target: Path) -> Response:
        """Serve a file from the project folder with security checks."""
        # Resolve and ensure the resolved path stays inside the project root.
        try:
            real = target.resolve()
            real.relative_to(self.project_path)
        except (ValueError, OSError):
            raise HTTPException(status_code=403, detail="Forbidden")

        # Allow directory URLs to resolve to an index.html inside them.
        if real.is_dir():
            index_in_dir = real / "index.html"
            if index_in_dir.is_file():
                real = index_in_dir
            else:
                raise HTTPException(status_code=404, detail="Not Found")

        if not real.is_file():
            raise HTTPException(status_code=404, detail="Not Found")

        # HTML: inject the live-reload client in memory.
        if real.suffix.lower() == ".html":
            try:
                content = real.read_bytes()
            except PermissionError:
                raise HTTPException(status_code=403, detail="Permission denied")
            except OSError:
                raise HTTPException(status_code=500, detail="Read error")
            return HTMLResponse(content=self._inject_client(content))

        try:
            return FileResponse(real)
        except PermissionError:
            raise HTTPException(status_code=403, detail="Permission denied")
        except OSError:
            raise HTTPException(status_code=500, detail="Read error")

    def _inject_client(self, content: bytes) -> bytes:
        """Inject the live-reload script before </body> (case-insensitive)."""
        lower = content.lower()
        idx = lower.rfind(b"</body>")
        if idx == -1:
            # No </body> — append at the end (browsers tolerate this).
            return content + CLIENT_SCRIPT
        return content[:idx] + CLIENT_SCRIPT + content[idx:]

    # ---------------- File watching ----------------

    def setup_watcher(self) -> None:
        """Start (or restart) the watchdog observer on the project folder."""
        if self.observer is not None:
            try:
                self.observer.stop()
                self.observer.join(timeout=1.0)
            except Exception:
                pass
            self.observer = None

        self.observer = Observer()
        handler = FileChangeHandler(self)
        self.observer.schedule(handler, str(self.project_path), recursive=True)
        self.observer.start()
        self.refresh_watched_count()

    def refresh_watched_count(self) -> None:
        """Recount watched files (used by the dashboard)."""
        count = 0
        try:
            for root, dirs, files in os.walk(self.project_path):
                # Prune ignored directories in-place so os.walk skips them.
                dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
                for f in files:
                    if Path(f).suffix.lower() in WATCHED_EXTENSIONS:
                        count += 1
        except (PermissionError, OSError):
            pass
        self.watched_count = count

    def on_file_changed(self, path: Path) -> None:
        """Called from the watcher thread when a file changes."""
        filename = safe_relative_path(path, self.project_path)
        self.last_change = filename
        is_css = path.suffix.lower() == ".css"
        self._log(f"Modified\n\n{filename}\n\nReloaded browser", "cyan")

        loop = self.loop
        if loop is not None and not loop.is_closed():
            try:
                asyncio.run_coroutine_threadsafe(
                    self._broadcast(filename, is_css), loop
                )
            except RuntimeError:
                # Loop may have been closed mid-flight — ignore.
                pass

    async def _broadcast(self, filename: str, is_css: bool) -> None:
        """Send a reload message to every connected browser."""
        message = json.dumps({
            "type": "reload",
            "kind": "css" if is_css else "full",
            "filename": filename,
        })
        dead: list[WebSocket] = []
        with self._lock:
            snapshot = list(self.clients)
        for ws in snapshot:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        if dead:
            with self._lock:
                for ws in dead:
                    self.clients.discard(ws)

    # ---------------- Logging / Dashboard ----------------

    def _log(self, message: str, color: str = "white") -> None:
        """Print a timestamped, colored log entry."""
        ts = now_str()
        if RICH_AVAILABLE and _console is not None:
            _console.print(f"[{ts}]", style="bold white")
            _console.print(message, style=color)
            _console.print()
        else:
            print(f"[{ts}]\n{message}\n")

    def render_dashboard(self) -> None:
        """Render the live status dashboard."""
        sep = "-" * 60
        with self._lock:
            client_count = len(self.clients)
        lines = [
            sep,
            "",
            "Live Server",
            "",
            "Project:",
            self.project_path.name,
            "",
            "Running:",
            f"http://{self.host}:{self.port}",
            "",
            "Clients:",
            str(client_count),
            "",
            "Watching:",
            f"{self.watched_count} files",
            "",
            "Last Change:",
            self.last_change,
            "",
            sep,
            "Commands:  R = restart   O = open browser   C = clear   Q = quit",
            sep,
            "",
        ]
        text = "\n".join(lines)
        if RICH_AVAILABLE and _console is not None:
            _console.print(text, style="cyan")
        else:
            print(text)

    # ---------------- Keyboard ----------------

    def keyboard_loop(self) -> None:
        """Background thread that reads single-letter commands from stdin."""
        while self.running:
            try:
                cmd = input().strip().lower()
            except (EOFError, KeyboardInterrupt):
                self.shutdown()
                return
            except Exception:
                continue
            if not cmd:
                continue
            c = cmd[0]
            if c == "r":
                self._log("Restart requested", "yellow")
                self._restart_requested = True
                if self.server is not None:
                    self.server.should_exit = True
                return
            elif c == "o":
                url = f"http://{self.host}:{self.port}"
                try:
                    webbrowser.open(url)
                    self._log(f"Opening browser: {url}", "cyan")
                except Exception as e:
                    self._log(f"Failed to open browser: {e}", "red")
            elif c == "c":
                clear_terminal()
                self.render_dashboard()
            elif c == "q":
                self.shutdown()
                return
            else:
                self._log(f"Unknown command: {cmd}", "yellow")

    # ---------------- Lifecycle ----------------

    def shutdown(self) -> None:
        """Graceful shutdown — stops watcher and signals uvicorn to exit."""
        self.running = False
        if self.observer is not None:
            try:
                self.observer.stop()
            except Exception:
                pass
        if self.server is not None:
            self.server.should_exit = True

    def run(self) -> None:
        """Start the live server and block until the user quits."""
        self.port = find_available_port(self.host)
        if not self.port:
            self._log("No available port found (5500-5599).", "red")
            return

        # Start the file watcher.
        try:
            self.setup_watcher()
        except Exception as e:
            self._log(f"Failed to start file watcher: {e}", "red")
            return

        # Startup banner.
        self._log(
            f"Live Server started\n\nProject\n{self.project_path}\n\n"
            f"URL\nhttp://{self.host}:{self.port}",
            "green",
        )

        # Open the user's default browser.
        try:
            webbrowser.open(f"http://{self.host}:{self.port}")
        except Exception:
            pass

        self.render_dashboard()

        # Main run/restart loop.
        while self.running:
            self._restart_requested = False

            kb_thread = threading.Thread(target=self.keyboard_loop, daemon=True)
            kb_thread.start()

            config = uvicorn.Config(
                app=self.app,
                host=self.host,
                port=self.port,
                log_level="critical",
                lifespan="on",
                access_log=False,
            )
            self.server = uvicorn.Server(config)
            try:
                self.server.run()
            except KeyboardInterrupt:
                self.running = False
                break
            except Exception as e:
                self._log(f"Server error: {e}", "red")
                break

            if not self._restart_requested:
                break

            # Restart path.
            self._log("Restarting...", "yellow")
            new_port = find_available_port(self.host, self.port)
            if not new_port:
                self._log("No port available for restart.", "red")
                break
            self.port = new_port
            self.render_dashboard()

        # Final cleanup.
        if self.observer is not None:
            try:
                self.observer.stop()
                self.observer.join(timeout=1.0)
            except Exception:
                pass
        self._log("Live Server stopped.", "green")


# ============================================================
# Project selection
# ============================================================

def prompt_project() -> Optional[Path]:
    """Display the banner and prompt for a valid project folder."""
    print_banner()
    print("Enter project folder:")
    print("(you can also drag and drop a folder here)")
    print()
    try:
        raw = input("> ").strip()
    except (EOFError, KeyboardInterrupt):
        return None
    if not raw:
        return None

    # Drag-and-drop on some terminals wraps the path in quotes.
    raw = raw.strip().strip('"').strip("'")
    path = Path(raw).expanduser()

    if not path.exists() or not path.is_dir():
        print("Error: folder does not exist.")
        return None
    if not (path / "index.html").is_file():
        print("Error: index.html not found.")
        return None
    return path


# ============================================================
# Entry point
# ============================================================

def main() -> None:
    project = prompt_project()
    if project is None:
        sys.exit(1)

    server = LiveServer(project)
    try:
        server.run()
    except KeyboardInterrupt:
        server.shutdown()
    sys.exit(0)


if __name__ == "__main__":
    main()