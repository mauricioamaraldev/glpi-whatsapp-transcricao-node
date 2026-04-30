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
await db.schema.hasTable('sessions').then(exists => {
  if (!exists) {
    return db.schema.createTable('sessions', table => {
      table.string('user_id').primary();
      table.string('platform').notNullable();
      table.text('dados_json').notNullable();
      table.integer('tentativas').defaultTo(0);
      table.timestamp('criado_em').defaultTo(db.fn.now());
    });
  }
});

await db.schema.hasTable('ticket_state').then(exists => {
  if (!exists) {
    return db.schema.createTable('ticket_state', table => {
      table.integer('ticket_id').primary();
      table.string('user_id').notNullable();
      table.string('platform').notNullable();
      table.integer('status_glpi').notNullable();
      table.integer('ultimo_followup').defaultTo(0);
      table.timestamp('aberto_em').defaultTo(db.fn.now());
    });
  }
});

// Sessions 
export async function salvarSession(userId, platform, dados) {
  const existe = await db('sessions').where({ user_id: userId }).first();

  if (existe) {
    await db('sessions').where({ user_id: userId }).update({
      dados_json: JSON.stringify(dados),
      tentativas: db.raw('tentativas + 1'),
    });
  } else {
    await db('sessions').insert({
      user_id: userId,
      platform,
      dados_json: JSON.stringify(dados),
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
export async function registrarTicket(ticketId, userId, platform, statusGlpi) {
  const existe = await db('ticket_state').where({ ticket_id: ticketId }).first();
  if (existe) return;

  await db('ticket_state').insert({
    ticket_id: ticketId,
    user_id: userId,
    platform,
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
