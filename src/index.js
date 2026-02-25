const glpi = require('./services/glpiService');

async function main() {
  let sessionToken = null;

  try {
    // 1. Iniciar sessão
    sessionToken = await glpi.initSession();

    console.log('2. Criando um novo chamado a partir do texto...');
    const titulo = "(Ignorar)Teste de criação automática de chamado via API";
    const texto = "Teste de criação automática de chamado via API. Este chamado foi criado a partir de um texto pré-definido para demonstrar a funcionalidade de criação de chamados no GLPI usando a API REST.";

    const novoChamado = await glpi.createTicket(sessionToken, titulo, texto);

    console.log(`Chamado criado com sucesso! ID gerado: ${novoChamado.id}\n`);
  } catch (error) {
    console.error('Erro na execução:');
    console.error(error.response ? error.response.data : error.message);
  } finally {
    // 3. Encerrar sessão
    if (sessionToken) {
      try {
        await glpi.killSession(sessionToken);
      } catch (killError) {
        console.error('Erro ao encerrar:', killError.message);
      }
    }
  }
}

main();