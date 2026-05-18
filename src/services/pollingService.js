import { listarTicketsAbertos, atualizarTicketState, removerTicket } from '../db/database.js';
import * as glpiService from './glpiService.js';

const STATUS_LABEL = {
  1: '🆕 Novo',
  2: '⚙️ Em andamento',
  3: '⚙️ Em andamento (planejado)',
  4: '⏳ Aguardando retorno',
  5: '✅ Resolvido',
  6: '🔒 Fechado',
};

const STATUS_ENCERRADO = [5, 6];

async function verificarTicket(sessionToken, ticket, notificar) {
  const response = await glpiService.buscarEstadoTicket(sessionToken, ticket.ticket_id);
  if (!response) return;

  const mudancas = [];

  // Mudança de status
  if (response.status !== ticket.status_glpi) {
    const label = STATUS_LABEL[response.status] ?? `Status ${response.status}`;
    mudancas.push(`📋 *Status:* ${label}`);
  }

  // Novos followups (comentários do técnico)
  const novos = response.followups.filter(f => f.id > ticket.ultimo_followup);
  for (const f of novos) {
    const texto = f.conteudo.replace(/<[^>]*>/g, '').trim();
    if (texto) mudancas.push(`💬 *Técnico:*\n${texto}`);
  }

  if (mudancas.length > 0) {
    const ultimoId = novos.length > 0
      ? Math.max(...novos.map(f => f.id))
      : ticket.ultimo_followup;

    await notificar(
      ticket.user_id,
      `🔔 *Atualização no chamado #${ticket.ticket_id}*\n\n` + mudancas.join('\n\n')
    );
    await atualizarTicketState(ticket.ticket_id, response.status, ultimoId);
  }

  if (STATUS_ENCERRADO.includes(response.status)) {
    await removerTicket(ticket.ticket_id);
  }
}

async function executarCiclo(notificar) {
  const tickets = await listarTicketsAbertos();
  if (tickets.length === 0) return;

  const sessionToken = await glpiService.initSession();
  try {
    for (const ticket of tickets) {
      await verificarTicket(sessionToken, ticket, notificar).catch(err =>
        console.error(`[Polling] Erro no ticket #${ticket.ticket_id}:`, err.message)
      );
    }
  } finally {
    await glpiService.killSession(sessionToken);
  }
}

export function iniciarPolling(notificar, intervaloMs = 5 * 60 * 1000) {
  console.log(`[Polling] 🔄 Iniciado — verificando a cada ${intervaloMs / 1000}s`);
  executarCiclo(notificar).catch(console.error);
  setInterval(() => executarCiclo(notificar).catch(console.error), intervaloMs);
}
