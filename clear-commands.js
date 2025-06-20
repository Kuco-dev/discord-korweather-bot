const { REST, Routes } = require('discord.js');
require('dotenv').config();

/**
 * 모든 슬래시 명령어를 삭제하는 스크립트
 */
async function clearAllCommands() {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        
        // 봇의 애플리케이션 ID 가져오기
        const application = await rest.get(Routes.currentApplication());
        const applicationId = application.id;
        
        console.log(`🤖 애플리케이션 ID: ${applicationId}`);
        
        if (process.env.GUILD_ID) {
            // 길드 명령어 삭제
            console.log(`🗑️ 길드 ID: ${process.env.GUILD_ID}의 모든 명령어 삭제 중...`);
            await rest.put(
                Routes.applicationGuildCommands(applicationId, process.env.GUILD_ID),
                { body: [] }
            );
            console.log('✅ 길드 명령어 삭제 완료');
        }
        
        // 전역 명령어 삭제
        console.log('🗑️ 모든 전역 명령어 삭제 중...');
        await rest.put(
            Routes.applicationCommands(applicationId),
            { body: [] }
        );
        console.log('✅ 전역 명령어 삭제 완료');
        
        console.log('🎉 모든 슬래시 명령어가 삭제되었습니다!');
        
    } catch (error) {
        console.error('❌ 명령어 삭제 중 오류:', error);
        
        if (error.response?.data) {
            console.error('API 응답 오류:', error.response.data);
        }
    }
}

// 스크립트 실행
clearAllCommands();