const { EmbedBuilder } = require('discord.js');
const { getAreas } = require('./weatherData');
const database = require('./database');
const forecastHandler = require('./forecastHandler');
const notificationHandler = require('./notificationHandler');

/**
 * 슬래시 명령어 처리 핸들러
 * @param {Interaction} interaction - Discord 상호작용 객체
 */
async function handleCommands(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;
    console.log(`📋 명령어 실행: ${commandName}`);

    try {
        switch (commandName) {
            case '날씨':
                await handleWeatherCommand(interaction);
                break;
            case '예보':
                await handleForecastCommand(interaction);
                break;
            case '중기예보':
                await handleMidTermForecastCommand(interaction);
                break;
            case '통계':
                await handleStatisticsCommand(interaction);
                break;
            case '서버통계':
                await handleServerStatisticsCommand(interaction);
                break;
            case '도움말':
                await handleHelpCommand(interaction);
                break;
            case '버전':
                await handleVersionCommand(interaction);
                break;
            default:
                console.log(`❌ 알 수 없는 명령어: ${commandName}`);
                await interaction.reply({ content: '알 수 없는 명령어입니다.', ephemeral: true });
        }
    } catch (error) {
        console.error(`❌ 명령어 처리 중 오류 (${commandName}):`, error);
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '명령어 처리 중 오류가 발생했습니다.',
                    ephemeral: true
                });
            } else if (interaction.deferred) {
                await interaction.editReply({
                    content: '명령어 처리 중 오류가 발생했습니다.'
                });
            }
        } catch (replyError) {
            console.error('❌ 오류 응답 실패:', replyError);
        }
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
        
        // 데이터베이스에 조회 기록 저장
        try {
            await database.recordWeatherQuery(
                interaction.user.id,
                interaction.user.tag,
                interaction.guild.id,
                sido,
                area,
                weatherData
            );
            await database.updateUserStatistics(interaction.user.id, interaction.guild.id, sido, area);
        } catch (dbError) {
            console.error('데이터베이스 저장 중 오류:', dbError);
        }
        
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

/**
 * 예보 명령어 처리
 */
