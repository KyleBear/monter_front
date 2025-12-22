// 환경별 API Base URL 설정
const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    
    // 개발 환경: localhost, 127.0.0.1 등
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname === '0.0.0.0' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')) {
        return 'http://localhost:8000';  // 개발: 백엔드 직접 접근 (/api 없이)
    }
    
    // 프로덕션 환경: re-switch.co.kr 등
    return '/api';  // 프로덕션: Nginx가 /api를 백엔드로 프록시
};

export const API_BASE_URL = getApiBaseUrl();

// 환경 정보
export const ENV = {
    isDevelopment: window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1',
    isProduction: !(window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1')
};

