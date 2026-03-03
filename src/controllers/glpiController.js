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

// Função principal que orquestra o processo de transcrição
async function processarAudio(caminhoDoAudioBase) {
  const caminhoAudioMp3 = caminhoDoAudioBase.replace('.ogg', '.mp3');

  try {
    await converterOggToMp3(caminhoDoAudioBase, caminhoAudioMp3);

    const textoBruto = await transcreverAudio(caminhoAudioMp3);
    console.log("IA primaria - Saiu do Whisper:", textoBruto);

    const textoTeste = "E aí, mestre! Tranquilo? Seguinte, a casa caiu aqui na Sala 4. Eu tava de boa tentando abrir o slide da apresentação, mas acho que o bagulho deu gargalo pesado. Do nada, o monitor meteu aquela Blue Screen of Death (BSOD) na minha cara, tá ligado? O pior é que o erro dizia uns códigos lá, tipo 0x000... sei lá o quê, mas não deu pra anotar porque o ventilador aqui da sala tá fazendo um barulho de helicóptero e me distraiu.Eu até tentei dar aquele tapinha técnico na lateral do gabinete pra ver se o HD voltava pro trilho, mas acho que o clock da memória entrou em curto com o ar - condicionado que tá pingando aqui perto. Será que foi porque eu tentei espetar meu pendrive de 2012 que tava na mochila com um resto de farelo de bolacha ? O PC deu um reboot infinito e agora só fica num loop sinistro.O professor já tá me olhando torto e eu só queria saber se tu consegue dar um overclock aí pra ele subir o Windows antes da minha nota virar fumaça.Salva nois!";
    const textoLimpo = await revisarTextoComIA(textoTeste);
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