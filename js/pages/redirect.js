import { API_BASE_URL } from '../config.js';

// 랜덤 문자열 생성 (소문자+숫자 8글자)
const generateRandomString = (length = 8) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// 랜덤 숫자 생성 (0~10)
const generateRandomNumber = (min = 0, max = 10) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// URL에서 짧은 링크 추출
const getShortLinkFromUrl = () => {
    const path = window.location.pathname;
    // 예: /redirect/1afyOKgmBq, /redirect/1afyOKgmBq?, /reward/redirect/1afyOKgmBq
    const parts = path.split('/');
    
    // /redirect/{shortCode} 또는 /reward/redirect/{shortCode} 경로 처리
    if (parts.length >= 3 && (parts[1] === 'redirect' || (parts[1] === 'reward' && parts[2] === 'redirect'))) {
        // short_code 추출
        let shortCode;
        if (parts[1] === 'redirect') {
            shortCode = parts[2];
        } else if (parts[1] === 'reward' && parts[2] === 'redirect' && parts.length >= 4) {
            shortCode = parts[3];
        }
        
        if (shortCode) {
            // ? 또는 쿼리 파라미터 제거
            if (shortCode.includes('?')) {
                shortCode = shortCode.split('?')[0];
            }
            return shortCode;
        }
    }
    return null;
};

// 리다이렉트 실행
const redirectToNaver = async () => {
    try {
        const shortCode = getShortLinkFromUrl();
        
        if (!shortCode) {
            console.error('짧은 링크를 찾을 수 없습니다.');
            document.body.innerHTML = '<div style="text-align: center; padding: 40px;"><h3>잘못된 링크입니다.</h3></div>';
            return;
        }

        console.log('짧은 링크 (short_code):', shortCode);

        // 백엔드 API 호출 - GET /redirect/{short_code}
        // 백엔드가 자동으로 네이버 URL로 302 리다이렉트를 반환함
        // 인증 헤더 없이 호출 (공개 엔드포인트)
        const url = `${API_BASE_URL}/redirect/${shortCode}`;
        
        console.log('리다이렉트 API 호출:', url);

        // 백엔드가 302 리다이렉트를 반환하므로, window.location.href로 직접 호출
        // 브라우저가 자동으로 리다이렉트를 따라감
        window.location.href = url;

    } catch (error) {
        console.error('리다이렉트 오류:', error);
        document.body.innerHTML = '<div style="text-align: center; padding: 40px;"><h3>서버 연결에 실패했습니다.</h3><p>네트워크를 확인해주세요.</p></div>';
    }
};

// 페이지 로드 시 리다이렉트 실행
document.addEventListener('DOMContentLoaded', () => {
    redirectToNaver();
});
