// src/bot/botWhatsapp.js
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { processarAudio, abrirChamado } from '../controllers/chamadoController.js';

const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp conectado!');
});

client.on('disconnected', async (reason) => {
  console.warn('⚠️ Desconectado:', reason);
  await client.initialize(); // reconecta e gera novo QR se necessário
});

client.on('auth_failure', async (msg) => {
  console.error('❌ Falha de autenticação:', msg);
  await client.initialize();
});

client.on('message', async (msg) => {
  const contact = await msg.getContact();
  const numberTelefone = contact.id.user;

  if (msg.type === 'ptt' || msg.type === 'audio') {
    console.log(msg)
    console.log(msg)
    return;
  }

  if (msg.type === 'chat') {
    console.log(msg)
    return;
  }

  console.log('contact.id.user:', numberTelefone.slice(-8));
});

export function inicializarBotWhatsapp() {
  client.initialize();
  console.log('🤖 Bot iniciado com sucesso!');
}
