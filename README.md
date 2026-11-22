# 🌈 Tico & A Vila das Cores — Estúdio Autônomo de Série Infantil (Full HD 1080p)

Infraestrutura **100% isolada** para produção diária da série animada infantil **Tico & A Vila das Cores** (público 2–5 anos, PT-BR), sem compartilhar nenhuma cota, chave API ou minutos do `ReactFactory`.

---

## 📁 Estrutura do Projeto

- `branding/` — **Kit de Identidade Visual Oficial** pronto para subir no YouTube Studio:
  - `logo_canal_800x800.png` (Foto de perfil circular)
  - `banner_canal_2560x1440.png` (Banner TV + Desktop + Celular com área segura `1546×423`)
  - `watermark_150x150.png` (Marca d'água PNG transparente)
  - `thumb_ep01_1280x720.png` (Thumbnail padrão oficial de alto CTR)
  - `canal_metadata.txt` (Nome, `@handle`, descrição pronta, tags e configuração COPPA)
- `data/series_bible.json` — Bíblia da série (cores travadas, elenco extensível, vozes Gemini TTS e direção de atuação).
- `data/series_memory.json` — Memória contínua de episódios e arco da Temporada 1.
- `pipeline/` — Motor de produção:
  - `showrunner.py` — Roteirista IA com continuidade entre episódios.
  - `voice_studio.py` — Dublagem multi-personagem via **Gemini TTS** (vozes humanas distintas + direção de atuação) + extrator de **lip-sync fonético (6 visemas @ 24fps)**.
  - `music_sfx.py` — Trilha musical infantil + efeitos cartoon.
  - `youtube_kids_uploader.py` — Upload dedicado marcado como `selfDeclaredMadeForKids: true` + thumbnail + playlist.
  - `test_voices.py` — Gera amostra de 20s com os 4 personagens para aprovar as novas vozes.
  - `setup_kids_youtube_auth.py` — Gera `KIDS_YOUTUBE_TOKEN_B64` para o novo canal.
  - `run_episode.py` — Orquestrador completo (roteiro → vozes → render 1080p → thumb → upload).
- `studio/` — Motor **Remotion Full HD 1920×1080** com personagens modulares (`src/characters/`).

---

## 🚀 Checklist Rápido de Ativação (100% Isolado)

### 1. Na NOVA Conta Google (do canal infantil)
1. Crie o canal **Tico & A Vila das Cores** e suba os arquivos da pasta `branding/` no YouTube Studio.
2. Em **Configurações → Canal → Configurações avançadas**, marque **"Sim, configurar este canal como conteúdo para crianças"**.
3. Crie uma **nova Gemini API Key** em [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
4. No Google Cloud Console da nova conta, crie um Projeto novo → ative **YouTube Data API v3** → crie credencial **OAuth Desktop App** → salve o JSON em `_kids_secrets/client_secret_kids.json`.

### 2. Conectar localmente e testar as vozes novas
```powershell
copy .env.example .env
# Cole sua nova KIDS_GEMINI_API_KEY no arquivo .env

python pipeline/test_voices.py
# Ouça output/teste_vozes_elenco.mp3 com as novas vozes humanas do Gemini TTS!

python pipeline/setup_kids_youtube_auth.py
# Autorize o novo canal -> gera _kids_secrets/kids_youtube_token_b64.txt
```

### 3. Subir para um NOVO Repositório GitHub (Isolado)
1. Crie um repositório novo (preferencialmente em conta GitHub dedicada ou público).
2. Suba a pasta `VilaDasCoresStudio` como raiz do novo repositório.
3. Em **Settings → Secrets and variables → Actions**, adicione apenas os 3 secrets exclusivos:
   - `KIDS_GEMINI_API_KEY`
   - `KIDS_YOUTUBE_TOKEN_B64`
   - `KIDS_SEASON1_PLAYLIST_ID` (opcional)
4. Rode o workflow **Tico & A Vila das Cores — Episódio Diário 1080p** manualmente como `unlisted` para o 1º teste; depois descomente o `schedule` em `.github/workflows/daily_episode.yml` para rodar todo dia automaticamente!

---

## ➕ Como Adicionar Novos Personagens no Futuro
1. Cadastre o novo personagem em `data/series_bible.json` (com sua voz Gemini TTS própria e personalidade).
2. Crie o Rig SVG dele em `studio/src/characters/NovoPersonagem.tsx` e registre 1 linha em `studio/src/characters/index.ts`.
3. Pronto! O Showrunner automaticamente passa a escrever episódios com o novo integrante mantendo 100% de consistência visual e vocal.
