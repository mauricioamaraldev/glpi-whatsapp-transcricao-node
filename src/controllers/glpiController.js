import * as glpi from '../services/glpiService.js';
import { transcreverAudio } from '../services/transcriptionService.js';

// Criação do chamado
async function criarChamado(titulo, texto, idRequerente = null, idCategoria = null, idLocalizacao = null) {
  let sessionToken = null;
  try {
    sessionToken = await glpi.initSession();
    const novoChamado = await glpi.createTicket(sessionToken, titulo, texto, idRequerente, idCategoria, idLocalizacao);
    return novoChamado;
  } catch (error) {
    console.error('❌ Erro na criação do chamado:', error.message);
    return null;
  } finally {
    if (sessionToken) await glpi.killSession(sessionToken);
  }
}

async function processarAudio(caminhoDoAudioBase) {
  try {
    const textoTranscrito = await transcreverAudio(caminhoDoAudioBase);
    console.log('Texto transcrito:', textoTranscrito);
  } catch (error) {
    console.error('❌ Erro ao processar áudio:', error.message);
  }
}

export {
  criarChamado,
  processarAudio
};