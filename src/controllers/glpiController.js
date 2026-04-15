import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as glpi from '../services/glpiService.js';
import { revisarTextoComIA, transcreverAudio } from '../services/transcriptionService.js';
import { converterOggToMp3 } from '../utils/audioConverter.js';

// Configuração de caminhos absolutos (Melhor prática de arquitetura)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Isso garante que a pasta temp fique na raiz do projeto, independente de onde o bot seja iniciado
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
  // 1. Garantia de Infraestrutura
  if (!fs.existsSync(pastaTemp)) {
    fs.mkdirSync(pastaTemp, { recursive: true });
  }

  // 2. Definição única de nomes (Resolvendo o erro de redeclaração)
  const timestamp = Date.now();
  const caminhoMp3 = path.join(pastaTemp, `audio_${timestamp}.mp3`);

  try {
    // 3. Conversão
    await converterOggToMp3(urlAudioTelegram, caminhoMp3);

    // 4. Transcrição
    const textoBruto = await transcreverAudio(caminhoMp3);

    // 5. Inteligência e Refinamento
    const respostaIA = await revisarTextoComIA(textoBruto);

    // 6. Parsing do resultado
    const dadosDaIA = JSON.parse(respostaIA);
    return dadosDaIA;

  } catch (error) {
    console.error('❌ Erro no processamento do áudio:', error.message);
    throw error; // Repassa o erro para o Bot avisar o usuário
  } finally {
    // 7. Limpeza rigorosa (O bloco finally sempre executa, mesmo se der erro)
    if (fs.existsSync(caminhoMp3)) {
      try {
        fs.unlinkSync(caminhoMp3);
      } catch (err) {
        console.error('⚠️ Erro ao deletar temporário:', err.message);
      }
    }
  }
}

export { criarChamado, processarAudio };

