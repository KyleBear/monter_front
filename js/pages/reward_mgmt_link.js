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

// 짧은 랜덤 링크 생성 함수
const generateShortLink = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

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

export const initRewardMgmtLinkPage = (container) => {
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
        <div class="reward-mgmt-link-info">
            <strong>리워드 링크 관리</strong><br>
            상품명, 쿼리, acq를 입력하여 짧은 랜덤 링크를 생성하고 관리할 수 있습니다.
        </div>

        <!-- 대시보드 카운트 섹션 -->
        <div id="dashboard-count" style="margin-top: 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">총 링크 수</div>
                <div style="font-size: 32px; font-weight: bold;" id="total-links-count">0</div>
            </div>
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 8px; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">총 키워드 수</div>
                <div style="font-size: 32px; font-weight: bold;" id="total-keywords-count">0</div>
            </div>
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 8px; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">총 상품 수</div>
                <div style="font-size: 32px; font-weight: bold;" id="total-products-count">0</div>
            </div>
        </div>

        <!-- 랜덤 링크 생성 섹션 -->
        <div class="reward-mgmt-link-form" style="margin-top: 20px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
            <h3 style="margin-bottom: 15px;">랜덤 링크 생성</h3>
            <div class="form-group">
                <label>상품명 <span style="color: red;">*</span></label>
                <input type="text" id="link-product-name" placeholder="상품명을 입력하세요" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div class="form-group" style="margin-top: 15px;">
                <label>쿼리 (Query) <span style="color: red;">*</span></label>
                <div id="query-list" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                    <!-- 동적으로 추가되는 쿼리 입력 필드들 -->
                </div>
                <button type="button" id="add-query-btn" style="margin-top: 10px; padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">+ 추가</button>
            </div>
            <div class="form-group" style="margin-top: 15px;">
                <label>Acq <span style="color: red;">*</span></label>
                <div id="acq-list" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                    <!-- 동적으로 추가되는 acq 입력 필드들 -->
                </div>
                <button type="button" id="add-acq-btn" style="margin-top: 10px; padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">+ 추가</button>
            </div>
            <div class="form-group" style="margin-top: 15px;">
                <button id="link-create-all-btn" class="btn-register" style="width: 100%; padding: 12px; font-size: 16px; font-weight: bold;">
                    모든 조합으로 랜덤 링크 생성
                </button>
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-left: 4px solid #007bff; border-radius: 4px;">
                <strong style="display: block; margin-bottom: 10px;">링크 생성 안내</strong>
                <p style="margin: 5px 0; font-size: 13px; color: #333;">생성된 링크로 접속하면 랜덤으로 선택된 키워드 조합으로 네이버 검색 페이지로 리다이렉트됩니다:</p>
                <pre style="margin: 10px 0; padding: 10px; background: #fff; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; overflow-x: auto;">https://m.search.naver.com/search.naver?
  sm=mtp_sug.top&
  where=m&
  query={랜덤 선택된 query}&
  ackey={영문숫자 8글자 랜덤}&
  acq={랜덤 선택된 acq}&
  acr={0~10 랜덤}&
  qdt=0</pre>
            </div>
        </div>

        <!-- 생성된 링크 목록 -->
        <div id="link-list-container" style="margin-top: 30px;">
            <h3 style="margin-bottom: 15px;">생성된 링크 목록</h3>
            <div id="link-list-content">
                <table style="width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #ddd;">
                    <thead>
                        <tr style="background: #f8f9fa; border-bottom: 2px solid #ddd;">
                            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">상품명</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">리디렉트 URL</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">쿼리</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Acq</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">키워드 개수</th>
                            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">작업</th>
                        </tr>
                    </thead>
                    <tbody id="link-list-tbody">
                        <tr>
                            <td colspan="6" style="padding: 20px; text-align: center; color: #666;">로딩 중...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    initRewardMgmtLinkEvents();
    loadLinkList();
};


// 이벤트 초기화
const initRewardMgmtLinkEvents = () => {
    // 쿼리 추가 버튼
    const addQueryBtn = document.getElementById('add-query-btn');
    if (addQueryBtn) {
        addQueryBtn.addEventListener('click', () => {
            addQueryRow();
        });
    }

    // Acq 추가 버튼
    const addAcqBtn = document.getElementById('add-acq-btn');
    if (addAcqBtn) {
        addAcqBtn.addEventListener('click', () => {
            addAcqRow();
        });
    }

    // 모든 조합으로 랜덤 링크 생성 버튼
    const createAllBtn = document.getElementById('link-create-all-btn');
    if (createAllBtn) {
        createAllBtn.addEventListener('click', async () => {
            const productName = document.getElementById('link-product-name').value.trim();
            
            if (!productName) {
                alert('상품명을 입력해주세요.');
                return;
            }

            const queries = getQueries();
            const acqs = getAcqs();
            
            if (queries.length === 0) {
                alert('최소 1개 이상의 쿼리를 추가해주세요.');
                return;
            }
            
            if (acqs.length === 0) {
                alert('최소 1개 이상의 acq를 추가해주세요.');
                return;
            }

            // 백엔드에 query_list와 acq_list를 직접 전송 (백엔드가 모든 조합 생성)
            await createAllLinks(productName, queries, acqs);
        });
    }

    // 초기 입력창 하나씩 추가
    addQueryRow();
    addAcqRow();
};

