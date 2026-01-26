import { API_BASE_URL } from '../config.js';

// URL 파라미터에서 사용자 정보 추출 (선택적 - 인증 불필요)
const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const urlParams = {
        user_id: params.get('user_id'),
        token: params.get('token'),
        user_token: params.get('user_token')
    };
    // URL 파라미터가 없어도 동작 (인증 토큰 불필요)
    return urlParams;
};

// 공개 API 호출 (인증 헤더 없음 - sessionStorage 사용 안 함)
const getPublicHeaders = () => {
    return {
        'Content-Type': 'application/json',
        // Authorization 헤더를 명시적으로 제외 - 인증 토큰 불필요
    };
};

// 페이지 초기화 함수 (관리자 체크 제외)
export const initRewardPage = (container) => {
    // 관리자 권한 체크 제외 - 공개 페이지이므로 모든 사용자 접근 가능
    
    if (container) {
        container.innerHTML = `
            <div class="reward-info">
                <strong>리워드</strong><br>
                리워드 상품을 확인하고 태그 이름을 입력할 수 있습니다.
            </div>

            <div class="reward-container" id="reward-container">
                <!-- 리워드 상품 목록이 여기에 동적으로 로드됩니다 -->
            </div>
        `;
    }

    initRewardEvents();
    const urlParams = getUrlParams();
    loadRewardList(urlParams);
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = getUrlParams();
    console.log('URL 파라미터:', urlParams);
    
    // 컨테이너가 이미 HTML에 있으면 그대로 사용, 없으면 initRewardPage 호출
    const container = document.getElementById('reward-container');
    if (container && container.parentElement) {
        // reward.html에서 이미 HTML 구조가 있으므로 그대로 사용
        initRewardEvents();
        loadRewardList(urlParams);
    } else {
        // 동적으로 생성해야 하는 경우
        const pageContainer = document.querySelector('.reward-page-container') || document.body;
        initRewardPage(pageContainer);
    }
});

// 리워드 목록 로드
const loadRewardList = async (urlParams = {}) => {
    try {
        // 공개 엔드포인트 사용 (인증 없이 접근 가능) - /rewards/public
        // 백엔드 엔드포인트: GET /rewards/public
        // 랜덤으로 1개의 리워드 반환 (image_url이 있는 것만)
        const url = `${API_BASE_URL}/rewards/public`;
        
        console.log('리워드 목록 API 호출 (공개 엔드포인트):', url);
        
        // 인증 헤더 없이 공개 API 호출 (인증 토큰 불필요)
        // sessionStorage나 Authorization 헤더를 절대 사용하지 않음
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
                // Authorization 헤더를 명시적으로 제외
            },
        });

        if (response.ok) {
            const data = await response.json();
            console.log('리워드 목록 API 응답 (공개 엔드포인트):', data);
            
            // 백엔드 공개 API 응답 형식: { "success": True, "data": { "rewards": [...] } }
            // 백엔드에서 이미 랜덤으로 1개를 반환하므로 그대로 사용
            let rewards = [];
            if (data.data && data.data.rewards && Array.isArray(data.data.rewards)) {
                rewards = data.data.rewards;
            } else if (data.rewards && Array.isArray(data.rewards)) {
                rewards = data.rewards;
            } else if (Array.isArray(data)) {
                rewards = data;
            }
            
            console.log('받은 리워드 개수:', rewards.length);
            console.log('리워드 데이터:', rewards);
            
            // 백엔드에서 이미 랜덤으로 1개를 반환하므로 그대로 렌더링
            renderRewardList(rewards);
        } else {
            let errorData = {};
            try {
                const errorText = await response.text();
                errorData = errorText ? JSON.parse(errorText) : {};
            } catch (e) {
                errorData = { message: `서버 오류 (${response.status})` };
            }
            
            console.error('리워드 목록 로드 실패:', response.status, errorData);
            const container = document.getElementById('reward-container');
            if (container) {
                container.innerHTML = `<p style="text-align: center; padding: 20px; color: #dc3545;">리워드 목록을 불러올 수 없습니다.<br>오류: ${errorData.message || errorData.detail || '서버 내부 오류'}</p>`;
            }
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        const container = document.getElementById('reward-container');
        if (container) {
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: #dc3545;">서버 연결에 실패했습니다. 네트워크를 확인해주세요.</p>';
        }
    }
};

