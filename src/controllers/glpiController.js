import axios from 'axios'; // Adicionado para realizar o download
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises'; // Melhor prática para lidar com streams
import { fileURLToPath } from 'url';
import * as glpi from '../services/glpiService.js';
import { revisarTextoComIA, transcreverAudio } from '../services/transcriptionService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pastaTemp = path.join(__dirname, '..', '..', 'temp');

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

async function processarAudio(urlAudioTelegram) {
  if (!fs.existsSync(pastaTemp)) {
    fs.mkdirSync(pastaTemp, { recursive: true });
  }

  const timestamp = Date.now();
  const caminhoArquivo = path.join(pastaTemp, `audio_${timestamp}.mp3`);

  try {
    // 1. Download do áudio via Stream (Substitui o conversor)
    const response = await axios({
      method: 'get',
      url: urlAudioTelegram,
      responseType: 'stream',
    });

    await pipeline(response.data, fs.createWriteStream(caminhoArquivo));

    // 2. Transcrição (Envia o arquivo bruto para a Groq)
    const textoBruto = await transcreverAudio(caminhoArquivo);

    // 3. Inteligência e Refinamento
    const respostaIA = await revisarTextoComIA(textoBruto);

    // 4. Parsing do resultado
    return JSON.parse(respostaIA);

  } catch (error) {
    console.error('❌ Erro no processamento do áudio:', error.message);
    throw error;
  } finally {
    // 5. Limpeza de rastro (Fundamental para não encher o seu Precision 5860)
    if (fs.existsSync(caminhoArquivo)) {
      try {
        fs.unlinkSync(caminhoArquivo);
      } catch (err) {
        console.error('⚠️ Erro ao deletar temporário:', err.message);
      }
    }
  }
}

export { criarChamado, processarAudio };

