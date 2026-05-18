import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PASTA_TEMP = path.join(__dirname, '..', '..', 'temp');

export async function downloadAudio(mediaData, messageId) {
  await fsPromises.mkdir(PASTA_TEMP, { recursive: true });
  const caminhoArquivo = path.join(PASTA_TEMP, `audio_${messageId}.ogg`);
  await fsPromises.writeFile(caminhoArquivo, mediaData, 'base64');
  return caminhoArquivo;
}

export async function removerArquivoTemp(caminho) {
  try {
    await fsPromises.unlink(caminho);
  } catch {
    // arquivo já removido ou inexistente — ignorar
  }
}
