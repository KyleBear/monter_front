import { API_BASE_URL } from '../config.js';

// URL 파라미터에서 사용자 정보 추출
const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
        user_id: params.get('user_id'),
        token: params.get('token'),
        user_token: params.get('user_token')
    };
};

// 공개 API 호출 (인증 헤더 없음)
const getPublicHeaders = () => {
    return {
        'Content-Type': 'application/json',
    };
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = getUrlParams();
    console.log('URL 파라미터:', urlParams);
    loadRewardList(urlParams);
});

// 리워드 목록 로드
const loadRewardList = async (urlParams = {}) => {
    try {
        // 공개 엔드포인트 사용 (인증 없이 접근 가능)
        let url = `${API_BASE_URL}/rewards`;
        
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
        
        console.log('리워드 목록 API 호출 (공개):', url);
        console.log('사용자 파라미터:', urlParams);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getPublicHeaders(),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('리워드 목록 API 응답:', data);
            
            // 다양한 응답 형식 지원
            let rewards = [];
            if (data.data && data.data.rewards && Array.isArray(data.data.rewards)) {
                rewards = data.data.rewards;
            } else if (data.rewards && Array.isArray(data.rewards)) {
                rewards = data.rewards;
            } else if (Array.isArray(data)) {
                rewards = data;
            }
            
            console.log('전체 리워드 개수:', rewards.length);
            
            // 랜덤으로 하나의 리워드만 선택
            if (rewards.length > 0) {
                const randomIndex = Math.floor(Math.random() * rewards.length);
                const randomReward = rewards[randomIndex];
                console.log('랜덤으로 선택된 리워드:', randomReward);
                console.log('선택된 인덱스:', randomIndex);
                
                // 하나의 리워드만 배열로 만들어서 렌더링
                renderRewardList([randomReward]);
            } else {
                renderRewardList([]);
            }
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
                            placeholder="태그 이름을 입력하세요"
                            rows="3"
                        >${imageTag}</textarea>
                    </div>
                    <button class="reward-submit-btn" data-reward-id="${rewardId}">제출</button>
                </div>
            </div>
        `;
    }).join('');

    // 제출 버튼 이벤트 바인딩
    bindSubmitButtons();
};

// 제출 버튼 이벤트 바인딩
const bindSubmitButtons = () => {
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
            
            await submitImageTag(rewardId, imageTag);
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
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: getPublicHeaders(),
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
            alert(`태그 이름 저장 실패: ${errorData.message || errorData.detail || '서버 오류가 발생했습니다.'}`);
        }
    } catch (error) {
        console.error('태그 이름 제출 API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
};
