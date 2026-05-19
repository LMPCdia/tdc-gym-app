"""
Detecta la IP local de la red y actualiza automaticamente los archivos .env
del backend y frontend antes de iniciar los servidores.
"""
import socket
import re
import os

def get_local_ip():
    """Obtiene la IP local conectandose a un servidor externo (sin enviar datos)."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"

def update_env_file(path, key, value):
    """Actualiza o agrega una clave en un archivo .env."""
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        # Reemplaza la linea existente
        pattern = rf"^{re.escape(key)}=.*$"
        new_line = f"{key}={value}"
        if re.search(pattern, content, re.MULTILINE):
            content = re.sub(pattern, new_line, content, flags=re.MULTILINE)
        else:
            content = content.rstrip("\n") + f"\n{new_line}\n"
    else:
        content = f"{key}={value}\n"

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    ip = get_local_ip()
    print(f"[TDC] IP detectada: {ip}")

    base = os.path.dirname(os.path.abspath(__file__))
    backend_env  = os.path.join(base, "backend",  ".env")
    frontend_env = os.path.join(base, "frontend", ".env.local")

    update_env_file(backend_env,  "FRONTEND_URL",  f"http://{ip}:5173/tdc-gym")
    update_env_file(frontend_env, "VITE_API_URL",  f"http://{ip}:8000")

    print(f"[TDC] backend/.env  -> FRONTEND_URL=http://{ip}:5173/tdc-gym")
    print(f"[TDC] frontend/.env.local -> VITE_API_URL=http://{ip}:8000")
    print("[TDC] Archivos actualizados correctamente.")
