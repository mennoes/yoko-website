#!/usr/bin/env python3
"""
Tijdelijke server die base64-afbeeldingen van de Figma plugin ontvangt en opslaat.
Start met: python3 save-images-server.py
Draait op poort 3457
"""
import http.server
import json
import base64
import os
import sys

SAVE_DIR = os.path.dirname(os.path.abspath(__file__))

class ImageSaverHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path == '/save-image':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
                slug = data['slug']
                b64 = data['b64']
                filename = data.get('filename', 'thumb.jpg')

                folder = os.path.join(SAVE_DIR, 'assets', 'cases', slug)
                os.makedirs(folder, exist_ok=True)
                filepath = os.path.join(folder, filename)

                img_bytes = base64.b64decode(b64)
                with open(filepath, 'wb') as f:
                    f.write(img_bytes)

                print(f'✓ Opgeslagen: {filepath} ({len(img_bytes)} bytes)')

                self.send_response(200)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True, 'path': filepath}).encode())
            except Exception as e:
                print(f'✗ Fout: {e}')
                self.send_response(500)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass  # Stil houden behalve onze eigen prints

if __name__ == '__main__':
    port = 3457
    server = http.server.HTTPServer(('localhost', port), ImageSaverHandler)
    print(f'Image-save server draait op http://localhost:{port}')
    print(f'Opslaan in: {SAVE_DIR}/assets/cases/[slug]/')
    print('Ctrl+C om te stoppen\n')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer gestopt.')
