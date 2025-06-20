const { REST, Routes, ActivityType } = require('discord.js');
const commands = require('./commands');

/**
 * 봇이 준비되었을 때 실행되는 초기화 함수
 * @param {Client} client - Discord 클라이언트
 */
async function initializeBot(client) {
    console.log(`봇이 준비되었습니다! ${client.user.tag}로 로그인했습니다.`);
    client.user.setActivity('전국 날씨 정보 제공', { type: ActivityType.Watching });
    
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
        console.log('🔄 슬래시 명령어 등록을 시작합니다...');
        
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        
        if (process.env.GUILD_ID) {
            // 기존 길드 명령어 모두 삭제
            console.log('🗑️ 기존 길드 명령어 삭제 중...');
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
                { body: [] }
            );
            console.log('✅ 기존 길드 명령어 삭제 완료');
            
            // 새 명령어 등록
            console.log(`📝 길드 ID: ${process.env.GUILD_ID}에 새 명령어 등록 중...`);
            console.log(`등록할 명령어 수: ${commands.length}`);
            
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
                { body: commands }
            );
            console.log('✅ 길드 슬래시 명령어가 성공적으로 등록되었습니다.');
            
        } else {
            // 기존 전역 명령어 모두 삭제
            console.log('🗑️ 기존 전역 명령어 삭제 중...');
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: [] }
            );
            console.log('✅ 기존 전역 명령어 삭제 완료');
            
            // 새 명령어 등록
            console.log('📝 전역 명령어 등록 중...');
            console.log(`등록할 명령어 수: ${commands.length}`);
            
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands }
            );
            console.log('✅ 전역 슬래시 명령어가 성공적으로 등록되었습니다.');
        }
        
        // 등록된 명령어 목록 출력
        console.log('📋 등록된 명령어:', commands.map(cmd => cmd.name).join(', '));
        
    } catch (error) {
        console.error('❌ 슬래시 명령어 등록 중 오류:', error);
        
        // 자세한 오류 정보 출력
        if (error.response?.data) {
            console.error('API 응답 오류:', error.response.data);
        }
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