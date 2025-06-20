# 🚀 Discord Korean Weather Bot 설치 가이드

이 가이드는 Discord Korean Weather Bot을 처음부터 설정하는 방법을 단계별로 설명합니다.

## 📋 사전 요구사항

- **Node.js** (v16.0.0 이상)
- **MariaDB** 또는 **MySQL** (v10.0 이상)
- **Discord Developer Account**
- **기상청 API 키** (선택사항)

## 🔧 1단계: Discord 봇 생성

### 1.1 Discord Developer Portal 접속
1. [Discord Developer Portal](https://discord.com/developers/applications)에 접속
2. "New Application" 클릭
3. 애플리케이션 이름 입력 (예: "Korea Weather Bot")

### 1.2 봇 생성
1. 좌측 메뉴에서 "Bot" 클릭
2. "Add Bot" 클릭
3. "Token" 섹션에서 토큰 복사 (나중에 사용)

### 1.3 봇 권한 설정
1. 좌측 메뉴에서 "OAuth2" → "URL Generator" 클릭
2. **Scopes**: `bot`, `applications.commands` 선택
3. **Bot Permissions**:
   - Send Messages
   - Use Slash Commands
   - Embed Links
   - Read Message History
   - Send Messages in Threads
4. 생성된 URL로 봇을 서버에 초대

## 🗄️ 2단계: MariaDB 설정

### 2.1 MariaDB 설치
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mariadb-server

# CentOS/RHEL
sudo yum install mariadb-server

# Windows
# MariaDB 공식 사이트에서 다운로드
```

### 2.2 데이터베이스 생성
```sql
# MariaDB 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE weather_bot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'weather_bot'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON weather_bot.* TO 'weather_bot'@'localhost';
FLUSH PRIVILEGES;

# 확인
SHOW DATABASES;
EXIT;
```

## 🌤️ 3단계: 기상청 API 키 발급 (선택사항)

### 3.1 기상청 API Hub 가입
1. [기상청 API Hub](https://apihub.kma.go.kr/) 접속
2. 회원가입 및 로그인
3. "API 신청" → "기상청 API" 선택
4. 필요한 API 서비스 신청
5. 발급받은 API 키 저장

> **참고**: API 키가 없어도 모의 데이터로 봇이 작동합니다.

## 💻 4단계: 봇 설치 및 설정

### 4.1 소스코드 다운로드
```bash
git clone https://github.com/your-username/discord-korweather-bot.git
cd discord-korweather-bot
```

### 4.2 의존성 설치
```bash
npm install
```

### 4.3 환경 변수 설정
```bash
# .env.example을 복사하여 .env 생성
cp .env.example .env
```

`.env` 파일을 편집하여 다음 정보를 입력:
```env
# Discord 봇 토큰
DISCORD_TOKEN=your_discord_bot_token_here

# 기상청 API 키 (선택사항)
KMA_API_KEY=your_kma_api_key_here

# 데이터베이스 설정
DB_HOST=localhost
DB_USER=weather_bot
DB_PASSWORD=your_secure_password
DB_NAME=weather_bot
DB_PORT=3306
```

## 🚀 5단계: 봇 실행

### 5.1 봇 시작
```bash
npm start
```

### 5.2 성공 확인
다음과 같은 메시지가 출력되면 성공:
```
=== 날씨 봇 v2.0 시작 ===
✅ MariaDB 데이터베이스에 연결되었습니다: localhost
✅ 모든 데이터베이스 테이블이 생성되었습니다.
✅ 데이터베이스 초기화 완료
✅ 알림 시스템 초기화 완료
봇이 준비되었습니다! YourBot#1234로 로그인했습니다.
✅ 전역 슬래시 명령어가 성공적으로 등록되었습니다.
🚀 날씨 봇 v2.0이 성공적으로 시작되었습니다!
```

## ✅ 6단계: 기능 테스트

### 6.1 Discord에서 테스트
Discord 서버에서 다음 명령어들을 테스트:
```
/날씨 서울특별시 강남구
/예보 경기도 수원시
/중기예보 부산광역시 해운대구
/도움말
```

### 6.2 데이터베이스 확인
```sql
mysql -u weather_bot -p weather_bot

# 테이블 확인
SHOW TABLES;

# 날씨 조회 기록 확인
SELECT * FROM weather_queries LIMIT 5;
```

## 🔧 고급 설정

### 개발 모드 (빠른 명령어 업데이트)
```env
# .env 파일에 추가
GUILD_ID=your_server_guild_id
```

### PM2로 백그라운드 실행
```bash
# PM2 설치
npm install -g pm2

# 봇 시작
pm2 start index.js --name "weather-bot"

# 상태 확인
pm2 status

# 로그 확인
pm2 logs weather-bot
```

### 자동 시작 설정
```bash
# 시스템 부팅 시 자동 시작
pm2 startup
pm2 save
```

## 🐛 문제 해결

### 자주 발생하는 오류

#### 1. Discord 토큰 오류
```
Error [TokenInvalid]: An invalid token was provided.
```
**해결**: Discord Developer Portal에서 새 토큰을 생성하여 `.env` 파일에 입력

#### 2. 데이터베이스 연결 오류
```
Access denied for user 'weather_bot'@'localhost'
```
**해결**: MariaDB 사용자 권한을 다시 확인하고 비밀번호를 재설정

#### 3. 슬래시 명령어가 보이지 않음
**해결**: 봇에 `applications.commands` 권한이 있는지 확인하고 서버에 다시 초대

#### 4. API 호출 실패
**해결**: 기상청 API 키를 확인하거나 API 키 없이 모의 데이터로 테스트

### 로그 확인 방법
```bash
# 실시간 로그 확인
tail -f logs/weather-bot.log

# 오류 로그만 확인
grep "ERROR" logs/weather-bot.log
```

## 📞 지원

문제가 발생하면 다음 방법으로 도움을 요청하세요:

1. **GitHub Issues**: [문제 보고](https://github.com/your-username/discord-korweather-bot/issues)
2. **문서 확인**: [README.md](README.md) 파일 참조
3. **로그 분석**: 콘솔 출력을 확인하여 오류 메시지 파악

---

✨ **축하합니다!** Discord Korean Weather Bot이 성공적으로 설치되었습니다!