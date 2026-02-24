export const initAccountPage = (container) => {
    container.innerHTML = `
        <div class="account-info">
            <strong>계정관리</strong><br>
            계정의 정보를 확인하고, 추가·수정·삭제 등의 관리 작업을 할 수 있습니다.
        </div>

        <div class="account-status">
            <div class="status-card">
                <h4>전체</h4>
                <div class="count" id="total-count">1</div>
            </div>
            <div class="status-card">
                <h4>총판사</h4>
                <div class="count">0</div>
            </div>
            <div class="status-card">
                <h4>대행사</h4>
                <div class="count">0</div>
            </div>
            <div class="status-card">
                <h4>광고주</h4>
                <div class="count">1</div>
            </div>
        </div>

        <div class="search-section">
            <div class="search-bar">
                <select class="search-select">
                    <option value="all">전체</option>
                    <option value="userid">아이디</option>
                    <option value="group">소속</option>
                    <option value="memo">메모</option>
                </select>
                <input type="text" class="search-input" placeholder="검색어를 입력해주세요.">
                <button class="search-btn">🔍</button>
            </div>
        </div>

        <div class="table-status-bar">
            <div class="selected-count"><span id="select-count">0</span>개 선택됨</div>
            <div class="table-actions">
                <button class="btn-delete" id="delete-accounts-btn" style="display: none;">삭제</button>
                <button class="btn-register" id="open-register-btn">등록</button>
            </div>
        </div>

        <div class="table-container">
            <table id="account-table">
                <thead>
                    <tr>
                        <th class="checkbox-col"><input type="checkbox" id="select-all"></th>
                        <th>No</th>
                        <th>아이디</th>
                        <th>비밀번호</th>
                        <th>권한</th>
                        <th style="display: none;">소속</th>
                        <th>생성계정</th>
                        <th>수량</th>
                        <th>광고</th>
                        <th>메모</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody id="account-list">
                    <!-- 계정 목록이 여기에 동적으로 로드됩니다 -->
                </tbody>
            </table>
        </div>
    `;

    // 권한에 따른 삭제 버튼 제어
    const userRole = sessionStorage.getItem('userRole');
    const deleteBtn = document.getElementById('delete-accounts-btn');
    if (deleteBtn) {
        // 관리자 권한일 때만 삭제 버튼 표시
        if (userRole === 'admin') {
            deleteBtn.style.display = 'inline-block';
        } else {
            deleteBtn.style.display = 'none';
        }
    }

    initAccountEvents();
};

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

