// API 기본 URL 설정
const API_BASE_URL = '/api';

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
    if (!tbody) return;

    if (ads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="14" style="text-align: center; padding: 20px;">등록된 광고가 없습니다.</td></tr>';
        return;
    }

    const statusMap = {
        'normal': { text: '정상', color: '#28a745' },
        'error': { text: '오류', color: '#dc3545' },
        'pending': { text: '대기', color: '#ffc107' },
        'ending': { text: '종료예정', color: '#fd7e14' },
        'ended': { text: '종료', color: '#6c757d' }
    };

    tbody.innerHTML = ads.map((ad, index) => {
        const status = statusMap[ad.status] || { text: ad.status, color: '#000' };
        
        return `
            <tr data-ad-id="${ad.ad_id || ad.id}">
                <td class="checkbox-col"><input type="checkbox" class="row-check"></td>
                <td>${index + 1}</td>
                <td>${ad.username || ad.userid || '-'}</td>
                <td><span style="color: ${status.color};">${status.text}</span></td>
                <td>${ad.main_keyword || '-'}</td>
                <td>${ad.price_comparison ? 'Y' : 'N'}</td>
                <td>${ad.plus ? 'Y' : 'N'}</td>
                <td>${ad.product_name || '-'}</td>
                <td>${ad.product_mid || '-'}</td>
                <td>${ad.price_comparison_mid || '-'}</td>
                <td>${ad.work_days || 0}</td>
                <td>${ad.start_date || '-'}</td>
                <td>${ad.end_date || '-'}</td>
                <td><button class="btn-edit-row" data-ad-id="${ad.ad_id || ad.id}">수정</button></td>
            </tr>
        `;
    }).join('');

    // 체크박스 이벤트 다시 바인딩
    bindRowChecks();
};

// 광고 목록 로드
const loadAdList = async (searchParams = {}) => {
    try {
        const queryString = new URLSearchParams(searchParams).toString();
        const url = `${API_BASE_URL}/advertisements${queryString ? '?' + queryString : ''}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            renderAdTable(data.advertisements || []);
            updateAdStatus(data.stats || {});
        } else {
            console.error('광고 목록 로드 실패:', response.status);
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
    }
};

export const initAdPage = (container) => {
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
                        <th>가격비교</th>
                        <th>플러스</th>
                        <th>상품명</th>
                        <th>상품MID</th>
                        <th>가격비교MID</th>
                        <th>작업일수</th>
                        <th>시작일</th>
                        <th>종료일</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody id="ad-list">
                    <tr>
                        <td class="checkbox-col"><input type="checkbox" class="row-check"></td>
                        <td>1</td>
                        <td>user_01</td>
                        <td><span style="color: #28a745;">정상</span></td>
                        <td>나이키 운동화</td>
                        <td>Y</td>
                        <td>N</td>
                        <td>에어포스 1</td>
                        <td>12345678</td>
                        <td>87654321</td>
                        <td>30</td>
                        <td>2023-12-01</td>
                        <td>2023-12-31</td>
                        <td><button class="btn-edit-row">수정</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    initAdEvents();
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
    if (extendBtn) {
        extendBtn.addEventListener('click', async () => {
            const rowChecks = document.querySelectorAll('.row-check:checked');
            if (rowChecks.length === 0) {
                alert('연장할 광고를 선택해주세요.');
                return;
            }
            
            const adIds = Array.from(rowChecks).map(check => {
                const row = check.closest('tr');
                return row ? row.getAttribute('data-ad-id') : null;
            }).filter(id => id !== null);
            
            if (adIds.length === 0) {
                alert('연장할 광고를 선택해주세요.');
                return;
            }
            
            if (!confirm(`선택한 ${adIds.length}개의 광고를 연장하시겠습니까?`)) {
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/advertisements/extend`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ad_ids: adIds
                    })
                });
                
                if (response.ok) {
                    alert('선택한 광고가 연장되었습니다.');
                    await loadAdList();
                } else {
                    const error = await response.json().catch(() => ({ message: '연장 실패' }));
                    alert(`연장 실패: ${error.message || '서버 오류가 발생했습니다.'}`);
                }
            } catch (error) {
                console.error('연장 API 호출 오류:', error);
                alert('서버 연결에 실패했습니다.');
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
                    headers: {
                        'Content-Type': 'application/json',
                    },
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
                // 개별 수정 기능은 추후 구현
                alert(`광고 ID ${adId} 수정 기능은 준비 중입니다.`);
            }
        }
    });

    // 초기 광고 목록 로드
    loadAdList();
};
