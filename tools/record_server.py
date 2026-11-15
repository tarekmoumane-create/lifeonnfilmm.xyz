"""Serve the site locally and accept a recorded wall tag.
Run from the site folder:  python3 tools/record_server.py   then open http://localhost:8777/?record#wall
Spray the wall, hit "save tag", and the session lands in js/tag.json (the replay visitors see).
/?record=name saves to js/tag-name.json instead, for a piece to splice into the existing tag."""
import http.server, json, os, re, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        name = urllib.parse.parse_qs(u.query).get('file', ['tag.json'])[0]
        if u.path != '/__tag' or not re.fullmatch(r'tag(-[a-z0-9]+)?\.json', name):
            self.send_error(404); return
        out = os.path.join(ROOT, 'js', name)
        body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        try:
            data = json.loads(body)
            assert isinstance(data.get('events'), list) and data['events']
        except Exception:
            self.send_error(400, 'bad tag'); return
        with open(out, 'w') as f:
            json.dump(data, f, separators=(',', ':'))
        print(f"saved {len(data['events'])} events to js/{name}")
        self.send_response(204); self.end_headers()


if __name__ == '__main__':
    http.server.ThreadingHTTPServer(('127.0.0.1', 8777), Handler).serve_forever()
