const https = require('https');
const database = require('./database');

// 기상청 관측소 코드 매핑 (주요 지역)
const KMA_STATION_CODES = {
    '서울특별시': {
        '강남구': 108,
        '강동구': 108,
        '강북구': 108,
        '강서구': 108,
        '관악구': 108,
        '광진구': 108,
        '구로구': 108,
        '금천구': 108,
        '노원구': 108,
        '도봉구': 108,
        '동대문구': 108,
        '동작구': 108,
        '마포구': 108,
        '서대문구': 108,
        '서초구': 108,
        '성동구': 108,
        '성북구': 108,
        '송파구': 108,
        '양천구': 108,
        '영등포구': 108,
        '용산구': 108,
        '은평구': 108,
        '종로구': 108,
        '중구': 108,
        '중랑구': 108
    },
    '경기도': {
        '수원시': 119,
        '성남시': 119,
        '고양시': 108, // 서울 인접
        '용인시': 119,
        '부천시': 108, // 서울 인접
        '안산시': 119,
        '안양시': 119,
        '남양주시': 108, // 서울 인접
        '화성시': 119,
        '평택시': 119,
        '의정부시': 108, // 서울 인접
        '시흥시': 119,
        '광명시': 108, // 서울 인접
        '김포시': 108, // 서울 인접
        '군포시': 119,
        '하남시': 108, // 서울 인접
        '오산시': 119,
        '이천시': 203, // 이천
        '안성시': 119,
        '구리시': 108, // 서울 인접
        '의왕시': 119,
        '양주시': 108, // 서울 인접
        '동두천시': 98, // 동두천
        '과천시': 108, // 서울 인접
        '광주시': 119,
        '파주시': 98, // 동두천 인접
        '여주시': 203, // 이천 인접
        '양평군': 119,
        '가평군': 211, // 가평
        '연천군': 98, // 동두천 인접
        '포천시': 98 // 동두천 인접
    },
    '부산광역시': {
        '해운대구': 159,
        '부산진구': 159,
        '동래구': 159,
        '남구': 159,
        '중구': 159,
        '서구': 159,
        '사하구': 159,
        '금정구': 159,
        '강서구': 159,
        '연제구': 159,
        '수영구': 159,
        '사상구': 159,
        '북구': 159,
        '영도구': 159,
        '동구': 159,
        '기장군': 159
    },
    '대구광역시': {
        '남구': 143,
        '달서구': 143,
        '달성군': 143,
        '동구': 143,
        '북구': 143,
        '서구': 143,
        '수성구': 143,
        '중구': 143
    },
    '인천광역시': {
        '강화군': 201,
        '계양구': 112,
        '미추홀구': 112,
        '남동구': 112,
        '동구': 112,
        '부평구': 112,
        '서구': 112,
        '연수구': 112,
        '옹진군': 112
    },
    '광주광역시': {
        '광산구': 156,
        '남구': 156,
        '동구': 156,
        '북구': 156,
        '서구': 156
    },
    '대전광역시': {
        '대덕구': 133,
        '동구': 133,
        '서구': 133,
        '유성구': 133,
        '중구': 133
    },
    '울산광역시': {
        '남구': 152,
        '동구': 152,
        '북구': 152,
        '울주군': 152,
        '중구': 152
    },
    '충청남도': {
        '천안시': 232,
        '공주시': 238,
        '보령시': 235,
        '아산시': 232, // 천안 관측소 사용
        '서산시': 129,
        '논산시': 238, // 공주 관측소 사용
        '계룡시': 238, // 공주 관측소 사용
        '당진시': 129, // 서산 관측소 사용
        '금산군': 238, // 공주 관측소 사용
        '부여군': 238, // 공주 관측소 사용
        '서천군': 235, // 보령 관측소 사용
        '청양군': 238, // 공주 관측소 사용
        '홍성군': 129, // 서산 관측소 사용
        '예산군': 232, // 천안 관측소 사용
        '태안군': 129 // 서산 관측소 사용
    },
    '충청북도': {
        '청주시': 131,
        '충주시': 127,
        '제천시': 221,
        '보은군': 226,
        '옥천군': 130,
        '영동군': 135,
        '진천군': 131, // 청주 관측소 사용
        '괴산군': 127, // 충주 관측소 사용
        '음성군': 127, // 충주 관측소 사용
        '단양군': 221, // 제천 관측소 사용
        '증평군': 131 // 청주 관측소 사용
    },
    '강원특별자치도': {
        '춘천시': 101,
        '원주시': 114,
        '강릉시': 105,
        '동해시': 106,
        '태백시': 216,
        '속초시': 90,
        '삼척시': 104,
        '홍천군': 212,
        '횡성군': 213,
        '영월군': 121,
        '평창군': 217,
        '정선군': 217, // 평창 관측소 사용
        '철원군': 95,
        '화천군': 212, // 홍천 관측소 사용
        '양구군': 95, // 철원 관측소 사용
        '인제군': 211, // 가평 관측소 사용
        '고성군': 90, // 속초 관측소 사용
        '양양군': 90 // 속초 관측소 사용
    },
    '전라북도': {
        '전주시': 146,
        '군산시': 140,
        '익산시': 243,
        '정읍시': 245,
        '남원시': 247,
        '김제시': 244,
        '완주군': 146, // 전주 관측소 사용
        '진안군': 248,
        '무주군': 248, // 진안 관측소 사용
        '장수군': 248, // 진안 관측소 사용
        '임실군': 247, // 남원 관측소 사용
        '순창군': 247, // 남원 관측소 사용
        '고창군': 172,
        '부안군': 243 // 익산 관측소 사용
    },
    '전라남도': {
        '광주시': 156,
        '목포시': 165,
        '여수시': 168,
        '순천시': 174,
        '나주시': 170,
        '광양시': 266,
        '담양군': 260,
        '곡성군': 269,
        '구례군': 252,
        '고흥군': 262,
        '보성군': 258,
        '화순군': 264,
        '장흥군': 266, // 광양 관측소 사용
        '강진군': 259,
        '해남군': 261,
        '영암군': 268,
        '무안군': 270,
        '함평군': 272,
        '영광군': 273,
        '장성군': 260, // 담양 관측소 사용
        '완도군': 259, // 강진 관측소 사용
        '진도군': 175,
        '신안군': 165 // 목포 관측소 사용
    },
    '경상북도': {
        '대구시': 143,
        '포항시': 138,
        '경주시': 283,
        '김천시': 279,
        '안동시': 136,
        '구미시': 279, // 김천 관측소 사용
        '영주시': 272,
        '영천시': 281,
        '상주시': 137,
        '문경시': 273, // 영주 관측소 사용
        '경산시': 143, // 대구 관측소 사용
        '군위군': 279, // 김천 관측소 사용
        '의성군': 278,
        '청송군': 276,
        '영양군': 277,
        '영덕군': 277, // 영양 관측소 사용
        '청도군': 143, // 대구 관측소 사용
        '고령군': 279, // 김천 관측소 사용
        '성주군': 279, // 김천 관측소 사용
        '칠곡군': 279, // 김천 관측소 사용
        '예천군': 272, // 영주 관측소 사용
        '봉화군': 271,
        '울진군': 130,
        '울릉군': 115
    },
    '경상남도': {
        '부산시': 159,
        '울산시': 152,
        '창원시': 155,
        '진주시': 192,
        '통영시': 162,
        '사천시': 284,
        '김해시': 253,
        '밀양시': 257,
        '거제시': 294,
        '양산시': 288,
        '의령군': 192, // 진주 관측소 사용
        '함안군': 155, // 창원 관측소 사용
        '창녕군': 255,
        '고성군': 293,
        '남해군': 295,
        '하동군': 284, // 사천 관측소 사용
        '산청군': 192, // 진주 관측소 사용
        '함양군': 192, // 진주 관측소 사용
        '거창군': 284, // 사천 관측소 사용
        '합천군': 192 // 진주 관측소 사용
    },
    '제주특별자치도': {
        '제주시': 184,
        '서귀포시': 189
    }
};

