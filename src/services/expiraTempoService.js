import { listarSessionsExpiradas, listarSessionsParaAviso, marcarAvisoEnviado, deletarSession } from '../db/database.js';

const TIMEOUT_MINUTOS = 5;
const AVISO_MINUTOS = 3.5;
const INTERVALO_MS = 60 * 1000;

let notificarFn = null;

async function verificarAvisos() {
  const proximas = await listarSessionsParaAviso(AVISO_MINUTOS, TIMEOUT_MINUTOS);
  for (const session of proximas) {
    await marcarAvisoEnviado(session.user_id);
    if (notificarFn) {
      await notificarFn(
        session.user_id,
        `⚠️ *Aviso de inatividade*\n\nSua conversa será encerrada em *1 minuto e meio* por falta de resposta.\n\nResponda para continuar o atendimento.`
      ).catch(err => console.warn('[Expiração] Erro ao enviar aviso:', err.message));
    }
  }
}

async function verificarExpiradas() {
  const expiradas = await listarSessionsExpiradas(TIMEOUT_MINUTOS);
  for (const session of expiradas) {
    await deletarSession(session.user_id);
    if (notificarFn) {
      await notificarFn(
        session.user_id,
        `⏰ *Atendimento encerrado por inatividade.*\n\nSeu chamado não foi aberto pois não houve resposta por ${TIMEOUT_MINUTOS} minutos.\nSe ainda precisar de suporte, envie um novo áudio ou mensagem.`
      ).catch(err => console.warn('[Expiração] Erro ao notificar:', err.message));
    }
  }
}

async function executarCiclo() {
  await verificarAvisos();
  await verificarExpiradas();
}

export function iniciarExpiracaoService(fnNotificar) {
  notificarFn = fnNotificar;
  setInterval(() => executarCiclo().catch(console.error), INTERVALO_MS);
}
