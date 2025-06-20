const axios = require('axios');
const moment = require('moment-timezone');

/**
 * 기상청 예보 API를 통한 날씨 예보 정보 처리
 */
class ForecastHandler {
    constructor() {
        this.baseUrl = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';
        this.apiKey = process.env.KMA_API_KEY;
        
        // 격자 좌표 매핑 (일부 주요 지역)
        this.gridCoordinates = {
            '서울': { '강남구': { nx: 61, ny: 126 }, '종로구': { nx: 60, ny: 127 }, '마포구': { nx: 59, ny: 127 } },
            '부산': { '해운대구': { nx: 99, ny: 75 }, '중구': { nx: 98, ny: 76 } },
            '대구': { '중구': { nx: 89, ny: 90 }, '수성구': { nx: 89, ny: 90 } },
            '인천': { '중구': { nx: 55, ny: 124 }, '남동구': { nx: 56, ny: 124 } },
            '광주': { '동구': { nx: 58, ny: 74 }, '서구': { nx: 57, ny: 74 } },
            '대전': { '유성구': { nx: 67, ny: 100 }, '중구': { nx: 68, ny: 100 } },
            '울산': { '남구': { nx: 102, ny: 84 }, '중구': { nx: 102, ny: 84 } },
            '경기': { 
                '수원시': { nx: 60, ny: 121 }, '성남시': { nx: 63, ny: 124 }, 
                '고양시': { nx: 57, ny: 128 }, '용인시': { nx: 64, ny: 119 }
            },
            '강원': { '춘천시': { nx: 73, ny: 134 }, '원주시': { nx: 76, ny: 122 } },
            '충북': { '청주시': { nx: 69, ny: 106 }, '충주시': { nx: 76, ny: 114 } },
            '충남': { '천안시': { nx: 63, ny: 110 }, '공주시': { nx: 66, ny: 103 } },
            '전북': { '전주시': { nx: 63, ny: 89 }, '군산시': { nx: 56, ny: 92 } },
            '전남': { '목포시': { nx: 50, ny: 67 }, '여수시': { nx: 73, ny: 66 } },
            '경북': { '포항시': { nx: 102, ny: 94 }, '경주시': { nx: 100, ny: 91 } },
            '경남': { '창원시': { nx: 90, ny: 77 }, '김해시': { nx: 95, ny: 77 } },
            '제주': { '제주시': { nx: 52, ny: 38 }, '서귀포시': { nx: 52, ny: 33 } }
        };
    }

    /**
     * 단기 예보 조회 (3일)
     */
    async getShortTermForecast(sido, area) {
        try {
            const coordinates = this.getGridCoordinate(sido, area);
            if (!coordinates) {
                throw new Error(`${sido} ${area}의 격자 좌표를 찾을 수 없습니다.`);
            }

            const baseDate = moment().tz('Asia/Seoul').format('YYYYMMDD');
            const baseTime = this.getBaseTime();

            const params = {
                serviceKey: this.apiKey,
                numOfRows: 290,
                pageNo: 1,
                dataType: 'JSON',
                base_date: baseDate,
                base_time: baseTime,
                nx: coordinates.nx,
                ny: coordinates.ny
            };

            const response = await axios.get(`${this.baseUrl}/getVilageFcst`, { params });
            const data = response.data.response.body.items.item;

            return this.parseShortTermForecast(data);

        } catch (error) {
            console.error('단기 예보 조회 오류:', error);
            return this.getMockForecastData();
        }
    }

    /**
     * 중기 예보 조회 (10일)
     */
    async getMidTermForecast(sido, area) {
        try {
            // 중기예보는 구역별로 제공되므로 지역코드가 필요
            const regionCode = this.getMidTermRegionCode(sido);
            if (!regionCode) {
                throw new Error(`${sido}의 중기예보 지역코드를 찾을 수 없습니다.`);
            }

            const tmFc = moment().tz('Asia/Seoul').format('YYYYMMDD') + '0600';

            // 중기기온조회서비스
            const tempParams = {
                serviceKey: this.apiKey,
                numOfRows: 10,
                pageNo: 1,
                dataType: 'JSON',
                regId: regionCode,
                tmFc: tmFc
            };

            // 중기육상예보조회서비스  
            const landParams = {
                serviceKey: this.apiKey,
                numOfRows: 10,
                pageNo: 1,
                dataType: 'JSON',
                regId: regionCode,
                tmFc: tmFc
            };

            const [tempResponse, landResponse] = await Promise.all([
                axios.get(`${this.baseUrl.replace('VilageFcstInfoService_2.0', 'MidFcstInfoService')}/getMidTa`, { params: tempParams }),
                axios.get(`${this.baseUrl.replace('VilageFcstInfoService_2.0', 'MidFcstInfoService')}/getMidLandFcst`, { params: landParams })
            ]);

            return this.parseMidTermForecast(tempResponse.data, landResponse.data);

        } catch (error) {
            console.error('중기 예보 조회 오류:', error);
            return this.getMockMidTermForecast();
        }
    }

    /**
     * 격자 좌표 조회
     */
    getGridCoordinate(sido, area) {
        if (this.gridCoordinates[sido] && this.gridCoordinates[sido][area]) {
            return this.gridCoordinates[sido][area];
        }
        
        // 기본 좌표 반환 (서울 중심)
        return { nx: 60, ny: 127 };
    }

