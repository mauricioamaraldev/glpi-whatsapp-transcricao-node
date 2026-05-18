import axios from 'axios';
import { config } from '../config/env.js';

const api = axios.create({
  baseURL: config.glpi.apiUrl,
  headers: {
    'App-Token': config.glpi.appToken,
    'Content-Type': 'application/json',
  },
});

export async function initSession() {
  const response = await api.get('/initSession', {
    headers: { Authorization: `user_token ${config.glpi.userToken}` },
  });
  return response.data.session_token;
}

export async function killSession(sessionToken) {
  await api.get('/killSession', {
    headers: { 'Session-Token': sessionToken },
  });
}

export async function criarTicket(sessionToken, { titulo, descricao, idRequerente, idCategoria, idLocalizacao }) {
  const payload = {
    input: {
      name: titulo,
      content: descricao,
      status: 1,
      urgency: 3,
      type: 2,
    },
  };

  if (idCategoria) payload.input.itilcategories_id = idCategoria;
  if (idLocalizacao) payload.input.locations_id = idLocalizacao;
  if (idRequerente) payload.input._users_id_requester = idRequerente;

  const response = await api.post('/Ticket', payload, {
    headers: { 'Session-Token': sessionToken },
  });

  return response.data[0] || response.data;
}

export async function buscarUsuarioPorCelular(sessionToken, celularWhatsApp) {
  const limpo = String(celularWhatsApp).replace(/\D/g, '');
  const semPais = limpo.startsWith('55') ? limpo.slice(2) : limpo;
  const ultimos8 = semPais.slice(-8);

  console.log(`[GLPI] 🔍 Buscando por celular: ${ultimos8}`);

  try {
    const response = await api.get('/search/User', {
      headers: { 'Session-Token': sessionToken },
      params: {
        'criteria[0][field]': 11,
        'criteria[0][searchtype]': 'contains',
        'criteria[0][value]': ultimos8,
        'forcedisplay[0]': 1,
        'forcedisplay[1]': 2,
        'forcedisplay[2]': 3,
        'forcedisplay[3]': 11,
        'forcedisplay[4]': 13,
        'forcedisplay[5]': 34,
      },
    });

    console.log('[GLPI] Resultado celular:', JSON.stringify(response.data));

    if (!response.data?.data || response.data.data.length === 0) return null;

    // No retorno de buscarUsuarioPorCelular e buscarUsuarioPorLogin
    const u = response.data.data[0];

    // Nome: tenta campo 34, se vier só sobrenome usa o login capitalizado
    const nomeRaw = u[34] || '';
    const login = u[1] || '';
    const nome = nomeRaw.includes(' ')
      ? nomeRaw                                          // tem nome e sobrenome — usa completo
      : login.split('.').map(p =>                        // só sobrenome — monta pelo login
        p.charAt(0).toUpperCase() + p.slice(1)
      ).join(' ');

    // Localização: prefere campo 3, cai para campo 13 (remove o prefixo "CIT > ")
    const localizacaoRaw = u[3] || u[13] || null;
    const localizacao = localizacaoRaw
      ? localizacaoRaw.split('>').pop().trim()           // pega só a última parte
      : null;

    return {
      id: u[2],
      login: u[1],
      nome,
      localizacao,
    };
  } catch (error) {
    console.error('[GLPI] Erro busca celular:', error.message);
    return null;
  }
}

export async function buscarUsuarioPorLogin(sessionToken, login) {
  const loginLimpo = login.trim().toLowerCase();
  console.log(`[GLPI] 🔍 Buscando por login: "${loginLimpo}"`);

  try {
    const response = await api.get('/search/User', {
      headers: { 'Session-Token': sessionToken },
      params: {
        'criteria[0][field]': 1,
        'criteria[0][searchtype]': 'contains',
        'criteria[0][value]': loginLimpo,
        'forcedisplay[0]': 1,
        'forcedisplay[1]': 2,
        'forcedisplay[2]': 3,
        'forcedisplay[3]': 13,
        'forcedisplay[4]': 34,
      },
    });

    console.log(`[GLPI] Total encontrado: ${response.data?.totalcount}`);
    console.log('[GLPI] Resultado login:', JSON.stringify(response.data));

    if (!response.data?.data || response.data.data.length === 0) return null;

    const u = response.data.data[0];
    return {
      id: u[2],
      login: u[1],
      nome: u[34],
      localizacao: u[3],
    };
  } catch (error) {
    console.error('[GLPI] Erro busca login:', error.message);
    return null;
  }
}

export async function atualizarCelularUsuario(sessionToken, userId, celular) {
  await api.put(`/User/${userId}`, {
    input: { mobile: celular },
  }, {
    headers: { 'Session-Token': sessionToken },
  });
  console.log(`[GLPI] 📱 Celular ${celular} vinculado ao usuário ID ${userId}`);
}

export async function buscarEstadoTicket(sessionToken, ticketId) {
  try {
    const [ticketRes, followupRes] = await Promise.all([
      api.get(`/Ticket/${ticketId}`, {
        headers: { 'Session-Token': sessionToken },
      }),
      api.get(`/Ticket/${ticketId}/ITILFollowup`, {
        headers: { 'Session-Token': sessionToken },
      }).catch(() => ({ data: [] })),
    ]);

    const followups = Array.isArray(followupRes.data)
      ? followupRes.data.map(f => ({
        id: f.id,
        conteudo: f.content,
      }))
      : [];

    return {
      status: ticketRes.data.status,
      followups,
    };
  } catch (err) {
    console.error(`[GLPI] Erro ao buscar estado do ticket ${ticketId}:`, err.message);
    return null;
  }
}
