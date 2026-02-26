import 'dotenv/config';
import Groq from 'groq-sdk';
import fs from 'fs';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function transcreverAudio(caminhoDoAudioBase) {
  try {
    const response = await groq.audio.transcriptions.create({
      file: fs.createReadStream(caminhoDoAudioBase),
      model: "whisper-large-v3-turbo",
      response_format: "json",
      language: "pt"
    });

    return response.text;
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error.message);
    throw error;
  }
};

export { transcreverAudio };