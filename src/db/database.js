//  src/db/database.js
import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_DIR = path.join(__dirname, '..', '..', 'data');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: path.join(DB_DIR, 'bot.db'),
  },
  useNullAsDefault: true,
});

// Cria as tabelas se não existirem
async function criarTabelas() {
  const temSessions = await db.schema.hasTable('sessions');
  if (!temSessions) {
    await db.schema.createTable('sessions', table => {
      table.string('user_id').primary();
      table.string('estado').notNullable().defaultTo('aguardando_confirmacao');
      table.text('dados_json').notNullable();
      table.integer('tentativas').defaultTo(0);
      table.timestamp('criado_em').defaultTo(db.fn.now());
      table.timestamp('atualizado_em').defaultTo(db.fn.now());
      table.string('login_pendente').nullable();
    });
  }

  const temTicketState = await db.schema.hasTable('ticket_state');
  if (!temTicketState) {
    await db.schema.createTable('ticket_state', table => {
      table.integer('ticket_id').primary();
      table.string('user_id').notNullable();
      table.integer('status_glpi').notNullable();
      table.integer('ultimo_followup').defaultTo(0);
      table.timestamp('aberto_em').defaultTo(db.fn.now());
    });
  }
}


// Sessions 
export async function salvarSession(userId, dados, estado = 'aguardando_confirmacao', loginPendente = null) {
  const existe = await db('sessions').where({ user_id: userId }).first();
  if (existe) {
    await db('sessions').where({ user_id: userId }).update({
      dados_json: JSON.stringify(dados),
      estado,
      login_pendente: loginPendente,
      atualizado_em: new Date().toISOString(),
      tentativas: db.raw('tentativas + 1'),
    });
  } else {
    await db('sessions').insert({
      user_id: userId,
      estado,
      dados_json: JSON.stringify(dados ?? {}),
      login_pendente: loginPendente,
      atualizado_em: new Date().toISOString(),
    });
  }
}

export async function buscarSession(userId) {
  const row = await db('sessions').where({ user_id: userId }).first();
  if (!row) return null;
  return { ...row, dados: JSON.parse(row.dados_json) };
}

export async function deletarSession(userId) {
  await db('sessions').where({ user_id: userId }).delete();
}

// Ticket state
export async function registrarTicket(ticketId, userId, statusGlpi) {
  const existe = await db('ticket_state').where({ ticket_id: ticketId }).first();
  if (existe) return;

  await db('ticket_state').insert({
    ticket_id: ticketId,
    user_id: userId,
    status_glpi: statusGlpi,
  });
}

export async function listarTicketsAbertos() {
  return db('ticket_state').whereNotIn('status_glpi', [5, 6]);
}

export async function atualizarTicketState(ticketId, statusGlpi, ultimoFollowup) {
  await db('ticket_state').where({ ticket_id: ticketId }).update({
    status_glpi: statusGlpi,
    ultimo_followup: ultimoFollowup,
  });
}

export async function removerTicket(ticketId) {
  await db('ticket_state').where({ ticket_id: ticketId }).delete();
}

export async function temSessionAtiva(userId) {
  const row = await db('sessions').where({ user_id: userId }).first();
  return !!row;
}

export async function listarSessionsExpiradas(minutos = 5) {
  const limite = new Date(Date.now() - minutos * 60 * 1000).toISOString();
  return db('sessions').where('atualizado_em', '<', limite);
}

await criarTabelas();
