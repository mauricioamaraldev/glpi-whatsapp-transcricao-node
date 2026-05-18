import fs from 'fs';
import Groq from 'groq-sdk';
import { config } from '../config/env.js';
import { PROMPT_TRANSCRICAO, PROMPT_EXTRACAO, PROMPT_CORRECAO } from '../config/prompts.js';

const groq = new Groq({ apiKey: config.groq.apiKey });

async function transcreverAudio(caminhoAudio) {
  const response = await groq.audio.transcriptions.create({
    file: fs.createReadStream(caminhoAudio),
    model: "whisper-large-v3",
    response_format: "json",
    // Instrução para o modelo: enfatizar a precisão de termos técnicos relacionados a tecnologia e instituições de ensino
    prompt: PROMPT_TRANSCRICAO,
    language: "pt"
  });

  return response.text;
}

async function extrairDadosDoChamado(textoBruto) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    // 🔒 TRAVA 1: Obriga a infraestrutura da Groq a cuspir apenas um JSON válido
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        // Instrução clara para a IA
        content: PROMPT_EXTRACAO
      },
      {
        role: "user",
        content: textoBruto
      }
    ],
  });

  const conteudo = completion.choices[0]?.message?.content;

  if (!conteudo) {
    throw new Error('A IA retornou uma resposta vazia.');
  }

  let dados;
  try {
    dados = JSON.parse(conteudo);
  } catch {
    throw new Error(`A IA retornou um JSON inválido: ${conteudo}`);
  }

  if (!dados.titulo || !dados.descricao) {
    throw new Error(`A IA não retornou os campos obrigatórios. Resposta: ${conteudo}`);
  }

  return dados;
}

async function aplicarCorrecao(dadosAnteriores, correcaoUsuario) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: 'system', content: PROMPT_CORRECAO },
      { role: 'assistant', content: JSON.stringify(dadosAnteriores) },
      { role: 'user', content: `Corrija os dados acima: "${correcaoUsuario}"` },
    ],
  });

  const conteudo = completion.choices[0]?.message?.content;
  if (!conteudo) throw new Error('A IA retornou resposta vazia na correção.');

  let dados;
  try {
    dados = JSON.parse(conteudo);
  } catch {
    throw new Error(`JSON inválido na correção: ${conteudo}`);
  }

  if (!dados.titulo || !dados.descricao) {
    throw new Error(`Campos obrigatórios ausentes na correção: ${conteudo}`);
  }

  return dados;
}

export { transcreverAudio, extrairDadosDoChamado, aplicarCorrecao };
