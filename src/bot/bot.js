import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { salvarSession, buscarSession, deletarSession, temSessionAtiva, registrarTicket } from '../db/database.js';
import { processarAudio, abrirChamado, verificarDadosParaAbertura } from '../controllers/chamadoController.js';
import { transcreverAudio, aplicarCorrecao, extrairDadosDoChamado } from '../services/transcriptionService.js';
import { downloadAudio, removerArquivoTemp } from '../utils/audioUtil.js';
import { iniciarExpiracaoService } from '../services/expiraTempoService.js';
import { iniciarPolling } from '../services/pollingService.js';

const { Client, LocalAuth } = pkg;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions'],
  },
});

function formatarPreview(dados) {
  return (
    `📋 *Confira os dados do chamado:*\n\n` +
    `📌 *Título:* ${dados.titulo}\n\n` +
    `📝 *Descrição:* ${dados.descricao}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `1️⃣ - Confirmar e abrir chamado\n` +
    `2️⃣ - Corrigir informações\n` +
    `3️⃣ - Cancelar\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `_Responda com o número da opção desejada_`
  );
}

function mensagemBoasVindas(nome) {
  return (
    `👋 Olá, *${nome}*! Eu sou o assistente de suporte de TI da UNDB.\n\n` +
    `Posso abrir chamados no sistema automaticamente para você.\n\n` +
    `*Como funciona:*\n` +
    `🎙️ Envie um *áudio* descrevendo o problema\n` +
    `💬 Ou envie uma *mensagem de texto* descrevendo o problema\n\n` +
    `Depois de analisar, vou mostrar os dados do chamado para você confirmar antes de abrir.\n\n` +
    `_Dica: mencione o local do problema no seu relato, por exemplo: "o computador da Sala 207 não liga"._`
  );
}

async function verificarUsuarioGlpi(numeroUsuario) {
  console.log(`[BOT] Verificando vínculo para o número: ${numeroUsuario}`);
  const { initSession, killSession, buscarUsuarioPorCelular } = await import('../services/glpiService.js');
  const sessionToken = await initSession();
  try {
    return await buscarUsuarioPorCelular(sessionToken, numeroUsuario);
  } finally {
    await killSession(sessionToken);
  }
}

client.on('qr', (qr) => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('✅ WhatsApp conectado!'));
client.on('disconnected', async (reason) => {
  console.warn('⚠️ Desconectado:', reason);
  await client.initialize();
});
client.on('auth_failure', async (msg) => {
  console.error('❌ Falha de autenticação:', msg);
  await client.initialize();
});

