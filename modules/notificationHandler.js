const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const database = require('./database');
const { getKMADirectWeatherInfo } = require('./kmaDirectWeatherHandler');
const forecastHandler = require('./forecastHandler');
const moment = require('moment-timezone');

class NotificationHandler {
    constructor() {
        this.client = null;
        this.scheduledJobs = new Map();
    }

    /**
     * 디스코드 클라이언트 설정
     */
    setClient(client) {
        this.client = client;
        this.initializeNotifications();
    }

    /**
     * 알림 시스템 초기화
     */
    async initializeNotifications() {
        console.log('알림 시스템을 초기화합니다...');
        
        // 일일 알림 스케줄러 (매일 특정 시간)
        this.scheduleDailyNotifications();
        
        // 날씨 경보 알림 (10분마다 체크)
        this.scheduleWeatherAlerts();
        
        // 비 알림 (5분마다 체크)
        this.scheduleRainAlerts();
        
        console.log('알림 시스템이 초기화되었습니다.');
    }

    /**
     * 일일 날씨 알림 스케줄링
     */
    scheduleDailyNotifications() {
        // 매시간 정각에 일일 알림 설정이 있는지 확인
        cron.schedule('0 * * * *', async () => {
            try {
                const currentTime = moment().tz('Asia/Seoul').format('HH:mm');
                const notifications = await database.getActiveNotifications('daily');
                
                for (const notification of notifications) {
                    if (notification.notification_time === currentTime) {
                        await this.sendDailyWeatherNotification(notification);
                    }
                }
            } catch (error) {
                console.error('일일 알림 처리 중 오류:', error);
            }
        });
    }

    /**
     * 날씨 경보 알림 스케줄링
     */
    scheduleWeatherAlerts() {
        // 10분마다 날씨 경보 확인
        cron.schedule('*/10 * * * *', async () => {
            try {
                const notifications = await database.getActiveNotifications('weather_alert');
                
                for (const notification of notifications) {
                    await this.checkWeatherAlert(notification);
                }
            } catch (error) {
                console.error('날씨 경보 처리 중 오류:', error);
            }
        });
    }

    /**
     * 비 알림 스케줄링
     */
    scheduleRainAlerts() {
        // 5분마다 강수 확인
        cron.schedule('*/5 * * * *', async () => {
            try {
                const notifications = await database.getActiveNotifications('rain_alert');
                
                for (const notification of notifications) {
                    await this.checkRainAlert(notification);
                }
            } catch (error) {
                console.error('비 알림 처리 중 오류:', error);
            }
        });
    }

    /**
     * 일일 날씨 알림 전송
     */
    async sendDailyWeatherNotification(notification) {
        try {
            // 현재 날씨 및 예보 정보 조회
            const [currentWeather, forecast] = await Promise.all([
                getKMADirectWeatherInfo(notification.sido, notification.area),
                forecastHandler.getShortTermForecast(notification.sido, notification.area)
            ]);

            const embed = new EmbedBuilder()
                .setTitle(`🌅 ${notification.area} 오늘의 날씨`)
                .setColor(0x87CEEB)
                .setTimestamp();

            // 현재 날씨
            embed.addFields({
                name: '🌡️ 현재 날씨',
                value: [
                    `온도: ${currentWeather.temperature}°C`,
                    `습도: ${currentWeather.humidity}%`,
                    `바람: ${currentWeather.windSpeed}m/s`,
                    `강수량: ${currentWeather.precipitation}mm`
                ].join('\n'),
                inline: true
            });

            // 오늘 예보 (3시간 간격)
            if (forecast && forecast.length > 0) {
                const todayForecast = forecast.slice(0, 8);
                const forecastText = todayForecast.map(f =>
                    `${f.dateTime}: ${f.temperature}°C, ${f.skyCondition}`
                ).join('\n');

                embed.addFields({
                    name: '📅 오늘 예보',
                    value: forecastText.length > 1024 ? forecastText.substring(0, 1021) + '...' : forecastText,
                    inline: false
                });
            }

            // 외출 추천
            const recommendation = this.getOutdoorRecommendation(currentWeather, forecast);
            embed.addFields({
                name: '👕 외출 추천',
                value: recommendation,
                inline: false
            });

            // DM 또는 채널로 전송
            await this.sendNotificationMessage(notification, embed);
            console.log(`일일 알림 전송: ${notification.sido} ${notification.area} (${notification.channel_id === 'DM' ? 'DM' : '채널'})`);

        } catch (error) {
            console.error('일일 알림 전송 중 오류:', error);
        }
    }

    /**
     * 날씨 경보 확인
     */
    async checkWeatherAlert(notification) {
        try {
            const weatherData = await getKMADirectWeatherInfo(notification.sido, notification.area);
            const alerts = [];

            // 온도 경보
            if (weatherData.temperature >= 35) {
                alerts.push('🔥 폭염 경보: 기온이 35°C를 초과했습니다!');
            } else if (weatherData.temperature <= -10) {
                alerts.push('🧊 한파 경보: 기온이 -10°C 이하입니다!');
            }

            // 강풍 경보
            if (weatherData.windSpeed >= 15) {
                alerts.push('💨 강풍 경보: 풍속이 15m/s를 초과했습니다!');
            }

            // 강수 경보
            if (weatherData.precipitation >= 20) {
                alerts.push('🌧️ 호우 경보: 시간당 강수량이 20mm를 초과했습니다!');
            }

            // 경보가 있으면 전송
            if (alerts.length > 0) {
                await this.sendWeatherAlert(notification, alerts, weatherData);
            }

        } catch (error) {
            console.error('날씨 경보 확인 중 오류:', error);
        }
    }