/**
 * 기상청 직접 API를 사용하여 날씨 정보를 가져옵니다
 * @param {string} sido - 시/도
 * @param {string} area - 시/군/구
 * @returns {Promise<Object>} 날씨 정보
 */
function getKMADirectWeatherInfo(sido, area) {
    return new Promise(async (resolve, reject) => {
        try {
            // 캐시된 데이터 확인
            const cachedData = await database.getCachedWeatherData(sido, area);
            if (cachedData) {
                console.log(`💾 캐시된 데이터 사용: ${sido} ${area}`);
                cachedData.source = '캐시된 데이터 (기상청 API)';
                resolve(cachedData);
                return;
            }

            const API_KEY = process.env.KMA_API_KEY;
            console.log('🌤️ 기상청 직접 API 호출 시작');
            console.log(`🔍 지역: ${sido} ${area}`);
            
            if (!API_KEY) {
                console.log('ℹ️ 기상청 API 키가 설정되지 않아 모의 데이터를 사용합니다.');
                resolve(getMockWeatherData(sido, area));
                return;
            }

            // 관측소 코드 조회
            const stationCode = KMA_STATION_CODES[sido]?.[area];
            if (!stationCode) {
                console.log(`❌ ${sido} ${area}의 관측소 코드를 찾을 수 없어 모의 데이터를 사용합니다.`);
                console.log(`📋 ${sido}에서 사용 가능한 지역:`, Object.keys(KMA_STATION_CODES[sido] || {}));
                resolve(getMockWeatherData(sido, area));
                return;
            }

            console.log(`✅ 관측소 코드: ${stationCode}`);

            // 현재 시간 설정 (기상청 API 형식: YYYYMMDDHHMM)
            const now = new Date();
            const tm = formatTimeForKMA(now);

            console.log(`📅 관측 시간: ${tm}`);

            // API 경로 구성 (올바른 파라미터 형식)
            const apiPath = `/api/typ01/url/kma_sfctm2.php?tm=${tm}&stn=${stationCode}&help=1&authKey=${API_KEY}`;

            console.log('🌐 API 경로:', apiPath);

            // HTTPS 요청 옵션
            const options = {
                hostname: 'apihub.kma.go.kr',
                port: 443,
                path: apiPath,
                method: 'GET',
                headers: {
                    'Content-Type': 'text/plain',
                    'User-Agent': 'Discord-Weather-Bot/1.0'
                }
            };

            console.log('📡 HTTPS 요청 시작...');

            // HTTPS 요청 실행
            const request = https.request(options, (response) => {
                let data = '';

                console.log(`📊 응답 상태: ${response.statusCode}`);
                console.log(`📋 응답 헤더:`, response.headers);

                // 데이터 수신
                response.on('data', (chunk) => {
                    data += chunk;
                });

                // 응답 완료
                response.on('end', async () => {
                    console.log('✅ 데이터 수신 완료');
                    console.log(`📏 데이터 크기: ${data.length} bytes`);

                    try {
                        // 응답 데이터 확인
                        if (!data || data.length < 10) {
                            console.error('❌ 응답 데이터가 너무 짧습니다:', data);
                            resolve(getMockWeatherData(sido, area));
                            return;
                        }

                        console.log('📄 원본 응답 데이터:', data.substring(0, 500) + (data.length > 500 ? '...' : ''));

                        // 기상청 직접 API 데이터 파싱
                        const weatherData = parseKMADirectData(data);
                        
                        if (!weatherData) {
                            console.error('❌ 데이터 파싱 실패');
                            resolve(getMockWeatherData(sido, area));
                            return;
                        }

                        const result = {
                            sido: sido,
                            area: area,
                            temperature: weatherData.temperature || 20,
                            description: weatherData.description || '정보없음',
                            humidity: weatherData.humidity || 50,
                            windSpeed: weatherData.windSpeed || 2.0,
                            pressure: weatherData.pressure || 1013,
                            precipitation: weatherData.precipitation || 0,
                            feelsLike: weatherData.groundTemperature || calculateFeelsLike(weatherData.temperature, weatherData.humidity, weatherData.windSpeed),
                            visibility: weatherData.visibility || 10,
                            formattedTime: weatherData.formattedTime,
                            timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
                            source: '기상청 직접 API',
                            stationCode: stationCode
                        };

                        console.log('🎉 기상청 직접 API 호출 성공!');
                        console.log(`🌡️ 온도: ${result.temperature}°C, 날씨: ${result.description}`);
                        
                        // 데이터 캐싱 (10분간 유효)
                        try {
                            await database.cacheWeatherData(sido, area, result, 10);
                            console.log('💾 날씨 데이터 캐시 저장 완료');
                        } catch (cacheError) {
                            console.error('❌ 캐시 저장 실패:', cacheError.message);
                        }
                        
                        resolve(result);

                    } catch (parseError) {
                        console.error('❌ 데이터 파싱 오류:', parseError.message);
                        console.error('📄 원본 응답:', data.substring(0, 200));
                        resolve(getMockWeatherData(sido, area));
                    }
                });
            });

            // 요청 오류 처리
            request.on('error', (error) => {
                console.error('❌ HTTPS 요청 오류:', error.message);
                resolve(getMockWeatherData(sido, area));
            });

            // 타임아웃 설정
            request.setTimeout(10000, () => {
                console.error('⏰ API 호출 타임아웃');
                request.destroy();
                resolve(getMockWeatherData(sido, area));
            });

            // 요청 전송
            request.end();

        } catch (error) {
            console.error('❌ 기상청 직접 API 호출 오류:', error.message);
            resolve(getMockWeatherData(sido, area));
        }
    });
}

