import json
import os
import urllib.request

# Configuración
GITLAB_URL = "http://gitlab.casmart.internal/"
TOKEN = "glpat-jauNgrPBW3UhN-bFEtzhyW86MQp1OmsH.01.0w0fgwpkt"
GROUP_ID = "59"  # Reemplaza con el ID numérico de tu grupo

# Construir la petición a la API
url = f"{GITLAB_URL}/api/v4/groups/{GROUP_ID}/projects?include_subgroups=true&per_page=100"
req = urllib.request.Request(url)
req.add_header("PRIVATE-TOKEN", TOKEN)

try:
    with urllib.request.urlopen(req) as response:
        proyectos = json.loads(response.read().decode())

    for p in proyectos:
        nombre = p["name"]
        url_repo = p["http_url_to_repo"]

        # Inyectar token para autenticación automática
        url_autenticada = url_repo.replace("https://", f"https://oauth2:{TOKEN}@")

        print(f"Clonando {nombre}...")
        os.system(f"git clone {url_autenticada}")

except Exception as e:
    print(f"Error al conectar con GitLab: {e}")

