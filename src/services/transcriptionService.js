import 'dotenv/config';
import Groq from 'groq-sdk';
import fs from 'fs';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function transcreverAudio(caminhoDoAudioBase) {
  try {
    const response = await groq.audio.transcriptions.create({
      file: fs.createReadStream(caminhoDoAudioBase),
      model: "whisper-large-v3",
      response_format: "json",
      prompt: "Áudio com termos técnicos de tecnologia e de instituição de ensino, como GLPI, API, Node.js, Datashow, PC, computador, estabilizador, fonte, sala, setor, lugar, ação etc... Transcreva com precisão esses termos.",
      language: "pt"
    });

    return response.text;
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error.message);
    throw error;
  }
};

async function revisarTextoComIA(textoBruto) {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `Você é um Técnico de Suporte de uma Universidade responsável por triagem de chamados.
          Sua única missão é ler a transcrição de áudio do usuário e corrigir os erros do reconhecimento de voz.
          
          Regras OBRIGATÓRIAS de correção:
          - O texto final deve ser claro e profissional.
          
          IMPORTANTE: Devolva APENAS o texto corrigido. Não adicione saudações como "Aqui está o texto" ou "Entendido".`
        },
        {
          role: "user",
          content: textoBruto // Aqui entra o texto sujo que veio do Whisper
        }
      ],
    });
    return completion.choices[0]?.message?.content;
  } catch (error) {
    console.error('Erro ao revisar texto com IA:', error.message);
    throw error;
  }
}

export { transcreverAudio, revisarTextoComIA };