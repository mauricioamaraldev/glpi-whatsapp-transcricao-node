import * as glpi from '../services/glpiService.js';
import { transcreverAudio, revisarTextoComIA } from '../services/transcriptionService.js';
import { converterOggToMp3 } from '../utils/audioConverter.js';
import fs from 'fs';

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
  const caminhoAudioMp3 = caminhoDoAudioBase.replace('.ogg', '.mp3');

  try {
    await converterOggToMp3(caminhoDoAudioBase, caminhoAudioMp3);

    const textoBruto = await transcreverAudio(caminhoAudioMp3);
    console.log("IA primaria - Saiu do Whisper:", textoBruto);

    const textoLimpo = await revisarTextoComIA(textoBruto);
    console.log("IA secundaria - Saiu do Llama 3:", textoLimpo);

    console.log('teste')
    return textoLimpo;
  } catch (error) {
    console.error('\n❌ Erro durante o processamento do áudio:', error.message);
    throw error;
  } finally {
    // Limpeza do arquivo MP3 gerado
    try {
      if (fs.existsSync(caminhoAudioMp3)) {
        fs.unlinkSync(caminhoAudioMp3);
        console.log('\n🧹 Arquivo MP3 temporário removido.');
      }
    } catch (err) {
      console.error('Erro ao remover o arquivo MP3 temporário:', err.message);
    }
  }
}

export {
  criarChamado,
  processarAudio
};