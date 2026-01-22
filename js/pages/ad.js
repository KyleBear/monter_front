import { API_BASE_URL } from '../config.js'

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

// 광고 상태 통계 업데이트
const updateAdStatus = (stats) => {
    const totalCount = document.getElementById('total-count');
    const normalCount = document.getElementById('normal-count');
    const errorCount = document.getElementById('error-count');
    const pendingCount = document.getElementById('pending-count');
    const endingCount = document.getElementById('ending-count');
    const endedCount = document.getElementById('ended-count');
    
    if (totalCount) totalCount.textContent = stats.total || 0;
    if (normalCount) normalCount.textContent = stats.normal || 0;
    if (errorCount) errorCount.textContent = stats.error || 0;
    if (pendingCount) pendingCount.textContent = stats.pending || 0;
    if (endingCount) endingCount.textContent = stats.ending || 0;
    if (endedCount) endedCount.textContent = stats.ended || 0;
};

// 광고 테이블 렌더링
const renderAdTable = (ads) => {
    const tbody = document.getElementById('ad-list');
    console.log('renderAdTable 호출, ads:', ads);
    console.log('tbody 요소:', tbody);
    
    if (!tbody) {
        console.error('ad-list tbody를 찾을 수 없습니다.');
        return;
    }

    if (!ads || ads.length === 0) {
        console.log('광고 데이터가 없습니다.');
        tbody.innerHTML = '<tr><td colspan="15" style="text-align: center; padding: 20px;">등록된 광고가 없습니다.</td></tr>';
        return;
    }
    
    console.log('광고 테이블 렌더링 시작, 광고 수:', ads.length);

    const statusMap = {
        'normal': { text: '정상', color: '#28a745' },
        'error': { text: '오류', color: '#dc3545' },
        'pending': { text: '대기', color: '#ffc107' },
        'ending': { text: '종료예정', color: '#fd7e14' },
        'ended': { text: '종료', color: '#6c757d' }
    };

    tbody.innerHTML = ads.map((ad, index) => {
        const status = statusMap[ad.status] || { text: ad.status, color: '#000' };
        
        // slot 필드 표시 (백엔드에서 slot 필드로 응답)
        return `
            <tr data-ad-id="${ad.ad_id || ad.id}">
                <td class="checkbox-col"><input type="checkbox" class="row-check"></td>
                <td>${index + 1}</td>
                <td>${ad.username || ad.userid || '-'}</td>
                <td><span style="color: ${status.color};">${status.text}</span></td>
                <td>${ad.main_keyword || '-'}</td>
                <td>${
                    ad.product_name && ad.store_url 
                        ? `<a href="${ad.store_url}" target="_blank" style="color: #007bff; text-decoration: underline; cursor: pointer;">${ad.product_name}</a>`
                        : ad.product_name || '-'
                }</td>
                <td>${ad.rank || '-'}</td>
                <td>${ad.product_mid || '-'}</td>
                <td>${ad.price_comparison_mid || '-'}</td>
                <td>${ad.work_days || 0}</td>
                <td>${ad.start_date || '-'}</td>
                <td>${ad.end_date || '-'}</td>
                <td>${ad.slot || '-'}</td>
                <td><button class="btn-edit-row" data-ad-id="${ad.ad_id || ad.id}">수정</button></td>
            </tr>
        `;
    }).join('');

    // 체크박스 이벤트 다시 바인딩
    bindRowChecks();
};

