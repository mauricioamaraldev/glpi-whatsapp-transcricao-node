// src/config/env.js
const variaveis = [
  'GLPI_API_URL',
  'GLPI_APP_TOKEN',
  'GLPI_USER_TOKEN',
  'GROQ_API_KEY',
  'TELEGRAM_API_KEY', // só se ainda usar Telegram, senão remove também
];

for (const variavel of variaveis) {
  if (!process.env[variavel]) {
    throw new Error(`❌ Variável de ambiente obrigatória não encontrada: ${variavel}`);
  }
}

export const config = {
  telegram: {
    apiKey: process.env.TELEGRAM_API_KEY_TESTE,
  },
  glpi: {
    apiUrl: process.env.GLPI_API_URL,
    appToken: process.env.GLPI_APP_TOKEN,
    userToken: process.env.GLPI_USER_TOKEN_TESTE,
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
  },
};