// 계정 목록 로드
const loadAccountList = async (searchParams = {}) => {
    try {
        const queryString = new URLSearchParams(searchParams).toString();
        const url = `${API_BASE_URL}/accounts${queryString ? '?' + queryString : ''}`;
        
        console.log('계정 목록 API 호출:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('계정 목록 API 응답 (전체):', JSON.stringify(data, null, 2));
            console.log('계정 목록 API 응답 (객체):', data);
            console.log('응답 데이터 키:', Object.keys(data));
            console.log('data.accounts:', data.accounts);
            console.log('data.accounts 타입:', typeof data.accounts);
            console.log('data.accounts 길이:', data.accounts?.length);
            
            // 다양한 응답 형식 지원
            let accounts = [];
            if (data.data && data.data.accounts && Array.isArray(data.data.accounts)) {
                // 응답이 { success: true, data: { accounts: [...] }, stats: {...} } 형식인 경우
                accounts = data.data.accounts;
                console.log('응답이 객체 형식입니다 (data.data.accounts 키 사용).');
            } else if (data.accounts && Array.isArray(data.accounts)) {
                // 응답이 { accounts: [...] } 형식인 경우 (다른 API와의 호환성)
                accounts = data.accounts;
                console.log('응답이 객체 형식입니다 (accounts 키 사용).');
            } else if (Array.isArray(data)) {
                // 응답이 배열인 경우 (호환성을 위해 유지)
                accounts = data;
                console.log('응답이 배열 형식입니다.');
            } else {
                console.warn('예상하지 못한 응답 형식:', data);
                accounts = [];
            }
            
            console.log('최종 계정 배열:', accounts);
            console.log('최종 계정 개수:', accounts.length);
            
            renderAccountTable(accounts);
            updateAccountStatus(data.stats || {});
        } else {
            // 더 자세한 에러 정보 출력
            let errorData = {};
            try {
                const errorText = await response.text();
                errorData = errorText ? JSON.parse(errorText) : {};
            } catch (e) {
                errorData = { message: `서버 오류 (${response.status})` };
            }
            
            console.error('계정 목록 로드 실패:', response.status, errorData);
            
            // 500 에러인 경우 사용자에게 알림
            if (response.status === 500) {
                alert(`계정 목록을 불러올 수 없습니다.\n오류: ${errorData.message || errorData.detail || '서버 내부 오류'}`);
            }
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
};

// 계정 상태 통계 업데이트
const updateAccountStatus = (stats) => {
    const totalCount = document.getElementById('total-count');
    const statusCards = document.querySelectorAll('.account-status .status-card .count');
    
    if (totalCount) {
        totalCount.textContent = stats.total || 0;
    }
    
    if (statusCards.length >= 4) {
        statusCards[0].textContent = stats.total || 0;      // 전체
        statusCards[1].textContent = stats.distributor || 0; // 총판사
        statusCards[2].textContent = stats.agency || 0;      // 대행사
        statusCards[3].textContent = stats.advertiser || 0; // 광고주
    }
};

// 계정 테이블 렌더링
const renderAccountTable = (accounts) => {
    const tbody = document.getElementById('account-list');
    console.log('=== renderAccountTable 호출 ===');
    console.log('accounts 파라미터:', accounts);
    console.log('accounts 타입:', typeof accounts);
    console.log('accounts가 배열인가?', Array.isArray(accounts));
    console.log('accounts 길이:', accounts?.length);
    console.log('tbody 요소:', tbody);
    
    if (!tbody) {
        console.error('❌ account-list tbody를 찾을 수 없습니다.');
        console.error('현재 DOM에 account-list ID를 가진 요소가 있는지 확인하세요.');
        return;
    }

    if (!accounts) {
        console.warn('⚠️ accounts가 null 또는 undefined입니다.');
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">계정 데이터를 불러올 수 없습니다.</td></tr>';
        return;
    }
    
    if (!Array.isArray(accounts)) {
        console.error('❌ accounts가 배열이 아닙니다. 타입:', typeof accounts);
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">계정 데이터 형식이 올바르지 않습니다.</td></tr>';
        return;
    }

    if (accounts.length === 0) {
        console.log('ℹ️ 계정 데이터가 없습니다 (빈 배열).');
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">등록된 계정이 없습니다.</td></tr>';
        return;
    }
    
    console.log('✅ 계정 테이블 렌더링 시작, 계정 수:', accounts.length);
    console.log('첫 번째 계정 데이터 예시:', accounts[0]);

    // 현재 사용자 권한 확인
    const userRole = sessionStorage.getItem('userRole');
    const isAdmin = userRole === 'admin';

    tbody.innerHTML = accounts.map((account, index) => {
        const roleMap = {
            'total': '총판사',
            'agency': '대행사',
            'advertiser': '광고주'
        };
        
        // 계정 데이터를 JSON으로 저장 (수정 시 사용)
        const accountDataJson = JSON.stringify({
            user_id: account.user_id || account.id,
            username: account.username || account.userid || '',
            role: account.role || '',
            affiliation: account.affiliation || '',
            memo: account.memo || ''
        });
        
        // 관리자 권한일 때는 실제 비밀번호 표시, 그 외에는 **** 표시
        const passwordDisplay = isAdmin ? (account.password || '-') : '****';
        
        return `
            <tr data-account-id="${account.user_id || account.id}" data-account-data='${accountDataJson}'>
                <td class="checkbox-col"><input type="checkbox" class="row-check"></td>
                <td>${index + 1}</td>
                <td>${account.username || account.userid || '-'}</td>
                <td>${passwordDisplay}</td>
                <td>${roleMap[account.role] || account.role || '-'}</td>
                <td style="display: none;">${account.affiliation || '-'}</td>
                <td>${account.parent_username || '-'}</td>                
                <td>${account.ad_count || 0}</td>
                <td>${account.active_ad_count > 0 ? '진행중' : '-'}</td>
                <td>${account.memo || '-'}</td>
                <td><button class="btn-edit" data-account-id="${account.user_id || account.id}" style="padding: 2px 8px; font-size: 12px; cursor: pointer;">수정</button></td>
            </tr>
        `;
    }).join('');

    console.log('✅ 테이블 HTML 생성 완료');
    console.log('생성된 HTML 길이:', tbody.innerHTML.length);
    console.log('tbody.innerHTML (처음 500자):', tbody.innerHTML.substring(0, 500));

    // 체크박스 이벤트 다시 바인딩
    bindRowChecks();
    
    console.log('✅ 계정 테이블 렌더링 완료');
};

// 체크박스 선택 개수 업데이트 함수 (전역)
const updateSelectCount = () => {
    const selectCountSpan = document.getElementById('select-count');
    const rowChecksCurrent = document.querySelectorAll('.row-check');
    const checkedCount = Array.from(rowChecksCurrent).filter(c => c.checked).length;
    if (selectCountSpan) selectCountSpan.textContent = checkedCount;
};

// 체크박스 변경 핸들러 (전역)
const handleRowCheckChange = () => {
    updateSelectCount();
    const selectAll = document.getElementById('select-all');
    const rowChecksCurrent = document.querySelectorAll('.row-check');
    const allChecked = Array.from(rowChecksCurrent).every(c => c.checked);
    if (selectAll) selectAll.checked = allChecked && rowChecksCurrent.length > 0;
};

// 체크박스 이벤트 바인딩 함수 (전역)
const bindRowChecks = () => {
    const rowChecksCurrent = document.querySelectorAll('.row-check');
    rowChecksCurrent.forEach(check => {
        check.removeEventListener('change', handleRowCheckChange);
        check.addEventListener('change', handleRowCheckChange);
    });
};

const initAccountEvents = () => {
    const selectAll = document.getElementById('select-all');
    const rowChecks = document.querySelectorAll('.row-check');
    const selectCountSpan = document.getElementById('select-count');
    const openRegBtn = document.getElementById('open-register-btn');
    const rightSidebar = document.getElementById('right-sidebar');
    const closeRegBtn = document.getElementById('reg-close-btn');
    const deleteBtn = document.getElementById('delete-accounts-btn');
    const regSubmitBtn = document.getElementById('reg-submit-btn');
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('.search-input');
    const searchSelect = document.querySelector('.search-select');

    // 현재 검색 조건 저장 (전역 변수)
    let currentSearchParams = {};

    // 검색 파라미터 생성 함수
    const getSearchParams = () => {
        const searchType = searchSelect ? searchSelect.value : 'all';
        const searchKeyword = searchInput ? searchInput.value.trim() : '';
        
        const params = {};
        if (searchKeyword) {
            if (searchType === 'userid') {
                // 아이디 검색은 username으로 전송
                params.username = searchKeyword;
            } else if (searchType === 'all') {
                params.keyword = searchKeyword;
            } else if (searchType === 'group') {
                params.affiliation = searchKeyword;
            } else if (searchType === 'memo') {
                params.memo = searchKeyword;
            }
        }
        return params;
    };

    // 저장된 검색 조건으로 목록 로드
    const loadWithCurrentSearch = async () => {
        await loadAccountList(currentSearchParams);
    };

    // 전체 선택 체크박스
    if (selectAll) {
        selectAll.addEventListener('change', () => {
            const rowChecksCurrent = document.querySelectorAll('.row-check');
            rowChecksCurrent.forEach(check => {
                check.checked = selectAll.checked;
            });
            updateSelectCount();
        });
    }

    // 개별 선택 체크박스 이벤트 바인딩 (전역 함수 사용)
    bindRowChecks();

    // 등록 사이드바 열기
    if (openRegBtn) {
        openRegBtn.addEventListener('click', () => {
            // 현재 사용자 권한 가져오기
            const currentUserRole = sessionStorage.getItem('userRole');
            const roleSelect = document.getElementById('reg-role');
            
            // 권한에 따라 등록 가능한 옵션 설정
            if (roleSelect) {
                // 기존 옵션 모두 제거
                roleSelect.innerHTML = '';
                
                let allowedRoles = [];
                
                if (currentUserRole === 'admin') {
                    // 관리자: 모두 가능
                    allowedRoles = [
                        { value: 'total', label: '총판사' },
                        { value: 'agency', label: '대행사' },
                        { value: 'advertiser', label: '광고주' }
                    ];
                } else if (currentUserRole === 'total') {
                    // 총판사: 대행사, 광고주만 등록 가능 (총판사는 등록 불가)
                    allowedRoles = [
                        { value: 'agency', label: '대행사' },
                        { value: 'advertiser', label: '광고주' }
                    ];
                } else if (currentUserRole === 'agency') {
                    // 대행사: 대행사, 광고주
                    allowedRoles = [
                        { value: 'agency', label: '대행사' },
                        { value: 'advertiser', label: '광고주' }
                    ];
                } else if (currentUserRole === 'advertiser') {
                    // 광고주: 광고주만
                    allowedRoles = [
                        { value: 'advertiser', label: '광고주' }
                    ];
                } else {
                    // 권한이 없거나 알 수 없는 경우: 광고주만 (기본값)
                    allowedRoles = [
                        { value: 'advertiser', label: '광고주' }
                    ];
                }
                
                // 옵션 추가
                allowedRoles.forEach(role => {
                    const option = document.createElement('option');
                    option.value = role.value;
                    option.textContent = role.label;
                    roleSelect.appendChild(option);
                });
                
                // 첫 번째 옵션을 기본값으로 설정
                if (allowedRoles.length > 0) {
                    roleSelect.value = allowedRoles[0].value;
                }
            }
            
            // 폼 초기화
            document.getElementById('reg-userid').value = '';
            document.getElementById('reg-password').value = '';
            document.getElementById('reg-memo').value = '';
            
            // 수정 사이드바가 열려있으면 닫기
            const editSidebar = document.getElementById('edit-sidebar');
            if (editSidebar && editSidebar.classList.contains('active')) {
                editSidebar.classList.remove('active');
            }
            
            rightSidebar.classList.add('active');
        });
    }

    // 등록 사이드바 닫기
    if (closeRegBtn) {
        closeRegBtn.addEventListener('click', () => {
            rightSidebar.classList.remove('active');
        });
    }

    // 계정 등록 폼 제출
    let isSubmittingAccount = false; // 처리 중 플래그
    
    if (regSubmitBtn) {
        regSubmitBtn.onclick = null;

        // regSubmitBtn.addEventListener('click', async (e) => {
        regSubmitBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation(); // 이벤트 버블링 방지
            
            // 이미 처리 중이면 무시
            if (isSubmittingAccount) {
                console.log('계정 등록이 이미 처리 중입니다.');
                return;
            }
            
            const userid = document.getElementById('reg-userid').value.trim();
            const password = document.getElementById('reg-password').value;
            const role = document.getElementById('reg-role').value;
            const memo = document.getElementById('reg-memo').value.trim();
            
            // 소속은 아이디로 자동 설정
            const affiliation = userid;
            
            // 유효성 검사
            if (!userid) {
                alert('아이디를 입력해주세요.');
                return;
            }
            if (!password) {
                alert('비밀번호를 입력해주세요.');
                return;
            }
            if (password.length < 4) {
                alert('비밀번호는 4자 이상 입력해주세요.');
                return;
            }
            
            // 처리 중 플래그 설정 및 버튼 비활성화
            isSubmittingAccount = true;
            regSubmitBtn.disabled = true;
            regSubmitBtn.textContent = '등록 중...';
            
            try {
                const response = await fetch(`${API_BASE_URL}/accounts`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        username: userid,
                        password: password,
                        role: role,
                        affiliation: affiliation,  // 입력한 소속 사용
                        memo: memo || null
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    alert('계정이 등록되었습니다.');
                    
                    // 폼 초기화
                    document.getElementById('reg-userid').value = '';
                    document.getElementById('reg-password').value = '';
                    // 권한 옵션은 등록 사이드바를 열 때 다시 설정되므로 여기서는 첫 번째 옵션으로 설정
                    const roleSelect = document.getElementById('reg-role');
                    if (roleSelect && roleSelect.options.length > 0) {
                        roleSelect.value = roleSelect.options[0].value;
                    }
                    document.getElementById('reg-memo').value = '';
                    
                    rightSidebar.classList.remove('active');
                    
                    // 계정 목록 새로고침 (검색 조건 없이 전체 목록)
                    await loadAccountList();
                } else {
                    // 더 자세한 에러 정보 출력
                    let errorData = {};
                    try {
                        const errorText = await response.text();
                        errorData = errorText ? JSON.parse(errorText) : {};
                    } catch (e) {
                        errorData = { message: `서버 오류 (${response.status})` };
                    }
                    
                    console.error('등록 실패:', response.status, errorData);
                    alert(`등록 실패: ${errorData.message || errorData.detail || '서버 오류가 발생했습니다.'}`);
                }
            } catch (error) {
                console.error('API 호출 오류:', error);
                alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
            } finally {
                // 처리 중 플래그 해제 및 버튼 활성화
                isSubmittingAccount = false;
                regSubmitBtn.disabled = false;
                regSubmitBtn.textContent = '등록';
            }
        };
    }

    // 검색 기능
    if (searchBtn) {
        const performSearch = async () => {
            // 현재 검색 조건 저장
            currentSearchParams = getSearchParams();
            await loadAccountList(currentSearchParams);
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

    // 삭제 버튼
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            const rowChecksCurrent = document.querySelectorAll('.row-check:checked');
            if (rowChecksCurrent.length === 0) {
                alert('삭제할 계정을 선택해주세요.');
                return;
            }
            
            const accountIds = Array.from(rowChecksCurrent).map(check => {
                const row = check.closest('tr');
                const id = row ? row.getAttribute('data-account-id') : null;
                // 문자열을 정수로 변환
                return id ? parseInt(id, 10) : null;
            }).filter(id => id !== null && !isNaN(id));
            
            if (accountIds.length === 0) {
                alert('삭제할 계정을 선택해주세요.');
                return;
            }
            
            if (!confirm(`선택한 ${accountIds.length}개의 계정을 삭제하시겠습니까?`)) {
                return;
            }
            
            try {
                console.log('삭제 요청 account_ids:', accountIds);
                console.log('삭제 요청 URL:', `${API_BASE_URL}/accounts`);
                
                const requestBody = {
                    account_ids: accountIds
                };
                console.log('삭제 요청 본문:', JSON.stringify(requestBody));
                console.log('삭제 요청 헤더:', getAuthHeaders());
                
                // 여러 계정 삭제 (정수 배열로 전송)
                const response = await fetch(`${API_BASE_URL}/accounts`, {
                    method: 'DELETE',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(requestBody)
                });
                
                console.log('삭제 응답 상태:', response.status);
                console.log('삭제 응답 상태 텍스트:', response.statusText);
                
                // 응답 본문을 먼저 텍스트로 읽기
                const responseText = await response.text();
                console.log('삭제 응답 본문 (원본):', responseText);
                
                if (response.ok) {
                    let data;
                    try {
                        data = JSON.parse(responseText);
                        console.log('삭제 성공 데이터:', data);
                        console.log('삭제된 개수:', data.deleted_count);
                    } catch (e) {
                        console.error('응답 파싱 실패:', e);
                        console.error('응답 텍스트:', responseText);
                        data = { message: responseText };
                    }
                    
                    alert(`선택한 계정이 삭제되었습니다. (삭제된 개수: ${data.deleted_count || accountIds.length})`);
                    
                    // 검색 조건 초기화
                    if (searchInput) {
                        searchInput.value = '';
                    }
                    if (searchSelect) {
                        searchSelect.value = 'all';
                    }
                    currentSearchParams = {};
                    
                    // 계정 목록 새로고침 (검색 조건 없이 전체 목록)
                    await loadAccountList({});
                } else {
                    // 더 자세한 에러 정보 출력
                    let errorData = {};
                    try {
                        if (responseText) {
                            try {
                                errorData = JSON.parse(responseText);
                            } catch (parseError) {
                                errorData = { message: responseText };
                            }
                        }
                    } catch (e) {
                        errorData = { message: `서버 오류 (${response.status})` };
                    }
                    
                    console.error('삭제 실패 상세:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorData: errorData,
                        responseText: responseText
                    });
                    
                    // 에러 메시지 추출
                    let errorMessage = '서버 오류가 발생했습니다.';
                    if (errorData.detail) {
                        if (Array.isArray(errorData.detail)) {
                            errorMessage = errorData.detail.map(err => {
                                if (typeof err === 'object' && err.loc && err.msg) {
                                    return `- ${err.loc.join('.')}: ${err.msg}`;
                                }
                                return `- ${JSON.stringify(err)}`;
                            }).join('\n');
                        } else if (typeof errorData.detail === 'string') {
                            errorMessage = errorData.detail;
                        } else {
                            errorMessage = JSON.stringify(errorData.detail, null, 2);
                        }
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                    
                    alert(`삭제 실패 (${response.status}): ${errorMessage}`);
                }
            } catch (error) {
                console.error('삭제 API 호출 오류:', error);
                alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
            }
        });
    }

    // 개별 수정 버튼 이벤트 (이벤트 위임 사용)
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-edit')) {
            const accountId = e.target.getAttribute('data-account-id');
            if (!accountId) return;
            
            // 테이블 행에서 계정 데이터 가져오기
            const row = e.target.closest('tr');
            if (!row) return;
            
            const accountDataStr = row.getAttribute('data-account-data');
            if (!accountDataStr) {
                alert('계정 정보를 불러올 수 없습니다.');
                return;
            }
            
            let accountData;
            try {
                accountData = JSON.parse(accountDataStr);
            } catch (error) {
                console.error('계정 데이터 파싱 오류:', error);
                alert('계정 정보를 불러올 수 없습니다.');
                return;
            }
            
            // 수정 사이드바 열기 및 기존 정보 로드
            const editSidebar = document.getElementById('edit-sidebar');
            if (!editSidebar) {
                alert('수정 사이드바를 찾을 수 없습니다.');
                return;
            }
            
            // 기존 계정 정보를 폼에 채우기
            document.getElementById('edit-user-id').value = accountData.user_id;
            document.getElementById('edit-userid').value = accountData.username || '';
            document.getElementById('edit-password').value = ''; // 비밀번호는 비워둠
            document.getElementById('edit-role').value = accountData.role || '';
            // 소속은 아이디로 자동 설정되므로 입력 필드에 값을 설정하지 않음
            document.getElementById('edit-memo').value = accountData.memo || '';
            
            // 등록 사이드바가 열려있으면 닫기
            const rightSidebar = document.getElementById('right-sidebar');
            if (rightSidebar && rightSidebar.classList.contains('active')) {
                rightSidebar.classList.remove('active');
            }
            
            // 수정 사이드바 열기
            editSidebar.classList.add('active');
        }
    });
    
    // 수정 사이드바 닫기
    const editCloseBtn = document.getElementById('edit-close-btn');
    if (editCloseBtn) {
        editCloseBtn.addEventListener('click', () => {
            const editSidebar = document.getElementById('edit-sidebar');
            if (editSidebar) {
                editSidebar.classList.remove('active');
            }
        });
    }
    
    // 계정 수정 폼 제출
    let isSubmittingEdit = false; // 처리 중 플래그
    const editSubmitBtn = document.getElementById('edit-submit-btn');
    
    if (editSubmitBtn) {
        editSubmitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation(); // 이벤트 버블링 방지
            
            // 이미 처리 중이면 무시
            if (isSubmittingEdit) {
                console.log('계정 수정이 이미 처리 중입니다.');
                return;
            }
            
            const userId = document.getElementById('edit-user-id').value;
            const password = document.getElementById('edit-password').value;
            // 권한은 수정 불가 (disabled 필드이므로 요청에 포함하지 않음)
            const userid = document.getElementById('edit-userid').value.trim();
            const memo = document.getElementById('edit-memo').value.trim();
            
            // 소속은 아이디로 자동 설정
            const affiliation = userid;
            
            // 유효성 검사
            if (!userId) {
                alert('계정 ID를 찾을 수 없습니다.');
                return;
            }
            if (password && password.length < 4) {
                alert('비밀번호는 4자 이상 입력해주세요.');
                return;
            }
            
            // 처리 중 플래그 설정 및 버튼 비활성화
            isSubmittingEdit = true;
            editSubmitBtn.disabled = true;
            editSubmitBtn.textContent = '수정 중...';
            
            try {
                // 수정 요청 본문 구성 (비밀번호는 입력된 경우에만 포함, 권한은 제외)
                const requestBody = {
                    affiliation: affiliation,
                    memo: memo || null
                };
                
                // 비밀번호가 입력된 경우에만 추가
                if (password && password.trim() !== '') {
                    requestBody.password = password;
                }
                
                console.log('계정 수정 요청:', `PUT ${API_BASE_URL}/accounts/${userId}`, requestBody);
                
                const response = await fetch(`${API_BASE_URL}/accounts/${userId}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(requestBody)
                });
                
                console.log('계정 수정 응답 상태:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('계정 수정 성공:', data);
                    alert('계정이 수정되었습니다.');
                    
                    // 폼 초기화
                    document.getElementById('edit-user-id').value = '';
                    document.getElementById('edit-userid').value = '';
                    document.getElementById('edit-password').value = '';
                    document.getElementById('edit-role').value = '';
                    document.getElementById('edit-memo').value = '';
                    
                    // 수정 사이드바 닫기
                    const editSidebar = document.getElementById('edit-sidebar');
                    if (editSidebar) {
                        editSidebar.classList.remove('active');
                    }
                    
                    // 계정 목록 새로고침 (검색 조건 없이 전체 목록)
                    await loadAccountList();
                } else {
                    // 더 자세한 에러 정보 출력
                    let errorData = {};
                    let errorText = '';
                    try {
                        errorText = await response.text();
                        console.error('수정 실패 - 응답 텍스트:', errorText);
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
                    
                    console.error('수정 실패 상세:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorData: errorData
                    });
                    
                    // 에러 메시지 추출
                    let errorMessage = '서버 오류가 발생했습니다.';
                    if (errorData.detail) {
                        if (Array.isArray(errorData.detail)) {
                            errorMessage = errorData.detail.map(err => {
                                if (typeof err === 'object' && err.loc && err.msg) {
                                    return `- ${err.loc.join('.')}: ${err.msg}`;
                                }
                                return `- ${JSON.stringify(err)}`;
                            }).join('\n');
                        } else if (typeof errorData.detail === 'string') {
                            errorMessage = errorData.detail;
                        } else {
                            errorMessage = JSON.stringify(errorData.detail, null, 2);
                        }
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                    
                    alert(`수정 실패: ${errorMessage}`);
                }
            } catch (error) {
                console.error('API 호출 오류:', error);
                alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
            } finally {
                // 처리 중 플래그 해제 및 버튼 활성화
                isSubmittingEdit = false;
                editSubmitBtn.disabled = false;
                editSubmitBtn.textContent = '수정';
            }
        });
    }

    // 초기 계정 목록 로드
    loadAccountList();
};

