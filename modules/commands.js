const { SlashCommandBuilder } = require('discord.js');
const { getSidos } = require('./weatherData');

// 슬래시 명령어 정의
const commands = [
    // 기존 날씨 명령어
    new SlashCommandBuilder()
        .setName('날씨')
        .setDescription('대한민국 전 지역의 날씨 정보를 확인합니다')
        .addStringOption(option => {
            const sidos = getSidos();
            const sidoOption = option
                .setName('시도')
                .setDescription('시/도를 선택하세요')
                .setRequired(true);
            
            // 모든 시/도를 선택지로 추가
            sidos.forEach(sido => {
                sidoOption.addChoices({ name: sido, value: sido });
            });
            
            return sidoOption;
        })
        .addStringOption(option =>
            option.setName('시군구')
                .setDescription('시/군/구를 입력하세요 (예: 강남구, 수원시, 제주시)')
                .setRequired(true)
        ),

    // 새로운 예보 명령어
    new SlashCommandBuilder()
        .setName('예보')
        .setDescription('3일간의 상세 날씨 예보를 확인합니다')
        .addStringOption(option => {
            const sidos = getSidos();
            const sidoOption = option
                .setName('시도')
                .setDescription('시/도를 선택하세요')
                .setRequired(true);
            
            sidos.forEach(sido => {
                sidoOption.addChoices({ name: sido, value: sido });
            });
            
            return sidoOption;
        })
        .addStringOption(option =>
            option.setName('시군구')
                .setDescription('시/군/구를 입력하세요')
                .setRequired(true)
        ),

    // 중기예보 명령어
    new SlashCommandBuilder()
        .setName('중기예보')
        .setDescription('10일간의 중기 날씨 예보를 확인합니다')
        .addStringOption(option => {
            const sidos = getSidos();
            const sidoOption = option
                .setName('시도')
                .setDescription('시/도를 선택하세요')
                .setRequired(true);
            
            sidos.forEach(sido => {
                sidoOption.addChoices({ name: sido, value: sido });
            });
            
            return sidoOption;
        })
        .addStringOption(option =>
            option.setName('시군구')
                .setDescription('시/군/구를 입력하세요')
                .setRequired(true)
        ),

    // 통계 명령어
    new SlashCommandBuilder()
        .setName('통계')
        .setDescription('내 날씨 조회 통계를 확인합니다'),

    // 서버 통계 명령어 (관리자용)
    new SlashCommandBuilder()
        .setName('서버통계')
        .setDescription('서버의 날씨 봇 사용 통계를 확인합니다'),

    // 도움말 명령어
    new SlashCommandBuilder()
        .setName('도움말')
        .setDescription('날씨 봇의 모든 기능과 사용법을 안내합니다'),

    // 버전 정보 명령어
    new SlashCommandBuilder()
        .setName('버전')
        .setDescription('날씨 봇의 버전 정보를 확인합니다')
];

// 슬래시 명령어를 JSON으로 변환
module.exports = commands.map(command => command.toJSON());