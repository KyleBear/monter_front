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
                    <tr>
                        <td class="checkbox-col"><input type="checkbox" class="row-check"></td>
                        <td>1</td>
                        <td>test_user</td>
                        <td>****</td>
                        <td>광고주</td>
                        <td>본사</td>
                        <td>10</td>
                        <td>진행중</td>
                        <td>-</td>
                        <td><button style="padding: 2px 8px; font-size: 12px; cursor: pointer;">수정</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    initAccountEvents();
};

// API 기본 URL 설정
const API_BASE_URL = '/api';

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
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (response.ok) {
            const data = await response.json();
            renderAccountTable(data.accounts || []);
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
    if (!tbody) return;

    if (accounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">등록된 계정이 없습니다.</td></tr>';
        return;
    }

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

    // 체크박스 이벤트 다시 바인딩
    bindRowChecks();
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
            // 폼 초기화
            document.getElementById('reg-userid').value = '';
            document.getElementById('reg-password').value = '';
            document.getElementById('reg-role').value = 'advertiser';
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
                        memo: memo || null
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    alert('계정이 등록되었습니다.');
                    rightSidebar.classList.remove('active');
                    // 계정 목록 새로고침
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
            const searchType = searchSelect ? searchSelect.value : 'all';
            const searchKeyword = searchInput ? searchInput.value.trim() : '';
            
            const searchParams = {};
            if (searchKeyword) {
                searchParams[searchType === 'all' ? 'keyword' : searchType] = searchKeyword;
            }
            
            await loadAccountList(searchParams);
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

