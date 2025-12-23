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
                <button class="btn-delete" id="delete-accounts-btn">삭제</button>
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
                        <th>소속</th>
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
            if (Array.isArray(data)) {
                // 응답이 배열인 경우
                accounts = data;
                console.log('응답이 배열 형식입니다.');
            } else if (data.accounts && Array.isArray(data.accounts)) {
                // 응답이 { accounts: [...] } 형식인 경우
                accounts = data.accounts;
                console.log('응답이 객체 형식입니다 (accounts 키 사용).');
            } else if (data.data && Array.isArray(data.data)) {
                // 응답이 { data: [...] } 형식인 경우
                accounts = data.data;
                console.log('응답이 객체 형식입니다 (data 키 사용).');
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

    tbody.innerHTML = accounts.map((account, index) => {
        const roleMap = {
            'total': '총판사',
            'agency': '대행사',
            'advertiser': '광고주'
        };
        
        return `
            <tr data-account-id="${account.user_id || account.id}">
                <td class="checkbox-col"><input type="checkbox" class="row-check"></td>
                <td>${index + 1}</td>
                <td>${account.username || account.userid || '-'}</td>
                <td>****</td>
                <td>${roleMap[account.role] || account.role || '-'}</td>
                <td>${account.affiliation || '-'}</td>
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

    // 개별 선택 체크박스
    const bindRowChecks = () => {
        const rowChecksCurrent = document.querySelectorAll('.row-check');
        rowChecksCurrent.forEach(check => {
            check.removeEventListener('change', handleRowCheckChange);
            check.addEventListener('change', handleRowCheckChange);
        });
    };

    const handleRowCheckChange = () => {
        updateSelectCount();
        const rowChecksCurrent = document.querySelectorAll('.row-check');
        const allChecked = Array.from(rowChecksCurrent).every(c => c.checked);
        if (selectAll) selectAll.checked = allChecked && rowChecksCurrent.length > 0;
    };

    const updateSelectCount = () => {
        const rowChecksCurrent = document.querySelectorAll('.row-check');
        const checkedCount = Array.from(rowChecksCurrent).filter(c => c.checked).length;
        if (selectCountSpan) selectCountSpan.textContent = checkedCount;
    };

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
                    // 총판사: 총판사, 대행사, 광고주
                    allowedRoles = [
                        { value: 'total', label: '총판사' },
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
            
            // 현재 사용자의 소속을 기본값으로 설정
            const currentUserAffiliation = sessionStorage.getItem('userAffiliation');
            const affiliationInput = document.getElementById('reg-affiliation');
            if (affiliationInput) {
                affiliationInput.value = currentUserAffiliation || '';
            }
            
            // 폼 초기화
            document.getElementById('reg-userid').value = '';
            document.getElementById('reg-password').value = '';
            document.getElementById('reg-memo').value = '';
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
    if (regSubmitBtn) {
        regSubmitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const userid = document.getElementById('reg-userid').value.trim();
            const password = document.getElementById('reg-password').value;
            const role = document.getElementById('reg-role').value;
            const affiliation = document.getElementById('reg-affiliation').value.trim();
            const memo = document.getElementById('reg-memo').value.trim();
            
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
            if (!affiliation) {
                alert('소속을 입력해주세요.');
                return;
            }
            
            // 등록 버튼 비활성화
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
                    // 소속은 현재 사용자의 소속으로 초기화
                    const currentUserAffiliation = sessionStorage.getItem('userAffiliation');
                    document.getElementById('reg-affiliation').value = currentUserAffiliation || '';
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
                regSubmitBtn.disabled = false;
                regSubmitBtn.textContent = '등록';
            }
        });
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
                return row ? row.getAttribute('data-account-id') : null;
            }).filter(id => id !== null);
            
            if (accountIds.length === 0) {
                alert('삭제할 계정을 선택해주세요.');
                return;
            }
            
            if (!confirm(`선택한 ${accountIds.length}개의 계정을 삭제하시겠습니까?`)) {
                return;
            }
            
            try {
                // 여러 계정 삭제 (배열로 전송)
                const response = await fetch(`${API_BASE_URL}/accounts`, {
                    method: 'DELETE',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        account_ids: accountIds
                    })
                });
                
                if (response.ok) {
                    alert('선택한 계정이 삭제되었습니다.');
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
                    
                    console.error('삭제 실패:', response.status, errorData);
                    alert(`삭제 실패: ${errorData.message || errorData.detail || '서버 오류가 발생했습니다.'}`);
                }
            } catch (error) {
                console.error('삭제 API 호출 오류:', error);
                alert('서버 연결에 실패했습니다.');
            }
        });
    }

    // 초기 계정 목록 로드
    loadAccountList();
};

