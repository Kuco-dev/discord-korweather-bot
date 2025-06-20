<div align="center">

# 🌤️ Discord 날씨 정보 봇

**대한민국 전 지역의 실시간 날씨 정보와 활동 적합도를 제공하는 Discord 봇**

[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org)
[![Discord.js](https://img.shields.io/badge/Discord.js-14.0+-blue.svg)](https://discord.js.org)
[![KMA API](https://img.shields.io/badge/KMA%20API-Direct-orange.svg)](https://apihub.kma.go.kr/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[기능 소개](#-기능) • [설치 가이드](#-설치-및-설정) • [사용법](#-사용법) • [API 연동](#-api-연동)

</div>

---

## 📋 목차

- [기능](#-기능)
- [미리보기](#-미리보기)
- [설치 및 설정](#-설치-및-설정)
- [사용법](#-사용법)
- [지원 지역](#-지원-지역)
- [제공 정보](#-제공-정보)
- [API 연동](#-api-연동)
- [프로젝트 구조](#-프로젝트-구조)
- [문제 해결](#-문제-해결)
- [기여하기](#-기여하기)
- [라이센스](#-라이센스)

## ✨ 기능

### 🎯 핵심 기능
- **🗺️ 전국 지원**: 대한민국 17개 시/도 250개 이상 지역 완전 지원
- **🌡️ 실시간 데이터**: 기상청 직접 API를 통한 실제 관측 데이터
- **🏃‍♂️ 활동 분석**: 런닝 및 캠핑 적합도 AI 분석
- **📊 상세 정보**: 온도, 습도, 바람, 기압, 강수량, 가시거리 등
- **🎨 직관적 UI**: Discord Embed를 활용한 시각적 정보 표시
- **🔄 자동 갱신**: 최신 관측 데이터 자동 업데이트

### 🛡️ 안정성 및 호환성
- **☁️ 오프라인 지원**: API 키 없어도 모의 데이터로 테스트 가능
- **⚡ 빠른 응답**: 최적화된 API 호출로 빠른 정보 제공
- **🚫 오류 방지**: 결측값 처리 및 데이터 검증
- **📱 멀티 플랫폼**: PC, 모바일 Discord에서 완벽 호환

## 🖼️ 미리보기

### 날씨 조회 명령어
```
/날씨 시도:서울특별시 시군구:강남구
```

### 날씨 정보 결과
```
🌤️ 강남구 날씨에 관하여 알려드리겠습니다

🌡️ 현재 날씨
지역 : 서울특별시 강남구
온도 : 22°C (체감 24°C)
날씨: 실측값
습도 : 65%
바람 : 2.3m/s
기압 : 1013hPa
강수량 : 없음
가시거리 : 15km
업데이트 : 2025-06-20 14:00 (KST)

🏃‍♂️ 지금 런닝을 해도 좋을까?    🏕️ 지금 캠핑을 해도 좋을까?
🏃‍♂️✨ 매우 좋음                   🏕️👍 좋음
런닝하기 완벽한 날씨입니다!         캠핑하기 좋은 날씨입니다.
이유: 적정 온도, 좋은 날씨, 바람 적음  이유: 적정 온도, 맑은 날씨, 바람 약함
```

## 🚀 설치 및 설정

### 📋 요구사항
- **Node.js**: 18.0 이상
- **Discord Bot**: 개발자 포털에서 생성된 봇
- **기상청 API**: 실제 데이터 사용 시 필요 (선택사항)

### ⚡ 빠른 시작

1. **저장소 클론**
   ```bash
   git clone https://github.com/yourusername/discord-weather-bot.git
   cd discord-weather-bot
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 설정**
   ```bash
   cp .env.example .env
   # .env 파일을 열어 봇 토큰 입력
   ```

4. **봇 실행**
   ```bash
   npm start
   ```

### 🔑 Discord 봇 설정

#### 1. 봇 생성
1. [Discord Developer Portal](https://discord.com/developers/applications) 접속
2. **"New Application"** → 애플리케이션 이름 입력
3. **"Bot"** 탭 → **"Add Bot"** 클릭
4. **Token** 복사 → `.env` 파일의 `DISCORD_TOKEN`에 입력

#### 2. 권한 설정
**Privileged Gateway Intents**에서 활성화:
- ✅ **Message Content Intent**

#### 3. 봇 초대
**OAuth2 → URL Generator**에서 다음 권한 선택:
- ✅ `bot` (Scopes)
- ✅ `Use Slash Commands` (슬래시 명령어 사용)
- ✅ `Send Messages` (메시지 전송)
- ✅ `Embed Links` (링크 임베드)

### 🌤️ 기상청 API 설정 (선택사항)

실제 날씨 데이터를 사용하려면:

1. **API 키 발급**
   - [기상청 API Hub](https://apihub.kma.go.kr/) 접속
   - 회원가입 후 로그인
   - **"단기예보 조회서비스"** 신청
   - 발급받은 서비스 키를 `.env` 파일에 입력

2. **서비스 승인 대기**
   - 신청 후 즉시 또는 몇 분 내 승인
   - **"마이페이지" → "오픈API 신청현황"**에서 확인

> **💡 참고**: API 키가 없어도 모의 데이터로 모든 기능을 테스트할 수 있습니다.

### ⚙️ 환경변수 설정

```env
# Discord Bot Token (필수)
DISCORD_TOKEN=your_bot_token_here

# Guild ID (선택사항 - 개발용)
GUILD_ID=your_guild_id_here

# 기상청 API 서비스 키 (선택사항)
KMA_API_KEY=your_kma_api_key_here
```

## 📖 사용법

### 💬 슬래시 명령어

```
/날씨 시도:[시/도 선택] 시군구:[시/군/구 입력]
```

#### 매개변수
- **시도**: 드롭다운에서 선택 (17개 시/도)
- **시군구**: 직접 입력 (해당 시/도의 시/군/구명)

#### 사용 예시
```bash
/날씨 시도:서울특별시 시군구:강남구
/날씨 시도:경기도 시군구:수원시
/날씨 시도:제주특별자치도 시군구:제주시
/날씨 시도:부산광역시 시군구:해운대구
/날씨 시도:강원특별자치도 시군구:춘천시
```

### 📍 지역명 입력 가이드

| 올바른 예시 | 잘못된 예시 |
|-------------|-------------|
| 수원시 | 수원 |
| 강남구 | 강남 |
| 제주시 | 제주도 |
| 해운대구 | 해운대 |

## 🗺️ 지원 지역

### 📊 전국 17개 시/도 완전 지원

<details>
<summary><strong>🏙️ 특별시/광역시 (8개)</strong></summary>

- **서울특별시**: 25개 자치구
- **부산광역시**: 16개 구/군  
- **대구광역시**: 8개 구/군
- **인천광역시**: 9개 구/군
- **광주광역시**: 5개 구
- **대전광역시**: 5개 구
- **울산광역시**: 5개 구/군
- **세종특별자치시**: 1개 시

</details>

<details>
<summary><strong>🌄 도 단위 (9개)</strong></summary>

- **경기도**: 31개 시/군
- **강원특별자치도**: 18개 시/군
- **충청북도**: 11개 시/군
- **충청남도**: 15개 시/군
- **전라북도**: 14개 시/군
- **전라남도**: 22개 시/군
- **경상북도**: 23개 시/군
- **경상남도**: 18개 시/군
- **제주특별자치도**: 2개 시

</details>

**총 지원 지역**: **250개 이상** 시/군/구

## 📊 제공 정보

### 🌡️ 기본 날씨 데이터

| 항목 | 설명 | 단위 | 출처 |
|------|------|------|------|
| **온도** | 현재 기온 및 체감온도 | °C | 기상청 관측소 |
| **습도** | 상대습도 | % | 기상청 관측소 |
| **바람** | 풍속 정보 | m/s | 기상청 관측소 |
| **기압** | 현지 기압 | hPa | 기상청 관측소 |
| **강수량** | 시간당 강수량 | mm | 기상청 관측소 |
| **가시거리** | 현재 시정 | km | 기상청 관측소 |
| **관측시간** | 최신 관측 시간 | KST | 기상청 관측소 |

### 🏃‍♂️ 런닝 적합도 분석

**알고리즘**: 4가지 요소 종합 평가 (100점 만점)

| 요소 | 최적 조건 | 배점 | 평가 기준 |
|------|-----------|------|-----------|
| **온도** | 15-25°C | 40점 | 운동하기 적절한 온도 |
| **날씨** | 맑음/구름조금 | 30점 | 야외 활동 적합성 |
| **바람** | ≤3m/s | 20점 | 운동 시 저항 최소화 |
| **습도** | ≤60% | 10점 | 쾌적한 운동 환경 |

**등급 체계**:
- 🏃‍♂️✨ **매우 좋음** (80점 이상): 완벽한 런닝 조건
- 🏃‍♂️👍 **좋음** (60-79점): 권장하는 런닝 조건
- 🏃‍♂️⚠️ **나쁨** (40-59점): 주의 필요한 조건
- 🏃‍♂️❌ **매우 나쁨** (39점 이하): 권장하지 않음

### 🏕️ 캠핑 적합도 분석

**알고리즘**: 4가지 요소 종합 평가 (100점 만점)

| 요소 | 최적 조건 | 배점 | 평가 기준 |
|------|-----------|------|-----------|
| **날씨** | 맑음/구름조금 | 40점 | 캠핑 안전성 최우선 |
| **온도** | 10-25°C | 35점 | 야외 숙박 적절한 온도 |
| **바람** | ≤2m/s | 15점 | 텐트 안정성 고려 |
| **가시거리** | ≥8km | 10점 | 안전한 시야 확보 |

**등급 체계**:
- 🏕️✨ **매우 좋음** (80점 이상): 완벽한 캠핑 조건
- 🏕️👍 **좋음** (60-79점): 권장하는 캠핑 조건  
- 🏕️⚠️ **나쁨** (40-59점): 주의 필요한 조건
- 🏕️❌ **매우 나쁨** (39점 이하): 위험한 조건

## 🔧 API 연동

### 🌐 기상청 직접 API

이 봇은 기상청의 **지상관측 시간자료** API를 직접 활용합니다.

#### API 정보
- **엔드포인트**: `https://apihub.kma.go.kr/api/typ01/url/kma_sfctm2.php`
- **데이터 형식**: 공백 구분 텍스트
- **갱신 주기**: 매 정시 (1시간마다)
- **관측소**: 전국 주요 기상 관측소

#### 데이터 처리
```javascript
// 결측값 처리 예시
const formatValue = (value, unit = '', fallback = '없음') => {
    const numValue = parseFloat(value);
    if (value === -9 || value === -99 || isNaN(numValue)) {
        return fallback; // 결측값은 "없음"으로 표시
    }
    return `${value}${unit}`;
};
```

#### 관측소 매핑
- **서울**: 108번 관측소 (종로구)
- **부산**: 159번 관측소 (중구)
- **제주**: 184번 관측소 (제주시)
- **기타**: 지역별 최적 관측소 자동 선택

### 🔄 폴백 시스템

API 호출 실패 시 자동으로 모의 데이터로 전환:

```javascript
// 모의 데이터 생성
function getMockWeatherData(sido, area) {
    return {
        temperature: 22,
        humidity: 65,
        windSpeed: 2.3,
        description: '구름조금',
        isMockData: true,
        source: '모의 데이터'
    };
}
```

## 🏗️ 프로젝트 구조

```
discord-weather-bot/
├── 📄 package.json                       # 프로젝트 설정 및 의존성
├── 🚀 index.js                          # 메인 봇 파일
├── 🔧 .env.example                      # 환경변수 템플릿
├── 📚 README.md                         # 프로젝트 문서
├── 🚫 .gitignore                        # Git 제외 파일
└── 📁 modules/                          # 기능 모듈
    ├── 💬 commands.js                   # 슬래시 명령어 정의
    ├── ⚙️ commandHandler.js             # 명령어 처리 로직
    ├── 🗺️ weatherData.js               # 전국 지역 데이터
    ├── 🌤️ kmaDirectWeatherHandler.js   # 기상청 API 핸들러
    └── 🔧 botSetup.js                   # 봇 초기화 및 설정
```

### 📦 핵심 모듈

#### 🌤️ [`kmaDirectWeatherHandler.js`](modules/kmaDirectWeatherHandler.js)
- 기상청 직접 API 호출 및 데이터 파싱
- 관측소 코드 매핑 및 시간 형식 변환
- 런닝/캠핑 적합도 분석 알고리즘

#### 🗺️ [`weatherData.js`](modules/weatherData.js)
- 대한민국 전 지역 데이터 관리
- 17개 시/도, 250개 이상 시/군/구 정보
- 지역명 검증 및 자동완성 지원

#### ⚙️ [`commandHandler.js`](modules/commandHandler.js)
- 날씨 명령어 처리 및 결과 포맷팅
- Discord Embed 생성 및 오류 처리
- 사용자 입력 검증 및 피드백

## 🔧 문제 해결

### ❌ 일반적인 문제

#### 봇이 응답하지 않는 경우
```bash
# 1. 봇 상태 확인
npm start

# 2. 권한 확인
# Discord에서 봇이 메시지를 보낼 수 있는지 확인

# 3. 명령어 등록 확인
# 슬래시 명령어가 서버에 등록되었는지 확인
```

#### 실제 날씨 데이터가 나오지 않는 경우
1. **API 키 확인**
   ```bash
   # .env 파일 확인
   cat .env | grep KMA_API_KEY
   ```

2. **API 서비스 상태 확인**
   - [기상청 API Hub](https://apihub.kma.go.kr/)에서 서비스 상태 확인
   - "마이페이지" → "오픈API 신청현황"에서 승인 상태 확인

3. **로그 확인**
   ```bash
   # 콘솔에서 API 호출 로그 확인
   # "기상청 직접 API 호출 시작" 메시지 확인
   ```

#### 특정 지역을 찾을 수 없는 경우
1. **지역명 확인**
   - 정확한 시/군/구명 입력 (예: "수원시", "강남구")
   - 드롭다운에서 선택한 시/도와 일치하는지 확인

2. **지원 지역 확인**
   ```
   /날씨 시도:경기도 시군구:잘못된지역
   ```
   오류 메시지에서 사용 가능한 지역 목록 확인

### 🐛 고급 디버깅

#### API 응답 로그 활성화
```javascript
// kmaDirectWeatherHandler.js에서
console.log('📄 원본 응답 데이터:', data);
```

#### 결측값 처리 확인
```javascript
// 기상청 -9, -99 결측값 확인
const safeParse = (value, defaultValue, fieldName) => {
    console.log(`${fieldName}: ${value} → ${parsed}`);
    // ...
};
```

### 📞 지원 및 문의

**🔗 연락처**:
- **GitHub Issues**: [프로젝트 이슈](https://github.com/yourusername/discord-weather-bot/issues)
- **Discord**: 테스트 서버에서 실시간 지원
- **Email**: 개발자 이메일

**📋 이슈 리포팅 가이드**:
1. **환경 정보**: Node.js 버전, OS, Discord.js 버전
2. **재현 단계**: 문제 발생 상황 상세 기술
3. **로그 첨부**: 콘솔 오류 메시지 첨부
4. **예상 결과**: 기대했던 동작 설명

## 🤝 기여하기

### 🔄 개발 가이드

1. **개발 환경 설정**
   ```bash
   git clone https://github.com/yourusername/discord-weather-bot.git
   cd discord-weather-bot
   npm install
   cp .env.example .env
   ```

2. **기능 개발**
   ```bash
   git checkout -b feature/새로운-기능
   # 개발 진행
   npm test  # 테스트 실행
   ```

3. **코드 품질**
   ```bash
   npm run lint     # ESLint 검사
   npm run format   # Prettier 포맷팅
   ```

### 💡 기여 아이디어

#### 🌟 우선순위 높음
- [ ] **추가 API 연동**: OpenWeatherMap, AccuWeather
- [ ] **알림 기능**: 특정 날씨 조건 시 자동 알림
- [ ] **통계 기능**: 지역별 날씨 통계 및 트렌드
- [ ] **예보 기능**: 단기 예보 정보 제공

#### 🔮 향후 계획
- [ ] **다국어 지원**: 영어, 일본어 인터페이스
- [ ] **커스텀 알림**: 사용자 정의 날씨 조건 알림
- [ ] **데이터 시각화**: 차트 및 그래프 생성
- [ ] **AI 예측**: 머신러닝 기반 날씨 예측

### 📝 개발 규칙

- **코딩 스타일**: [JavaScript Standard Style](https://standardjs.com/)
- **커밋 메시지**: [Conventional Commits](https://conventionalcommits.org/)
- **브랜치 전략**: Git Flow
- **테스트**: Jest 프레임워크 사용

## 📈 로드맵

### 🎯 버전 1.x (현재)
- ✅ 기본 날씨 조회 기능
- ✅ 전국 지역 지원
- ✅ 활동 적합도 분석
- ✅ 기상청 API 연동

### 🚀 버전 2.x (계획)
- 🔄 예보 정보 추가
- 🔄 알림 시스템
- 🔄 통계 기능
- 🔄 성능 최적화

### 🌟 버전 3.x (장기)
- 📅 다국어 지원
- 📅 AI 기반 예측
- 📅 데이터 시각화
- 📅 모바일 앱 연동

## 📄 라이센스

이 프로젝트는 [MIT 라이센스](LICENSE) 하에 배포됩니다.

```
MIT License

Copyright (c) 2025 KucoSang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**⭐ 유용했다면 별표를 눌러주세요!**

**🌤️ 전국 어디서든 정확한 날씨 정보를 제공합니다**

[🐛 버그 신고](https://github.com/yourusername/discord-weather-bot/issues) • [💡 기능 제안](https://github.com/yourusername/discord-weather-bot/issues) • [📖 문서](https://github.com/yourusername/discord-weather-bot/wiki) • [💬 커뮤니티](https://discord.gg/weather-bot)

**실시간 날씨 • 활동 분석 • 전국 지원**

</div>
