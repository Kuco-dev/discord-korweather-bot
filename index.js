const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// 모듈 임포트
const { handleCommands } = require('./modules/commandHandler');
const { initializeBot, setupEventListeners } = require('./modules/botSetup');
const database = require('./modules/database');
const notificationHandler = require('./modules/notificationHandler');

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
    console.log('=== 날씨 봇 v2.0 시작 ===');
    
    try {
        // 데이터베이스 초기화
        await database.init();
        console.log('✅ 데이터베이스 초기화 완료');
        
        // 알림 시스템 초기화
        notificationHandler.setClient(client);
        console.log('✅ 알림 시스템 초기화 완료');
        
        // 기존 봇 초기화
        await initializeBot(client);
        
        // 만료된 캐시 정리 (시작 시)
        await database.cleanExpiredCache();
        
        console.log('🚀 날씨 봇 v2.0이 성공적으로 시작되었습니다!');
        
    } catch (error) {
        console.error('❌ 봇 초기화 중 오류 발생:', error);
    }
});

// 상호작용 처리 (슬래시 명령어)
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        await handleCommands(interaction);
    }
});

// 이벤트 리스너 설정
setupEventListeners(client);

// 정리 작업 (프로세스 종료 시)
process.on('SIGINT', async () => {
    console.log('\n🔄 봇을 안전하게 종료하는 중...');
    
    try {
        // 알림 시스템 종료
        notificationHandler.destroy();
        
        // 데이터베이스 연결 종료
        database.close();
        
        // 디스코드 클라이언트 종료
        client.destroy();
        
        console.log('✅ 안전하게 종료되었습니다.');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ 종료 중 오류 발생:', error);
        process.exit(1);
    }
});

// 처리되지 않은 Promise 오류 처리
process.on('unhandledRejection', (reason, promise) => {
    console.error('처리되지 않은 Promise 거부:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('처리되지 않은 예외:', error);
    process.exit(1);
});

// 봇 로그인
client.login(process.env.DISCORD_TOKEN);