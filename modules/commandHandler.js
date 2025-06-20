const { EmbedBuilder } = require('discord.js');
const { getAreas } = require('./weatherData');

/**
 * 슬래시 명령어 처리 핸들러
 * @param {Interaction} interaction - Discord 상호작용 객체
 */
async function handleCommands(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === '날씨') {
        await handleWeatherCommand(interaction);
    }
}

/**
 * 날씨 명령어 처리
 * @param {Interaction} interaction - Discord 상호작용 객체
 */
async function handleWeatherCommand(interaction) {
    const sido = interaction.options.getString('시도');
    const area = interaction.options.getString('시군구');
    
    try {
        await interaction.deferReply();
        
        // 입력된 지역이 해당 시/도에 있는지 확인
        const validAreas = getAreas(sido);
        if (!validAreas.includes(area)) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ 지역 정보 오류')
                .setDescription(`**${sido}**에 **${area}**이(가) 없습니다.\n\n**사용 가능한 지역:**\n${validAreas.join(', ')}`)
                .setColor(0xFF0000);
            
            return await interaction.editReply({ embeds: [errorEmbed] });
        }
        
        // 기상청 직접 API를 사용하여 날씨 정보 가져오기
        const { getKMADirectWeatherInfo, analyzeRunningConditions, analyzeCampingConditions } = require('./kmaDirectWeatherHandler');
        const weatherData = await getKMADirectWeatherInfo(sido, area);
        
        // 런닝 및 캠핑 적합도 분석
        const runningAnalysis = analyzeRunningConditions(weatherData);
        const campingAnalysis = analyzeCampingConditions(weatherData);
        
        // Discord Embed 생성
        const embed = new EmbedBuilder()
            .setTitle(`🌤️ ${area} 날씨에 관하여 알려드리겠습니다`)
            .setColor(0x87CEEB)
            .setTimestamp()
            .setFooter({
                text: weatherData.isMockData ? '※ 데모 데이터입니다' : `${weatherData.source || '기상청 직접 API'} ${weatherData.stationCode ? `(관측소: ${weatherData.stationCode})` : ''}`
            });

        // 현재 날씨 정보
        // 결측값(-9, -99) 처리 함수
        const formatValue = (value, unit = '', fallback = '없음') => {
            // 숫자나 문자열로 된 결측값들을 모두 처리
            const numValue = parseFloat(value);
            if (value === -9 || value === -9.0 || value === '-9' || value === '-9.0' ||
                value === -99 || value === -99.0 || value === '-99' || value === '-99.0' ||
                numValue === -9 || numValue === -99 ||
                isNaN(numValue) || !isFinite(numValue)) {
                return fallback;
            }
            return `${value}${unit}`;
        };

        // 현재 날씨 정보
        embed.addFields(
            {
                name: '🌡️ 현재 날씨',
                value: [
                    `지역 : ${sido} ${area}`,
                    `온도 : ${formatValue(weatherData.temperature, '°C')} (체감 ${formatValue(weatherData.feelsLike || weatherData.temperature, '°C')})`,
                    `날씨: 실측값`,
                    `습도 : ${formatValue(weatherData.humidity, '%')}`,
                    `바람 : ${formatValue(weatherData.windSpeed, 'm/s')}`,
                    `기압 : ${formatValue(weatherData.pressure, 'hPa')}`,
                    `강수량 : ${formatValue(weatherData.precipitation, 'mm')}`,
                    `가시거리 : ${formatValue(weatherData.visibility, 'km')}`,
                    `업데이트 : ${weatherData.formattedTime || weatherData.timestamp} (KST)`
                ].join('\n'),
                inline: false
            }
        );
        
        // 런닝 적합도
        embed.addFields(
            {
                name: `🏃‍♂️ 지금 런닝을 해도 좋을까?`,
                value: [
                    `${runningAnalysis.emoji} **${runningAnalysis.grade}**`,
                    `${runningAnalysis.advice}`,
                    `**이유**: ${runningAnalysis.reasons.join(', ')}`
                ].join('\n'),
                inline: true
            }
        );

        // 캠핑 적합도
        embed.addFields(
            {
                name: `🏕️ 지금 캠핑을 해도 좋을까?`,
                value: [
                    `${campingAnalysis.emoji} **${campingAnalysis.grade}**`,
                    `${campingAnalysis.advice}`,
                    `**이유**: ${campingAnalysis.reasons.join(', ')}`
                ].join('\n'),
                inline: true
            }
        );

        await interaction.editReply({ embeds: [embed] });
        
        console.log(`날씨 정보 조회: ${sido} ${area} (사용자: ${interaction.user.tag})`);
        
    } catch (error) {
        console.error('날씨 명령어 처리 중 오류:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ 오류 발생')
            .setDescription('날씨 정보를 가져오는 중 오류가 발생했습니다.')
            .setColor(0xFF0000);
            
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

module.exports = {
    handleCommands
};