/**
 * 기상청 직접 API 데이터를 파싱합니다
 * @param {string} data - API 응답 데이터
 * @returns {Object|null} 파싱된 날씨 데이터
 */
function parseKMADirectData(data) {
    try {
        console.log('🔍 원본 데이터 분석 시작');
        
        // 기상청 API 응답 분석
        const lines = data.trim().split('\n');
        
        if (lines.length === 0) {
            console.error('❌ 응답 데이터가 비어있습니다');
            return null;
        }

        console.log(`📊 총 ${lines.length}개 라인 받음`);

        // 헤더와 데이터 라인 구분
        let dataLine = '';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            console.log(`라인 ${i}: ${line}`);
            
            // STN으로 시작하는 헤더 라인 건너뛰기
            if (line.includes('STN') || line.includes('#') || line.includes('TM')) {
                console.log('📋 헤더 라인 건너뜀:', line);
                continue;
            }
            
            // 숫자로 시작하는 데이터 라인 찾기
            if (/^\d/.test(line)) {
                dataLine = line;
                console.log('📊 데이터 라인 발견:', dataLine);
                break;
            }
        }

        if (!dataLine) {
            console.error('❌ 유효한 데이터 라인을 찾을 수 없습니다');
            return null;
        }

        // 공백/탭으로 분할하고 빈 필드 제거
        const fields = dataLine.split(/\s+/).filter(field => field.length > 0);
        console.log('🔍 파싱된 필드들:', fields);
        console.log(`📏 필드 개수: ${fields.length}`);
        
        // 안전한 파싱 함수 (기상청 결측값 -9, -99 처리)
        const safeParse = (value, defaultValue, fieldName) => {
            const parsed = parseFloat(value);
            // -9, -99는 기상청 결측값 코드
            if (isNaN(parsed) || !isFinite(parsed) || parsed === -9 || parsed === -99) {
                console.log(`🔄 ${fieldName} 결측값(-9/-99) 또는 무효값 → 기본값 ${defaultValue} 사용`);
                return defaultValue;
            }
            return parsed;
        };

        // 기상청 API 실제 필드 순서에 맞춘 매핑
        const result = {
            observationTime: fields[0] || '',                    // TM (관측시각)
            stationCode: fields[1] || '0',                       // STN (지점번호)
            windDirection: safeParse(fields[2], 0, '풍향'),      // WD (풍향)
            windSpeed: safeParse(fields[3], 2.0, '풍속'),        // WS (풍속)
            pressure: safeParse(fields[7], 1013, '기압'),        // PA (현지기압)
            temperature: safeParse(fields[11], 20, '온도'),      // TA (기온)
            humidity: safeParse(fields[13], 50, '습도'),         // HM (상대습도)
            precipitation: safeParse(fields[15], 0, '강수량'),   // RN (강수량)
            visibility: safeParse(fields[32], 10, '시정'),       // VS (시정) - 10m 단위를 m로 변환
            groundTemperature: safeParse(fields[37], "결측값", '지면온도'), // TS (지면온도)
            description: '실측값'
        };

        // 시정 단위 변환 (10m → km)
        if (result.visibility > 0 && result.visibility !== 10) {
            result.visibility = (result.visibility * 10) / 1000; // 기상청 VS 필드는 10m 단위이므로 km로 변환
            result.visibility = Math.round(result.visibility * 100) / 100; // 소수점 2자리까지
        }

        // 관측시간 포맷팅 (YYYYMMDDHHMM → YYYY-MM-DD HH:MM)
        if (result.observationTime && result.observationTime.length === 12) {
            const year = result.observationTime.substring(0, 4);
            const month = result.observationTime.substring(4, 6);
            const day = result.observationTime.substring(6, 8);
            const hour = result.observationTime.substring(8, 10);
            const minute = result.observationTime.substring(10, 12);
            result.formattedTime = `${year}-${month}-${day} ${hour}:${minute}`;
        }

        // 데이터 유효성 검증
        if (result.temperature < -50 || result.temperature > 60) {
            console.warn('⚠️ 온도 값 이상:', result.temperature, '→ 기본값 사용');
            result.temperature = 20;
        }
        if (result.humidity < 0 || result.humidity > 100) {
            console.warn('⚠️ 습도 값 이상:', result.humidity, '→ 기본값 사용');
            result.humidity = 50;
        }
        if (result.pressure < 800 || result.pressure > 1100) {
            console.warn('⚠️ 기압 값 이상:', result.pressure, '→ 기본값 사용');
            result.pressure = 1013;
        }

        console.log('✅ 파싱 결과:', result);
        return result;

    } catch (error) {
        console.error('❌ 데이터 파싱 중 오류:', error.message);
        return null;
    }
}

