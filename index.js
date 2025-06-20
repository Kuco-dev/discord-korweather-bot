const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// 모듈 임포트
const { handleCommands } = require('./modules/commandHandler');
const { initializeBot, setupEventListeners } = require('./modules/botSetup');

// Discord 클라이언트 생성
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 봇이 준비되었을 때
client.once('ready', async () => {
    await initializeBot(client);
});

// 상호작용 처리 (슬래시 명령어)
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        await handleCommands(interaction);
    }
});

// 이벤트 리스너 설정
setupEventListeners(client);

// 봇 로그인
client.login(process.env.DISCORD_TOKEN);