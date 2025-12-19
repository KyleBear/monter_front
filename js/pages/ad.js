export const initAdPage = (container) => {
    container.innerHTML = `
        <div class="account-info">
            <strong>광고관리</strong><br>
            진행 중인 광고의 연장·수정·삭제 등의 관리 작업을 할 수 있습니다.
        </div>

        <div class="account-status">
            <div class="status-card">
                <h4>전체</h4>
                <div class="count">345</div>
            </div>
            <div class="status-card">
                <h4>정상</h4>
                <div class="count" style="color: #28a745;">345</div>
            </div>
            <div class="status-card">
                <h4>오류</h4>
                <div class="count" style="color: #dc3545;">0</div>
            </div>
            <div class="status-card">
                <h4>대기</h4>
                <div class="count" style="color: #ffc107;">0</div>
            </div>
            <div class="status-card">
                <h4>종료예정</h4>
                <div class="count" style="color: #fd7e14;">20</div>
            </div>
            <div class="status-card">
                <h4>종료</h4>
                <div class="count" style="color: #6c757d;">252</div>
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

const initAdEvents = () => {
    const selectAll = document.getElementById('select-all');
    const selectCountSpan = document.getElementById('select-count');
    
    if (selectAll) {
        selectAll.addEventListener('change', () => {
            const rowChecks = document.querySelectorAll('.row-check');
            rowChecks.forEach(check => {
                check.checked = selectAll.checked;
            });
            updateSelectCount();
        });
    }

    const updateSelectCount = () => {
        const rowChecks = document.querySelectorAll('.row-check');
        const checkedCount = Array.from(rowChecks).filter(c => c.checked).length;
        if (selectCountSpan) selectCountSpan.textContent = checkedCount;
    };

    // 개별 체크박스 이벤트 위임
    document.getElementById('ad-list').addEventListener('change', (e) => {
        if (e.target.classList.contains('row-check')) {
            updateSelectCount();
            const rowChecks = document.querySelectorAll('.row-check');
            const allChecked = Array.from(rowChecks).every(c => c.checked);
            if (selectAll) selectAll.checked = allChecked;
        }
    });

    // 버튼 클릭 이벤트 (샘플)
    document.querySelector('.table-actions').addEventListener('click', (e) => {
        if (e.target.id === 'extend-btn') {
            const checkedCount = document.getElementById('select-count').textContent;
            if (checkedCount === '0') {
                alert('연장할 광고를 선택해주세요.');
            } else {
                alert(`${checkedCount}개의 광고 연장 신청이 완료되었습니다.`);
            }
        }
    });
};