client.on('message', async (mensagem) => {
  const contato = await mensagem.getContact();
  const numeroUsuario = contato.id.user;
  const temSession = await temSessionAtiva(numeroUsuario);

  console.log(`\n[BOT] Mensagem de: ${numeroUsuario} | type: ${mensagem.type} | Sessão: ${temSession}`);

  // ════════════════════════════════════════
  // COM SESSÃO ATIVA
  // ════════════════════════════════════════
  if (temSession) {
    const session = await buscarSession(numeroUsuario);
    const texto = mensagem.body?.trim() ?? '';
    console.log(`[BOT] Estado: ${session.estado} | Input: "${texto}"`);

    // ── 0º: aguardando conteúdo da correção ──
    if (session.estado === 'aguardando_correcao') {
      try {
        await mensagem.reply('✏️ Aplicando correção...');
        let textoCorrecao;

        if (mensagem.hasMedia && (mensagem.type === 'ptt' || mensagem.type === 'audio')) {
          const media = await mensagem.downloadMedia();
          if (!media) { await mensagem.reply('⚠️ Não consegui baixar o áudio.'); return; }
          const caminho = await downloadAudio(media.data, mensagem.id.id);
          try {
            textoCorrecao = await transcreverAudio(caminho);
          } finally {
            removerArquivoTemp(caminho);
          }
        } else {
          textoCorrecao = texto;
        }

        const dadosCorrigidos = await aplicarCorrecao(session.dados, textoCorrecao);
        await salvarSession(numeroUsuario, dadosCorrigidos, 'aguardando_confirmacao');
        await mensagem.reply(formatarPreview(dadosCorrigidos));
      } catch (err) {
        console.error('[BOT] Erro na correção:', err);
        await mensagem.reply('⚠️ Erro ao aplicar a correção. Tente novamente.');
      }
      return;
    }

    // ── 1º: aguardando login ──
    if (session.estado === 'aguardando_login') {
      const loginDigitado = texto.toLowerCase();
      console.log(`[BOT] Tentativa de login: ${loginDigitado}`);

      const { initSession, killSession, buscarUsuarioPorLogin, atualizarCelularUsuario } =
        await import('../services/glpiService.js');
      const sessionToken = await initSession();

      try {
        const usuarioGlpi = await buscarUsuarioPorLogin(sessionToken, loginDigitado);

        if (!usuarioGlpi) {
          await mensagem.reply(
            `❌ Login *${loginDigitado}* não encontrado no sistema.\n\n` +
            `Verifique se digitou corretamente (ex: *joao.silva*) e tente novamente.\n` +
            `Ou entre em contato com o suporte de TI para regularizar seu acesso.`
          );
          return;
        }

        await atualizarCelularUsuario(sessionToken, usuarioGlpi.id, numeroUsuario.replace('55', ''));
        console.log(`[BOT] ✅ Número ${numeroUsuario} vinculado a ${usuarioGlpi.login}`);

        if (session.dados && session.dados.titulo) {
          await salvarSession(numeroUsuario, session.dados, 'aguardando_confirmacao');
          await mensagem.reply(
            `✅ *Usuário verificado:* ${usuarioGlpi.nome}\n` +
            `📍 *Setor:* ${usuarioGlpi.localizacao ?? 'Não informado'}\n\n` +
            formatarPreview(session.dados)
          );
        } else {
          await deletarSession(numeroUsuario);
          await mensagem.reply(
            `✅ *Acesso liberado!* Olá, *${usuarioGlpi.nome}*!\n\n` +
            `Seu número foi vinculado ao sistema. Da próxima vez não será necessário informar o login.\n\n` +
            `Agora envie um *áudio* ou *texto* descrevendo o problema para abrir um chamado.`
          );
        }
      } catch (err) {
        console.error('[BOT] Erro no bloco de login:', err);
        await mensagem.reply('⚠️ Erro ao verificar login. Tente novamente.');
      } finally {
        await killSession(sessionToken);
      }
      return;
    }

    // ── 2º: aguardando escolha de localização ──
    if (session.estado === 'aguardando_localizacao') {
      const { resolverPorIndice, listarLocalizacoes } = await import('../services/localizacaoService.js');
      const localizacoes = await listarLocalizacoes();

      const loc = await resolverPorIndice(texto);
      if (!loc) {
        await mensagem.reply(`⚠️ Opção inválida. Digite um número entre 1 e ${localizacoes.length}.`);
        return;
      }

      const dadosComLocal = {
        ...session.dados,
        localizacaoEscolhida: loc.nome,
        localizacaoEscolhidaId: loc.id,
      };
      await salvarSession(numeroUsuario, dadosComLocal, 'aguardando_confirmacao');
      await mensagem.reply(
        `📍 *Setor definido:* ${loc.nome}\n\n` +
        formatarPreview(dadosComLocal)
      );
      return;
    }

    // ── 3º: opção 3 — cancelar ──
    if (texto === '3') {
      await deletarSession(numeroUsuario);
      await mensagem.reply('❌ Chamado cancelado.');
      return;
    }

    // ── 4º: opção 1 — confirmar ──
    if (texto === '1') {
      // Verifica se precisa de localização
      const { precisaLocalizacao } = await verificarDadosParaAbertura(numeroUsuario);
      if (precisaLocalizacao && !session.dados.localizacaoEscolhidaId) {
        const { formatarListaLocalizacoes } = await import('../services/localizacaoService.js');
        await salvarSession(numeroUsuario, session.dados, 'aguardando_localizacao');
        await mensagem.reply(
          `⚠️ Seu perfil não tem localização cadastrada.\n\n` +
          `Por favor, selecione o seu setor:\n\n` +
          await formatarListaLocalizacoes()
        );
        return;
      }

      await mensagem.reply('⏳ Abrindo chamado...');
      try {
        const ticket = await abrirChamado({
          titulo: session.dados.titulo,
          descricao: session.dados.descricao,
          telefone: numeroUsuario,
          idCategoria: session.dados.idCategoria,
          localizacaoEscolhida: session.dados.localizacaoEscolhida ?? null,
          localizacaoEscolhidaId: session.dados.localizacaoEscolhidaId ?? null,
        });

        // Registra para o polling monitorar
        await registrarTicket(ticket.id, numeroUsuario, 1);
        await deletarSession(numeroUsuario);

        await mensagem.reply(
          `✅ *Chamado aberto!*\n\n` +
          `🎫 *ID:* ${ticket.id}\n` +
          `📌 *Título:* ${session.dados.titulo}\n` +
          `👤 *Requerente:* ${ticket.nome}\n` +
          `📍 *Local:* ${ticket.localizacao ?? 'Não informado'}`
        );
      } catch (err) {
        if (err.message === 'USUARIO_NAO_ENCONTRADO') {
          await deletarSession(numeroUsuario);
          await mensagem.reply('⛔ Seu número não está mais vinculado ao sistema. Entre em contato com o suporte.');
          return;
        }
        console.error('[BOT] Erro ao abrir chamado:', err);
        await mensagem.reply('⚠️ Erro ao abrir o chamado. Tente novamente ou escolha a opção 3 para cancelar.');
      }
      return;
    }

    // ── 5º: opção 2 — solicita correção ──
    if (texto === '2') {
      await salvarSession(numeroUsuario, session.dados, 'aguardando_correcao');
      await mensagem.reply(
        `✏️ *O que você gostaria de corrigir?*\n\n` +
        `Descreva por *texto* ou envie um *áudio* com a correção.`
      );
      return;
    }

    // ── 6º: opção não reconhecida ──
    await mensagem.reply(
      `⚠️ Opção inválida. Por favor responda com:\n\n` +
      `1️⃣ - Confirmar e abrir chamado\n` +
      `2️⃣ - Corrigir informações\n` +
      `3️⃣ - Cancelar`
    );
    return;
  }

  // ════════════════════════════════════════
  // SEM SESSÃO ATIVA
  // ════════════════════════════════════════

  // ── Novo áudio ──
  if (mensagem.hasMedia && (mensagem.type === 'ptt' || mensagem.type === 'audio')) {
    try {
      console.log(`[BOT] Áudio recebido de ${numeroUsuario}`);
      const media = await mensagem.downloadMedia();
      if (!media) return;

      await mensagem.reply('🎙️ Áudio recebido! Transcrevendo...');
      const dadosChamado = await processarAudio(media, mensagem.id.id);
      const usuarioGlpi = await verificarUsuarioGlpi(numeroUsuario);

      if (!usuarioGlpi) {
        await salvarSession(numeroUsuario, dadosChamado, 'aguardando_login');
        await mensagem.reply(
          `⚠️ Seu número não está vinculado ao sistema.\n\n` +
          `Por favor, informe seu *login de rede* (ex: *joao.silva*) para continuar.`
        );
        return;
      }

      await salvarSession(numeroUsuario, dadosChamado, 'aguardando_confirmacao');
      await mensagem.reply(formatarPreview(dadosChamado));
    } catch (err) {
      console.error('[BOT] Erro no processamento de áudio:', err);
      await mensagem.reply('⚠️ Erro ao processar o áudio. Tente novamente.');
    }
    return;
  }

  // ── Mensagem de texto ──
  if (mensagem.type === 'chat') {
    const nome = contato.pushname?.split(' ')[0] ?? 'Olá';
    const texto = mensagem.body.trim();

    // Texto curto — boas vindas
    if (texto.length < 10) {
      await mensagem.reply(mensagemBoasVindas(nome));
      return;
    }

    // Texto longo — processa como chamado
    try {
      console.log(`[BOT] Texto recebido de ${numeroUsuario}. Analisando...`);
      await mensagem.reply('🔍 Analisando sua mensagem...');
      const dadosChamado = await extrairDadosDoChamado(texto);
      const usuarioGlpi = await verificarUsuarioGlpi(numeroUsuario);

      if (!usuarioGlpi) {
        await salvarSession(numeroUsuario, dadosChamado, 'aguardando_login');
        await mensagem.reply(
          `⚠️ Seu número não está vinculado ao sistema.\n\n` +
          `Por favor, informe seu *login de rede* (ex: *joao.silva*) para continuar.`
        );
        return;
      }

      await salvarSession(numeroUsuario, dadosChamado, 'aguardando_confirmacao');
      await mensagem.reply(formatarPreview(dadosChamado));
    } catch (err) {
      console.error('[BOT] Erro no processamento de texto:', err);
      await mensagem.reply('⚠️ Erro ao analisar. Tente novamente ou envie um áudio.');
    }
  }
});

export function inicializarBotWhatsapp() {
  client.initialize();
  console.log('🤖 Bot iniciado com sucesso!');

  const notificar = async (userId, mensagem) => {
    await client.sendMessage(`${userId}@c.us`, mensagem);
  };

  iniciarExpiracaoService(notificar);
  iniciarPolling(notificar);

  process.once('SIGINT', () => client.destroy());
  process.once('SIGTERM', () => client.destroy());
}
