import { listarSessionsExpiradas, deletarSession } from '../db/database.js';

const TIMEOUT_MINUTOS = 5;
const INTERVALO_MS = 60 * 1000; // verifica a cada 1 minuto

let notificarFn = null;

async function verificarExpiradas() {
  const expiradas = await listarSessionsExpiradas(TIMEOUT_MINUTOS);
  if (expiradas.length === 0) return;

  for (const session of expiradas) {
    await deletarSession(session.user_id);

    // Notifica o usuário se a função de envio estiver disponível
    if (notificarFn) {
      await notificarFn(
        session.user_id,
        `⏰ *Atendimento encerrado por inatividade.*\n\n` +
        `Seu chamado não foi aberto pois não houve resposta por ${TIMEOUT_MINUTOS} minutos.\n` +
        `Se ainda precisar de suporte, envie um novo áudio ou mensagem.`
      ).catch(err => console.warn('[Expiração] Erro ao notificar:', err.message));
    }
  }
}

export function iniciarExpiracaoService(fnNotificar) {
  notificarFn = fnNotificar;
  setInterval(() => verificarExpiradas().catch(console.error), INTERVALO_MS);
}
