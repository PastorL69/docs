"""Build the complete ppuc.org site into ./out.

    python build.py           build everything
    python build.py --serve   build, serve ./out on http://localhost:8000, rebuild on every change and
                              reload the browser automatically

The output is assembled from two MkDocs projects:

    out/            website/mkdocs.yml  landing page (PPUC Docs or PPUC/DMD) and the PPUC/DMD site in out/dmd/
    out/docs/       mkdocs.yml          the PPUC documentation

The website is built into a temporary folder and copied into out/ next to out/docs/, so each part can be
rebuilt on its own.
"""

import argparse
import http.server
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile
import threading
import time

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "out"

# What to watch for each part of the site.
SOURCES = {
    "website": ["website"],
    "docs": ["docs", "includes", "overrides", "plugins", "mkdocs.yml"],
}

RELOAD_PATH = "/__livereload"
RELOAD_SCRIPT = (
    "<script>(function(){var v=null;setInterval(function(){fetch('%s',{cache:'no-store'})"
    ".then(function(r){return r.text()}).then(function(t){if(v===null){v=t}else if(t!==v){location.reload()}})"
    ".catch(function(){})},700)})();</script>" % RELOAD_PATH
).encode()


def mkdocs(*args):
    subprocess.run([sys.executable, "-m", "mkdocs", "build", "-q", *args], cwd=ROOT, check=True)


def build_website():
    with tempfile.TemporaryDirectory() as tmp:
        mkdocs("-f", "website/mkdocs.yml", "--site-dir", tmp)
        OUT.mkdir(exist_ok=True)
        for item in OUT.iterdir():
            if item.name == "docs":
                continue
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()
        shutil.copytree(tmp, OUT, dirs_exist_ok=True)


def build_docs():
    mkdocs("-f", "mkdocs.yml")  # site_dir: out/docs


BUILDERS = {"website": build_website, "docs": build_docs}


def build(parts):
    for part in parts:
        started = time.perf_counter()
        BUILDERS[part]()
        print(f"Built {part} in {time.perf_counter() - started:.1f}s")


def snapshot(part):
    """Modification times of every source file of one part of the site."""
    state = {}
    for name in SOURCES[part]:
        path = ROOT / name
        files = [path] if path.is_file() else path.rglob("*")
        for f in files:
            if f.is_file() and "__pycache__" not in f.parts:
                try:
                    state[f] = f.stat().st_mtime_ns
                except OSError:
                    pass
    return state


class LiveReloadHandler(http.server.SimpleHTTPRequestHandler):
    version = 0

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(OUT), **kwargs)

    def do_GET(self):
        if self.path == RELOAD_PATH:
            return self._send(str(LiveReloadHandler.version).encode(), "text/plain")
        path = self.translate_path(self.path.split("?", 1)[0].split("#", 1)[0])
        if os.path.isdir(path) and self.path.split("?", 1)[0].endswith("/"):
            path = os.path.join(path, "index.html")
        if path.endswith(".html") and os.path.isfile(path):
            with open(path, "rb") as f:
                body = f.read()
            body = body.replace(b"</body>", RELOAD_SCRIPT + b"</body>", 1)
            return self._send(body, "text/html; charset=utf-8")
        return super().do_GET()

    def _send(self, body, content_type):
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


def watch():
    states = {part: snapshot(part) for part in SOURCES}
    while True:
        time.sleep(0.5)
        changed = [part for part in SOURCES if snapshot(part) != states[part]]
        if not changed:
            continue
        time.sleep(0.3)  # let editors finish writing
        states = {part: snapshot(part) for part in SOURCES}
        print(f"Change detected in {', '.join(changed)}, rebuilding...")
        try:
            build(changed)
            LiveReloadHandler.version += 1
        except subprocess.CalledProcessError:
            print("Build failed, see the error above. Still serving the last good build.")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--serve", action="store_true", help="serve ./out with live reload after building")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    build(["website", "docs"])
    for page in ("index.html", "404.html", "dmd/index.html", "docs/index.html"):
        if not (OUT / page).is_file():
            sys.exit(f"Build incomplete: out/{page} is missing")
    print(f"Site built in {OUT}")

    if args.serve:
        threading.Thread(target=watch, daemon=True).start()
        with http.server.ThreadingHTTPServer(("127.0.0.1", args.port), LiveReloadHandler) as server:
            print(f"Serving on http://localhost:{args.port}/ with live reload (Ctrl+C to stop)")
            try:
                server.serve_forever()
            except KeyboardInterrupt:
                pass


if __name__ == "__main__":
    main()
