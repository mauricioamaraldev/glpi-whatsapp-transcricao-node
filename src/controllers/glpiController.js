const glpi = require('../services/glpiService'); // Note o '../' para voltar uma pasta

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

module.exports = {
  criarChamado
};