import 'dotenv/config';
import { inicializarBot } from "./services/telegramService.js";

// Inicializa o Bot (ele ficará ouvindo os eventos do Telegram)
inicializarBot();