/**
 * 기상청 API용 시간 형식으로 변환 (YYYYMMDDHHMM)
 * @param {Date} date - 날짜 객체
 * @returns {string} YYYYMMDDHHMM 형식
 */
function formatTimeForKMA(date) {
    // 현재 시간에서 1시간 전 데이터 조회 (관측 데이터 갱신 시간 고려)
    const adjustedDate = new Date(date.getTime() - 60 * 60 * 1000);
    
    const year = adjustedDate.getFullYear();
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const hour = String(adjustedDate.getHours()).padStart(2, '0');
    const minute = '00'; // 정시로 고정
    
    return `${year}${month}${day}${hour}${minute}`;
}

/**
 * 체감온도를 계산합니다
 * @param {number} temp - 기온
 * @param {number} humidity - 습도
 * @param {number} windSpeed - 풍속
 * @returns {number} 체감온도
 */
function calculateFeelsLike(temp, humidity, windSpeed) {
    if (!temp) return 20;
    const feelsLike = temp + (humidity - 50) * 0.1 - windSpeed * 0.5;
    return Math.round(feelsLike);
}

/**
 * 모의 날씨 데이터를 생성합니다
 * @param {string} sido - 시/도
 * @param {string} area - 시/군/구
 * @returns {Object} 모의 날씨 정보
 */
