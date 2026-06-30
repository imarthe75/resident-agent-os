import os
import urllib3
from flask import Flask, request, redirect, jsonify, Response
import requests

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)
AUTHENTIK_BASE = os.environ.get("AUTHENTIK_BASE", "https://10.4.3.208")
OIDC_APP_SLUG = os.environ.get("OIDC_APP_SLUG", "plane")


@app.route("/login/oauth/authorize")
def authorize():
    params = request.query_string.decode()
    return redirect(f"{AUTHENTIK_BASE}/application/o/authorize/?{params}", 302)


@app.route("/login/oauth/access_token", methods=["POST", "GET"])
def token():
    resp = requests.post(
        f"{AUTHENTIK_BASE}/application/o/token/",
        data=request.form,
        headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
        verify=False,
    )
    return Response(
        resp.content,
        status=resp.status_code,
        content_type=resp.headers.get("Content-Type", "application/json"),
    )


@app.route("/api/v1/user")
def userinfo():
    auth_header = request.headers.get("Authorization", "")
    resp = requests.get(
        f"{AUTHENTIK_BASE}/application/o/userinfo/",
        headers={"Authorization": auth_header},
        verify=False,
    )
    if not resp.ok:
        return Response(resp.content, status=resp.status_code)

    oidc = resp.json()
    # Translate OIDC standard fields to Gitea-compatible format expected by Plane
    gitea = {
        "id": oidc.get("sub", ""),
        "email": oidc.get("email", ""),
        "full_name": oidc.get("name", ""),
        "login": oidc.get("preferred_username", oidc.get("email", "").split("@")[0]),
        "avatar_url": oidc.get("picture", ""),
        "restricted": False,
        "active": True,
    }
    return jsonify(gitea)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
