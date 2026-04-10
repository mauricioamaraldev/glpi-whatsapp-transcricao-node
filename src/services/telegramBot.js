import 'dotenv/config';
import { Telegraf } from "telegraf";
import { message } from 'telegraf/filters';

async function botTelegram() {
  const bot = new Telegraf(process.env.TELEGRAM_API_KEY)

  bot.launch();

  try {
    bot.start((ctx) => ctx.reply('Bem vindo, aqui está acontecendo um teste de comunicação'))

    bot.on(message('audio'), (ctx) => ctx.reply('Recebi o seu audio'))



  } catch (error) {

  }
}

botTelegram();


