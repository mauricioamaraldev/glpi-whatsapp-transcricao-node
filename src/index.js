import { criarChamado, processarAudio } from './controllers/glpiController.js';

async function main() {
  console.log('🚀 Iniciando a esteira completa...\n');
  const caminhoDoAudioBase = './src/tests/audio-teste-usuario.ogg';

  try {
    // PASSO 1: Manda processar o áudio. O Controller vai devolver o Objeto JSON.
    const dadosDaIA = await processarAudio(caminhoDoAudioBase);

    // PASSO 2: Preparar os dados para o GLPI
    const titulo = dadosDaIA.titulo || "Chamado sem título definido";
    const descricao = dadosDaIA.descricao || "Descrição não fornecida.";
    const idRequerente = 182;
    const idCategoria = dadosDaIA.idCategoria || 100; // Categoria padrão

    // O Dicionário de Salas fica aqui perto de onde o chamado será aberto
    const mapaDeLocalizacao = {
      "Sala 1": 1,
      "Sala 2": 2,
      "Sala 4": 55,
      "Padrão": 1
    };
    // Pega a string "Sala 4" do JSON e converte no número 55
    const idLocalizacao = mapaDeLocalizacao[dadosDaIA.localizacao] || mapaDeLocalizacao["Padrão"];

    console.log('\n📝 Injetando dados no GLPI...');

    // PASSO 3: Abrir o chamado de fato
    const ticket = await criarChamado(titulo, descricao, idRequerente, idCategoria, idLocalizacao);

    if (ticket && ticket.id) {
      console.log(`\n✅ SUCESSO ABSOLUTO! Chamado aberto no GLPI.`);
      console.log(`🎫 ID do Ticket: ${ticket.id}`);
    } else {
      console.log(`\n⚠️ Falha ao criar o chamado.`);
    }

  } catch (error) {
    console.error('\n❌ A esteira falhou:', error.message);
  }
}

main();