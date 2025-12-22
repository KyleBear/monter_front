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

const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const initSettlementPage = (container) => {
    const today = new Date();
    const todayStr = formatDate(today);
    
    container.innerHTML = `
        <div class="account-info">
            <strong>정산로그</strong><br>
            정산과 관련된 상세 정보를 조회할 수 있습니다.
        </div>

        <div class="search-result-section">
            <div class="result-header">
                <h4>검색 결과</h4>
                <div class="date-range-display" id="date-range-display">${todayStr} ~ ${todayStr}</div>
            </div>
            <div class="result-stats">
                <div class="stat-item">
                    <span class="stat-label">조회 기간</span>
                    <span class="stat-value" id="period-days">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">발주일수</span>
                    <span class="stat-value" id="order-days">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">연장 일수</span>
                    <span class="stat-value" id="extend-days">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">환불 일수</span>
                    <span class="stat-value" id="refund-days">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">일수 합계</span>
                    <span class="stat-value" id="total-days">0</span>
                </div>
            </div>
        </div>

        <div class="search-section">
            <div class="search-bar">
                <select class="search-select">
                    <option value="all">전체</option>
                </select>
                <input type="text" class="search-input" placeholder="검색어를 입력해주세요.">
                <button class="search-btn">🔍</button>
            </div>
        </div>

        <div class="date-filter-section">
            <div class="date-range-picker">
                <input type="date" id="start-date" value="${todayStr}">
                <span>~</span>
                <input type="date" id="end-date" value="${todayStr}">
            </div>
            <div class="quick-date-buttons">
                <button class="quick-date-btn" data-days="0">오늘</button>
                <button class="quick-date-btn" data-days="1">1일전</button>
                <button class="quick-date-btn" data-days="30">1개월전</button>
                <button class="quick-date-btn" data-days="90">3개월전</button>
            </div>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>구분</th>
                        <th>대행사</th>
                        <th>광고주</th>
                        <th>수량</th>
                        <th>기간</th>
                        <th>일수합계</th>
                        <th>생성일시</th>
                        <th>시작일</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody id="settlement-list">
                    <!-- 정산 로그 목록이 여기에 동적으로 로드됩니다 -->
                </tbody>
            </table>
        </div>

        <div class="pagination-section">
            <div class="pagination-controls">
                <button class="pagination-btn" id="first-page"><<</button>
                <button class="pagination-btn" id="prev-page"><</button>
                <span class="page-info">페이지 <span id="current-page">1</span> / <span id="total-pages">1</span></span>
                <button class="pagination-btn" id="next-page">></button>
                <button class="pagination-btn" id="last-page">>></button>
            </div>
            <div class="pagination-right">
                <div class="goto-page">
                    <label>Go to page</label>
                    <input type="number" id="goto-page-input" min="1" value="1" style="width: 60px; padding: 4px; margin: 0 5px;">
                    <button class="btn-goto" id="goto-btn">이동</button>
                </div>
                <select id="items-per-page" class="items-per-page-select">
                    <option value="50">50개씩 보기</option>
                    <option value="100">100개씩 보기</option>
                    <option value="1000">1000개씩 보기</option>
                </select>
            </div>
        </div>
    `;

    initSettlementEvents();
};

// 정산 로그 테이블 렌더링
const renderSettlementTable = (settlements) => {
    const tbody = document.getElementById('settlement-list');
    if (!tbody) return;

    if (settlements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">조회된 정산 로그가 없습니다.</td></tr>';
        return;
    }

    const typeMap = {
        'order': '발주',
        'extend': '연장',
        'refund': '환불'
    };

    tbody.innerHTML = settlements.map((settlement, index) => {
        const period = settlement.period_start && settlement.period_end 
            ? `${settlement.period_start} ~ ${settlement.period_end}`
            : '-';
        
        return `
            <tr data-settlement-id="${settlement.settlement_id || settlement.id}">
                <td>${index + 1}</td>
                <td>${typeMap[settlement.settlement_type] || settlement.settlement_type || '-'}</td>
                <td>${settlement.agency_name || settlement.agency || '-'}</td>
                <td>${settlement.advertiser_name || settlement.advertiser || '-'}</td>
                <td>${settlement.quantity || 0}</td>
                <td>${period}</td>
                <td>${settlement.total_days || 0}</td>
                <td>${settlement.created_at || '-'}</td>
                <td>${settlement.start_date || '-'}</td>
                <td><!-- <button class="btn-edit-row" data-settlement-id="${settlement.settlement_id || settlement.id}">수정</button> --></td>
            </tr>
        `;
    }).join('');
};

// 정산 통계 업데이트
const updateSettlementStats = (stats) => {
    if (stats) {
        if (stats.order_days !== undefined) document.getElementById('order-days').textContent = stats.order_days || 0;
        if (stats.extend_days !== undefined) document.getElementById('extend-days').textContent = stats.extend_days || 0;
        if (stats.refund_days !== undefined) document.getElementById('refund-days').textContent = stats.refund_days || 0;
        if (stats.total_days !== undefined) document.getElementById('total-days').textContent = stats.total_days || 0;
    }
};

