const glpiController = require('./controllers/glpiController');

async function main() {

  try {
    const titulo = "Requisição do banco de dados"
    const texto = "Requisição do banco de dados"
    const idRequerente = "Requisição do banco de dados"
    const idCategoria = "Requisição do banco de dados"
    const idLocalizacao = "Requisição do banco de dados"

    console.log('\n⏳ Conectando ao GLPI e abrindo chamado...');

    // Função auxiliar para converter o que você digitou em número (ou null se vazio)
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
    const ticket = await glpiController.criarChamado(titulo, texto, autorFinal, categoriaFinal, localizacaoFinal);

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

main();