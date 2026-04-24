import * as glpiService from '../services/glpiService.js';
import { transcreverAudio, extrairDadosDoChamado } from '../services/transcriptionService.js';
import { downloadAudio, removerArquivoTemp } from '../utils/audioUtil.js';

function resolverIdRequerente(telegramUserId) {
  return MAPA_USUARIOS[telegramUserId] ?? null;
}

function resolverIdLocalizacao(nomeLocalizacao) {
  if (!nomeLocalizacao) return null;
  return null;
}

async function processarAudio(urlAudio) {
  const caminhoAudio = await downloadAudio(urlAudio);

  try {
    const textoBruto = await transcreverAudio(caminhoAudio);
    const dadosChamado = await extrairDadosDoChamado(textoBruto);
    return dadosChamado;
  } finally {
    // Garante limpeza do arquivo temporário mesmo se a transcrição falhar
    removerArquivoTemp(caminhoAudio);
  }
}

async function abrirChamado({ titulo, descricao, idRequerente, idCategoria, nomeLocalizacao }) {
  const sessionToken = await glpiService.initSession();

  try {
    const ticket = await glpiService.criarTicket(sessionToken, {
      titulo,
      descricao,
      idRequerente: idRequerente ?? 184,
      idCategoria: idCategoria ?? null,
      idLocalizacao: resolverIdLocalizacao(nomeLocalizacao),
    });

    return ticket;
  } finally {
    await glpiService.killSession(sessionToken);
  }
}

export { processarAudio, abrirChamado, resolverIdRequerente };
