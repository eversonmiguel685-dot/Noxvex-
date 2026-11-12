 ‎const fs = require('fs');
‎var qrcode = './qr-code';
‎global.owner = ["244934248346"]; // NUMERO DONO AQUI
‎global.ownernumber = "244934248346";
‎
‎async function start(){
‎  const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } = await import('@systemzero/baileys');
‎  const { Boom } = await import('@hapi/boom');
‎  const NodeCache = (await import('node-cache')).default;
‎  const msgRetryCounterCache = new NodeCache();
‎  const pino = (await import('pino')).default;
‎  const logger = pino({level:'silent'});
‎  if(!fs.existsSync(qrcode)) fs.mkdirSync(qrcode, {recursive:true});
‎  const { state, saveCreds } = await useMultiFileAuthState(qrcode);
‎  const { version } = await fetchLatestBaileysVersion();
‎  const sock = makeWASocket({
‎    logger, version, browser: Browsers.ubuntu('Chrome'),
‎    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
‎    msgRetryCounterCache, markOnlineOnConnect: false, syncFullHistory: false
‎  });
‎  if(!sock.authState.creds.registered){
‎    const num = '244951720962'; // JA COM TEU NUMERO
‎    console.log('Gerando codigo para: '+num+'...');
‎    await new Promise(r=>setTimeout(r,3000));
‎    try{
‎      const code = await sock.requestPairingCode(num);
‎      console.log('\n\n======== SEU CODIGO: '+code+' ========\n');
‎    }catch(e){
‎      console.log('ERRO: '+e.message);
‎    }
‎  }
‎  sock.ev.on('connection.update', async (u)=>{
‎    const { connection, lastDisconnect } = u;
‎    if(connection==='close'){
‎      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
‎      console.log('Desconectado: '+code);
‎      if(code!= 401) setTimeout(start,5000);
‎    }
‎    if(connection==='open'){
‎      console.log('BOT ONLINE COM SUCESSO!!! 𝕄𝕦𝕝𝕒𝕥𝕠𝕠𝕙 ATIVO | DONO 951720962');
‎      try{
‎        const handler = require('./sandro.js');
‎        sock.ev.on('messages.upsert', async (m)=>{
‎          try{
‎            try {
‎              let msg = m.messages[0];
‎              if(msg && msg.message){
‎                let body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "";
‎                if(body && /^[#+.!$]/.test(body)){
‎                  const emojis = ["❤️","🔥","👑","✨","🤖","😎","💀","😍"];
‎                  let emoji = emojis[Math.floor(Math.random()*emojis.length)];
‎                  await sock.sendMessage(msg.key.remoteJid, { react: { text: emoji, key: msg.key } });
‎                }
‎              }
‎            } catch(e){}
‎            await handler(m,sock,qrcode,Date.now());
‎          }catch(e){}
‎        });
‎      }catch(e){ console.log('Erro sandro.js: '+e.message); }
‎    }
‎  });
‎  sock.ev.on('creds.update', saveCreds);
‎}
‎start();
‎
