#!/usr/bin/env python3
import http.server
import socketserver
import json
import os

PORT = 8080
RADIO_DIR = "/radio"

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/radio":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            songs = []
            if os.path.isdir(RADIO_DIR):
                for fname in os.listdir(RADIO_DIR):
                    name, ext = os.path.splitext(fname.lower())
                    if ext in ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a']:
                        img = None
                        for ie in ['.png', '.jpg', '.jpeg', '.webp']:
                            if os.path.isfile(os.path.join(RADIO_DIR, name + ie)):
                                img = name + ie
                                break
                        songs.append({
                            "title": name.replace('-', ' ').replace('_', ' '),
                            "file": fname,
                            "image": img
                        })
            self.wfile.write(json.dumps(songs).encode())
        else:
            return http.server.SimpleHTTPRequestHandler.do_GET(self)

print(f"=== SANGEET Server चल रहा है ===")
print(f"ब्राउज़र में खोलो:/radio")
print(f"रुकने के लिए Ctrl+C दबाओ")
print(f"")
print(f"Radio फोल्डर: {os.path.abspath(RADIO_DIR)}/")
if os.path.isdir(RADIO_DIR):
    files = [f for f in os.listdir(RADIO_DIR) if not f.startswith('.')]
    print(f"गाने मिले: {len(files)} फ़ाइलें")
    for f in files[:10]:
        print(f"  - {f}")
    if len(files) > 10:
        print(f"  ... और {len(files)-10} और")
else:
    print(f"  [!] 'radio' फोल्डर नहीं मिला! बनाओ और गाने डालो")

with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    httpd.serve_forever()