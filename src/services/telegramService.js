import 'dotenv/config';
import { Telegraf } from "telegraf";
import { criarChamado, processarAudio } from "../controllers/glpiController.js";

const bot = new Telegraf(process.env.TELEGRAM_API_KEY);

export function inicializarBot() {
  bot.on(['voice', 'audio'], async (ctx) => {
    try {
      const usuario = ctx.from;
      console.log(ctx.message)

      const fileId = ctx.message.voice ? ctx.message.voice.file_id : ctx.message.audio.file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);
      const urlAudio = fileLink.href;

      console.log('Passou pela variavies')
      ctx.reply("Áudio recebido! Estou transcrevendo e analisando...");

      // Chama o controller (A lógica de negócio fica lá)
      const dadosDaIA = await processarAudio(urlAudio);

      // Mapeamento de Localização (Pode ser movido para um arquivo de config depois)
      const mapaDeLocalizacao = { "Sala 1": 1, "Sala 2": 2, "Sala 4": 55, "Padrão": 1 };
      const idLocalizacao = mapaDeLocalizacao[dadosDaIA.idlocalizacao] || mapaDeLocalizacao["Padrão"];

      const ticket = await criarChamado(
        dadosDaIA.titulo,
        dadosDaIA.descricao,
        182, // idRequerente fixo por enquanto
        dadosDaIA.idCategoria || 100,
        idLocalizacao
      );
      console.log('Passou pela Vai abrir o chamado')
      if (ticket && ticket.id) {
        ctx.reply(`✅ Chamado aberto com sucesso!\n🎫 ID: ${ticket.id}\n📌 Título: ${dadosDaIA.titulo}\n Descrição: ${dadosDaIA.descricao}`);
      }
    } catch (error) {
      console.error("❌ Falha na esteira:", error.message);
      ctx.reply("⚠️ Desculpe, houve um erro ao processar seu chamado.");
    }
  });

  bot.launch();
}
