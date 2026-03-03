import 'dotenv/config';
import Groq from 'groq-sdk';
import fs from 'fs';

// Configuração do cliente Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function transcreverAudio(caminhoDoAudioBase) {
  try {
    const response = await groq.audio.transcriptions.create({
      file: fs.createReadStream(caminhoDoAudioBase),
      model: "whisper-large-v3",
      response_format: "json",
      // Instrução para o modelo: enfatizar a precisão de termos técnicos relacionados a tecnologia e instituições de ensino
      prompt: "Áudio com termos técnicos de tecnologia e de instituição de ensino, como GLPI, API, Node.js, Datashow, PC, computador, estabilizador, fonte, sala, setor, lugar, ação etc... Transcreva com precisão esses termos.",
      language: "pt"
    });

    return response.text;
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error.message);
    throw error;
  }
};

// Função para revisar o texto transcrito usando IA
async function revisarTextoComIA(textoBruto) {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          // Instrução clara para a IA: corrigir erros de transcrição, mantendo termos técnicos relacionados a tecnologia e instituições de ensino, e entregar um texto final claro e profissional
          content: `Você é um técnico de suporte de uma Universidade responsável por triagem de chamados.
          Sua única missão é ler a transcrição de áudio do usuário e corrigir os erros do reconhecimento de voz, extrai também as informações mais importantes, se houver, como o local do problema, o equipamento envolvido, a ação que o usuário estava tentando realizar e o resultado esperado. se possivel listar as informações extraídas em tópicos.
          
          Regras OBRIGATÓRIAS de correção:
          - O texto final deve ser claro e profissional.
          - O texto final tem que ter titulo, descrição e localização
          - Entregar texto final no formato JSON, seguindo o exemplo:
          {
            "titulo": " o título deve ser curto e direto",
            "descricao": "a descrição deve conter detalhes do problema. Se possível, , o equipamento envolvido, a ação que o usuário estava tentando realizar e o resultado esperado. Liste essas informações em tópicos.",
            "idlocalizacao": "localização do problema, se possível, como sala ou setor. Se não for possível identificar a localização, deixe esse campo como null."
          }
          
          IMPORTANTE: Devolva APENAS o texto corrigido. Não adicione saudações como "Aqui está o texto" ou "Entendido".`
        },
        {
          role: "user",
          content: textoBruto
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