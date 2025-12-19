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
                    <tr>
                        <td>1</td>
                        <td>발주</td>
                        <td>대행사A</td>
                        <td>광고주1</td>
                        <td>10</td>
                        <td>2025-12-01 ~ 2025-12-10</td>
                        <td>10</td>
                        <td>2025-12-19 10:30:00</td>
                        <td>2025-12-01</td>
                        <td><button class="btn-edit-row">수정</button></td>
                    </tr>
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

const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

    const loadSettlementData = () => {
        // 실제로는 API 호출하여 데이터를 가져와야 함
        // 여기서는 샘플 데이터만 표시
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        // 페이지네이션 계산 (샘플)
        totalPages = Math.ceil(100 / itemsPerPage); // 예시: 총 100개 항목
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

    // 초기 로드
    updateDateRange();
};
