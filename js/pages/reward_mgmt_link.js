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

// HTML 이스케이프 헬퍼 함수 (XSS 방지)
const escapeHtml = (text) => {
    if (text == null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
};

// 속성값 이스케이프 (data-* 속성용)
const escapeAttr = (text) => {
    if (text == null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
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
            상품명, 쿼리를 입력하여 짧은 랜덤 링크를 생성하고 관리할 수 있습니다.
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
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button type="button" id="add-query-btn" style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">+ 추가</button>
                    <button type="button" id="bulk-create-link-btn" style="padding: 6px 12px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">+ 링크 다량 생성</button>
                </div>
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
  ackey={소문자+숫자 8글자 랜덤}&
  acq={acq 테이블에서 랜덤 선택}&
  acr={1~10 랜덤}&
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
                            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">키워드 개수</th>
                            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">작업</th>
                        </tr>
                    </thead>
                    <tbody id="link-list-tbody">
                        <tr>
                            <td colspan="5" style="padding: 20px; text-align: center; color: #666;">로딩 중...</td>
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
            
            if (queries.length === 0) {
                alert('최소 1개 이상의 쿼리를 추가해주세요.');
                return;
            }

            // 백엔드에 query_list만 전송 (백엔드가 acq 테이블에서 acq를 가져와 모든 조합 생성)
            await createAllLinks(productName, queries);
        });
    }

    // 링크 다량 생성 버튼
    const bulkCreateLinkBtn = document.getElementById('bulk-create-link-btn');
    if (bulkCreateLinkBtn) {
        bulkCreateLinkBtn.addEventListener('click', () => {
            showBulkCreateLinkModal();
        });
    }

    // 초기 입력창 하나씩 추가
    addQueryRow();
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

// 띄어쓰기를 +로 변환하는 헬퍼 함수
const replaceSpaceWithPlus = (str) => {
    if (!str || str === '-') return str;
    return str.replace(/\s+/g, '+');
};

// 네이버 URL 생성 함수 (acq는 백엔드에서 가져옴)
const generateNaverUrl = (query, acq = '') => {
    const ackey = generateRandomString(8);
    const acr = generateRandomNumber(0, 10);
    
    // 띄어쓰기를 +로 변환
    const queryWithPlus = query.replace(/\s+/g, '+');
    
    // encodeURIComponent를 사용하되, +는 인코딩하지 않도록 처리
    // encodeURIComponent는 +를 %2B로 변환하므로, 다시 +로 복원
    const encodedQuery = encodeURIComponent(queryWithPlus).replace(/%2B/g, '+');
    
    // acq가 있으면 포함, 없으면 백엔드에서 가져온 값 사용
    let acqParam = '';
    if (acq) {
        const acqWithPlus = acq.replace(/\s+/g, '+');
        const encodedAcq = encodeURIComponent(acqWithPlus).replace(/%2B/g, '+');
        acqParam = `&acq=${encodedAcq}`;
    }
    
    const naverUrl = `https://m.search.naver.com/search.naver?` +
        `sm=mtp_sug.top&` +
        `where=m&` +
        `query=${encodedQuery}&` +
        `ackey=${ackey}` +
        `${acqParam}` +
        `&acr=${acr}&` +
        `qdt=0`;
    
    return naverUrl;
};

