# -*- coding: utf-8 -*-
"""
Configuração OAuth 100% isolada para o Novo Canal Infantil (Tico & A Vila das Cores).
Como usar:
  1. Na NOVA Conta Google do canal infantil, crie um Projeto no Google Cloud Console.
  2. Ative a API "YouTube Data API v3" e crie uma credencial OAuth Desktop App.
  3. Baixe o JSON e salve como: VilaDasCoresStudio/_kids_secrets/client_secret_kids.json
  4. Rode: python pipeline/setup_kids_youtube_auth.py
  5. Faça login na NOVA Conta Google do canal infantil -> gera KIDS_YOUTUBE_TOKEN_B64 automaticamente!
"""
import base64
import json
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

from config import SECRETS_DIR

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
]


def main():
    SECRETS_DIR.mkdir(parents=True, exist_ok=True)
    secret_json = SECRETS_DIR / "client_secret_kids.json"
    if not secret_json.exists():
        print(f"[ERRO] Arquivo não encontrado: {secret_json}")
        print("Baixe o OAuth Desktop JSON do NOVO Projeto GCP do canal infantil e salve nesse caminho.")
        return

    flow = InstalledAppFlow.from_client_secrets_file(str(secret_json), SCOPES)
    creds = flow.run_local_server(port=0, prompt="consent", access_type="offline")

    token_payload = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": list(creds.scopes or SCOPES),
    }
    b64 = base64.b64encode(json.dumps(token_payload).encode("utf-8")).decode("utf-8")

    out_file = SECRETS_DIR / "kids_youtube_token_b64.txt"
    out_file.write_text(b64, encoding="utf-8")
    print("\n============================================================")
    print("SUCESSO! Token OAuth isolado salvo em:")
    print(f"  {out_file}")
    print("\nPara o GitHub Actions do NOVO repositório, crie o secret:")
    print("  Nome:  KIDS_YOUTUBE_TOKEN_B64")
    print("  Valor: (conteúdo de kids_youtube_token_b64.txt)")
    print("============================================================")


if __name__ == "__main__":
    main()
