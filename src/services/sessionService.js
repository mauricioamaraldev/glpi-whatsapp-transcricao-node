// src/services/secaoService.js
// Mapa em memória: chave = número do WhatsApp, valor = dados da sessão
const sessions = new Map();

export function salvarSession(numeroUsuario, dados) {
  sessions.set(numeroUsuario, {
    dados,
    criadoEm: Date.now(),
  });
}

export function buscarSession(numeroUsuario) {
  return sessions.get(numeroUsuario) ?? null;
}


export function deletarSession(numeroUsuario) {
  sessions.delete(numeroUsuario);
}


export function temSessionAtiva(numeroUsuario) {
  return sessions.has(numeroUsuario);
}
