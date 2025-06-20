const { REST, Routes } = require('discord.js');
const commands = require('./commands');

/**
 * 봇이 준비되었을 때 실행되는 초기화 함수
 * @param {Client} client - Discord 클라이언트
 */
async function initializeBot(client) {
    console.log(`봇이 준비되었습니다! ${client.user.tag}로 로그인했습니다.`);
    client.user.setActivity('전국 날씨 정보 제공', { type: 'WATCHING' });
    
    // 슬래시 명령어 등록
    await registerSlashCommands(client);
    
    console.log('날씨 봇 초기화 완료!');
}

/**
 * 슬래시 명령어를 Discord에 등록
 * @param {Client} client - Discord 클라이언트
 */
async function registerSlashCommands(client) {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        
        if (process.env.GUILD_ID) {
            // 특정 서버에만 등록 (개발용)
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
                { body: commands }
            );
            console.log('길드 슬래시 명령어가 등록되었습니다.');
        } else {
            // 전역 등록 (모든 서버)
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands }
            );
            console.log('전역 슬래시 명령어가 등록되었습니다.');
        }
    } catch (error) {
        console.error('슬래시 명령어 등록 중 오류:', error);
    }
}

/**
 * 봇의 이벤트 리스너들을 설정
 * @param {Client} client - Discord 클라이언트
 */
function setupEventListeners(client) {
    // 오류 처리
    client.on('error', console.error);

    // 처리되지 않은 Promise 거부 처리
    process.on('unhandledRejection', error => {
        console.error('처리되지 않은 Promise 거부:', error);
    });
}

module.exports = {
    initializeBot,
    setupEventListeners
};