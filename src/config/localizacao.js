// src/services/localizacaoService.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as glpiService from './glpiService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAMINHO_CACHE = path.join(__dirname, '..', 'config', 'localizacoes.json');

// Cache em memória — evita ler o arquivo a cada mensagem
let cacheLocalizacoes = null;

/**
 * Retorna a lista de localizações.
 * Na primeira chamada carrega do arquivo. Se o arquivo não existir, busca no GLPI e salva.
 */
export async function listarLocalizacoes() {
  if (cacheLocalizacoes) return cacheLocalizacoes;

  if (fs.existsSync(CAMINHO_CACHE)) {
    const conteudo = fs.readFileSync(CAMINHO_CACHE, 'utf-8');
    cacheLocalizacoes = JSON.parse(conteudo);
    return cacheLocalizacoes;
  }

  // Arquivo não existe — busca no GLPI e cria o arquivo
  cacheLocalizacoes = await sincronizarDoGlpi();
  return cacheLocalizacoes;
}

/**
 * Busca localizações no GLPI, salva no arquivo e atualiza o cache.
 * Chame isso manualmente quando as localizações mudarem no GLPI.
 */
export async function sincronizarDoGlpi() {
  const localizacoes = await glpiService.comSessao(async (sessionToken) => {
    const response = await glpiService.api.get('/Location', {
      headers: { 'Session-Token': sessionToken },
      params: {
        forcedisplay: JSON.stringify([2, 3]),
        range: '0-200',
      },
    });

    const data = response.data;
    if (Array.isArray(data) || Object.keys(data).length === 0) return [];
    return Object.values(data).map(l => ({ id: l[2], nome: l[3] }));
  });

  fs.writeFileSync(CAMINHO_CACHE, JSON.stringify(localizacoes, null, 2), 'utf-8');
  cacheLocalizacoes = localizacoes;

  return localizacoes;
}

/**
 * Formata a lista para exibir ao usuário no WhatsApp.
 */
export function formatarListaParaUsuario(localizacoes) {
  const lista = localizacoes
    .map((l, i) => `${i + 1} - ${l.nome}`)
    .join('\n');

  return `📍 *Qual a localização do problema?*\n\nResponda com o número:\n\n${lista}`;
}

/**
 * Retorna a localização pelo índice que o usuário digitou (começa em 1).
 */
export function resolverPorIndice(localizacoes, indice) {
  const idx = parseInt(indice) - 1;
  if (isNaN(idx) || idx < 0 || idx >= localizacoes.length) return null;
  return localizacoes[idx];
}
