// src/controllers/chamadoController.js
import { resolverPorNome } from '../services/localizacaoService.js';
import * as glpiService from '../services/glpiService.js';
import { transcreverAudio, extrairDadosDoChamado } from '../services/transcriptionService.js';
import { downloadAudio, removerArquivoTemp } from '../utils/audioUtil.js';

async function resolverIdLocalizacao(nomeLocalizacao) {
  if (!nomeLocalizacao) return null;
  const loc = await resolverPorNome(nomeLocalizacao);
  return loc?.id ?? null;
}

async function processarAudio(media, messageId) {
  const caminhoAudio = await downloadAudio(media.data, messageId);

  try {
    const textoBruto = await transcreverAudio(caminhoAudio);
    const dadosChamado = await extrairDadosDoChamado(textoBruto);
    return dadosChamado;
  } catch (error) {
    console.error('Erro durante a transcrição ou extração:', error);
    throw error;
  } finally {
    removerArquivoTemp(caminhoAudio);
  }
}

async function abrirChamado({ titulo, descricao, telefone, idCategoria }) {
  const sessionToken = await glpiService.initSession();
  try {
    const usuarioGlpi = await glpiService.buscarUsuarioPorCelular(sessionToken, telefone);

    if (!usuarioGlpi) throw new Error('USUARIO_NAO_ENCONTRADO');

    console.log(`[Controller] 👤 ${usuarioGlpi.nome} (ID: ${usuarioGlpi.id}) | Local: ${usuarioGlpi.localizacao}`);

    // Busca o ID da localização pelo nome que veio do perfil
    const idLocalizacao = await resolverIdLocalizacao(usuarioGlpi.localizacao);

    const ticket = await glpiService.criarTicket(sessionToken, {
      titulo,
      descricao,
      idRequerente: usuarioGlpi.id,
      idCategoria: idCategoria ?? null,
      idLocalizacao,
    });

    return { ...ticket, localizacao: usuarioGlpi.localizacao, nome: usuarioGlpi.nome };
  } finally {
    await glpiService.killSession(sessionToken);
  }
}

export async function verificarDadosParaAbertura(telefone) {
  const sessionToken = await glpiService.initSession();
  try {
    const usuarioGlpi = await glpiService.buscarUsuarioPorCelular(sessionToken, telefone);
    if (!usuarioGlpi) throw new Error('USUARIO_NAO_ENCONTRADO');
    return {
      precisaLocalizacao: !usuarioGlpi.localizacao,
      usuario: usuarioGlpi,
    };
  } finally {
    await glpiService.killSession(sessionToken);
  }
}

export { processarAudio, abrirChamado };