    /**
     * 발표시간 계산 (API 특성상 특정 시간에만 발표)
     */
    getBaseTime() {
        const now = moment().tz('Asia/Seoul');
        const hour = now.hour();
        
        const baseTimes = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];
        
        for (let i = baseTimes.length - 1; i >= 0; i--) {
            const baseHour = parseInt(baseTimes[i].substring(0, 2));
            if (hour >= baseHour) {
                return baseTimes[i];
            }
        }
        
        return '2300'; // 다음날 기준
    }

    /**
     * 단기 예보 데이터 파싱
     */
    parseShortTermForecast(data) {
        const forecast = {};
        
        data.forEach(item => {
            const date = item.fcstDate;
            const time = item.fcstTime;
            const key = `${date}_${time}`;
            
            if (!forecast[key]) {
                forecast[key] = {
                    date: date,
                    time: time,
                    dateTime: moment(`${date} ${time}`, 'YYYYMMDD HHmm').format('MM월 DD일 HH시')
                };
            }
            
            switch (item.category) {
                case 'TMP': // 온도
                    forecast[key].temperature = parseFloat(item.fcstValue);
                    break;
                case 'REH': // 습도
                    forecast[key].humidity = parseFloat(item.fcstValue);
                    break;
                case 'WSD': // 풍속
                    forecast[key].windSpeed = parseFloat(item.fcstValue);
                    break;
                case 'SKY': // 하늘상태
                    forecast[key].skyCondition = this.getSkyCondition(item.fcstValue);
                    break;
                case 'PTY': // 강수형태
                    forecast[key].precipitationType = this.getPrecipitationType(item.fcstValue);
                    break;
                case 'POP': // 강수확률
                    forecast[key].precipitationProbability = parseFloat(item.fcstValue);
                    break;
                case 'PCP': // 강수량
                    forecast[key].precipitation = item.fcstValue;
                    break;
            }
        });
        
        return Object.values(forecast).slice(0, 24); // 3일간 8회/일 = 24개
    }

    /**
     * 중기 예보 데이터 파싱
     */
    parseMidTermForecast(tempData, landData) {
        const tempItem = tempData.response.body.items.item[0];
        const landItem = landData.response.body.items.item[0];
        
        const forecast = [];
        
        for (let i = 3; i <= 10; i++) {
            const dayData = {
                day: i,
                date: moment().add(i, 'days').format('MM월 DD일'),
                morningTemp: tempItem[`taMin${i}`],
                afternoonTemp: tempItem[`taMax${i}`],
                morningCondition: landItem[`wf${i}Am`],
                afternoonCondition: landItem[`wf${i}Pm`],
                precipitationProbability: landItem[`rnSt${i}Am`]
            };
            forecast.push(dayData);
        }
        
        return forecast;
    }

    /**
     * 하늘 상태 코드 변환
     */
    getSkyCondition(code) {
        const conditions = {
            '1': '맑음',
            '3': '구름많음', 
            '4': '흐림'
        };
        return conditions[code] || '알 수 없음';
    }

    /**
     * 강수 형태 코드 변환
     */
    getPrecipitationType(code) {
        const types = {
            '0': '없음',
            '1': '비',
            '2': '비/눈',
            '3': '눈',
            '4': '소나기'
        };
        return types[code] || '알 수 없음';
    }

    /**
     * 중기예보 지역코드 조회
     */
    getMidTermRegionCode(sido) {
        const codes = {
            '서울': '11B10101',
            '인천': '11B20201', 
            '경기': '11B20101',
            '강원': '11D10301',
            '충북': '11C10301',
            '충남': '11C20101',
            '대전': '11C20401',
            '전북': '11F10201',
            '전남': '11F20201',
            '광주': '11F20501',
            '경북': '11H10701',
            '경남': '11H20301',
            '대구': '11H10201',
            '울산': '11H20201',
            '부산': '11H20101',
            '제주': '11G00201'
        };
        return codes[sido];
    }

    /**
     * 목 데이터 (API 오류 시)
     */
    getMockForecastData() {
        const forecast = [];
        for (let i = 0; i < 8; i++) {
            const futureTime = moment().add(i * 3, 'hours');
            forecast.push({
                dateTime: futureTime.format('MM월 DD일 HH시'),
                temperature: Math.floor(Math.random() * 20) + 10,
                humidity: Math.floor(Math.random() * 30) + 50,
                windSpeed: Math.floor(Math.random() * 5) + 2,
                skyCondition: ['맑음', '구름많음', '흐림'][Math.floor(Math.random() * 3)],
                precipitationType: '없음',
                precipitationProbability: Math.floor(Math.random() * 30)
            });
        }
        return forecast;
    }

    /**
     * 중기 예보 목 데이터
     */
    getMockMidTermForecast() {
        const forecast = [];
        for (let i = 3; i <= 10; i++) {
            forecast.push({
                day: i,
                date: moment().add(i, 'days').format('MM월 DD일'),
                morningTemp: Math.floor(Math.random() * 10) + 5,
                afternoonTemp: Math.floor(Math.random() * 15) + 15,
                morningCondition: ['맑음', '구름많음', '흐림'][Math.floor(Math.random() * 3)],
                afternoonCondition: ['맑음', '구름많음', '흐림'][Math.floor(Math.random() * 3)],
                precipitationProbability: Math.floor(Math.random() * 50)
            });
        }
        return forecast;
    }
}

module.exports = new ForecastHandler();