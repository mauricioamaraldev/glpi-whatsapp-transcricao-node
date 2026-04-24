import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PASTA_TEMP = path.join(__dirname, '..', '..', 'temp');

async function downloadAudio(url) {
  if (!fs.existsSync(PASTA_TEMP)) {
    fs.mkdirSync(PASTA_TEMP, { recursive: true });
  }

  const caminhoArquivo = path.join(PASTA_TEMP, `audio_${Date.now()}.mp3`);

  const response = await axios({
    method: 'get',
    url,
    responseType: 'stream',
  });

  await pipeline(response.data, fs.createWriteStream(caminhoArquivo));

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
