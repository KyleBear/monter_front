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

export const initRewardMgmtPage = (container) => {
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
        <div class="reward-mgmt-info">
            <strong>리워드 키워드 관리</strong><br>
            키워드를 입력하여 메인키워드를 추출하고 리워드를 생성할 수 있습니다.
        </div>

        <div class="reward-mgmt-form">
            <div class="form-group">
                <label>키워드 <span style="color: red;">*</span></label>
                <input type="text" id="reward-mgmt-keyword" placeholder="띄어쓰기로 구분된 키워드를 입력하세요 (예: 클리크 천연가죽 가방)" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <small style="color: #666; font-size: 12px;">최소 2개 단어 이상 입력해야 합니다.</small>
            </div>

            <div class="form-group">
                <label>상품 NVMD <span style="color: red;">*</span></label>
                <input type="text" id="reward-mgmt-nvmid" placeholder="상품의 nvmid를 입력하세요" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>

            <div class="form-group">
                <label>추출 개수 <span style="color: red;">*</span></label>
                <select id="reward-mgmt-count" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="10">10개</option>
                    <option value="20">20개</option>
                    <option value="30">30개</option>
                </select>
            </div>

            <div class="form-group">
                <label>상품 URL (선택)</label>
                <input type="text" id="reward-mgmt-product-url" placeholder="상품 URL을 입력하세요 (선택사항)" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>

            <div class="form-group" style="margin-top: 20px;">
                <button id="reward-mgmt-submit-btn" class="btn-register" style="width: 100%; padding: 12px; font-size: 16px; font-weight: bold;">
                    메인키워드 추출
                </button>
            </div>
        </div>

        <div id="reward-mgmt-result" style="margin-top: 30px; display: none;">
            <h3 style="margin-bottom: 15px;">추출 결과</h3>
            <div id="reward-mgmt-result-content"></div>
        </div>
    `;

    initRewardMgmtEvents();
};

// 이벤트 초기화
const initRewardMgmtEvents = () => {
    const submitBtn = document.getElementById('reward-mgmt-submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            await extractKeywords();
        });
    }
};

// 메인키워드 추출
const extractKeywords = async () => {
    const keyword = document.getElementById('reward-mgmt-keyword').value.trim();
    const nvmid = document.getElementById('reward-mgmt-nvmid').value.trim();
    const count = parseInt(document.getElementById('reward-mgmt-count').value, 10);
    const productUrl = document.getElementById('reward-mgmt-product-url').value.trim();

    // 유효성 검사
    if (!keyword) {
        alert('키워드를 입력해주세요.');
        return;
    }

    if (!nvmid) {
        alert('상품 NVMD를 입력해주세요.');
        return;
    }

    if (!count || ![10, 20, 30].includes(count)) {
        alert('추출 개수는 10, 20, 30 중 하나를 선택해주세요.');
        return;
    }

    // 키워드 단어 개수 확인 (최소 2개)
    const words = keyword.split(/\s+/).filter(w => w.trim().length > 0);
    if (words.length < 2) {
        alert('키워드는 최소 2개 단어 이상이어야 합니다.');
        return;
    }

    // 제출 버튼 비활성화 및 로딩 표시
    const submitBtn = document.getElementById('reward-mgmt-submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '처리 중...';

    try {
        const url = `${API_BASE_URL}/keyword-extract/extract`;
        
        console.log('메인키워드 추출 API 호출:', url);
        console.log('요청 데이터:', { keyword, nvmid, count, product_url: productUrl || null });

        const requestBody = {
            keyword: keyword,
            nvmid: nvmid,
            count: count
        };

        if (productUrl) {
            requestBody.product_url = productUrl;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('메인키워드 추출 성공:', data);
            
            // 결과 표시
            showExtractResult(data);
            alert(data.message || '메인키워드가 성공적으로 추출되었습니다.');
            
            // 입력 필드 초기화 (선택사항)
            // document.getElementById('reward-mgmt-keyword').value = '';
            // document.getElementById('reward-mgmt-nvmid').value = '';
        } else {
            let errorData = {};
            try {
                const errorText = await response.text();
                errorData = errorText ? JSON.parse(errorText) : {};
            } catch (e) {
                errorData = { message: `서버 오류 (${response.status})` };
            }
            
            console.error('메인키워드 추출 실패:', response.status, errorData);
            alert(`메인키워드 추출 실패: ${errorData.detail || errorData.message || '서버 오류가 발생했습니다.'}`);
        }
    } catch (error) {
        console.error('메인키워드 추출 API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    } finally {
        // 제출 버튼 활성화
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
};

// 추출 결과 표시
const showExtractResult = (data) => {
    const resultDiv = document.getElementById('reward-mgmt-result');
    const resultContent = document.getElementById('reward-mgmt-result-content');

    if (!resultDiv || !resultContent) {
        return;
    }

    resultDiv.style.display = 'block';

    if (data.success && data.data && data.data.rewards && data.data.rewards.length > 0) {
        const rewards = data.data.rewards;
        
        let html = `
            <div style="margin-bottom: 15px; padding: 10px; background-color: #e7f3ff; border-radius: 4px;">
                <strong>총 ${data.data.count}개의 메인키워드가 추출되어 저장되었습니다.</strong>
            </div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; background: white;">
                    <thead>
                        <tr style="background-color: #f5f5f5;">
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">순위</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">키워드</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">상점명</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">상품명</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">검색 URL</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        rewards.forEach((reward, index) => {
            html += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">${reward.rank || '-'}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>${reward.keyword || '-'}</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${reward.store_name || '-'}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${reward.product_name || '-'}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">
                        ${reward.search_url ? `<a href="${reward.search_url}" target="_blank" style="color: #007bff; text-decoration: none;">링크</a>` : '-'}
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        resultContent.innerHTML = html;
    } else {
        resultContent.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #666;">
                추출된 키워드가 없습니다.
            </div>
        `;
    }
};
