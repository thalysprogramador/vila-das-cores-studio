/**
 * ============================================================================
 * DISPARADOR PONTUAL — TICO & A VILA DAS CORES (Google Apps Script)
 * Evita atrasos do cron nativo do GitHub Actions e NÃO encosta no ReactFactory!
 * ============================================================================
 *
 * COMO CONFIGURAR (leva 2 minutos):
 * 1. Abra https://script.google.com na NOVA Conta Google do canal infantil.
 * 2. Clique em "Novo projeto" e cole todo este código.
 * 3. Preencha GITHUB_OWNER, GITHUB_REPO e GITHUB_PAT (Personal Access Token
 *    com permissão "Actions: Read and write" ou escopo "workflow" do NOVO repo).
 * 4. No menu esquerdo (ícone de relógio "Acionadores" / Triggers):
 *    - Clique em "+ Adicionar acionador"
 *    - Função: dispararEpisodioDiario
 *    - Origem do evento: Baseado no tempo
 *    - Tipo: Contador de dias -> 07h às 08h (horário de Brasília — fora do pico do ReactFactory!)
 *    - Quando quiser escalar para 3 eps/dia, adicione mais 2 acionadores (13h e 18h)!
 */

const CONFIG = {
  GITHUB_OWNER: "thalysprogramador",
  GITHUB_REPO: "vila-das-cores-studio",
  WORKFLOW_FILE: "daily_episode.yml",
  BRANCH: "main",
  PRIVACY: "public",
  GITHUB_PAT: "COLE_SEU_TOKEN_GITHUB_AQUI",
};

function dispararEpisodioDiario() {
  const url = `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/actions/workflows/${CONFIG.WORKFLOW_FILE}/dispatches`;
  const payload = {
    ref: CONFIG.BRANCH,
    inputs: {
      privacy: CONFIG.PRIVACY,
    },
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: `Bearer ${CONFIG.GITHUB_PAT}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const resp = UrlFetchApp.fetch(url, options);
  const code = resp.getResponseCode();
  if (code === 204) {
    Logger.log("✅ Episódio + 2 Shorts disparados com sucesso no GitHub Actions!");
  } else {
    throw new Error(`❌ Erro ao disparar GitHub Actions (HTTP ${code}): ${resp.getContentText()}`);
  }
}
