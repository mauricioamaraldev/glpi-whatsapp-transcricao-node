import { Telegraf } from 'telegraf';
import { config } from '../config/env.js';
import { processarAudio, abrirChamado } from '../controllers/chamadoController.js';

const bot = new Telegraf(config.telegram.apiKey);

bot.on(['voice', 'audio'], async (ctx) => {
  // Informar o usuário que o processamento começou
  await ctx.reply('🎙️ Áudio recebido! Estou transcrevendo e analisando...');

  try {
    // Obter URL do arquivo de áudio
    const fileId = ctx.message.voice?.file_id ?? ctx.message.audio?.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);

    // Processar áudio e extrair dados via IA
    const dadosChamado = await processarAudio(fileLink.href);

    // Abrir chamado no GLPI
    const ticket = await abrirChamado({
      titulo: dadosChamado.titulo,
      descricao: dadosChamado.descricao,
      idRequerente: 'teste',
      idCategoria: dadosChamado.idCategoria,
      nomeLocalizacao: dadosChamado.idLocalizacao,
    });

    // 6. Confirmar abertura para o usuário
    await ctx.reply(
      `✅ Chamado aberto com sucesso!\n\n` +
      `🎫 *ID:* ${ticket.id}\n` +
      `📌 *Título:* ${dadosChamado.titulo}\n` +
      `📝 *Descrição:* ${dadosChamado.descricao}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('❌ Erro ao processar áudio:', error.message);
    await ctx.reply('⚠️ Desculpe, houve um erro ao processar seu chamado. Tente novamente.');
  }
});


export function inicializarBot() {
  bot.launch();
  console.log('🤖 Bot iniciado com sucesso!');

  // Graceful shutdown: encerra o bot corretamente ao parar o processo
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
