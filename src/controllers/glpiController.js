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
  let dadosDaIA;

  try {
    // 1. Converte o áudio
    await converterOggToMp3(caminhoDoAudioBase, caminhoAudioMp3);

    // 2. IA Primária (Whisper)
    // Usamos 'let' para poder sobrescrever com o texto de teste logo abaixo
    const textoBruto = await transcreverAudio(caminhoAudioMp3);
    console.log("🎙️ IA primaria - Saiu do Whisper:", textoBruto);

    // MOCK (Texto de Teste forçado)
    const textoDeTeste = "E aí, mestre! Tranquilo? Seguinte, a casa caiu aqui na Sala 4. Eu tava de boa tentando abrir o slide da apresentação, mas acho que o bagulho deu gargalo pesado. Do nada, o monitor meteu aquela Blue Screen of Death (BSOD) na minha cara, tá ligado? O pior é que o erro dizia uns códigos lá, tipo 0x000... sei lá o quê, mas não deu pra anotar porque o ventilador aqui da sala tá fazendo um barulho de helicóptero e me distraiu.Eu até tentei dar aquele tapinha técnico na lateral do gabinete pra ver se o HD voltava pro trilho, mas acho que o clock da memória entrou em curto com o ar - condicionado que tá pingando aqui perto. Será que foi porque eu tentei espetar meu pendrive de 2012 que tava na mochila com um resto de farelo de bolacha ? O PC deu um reboot infinito e agora só fica num loop sinistro.O professor já tá me olhando torto e eu só queria saber se tu consegue dar um overclock aí pra ele subir o Windows antes da minha nota virar fumaça.Salva nois!";

    // 3. IA Secundária (Llama 3)
    const textoLimpo = await revisarTextoComIA(textoDeTeste);
    console.log("🧠 IA secundaria - Saiu do Llama 3:", textoLimpo);

    // 4. Sanitização e Parse (AGORA SIM, temos o textoLimpo para ler!)
    const match = textoLimpo.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Nenhum JSON encontrado na resposta da IA.");

    dadosDaIA = JSON.parse(match[0]); // Transforma a string em Objeto
    console.log("📦 JSON Extraído e Seguro!");

    // 5. Devolvemos o OBJETO para o index.js usar
    return dadosDaIA;

  } catch (error) {
    console.error('\n❌ Erro durante o processamento do áudio:', error.message);
    throw error;
  } finally {
    // 6. Limpeza do arquivo MP3 gerado
    try {
      if (fs.existsSync(caminhoAudioMp3)) {
        fs.unlinkSync(caminhoAudioMp3);
        console.log('🧹 Arquivo MP3 temporário removido.');
      }
    } catch (err) {
      console.error('⚠️ Erro ao remover o arquivo MP3 temporário:', err.message);
    }
  }
}

export {
  criarChamado,
  processarAudio
};