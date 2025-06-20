const mysql = require('mysql2/promise');
const moment = require('moment-timezone');

class WeatherDatabase {
    constructor() {
        this.pool = null;
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'weather_bot',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'weather_bot',
            port: parseInt(process.env.DB_PORT) || 3306,
            timezone: '+09:00',
            charset: 'utf8mb4',
            connectionLimit: 10,
            connectTimeout: 60000,
            acquireTimeout: 60000,
            ssl: false
        };
    }

    async init() {
        try {
            console.log(`🔗 MariaDB 연결 시도: ${this.config.host}:${this.config.port}`);
            
            // MariaDB 연결 풀 생성
            this.pool = mysql.createPool(this.config);
            
            // 연결 테스트
            const connection = await this.pool.getConnection();
            console.log(`✅ MariaDB 데이터베이스에 연결되었습니다: ${this.config.host}`);
            connection.release();
            
            // 테이블 생성
            await this.createTables();
            
        } catch (error) {
            console.error('❌ MariaDB 연결 실패:', error.message);
            throw error;
        }
    }

    async createTables() {
        const tables = [
            // 날씨 조회 기록 테이블
            `CREATE TABLE IF NOT EXISTS weather_queries (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(20) NOT NULL,
                user_name VARCHAR(100) NOT NULL,
                guild_id VARCHAR(20) NOT NULL,
                sido VARCHAR(50) NOT NULL,
                area VARCHAR(50) NOT NULL,
                temperature DECIMAL(5,2) DEFAULT NULL,
                humidity DECIMAL(5,2) DEFAULT NULL,
                wind_speed DECIMAL(6,2) DEFAULT NULL,
                precipitation DECIMAL(6,2) DEFAULT NULL,
                query_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_guild (user_id, guild_id),
                INDEX idx_location (sido, area),
                INDEX idx_query_time (query_time)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            
            // 알림 설정 테이블
            `CREATE TABLE IF NOT EXISTS notification_settings (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(20) NOT NULL,
                guild_id VARCHAR(20) NOT NULL,
                channel_id VARCHAR(20) NOT NULL,
                sido VARCHAR(50) NOT NULL,
                area VARCHAR(50) NOT NULL,
                notification_type ENUM('daily', 'weather_alert', 'rain_alert') NOT NULL,
                notification_time TIME DEFAULT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_notification (user_id, guild_id, sido, area, notification_type),
                INDEX idx_active_notifications (is_active, notification_type),
                INDEX idx_daily_time (notification_type, notification_time, is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            
            // 날씨 캐시 테이블
            `CREATE TABLE IF NOT EXISTS weather_cache (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                sido VARCHAR(50) NOT NULL,
                area VARCHAR(50) NOT NULL,
                weather_data JSON NOT NULL,
                cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                UNIQUE KEY unique_location (sido, area),
                INDEX idx_expires (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            
            // 사용자 통계 테이블
            `CREATE TABLE IF NOT EXISTS user_statistics (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(20) NOT NULL,
                guild_id VARCHAR(20) NOT NULL,
                total_queries INT DEFAULT 0,
                favorite_sido VARCHAR(50) DEFAULT NULL,
                favorite_area VARCHAR(50) DEFAULT NULL,
                last_query_time TIMESTAMP DEFAULT NULL,
                first_query_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_guild (user_id, guild_id),
                INDEX idx_total_queries (total_queries),
                INDEX idx_last_query (last_query_time)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        ];

        try {
            for (const tableQuery of tables) {
                await this.pool.execute(tableQuery);
            }
            console.log('✅ 모든 데이터베이스 테이블이 생성되었습니다.');
        } catch (error) {
            console.error('❌ 테이블 생성 실패:', error.message);
            throw error;
        }
    }

    // 날씨 조회 기록 저장
    async recordWeatherQuery(userId, userName, guildId, sido, area, weatherData) {
        try {
            const query = `
                INSERT INTO weather_queries 
                (user_id, user_name, guild_id, sido, area, temperature, humidity, wind_speed, precipitation)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const [result] = await this.pool.execute(query, [
                userId, userName, guildId, sido, area,
                weatherData.temperature || null,
                weatherData.humidity || null,
                weatherData.windSpeed || null,
                weatherData.precipitation || null
            ]);
            
            return result.insertId;
            
        } catch (error) {
            console.error('날씨 조회 기록 저장 실패:', error.message);
            throw error;
        }
    }

    // 사용자 통계 업데이트
    async updateUserStatistics(userId, guildId, sido, area) {
        try {
            const query = `
                INSERT INTO user_statistics (user_id, guild_id, total_queries, favorite_sido, favorite_area, last_query_time)
                VALUES (?, ?, 1, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                    total_queries = total_queries + 1,
                    favorite_sido = ?,
                    favorite_area = ?,
                    last_query_time = NOW()
            `;
            
            const [result] = await this.pool.execute(query, [
                userId, guildId, sido, area, sido, area
            ]);
            
            return result.affectedRows;
            
        } catch (error) {
            console.error('사용자 통계 업데이트 실패:', error.message);
            throw error;
        }
    }

    // 알림 설정 추가
    async addNotificationSetting(userId, guildId, channelId, sido, area, type, time = null, method = 'channel') {
        try {
            const query = `
                INSERT INTO notification_settings
                (user_id, guild_id, channel_id, sido, area, notification_type, notification_time, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
                ON DUPLICATE KEY UPDATE
                    channel_id = VALUES(channel_id),
                    notification_time = VALUES(notification_time),
                    is_active = TRUE,
                    updated_at = NOW()
            `;
            
            const [result] = await this.pool.execute(query, [
                userId, guildId, channelId, sido, area, type, time
            ]);
            
            return result.insertId || result.affectedRows;
            
        } catch (error) {
            console.error('알림 설정 추가 실패:', error.message);
            throw error;
        }
    }

    // 활성화된 알림 설정 조회
    async getActiveNotifications(type = null) {
        try {
            let query = `
                SELECT * FROM notification_settings 
                WHERE is_active = TRUE
            `;
            const params = [];
            
            if (type) {
                query += ` AND notification_type = ?`;
                params.push(type);
            }
            
            const [rows] = await this.pool.execute(query, params);
            return rows;
            
        } catch (error) {
            console.error('활성 알림 조회 실패:', error.message);
            throw error;
        }
    }

    // 사용자 통계 조회
    async getUserStatistics(userId, guildId) {
        try {
            const query = `
                SELECT 
                    us.*,
                    COUNT(wq.id) as query_count_last_30_days,
                    AVG(wq.temperature) as avg_temperature
                FROM user_statistics us
                LEFT JOIN weather_queries wq ON us.user_id = wq.user_id 
                    AND us.guild_id = wq.guild_id 
                    AND wq.query_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                WHERE us.user_id = ? AND us.guild_id = ?
                GROUP BY us.id
            `;
            
            const [rows] = await this.pool.execute(query, [userId, guildId]);
            return rows.length > 0 ? rows[0] : null;
            
        } catch (error) {
            console.error('사용자 통계 조회 실패:', error.message);
            throw error;
        }
    }

    // 날씨 캐시 저장
    async cacheWeatherData(sido, area, weatherData, expirationMinutes = 10) {
        try {
            const expiresAt = moment().add(expirationMinutes, 'minutes').format('YYYY-MM-DD HH:mm:ss');
            const query = `
                INSERT INTO weather_cache (sido, area, weather_data, expires_at)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    weather_data = VALUES(weather_data),
                    cached_at = NOW(),
                    expires_at = VALUES(expires_at)
            `;
            
            const [result] = await this.pool.execute(query, [
                sido, area, JSON.stringify(weatherData), expiresAt
            ]);
            
            return result.insertId || result.affectedRows;
            
        } catch (error) {
            console.error('날씨 캐시 저장 실패:', error.message);
            throw error;
        }
    }

    // 캐시된 날씨 데이터 조회
    async getCachedWeatherData(sido, area) {
        try {
            const query = `
                SELECT weather_data 
                FROM weather_cache 
                WHERE sido = ? AND area = ? AND expires_at > NOW()
            `;
            
            const [rows] = await this.pool.execute(query, [sido, area]);
            
            if (rows.length > 0) {
                return JSON.parse(rows[0].weather_data);
            }
            
            return null;
            
        } catch (error) {
            console.error('캐시 데이터 조회 실패:', error.message);
            return null;
        }
    }

    // 만료된 캐시 정리
    async cleanExpiredCache() {
        try {
            const query = `DELETE FROM weather_cache WHERE expires_at <= NOW()`;
            const [result] = await this.pool.execute(query);
            
            if (result.affectedRows > 0) {
                console.log(`✅ 만료된 캐시 ${result.affectedRows}개 삭제됨`);
            }
            
            return result.affectedRows;
            
        } catch (error) {
            console.error('캐시 정리 실패:', error.message);
            throw error;
        }
    }

    // 서버 전체 통계 조회 (관리자용)
    async getServerStatistics(guildId) {
        try {
            const queries = {
                totalQueries: `
                    SELECT COUNT(*) as total 
                    FROM weather_queries 
                    WHERE guild_id = ?
                `,
                activeUsers: `
                    SELECT COUNT(DISTINCT user_id) as count 
                    FROM weather_queries 
                    WHERE guild_id = ? AND query_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                `,
                topLocations: `
                    SELECT sido, area, COUNT(*) as query_count
                    FROM weather_queries 
                    WHERE guild_id = ? AND query_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                    GROUP BY sido, area 
                    ORDER BY query_count DESC 
                    LIMIT 5
                `,
                activeNotifications: `
                    SELECT COUNT(*) as count 
                    FROM notification_settings 
                    WHERE guild_id = ? AND is_active = TRUE
                `
            };

            const [totalQueries] = await this.pool.execute(queries.totalQueries, [guildId]);
            const [activeUsers] = await this.pool.execute(queries.activeUsers, [guildId]);
            const [topLocations] = await this.pool.execute(queries.topLocations, [guildId]);
            const [activeNotifications] = await this.pool.execute(queries.activeNotifications, [guildId]);

            return {
                totalQueries: totalQueries[0].total,
                activeUsers: activeUsers[0].count,
                topLocations: topLocations,
                activeNotifications: activeNotifications[0].count
            };
            
        } catch (error) {
            console.error('서버 통계 조회 실패:', error.message);
            throw error;
        }
    }

    // 알림 설정 비활성화
    async deactivateNotification(userId, guildId, sido, area, type) {
        try {
            const query = `
                UPDATE notification_settings 
                SET is_active = FALSE, updated_at = NOW()
                WHERE user_id = ? AND guild_id = ? AND sido = ? AND area = ? AND notification_type = ?
            `;
            
            const [result] = await this.pool.execute(query, [userId, guildId, sido, area, type]);
            return result.affectedRows;
            
        } catch (error) {
            console.error('알림 비활성화 실패:', error.message);
            throw error;
        }
    }

    // 연결 상태 확인
    async checkConnection() {
        try {
            const [rows] = await this.pool.execute('SELECT 1 as connected');
            return rows[0].connected === 1;
        } catch (error) {
            console.error('연결 상태 확인 실패:', error.message);
            return false;
        }
    }

    // 데이터베이스 연결 종료
    async close() {
        try {
            if (this.pool) {
                await this.pool.end();
                console.log('✅ MariaDB 연결이 종료되었습니다.');
            }
        } catch (error) {
            console.error('❌ 데이터베이스 종료 중 오류:', error.message);
        }
    }
}

module.exports = new WeatherDatabase();