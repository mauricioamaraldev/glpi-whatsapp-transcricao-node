import fs from 'fs';
import Groq from 'groq-sdk';
import { config } from '../config/env.js';

const groq = new Groq({ apiKey: config.groq.apiKey });

async function transcreverAudio(caminhoAudio) {
  const response = await groq.audio.transcriptions.create({
    file: fs.createReadStream(caminhoAudio),
    model: "whisper-large-v3",
    response_format: "json",
    // Instrução para o modelo: enfatizar a precisão de termos técnicos relacionados a tecnologia e instituições de ensino
    prompt: "Áudio com termos técnicos de tecnologia e de instituição de ensino, como GLPI, API, Node.js, Datashow, PC, computador, estabilizador, fonte, sala, setor, lugar, ação etc... Transcreva com precisão esses termos.",
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
        content: `Você é um técnico de suporte de uma Universidade responsável por triagem de chamados.
          Sua única missão é ler a transcrição de áudio do usuário e corrigir os erros do reconhecimento de voz, extraindo também as informações mais importantes, se houver, como o local do problema, o equipamento envolvido, a ação que o usuário estava tentando realizar e o resultado esperado.
          
          Regras OBRIGATÓRIAS de correção:
          - O texto final deve ser claro e profissional.
          - Entregar texto final OBRIGATORIAMENTE no formato JSON.
          
          🔒 TRAVA 2: REGRAS DE SINTAXE JSON (CRÍTICO PARA O SISTEMA NÃO QUEBRAR):
          1. JAMAIS use aspas duplas ("") dentro dos valores de texto. Se precisar destacar uma palavra, use aspas simples ('').
          2. JAMAIS faça quebras de linha reais (Enter) dentro da string da descrição. Para pular linha ou criar tópicos, você DEVE escrever literalmente os caracteres \\n no texto.
          
          Exemplo exato de saída esperada (siga esta formatação estritamente):
          // Dentro de revisarTextoComIA, altere o exemplo no System Prompt e coloque "(TESTE API)" no inicio do titulo:
          {
            "titulo": "Problema no PC da Sala 4",
            "descricao": "O usuário relatou uma falha...",
            "idLocalizacao": "Sala 4",
            "idCategoria": 100
          }
            `
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

export { transcreverAudio, extrairDadosDoChamado };