// 쿼리 행 추가 함수
const addQueryRow = () => {
    const container = document.getElementById('query-list');
    if (!container) return;

    const rowId = `query_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const row = document.createElement('div');
    row.className = 'query-row';
    row.setAttribute('data-row-id', rowId);
    row.style.cssText = 'display: flex; gap: 10px; align-items: center; padding: 10px; background: #fff; border: 1px solid #ddd; border-radius: 4px;';
    
    row.innerHTML = `
        <input type="text" class="query-input" placeholder="쿼리 키워드를 입력하세요" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;" required>
        <button type="button" class="btn-remove-query" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">X</button>
    `;

    container.appendChild(row);

    // 삭제 버튼 이벤트
    row.querySelector('.btn-remove-query').addEventListener('click', () => {
        row.remove();
    });
};

// Acq 행 추가 함수
const addAcqRow = () => {
    const container = document.getElementById('acq-list');
    if (!container) return;

    const rowId = `acq_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const row = document.createElement('div');
    row.className = 'acq-row';
    row.setAttribute('data-row-id', rowId);
    row.style.cssText = 'display: flex; gap: 10px; align-items: center; padding: 10px; background: #fff; border: 1px solid #ddd; border-radius: 4px;';
    
    row.innerHTML = `
        <input type="text" class="acq-input" placeholder="acq 키워드를 입력하세요" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;" required>
        <button type="button" class="btn-remove-acq" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">X</button>
    `;

    container.appendChild(row);

    // 삭제 버튼 이벤트
    row.querySelector('.btn-remove-acq').addEventListener('click', () => {
        row.remove();
    });
};

// 입력된 쿼리 목록 가져오기
const getQueries = () => {
    const rows = document.querySelectorAll('.query-row');
    const queries = [];
    
    rows.forEach(row => {
        const query = row.querySelector('.query-input').value.trim();
        if (query) {
            queries.push(query);
        }
    });
    
    return queries;
};

// 입력된 Acq 목록 가져오기
const getAcqs = () => {
    const rows = document.querySelectorAll('.acq-row');
    const acqs = [];
    
    rows.forEach(row => {
        const acq = row.querySelector('.acq-input').value.trim();
        if (acq) {
            acqs.push(acq);
        }
    });
    
    return acqs;
};

// 띄어쓰기를 +로 변환하는 헬퍼 함수
const replaceSpaceWithPlus = (str) => {
    if (!str || str === '-') return str;
    return str.replace(/\s+/g, '+');
};

// 네이버 URL 생성 함수
const generateNaverUrl = (query, acq) => {
    const ackey = generateRandomString(8);
    const acr = generateRandomNumber(0, 10);
    
    // 띄어쓰기를 +로 변환
    const queryWithPlus = query.replace(/\s+/g, '+');
    const acqWithPlus = acq.replace(/\s+/g, '+');
    
    // encodeURIComponent를 사용하되, +는 인코딩하지 않도록 처리
    // encodeURIComponent는 +를 %2B로 변환하므로, 다시 +로 복원
    const encodedQuery = encodeURIComponent(queryWithPlus).replace(/%2B/g, '+');
    const encodedAcq = encodeURIComponent(acqWithPlus).replace(/%2B/g, '+');
    
    const naverUrl = `https://m.search.naver.com/search.naver?` +
        `sm=mtp_sug.top&` +
        `where=m&` +
        `query=${encodedQuery}&` +
        `ackey=${ackey}&` +
        `acq=${encodedAcq}&` +
        `acr=${acr}&` +
        `qdt=0`;
    
    return naverUrl;
};