function getMockWeatherData(sido, area) {
    const temperatures = [15, 18, 22, 25, 28, 20, 12];
    const descriptions = ['맑음', '구름조금', '흐림', '비', '눈', '안개'];
    const humidity = [45, 55, 65, 75, 85];
    const windSpeeds = [2.5, 3.2, 4.1, 5.8, 1.2];

    const randomTemp = temperatures[Math.floor(Math.random() * temperatures.length)];
    const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
    const randomHumidity = humidity[Math.floor(Math.random() * humidity.length)];
    const randomWind = windSpeeds[Math.floor(Math.random() * windSpeeds.length)];

    return {
        sido: sido,
        area: area,
        temperature: randomTemp,
        description: randomDesc,
        humidity: randomHumidity,
        windSpeed: randomWind,
        pressure: 1013,
        feelsLike: randomTemp + Math.floor(Math.random() * 6) - 3,
        visibility: 10,
        timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        isMockData: true,
        source: '모의 데이터 (직접 API용)'
    };
}

/**
 * 런닝 적합도를 분석합니다
 * @param {Object} weather - 날씨 정보
 * @returns {Object} 런닝 적합도
 */
function analyzeRunningConditions(weather) {
    let score = 0;
    let reasons = [];

    // 온도 분석 (15-25도가 최적)
    if (weather.temperature >= 15 && weather.temperature <= 25) {
        score += 40;
        reasons.push('적정 온도');
    } else if (weather.temperature >= 10 && weather.temperature < 15) {
        score += 25;
        reasons.push('조금 서늘함');
    } else if (weather.temperature > 25 && weather.temperature <= 30) {
        score += 20;
        reasons.push('조금 더움');
    } else {
        score += 0;
        reasons.push(weather.temperature < 10 ? '너무 추움' : '너무 더움');
    }

    // 날씨 상태 분석
    if (weather.description.includes('맑') || weather.description.includes('구름조금')) {
        score += 30;
        reasons.push('좋은 날씨');
    } else if (weather.description.includes('흐림') || weather.description.includes('구름많음')) {
        score += 20;
        reasons.push('흐린 날씨');
    } else if (weather.description.includes('비') || weather.description.includes('눈')) {
        score += 0;
        reasons.push('강수');
    }

    // 바람 분석
    if (weather.windSpeed <= 3) {
        score += 20;
        reasons.push('바람 적음');
    } else if (weather.windSpeed <= 6) {
        score += 10;
        reasons.push('바람 보통');
    } else {
        score += 0;
        reasons.push('바람 강함');
    }

    // 습도 분석
    if (weather.humidity <= 60) {
        score += 10;
        reasons.push('적정 습도');
    } else if (weather.humidity <= 80) {
        score += 5;
        reasons.push('습도 보통');
    } else {
        score += 0;
        reasons.push('습도 높음');
    }

    // 점수에 따른 등급 결정
    let grade, emoji, advice;
    if (score >= 80) {
        grade = '매우 좋음';
        emoji = '🏃‍♂️✨';
        advice = '런닝하기 완벽한 날씨입니다!';
    } else if (score >= 60) {
        grade = '좋음';
        emoji = '🏃‍♂️👍';
        advice = '런닝하기 좋은 날씨입니다.';
    } else if (score >= 40) {
        grade = '나쁨';
        emoji = '🏃‍♂️⚠️';
        advice = '런닝 시 주의가 필요합니다.';
    } else {
        grade = '매우 나쁨';
        emoji = '🏃‍♂️❌';
        advice = '런닝을 권장하지 않습니다.';
    }

    return {
        grade,
        emoji,
        score,
        advice,
        reasons: reasons.slice(0, 3)
    };
}

