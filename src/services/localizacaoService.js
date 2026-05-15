import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { config } from '../config/env.js';
import { initSession, killSession } from './glpiService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAMINHO_JSON = path.join(__dirname, '..', 'config', 'localizacoes.json');

let cache = null;

export async function listarLocalizacoes() {
  if (cache) return cache;

  if (fs.existsSync(CAMINHO_JSON)) {
    cache = JSON.parse(fs.readFileSync(CAMINHO_JSON, 'utf-8'));
    return cache;
  }

  // Arquivo não existe — busca no GLPI e cria
  return sincronizarDoGlpi();
}

export async function sincronizarDoGlpi() {
  const sessionToken = await initSession();
  try {
    const response = await axios.get(`${config.glpi.apiUrl}/Location`, {
      headers: {
        'App-Token': config.glpi.appToken,
        'Session-Token': sessionToken,
      },
      params: {
        forcedisplay: JSON.stringify([2, 3]),
        range: '0-500',
      },
    });

    const data = response.data;
    const localizacoes = Array.isArray(data)
      ? data.map(l => ({ id: l.id, nome: l.name }))
      : Object.keys(data).length === 0
        ? []
        : Object.values(data).map(l => ({ id: l.id, nome: l.name }));

    fs.writeFileSync(CAMINHO_JSON, JSON.stringify(localizacoes, null, 2), 'utf-8');
    cache = localizacoes;
    return localizacoes;
  } finally {
    await killSession(sessionToken);
  }
}

export async function resolverPorNome(nome) {
  if (!nome) return null;
  const lista = await listarLocalizacoes();
  const nomeLower = nome.toLowerCase().trim();
  return lista.find(l => l.nome.toLowerCase().includes(nomeLower)) ?? null;
}

export async function resolverPorIndice(indice) {
  const lista = await listarLocalizacoes();
  const idx = parseInt(indice) - 1;
  if (isNaN(idx) || idx < 0 || idx >= lista.length) return null;
  return lista[idx];
}

export async function formatarListaLocalizacoes() {
  const lista = await listarLocalizacoes();
  const itens = lista.map((l, i) => `${i + 1} - ${l.nome}`).join('\n');
  return `📍 *Qual a localização do problema?*\n\nResponda com o número:\n\n${itens}`;
}
