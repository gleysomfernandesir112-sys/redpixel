import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class CustomHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def guess_type(self, path):
        if path.endswith(".epk"):
            return "application/octet-stream"
        if path.endswith(".wasm"):
            return "application/wasm"
        if path.endswith(".js"):
            return "application/javascript"
        return super().guess_type(path)

os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("", PORT), CustomHTTPHandler) as httpd:
    url = f"http://localhost:{PORT}"
    print(f"==================================================")
    print(f"  🎮 Servidor MessCraft iniciado com sucesso!")
    print(f"  🌐 Acesse no navegador: {url}")
    print(f"  Pressione Ctrl+C para encerrar o servidor.")
    print(f"==================================================")
    webbrowser.open(url)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor finalizado.")
        sys.exit(0)