/**
 * 캠핑 적합도를 분석합니다
 * @param {Object} weather - 날씨 정보
 * @returns {Object} 캠핑 적합도
 */
function analyzeCampingConditions(weather) {
    let score = 0;
    let reasons = [];

    // 온도 분석 (10-25도가 최적)
    if (weather.temperature >= 10 && weather.temperature <= 25) {
        score += 35;
        reasons.push('적정 온도');
    } else if (weather.temperature >= 5 && weather.temperature < 10) {
        score += 20;
        reasons.push('조금 추움');
    } else if (weather.temperature > 25 && weather.temperature <= 30) {
        score += 25;
        reasons.push('조금 더움');
    } else {
        score += 0;
        reasons.push(weather.temperature < 5 ? '너무 추움' : '너무 더움');
    }

    // 날씨 상태 분석 (캠핑은 비/눈에 매우 민감)
    if (weather.description.includes('맑') || weather.description.includes('구름조금')) {
        score += 40;
        reasons.push('맑은 날씨');
    } else if (weather.description.includes('흐림') || weather.description.includes('구름많음')) {
        score += 25;
        reasons.push('흐린 날씨');
    } else if (weather.description.includes('비') || weather.description.includes('눈')) {
        score += 0;
        reasons.push('강수로 위험');
    }

    // 바람 분석
    if (weather.windSpeed <= 2) {
        score += 15;
        reasons.push('바람 약함');
    } else if (weather.windSpeed <= 5) {
        score += 10;
        reasons.push('바람 보통');
    } else if (weather.windSpeed <= 8) {
        score += 5;
        reasons.push('바람 강함');
    } else {
        score += 0;
        reasons.push('바람 매우 강함');
    }

    // 가시거리 분석
    if (weather.visibility >= 8) {
        score += 10;
        reasons.push('시야 양호');
    } else if (weather.visibility >= 5) {
        score += 5;
        reasons.push('시야 보통');
    } else {
        score += 0;
        reasons.push('시야 불량');
    }

    // 점수에 따른 등급 결정
    let grade, emoji, advice;
    if (score >= 80) {
        grade = '매우 좋음';
        emoji = '🏕️✨';
        advice = '캠핑하기 완벽한 날씨입니다!';
    } else if (score >= 60) {
        grade = '좋음';
        emoji = '🏕️👍';
        advice = '캠핑하기 좋은 날씨입니다.';
    } else if (score >= 40) {
        grade = '나쁨';
        emoji = '🏕️⚠️';
        advice = '캠핑 시 주의가 필요합니다.';
    } else {
        grade = '매우 나쁨';
        emoji = '🏕️❌';
        advice = '캠핑을 권장하지 않습니다.';
    }

    return {
        grade,
        emoji,
        score,
        advice,
        reasons: reasons.slice(0, 3)
    };
}

module.exports = {
    getKMADirectWeatherInfo,
    analyzeRunningConditions,
    analyzeCampingConditions,
    KMA_STATION_CODES
};