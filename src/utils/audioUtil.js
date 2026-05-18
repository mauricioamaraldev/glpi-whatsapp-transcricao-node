// src/utils/audioUtil.js
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PASTA_TEMP = path.join(__dirname, '..', '..', 'temp');

async function downloadAudio(mediaData, messageId) {
  // Ensure the temp folder exists
  if (!fs.existsSync(PASTA_TEMP)) {
    fs.mkdirSync(PASTA_TEMP, { recursive: true });
  }

  const caminhoArquivo = path.join(PASTA_TEMP, `audio_${messageId}.ogg`);

  // We don't need axios or streams. We just write the base64 string directly to disk!
  await fsPromises.writeFile(caminhoArquivo, mediaData, 'base64');

  return caminhoArquivo;
}

function removerArquivoTemp(caminho) {
  try {
    if (fs.existsSync(caminho)) {
      fs.unlinkSync(caminho);
    }
  } catch (err) {
    console.warn(`⚠️ Não foi possível remover o arquivo temporário: ${caminho}`, err.message);
  }
}

export { downloadAudio, removerArquivoTemp };
