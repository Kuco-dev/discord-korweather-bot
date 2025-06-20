const { SlashCommandBuilder } = require('discord.js');
const { getSidos } = require('./weatherData');

// 슬래시 명령어 정의
const commands = [
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
        )
];

module.exports = commands;