// 모든 조합으로 랜덤 링크 생성
const createAllLinks = async (productName, queryList, acqList) => {
    try {
        // 입력값 검증
        if (!queryList || queryList.length === 0) {
            alert('최소 1개 이상의 쿼리를 입력해주세요.');
            return;
        }

        if (!acqList || acqList.length === 0) {
            alert('최소 1개 이상의 acq를 입력해주세요.');
            return;
        }

        // 중복 제거 및 공백 제거
        const uniqueQueries = [...new Set(queryList.map(q => q.trim()).filter(q => q))];
        const uniqueAcqs = [...new Set(acqList.map(a => a.trim()).filter(a => a))];

        if (uniqueQueries.length === 0 || uniqueAcqs.length === 0) {
            alert('유효한 쿼리와 acq를 입력해주세요.');
            return;
        }

        // 백엔드 API 호출 - query_list와 acq_list 전송
        // 백엔드는 이를 받아서 모든 조합을 생성하고, 각 조합마다 별도의 link_id를 생성함
        const url = `${API_BASE_URL}/rewards/links`;
        const requestBody = {
            product_name: productName,
            query_list: uniqueQueries,  // 쿼리 리스트
            acq_list: uniqueAcqs        // acq 리스트
        };

        console.log('링크 생성 API 호출:', url);
        console.log('요청 본문:', JSON.stringify(requestBody, null, 2));
        console.log(`쿼리 개수: ${uniqueQueries.length}, Acq 개수: ${uniqueAcqs.length}`);
        console.log(`예상 조합 개수: ${uniqueQueries.length * uniqueAcqs.length}개`);
        console.log(`백엔드가 각 조합마다 별도의 link_id를 생성합니다.`);

        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('링크 생성 성공:', data);
            
            // 백엔드 응답에서 short_code와 reward_link 가져오기
            const responseData = data.data || data;
            const shortCode = responseData.short_code;
            const baseUrl = window.location.origin;
            const redirectLink = `${baseUrl}/redirect/${shortCode}`;
            const expectedCount = uniqueQueries.length * uniqueAcqs.length;
            const createdCount = responseData.created_count || expectedCount;
            const createdLinks = responseData.links || [];
            
            console.log('생성된 링크 상세 정보:', createdLinks);
            console.log(`총 ${createdCount}개의 링크가 생성되었습니다.`);
            console.log(`공통 Short Code: ${shortCode}`);
            
            // 생성된 링크들의 reward_link 확인 (각 조합의 네이버 URL)
            if (createdLinks.length > 0) {
                console.log('생성된 링크들의 reward_link (각 조합의 네이버 URL):');
                createdLinks.forEach((link, index) => {
                    console.log(`  링크 ${index + 1}: link_id=${link.link_id}, short_code=${link.short_code}, reward_link=${link.reward_link}, query=${link.query}, acq=${link.acq}`);
                });
            }
            
            alert(`링크가 생성되었습니다!\n\nShort Code: ${shortCode}\n리다이렉트 링크: ${redirectLink}\n생성된 링크 수: ${createdCount}개\n\n각 링크의 reward_link에 해당 조합의 네이버 URL이 저장되었습니다.\n접속 시 랜덤으로 키워드 조합이 선택됩니다.`);
            
            // 입력 필드 초기화
            document.getElementById('link-product-name').value = '';
            document.getElementById('query-list').innerHTML = '';
            document.getElementById('acq-list').innerHTML = '';
            addQueryRow(); // 빈 행 하나 추가
            addAcqRow(); // 빈 행 하나 추가
            
            // 목록 새로고침
            loadLinkList();
        } else {
            let errorMessage = `서버 오류 (${response.status})`;
            try {
                const errorText = await response.text();
                console.error('서버 응답:', errorText);
                if (errorText) {
                    try {
                        const errorData = JSON.parse(errorText);
                        if (typeof errorData === 'string') {
                            errorMessage = errorData;
                        } else if (errorData.message && typeof errorData.message === 'string') {
                            errorMessage = errorData.message;
                        } else if (errorData.detail && typeof errorData.detail === 'string') {
                            errorMessage = errorData.detail;
                        } else {
                            errorMessage = JSON.stringify(errorData);
                        }
                    } catch (e) {
                        errorMessage = errorText;
                    }
                }
            } catch (e) {
                console.error('오류 메시지 파싱 실패:', e);
            }
            
            console.error('링크 생성 실패:', response.status, errorMessage);
            alert(`링크 생성 실패: ${errorMessage}\n\n콘솔을 확인하여 상세 오류를 확인하세요.`);
        }
    } catch (error) {
        console.error('링크 생성 프로세스 오류:', error);
        alert(`링크 생성 중 오류가 발생했습니다: ${error.message}`);
    }
};

