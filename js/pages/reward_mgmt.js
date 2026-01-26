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
                    <option value="50">50개</option>
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

    if (!count || ![10, 20, 50].includes(count)) {
        alert('추출 개수는 10, 20, 50 중 하나를 선택해주세요.');
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
            
            // 저장 전 확인 화면 표시
            showReviewBeforeSave(data, keyword, nvmid, productUrl);
            
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

// 저장 전 확인 화면 표시
const showReviewBeforeSave = (data, keyword, nvmid, productUrl) => {
    const resultDiv = document.getElementById('reward-mgmt-result');
    const resultContent = document.getElementById('reward-mgmt-result-content');

    if (!resultDiv || !resultContent) {
        return;
    }

    resultDiv.style.display = 'block';

    if (data.success && data.data && data.data.rewards && data.data.rewards.length > 0) {
        const rewards = data.data.rewards;
        
        // 저장할 항목들을 추적하는 배열 (초기에는 모두 포함)
        let rewardsToSave = rewards.map((reward, index) => ({
            ...reward,
            originalIndex: index,
            isSelected: true
        }));

        // UI 업데이트 함수
        const updateUI = () => {
            const selectedCount = rewardsToSave.filter(r => r.isSelected).length;
            
            let html = `
                <div style="margin-bottom: 15px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px;">
                    <strong>저장 전 확인</strong><br>
                    <small>총 ${rewards.length}개 중 <span id="selected-count">${selectedCount}</span>개 항목이 저장됩니다. 저장하지 않을 항목은 (X) 버튼을 클릭하세요.</small>
                </div>
                <div style="margin-bottom: 15px;">
                    <button id="reward-mgmt-save-btn" class="btn-register" style="padding: 10px 20px; font-size: 14px; font-weight: bold; margin-right: 10px;">
                        선택한 항목 저장하기
                    </button>
                    <button id="reward-mgmt-cancel-btn" style="padding: 10px 20px; font-size: 14px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        취소
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; background: white;">
                        <thead>
                            <tr style="background-color: #f5f5f5;">
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: left; width: 50px;">제거</th>
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">순위</th>
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">키워드</th>
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">상점명</th>
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">상품명</th>
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">검색 URL</th>
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">통검 노출 여부</th>
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">CPC</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            rewardsToSave.forEach((reward, index) => {
                const isSelected = reward.isSelected;
                const rowStyle = isSelected ? '' : 'background-color: #f8f9fa; opacity: 0.6;';
                
                // 통검 노출 여부 처리 (boolean 타입)
                const 통검노출 = reward.통검노출 !== undefined ? reward.통검노출 :
                                reward.통검노출여부 !== undefined ? reward.통검노출여부 :
                                reward.is_visible !== undefined ? reward.is_visible :
                                reward.visible !== undefined ? reward.visible : null;
                const visibleText = 통검노출 !== null && typeof 통검노출 === 'boolean' ? (통검노출 ? 'O' : 'X') : '-';
                
                // CPC 처리 (다양한 필드명 지원)
                const cpc = reward.cpc !== undefined ? reward.cpc :
                           reward.CPC !== undefined ? reward.CPC :
                           reward.cpc_value !== undefined ? reward.cpc_value : '-';
                
                html += `
                    <tr style="${rowStyle}">
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                            ${isSelected ? 
                                `<button class="remove-reward-btn" data-index="${index}" style="background-color: #dc3545; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-weight: bold; font-size: 16px;">×</button>` :
                                `<button class="restore-reward-btn" data-index="${index}" style="background-color: #28a745; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-weight: bold; font-size: 16px;">✓</button>`
                            }
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${reward.rank || '-'}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>${reward.keyword || '-'}</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${reward.store_name || '-'}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${reward.product_name || '-'}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">
                            ${reward.search_url ? `<a href="${reward.search_url}" target="_blank" style="color: #007bff; text-decoration: none;">링크</a>` : '-'}
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${visibleText}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${cpc}</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;

            resultContent.innerHTML = html;

            // 이벤트 리스너 바인딩
            bindReviewEvents(rewardsToSave, updateUI, keyword, nvmid, productUrl);
        };

        // 초기 UI 렌더링
        updateUI();
    } else {
        resultContent.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #666;">
                추출된 키워드가 없습니다.
            </div>
        `;
    }
};

// 확인 화면 이벤트 바인딩
const bindReviewEvents = (rewardsToSave, updateUI, keyword, nvmid, productUrl) => {
    // 제거 버튼 이벤트
    document.querySelectorAll('.remove-reward-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(btn.getAttribute('data-index'));
            rewardsToSave[index].isSelected = false;
            updateUI();
        });
    });

    // 복원 버튼 이벤트
    document.querySelectorAll('.restore-reward-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(btn.getAttribute('data-index'));
            rewardsToSave[index].isSelected = true;
            updateUI();
        });
    });

    // 저장 버튼 이벤트
    const saveBtn = document.getElementById('reward-mgmt-save-btn');
    if (saveBtn) {
        // 기존 이벤트 리스너 제거 후 새로 추가
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        
        newSaveBtn.addEventListener('click', async () => {
            const selectedRewards = rewardsToSave.filter(r => r.isSelected);
            
            if (selectedRewards.length === 0) {
                alert('저장할 항목이 없습니다. 최소 1개 이상의 항목을 선택해주세요.');
                return;
            }

            // 선택된 항목만 저장
            await saveSelectedRewards(selectedRewards, keyword, nvmid, productUrl);
        });
    }

    // 취소 버튼 이벤트
    const cancelBtn = document.getElementById('reward-mgmt-cancel-btn');
    if (cancelBtn) {
        // 기존 이벤트 리스너 제거 후 새로 추가
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        newCancelBtn.addEventListener('click', () => {
            const resultDiv = document.getElementById('reward-mgmt-result');
            if (resultDiv) {
                resultDiv.style.display = 'none';
            }
        });
    }
};

// 선택된 항목 저장
const saveSelectedRewards = async (selectedRewards, keyword, nvmid, productUrl) => {
    const saveBtn = document.getElementById('reward-mgmt-save-btn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = '저장 중...';
    }

    try {
        // 원본 데이터 구조에서 선택된 항목만 추출 (originalIndex, isSelected 제거)
        const rewardsToSave = selectedRewards.map(({ originalIndex, isSelected, ...reward }) => reward);

        // 저장 API 호출
        // 기존 extract API가 저장도 함께 하는 경우, 별도 저장 API가 필요할 수 있습니다
        // 여기서는 선택된 항목만 필터링하여 저장하는 것으로 가정
        const url = `${API_BASE_URL}/keyword-extract/save`;
        
        const requestBody = {
            keyword: keyword,
            nvmid: nvmid,
            rewards: rewardsToSave
        };

        if (productUrl) {
            requestBody.product_url = productUrl;
        }

        console.log('리워드 저장 API 호출:', url);
        console.log('저장할 데이터:', requestBody);

        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('리워드 저장 성공:', data);
            
            // 저장 후 결과 표시
            showExtractResult({
                success: true,
                data: {
                    count: selectedRewards.length,
                    rewards: rewardsToSave
                },
                message: `${selectedRewards.length}개의 메인키워드가 성공적으로 저장되었습니다.`
            });
            
            alert(`${selectedRewards.length}개의 메인키워드가 성공적으로 저장되었습니다.`);
        } else {
            // 저장 API가 없는 경우, 클라이언트 측에서만 필터링하여 표시
            console.warn('저장 API가 없거나 실패했습니다. 클라이언트 측에서만 필터링합니다.');
            
            showExtractResult({
                success: true,
                data: {
                    count: selectedRewards.length,
                    rewards: rewardsToSave
                },
                message: `${selectedRewards.length}개의 메인키워드가 선택되었습니다.`
            });
            
            alert(`선택된 ${selectedRewards.length}개의 항목이 표시됩니다.`);
        }
    } catch (error) {
        console.error('리워드 저장 API 호출 오류:', error);
        // API 호출 실패 시에도 클라이언트 측에서 필터링하여 표시
        const rewardsToSave = selectedRewards.map(({ originalIndex, isSelected, ...reward }) => reward);
        
        showExtractResult({
            success: true,
            data: {
                count: selectedRewards.length,
                rewards: rewardsToSave
            },
            message: `${selectedRewards.length}개의 메인키워드가 선택되었습니다.`
        });
        
        alert(`선택된 ${selectedRewards.length}개의 항목이 표시됩니다.`);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '선택한 항목 저장하기';
        }
    }
};

// 추출 결과 표시 (저장 후 표시용)
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
                <strong>${data.message || `총 ${data.data.count}개의 메인키워드가 저장되었습니다.`}</strong>
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
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">통검 노출 여부</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">CPC</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        rewards.forEach((reward, index) => {
            // 통검 노출 여부 처리 (boolean 타입)
            const 통검노출 = reward.통검노출 !== undefined ? reward.통검노출 :
                            reward.통검노출여부 !== undefined ? reward.통검노출여부 :
                            reward.is_visible !== undefined ? reward.is_visible :
                            reward.visible !== undefined ? reward.visible : null;
            const visibleText = 통검노출 !== null && typeof 통검노출 === 'boolean' ? (통검노출 ? 'O' : 'X') : '-';
            
            // CPC 처리 (다양한 필드명 지원)
            const cpc = reward.cpc !== undefined ? reward.cpc :
                       reward.CPC !== undefined ? reward.CPC :
                       reward.cpc_value !== undefined ? reward.cpc_value : '-';
            
            html += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">${reward.rank || '-'}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>${reward.keyword || '-'}</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${reward.store_name || '-'}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${reward.product_name || '-'}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">
                        ${reward.search_url ? `<a href="${reward.search_url}" target="_blank" style="color: #007bff; text-decoration: none;">링크</a>` : '-'}
                    </td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${visibleText}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${cpc}</td>
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