async function handleForecastCommand(interaction) {
    const sido = interaction.options.getString('시도');
    const area = interaction.options.getString('시군구');
    
    try {
        await interaction.deferReply();
        
        const validAreas = getAreas(sido);
        if (!validAreas.includes(area)) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ 지역 정보 오류')
                .setDescription(`**${sido}**에 **${area}**이(가) 없습니다.\n\n**사용 가능한 지역:**\n${validAreas.join(', ')}`)
                .setColor(0xFF0000);
            
            return await interaction.editReply({ embeds: [errorEmbed] });
        }
        
        const forecast = await forecastHandler.getShortTermForecast(sido, area);
        
        const embed = new EmbedBuilder()
            .setTitle(`📅 ${area} 3일 예보`)
            .setColor(0x87CEEB)
            .setTimestamp();

        // 오늘, 내일, 모레로 그룹화
        const today = forecast.slice(0, 8);
        const tomorrow = forecast.slice(8, 16);
        const dayAfter = forecast.slice(16, 24);

        if (today.length > 0) {
            const todayText = today.map(f =>
                `${f.dateTime}: ${f.temperature}°C ${f.skyCondition}`
            ).join('\n');
            embed.addFields({
                name: '☀️ 오늘',
                value: todayText.length > 1024 ? todayText.substring(0, 1021) + '...' : todayText,
                inline: false
            });
        }

        if (tomorrow.length > 0) {
            const tomorrowText = tomorrow.map(f =>
                `${f.dateTime}: ${f.temperature}°C ${f.skyCondition}`
            ).join('\n');
            embed.addFields({
                name: '🌤️ 내일',
                value: tomorrowText.length > 1024 ? tomorrowText.substring(0, 1021) + '...' : tomorrowText,
                inline: false
            });
        }

        if (dayAfter.length > 0) {
            const dayAfterText = dayAfter.map(f =>
                `${f.dateTime}: ${f.temperature}°C ${f.skyCondition}`
            ).join('\n');
            embed.addFields({
                name: '⛅ 모레',
                value: dayAfterText.length > 1024 ? dayAfterText.substring(0, 1021) + '...' : dayAfterText,
                inline: false
            });
        }

        await interaction.editReply({ embeds: [embed] });
        
    } catch (error) {
        console.error('예보 명령어 처리 중 오류:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ 오류 발생')
            .setDescription('예보 정보를 가져오는 중 오류가 발생했습니다.')
            .setColor(0xFF0000);
            
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

/**
 * 중기예보 명령어 처리
 */
async function handleMidTermForecastCommand(interaction) {
    const sido = interaction.options.getString('시도');
    const area = interaction.options.getString('시군구');
    
    try {
        await interaction.deferReply();
        
        const forecast = await forecastHandler.getMidTermForecast(sido, area);
        
        const embed = new EmbedBuilder()
            .setTitle(`📊 ${area} 중기예보 (10일)`)
            .setColor(0x4169E1)
            .setTimestamp();

        const forecastText = forecast.map(f =>
            `**${f.date}**: ${f.morningTemp}°C~${f.afternoonTemp}°C ${f.morningCondition} (강수: ${f.precipitationProbability}%)`
        ).join('\n');

        embed.addFields({
            name: '📈 10일간 예보',
            value: forecastText.length > 1024 ? forecastText.substring(0, 1021) + '...' : forecastText,
            inline: false
        });

        await interaction.editReply({ embeds: [embed] });
        
    } catch (error) {
        console.error('중기예보 명령어 처리 중 오류:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ 오류 발생')
            .setDescription('중기예보 정보를 가져오는 중 오류가 발생했습니다.')
            .setColor(0xFF0000);
            
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}


/**
 * 통계 명령어 처리
 */
async function handleStatisticsCommand(interaction) {
    try {
        await interaction.deferReply();
        
        const stats = await database.getUserStatistics(interaction.user.id, interaction.guild.id);
        
        if (!stats) {
            const embed = new EmbedBuilder()
                .setTitle('📊 내 통계')
                .setDescription('아직 날씨를 조회한 기록이 없습니다.')
                .setColor(0x87CEEB);
            
            return await interaction.editReply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setTitle('📊 내 날씨 조회 통계')
            .addFields(
                {
                    name: '🔢 총 조회수',
                    value: `${stats.total_queries}회`,
                    inline: true
                },
                {
                    name: '📍 선호 지역',
                    value: `${stats.favorite_sido || '없음'} ${stats.favorite_area || ''}`,
                    inline: true
                },
                {
                    name: '📅 최근 조회',
                    value: stats.last_query_time ? new Date(stats.last_query_time).toLocaleString('ko-KR') : '없음',
                    inline: false
                },
                {
                    name: '🗓️ 30일간 조회',
                    value: `${stats.query_count_last_30_days || 0}회`,
                    inline: true
                },
                {
                    name: '🌡️ 평균 기온',
                    value: stats.avg_temperature ? `${Math.round(stats.avg_temperature)}°C` : '없음',
                    inline: true
                }
            )
            .setColor(0x87CEEB)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        
    } catch (error) {
        console.error('통계 명령어 처리 중 오류:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ 오류 발생')
            .setDescription('통계 정보를 가져오는 중 오류가 발생했습니다.')
            .setColor(0xFF0000);
            
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

/**
 * 서버통계 명령어 처리
 */
async function handleServerStatisticsCommand(interaction) {
    try {
        await interaction.deferReply();
        
        // 관리자 권한 확인
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            const embed = new EmbedBuilder()
                .setTitle('❌ 권한 부족')
                .setDescription('이 명령어는 관리자만 사용할 수 있습니다.')
                .setColor(0xFF0000);
            
            return await interaction.editReply({ embeds: [embed] });
        }

        // 서버 통계 조회
        const stats = await database.getServerStatistics(interaction.guild.id);
        
        const embed = new EmbedBuilder()
            .setTitle('📈 서버 날씨 봇 통계')
            .addFields(
                {
                    name: '🔢 총 조회수',
                    value: `${stats.totalQueries.toLocaleString()}회`,
                    inline: true
                },
                {
                    name: '👥 활성 사용자 (30일)',
                    value: `${stats.activeUsers}명`,
                    inline: true
                },
                {
                    name: '🔔 활성 알림',
                    value: `${stats.activeNotifications}개`,
                    inline: true
                },
                {
                    name: '📍 인기 지역 TOP 5',
                    value: stats.topLocations.length > 0
                        ? stats.topLocations.map((loc, idx) =>
                            `${idx + 1}. ${loc.sido} ${loc.area} (${loc.query_count}회)`
                          ).join('\n')
                        : '데이터 없음',
                    inline: false
                }
            )
            .setColor(0x87CEEB)
            .setTimestamp()
            .setFooter({ text: `서버: ${interaction.guild.name}` });

        await interaction.editReply({ embeds: [embed] });
        
    } catch (error) {
        console.error('서버통계 명령어 처리 중 오류:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ 오류 발생')
            .setDescription('서버 통계를 가져오는 중 오류가 발생했습니다.')
            .setColor(0xFF0000);
            
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

/**
 * 도움말 명령어 처리
 */
async function handleHelpCommand(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('🤖 날씨 봇 사용법')
        .setDescription('한국 전 지역의 날씨 정보를 제공하는 디스코드 봇입니다.')
        .addFields(
            {
                name: '📋 기본 명령어',
                value: [
                    '`/날씨` - 현재 날씨 조회',
                    '`/예보` - 3일간 상세 예보',
                    '`/중기예보` - 10일간 중기 예보',
                    '`/통계` - 개인 사용 통계',
                    '`/버전` - 봇 버전 정보'
                ].join('\n'),
                inline: false
            },
            {
                name: '🔔 알림 기능',
                value: [
                    '`/알림설정` - 날씨 알림 설정',
                    '• 일일 날씨 알림 (매일 지정 시간)',
                    '• 날씨 경보 알림 (폭염, 한파, 강풍 등)',
                    '• 비 예보 알림 (강수 예보 시)'
                ].join('\n'),
                inline: false
            },
            {
                name: '📊 새로운 기능 (v2.0)',
                value: [
                    '✅ 상세 날씨 예보',
                    '✅ 스마트 알림 시스템',
                    '✅ 개인/서버 통계',
                    '✅ 성능 최적화',
                    '✅ 데이터 캐싱'
                ].join('\n'),
                inline: false
            }
        )
        .setColor(0x87CEEB)
        .setFooter({ text: '문의사항이 있으시면 서버 관리자에게 연락하세요.' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

/**
 * 버전 명령어 처리
 */
async function handleVersionCommand(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('🚀 날씨 봇 버전 정보')
        .addFields(
            {
                name: '📦 현재 버전',
                value: '**2.0.0** (Major Update)',
                inline: true
            },
            {
                name: '📅 업데이트 날짜',
                value: new Date().toLocaleDateString('ko-KR'),
                inline: true
            },
            {
                name: '🔥 새로운 기능',
                value: [
                    '🔄 예보 정보 추가',
                    '🔔 알림 시스템',
                    '📊 통계 기능',
                    '⚡ 성능 최적화'
                ].join('\n'),
                inline: false
            },
            {
                name: '🛠️ 기술 스택',
                value: [
                    'Discord.js v14',
                    'Node.js',
                    'SQLite3',
                    '기상청 API',
                    'Moment.js'
                ].join(' • '),
                inline: false
            }
        )
        .setColor(0x00FF00)
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

module.exports = {
    handleCommands
};