    /**
     * 비 알림 확인
     */
    async checkRainAlert(notification) {
        try {
            const forecast = await forecastHandler.getShortTermForecast(notification.sido, notification.area);
            
            if (forecast && forecast.length > 0) {
                // 향후 2시간 내 강수 확률 확인
                const upcomingRain = forecast.slice(0, 2).find(f => 
                    f.precipitationProbability >= 70 || f.precipitationType !== '없음'
                );

                if (upcomingRain) {
                    await this.sendRainAlert(notification, upcomingRain);
                }
            }

        } catch (error) {
            console.error('비 알림 확인 중 오류:', error);
        }
    }

    /**
     /**
      * 날씨 경보 전송
      */
     async sendWeatherAlert(notification, alerts, weatherData) {
         try {
             const embed = new EmbedBuilder()
                 .setTitle('⚠️ 날씨 경보')
                 .setDescription(`**${notification.area}**에 날씨 경보가 발생했습니다!`)
                 .addFields({
                     name: '🚨 경보 내용',
                     value: alerts.join('\n'),
                     inline: false
                 })
                 .addFields({
                     name: '📊 현재 상황',
                     value: [
                         `온도: ${weatherData.temperature}°C`,
                         `풍속: ${weatherData.windSpeed}m/s`,
                         `강수량: ${weatherData.precipitation}mm`,
                         `습도: ${weatherData.humidity}%`
                     ].join('\n'),
                     inline: false
                 })
                 .setColor(0xFF0000)
                 .setTimestamp();
 
             await this.sendNotificationMessage(notification, embed);
             console.log(`날씨 경보 전송: ${notification.sido} ${notification.area} (${notification.channel_id === 'DM' ? 'DM' : '채널'})`);
 
         } catch (error) {
             console.error('날씨 경보 전송 중 오류:', error);
         }
     }
 
     /**
      * 비 알림 전송
      */
     async sendRainAlert(notification, rainData) {
         try {
             const embed = new EmbedBuilder()
                 .setTitle('🌧️ 비 예보 알림')
                 .setDescription(`**${notification.area}**에 곧 비가 올 예정입니다!`)
                 .addFields({
                     name: '☔ 예보 정보',
                     value: [
                         `시간: ${rainData.dateTime}`,
                         `강수확률: ${rainData.precipitationProbability}%`,
                         `강수형태: ${rainData.precipitationType}`,
                         `예상온도: ${rainData.temperature}°C`
                     ].join('\n'),
                     inline: false
                 })
                 .addFields({
                     name: '☂️ 준비사항',
                     value: '우산을 챙기시고 외출에 주의하세요!',
                     inline: false
                 })
                 .setColor(0x4169E1)
                 .setTimestamp();
 
             await this.sendNotificationMessage(notification, embed);
             console.log(`비 알림 전송: ${notification.sido} ${notification.area} (${notification.channel_id === 'DM' ? 'DM' : '채널'})`);
 
         } catch (error) {
             console.error('비 알림 전송 중 오류:', error);
         }
     }
    /**
     * 외출 추천 메시지 생성
     */
    getOutdoorRecommendation(currentWeather, forecast) {
        const temp = currentWeather.temperature;
        const humidity = currentWeather.humidity;
        const windSpeed = currentWeather.windSpeed;
        const precipitation = currentWeather.precipitation;

        let recommendations = [];

        // 온도에 따른 복장 추천
        if (temp >= 28) {
            recommendations.push('🌡️ 반팔, 반바지 추천');
        } else if (temp >= 20) {
            recommendations.push('👕 긴팔, 얇은 옷 추천');
        } else if (temp >= 10) {
            recommendations.push('🧥 자켓이나 가디건 추천');
        } else {
            recommendations.push('🧥 두꺼운 옷, 코트 추천');
        }

        // 날씨에 따른 준비물 추천
        if (precipitation > 0 || (forecast && forecast.some(f => f.precipitationProbability > 50))) {
            recommendations.push('☂️ 우산 필수');
        }

        if (windSpeed > 10) {
            recommendations.push('💨 바람이 강하니 주의');
        }

        if (humidity > 80) {
            recommendations.push('💧 습도가 높으니 통풍 좋은 옷 추천');
        }

        return recommendations.join('\n') || '😊 외출하기 좋은 날씨입니다!';
    }

    /**
     * 알림 메시지 전송 (DM 또는 채널)
     */
    async sendNotificationMessage(notification, embed) {
        try {
            if (notification.channel_id === 'DM') {
                // DM으로 전송
                const user = await this.client.users.fetch(notification.user_id);
                if (user) {
                    await user.send({ embeds: [embed] });
                }
            } else {
                // 채널로 전송
                const channel = await this.client.channels.fetch(notification.channel_id);
                if (channel) {
                    await channel.send({ embeds: [embed] });
                }
            }
        } catch (error) {
            console.error('알림 메시지 전송 실패:', error);
        }
    }

    /**
     * 특정 사용자의 알림 추가
     */
    async addUserNotification(userId, guildId, channelId, sido, area, type, time = null, method = 'channel') {
        try {
            await database.addNotificationSetting(userId, guildId, channelId, sido, area, type, time, method);
            console.log(`알림 설정 추가: ${userId} - ${sido} ${area} (${type}) - ${method}`);
            return true;
        } catch (error) {
            console.error('알림 설정 추가 중 오류:', error);
            return false;
        }
    }

    /**
     * 알림 시스템 종료
     */
    destroy() {
        // 모든 스케줄된 작업 중지
        this.scheduledJobs.forEach(job => {
            job.stop();
        });
        this.scheduledJobs.clear();
        console.log('알림 시스템이 종료되었습니다.');
    }
}

module.exports = new NotificationHandler();