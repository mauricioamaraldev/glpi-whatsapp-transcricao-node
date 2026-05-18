const REQUIRED_VARS = ['GLPI_API_URL', 'GLPI_APP_TOKEN', 'GLPI_USER_TOKEN', 'GROQ_API_KEY'];

for (const v of REQUIRED_VARS) {
  if (!process.env[v]) {
    throw new Error(`Variável de ambiente obrigatória não encontrada: ${v}`);
  }
}

export const config = {
  glpi: {
    apiUrl: process.env.GLPI_API_URL,
    appToken: process.env.GLPI_APP_TOKEN,
    userToken: process.env.GLPI_USER_TOKEN,
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
  },
};
