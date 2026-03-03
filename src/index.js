import {
  criarChamado,
  processarAudio
} from './controllers/glpiController.js';

// Função para abrir um chamado no GLPI
async function aberturaDeChamado() {
  try {
    const titulo = "(WHATSAPP) Chamado aberto via Node.js";
    const descricao = "Chamado aberto automaticamente via script Node.js do WhatsApp.";
    const idRequerente = 182
    const idCategoria = 162
    const idLocalizacao = 1

    // Função para tratar os IDs, garantindo que sejam números ou null
    const tratarId = (valor) => {
      if (valor !== undefined && valor !== null) {
        const limpo = String(valor).trim();
        if (limpo !== '') return Number(limpo);
      }
      return null;
    };

    const autorFinal = tratarId(idRequerente);
    const categoriaFinal = tratarId(idCategoria);
    const localizacaoFinal = tratarId(idLocalizacao);

    // Mandamos tudo pro controlador!
    const ticket = await criarChamado(titulo, descricao, autorFinal, categoriaFinal, localizacaoFinal);

    if (ticket && ticket.id) {
      console.log(`\n✅ SUCESSO! Chamado aberto no GLPI.`);
      console.log(`🎫 ID do Ticket: ${ticket.id}`);
    } else {
      console.log(`\n⚠️ Falha ao criar o chamado.`);
    }

  } catch (error) {
    console.error('\n❌ Erro durante a execução:', error.message);
  }
}

// A função principal que orquestra o processo de transcrição
async function retornaTranscriacao() {
  console.log('🚀 Iniciando teste da esteira de áudio...\n');

  // Coloque aqui o caminho exato do áudio .ogg que você colocou na pasta
  const caminhoDoAudioBase = './src/tests/audio-teste-usuario.ogg';

  try {
    // Processa o áudio e obtém a transcrição
    const texto = await processarAudio(caminhoDoAudioBase);

    console.log('\n✅ RESULTADO FINAL DA TRANSCRIÇÃO:');
    console.log(`"${texto}"\n`);
  } catch (error) {
    console.error('\n❌ O teste de transcrição falhou:', error.message);
  }
}

async function main() {

}

retornaTranscriacao();
//aberturaDeChamado();