// 소속 사용자 목록 로드
const loadAffiliatedUsers = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/accounts`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (response.ok) {
            const data = await response.json();
            let accounts = [];
            if (data.data && data.data.accounts && Array.isArray(data.data.accounts)) {
                accounts = data.data.accounts;
            } else if (data.accounts && Array.isArray(data.accounts)) {
                accounts = data.accounts;
            } else if (Array.isArray(data)) {
                accounts = data;
            }
            return accounts;
        } else {
            console.error('소속 사용자 목록 로드 실패:', response.status);
            return [];
        }
    } catch (error) {
        console.error('소속 사용자 목록 로드 오류:', error);
        return [];
    }
};

// 광고 목록 로드
const loadAdList = async (searchParams = {}) => {
    try {
        const queryString = new URLSearchParams(searchParams).toString();
        const url = `${API_BASE_URL}/advertisements${queryString ? '?' + queryString : ''}`;
        
        console.log('광고 목록 API 호출:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('광고 목록 API 응답:', data);
            console.log('광고 개수:', data.data?.advertisements?.length || 0);
            
            // 응답 형식: { success: true, data: { advertisements: [...] }, stats: {...} }
            const advertisements = data.data?.advertisements || [];
            
            // 첫 번째 광고 데이터 확인 (slot 필드 포함 여부)
            if (advertisements.length > 0) {
                console.log('첫 번째 광고 데이터:', advertisements[0]);
                console.log('첫 번째 광고의 slot 값:', advertisements[0].slot);
                console.log('첫 번째 광고의 모든 키:', Object.keys(advertisements[0]));
            }
            
            renderAdTable(advertisements);
            updateAdStatus(data.stats || {});
        } else {
            let errorData = {};
            try {
                const errorText = await response.text();
                errorData = errorText ? JSON.parse(errorText) : {};
            } catch (e) {
                errorData = { message: `서버 오류 (${response.status})` };
            }
            console.error('광고 목록 로드 실패:', response.status, errorData);
            alert(`광고 목록을 불러올 수 없습니다.\n오류: ${errorData.message || errorData.detail || '서버 내부 오류'}`);
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
};

export const initAdPage = (container) => {
    // 현재 사용자 권한 확인
    const userRole = sessionStorage.getItem('userRole');
    
    container.innerHTML = `
        <div class="account-info">
            <strong>광고관리</strong><br>
            진행 중인 광고의 연장·수정·삭제 등의 관리 작업을 할 수 있습니다.
        </div>

        <div class="account-status">
            <div class="status-card">
                <h4>전체</h4>
                <div class="count" id="total-count">0</div>
            </div>
            <div class="status-card">
                <h4>정상</h4>
                <div class="count" style="color: #28a745;" id="normal-count">0</div>
            </div>
            <div class="status-card">
                <h4>오류</h4>
                <div class="count" style="color: #dc3545;" id="error-count">0</div>
            </div>
            <div class="status-card">
                <h4>대기</h4>
                <div class="count" style="color: #ffc107;" id="pending-count">0</div>
            </div>
            <div class="status-card">
                <h4>종료예정</h4>
                <div class="count" style="color: #fd7e14;" id="ending-count">0</div>
            </div>
            <div class="status-card">
                <h4>종료</h4>
                <div class="count" style="color: #6c757d;" id="ended-count">0</div>
            </div>
        </div>

        <div class="search-section">
            <div class="search-bar">
                <select class="search-select">
                    <option value="all">전체</option>
                    <option value="no">No</option>
                    <option value="product_name">상품명</option>
                    <option value="userid">아이디</option>
                    <option value="keyword">키워드</option>
                    <option value="product_id">프로덕트ID</option>
                    <option value="vendor_id">벤더ID</option>
                </select>
                <input type="text" class="search-input" placeholder="검색어를 입력해주세요.">
                <button class="search-btn">🔍</button>
            </div>
        </div>

        <div class="table-status-bar">
            <div class="selected-count"><span id="select-count">0</span>개 선택됨</div>
            <div class="table-actions">
                <button class="btn-register" style="background-color: #17a2b8;">수정</button>
                <button class="btn-delete">삭제</button>
                <button class="btn-extend" id="extend-btn">연장</button>
                <button class="btn-register" id="open-register-btn">등록</button>
                <button class="btn-register" id="csv-upload-btn" style="background-color: #28a745; display: none;">CSV 업로드</button>
                <button class="btn-register" id="csv-download-btn" style="background-color: #007bff; color: white;">CSV 다운로드</button>
            </div>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th class="checkbox-col"><input type="checkbox" id="select-all"></th>
                        <th>No</th>
                        <th>아이디</th>
                        <th>상태</th>
                        <th>메인키워드</th>
                        <th>상품명</th>
                        <th>순위</th>
                        <th>상품MID</th>
                        <th>가격비교MID</th>
                        <th>작업일수</th>
                        <th>시작일</th>
                        <th>종료일</th>
                        <th>슬롯수</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody id="ad-list">
                    <!-- 광고 목록이 여기에 동적으로 로드됩니다 -->
                </tbody>
            </table>
        </div>

        <!-- 우측 등록 사이드바 -->
        <div id="ad-right-sidebar" class="right-sidebar">
            <h3>광고 등록</h3>
            <div class="form-group" id="ad-reg-user-select-group" style="display: none;">
                <label>사용자 <span style="color: red;">*</span></label>
                <select id="ad-reg-user-select" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">로딩 중...</option>
                </select>
            </div>
            <div class="form-group">
                <label>상품링크 <span style="color: red;">*</span></label>
                <input type="text" id="ad-reg-store-url" placeholder="상품링크를 입력하세요" required>
            </div>
            <div class="form-group">
                <label>가격비교링크</label>
                <input type="text" id="ad-reg-shopping-url" placeholder="가격비교링크를 입력하세요">
            </div>
            <div class="form-group">
                <label>메인키워드</label>
                <input type="text" id="ad-reg-keyword" placeholder="메인키워드를 입력하세요">
            </div>
            <div class="form-group">
                <label>시작일</label>
                <input type="date" id="ad-reg-start-date" min="">
            </div>
            <div class="form-group">
                <label>종료일</label>
                <input type="date" id="ad-reg-end-date" min="">
            </div>
            <div class="form-group">
                <label>슬롯수</label>
                <input type="number" id="ad-reg-slot" placeholder="슬롯수를 입력하세요" min="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div class="form-actions">
                <button id="ad-reg-submit-btn" class="btn-submit">등록</button>
                <button id="ad-reg-close-btn" class="btn-close">닫기</button>
            </div>
        </div>

        <!-- CSV 파일 업로드 input (숨김) -->
        <input type="file" id="csv-file-input" accept=".csv" style="display: none;">

        <!-- 우측 수정 사이드바 -->
        <div id="ad-edit-sidebar" class="right-sidebar">
            <h3>광고 수정</h3>
            <div class="form-group">
                <label>상품 URL</label>
                <input type="text" id="ad-edit-product-url" placeholder="상품 URL을 입력하세요">
            </div>
            <div class="form-group">
                <label>가격비교 URL</label>
                <input type="text" id="ad-edit-price-url" placeholder="가격비교 URL을 입력하세요">
            </div>
            <div class="form-group">
                <label>메인 키워드 <span style="color: red;">*</span></label>
                <input type="text" id="ad-edit-keyword" placeholder="메인 키워드를 입력하세요" required>
            </div>
            <div class="form-group" id="ad-edit-product-name-group" style="display: none;">
                <label>상품명</label>
                <input type="text" id="ad-edit-product-name" placeholder="상품명을 입력하세요">
            </div>
            <div class="form-group">
                <label>메모</label>
                <textarea id="ad-edit-memo" placeholder="메모를 입력하세요" rows="4"></textarea>
            </div>
            <div class="form-actions">
                <button id="ad-edit-submit-btn" class="btn-submit">수정</button>
                <button id="ad-edit-close-btn" class="btn-close">닫기</button>
            </div>
        </div>

        <!-- 연장 모달 -->
        <div id="extend-modal" class="modal" style="display: none;">
            <div class="modal-content" style="max-width: 400px; margin: 15% auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0;">광고 연장</h3>
                <div class="form-group">
                    <label>연장일수</label>
                    <input type="number" id="extend-days-input" placeholder="연장할 일수를 입력하세요" min="1" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div style="margin-top: 20px; text-align: right;">
                    <button id="extend-confirm-btn" class="btn-submit" style="margin-right: 10px;">확인</button>
                    <button id="extend-cancel-btn" class="btn-close">취소</button>
                </div>
            </div>
        </div>
    `;

    initAdEvents();
    
    // 권한에 따른 버튼 제어
    const openRegBtn = document.getElementById('open-register-btn');
    const csvUploadBtn = document.getElementById('csv-upload-btn');
    const deleteBtn = document.querySelector('.btn-delete');
    
    // CSV 업로드 버튼은 모든 권한에서 숨김
    if (csvUploadBtn) csvUploadBtn.style.display = 'none';
    
    if (userRole === 'advertiser') {
        // 광고주: 등록 버튼 숨기기
        if (openRegBtn) openRegBtn.style.display = 'none';
        // 광고주: 삭제 버튼 숨기기
        if (deleteBtn) deleteBtn.style.display = 'none';
    }
};

const bindRowChecks = () => {
    const rowChecks = document.querySelectorAll('.row-check');
    rowChecks.forEach(check => {
        check.removeEventListener('change', handleRowCheckChange);
        check.addEventListener('change', handleRowCheckChange);
    });
};

const handleRowCheckChange = () => {
    updateSelectCount();
    const selectAll = document.getElementById('select-all');
    const rowChecks = document.querySelectorAll('.row-check');
    const allChecked = Array.from(rowChecks).every(c => c.checked) && rowChecks.length > 0;
    if (selectAll) selectAll.checked = allChecked;
};

const updateSelectCount = () => {
    const rowChecks = document.querySelectorAll('.row-check');
    const checkedCount = Array.from(rowChecks).filter(c => c.checked).length;
    const selectCountSpan = document.getElementById('select-count');
    if (selectCountSpan) selectCountSpan.textContent = checkedCount;
};

const initAdEvents = () => {
    const selectAll = document.getElementById('select-all');
    const selectCountSpan = document.getElementById('select-count');
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('.search-input');
    const searchSelect = document.querySelector('.search-select');
    const extendBtn = document.getElementById('extend-btn');
    const deleteBtn = document.querySelector('.btn-delete');
    const editBtn = document.querySelector('.table-actions .btn-register');
    const openRegBtn = document.getElementById('open-register-btn');
    const csvUploadBtn = document.getElementById('csv-upload-btn');
    const csvFileInput = document.getElementById('csv-file-input');
    const adRightSidebar = document.getElementById('ad-right-sidebar');
    const adRegCloseBtn = document.getElementById('ad-reg-close-btn');
    const adRegSubmitBtn = document.getElementById('ad-reg-submit-btn');
    const adEditSidebar = document.getElementById('ad-edit-sidebar');
    const adEditCloseBtn = document.getElementById('ad-edit-close-btn');
    const adEditSubmitBtn = document.getElementById('ad-edit-submit-btn');
    const startDateInput = document.getElementById('ad-reg-start-date');
    const endDateInput = document.getElementById('ad-reg-end-date');
    
    // 시작일 변경 시 종료일 최소값 업데이트
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', function() {
            if (this.value) {
                const startDate = new Date(this.value);
                const minEndDate = new Date(startDate);
                minEndDate.setDate(minEndDate.getDate() + 1);
                endDateInput.min = minEndDate.toISOString().split('T')[0];
                
                // 종료일이 최소값보다 작으면 초기화
                if (endDateInput.value && new Date(endDateInput.value) < minEndDate) {
                    endDateInput.value = '';
                }
            } else {
                endDateInput.min = '';
            }
        });
    }
    
    // 전체 선택 체크박스
    if (selectAll) {
        selectAll.addEventListener('change', () => {
            const rowChecks = document.querySelectorAll('.row-check');
            rowChecks.forEach(check => {
                check.checked = selectAll.checked;
            });
            updateSelectCount();
        });
    }

    // 개별 체크박스 이벤트
    bindRowChecks();

    // 등록 사이드바 열기
    if (openRegBtn) {
        openRegBtn.addEventListener('click', async () => {
            const userRole = sessionStorage.getItem('userRole');
            const userSelectGroup = document.getElementById('ad-reg-user-select-group');
            const userSelect = document.getElementById('ad-reg-user-select');
            
            // 대행사인 경우 사용자 선택 필드 표시 및 필수 설정
            if (userRole === 'agency') {
                if (userSelectGroup) userSelectGroup.style.display = 'block';
                if (userSelect) {
                    userSelect.innerHTML = '<option value="">로딩 중...</option>';
                    userSelect.required = true;
                    
                    // 소속 사용자 목록 로드
                    const accounts = await loadAffiliatedUsers();
                    
                    userSelect.innerHTML = '<option value="">사용자를 선택하세요</option>';
                    
                    // 소속 사용자 추가 (광고주만)
                    accounts.forEach(account => {
                        if (account.role === 'advertiser') {
                            userSelect.innerHTML += `<option value="${account.user_id}|${account.username}">${account.username}</option>`;
                        }
                    });
                }
            } else {
                // 대행사가 아닌 경우 사용자 선택 필드 숨기기
                if (userSelectGroup) userSelectGroup.style.display = 'none';
                if (userSelect) userSelect.required = false;
            }
            
            // 폼 초기화
            document.getElementById('ad-reg-store-url').value = '';
            document.getElementById('ad-reg-shopping-url').value = '';
            document.getElementById('ad-reg-keyword').value = '';
            document.getElementById('ad-reg-slot').value = '';
            
            // 시작일: 오늘 기준 다음날부터 입력 가능
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            
            const startDateInput = document.getElementById('ad-reg-start-date');
            const endDateInput = document.getElementById('ad-reg-end-date');
            
            startDateInput.min = tomorrowStr;
            startDateInput.value = '';
            endDateInput.min = '';
            endDateInput.value = '';
            
            adRightSidebar.classList.add('active');
        });
    }

    // 등록 사이드바 닫기
    if (adRegCloseBtn) {
        adRegCloseBtn.addEventListener('click', () => {
            adRightSidebar.classList.remove('active');
        });
    }

    // 광고 등록 폼 제출
    let isSubmittingAd = false; // 처리 중 플래그
    
    if (adRegSubmitBtn) {
        adRegSubmitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation(); // 이벤트 버블링 방지
            
            // 이미 처리 중이면 무시
            if (isSubmittingAd) {
                console.log('광고 등록이 이미 처리 중입니다.');
                return;
            }
            
            const storeUrl = document.getElementById('ad-reg-store-url').value.trim();
            const shoppingUrl = document.getElementById('ad-reg-shopping-url').value.trim();
            const keyword = document.getElementById('ad-reg-keyword').value.trim();
            const startDate = document.getElementById('ad-reg-start-date').value;
            const endDate = document.getElementById('ad-reg-end-date').value;
            const slot = document.getElementById('ad-reg-slot').value.trim();
            
            // 유효성 검사
            if (!storeUrl) {
                alert('상품링크를 입력해주세요.');
                return;
            }
            if (!keyword) {
                alert('메인키워드를 입력해주세요.');
                return;
            }
            if (!startDate || !endDate) {
                alert('시작일과 종료일을 입력해주세요.');
                return;
            }
            if (!slot || parseInt(slot, 10) < 1) {
                alert('슬롯수를 입력해주세요. (최소 1)');
                return;
            }
            
            // 시작일이 오늘 기준 다음날 이후인지 확인
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const startDateObj = new Date(startDate);
            startDateObj.setHours(0, 0, 0, 0);
            
            if (startDateObj < tomorrow) {
                alert('시작일은 오늘 기준 다음날부터 입력 가능합니다.');
                return;
            }
            
            // 종료일이 시작일 +1일 이후인지 확인
            const minEndDate = new Date(startDateObj);
            minEndDate.setDate(minEndDate.getDate() + 1);
            const endDateObj = new Date(endDate);
            endDateObj.setHours(0, 0, 0, 0);
            
            if (endDateObj < minEndDate) {
                alert('종료일은 시작일 기준 최소 하루 이후여야 합니다.');
                return;
            }
            
            // 작업일수 자동 계산 (시작일과 종료일의 차이)
            const workDays = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24));
            
            // 처리 중 플래그 설정 및 버튼 비활성화
            isSubmittingAd = true;
            adRegSubmitBtn.disabled = true;
            adRegSubmitBtn.textContent = '등록 중...';
            
            try {
                const userRole = sessionStorage.getItem('userRole');
                const currentUsername = sessionStorage.getItem('userName');
                const currentUserId = sessionStorage.getItem('userId');
                
                if (!currentUsername) {
                    alert('로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
                    isSubmittingAd = false;
                    adRegSubmitBtn.disabled = false;
                    adRegSubmitBtn.textContent = '등록';
                    return;
                }
                
                // 대행사인 경우 사용자 선택 필수 검증
                let selectedUserId = currentUserId;
                let selectedUsername = currentUsername;
                
                if (userRole === 'agency') {
                    const userSelect = document.getElementById('ad-reg-user-select');
                    if (!userSelect || !userSelect.value) {
                        alert('사용자를 선택해주세요.');
                        isSubmittingAd = false;
                        adRegSubmitBtn.disabled = false;
                        adRegSubmitBtn.textContent = '등록';
                        return;
                    }
                    
                    const [userId, username] = userSelect.value.split('|');
                    selectedUserId = userId;
                    selectedUsername = username;
                }
                
                // 광고 등록 요청
                const requestBody = {
                    user_id: selectedUserId ? parseInt(selectedUserId, 10) : null,
                    username: selectedUsername,
                    store_url: storeUrl,
                    shopping_url: shoppingUrl || null,
                    main_keyword: keyword,
                    work_days: workDays,
                    start_date: startDate,
                    end_date: endDate,
                    slot: parseInt(slot, 10)
                };
                
                console.log('광고 등록 요청 데이터:', requestBody);
                
                const response = await fetch(`${API_BASE_URL}/advertisements`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(requestBody)
                });
                
                console.log('광고 등록 응답 상태:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    alert('광고가 등록되었습니다.');
                    
                    // 폼 초기화
                    // document.getElementById('ad-reg-userid').value = '';  // 아이디 필드 주석처리
                    document.getElementById('ad-reg-keyword').value = '';
                    document.getElementById('ad-reg-store-url').value = '';
                    document.getElementById('ad-reg-shopping-url').value = '';
                    document.getElementById('ad-reg-slot').value = '';
                    
                    // 시작일: 오늘 기준 다음날부터 입력 가능
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowStr = tomorrow.toISOString().split('T')[0];
                    
                    const startDateInput = document.getElementById('ad-reg-start-date');
                    startDateInput.min = tomorrowStr;
                    startDateInput.value = '';
                    
                    const endDateInput = document.getElementById('ad-reg-end-date');
                    endDateInput.min = '';
                    endDateInput.value = '';
                    
                    adRightSidebar.classList.remove('active');
                    
                    // 광고 목록 새로고침
                    await loadAdList();
                } else {
                    // 더 자세한 에러 정보 출력
                    let errorData = {};
                    let errorText = '';
                    try {
                        errorText = await response.text();
                        console.error('광고 등록 실패 - 응답 텍스트:', errorText);
                        if (errorText) {
                            try {
                                errorData = JSON.parse(errorText);
                            } catch (parseError) {
                                errorData = { message: errorText || `서버 오류 (${response.status})` };
                            }
                        } else {
                            errorData = { message: `서버 오류 (${response.status})` };
                        }
                    } catch (e) {
                        console.error('에러 파싱 실패:', e);
                        errorData = { message: `서버 오류 (${response.status})` };
                    }
                    
                    console.error('등록 실패 상세:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorData: errorData,
                        errorText: errorText
                    });
                    
                    // 422 에러인 경우 더 자세한 정보 표시
                    if (response.status === 422) {
                        let errorMessage = '입력 데이터가 올바르지 않습니다.\n\n';
                        if (errorData.detail) {
                            if (Array.isArray(errorData.detail)) {
                                errorMessage += errorData.detail.map(err => {
                                    if (typeof err === 'object' && err.loc && err.msg) {
                                        return `- ${err.loc.join('.')}: ${err.msg}`;
                                    }
                                    return `- ${JSON.stringify(err)}`;
                                }).join('\n');
                            } else if (typeof errorData.detail === 'string') {
                                errorMessage += errorData.detail;
                            } else {
                                errorMessage += JSON.stringify(errorData.detail, null, 2);
                            }
                        } else if (errorData.message) {
                            errorMessage += errorData.message;
                        } else {
                            errorMessage += JSON.stringify(errorData, null, 2);
                        }
                        alert(errorMessage);
                    } else {
                        alert(`등록 실패: ${errorData.message || errorData.detail || '서버 오류가 발생했습니다.'}`);
                    }
                }
            } catch (error) {
                console.error('API 호출 오류:', error);
                alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
            } finally {
                // 처리 중 플래그 해제 및 버튼 활성화
                isSubmittingAd = false;
                adRegSubmitBtn.disabled = false;
                adRegSubmitBtn.textContent = '등록';
            }
        });
    }

    // 검색 기능
    if (searchBtn) {
        const performSearch = async () => {
            const searchType = searchSelect ? searchSelect.value : 'all';
            const searchKeyword = searchInput ? searchInput.value.trim() : '';
            
            const searchParams = {};
            if (searchKeyword) {
                searchParams[searchType === 'all' ? 'keyword' : searchType] = searchKeyword;
            }
            
            await loadAdList(searchParams);
        };
        
        searchBtn.addEventListener('click', performSearch);
        
        // Enter 키로 검색
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
        }
    }

    // 연장 버튼
    const extendModal = document.getElementById('extend-modal');
    const extendDaysInput = document.getElementById('extend-days-input');
    const extendConfirmBtn = document.getElementById('extend-confirm-btn');
    const extendCancelBtn = document.getElementById('extend-cancel-btn');
    
    console.log('연장 관련 요소 확인:', {
        extendBtn: !!extendBtn,
        extendModal: !!extendModal,
        extendDaysInput: !!extendDaysInput,
        extendConfirmBtn: !!extendConfirmBtn,
        extendCancelBtn: !!extendCancelBtn
    });
    
    if (extendBtn) {
        extendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('연장 버튼 클릭됨');
            
            const rowChecks = document.querySelectorAll('.row-check:checked');
            if (rowChecks.length === 0) {
                alert('연장할 광고를 선택해주세요.');
                return;
            }
            
            // 연장일수 입력 필드 초기화
            if (extendDaysInput) {
                extendDaysInput.value = '';
            }
            
            // 모달 표시
            if (extendModal) {
                console.log('모달 표시 시도');
                
                // 모달을 body로 이동 (container 밖으로)
                if (extendModal.parentElement !== document.body) {
                    document.body.appendChild(extendModal);
                }
                
                // 모든 스타일을 인라인으로 강제 설정
                extendModal.style.cssText = `
                    display: block !important;
                    position: fixed !important;
                    z-index: 99999 !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    overflow: auto !important;
                    background-color: rgba(0, 0, 0, 0.5) !important;
                `;
                extendModal.classList.add('show');
                
                // 모달 콘텐츠도 확인
                const modalContent = extendModal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.style.cssText = `
                        background-color: #fefefe !important;
                        margin: 15% auto !important;
                        padding: 20px !important;
                        border: 1px solid #888 !important;
                        border-radius: 8px !important;
                        width: 90% !important;
                        max-width: 400px !important;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
                        position: relative !important;
                        z-index: 100000 !important;
                    `;
                }
                
                console.log('모달 display:', window.getComputedStyle(extendModal).display);
                console.log('모달 position:', window.getComputedStyle(extendModal).position);
                console.log('모달 z-index:', window.getComputedStyle(extendModal).zIndex);
            } else {
                console.error('extend-modal 요소를 찾을 수 없습니다.');
            }
        });
    } else {
        console.error('extend-btn 요소를 찾을 수 없습니다.');
    }

    // 연장 모달 취소 버튼
    if (extendCancelBtn) {
        extendCancelBtn.addEventListener('click', () => {
            if (extendModal) {
                extendModal.classList.remove('show');
                extendModal.style.cssText = 'display: none;';
            }
            if (extendDaysInput) {
                extendDaysInput.value = '';
            }
        });
    }

    // 연장 모달 확인 버튼
    if (extendConfirmBtn) {
        extendConfirmBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const rowChecks = document.querySelectorAll('.row-check:checked');
            if (rowChecks.length === 0) {
                alert('연장할 광고를 선택해주세요.');
                if (extendModal) extendModal.style.display = 'none';
                return;
            }
            
            const adIds = Array.from(rowChecks).map(check => {
                const row = check.closest('tr');
                const id = row ? row.getAttribute('data-ad-id') : null;
                // 문자열을 정수로 변환
                return id ? parseInt(id, 10) : null;
            }).filter(id => id !== null && !isNaN(id));
            
            if (adIds.length === 0) {
                alert('연장할 광고를 선택해주세요.');
                if (extendModal) extendModal.style.display = 'none';
                return;
            }
            
            // 연장일수 확인
            if (!extendDaysInput) {
                alert('연장일수 입력 필드를 찾을 수 없습니다.');
                return;
            }
            
            const extendDays = extendDaysInput.value.trim();
            if (!extendDays) {
                alert('연장일수를 입력해주세요.');
                return;
            }

            const extendDaysNum = parseInt(extendDays, 10);
            if (isNaN(extendDaysNum) || extendDaysNum < 1) {
                alert('연장일수는 1 이상의 숫자로 입력해주세요.');
                return;
            }
            
            // 처리 중 플래그 설정 및 버튼 비활성화
            extendConfirmBtn.disabled = true;
            extendConfirmBtn.textContent = '처리 중...';
            
            try {
                const response = await fetch(`${API_BASE_URL}/advertisements/extend`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        ad_ids: adIds,
                        extend_days: extendDaysNum
                    })
                });
                
                if (response.ok) {
                    alert(`선택한 ${adIds.length}개의 광고가 ${extendDaysNum}일 연장되었습니다.`);
                    if (extendModal) {
                        extendModal.classList.remove('show');
                        extendModal.style.cssText = 'display: none;';
                    }
                    if (extendDaysInput) {
                        extendDaysInput.value = '';
                    }
                    await loadAdList();
                } else {
                    // 더 자세한 에러 정보 출력
                    let errorData = {};
                    let errorText = '';
                    try {
                        errorText = await response.text();
                        console.error('연장 실패 - 응답 텍스트:', errorText);
                        if (errorText) {
                            try {
                                errorData = JSON.parse(errorText);
                            } catch (parseError) {
                                errorData = { message: errorText || `서버 오류 (${response.status})` };
                            }
                        } else {
                            errorData = { message: `서버 오류 (${response.status})` };
                        }
                    } catch (e) {
                        console.error('에러 파싱 실패:', e);
                        errorData = { message: `서버 오류 (${response.status})` };
                    }
                    
                    console.error('연장 실패 상세:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorData: errorData,
                        errorText: errorText
                    });
                    
                    // 422 에러인 경우 더 자세한 정보 표시
                    if (response.status === 422) {
                        let errorMessage = '입력 데이터가 올바르지 않습니다.\n\n';
                        if (errorData.detail) {
                            if (Array.isArray(errorData.detail)) {
                                errorMessage += errorData.detail.map(err => {
                                    if (typeof err === 'object' && err.loc && err.msg) {
                                        return `- ${err.loc.join('.')}: ${err.msg}`;
                                    }
                                    return `- ${JSON.stringify(err)}`;
                                }).join('\n');
                            } else if (typeof errorData.detail === 'string') {
                                errorMessage += errorData.detail;
                            } else {
                                errorMessage += JSON.stringify(errorData.detail, null, 2);
                            }
                        } else if (errorData.message) {
                            errorMessage += errorData.message;
                        } else {
                            errorMessage += JSON.stringify(errorData, null, 2);
                        }
                        alert(errorMessage);
                    } else {
                        alert(`연장 실패: ${errorData.message || errorData.detail || '서버 오류가 발생했습니다.'}`);
                    }
                }
            } catch (error) {
                console.error('연장 API 호출 오류:', error);
                alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
            } finally {
                // 처리 중 플래그 해제 및 버튼 활성화
                extendConfirmBtn.disabled = false;
                extendConfirmBtn.textContent = '확인';
            }
        });
    }

    // 모달 외부 클릭 시 닫기
    if (extendModal) {
        extendModal.addEventListener('click', (e) => {
            if (e.target === extendModal) {
                extendModal.classList.remove('show');
                extendModal.style.cssText = 'display: none;';
                if (extendDaysInput) {
                    extendDaysInput.value = '';
                }
            }
        });
    }

    // Enter 키로 연장 확인
    if (extendDaysInput) {
        extendDaysInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && extendConfirmBtn) {
                e.preventDefault();
                extendConfirmBtn.click();
            }
        });
    }

    // CSV 업로드 버튼
    if (csvUploadBtn && csvFileInput) {
        csvUploadBtn.addEventListener('click', () => {
            csvFileInput.click();
        });
        
        // 파일 선택 시 업로드
        csvFileInput.addEventListener('change', async (e) => {
            const csvFile = e.target.files[0];
            if (!csvFile) {
                return;
            }
            
            // CSV 파일인지 확인
            if (!csvFile.name.endsWith('.csv')) {
                alert('CSV 파일만 업로드 가능합니다.');
                csvFileInput.value = '';
                return;
            }
            
            if (!confirm(`"${csvFile.name}" 파일을 업로드하시겠습니까?`)) {
                csvFileInput.value = '';
                return;
            }
            
            try {
                // 토큰 가져오기
                const token = sessionStorage.getItem('sessionToken');
                if (!token) {
                    alert('로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
                    csvFileInput.value = '';
                    return;
                }
                
                // FormData 생성
                const formData = new FormData();
                formData.append('file', csvFile);
                
                // 업로드 중 버튼 비활성화
                csvUploadBtn.disabled = true;
                csvUploadBtn.textContent = '업로드 중...';
                
                console.log('CSV 업로드 요청:', csvFile.name);
                
                const response = await fetch(`${API_BASE_URL}/advertisements/upload-csv`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                console.log('CSV 업로드 응답 상태:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    alert('CSV 파일이 성공적으로 업로드되었습니다.');
                    
                    // 파일 input 초기화
                    csvFileInput.value = '';
                    
                    // 광고 목록 새로고침
                    await loadAdList();
                } else {
                    // 에러 처리
                    let errorData = {};
                    let errorText = '';
                    try {
                        errorText = await response.text();
                        console.error('CSV 업로드 실패 - 응답 텍스트:', errorText);
                        if (errorText) {
                            try {
                                errorData = JSON.parse(errorText);
                            } catch (parseError) {
                                errorData = { message: errorText };
                            }
                        }
                    } catch (e) {
                        errorData = { message: `서버 오류 (${response.status})` };
                    }
                    
                    console.error('CSV 업로드 실패 상세:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorData: errorData
                    });
                    
                    // 422 에러인 경우 더 자세한 정보 표시
                    if (response.status === 422) {
                        let errorMessage = 'CSV 파일 형식이 올바르지 않습니다.\n\n';
                        if (errorData.detail) {
                            if (Array.isArray(errorData.detail)) {
                                errorMessage += errorData.detail.map(err => {
                                    if (typeof err === 'object' && err.loc && err.msg) {
                                        return `- ${err.loc.join('.')}: ${err.msg}`;
                                    }
                                    return `- ${JSON.stringify(err)}`;
                                }).join('\n');
                            } else if (typeof errorData.detail === 'string') {
                                errorMessage += errorData.detail;
                            } else {
                                errorMessage += JSON.stringify(errorData.detail, null, 2);
                            }
                        } else if (errorData.message) {
                            errorMessage += errorData.message;
                        } else {
                            errorMessage += JSON.stringify(errorData, null, 2);
                        }
                        alert(errorMessage);
                    } else {
                        alert(`CSV 업로드 실패: ${errorData.message || errorData.detail || '서버 오류가 발생했습니다.'}`);
                    }
                    
                    // 파일 input 초기화
                    csvFileInput.value = '';
                }
            } catch (error) {
                console.error('CSV 업로드 API 호출 오류:', error);
                alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
                csvFileInput.value = '';
            } finally {
                // 버튼 활성화
                csvUploadBtn.disabled = false;
                csvUploadBtn.textContent = 'CSV 업로드';
            }
        });
    }

    // 삭제 버튼
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            const rowChecks = document.querySelectorAll('.row-check:checked');
            if (rowChecks.length === 0) {
                alert('삭제할 광고를 선택해주세요.');
                return;
            }
            
            const adIds = Array.from(rowChecks).map(check => {
                const row = check.closest('tr');
                return row ? row.getAttribute('data-ad-id') : null;
            }).filter(id => id !== null);
            
            if (adIds.length === 0) {
                alert('삭제할 광고를 선택해주세요.');
                return;
            }
            
            if (!confirm(`선택한 ${adIds.length}개의 광고를 삭제하시겠습니까?`)) {
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/advertisements`, {
                    method: 'DELETE',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        ad_ids: adIds
                    })
                });
                
                if (response.ok) {
                    alert('선택한 광고가 삭제되었습니다.');
                    await loadAdList();
                } else {
                    const error = await response.json().catch(() => ({ message: '삭제 실패' }));
                    alert(`삭제 실패: ${error.message || '서버 오류가 발생했습니다.'}`);
                }
            } catch (error) {
                console.error('삭제 API 호출 오류:', error);
                alert('서버 연결에 실패했습니다.');
            }
        });
    }

    // 수정 버튼 (일괄 수정)
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const rowChecks = document.querySelectorAll('.row-check:checked');
            if (rowChecks.length === 0) {
                alert('수정할 광고를 선택해주세요.');
                return;
            }
            // 일괄 수정 기능은 추후 구현
            alert('일괄 수정 기능은 준비 중입니다.');
        });
    }

    // 개별 수정 버튼 (테이블 내)
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-edit-row')) {
            const adId = e.target.getAttribute('data-ad-id');
            if (adId) {
                // 광고 정보 가져오기
                try {
                    const response = await fetch(`${API_BASE_URL}/advertisements/${adId}`, {
                        method: 'GET',
                        headers: getAuthHeaders(),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const ad = data.data?.advertisement || data.data || data;
                        
                        // 수정 사이드바에 데이터 채우기
                        document.getElementById('ad-edit-product-url').value = ad.product_url || '';
                        document.getElementById('ad-edit-price-url').value = ad.price_comparison_url || ad.price_url || '';
                        document.getElementById('ad-edit-keyword').value = ad.main_keyword || '';
                        document.getElementById('ad-edit-memo').value = ad.memo || '';
                        
                        // 현재 수정 중인 광고 ID 저장
                        adEditSidebar.setAttribute('data-edit-ad-id', adId);
                        
                        // 수정 사이드바 열기
                        adEditSidebar.classList.add('active');
                    } else {
                        const error = await response.json().catch(() => ({ message: '광고 정보를 불러올 수 없습니다.' }));
                        alert(`광고 정보를 불러올 수 없습니다.\n오류: ${error.message || error.detail || '서버 오류'}`);
                    }
                } catch (error) {
                    console.error('광고 정보 로드 오류:', error);
                    alert('광고 정보를 불러오는 중 오류가 발생했습니다.');
                }
            }
        }
    });

    // 수정 사이드바 닫기
    if (adEditCloseBtn) {
        adEditCloseBtn.addEventListener('click', () => {
            adEditSidebar.classList.remove('active');
            // 폼 초기화
            document.getElementById('ad-edit-product-url').value = '';
            document.getElementById('ad-edit-price-url').value = '';
            document.getElementById('ad-edit-keyword').value = '';
            document.getElementById('ad-edit-product-name').value = '';
            document.getElementById('ad-edit-memo').value = '';
            const productNameGroup = document.getElementById('ad-edit-product-name-group');
            if (productNameGroup) productNameGroup.style.display = 'none';
            adEditSidebar.removeAttribute('data-edit-ad-id');
        });
    }

    // 광고 수정 폼 제출
    let isSubmittingEdit = false;
    if (adEditSubmitBtn) {
        adEditSubmitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (isSubmittingEdit) {
                console.log('광고 수정이 이미 처리 중입니다.');
                return;
            }

            const adId = adEditSidebar.getAttribute('data-edit-ad-id');
            if (!adId) {
                alert('수정할 광고를 선택해주세요.');
                return;
            }

            const productUrl = document.getElementById('ad-edit-product-url').value.trim();
            const priceUrl = document.getElementById('ad-edit-price-url').value.trim();
            const keyword = document.getElementById('ad-edit-keyword').value.trim();
            const memo = document.getElementById('ad-edit-memo').value.trim();

            // 유효성 검사
            if (!keyword) {
                alert('메인 키워드를 입력해주세요.');
                return;
            }

            // 처리 중 플래그 설정 및 버튼 비활성화
            isSubmittingEdit = true;
            adEditSubmitBtn.disabled = true;
            adEditSubmitBtn.textContent = '수정 중...';

            try {
                // 현재 로그인한 사용자 정보 가져오기
                const currentUsername = sessionStorage.getItem('userName');
                
                const requestBody = {
                    store_url: productUrl || null,
                    shopping_url: priceUrl || null,
                    main_keyword: keyword,
                    memo: memo || null,
                    change_log: {
                        changed_by: currentUsername || 'unknown',
                        changed_at: new Date().toISOString(),
                        action_type: 'UPDATE'
                    }
                };

                console.log('광고 수정 요청 데이터:', requestBody);

                const response = await fetch(`${API_BASE_URL}/advertisements/${adId}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(requestBody)
                });

                console.log('광고 수정 응답 상태:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    alert('광고가 수정되었습니다.');

                    // 폼 초기화
                    document.getElementById('ad-edit-product-url').value = '';
                    document.getElementById('ad-edit-price-url').value = '';
                    document.getElementById('ad-edit-keyword').value = '';
                    document.getElementById('ad-edit-memo').value = '';
                    adEditSidebar.removeAttribute('data-edit-ad-id');

                    adEditSidebar.classList.remove('active');

                    // 광고 목록 새로고침
                    await loadAdList();
                } else {
                    let errorData = {};
                    let errorText = '';
                    try {
                        errorText = await response.text();
                        console.error('광고 수정 실패 - 응답 텍스트:', errorText);
                        if (errorText) {
                            try {
                                errorData = JSON.parse(errorText);
                            } catch (parseError) {
                                errorData = { message: errorText || `서버 오류 (${response.status})` };
                            }
                        } else {
                            errorData = { message: `서버 오류 (${response.status})` };
                        }
                    } catch (e) {
                        console.error('에러 파싱 실패:', e);
                        errorData = { message: `서버 오류 (${response.status})` };
                    }

                    console.error('수정 실패 상세:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorData: errorData,
                        errorText: errorText
                    });

                    if (response.status === 422) {
                        let errorMessage = '입력 데이터가 올바르지 않습니다.\n\n';
                        if (errorData.detail) {
                            if (Array.isArray(errorData.detail)) {
                                errorMessage += errorData.detail.map(err => {
                                    if (typeof err === 'object' && err.loc && err.msg) {
                                        return `- ${err.loc.join('.')}: ${err.msg}`;
                                    }
                                    return `- ${JSON.stringify(err)}`;
                                }).join('\n');
                            } else if (typeof errorData.detail === 'string') {
                                errorMessage += errorData.detail;
                            } else {
                                errorMessage += JSON.stringify(errorData.detail, null, 2);
                            }
                        } else if (errorData.message) {
                            errorMessage += errorData.message;
                        } else {
                            errorMessage += JSON.stringify(errorData, null, 2);
                        }
                        alert(errorMessage);
                    } else {
                        alert(`수정 실패: ${errorData.message || errorData.detail || '서버 오류가 발생했습니다.'}`);
                    }
                }
            } catch (error) {
                console.error('API 호출 오류:', error);
                alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
            } finally {
                isSubmittingEdit = false;
                adEditSubmitBtn.disabled = false;
                adEditSubmitBtn.textContent = '수정';
            }
        });
    }

    // 초기 광고 목록 로드
    // CSV 다운로드 버튼
    const csvDownloadBtn = document.getElementById('csv-download-btn');
    if (csvDownloadBtn) {
        csvDownloadBtn.addEventListener('click', async () => {
            try {
                // 현재 검색 조건 가져오기
                const searchType = searchSelect ? searchSelect.value : 'all';
                const searchKeyword = searchInput ? searchInput.value.trim() : '';
                
                // CSV 다운로드 파라미터 구성
                const params = {};
                if (searchKeyword) {
                    params[searchType === 'all' ? 'keyword' : searchType] = searchKeyword;
                }
                
                const queryString = new URLSearchParams(params).toString();
                const url = `${API_BASE_URL}/advertisements/export${queryString ? '?' + queryString : ''}`;
                
                console.log('CSV 다운로드 요청:', url);
                
                // CSV 다운로드 요청
                const response = await fetch(url, {
                    method: 'GET',
                    headers: getAuthHeaders(),
                });
                
                if (!response.ok) {
                    let errorData = {};
                    let errorText = '';
                    try {
                        errorText = await response.text();
                        console.error('CSV 다운로드 실패 - 응답 텍스트:', errorText);
                        if (errorText) {
                            try {
                                errorData = JSON.parse(errorText);
                            } catch (parseError) {
                                errorData = { message: errorText || `서버 오류 (${response.status})` };
                            }
                        } else {
                            errorData = { message: `서버 오류 (${response.status})` };
                        }
                    } catch (e) {
                        console.error('에러 파싱 실패:', e);
                        errorData = { message: `서버 오류 (${response.status})` };
                    }

                    console.error('CSV 다운로드 실패 상세:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorData: errorData,
                        errorText: errorText,
                        url: url
                    });

                    if (response.status === 422) {
                        let errorMessage = '입력 데이터가 올바르지 않습니다.\n\n';
                        if (errorData.detail) {
                            if (Array.isArray(errorData.detail)) {
                                errorMessage += errorData.detail.map(err => {
                                    if (err.loc && err.msg) {
                                        return `${err.loc.join('.')}: ${err.msg}`;
                                    }
                                    return err.msg || JSON.stringify(err);
                                }).join('\n');
                            } else if (typeof errorData.detail === 'string') {
                                errorMessage += errorData.detail;
                            } else {
                                errorMessage += JSON.stringify(errorData.detail, null, 2);
                            }
                        } else {
                            errorMessage += errorData.message || '파라미터 형식이 올바르지 않습니다.';
                        }
                        alert(errorMessage);
                    } else {
                        alert(`CSV 다운로드 실패: ${errorData.message || errorData.detail || '서버 오류가 발생했습니다.'}`);
                    }
                    return;
                }
                
                // CSV 파일 다운로드
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                
                // 파일명 생성 (검색 조건 포함)
                const dateStr = new Date().toISOString().split('T')[0];
                const filename = `광고목록_${dateStr}.csv`;
                link.download = filename;
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);
                
                console.log('CSV 다운로드 완료:', filename);
            } catch (error) {
                console.error('CSV 다운로드 오류:', error);
                alert('CSV 다운로드 중 오류가 발생했습니다.');
            }
        });
    }

    loadAdList();
};