// 정산 로그 목록 로드
const loadSettlementList = async (params = {}) => {
    try {
        const queryString = new URLSearchParams(params).toString();
        // FastAPI 일반 패턴: 언더스코어 사용 (settlement_logs)
        const url = `${API_BASE_URL}/settlement_logs${queryString ? '?' + queryString : ''}`;
        
        console.log('정산 로그 API 호출:', url); // 디버깅용
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (response.ok) {
            const data = await response.json();
            renderSettlementTable(data.settlements || []);
            updateSettlementStats(data.stats || {});
            return data;
        } else {
            // 더 자세한 에러 정보 출력
            let errorData = {};
            try {
                const errorText = await response.text();
                errorData = errorText ? JSON.parse(errorText) : {};
            } catch (e) {
                errorData = { message: `서버 오류 (${response.status})` };
            }
            
            console.error('정산 로그 로드 실패:', response.status, errorData);
            alert(`정산 로그를 불러올 수 없습니다.\n오류: ${errorData.message || errorData.detail || '서버 내부 오류'}`);
            return { settlements: [], stats: {}, total: 0 };
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
        return { settlements: [], stats: {}, total: 0 };
    }
};

const initSettlementEvents = () => {
    let currentPage = 1;
    let itemsPerPage = 50;
    let totalPages = 1;

    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const dateRangeDisplay = document.getElementById('date-range-display');
    const quickDateBtns = document.querySelectorAll('.quick-date-btn');
    const gotoPageInput = document.getElementById('goto-page-input');
    const gotoBtn = document.getElementById('goto-btn');
    const itemsPerPageSelect = document.getElementById('items-per-page');
    const firstPageBtn = document.getElementById('first-page');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const lastPageBtn = document.getElementById('last-page');

    // 날짜 범위 업데이트 함수
    const updateDateRange = () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        dateRangeDisplay.textContent = `${startDate} ~ ${endDate}`;
        
        // 조회 기간 계산
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        document.getElementById('period-days').textContent = diffDays;
        
        // 실제로는 여기서 API 호출하여 데이터를 가져와야 함
        loadSettlementData();
    };

    // 날짜 입력 변경 이벤트
    startDateInput.addEventListener('change', updateDateRange);
    endDateInput.addEventListener('change', updateDateRange);

    // 빠른 날짜 선택 버튼
    quickDateBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const days = parseInt(btn.getAttribute('data-days'));
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            startDateInput.value = formatDate(startDate);
            endDateInput.value = formatDate(endDate);
            updateDateRange();
        });
    });

    // 페이지네이션 함수
    const updatePagination = () => {
        document.getElementById('current-page').textContent = currentPage;
        document.getElementById('total-pages').textContent = totalPages;
        
        firstPageBtn.disabled = currentPage === 1;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
        lastPageBtn.disabled = currentPage === totalPages;
    };

    const loadSettlementData = async () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const searchKeyword = document.querySelector('.search-input')?.value.trim() || '';
        
        const params = {
            start_date: startDate,
            end_date: endDate,
            page: currentPage,
            per_page: itemsPerPage
        };
        
        if (searchKeyword) {
            params.keyword = searchKeyword;
        }
        
        const data = await loadSettlementList(params);
        
        // 페이지네이션 계산
        totalPages = Math.ceil((data.total || 0) / itemsPerPage);
        if (totalPages === 0) totalPages = 1;
        updatePagination();
    };

    // 페이지네이션 버튼 이벤트
    firstPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage = 1;
            loadSettlementData();
        }
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadSettlementData();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadSettlementData();
        }
    });

    lastPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage = totalPages;
            loadSettlementData();
        }
    });

    // Go to page 기능
    gotoBtn.addEventListener('click', () => {
        const targetPage = parseInt(gotoPageInput.value);
        if (targetPage >= 1 && targetPage <= totalPages) {
            currentPage = targetPage;
            loadSettlementData();
        } else {
            alert(`1부터 ${totalPages} 사이의 페이지를 입력해주세요.`);
        }
    });

    // 페이지당 항목 수 변경
    itemsPerPageSelect.addEventListener('change', () => {
        itemsPerPage = parseInt(itemsPerPageSelect.value);
        currentPage = 1;
        loadSettlementData();
    });

    // 검색 버튼
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('.search-input');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            currentPage = 1;
            loadSettlementData();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentPage = 1;
                loadSettlementData();
            }
        });
    }

    // 개별 수정 버튼 (주석처리)
    // document.addEventListener('click', (e) => {
    //     if (e.target.classList.contains('btn-edit-row')) {
    //         const settlementId = e.target.getAttribute('data-settlement-id');
    //         if (settlementId) {
    //             // 수정 기능은 추후 구현
    //             alert(`정산 로그 ID ${settlementId} 수정 기능은 준비 중입니다.`);
    //         }
    //     }
    // });

    // 초기 로드
    updateDateRange();
};
