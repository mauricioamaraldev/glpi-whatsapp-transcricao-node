import 'dotenv/config';
import express from 'express';
import { inicializarBot } from "./services/telegramBot.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializa o Bot (ele ficará ouvindo os eventos do Telegram)
inicializarBot();

app.listen(PORT);
