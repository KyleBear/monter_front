import { API_BASE_URL } from '../config.js';

// 공통 헤더 생성 함수
const getAuthHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    // 세션 토큰 가져오기
    const token = sessionStorage.getItem('sessionToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
};

export const initRewardPage = (container) => {
    // 관리자 권한 체크
    const userRole = sessionStorage.getItem('userRole');
    if (userRole !== 'admin') {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h3>접근 권한이 없습니다.</h3>
                <p>이 페이지는 관리자만 접근할 수 있습니다.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="reward-info">
            <strong>리워드 관리</strong><br>
            리워드 상품을 확인하고 태그 이름을 입력할 수 있습니다.
        </div>

        <div class="reward-container" id="reward-container">
            <!-- 리워드 상품 목록이 여기에 동적으로 로드됩니다 -->
        </div>
    `;

    initRewardEvents();
    loadRewardList();
};

// 리워드 목록 로드
const loadRewardList = async () => {
    try {
        const url = `${API_BASE_URL}/rewards`;
        
        console.log('리워드 목록 API 호출:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
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
                            placeholder="태그 이름을 입력하세요"
                            rows="3"
                        >${imageTag}</textarea>
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

            if (tableTag && imageTag !== tableTag) {
                const confirmSave = confirm(
                    `입력한 태그 이름이 테이블의 값과 일치하지 않습니다.\n\n` +
                    `테이블 값: ${tableTag}\n` +
                    `입력한 값: ${imageTag}\n\n` +
                    `계속 저장하시겠습니까?`
                );
                if (!confirmSave) {
                    return;
                }
            }
            
            await submitImageTag(rewardId, imageTag);
        });
    });
};

// 이미지 태그 제출
const submitImageTag = async (rewardId, imageTag) => {
    try {
        const url = `${API_BASE_URL}/rewards/${rewardId}`;
        
        console.log('이미지 태그 제출:', url, { image_tag: imageTag });
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                image_tag: imageTag
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('이미지 태그 제출 성공:', data);
            alert('태그 이름이 성공적으로 저장되었습니다.');
            // 목록 새로고침
            loadRewardList();
        } else {
            let errorData = {};
            try {
                const errorText = await response.text();
                errorData = errorText ? JSON.parse(errorText) : {};
            } catch (e) {
                errorData = { message: `서버 오류 (${response.status})` };
            }
            
            console.error('이미지 태그 제출 실패:', response.status, errorData);
            alert(`태그 이름 저장 실패: ${errorData.message || errorData.detail || '서버 오류가 발생했습니다.'}`);
        }
    } catch (error) {
        console.error('이미지 태그 제출 API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
};

const initRewardEvents = () => {
    // 추가 이벤트가 필요하면 여기에 작성
};
