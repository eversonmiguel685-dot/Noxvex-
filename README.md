# NOXVEX — Railway Pairing

Bot WhatsApp com código de emparelhamento impresso nos logs do Railway.

## Railway Variables

Em **Service → Variables**, define:

- `PHONE_NUMBER`: número completo com indicativo do país, só dígitos (Angola: `244...`)
- `BOT_NAME`: `NoxVex`
- `PREFIX`: `#`
- `AUTH_DIR`: `/data/auth_info`

Não coloques o sinal `+`, espaços ou hífen no número.

## Persistência da sessão (importante)

No Railway, adiciona um **Volume** ao serviço e define o Mount Path como:

`/data`

A pasta `/data/auth_info` guarda a sessão do WhatsApp. Sem volume, uma nova implantação pode perder a sessão e pedir emparelhamento novamente.

## Deploy

1. Envia estes ficheiros para o repositório GitHub.
2. No Railway, liga o serviço a esse repositório.
3. O comando de arranque é `npm start` (ou `node index.js`).
4. Abre **Deployments → View Logs**.
5. Copia o código apresentado nos logs e associa o dispositivo no WhatsApp.

## Comandos de teste

- `#ping`
- `#menu`

Mantém o conteúdo de `/data/auth_info` privado. Nunca publiques a sessão nem partilhes os logs com dados sensíveis.
