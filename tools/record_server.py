"""Serve the site locally and accept a recorded wall tag.
Run from the site folder:  python3 tools/record_server.py   then open http://localhost:8777/?record#wall
Spray the wall, hit "save tag", and the session lands in js/tag.json (the replay visitors see)."""
import http.server, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'js', 'tag.json')


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_POST(self):
        if self.path != '/__tag':
            self.send_error(404); return
        body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        try:
            data = json.loads(body)
            assert isinstance(data.get('events'), list) and data['events']
        except Exception:
            self.send_error(400, 'bad tag'); return
        with open(OUT, 'w') as f:
            json.dump(data, f, separators=(',', ':'))
        print(f"saved {len(data['events'])} events to js/tag.json")
        self.send_response(204); self.end_headers()


if __name__ == '__main__':
    http.server.ThreadingHTTPServer(('127.0.0.1', 8777), Handler).serve_forever()
