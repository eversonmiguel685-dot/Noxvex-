import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'node:fs';
import path from 'node:path';

const PHONE_NUMBER = (process.env.PHONE_NUMBER || '').replace(/\D/g, '');
const AUTH_DIR = process.env.AUTH_DIR || '/data/auth_info';
const PREFIX = process.env.PREFIX || '#';
const BOT_NAME = process.env.BOT_NAME || 'NoxVex';

if (!PHONE_NUMBER) {
  console.error('❌ Define PHONE_NUMBER nas Variables do Railway.');
  console.error('   Formato: indicativo do país + número, apenas dígitos. Ex.: 2449XXXXXXXX');
  process.exit(1);
}

fs.mkdirSync(path.dirname(AUTH_DIR), { recursive: true });
let reconnecting = false;

async function startNoxVex() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['NoxVex', 'Chrome', '1.0.0'],
    markOnlineOnConnect: false,
    syncFullHistory: false
  });

  let pairingCodeRequested = false;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    // Baileys emite "qr" também no fluxo de código de emparelhamento.
    if (qr && !sock.authState.creds.registered && !pairingCodeRequested) {
      pairingCodeRequested = true;
      try {
        console.log('\n========================================');
        console.log('          NOXVEX - EMPARELHAMENTO');
        console.log('========================================');
        const code = await sock.requestPairingCode(PHONE_NUMBER);
        console.log(`\n🔐 CÓDIGO DE EMPARELHAMENTO: ${code}\n`);
        console.log('No WhatsApp: Dispositivos associados >');
        console.log('Associar dispositivo > Associar com número de telefone.');
        console.log('Introduz o código acima.');
        console.log('========================================\n');
      } catch (error) {
        pairingCodeRequested = false;
        console.error('❌ Não foi possível gerar o código:', error?.message || error);
      }
    }

    if (connection === 'open') {
      console.log(`✅ ${BOT_NAME} conectado ao WhatsApp!`);
      reconnecting = false;
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      console.log('⚠️ Ligação encerrada. Código:', statusCode ?? 'desconhecido');

      if (loggedOut) {
        console.error('❌ Sessão terminada pelo WhatsApp. Apaga a sessão antiga apenas se precisares de emparelhar novamente.');
        return;
      }

      if (!reconnecting) {
        reconnecting = true;
        console.log('🔄 A tentar ligar novamente...');
        setTimeout(() => {
          reconnecting = false;
          startNoxVex().catch(err => console.error('Erro ao reiniciar:', err));
        }, 5000);
      }
    }
  });

  // Respostas simples de teste. Podes substituir/adicionar os teus comandos depois.
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;
      if (!jid || jid === 'status@broadcast') continue;

      const body =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        '';

      const command = body.trim().toLowerCase();

      try {
        if (command === `${PREFIX}ping`.toLowerCase()) {
          await sock.sendMessage(jid, { text: '🏓 Pong! O NoxVex está online.' }, { quoted: msg });
        } else if (command === `${PREFIX}menu`.toLowerCase()) {
          await sock.sendMessage(jid, {
            text: `🤖 *${BOT_NAME}*\n\n${PREFIX}ping - Testar o bot\n${PREFIX}menu - Mostrar este menu\n\n_Status: online_`
          }, { quoted: msg });
        }
      } catch (error) {
        console.error('Erro ao responder mensagem:', error?.message || error);
      }
    }
  });
}

startNoxVex().catch(error => {
  console.error('❌ Falha ao iniciar o NOXVEX:', error);
  process.exit(1);
});