// 새 링크 생성 (단일 조합용 - 호환성 유지)
const createNewLink = async (productName, query, acq) => {
    try {
        const shortLink = generateShortLink();
        const baseUrl = window.location.origin;
        const redirectLink = `${baseUrl}/redirect/${shortLink}`;
        
        // 네이버 URL 형식으로 생성
        const naverUrl = generateNaverUrl(query, acq);

        // 백엔드 API 호출 (예상 엔드포인트: POST /rewards/links)
        const url = `${API_BASE_URL}/rewards/links`;
        const requestBody = {
            short_link: shortLink,
            product_name: productName,
            redirect_url: naverUrl, // 네이버 URL 형식으로 저장
            keywords: [{
                query: query,
                acq: acq
            }]
        };

        console.log('링크 생성 API 호출:', url, requestBody);
        console.log('생성된 네이버 URL:', naverUrl);

        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('링크 생성 성공:', data);
            alert(`링크가 생성되었습니다.\n리다이렉트 링크: ${redirectLink}\n네이버 URL: ${naverUrl}`);
            
            // 입력 필드 초기화
            document.getElementById('link-product-name').value = '';
            document.getElementById('link-query-input').value = '';
            document.getElementById('link-acq-input').value = '';
            
            // 목록 새로고침
            loadLinkList();
        } else {
            let errorMessage = `서버 오류 (${response.status})`;
            try {
                const errorText = await response.text();
                if (errorText) {
                    try {
                        const errorData = JSON.parse(errorText);
                        // 오류 메시지 추출 (다양한 형식 지원)
                        if (typeof errorData === 'string') {
                            errorMessage = errorData;
                        } else if (errorData.message && typeof errorData.message === 'string') {
                            errorMessage = errorData.message;
                        } else if (errorData.detail && typeof errorData.detail === 'string') {
                            errorMessage = errorData.detail;
                        } else if (errorData.error && typeof errorData.error === 'string') {
                            errorMessage = errorData.error;
                        } else if (typeof errorData === 'object') {
                            errorMessage = JSON.stringify(errorData);
                        } else {
                            errorMessage = errorText;
                        }
                    } catch (e) {
                        errorMessage = errorText;
                    }
                }
            } catch (e) {
                console.error('오류 메시지 파싱 실패:', e);
            }
            
            console.error('링크 생성 실패:', response.status, errorMessage);
            alert(`링크 생성 실패: ${errorMessage}`);
        }
    } catch (error) {
        console.error('링크 생성 API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
};


// short_code별로 링크 그룹화 함수
const groupLinksByShortCode = (links) => {
    const grouped = new Map();
    
    links.forEach(link => {
        const shortCode = link.short_code || '';
        const linkId = link.link_id || link.id;
        
        if (!shortCode) return;
        
        if (!grouped.has(shortCode)) {
            // 첫 번째 링크 정보로 그룹 생성
            grouped.set(shortCode, {
                short_code: shortCode,
                product_name: link.product_name || '상품명 없음',
                reward_link: link.reward_link || '',
                link_ids: [linkId],
                keywords: []
            });
        }
        
        // 키워드 추가 (각 키워드가 속한 link_id 정보 포함)
        const group = grouped.get(shortCode);
        if (link.keywords && Array.isArray(link.keywords)) {
            link.keywords.forEach(kw => {
                // 중복 체크 (link_id도 함께 확인)
                const exists = group.keywords.some(existing => 
                    existing.keyword_id === kw.keyword_id ||
                    (existing.query_keyword === (kw.query_keyword || kw.query) &&
                     existing.acq_keyword === (kw.acq_keyword || kw.acq) &&
                     existing.link_id === linkId)
                );
                
                if (!exists) {
                    group.keywords.push({
                        keyword_id: kw.keyword_id,
                        link_id: linkId,  // 각 키워드가 속한 link_id 추가
                        query_keyword: kw.query_keyword || kw.query,
                        acq_keyword: kw.acq_keyword || kw.acq,
                        query: kw.query_keyword || kw.query,
                        acq: kw.acq_keyword || kw.acq
                    });
                }
            });
        }
        
        // link_id 추가 (중복 방지)
        if (linkId && !group.link_ids.includes(linkId)) {
            group.link_ids.push(linkId);
        }
    });
    
    return Array.from(grouped.values());
};

// 링크 목록 로드
const loadLinkList = async () => {
    try {
        // 백엔드 API 호출 (GET /rewards/links)
        const url = `${API_BASE_URL}/rewards/links`;
        
        console.log('링크 목록 API 호출:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            console.log('링크 목록 API 응답:', data);
            
            let links = [];
            if (data.data && data.data.links && Array.isArray(data.data.links)) {
                links = data.data.links;
            } else if (data.links && Array.isArray(data.links)) {
                links = data.links;
            } else if (Array.isArray(data)) {
                links = data;
            }
            
            // short_code별로 그룹화 (같은 short_code를 가진 링크들을 하나로 묶음)
            const groupedLinks = groupLinksByShortCode(links);
            console.log('그룹화된 링크:', groupedLinks);
            
            // 대시보드 통계 업데이트
            updateDashboardCount(groupedLinks);
            
            renderLinkList(groupedLinks);
        } else {
            let errorMessage = `서버 오류 (${response.status})`;
            try {
                const errorText = await response.text();
                if (errorText) {
                    try {
                        const errorData = JSON.parse(errorText);
                        if (typeof errorData === 'string') {
                            errorMessage = errorData;
                        } else if (errorData.message && typeof errorData.message === 'string') {
                            errorMessage = errorData.message;
                        } else if (errorData.detail && typeof errorData.detail === 'string') {
                            errorMessage = errorData.detail;
                        } else if (errorData.error && typeof errorData.error === 'string') {
                            errorMessage = errorData.error;
                        } else {
                            errorMessage = errorText;
                        }
                    } catch (e) {
                        errorMessage = errorText;
                    }
                }
            } catch (e) {
                console.error('오류 메시지 파싱 실패:', e);
            }
            
            console.error('링크 목록 로드 실패:', response.status, errorMessage);
            const container = document.getElementById('link-list-content');
            if (container) {
                container.innerHTML = `<p style="text-align: center; padding: 20px; color: #dc3545;">링크 목록을 불러올 수 없습니다.<br>오류: ${errorMessage}</p>`;
            }
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        const container = document.getElementById('link-list-content');
        if (container) {
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: #dc3545;">서버 연결에 실패했습니다. 네트워크를 확인해주세요.</p>';
        }
    }
};

// 대시보드 카운트 업데이트
const updateDashboardCount = (links) => {
    if (!links || links.length === 0) {
        document.getElementById('total-links-count').textContent = '0';
        document.getElementById('total-keywords-count').textContent = '0';
        document.getElementById('total-products-count').textContent = '0';
        return;
    }

    // 총 링크 수 (short_code 기준, 그룹화된 링크 수)
    const totalLinks = links.length;
    
    // 총 키워드 수 (모든 링크의 키워드 합계)
    const totalKeywords = links.reduce((sum, link) => {
        const keywords = link.keywords || [];
        return sum + keywords.length;
    }, 0);
    
    // 총 상품 수 (고유한 상품명 개수)
    const uniqueProducts = new Set();
    links.forEach(link => {
        const productName = link.product_name || '';
        if (productName) {
            uniqueProducts.add(productName);
        }
    });
    const totalProducts = uniqueProducts.size;

    // 대시보드 업데이트
    document.getElementById('total-links-count').textContent = totalLinks.toLocaleString();
    document.getElementById('total-keywords-count').textContent = totalKeywords.toLocaleString();
    document.getElementById('total-products-count').textContent = totalProducts.toLocaleString();
};

// 링크 목록 렌더링
const renderLinkList = (links) => {
    const tbody = document.getElementById('link-list-tbody');
    
    if (!tbody) {
        console.error('link-list-tbody를 찾을 수 없습니다.');
        return;
    }

    if (!links || links.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="padding: 40px; text-align: center; color: #666;">생성된 링크가 없습니다.</td></tr>';
        return;
    }

    const baseUrl = window.location.origin;
    
    tbody.innerHTML = links.map((link, index) => {
        const shortCode = link.short_code || '';
        const productName = link.product_name || '상품명 없음';
        const keywords = link.keywords || [];
        const rewardLink = link.reward_link || `${baseUrl}/redirect/${shortCode}`;
        // 리다이렉트 URL은 항상 short code 기반으로 생성
        const redirectLink = `${baseUrl}/redirect/${shortCode}`;
        
        // 첫 번째 키워드 조합의 query와 acq 표시 (대표값)
        const firstKeyword = keywords.length > 0 ? keywords[0] : null;
        const displayQuery = firstKeyword ? (firstKeyword.query_keyword || firstKeyword.query || '-') : '-';
        const displayAcq = firstKeyword ? (firstKeyword.acq_keyword || firstKeyword.acq || '-') : '-';
        
        return `
            <tr class="link-item" data-short-code="${shortCode}" style="border-bottom: 1px solid #ddd;">
                <td style="padding: 12px; border: 1px solid #ddd;">
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <button class="btn-toggle-keywords" data-short-code="${shortCode}" style="padding: 4px 8px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">▼</button>
                        <span>${productName}</span>
                    </div>
                </td>
                <td style="padding: 12px; border: 1px solid #ddd;">
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <input type="text" id="link-url-${shortCode}" value="${redirectLink}" readonly style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px; background: #f5f5f5; font-size: 12px;">
                        <button class="btn-copy-link" data-short-code="${shortCode}" style="padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">복사</button>
                    </div>
                </td>
                <td style="padding: 12px; border: 1px solid #ddd;">${displayQuery}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${displayAcq}</td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${keywords.length}개</td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">
                    <div style="display: flex; gap: 5px; justify-content: center;">
                        <button class="btn-view-keywords" data-short-code="${shortCode}" style="padding: 6px 12px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">키워드</button>
                        <button class="btn-delete-link" data-short-code="${shortCode}" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">삭제</button>
                    </div>
                </td>
            </tr>
            <tr class="keyword-detail-row" data-short-code="${shortCode}" style="display: none; background: #f8f9fa;">
                <td colspan="6" style="padding: 20px; border: 1px solid #ddd;">
                    <div style="margin-bottom: 10px;">
                        <strong>Short Code: </strong>
                        <span style="color: #007bff; font-family: monospace; font-weight: bold;">${shortCode}</span>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <strong>리다이렉트 URL: </strong>
                        <span style="color: #007bff; font-family: monospace;">${redirectLink}</span>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <strong>연관된 키워드 조합 (${keywords.length}개)</strong>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #ddd;">
                        <thead>
                            <tr style="background: #e9ecef; border-bottom: 2px solid #ddd;">
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">번호</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">쿼리 (Query)</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Acq</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">네이버 URL</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${keywords.length > 0 ? keywords.map((keyword, kwIndex) => {
                                // 화면 표시는 원본 값 사용 (띄어쓰기 그대로)
                                const query = keyword.query_keyword || keyword.query || '';
                                const acq = keyword.acq_keyword || keyword.acq || '';
                                const keywordId = keyword.keyword_id || '';
                                // 각 키워드가 속한 link_id 사용 (firstLinkId 대신)
                                const keywordLinkId = keyword.link_id || (link.link_ids && link.link_ids.length > 0 ? link.link_ids[0] : null);
                                // 네이버 URL은 generateNaverUrl 내부에서 띄어쓰기를 +로 변환
                                const keywordNaverUrl = generateNaverUrl(query, acq);
                                return `
                                    <tr style="border-bottom: 1px solid #ddd;">
                                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${kwIndex + 1}</td>
                                        <td style="padding: 10px; border: 1px solid #ddd;">${query}</td>
                                        <td style="padding: 10px; border: 1px solid #ddd;">${acq}</td>
                                        <td style="padding: 10px; border: 1px solid #ddd;">
                                            <div style="display: flex; align-items: center; gap: 5px;">
                                                <input type="text" value="${keywordNaverUrl}" readonly style="flex: 1; padding: 4px; border: 1px solid #ddd; border-radius: 4px; background: #f5f5f5; font-size: 11px; font-family: monospace;">
                                                <button class="btn-copy-keyword-url" data-url="${keywordNaverUrl}" style="padding: 4px 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">복사</button>
                                                ${keywordId && keywordLinkId ? `<button class="btn-delete-keyword-from-table" data-short-code="${shortCode}" data-link-id="${keywordLinkId}" data-keyword-id="${keywordId}" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">삭제</button>` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('') : '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #666;">등록된 키워드 조합이 없습니다.</td></tr>'}
                        </tbody>
                    </table>
                </td>
            </tr>
        `;
    }).join('');

    // 이벤트 바인딩
    bindLinkEvents(links);
};

// 링크 관련 이벤트 바인딩
const bindLinkEvents = (links) => {
    // 링크 복사 버튼 (short_code 기반)
    document.querySelectorAll('.btn-copy-link').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const shortCode = btn.getAttribute('data-short-code');
            const input = document.getElementById(`link-url-${shortCode}`);
            if (input) {
                input.select();
                document.execCommand('copy');
                alert('링크가 클립보드에 복사되었습니다.');
            }
        });
    });

    // 키워드 상세 토글 버튼
    document.querySelectorAll('.btn-toggle-keywords').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const shortCode = btn.getAttribute('data-short-code');
            const detailRow = document.querySelector(`.keyword-detail-row[data-short-code="${shortCode}"]`);
            if (detailRow) {
                const isVisible = detailRow.style.display !== 'none';
                detailRow.style.display = isVisible ? 'none' : 'table-row';
                btn.textContent = isVisible ? '▼' : '▲';
            }
        });
    });

    // 키워드 URL 복사 버튼
    document.querySelectorAll('.btn-copy-keyword-url').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const url = btn.getAttribute('data-url');
            if (url) {
                const textarea = document.createElement('textarea');
                textarea.value = url;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert('네이버 URL이 클립보드에 복사되었습니다.');
            }
        });
    });

    // 네이버 링크 삭제 버튼 (상세 테이블에서)
    document.querySelectorAll('.btn-delete-keyword-from-table').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const linkId = btn.getAttribute('data-link-id');
            const keywordId = btn.getAttribute('data-keyword-id');
            const shortCode = btn.getAttribute('data-short-code');
            
            if (!linkId || !keywordId) {
                alert('링크 ID 또는 키워드 ID를 찾을 수 없습니다.');
                return;
            }
            
            if (confirm('이 네이버 링크(키워드 조합)를 삭제하시겠습니까?')) {
                try {
                    await deleteKeyword(linkId, keywordId);
                    // 목록 새로고침
                    loadLinkList();
                } catch (error) {
                    console.error('키워드 삭제 오류:', error);
                    alert('키워드 삭제 중 오류가 발생했습니다.');
                }
            }
        });
    });

    // 링크 삭제 버튼 (short_code 기반 - 같은 short_code를 가진 모든 링크 삭제)
    document.querySelectorAll('.btn-delete-link').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const shortCode = btn.getAttribute('data-short-code');
            const link = links.find(l => l.short_code === shortCode);
            if (link) {
                const linkCount = link.link_ids ? link.link_ids.length : 0;
                if (confirm(`이 링크(Short Code: ${shortCode})와 연관된 모든 데이터를 삭제하시겠습니까?\n연관된 링크 수: ${linkCount}개`)) {
                    try {
                        await deleteLink(shortCode);
                        loadLinkList();
                    } catch (error) {
                        console.error('링크 삭제 오류:', error);
                        // deleteLink 함수 내에서 이미 alert를 표시하므로 여기서는 추가 알림 불필요
                    }
                }
            } else {
                alert('삭제할 링크를 찾을 수 없습니다.');
            }
        });
    });

    // 키워드 보기 버튼 (short_code 기반)
    document.querySelectorAll('.btn-view-keywords').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const shortCode = btn.getAttribute('data-short-code');
            const link = links.find(l => l.short_code === shortCode);
            if (link) {
                showKeywordModal(link);
            }
        });
    });
};

// 키워드 모달 표시
const showKeywordModal = (link) => {
    const keywords = link.keywords || [];
    const shortCode = link.short_code || '';
    const productName = link.product_name || '상품명 없음';
    const linkIds = link.link_ids || [];
    const firstLinkId = linkIds.length > 0 ? linkIds[0] : null;
    
    const modal = document.createElement('div');
    modal.id = 'keyword-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; justify-content: center; align-items: center;';
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 8px; max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>${productName} - 키워드 조합 관리</h3>
                <button id="close-keyword-modal" style="padding: 5px 15px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">닫기</button>
            </div>
            <div style="margin-bottom: 15px; padding: 10px; background: #f0f8ff; border-radius: 4px;">
                <strong>Short Code: </strong><span style="font-family: monospace; font-weight: bold;">${shortCode}</span>
            </div>
            
            <div style="margin-bottom: 15px; display: none;">
                <button class="btn-add-keyword" data-short-code="${shortCode}" data-link-id="${firstLinkId}" style="padding: 8px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">+ 키워드 추가</button>
            </div>
            
            <div class="keyword-list" id="keyword-list-${shortCode}">
                ${keywords.length > 0 ? keywords.map((keyword, kwIndex) => {
                    const kwId = keyword.keyword_id || kwIndex;
                    // 모달 input은 수정 가능하므로 원본 값 사용
                    const query = keyword.query_keyword || keyword.query || '';
                    const acq = keyword.acq_keyword || keyword.acq || '';
                    // 각 키워드의 link_id 사용 (firstLinkId 대신)
                    const keywordLinkId = keyword.link_id || firstLinkId;
                    return `
                        <div class="keyword-item" data-keyword-id="${kwId}" style="display: flex; gap: 10px; margin-bottom: 8px; padding: 10px; background: #f9f9f9; border-radius: 4px;">
                            <input type="text" class="keyword-query" value="${query}" placeholder="query 키워드" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                            <input type="text" class="keyword-acq" value="${acq}" placeholder="acq 키워드" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                            <button class="btn-save-keyword" data-short-code="${shortCode}" data-link-id="${keywordLinkId}" data-keyword-id="${kwId}" style="padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">저장</button>
                            <button class="btn-delete-keyword" data-short-code="${shortCode}" data-link-id="${keywordLinkId}" data-keyword-id="${kwId}" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">삭제</button>
                        </div>
                    `;
                }).join('') : '<p style="color: #666; font-size: 14px;">등록된 키워드 조합이 없습니다.</p>'}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 닫기 버튼
    modal.querySelector('#close-keyword-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // 키워드 추가 버튼 (숨김 처리됨)
    const addKeywordBtn = modal.querySelector('.btn-add-keyword');
    if (addKeywordBtn && firstLinkId) {
        addKeywordBtn.addEventListener('click', () => {
            addKeywordRow(firstLinkId, modal);
        });
    }
    
    // 키워드 저장/삭제 버튼 이벤트
    modal.querySelectorAll('.btn-save-keyword').forEach(btn => {
        btn.addEventListener('click', async () => {
            const linkId = btn.getAttribute('data-link-id');
            const keywordId = btn.getAttribute('data-keyword-id');
            const keywordItem = btn.closest('.keyword-item');
            const query = keywordItem.querySelector('.keyword-query').value.trim();
            const acq = keywordItem.querySelector('.keyword-acq').value.trim();
            
            if (!query || !acq) {
                alert('query와 acq 키워드를 모두 입력해주세요.');
                return;
            }
            
            if (!linkId) {
                alert('링크 ID를 찾을 수 없습니다.');
                return;
            }

            await saveKeyword(linkId, keywordId, query, acq);
            document.body.removeChild(modal);
            loadLinkList();
        });
    });
    
    modal.querySelectorAll('.btn-delete-keyword').forEach(btn => {
        btn.addEventListener('click', async () => {
            const linkId = btn.getAttribute('data-link-id');
            const keywordId = btn.getAttribute('data-keyword-id');
            
            if (!linkId) {
                alert('링크 ID를 찾을 수 없습니다.');
                return;
            }
            
            if (confirm('이 키워드 조합을 삭제하시겠습니까?')) {
                await deleteKeyword(linkId, keywordId);
                document.body.removeChild(modal);
                loadLinkList();
            }
        });
    });
};

// 키워드 행 추가
const addKeywordRow = (linkId, modal) => {
    const keywordList = document.getElementById(`keyword-list-${linkId}`);
    if (!keywordList) return;

    const newKeywordId = `new_${Date.now()}`;
    const keywordRow = document.createElement('div');
    keywordRow.className = 'keyword-item';
    keywordRow.setAttribute('data-keyword-id', newKeywordId);
    keywordRow.style.cssText = 'display: flex; gap: 10px; margin-bottom: 8px; padding: 10px; background: #f9f9f9; border-radius: 4px;';
    keywordRow.innerHTML = `
        <input type="text" class="keyword-query" value="" placeholder="query 키워드" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
        <input type="text" class="keyword-acq" value="" placeholder="acq 키워드" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
        <button class="btn-save-keyword" data-link-id="${linkId}" data-keyword-id="${newKeywordId}" style="padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">저장</button>
        <button class="btn-delete-keyword" data-link-id="${linkId}" data-keyword-id="${newKeywordId}" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">삭제</button>
    `;

    keywordList.appendChild(keywordRow);

    // 새로 추가된 행의 이벤트 바인딩
    keywordRow.querySelector('.btn-save-keyword').addEventListener('click', async (e) => {
        const query = keywordRow.querySelector('.keyword-query').value.trim();
        const acq = keywordRow.querySelector('.keyword-acq').value.trim();
        
        if (!query || !acq) {
            alert('query와 acq 키워드를 모두 입력해주세요.');
            return;
        }

        await saveKeyword(linkId, newKeywordId, query, acq);
        if (modal) {
            document.body.removeChild(modal);
        }
        loadLinkList();
    });

    keywordRow.querySelector('.btn-delete-keyword').addEventListener('click', () => {
        keywordRow.remove();
    });
};

// 키워드 저장
const saveKeyword = async (linkId, keywordId, query, acq) => {
    try {
        // 새 키워드인 경우
        const isNew = keywordId.toString().startsWith('new_');
        const url = isNew 
            ? `${API_BASE_URL}/rewards/links/${linkId}/keywords`  // POST
            : `${API_BASE_URL}/rewards/links/${linkId}/keywords/${keywordId}`;  // PUT

        const method = isNew ? 'POST' : 'PUT';
        const requestBody = {
            query: query,
            acq: acq
        };

        console.log('키워드 저장 API 호출:', url, method, requestBody);

        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('키워드 저장 성공:', data);
            alert('키워드가 저장되었습니다.');
            loadLinkList(); // 목록 새로고침
        } else {
            let errorMessage = `서버 오류 (${response.status})`;
            try {
                const errorText = await response.text();
                if (errorText) {
                    try {
                        const errorData = JSON.parse(errorText);
                        if (typeof errorData === 'string') {
                            errorMessage = errorData;
                        } else if (errorData.message && typeof errorData.message === 'string') {
                            errorMessage = errorData.message;
                        } else if (errorData.detail && typeof errorData.detail === 'string') {
                            errorMessage = errorData.detail;
                        } else if (errorData.error && typeof errorData.error === 'string') {
                            errorMessage = errorData.error;
                        } else {
                            errorMessage = errorText;
                        }
                    } catch (e) {
                        errorMessage = errorText;
                    }
                }
            } catch (e) {
                console.error('오류 메시지 파싱 실패:', e);
            }
            
            console.error('키워드 저장 실패:', response.status, errorMessage);
            alert(`키워드 저장 실패: ${errorMessage}`);
        }
    } catch (error) {
        console.error('키워드 저장 API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
};

// 키워드 삭제
const deleteKeyword = async (linkId, keywordId) => {
    try {
        const url = `${API_BASE_URL}/rewards/links/${linkId}/keywords/${keywordId}`;
        
        console.log('키워드 삭제 API 호출:', url);

        const response = await fetch(url, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            console.log('키워드 삭제 성공');
            alert('키워드가 삭제되었습니다.');
            loadLinkList(); // 목록 새로고침
        } else {
            let errorMessage = `서버 오류 (${response.status})`;
            try {
                const errorText = await response.text();
                if (errorText) {
                    try {
                        const errorData = JSON.parse(errorText);
                        if (typeof errorData === 'string') {
                            errorMessage = errorData;
                        } else if (errorData.message && typeof errorData.message === 'string') {
                            errorMessage = errorData.message;
                        } else if (errorData.detail && typeof errorData.detail === 'string') {
                            errorMessage = errorData.detail;
                        } else if (errorData.error && typeof errorData.error === 'string') {
                            errorMessage = errorData.error;
                        } else {
                            errorMessage = errorText;
                        }
                    } catch (e) {
                        errorMessage = errorText;
                    }
                }
            } catch (e) {
                console.error('오류 메시지 파싱 실패:', e);
            }
            
            console.error('키워드 삭제 실패:', response.status, errorMessage);
            alert(`키워드 삭제 실패: ${errorMessage}`);
        }
    } catch (error) {
        console.error('키워드 삭제 API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
};

// 링크 삭제 (short_code 기반)
const deleteLink = async (shortCode) => {
    try {
        const url = `${API_BASE_URL}/rewards/links/${shortCode}`;
        
        console.log('링크 삭제 API 호출:', url);

        const response = await fetch(url, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            console.log('링크 삭제 성공:', data);
            
            const deletedLinks = data.deleted_links || 0;
            const deletedKeywords = data.deleted_keywords || 0;
            
            alert(`링크가 삭제되었습니다.\n삭제된 링크: ${deletedLinks}개\n삭제된 키워드: ${deletedKeywords}개`);
            loadLinkList(); // 목록 새로고침
        } else {
            let errorMessage = `서버 오류 (${response.status})`;
            try {
                const errorText = await response.text();
                if (errorText) {
                    try {
                        const errorData = JSON.parse(errorText);
                        if (typeof errorData === 'string') {
                            errorMessage = errorData;
                        } else if (errorData.message && typeof errorData.message === 'string') {
                            errorMessage = errorData.message;
                        } else if (errorData.detail && typeof errorData.detail === 'string') {
                            errorMessage = errorData.detail;
                        } else if (errorData.error && typeof errorData.error === 'string') {
                            errorMessage = errorData.error;
                        } else {
                            errorMessage = errorText;
                        }
                    } catch (e) {
                        errorMessage = errorText;
                    }
                }
            } catch (e) {
                console.error('오류 메시지 파싱 실패:', e);
            }
            
            console.error('링크 삭제 실패:', response.status, errorMessage);
            alert(`링크 삭제 실패: ${errorMessage}`);
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('링크 삭제 API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
        throw error;
    }
};