// 리워드 목록 렌더링
const renderRewardList = (rewards) => {
    const container = document.getElementById('reward-container');
    
    if (!container) {
        console.error('reward-container를 찾을 수 없습니다.');
        return;
    }

    if (!rewards || rewards.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">등록된 리워드가 없습니다.</p>';
        return;
    }
    
    console.log('리워드 목록 렌더링 시작, 개수:', rewards.length);

    // 원본 reward 데이터를 저장 (태그 이름 검증용)
    const rewardDataMap = new Map();
    rewards.forEach(reward => {
        const rewardId = reward.id || reward.reward_id;
        rewardDataMap.set(rewardId, reward);
    });

    container.innerHTML = rewards.map((reward, index) => {
        const rewardId = reward.id || reward.reward_id || index;
        const imageUrl = reward.image_url || '';
        const searchUrl = reward.search_url || reward.product_url || '#';
        const productName = reward.product_name || '-';
        const storeName = reward.store_name || '-';
        const productMid = reward.product_mid || '-';
        const imageTag = reward.image_tag || '';
        
        return `
            <div class="reward-card" data-reward-id="${rewardId}">
                <div class="reward-card-content">
                    <div class="reward-image-section">
                        ${imageUrl ? `<img src="${imageUrl}" alt="${productName}" class="reward-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\'%3E%3Crect fill=\\'%23ddd\\' width=\\'200\\' height=\\'200\\'/%3E%3Ctext fill=\\'%23999\\' font-family=\\'sans-serif\\' font-size=\\'14\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\'%3E이미지 없음%3C/text%3E%3C/svg%3E';">` : '<div class="reward-image-placeholder">이미지 없음</div>'}
                        <a href="${searchUrl}" target="_blank" class="reward-link-btn">상품 누르러 가기</a>
                    </div>
                    <div class="reward-info-section">
                        <div class="reward-store-name">${storeName}</div>
                        <div class="reward-product-name">${productName}</div>
                        <div class="reward-product-mid">상품 MID: ${productMid}</div>
                    </div>
                </div>
                <div class="reward-tag-section">
                    <div class="form-group">
                        <label>태그 이름</label>
                        <textarea 
                            class="reward-image-tag-input" 
                            data-reward-id="${rewardId}"
                            data-original-tag="${imageTag}"
                            placeholder="#태그이름을 입력해주세요"
                            rows="3"
                        ></textarea>
                        <small style="color: #666; font-size: 12px;">테이블의 태그 이름과 일치해야 합니다.</small>
                    </div>
                    <button class="reward-submit-btn" data-reward-id="${rewardId}">제출</button>
                </div>
            </div>
        `;
    }).join('');

    // 제출 버튼 이벤트 바인딩 (reward 데이터 맵 전달)
    bindSubmitButtons(rewardDataMap);
};

// 제출 버튼 이벤트 바인딩
const bindSubmitButtons = (rewardDataMap = new Map()) => {
    const submitButtons = document.querySelectorAll('.reward-submit-btn');
    submitButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const rewardId = btn.getAttribute('data-reward-id');
            const textarea = document.querySelector(`.reward-image-tag-input[data-reward-id="${rewardId}"]`);
            
            if (!textarea) {
                alert('태그 이름 입력 필드를 찾을 수 없습니다.');
                return;
            }
            
            const imageTag = textarea.value.trim();
            
            if (!imageTag) {
                alert('태그 이름을 입력해주세요.');
                return;
            }

            // 테이블의 태그 이름과 일치하는지 확인
            const originalTag = textarea.getAttribute('data-original-tag') || '';
            const rewardData = rewardDataMap.get(parseInt(rewardId)) || {};
            const tableTag = rewardData.image_tag || originalTag;

            console.log('제출 버튼 클릭:', { rewardId, imageTag, tableTag, originalTag });

            // 태그 일치 여부 확인 및 메시지 표시
            if (tableTag) {
                if (imageTag === tableTag) {
                    alert('태그가 일치합니다.');
                    await submitImageTag(rewardId, imageTag);
                } else {
                    alert('태그가 일치하지 않습니다.');
                    return; // 일치하지 않으면 제출하지 않음
                }
            } else {
                // tableTag가 없으면 바로 제출
                console.log('tableTag가 없어서 바로 제출합니다.');
                await submitImageTag(rewardId, imageTag);
            }
        });
    });
};

// 이미지 태그 제출 (공개 API - 인증 없이)
const submitImageTag = async (rewardId, imageTag) => {
    try {
        // URL 파라미터 가져오기
        const urlParams = getUrlParams();
        
        // 공개 엔드포인트 사용 (인증 없이 접근 가능)
        let url = `${API_BASE_URL}/rewards/${rewardId}`;
        
        // URL 파라미터가 있으면 쿼리 파라미터로 추가
        const queryParams = [];
        if (urlParams.user_id) {
            queryParams.push(`user_id=${encodeURIComponent(urlParams.user_id)}`);
        }
        if (urlParams.token) {
            queryParams.push(`token=${encodeURIComponent(urlParams.token)}`);
        }
        if (urlParams.user_token) {
            queryParams.push(`user_token=${encodeURIComponent(urlParams.user_token)}`);
        }
        
        if (queryParams.length > 0) {
            url += '?' + queryParams.join('&');
        }
        
        // 요청 본문에 사용자 정보 포함
        const requestBody = {
            image_tag: imageTag
        };
        
        if (urlParams.user_id) {
            requestBody.user_id = urlParams.user_id;
        }
        if (urlParams.token) {
            requestBody.token = urlParams.token;
        }
        if (urlParams.user_token) {
            requestBody.user_token = urlParams.user_token;
        }
        
        console.log('태그 이름 제출 (공개):', url, requestBody);
        
        // 인증 헤더 없이 공개 API 호출 (인증 토큰 불필요)
        // sessionStorage나 Authorization 헤더를 절대 사용하지 않음
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
                // Authorization 헤더를 명시적으로 제외
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('태그 이름 제출 성공:', data);
            alert('태그 이름이 성공적으로 저장되었습니다.');
            // 목록 새로고침 (랜덤으로 다시 선택)
            const urlParams = getUrlParams();
            loadRewardList(urlParams);
        } else {
            let errorData = {};
            try {
                const errorText = await response.text();
                errorData = errorText ? JSON.parse(errorText) : {};
            } catch (e) {
                errorData = { message: `서버 오류 (${response.status})` };
            }
            
            console.error('태그 이름 제출 실패:', response.status, errorData);
            // alert(`태그 이름 저장 실패: ${errorData.message || errorData.detail || '서버 오류가 발생했습니다.'}`);
        }
    } catch (error) {
        console.error('태그 이름 제출 API 호출 오류:', error);
        // alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
};

// 이벤트 초기화 함수
const initRewardEvents = () => {
    // 추가 이벤트가 필요하면 여기에 작성
};
