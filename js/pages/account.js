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

const initAccountEvents = () => {
    const selectAll = document.getElementById('select-all');
    const rowChecks = document.querySelectorAll('.row-check');
    const selectCountSpan = document.getElementById('select-count');
    const openRegBtn = document.getElementById('open-register-btn');
    const rightSidebar = document.getElementById('right-sidebar');
    const closeRegBtn = document.getElementById('reg-close-btn');
    const deleteBtn = document.getElementById('delete-accounts-btn');

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
            check.addEventListener('change', () => {
                updateSelectCount();
                const allChecked = Array.from(rowChecksCurrent).every(c => c.checked);
                if (selectAll) selectAll.checked = allChecked;
            });
        });
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
            rightSidebar.classList.add('active');
        });
    }

    // 등록 사이드바 닫기
    if (closeRegBtn) {
        closeRegBtn.addEventListener('click', () => {
            rightSidebar.classList.remove('active');
        });
    }

    // 삭제 버튼
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const rowChecksCurrent = document.querySelectorAll('.row-check');
            const selectedRows = Array.from(rowChecksCurrent).filter(c => c.checked);
            if (selectedRows.length === 0) {
                alert('삭제할 계정을 선택해주세요.');
                return;
            }
            if (confirm(`선택한 ${selectedRows.length}개의 계정을 삭제하시겠습니까?`)) {
                selectedRows.forEach(check => {
                    check.closest('tr').remove();
                });
                updateSelectCount();
                alert('삭제되었습니다.');
            }
        });
    }
};