// 모든 조합으로 랜덤 링크 생성
const createAllLinks = async (productName, queryList) => {
    try {
        // 입력값 검증
        if (!queryList || queryList.length === 0) {
            alert('최소 1개 이상의 쿼리를 입력해주세요.');
            return;
        }

        // 중복 제거 및 공백 제거
        const uniqueQueries = [...new Set(queryList.map(q => q.trim()).filter(q => q))];

        if (uniqueQueries.length === 0) {
            alert('유효한 쿼리를 입력해주세요.');
            return;
        }

        // 백엔드 API 호출 - query_list만 전송
        // 백엔드는 acq 테이블에서 acq를 가져와서 모든 조합을 생성하고, 각 조합마다 별도의 link_id를 생성함
        const url = `${API_BASE_URL}/rewards/links`;
        const requestBody = {
            product_name: productName,
            query_list: uniqueQueries  // 쿼리 리스트만 전송
        };

        console.log('링크 생성 API 호출:', url);
        console.log('요청 본문:', JSON.stringify(requestBody, null, 2));
        console.log(`쿼리 개수: ${uniqueQueries.length}`);
        console.log(`백엔드가 acq 테이블에서 acq를 가져와 모든 조합을 생성합니다.`);

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
            const createdCount = responseData.created_count || 0;
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
            addQueryRow(); // 빈 행 하나 추가
            
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
const createNewLink = async (productName, query) => {
    try {
        const shortLink = generateShortLink();
        const baseUrl = window.location.origin;
        const redirectLink = `${baseUrl}/redirect/${shortLink}`;
        
        // 네이버 URL 형식으로 생성 (acq는 백엔드에서 가져옴)
        const naverUrl = generateNaverUrl(query);

        // 백엔드 API 호출 (예상 엔드포인트: POST /rewards/links)
        const url = `${API_BASE_URL}/rewards/links`;
        const requestBody = {
            short_link: shortLink,
            product_name: productName,
            redirect_url: naverUrl, // 네이버 URL 형식으로 저장
            keywords: [{
                query: query
                // acq는 백엔드에서 acq 테이블에서 가져옴
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
        
        // 첫 번째 키워드 조합의 query 표시 (대표값)
        const firstKeyword = keywords.length > 0 ? keywords[0] : null;
        const displayQuery = firstKeyword ? (firstKeyword.query_keyword || firstKeyword.query || '-') : '-';
        
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
                <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${keywords.length}개</td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">
                    <div style="display: flex; gap: 5px; justify-content: center;">
                        <button class="btn-view-keywords" data-short-code="${shortCode}" style="padding: 6px 12px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">키워드</button>
                        <button class="btn-delete-link" data-short-code="${shortCode}" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">삭제</button>
                    </div>
                </td>
            </tr>
            <tr class="keyword-detail-row" data-short-code="${shortCode}" style="display: none; background: #f8f9fa;">
                <td colspan="5" style="padding: 20px; border: 1px solid #ddd;">
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
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">네이버 URL</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(() => {
                                if (keywords.length === 0) {
                                    return '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #666;">등록된 키워드 조합이 없습니다.</td></tr>';
                                }
                                // keyword_id로 순차 정렬
                                const sortedKeywords = [...keywords].sort((a, b) => {
                                    const idA = a.keyword_id || 0;
                                    const idB = b.keyword_id || 0;
                                    return idA - idB;
                                });
                                return sortedKeywords.map((keyword, kwIndex) => {
                                    // 화면 표시는 원본 값 사용 (띄어쓰기 그대로)
                                    const query = keyword.query_keyword || keyword.query || '';
                                    const keywordId = keyword.keyword_id || '';
                                    // 각 키워드가 속한 link_id 사용 (firstLinkId 대신)
                                    const keywordLinkId = keyword.link_id || (link.link_ids && link.link_ids.length > 0 ? link.link_ids[0] : null);
                                    // 네이버 URL은 백엔드에서 생성된 reward_link 사용 (acq는 백엔드에서 가져옴)
                                    const keywordNaverUrl = keyword.reward_link || generateNaverUrl(query);
                                    return `
                                        <tr style="border-bottom: 1px solid #ddd;">
                                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${kwIndex + 1}</td>
                                            <td style="padding: 10px; border: 1px solid #ddd;">${query}</td>
                                            <td style="padding: 10px; border: 1px solid #ddd;">
                                                <div style="display: flex; align-items: center; gap: 5px;">
                                                    <input type="text" value="${keywordNaverUrl}" readonly style="flex: 1; padding: 4px; border: 1px solid #ddd; border-radius: 4px; background: #f5f5f5; font-size: 11px; font-family: monospace;">
                                                    <button class="btn-copy-keyword-url" data-url="${keywordNaverUrl}" style="padding: 4px 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">복사</button>
                                                    ${keywordId && keywordLinkId ? `<button class="btn-delete-keyword-from-table" data-short-code="${shortCode}" data-link-id="${keywordLinkId}" data-keyword-id="${keywordId}" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">삭제</button>` : ''}
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('');
                            })()}
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
            
            <div style="margin-bottom: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn-add-keyword" data-short-code="${shortCode}" data-link-id="${firstLinkId}" style="padding: 8px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">+ 키워드 추가</button>
                <button class="btn-batch-delete-keywords" data-short-code="${shortCode}" style="padding: 8px 15px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">선택 삭제</button>
                <button class="btn-save-all-keywords" data-short-code="${shortCode}" style="padding: 8px 15px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">모두 저장</button>
                <button class="btn-save-and-close" data-short-code="${shortCode}" style="padding: 8px 15px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">저장 후 닫기</button>
            </div>
            
            <div class="keyword-list" id="keyword-list-${shortCode}">
                ${keywords.length > 0 ? (() => {
                    // keyword_id로 순차 정렬
                    const sortedKeywords = [...keywords].sort((a, b) => {
                        const idA = a.keyword_id || 0;
                        const idB = b.keyword_id || 0;
                        return idA - idB;
                    });
                    return sortedKeywords.map((keyword, kwIndex) => {
                        const kwId = keyword.keyword_id || kwIndex;
                        // 모달 input은 수정 가능하므로 원본 값 사용
                        const query = keyword.query_keyword || keyword.query || '';
                        // 각 키워드의 link_id 사용 (firstLinkId 대신)
                        const keywordLinkId = keyword.link_id || firstLinkId;
                        
                        // 이스케이프 처리
                        const escapedQuery = escapeHtml(query);
                        const escapedKwId = escapeAttr(String(kwId));
                        const escapedLinkId = keywordLinkId ? escapeAttr(String(keywordLinkId)) : '';
                        const escapedOriginalQuery = escapeAttr(query);
                        const escapedShortCode = escapeAttr(shortCode);
                        
                    return `
                        <div class="keyword-item" data-keyword-id="${escapedKwId}" data-original-query="${escapedOriginalQuery}" style="display: flex; gap: 10px; margin-bottom: 8px; padding: 10px; background: #f9f9f9; border-radius: 4px; align-items: center;">
                            <input type="checkbox" class="keyword-checkbox" data-link-id="${escapedLinkId}" data-keyword-id="${escapedKwId}" style="margin-right: 5px;">
                            <input type="text" class="keyword-query" value="${escapedQuery}" placeholder="query 키워드" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                            <button class="btn-save-keyword" data-short-code="${escapedShortCode}" data-link-id="${escapedLinkId}" data-keyword-id="${escapedKwId}" style="padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">저장</button>
                            <button class="btn-delete-keyword" data-short-code="${escapedShortCode}" data-link-id="${escapedLinkId}" data-keyword-id="${escapedKwId}" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">삭제</button>
                        </div>
                    `;
                    }).join('');
                })() : '<p style="color: #666; font-size: 14px;">등록된 키워드 조합이 없습니다.</p>'}
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
    
    // 키워드 추가 버튼
    const addKeywordBtn = modal.querySelector('.btn-add-keyword');
    if (addKeywordBtn && firstLinkId) {
        addKeywordBtn.addEventListener('click', () => {
            addKeywordRow(shortCode, firstLinkId, modal);
        });
    }
    
    // 키워드 저장/삭제 버튼 이벤트 바인딩
    bindKeywordModalEvents(modal, shortCode, firstLinkId);
    
    // 모든 모달 버튼 이벤트 바인딩
    bindAllModalButtonEvents(modal, shortCode, firstLinkId);
    
    // 기존 이벤트 바인딩 코드는 bindAllModalButtonEvents로 이동했으므로 제거
    // 일괄삭제 버튼 이벤트 (제거됨 - bindAllModalButtonEvents로 이동)
    /* const batchDeleteBtn = modal.querySelector('.btn-batch-delete-keywords');
    if (batchDeleteBtn) {
        batchDeleteBtn.addEventListener('click', async () => {
            const checkedBoxes = modal.querySelectorAll('.keyword-checkbox:checked');
            if (checkedBoxes.length === 0) {
                alert('삭제할 키워드를 선택해주세요.');
                return;
            }
            
            if (confirm(`선택한 ${checkedBoxes.length}개의 키워드를 삭제하시겠습니까?`)) {
                try {
                    // keyword_id만 추출
                    const keywordIds = Array.from(checkedBoxes)
                        .map(checkbox => {
                            const keywordId = checkbox.getAttribute('data-keyword-id');
                            return keywordId ? parseInt(keywordId, 10) : null;
                        })
                        .filter(id => id !== null);
                    
                    if (keywordIds.length === 0) {
                        alert('유효한 키워드 ID를 찾을 수 없습니다.');
                        return;
                    }
                    
                    console.log('배치 삭제 요청 keyword_ids:', keywordIds);
                    
                    // 배치 삭제 API 호출
                    const response = await fetch(`${API_BASE_URL}/rewards/keywords/batch`, {
                        method: 'DELETE',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                            keyword_ids: keywordIds
                        })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log('배치 삭제 성공:', data);
                        
                        const deletedCount = data.data?.deleted_count || data.deleted_count || keywordIds.length;
                        const failedCount = data.data?.failed_count || 0;
                        
                    if (failedCount > 0) {
                        alert(`${deletedCount}개 삭제 성공, ${failedCount}개 실패`);
                    } else {
                        alert(`${deletedCount}개의 키워드가 삭제되었습니다.`);
                    }
                    
                    // 백엔드 반영 시간 확보를 위한 지연 후 모달 내부만 업데이트
                    await new Promise(resolve => setTimeout(resolve, 300));
                    await refreshKeywordModal(shortCode, modal);
                    } else {
                        let errorMessage = `서버 오류 (${response.status})`;
                        try {
                            const errorText = await response.text();
                            if (errorText) {
                                try {
                                    const errorData = JSON.parse(errorText);
                                    errorMessage = errorData.detail || errorData.message || errorText;
                                } catch (e) {
                                    errorMessage = errorText;
                                }
                            }
                        } catch (e) {
                            console.error('오류 메시지 파싱 실패:', e);
                        }
                        
                        console.error('배치 삭제 실패:', response.status, errorMessage);
                        alert(`키워드 삭제 실패: ${errorMessage}`);
                    }
                } catch (error) {
                    console.error('일괄 삭제 오류:', error);
                    alert('일괄 삭제 중 오류가 발생했습니다.');
                }
            }
        });
    }
    
    // 모두 저장 버튼 이벤트
    const saveAllBtn = modal.querySelector('.btn-save-all-keywords');
    if (saveAllBtn) {
        saveAllBtn.addEventListener('click', async () => {
            const keywordItems = modal.querySelectorAll('.keyword-item');
            const keywordsToSave = [];
            
            for (const item of keywordItems) {
                const query = item.querySelector('.keyword-query').value.trim();
                if (!query) continue;
                
                const keywordId = item.getAttribute('data-keyword-id');
                
                // 새 키워드(new_로 시작)는 제외 (개별 저장 필요)
                if (keywordId && !keywordId.toString().startsWith('new_')) {
                    keywordsToSave.push({
                        keyword_id: parseInt(keywordId, 10),
                        query: query
                    });
                }
            }
            
            if (keywordsToSave.length === 0) {
                alert('저장할 키워드가 없습니다.');
                return;
            }
            
            try {
                console.log('배치 저장 요청 (PATCH):', keywordsToSave);
                
                // PATCH 배치 저장 API 호출
                const response = await fetch(`${API_BASE_URL}/rewards/keywords/batch`, {
                    method: 'PATCH',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        keywords: keywordsToSave
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('배치 저장 성공:', data);
                    
                    const savedCount = data.data?.saved_count || data.saved_count || keywordsToSave.length;
                    const failedCount = data.data?.failed_count || 0;
                    
                    if (failedCount > 0) {
                        alert(`${savedCount}개 저장 성공, ${failedCount}개 실패`);
                    } else {
                        alert(`${savedCount}개의 키워드가 저장되었습니다.`);
                    }
                    
                    // 백엔드 반영 시간 확보를 위한 지연 후 모달 내부만 업데이트
                    await new Promise(resolve => setTimeout(resolve, 300));
                    await refreshKeywordModal(shortCode, modal);
                } else {
                    let errorMessage = `서버 오류 (${response.status})`;
                    try {
                        const errorText = await response.text();
                        if (errorText) {
                            try {
                                const errorData = JSON.parse(errorText);
                                errorMessage = errorData.detail || errorData.message || errorText;
                            } catch (e) {
                                errorMessage = errorText;
                            }
                        }
                    } catch (e) {
                        console.error('오류 메시지 파싱 실패:', e);
                    }
                    
                    console.error('배치 저장 실패:', response.status, errorMessage);
                    alert(`키워드 저장 실패: ${errorMessage}`);
                }
            } catch (error) {
                console.error('일괄 저장 오류:', error);
                alert('일괄 저장 중 오류가 발생했습니다.');
            }
        });
    }
    
    // 저장 후 닫기 버튼 이벤트
    const saveAndCloseBtn = modal.querySelector('.btn-save-and-close');
    if (saveAndCloseBtn) {
        saveAndCloseBtn.addEventListener('click', async () => {
            // 먼저 모두 저장
            const keywordItems = modal.querySelectorAll('.keyword-item');
            const savePromises = [];
            
            for (const item of keywordItems) {
                const query = item.querySelector('.keyword-query').value.trim();
                if (!query) continue;
                
                const saveBtn = item.querySelector('.btn-save-keyword');
                if (!saveBtn) continue;
                
                const linkId = saveBtn.getAttribute('data-link-id');
                const keywordId = item.getAttribute('data-keyword-id');
                
                if (linkId && keywordId) {
                    // showAlert를 false로 전달하여 개별 alert 비활성화
                    savePromises.push(saveKeyword(linkId, keywordId, query, null, null, false));
                }
            }
            
            if (savePromises.length > 0) {
                try {
                    await Promise.all(savePromises);
                    alert('모든 키워드가 저장되었습니다.');
                } catch (error) {
                    console.error('저장 오류:', error);
                    alert('일부 키워드 저장 중 오류가 발생했습니다.');
                }
            }
            
            // 모달 닫기 및 목록 새로고침
            document.body.removeChild(modal);
            loadLinkList();
        });
    } */
};

// 키워드 행 추가
const addKeywordRow = (shortCode, linkId, modal) => {
    const keywordList = document.getElementById(`keyword-list-${escapeAttr(shortCode)}`);
    if (!keywordList) return;

    // linkId 유효성 검사
    if (!linkId || linkId === 'null' || linkId === 'undefined' || linkId === '') {
        alert('링크 ID가 유효하지 않습니다. 새 키워드를 추가할 수 없습니다.');
        console.error('유효하지 않은 linkId:', linkId, 'shortCode:', shortCode);
        return;
    }

    const newKeywordId = `new_${Date.now()}`;
    const keywordRow = document.createElement('div');
    keywordRow.className = 'keyword-item';
    keywordRow.setAttribute('data-keyword-id', newKeywordId);
    keywordRow.setAttribute('data-original-query', ''); // 새 키워드는 원본 값 없음
    keywordRow.style.cssText = 'display: flex; gap: 10px; margin-bottom: 8px; padding: 10px; background: #f9f9f9; border-radius: 4px; align-items: center;';
    
    const escapedShortCode = escapeAttr(shortCode);
    const escapedLinkId = escapeAttr(String(linkId));
    const escapedNewKeywordId = escapeAttr(newKeywordId);
    
    keywordRow.innerHTML = `
        <input type="checkbox" class="keyword-checkbox" data-link-id="${escapedLinkId}" data-keyword-id="${escapedNewKeywordId}" style="margin-right: 5px;">
        <input type="text" class="keyword-query" value="" placeholder="query 키워드" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
        <button class="btn-save-keyword" data-short-code="${escapedShortCode}" data-link-id="${escapedLinkId}" data-keyword-id="${escapedNewKeywordId}" style="padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">저장</button>
        <button class="btn-delete-keyword" data-short-code="${escapedShortCode}" data-link-id="${escapedLinkId}" data-keyword-id="${escapedNewKeywordId}" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">삭제</button>
    `;

    keywordList.appendChild(keywordRow);

    // 새로 추가된 행의 이벤트 바인딩
    keywordRow.querySelector('.btn-save-keyword').addEventListener('click', async (e) => {
        const query = keywordRow.querySelector('.keyword-query').value.trim();
        
        if (!query) {
            alert('query 키워드를 입력해주세요.');
            return;
        }

        await saveKeyword(linkId, newKeywordId, query, shortCode, modal);
    });

    keywordRow.querySelector('.btn-delete-keyword').addEventListener('click', () => {
        keywordRow.remove();
    });
};

// 키워드 저장
const saveKeyword = async (linkId, keywordId, query, shortCode = null, modal = null, showAlert = true) => {
    try {
        // 새 키워드인 경우
        const isNew = keywordId.toString().startsWith('new_');
        const url = isNew 
            ? `${API_BASE_URL}/rewards/links/${linkId}/keywords`  // POST
            : `${API_BASE_URL}/rewards/links/${linkId}/keywords/${keywordId}`;  // PUT

        const method = isNew ? 'POST' : 'PUT';
        const requestBody = {
            query: query
            // acq는 백엔드에서 acq 테이블에서 가져옴
        };
        
        // 기존 키워드 수정 시 새로운 네이버 URL 생성 (ackey 소문자+숫자로 생성)
        if (!isNew) {
            const newNaverUrl = generateNaverUrl(query);
            requestBody.reward_link = newNaverUrl;
        }

        console.log('키워드 저장 API 호출:', url, method, requestBody);

        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('키워드 저장 성공:', data);
            
            // 모달이 열려있고 shortCode가 있으면 모달만 업데이트
            if (modal && shortCode) {
                // 백엔드 반영 시간 확보를 위한 지연
                await new Promise(resolve => setTimeout(resolve, 300));
                await refreshKeywordModal(shortCode, modal);
                // showAlert가 true일 때만 alert 표시
                if (showAlert) {
                    alert('키워드가 저장되었습니다.');
                }
            } else {
                // 모달이 없으면 전체 목록 새로고침
                // showAlert가 true일 때만 alert 표시
                if (showAlert) {
                    alert('키워드가 저장되었습니다.');
                }
                loadLinkList();
            }
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
            // alert는 호출하는 쪽에서 처리
            return true;
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
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('키워드 삭제 API 호출 오류:', error);
        throw error;
    }
};

// 모달 내부 키워드 목록만 새로고침 (모달 열 때와 동일한 방식으로 조회)
const refreshKeywordModal = async (shortCode, modal) => {
    try {
        // 전체 링크 목록을 조회 (모달 열 때와 동일한 방식)
        const response = await fetch(`${API_BASE_URL}/rewards/links`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            let links = [];
            if (data.data && data.data.links && Array.isArray(data.data.links)) {
                links = data.data.links;
            } else if (data.links && Array.isArray(data.links)) {
                links = data.links;
            } else if (Array.isArray(data)) {
                links = data;
            }
            
            // short_code별로 그룹화 (모달 열 때와 동일한 방식)
            const groupedLinks = groupLinksByShortCode(links);
            const link = groupedLinks.find(l => l.short_code === shortCode);
            
            if (link) {
                // 키워드 리스트 영역만 업데이트
                const keywordList = modal.querySelector(`#keyword-list-${escapeAttr(shortCode)}`);
                if (keywordList) {
                    let keywords = link.keywords || [];
                    // keyword_id로 순차 정렬
                    keywords = keywords.sort((a, b) => {
                        const idA = a.keyword_id || 0;
                        const idB = b.keyword_id || 0;
                        return idA - idB;
                    });
                    const firstLinkId = link.link_ids && link.link_ids.length > 0 ? link.link_ids[0] : null;
                    
                    keywordList.innerHTML = keywords.length > 0 ? keywords.map((keyword, kwIndex) => {
                        const kwId = keyword.keyword_id || kwIndex;
                        const query = keyword.query_keyword || keyword.query || '';
                        // link_id가 null이거나 유효하지 않으면 firstLinkId 사용
                        const keywordLinkId = (keyword.link_id && keyword.link_id !== null && keyword.link_id !== 'null') 
                            ? keyword.link_id 
                            : (firstLinkId && firstLinkId !== null && firstLinkId !== 'null' ? firstLinkId : null);
                        
                        // 이스케이프 처리
                        const escapedQuery = escapeHtml(query);
                        const escapedKwId = escapeAttr(String(kwId));
                        const escapedLinkId = keywordLinkId ? escapeAttr(String(keywordLinkId)) : '';
                        const escapedOriginalQuery = escapeAttr(query); // DB에서 가져온 원본 값
                        const escapedShortCode = escapeAttr(shortCode);
                        
                        return `
                            <div class="keyword-item" data-keyword-id="${escapedKwId}" data-original-query="${escapedOriginalQuery}" style="display: flex; gap: 10px; margin-bottom: 8px; padding: 10px; background: #f9f9f9; border-radius: 4px; align-items: center;">
                                <input type="checkbox" class="keyword-checkbox" data-link-id="${escapedLinkId}" data-keyword-id="${escapedKwId}" style="margin-right: 5px;">
                                <input type="text" class="keyword-query" value="${escapedQuery}" placeholder="query 키워드" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                                <button class="btn-save-keyword" data-short-code="${escapedShortCode}" data-link-id="${escapedLinkId}" data-keyword-id="${escapedKwId}" style="padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">저장</button>
                                <button class="btn-delete-keyword" data-short-code="${escapedShortCode}" data-link-id="${escapedLinkId}" data-keyword-id="${escapedKwId}" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">삭제</button>
                            </div>
                        `;
                    }).join('') : '<p style="color: #666; font-size: 14px;">등록된 키워드 조합이 없습니다.</p>';
                    
                    // 이벤트 다시 바인딩
                    bindKeywordModalEvents(modal, shortCode, firstLinkId);
                    
                    // 모든 모달 버튼 이벤트도 다시 바인딩
                    bindAllModalButtonEvents(modal, shortCode, firstLinkId);
                }
            } else {
                console.warn(`Short code ${shortCode}에 해당하는 링크를 찾을 수 없습니다.`);
            }
        } else {
            console.error('링크 목록 조회 실패:', response.status);
        }
    } catch (error) {
        console.error('모달 새로고침 오류:', error);
    }
};

// 모든 모달 버튼 이벤트 바인딩 함수
const bindAllModalButtonEvents = (modal, shortCode, firstLinkId) => {
    // 일괄삭제 버튼 이벤트
    const batchDeleteBtn = modal.querySelector('.btn-batch-delete-keywords');
    if (batchDeleteBtn) {
        // 기존 이벤트 리스너 제거 (중복 방지)
        const newBatchDeleteBtn = batchDeleteBtn.cloneNode(true);
        batchDeleteBtn.parentNode.replaceChild(newBatchDeleteBtn, batchDeleteBtn);
        
        newBatchDeleteBtn.addEventListener('click', async () => {
            const checkedBoxes = modal.querySelectorAll('.keyword-checkbox:checked');
            if (checkedBoxes.length === 0) {
                alert('삭제할 키워드를 선택해주세요.');
                return;
            }
            
            if (confirm(`선택한 ${checkedBoxes.length}개의 키워드를 삭제하시겠습니까?`)) {
                try {
                    // keyword_id만 추출
                    const keywordIds = Array.from(checkedBoxes)
                        .map(checkbox => {
                            const keywordId = checkbox.getAttribute('data-keyword-id');
                            return keywordId ? parseInt(keywordId, 10) : null;
                        })
                        .filter(id => id !== null);
                    
                    if (keywordIds.length === 0) {
                        alert('유효한 키워드 ID를 찾을 수 없습니다.');
                        return;
                    }
                    
                    console.log('배치 삭제 요청 keyword_ids:', keywordIds);
                    
                    // 배치 삭제 API 호출
                    const response = await fetch(`${API_BASE_URL}/rewards/keywords/batch`, {
                        method: 'DELETE',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                            keyword_ids: keywordIds
                        })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log('배치 삭제 성공:', data);
                        
                        const deletedCount = data.data?.deleted_count || data.deleted_count || keywordIds.length;
                        const failedCount = data.data?.failed_count || 0;
                        
                        if (failedCount > 0) {
                            alert(`${deletedCount}개 삭제 성공, ${failedCount}개 실패`);
                        } else {
                            alert(`${deletedCount}개의 키워드가 삭제되었습니다.`);
                        }
                        
                        // 백엔드 반영 시간 확보를 위한 지연 후 모달 내부만 업데이트
                        await new Promise(resolve => setTimeout(resolve, 300));
                        await refreshKeywordModal(shortCode, modal);
                    } else {
                        let errorMessage = `서버 오류 (${response.status})`;
                        try {
                            const errorText = await response.text();
                            if (errorText) {
                                try {
                                    const errorData = JSON.parse(errorText);
                                    errorMessage = errorData.detail || errorData.message || errorText;
                                } catch (e) {
                                    errorMessage = errorText;
                                }
                            }
                        } catch (e) {
                            console.error('오류 메시지 파싱 실패:', e);
                        }
                        
                        console.error('배치 삭제 실패:', response.status, errorMessage);
                        alert(`키워드 삭제 실패: ${errorMessage}`);
                    }
                } catch (error) {
                    console.error('일괄 삭제 오류:', error);
                    alert('일괄 삭제 중 오류가 발생했습니다.');
                }
            }
        });
    }
    
    // 모두 저장 버튼 이벤트
    const saveAllBtn = modal.querySelector('.btn-save-all-keywords');
    if (saveAllBtn) {
        // 기존 이벤트 리스너 제거 (중복 방지)
        const newSaveAllBtn = saveAllBtn.cloneNode(true);
        saveAllBtn.parentNode.replaceChild(newSaveAllBtn, saveAllBtn);
        
        newSaveAllBtn.addEventListener('click', async () => {
            const keywordItems = modal.querySelectorAll('.keyword-item');
            const keywordsToSave = []; // 변경된 기존 키워드
            const newKeywordsToSave = []; // 새로 추가된 키워드
            
            for (const item of keywordItems) {
                const query = item.querySelector('.keyword-query').value.trim();
                if (!query) continue;
                
                const keywordId = item.getAttribute('data-keyword-id');
                const originalQuery = item.getAttribute('data-original-query') || '';
                const linkId = item.querySelector('.keyword-checkbox')?.getAttribute('data-link-id');
                
                // 새 키워드(new_로 시작)
                if (keywordId && keywordId.toString().startsWith('new_')) {
                    if (linkId && linkId !== 'null' && linkId !== '' && linkId !== 'undefined') {
                        newKeywordsToSave.push({
                            linkId: linkId,
                            keywordId: keywordId,
                            query: query
                        });
                    }
                } else {
                    // 기존 키워드 - 변경된 것만 저장
                    if (query !== originalQuery) {
                        keywordsToSave.push({
                            keyword_id: parseInt(keywordId, 10),
                            query: query
                        });
                    }
                }
            }
            
            // 저장할 항목이 없으면 알림
            if (keywordsToSave.length === 0 && newKeywordsToSave.length === 0) {
                alert('변경되거나 추가된 키워드가 없습니다.');
                return;
            }
            
            try {
                const savePromises = [];
                
                // 1. 변경된 기존 키워드 배치 저장
                if (keywordsToSave.length > 0) {
                    console.log('배치 저장 요청 (PATCH) - 변경된 키워드:', keywordsToSave);
                    
                    savePromises.push(
                        fetch(`${API_BASE_URL}/rewards/keywords/batch`, {
                            method: 'PATCH',
                            headers: getAuthHeaders(),
                            body: JSON.stringify({
                                keywords: keywordsToSave
                            })
                        }).then(response => {
                            if (!response.ok) {
                                throw new Error(`배치 저장 실패: ${response.status}`);
                            }
                            return response.json();
                        })
                    );
                }
                
                // 2. 새로 추가된 키워드 개별 저장
                for (const newKeyword of newKeywordsToSave) {
                    console.log('새 키워드 저장:', newKeyword);
                    
                    savePromises.push(
                        saveKeyword(newKeyword.linkId, newKeyword.keywordId, newKeyword.query, shortCode, modal, false)
                    );
                }
                
                // 모든 저장 작업 실행
                const results = await Promise.all(savePromises);
                
                const updatedCount = keywordsToSave.length;
                const newCount = newKeywordsToSave.length;
                const totalCount = updatedCount + newCount;
                
                alert(`${totalCount}개의 키워드가 저장되었습니다.\n- 변경된 키워드: ${updatedCount}개\n- 새로 추가된 키워드: ${newCount}개`);
                
                // 백엔드 반영 시간 확보를 위한 지연 후 모달 내부만 업데이트
                await new Promise(resolve => setTimeout(resolve, 300));
                await refreshKeywordModal(shortCode, modal);
            } catch (error) {
                console.error('일괄 저장 오류:', error);
                alert(`일괄 저장 중 오류가 발생했습니다: ${error.message}`);
            }
        });
    }
    
    // 저장 후 닫기 버튼 이벤트
    const saveAndCloseBtn = modal.querySelector('.btn-save-and-close');
    if (saveAndCloseBtn) {
        // 기존 이벤트 리스너 제거 (중복 방지)
        const newSaveAndCloseBtn = saveAndCloseBtn.cloneNode(true);
        saveAndCloseBtn.parentNode.replaceChild(newSaveAndCloseBtn, saveAndCloseBtn);
        
        newSaveAndCloseBtn.addEventListener('click', async () => {
            // 먼저 모두 저장
            const keywordItems = modal.querySelectorAll('.keyword-item');
            const savePromises = [];
            
            for (const item of keywordItems) {
                const query = item.querySelector('.keyword-query').value.trim();
                if (!query) continue;
                
                const saveBtn = item.querySelector('.btn-save-keyword');
                if (!saveBtn) continue;
                
                const linkId = saveBtn.getAttribute('data-link-id');
                const keywordId = item.getAttribute('data-keyword-id');
                
                if (linkId && keywordId) {
                    // showAlert를 false로 전달하여 개별 alert 비활성화
                    savePromises.push(saveKeyword(linkId, keywordId, query, null, null, false));
                }
            }
            
            if (savePromises.length > 0) {
                try {
                    await Promise.all(savePromises);
                    alert('모든 키워드가 저장되었습니다.');
                } catch (error) {
                    console.error('저장 오류:', error);
                    alert('일부 키워드 저장 중 오류가 발생했습니다.');
                }
            }
            
            // 모달 닫기 및 목록 새로고침
            document.body.removeChild(modal);
            loadLinkList();
        });
    }
    
    // 키워드 추가 버튼 이벤트
    const addKeywordBtn = modal.querySelector('.btn-add-keyword');
    if (addKeywordBtn && firstLinkId) {
        // 기존 이벤트 리스너 제거 (중복 방지)
        const newAddKeywordBtn = addKeywordBtn.cloneNode(true);
        addKeywordBtn.parentNode.replaceChild(newAddKeywordBtn, addKeywordBtn);
        
        newAddKeywordBtn.addEventListener('click', () => {
            addKeywordRow(shortCode, firstLinkId, modal);
        });
    }
};

// 모달 이벤트 바인딩 함수 분리
const bindKeywordModalEvents = (modal, shortCode, firstLinkId) => {
    // 저장 버튼 이벤트
    modal.querySelectorAll('.btn-save-keyword').forEach(btn => {
        // 기존 이벤트 리스너 제거 (중복 방지)
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', async () => {
            const linkId = newBtn.getAttribute('data-link-id');
            const keywordId = newBtn.getAttribute('data-keyword-id');
            const keywordItem = newBtn.closest('.keyword-item');
            const query = keywordItem.querySelector('.keyword-query').value.trim();
            
            if (!query) {
                alert('query 키워드를 입력해주세요.');
                return;
            }
            
            if (!linkId) {
                alert('링크 ID를 찾을 수 없습니다.');
                return;
            }

            await saveKeyword(linkId, keywordId, query, shortCode, modal);
        });
    });
    
    // 삭제 버튼 이벤트
    modal.querySelectorAll('.btn-delete-keyword').forEach(btn => {
        // 기존 이벤트 리스너 제거 (중복 방지)
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', async () => {
            const linkId = newBtn.getAttribute('data-link-id');
            const keywordId = newBtn.getAttribute('data-keyword-id');
            
            if (!linkId) {
                alert('링크 ID를 찾을 수 없습니다.');
                return;
            }
            
            if (confirm('이 키워드 조합을 삭제하시겠습니까?')) {
                try {
                    await deleteKeyword(linkId, keywordId);
                    alert('키워드가 삭제되었습니다.');
                    // 백엔드 반영 시간 확보를 위한 지연 후 모달 내부만 업데이트
                    await new Promise(resolve => setTimeout(resolve, 300));
                    await refreshKeywordModal(shortCode, modal);
                } catch (error) {
                    alert(`키워드 삭제 실패: ${error.message || '알 수 없는 오류'}`);
                }
            }
        });
    });
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

// 링크 다량 생성 모달 표시
const showBulkCreateLinkModal = () => {
    const modal = document.createElement('div');
    modal.id = 'bulk-create-link-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; justify-content: center; align-items: center;';
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 8px; max-width: 900px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>링크 다량 생성</h3>
                <button id="close-bulk-create-modal" style="padding: 5px 15px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">닫기</button>
            </div>
            
            <div style="margin-bottom: 15px; padding: 10px; background: #f0f8ff; border-radius: 4px;">
                <strong>안내:</strong> product_name과 nvmid를 입력하세요. 제출하면 백엔드가 자동으로 링크를 생성합니다.
            </div>
            
            <div id="bulk-link-list" style="margin-bottom: 15px;">
                <!-- 동적으로 추가되는 입력 행들 -->
            </div>
            
            <div style="margin-bottom: 15px;">
                <button id="add-bulk-link-row-btn" style="padding: 8px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">+ 행 추가</button>
            </div>
            
            <div style="text-align: right; margin-top: 20px;">
                <button id="submit-bulk-create-btn" style="padding: 10px 20px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;">제출</button>
                <button id="cancel-bulk-create-btn" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin-left: 10px;">취소</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 초기 행 하나 추가
    addBulkLinkRow(modal);
    
    // 닫기 버튼
    modal.querySelector('#close-bulk-create-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 취소 버튼
    modal.querySelector('#cancel-bulk-create-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // 행 추가 버튼
    modal.querySelector('#add-bulk-link-row-btn').addEventListener('click', () => {
        addBulkLinkRow(modal);
    });
    
    // 제출 버튼
    modal.querySelector('#submit-bulk-create-btn').addEventListener('click', async () => {
        await submitBulkCreateLinks(modal);
    });
};

// 다량 생성 모달에 행 추가
const addBulkLinkRow = (modal) => {
    const container = modal.querySelector('#bulk-link-list');
    if (!container) return;
    
    const rowId = `bulk_row_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const row = document.createElement('div');
    row.className = 'bulk-link-row';
    row.setAttribute('data-row-id', rowId);
    row.style.cssText = 'display: flex; gap: 10px; align-items: center; padding: 10px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;';
    
    row.innerHTML = `
        <div style="flex: 1;">
            <label style="display: block; margin-bottom: 5px; font-size: 12px; font-weight: 500;">상품명 (product_name) <span style="color: red;">*</span></label>
            <input type="text" class="bulk-product-name" placeholder="상품명을 입력하세요" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;" required>
        </div>
        <div style="flex: 1;">
            <label style="display: block; margin-bottom: 5px; font-size: 12px; font-weight: 500;">네이버 상품ID (nvmid) <span style="color: red;">*</span></label>
            <input type="text" class="bulk-nvmid" placeholder="nvmid를 입력하세요" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;" required>
        </div>
        <button type="button" class="btn-remove-bulk-row" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; margin-top: 20px;">X</button>
    `;
    
    container.appendChild(row);
    
    // 삭제 버튼 이벤트
    row.querySelector('.btn-remove-bulk-row').addEventListener('click', () => {
        row.remove();
    });
};

// 다량 생성 제출
const submitBulkCreateLinks = async (modal) => {
    try {
        const rows = modal.querySelectorAll('.bulk-link-row');
        const linkData = [];
        
        // 각 행에서 데이터 수집
        rows.forEach(row => {
            const productName = row.querySelector('.bulk-product-name').value.trim();
            const nvmid = row.querySelector('.bulk-nvmid').value.trim();
            
            if (productName && nvmid) {
                linkData.push({
                    product_name: productName,
                    nvmid: nvmid
                });
            }
        });
        
        if (linkData.length === 0) {
            alert('최소 1개 이상의 데이터를 입력해주세요.');
            return;
        }
        
        // 백엔드 API 호출
        const url = `${API_BASE_URL}/rewards/links/batch`;
        const requestBody = {
            links: linkData
        };
        
        console.log('링크 다량 생성 API 호출:', url);
        console.log('요청 본문:', JSON.stringify(requestBody, null, 2));
        console.log(`생성할 링크 수: ${linkData.length}개`);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('링크 다량 생성 성공:', data);
            
            const createdCount = data.data?.created_count || data.created_count || linkData.length;
            alert(`링크가 생성되었습니다!\n\n생성된 링크 수: ${createdCount}개`);
            
            // 모달 닫기
            document.body.removeChild(modal);
            
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
            
            console.error('링크 다량 생성 실패:', response.status, errorMessage);
            alert(`링크 다량 생성 실패: ${errorMessage}\n\n콘솔을 확인하여 상세 오류를 확인하세요.`);
        }
    } catch (error) {
        console.error('링크 다량 생성 프로세스 오류:', error);
        alert(`링크 다량 생성 중 오류가 발생했습니다: ${error.message}`);
    }
};
