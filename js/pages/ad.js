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
        tbody.innerHTML = '<tr><td colspan="14" style="text-align: center; padding: 20px;">등록된 광고가 없습니다.</td></tr>';
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
        
        console.log('광고 목록 API 호출:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('광고 목록 API 응답:', data);
            console.log('광고 개수:', data.advertisements?.length || 0);
            
            renderAdTable(data.advertisements || []);
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
                    <!-- 광고 목록이 여기에 동적으로 로드됩니다 -->
                </tbody>
            </table>
        </div>

        <!-- 우측 등록 사이드바 -->
        <div id="ad-right-sidebar" class="right-sidebar">
            <h3>광고 등록</h3>
            <div class="form-group">
                <label>아이디</label>
                <input type="text" id="ad-reg-userid" placeholder="아이디를 입력하세요">
            </div>
            <div class="form-group">
                <label>메인키워드</label>
                <input type="text" id="ad-reg-keyword" placeholder="메인키워드를 입력하세요">
            </div>
            <div class="form-group">
                <label>상품명</label>
                <input type="text" id="ad-reg-product-name" placeholder="상품명을 입력하세요">
            </div>
            <div class="form-group">
                <label>상품MID</label>
                <input type="text" id="ad-reg-product-mid" placeholder="상품MID를 입력하세요">
            </div>
            <div class="form-group">
                <label>가격비교MID</label>
                <input type="text" id="ad-reg-price-mid" placeholder="가격비교MID를 입력하세요">
            </div>
            <div class="form-group">
                <label>가격비교</label>
                <select id="ad-reg-price-comparison" class="search-select" style="width: 100%;">
                    <option value="false">N</option>
                    <option value="true">Y</option>
                </select>
            </div>
            <div class="form-group">
                <label>플러스</label>
                <select id="ad-reg-plus" class="search-select" style="width: 100%;">
                    <option value="false">N</option>
                    <option value="true">Y</option>
                </select>
            </div>
            <div class="form-group">
                <label>작업일수</label>
                <input type="number" id="ad-reg-work-days" placeholder="작업일수를 입력하세요" min="1">
            </div>
            <div class="form-group">
                <label>시작일</label>
                <input type="date" id="ad-reg-start-date">
            </div>
            <div class="form-group">
                <label>종료일</label>
                <input type="date" id="ad-reg-end-date">
            </div>
            <div class="form-actions">
                <button id="ad-reg-submit-btn" class="btn-submit">등록</button>
                <button id="ad-reg-close-btn" class="btn-close">닫기</button>
            </div>
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
    const openRegBtn = document.getElementById('open-register-btn');
    const adRightSidebar = document.getElementById('ad-right-sidebar');
    const adRegCloseBtn = document.getElementById('ad-reg-close-btn');
    const adRegSubmitBtn = document.getElementById('ad-reg-submit-btn');
    
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
        openRegBtn.addEventListener('click', () => {
            // 폼 초기화
            document.getElementById('ad-reg-userid').value = '';
            document.getElementById('ad-reg-keyword').value = '';
            document.getElementById('ad-reg-product-name').value = '';
            document.getElementById('ad-reg-product-mid').value = '';
            document.getElementById('ad-reg-price-mid').value = '';
            document.getElementById('ad-reg-price-comparison').value = 'false';
            document.getElementById('ad-reg-plus').value = 'false';
            document.getElementById('ad-reg-work-days').value = '';
            
            // 오늘 날짜를 기본값으로 설정
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('ad-reg-start-date').value = today;
            document.getElementById('ad-reg-end-date').value = today;
            
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
    if (adRegSubmitBtn) {
        adRegSubmitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const userid = document.getElementById('ad-reg-userid').value.trim();
            const keyword = document.getElementById('ad-reg-keyword').value.trim();
            const productName = document.getElementById('ad-reg-product-name').value.trim();
            const productMid = document.getElementById('ad-reg-product-mid').value.trim();
            const priceMid = document.getElementById('ad-reg-price-mid').value.trim();
            const priceComparisonValue = document.getElementById('ad-reg-price-comparison').value;
            const plusValue = document.getElementById('ad-reg-plus').value;
            const workDaysValue = document.getElementById('ad-reg-work-days').value;
            
            // boolean 변환 (문자열 'true'/'false' 또는 boolean)
            const priceComparison = priceComparisonValue === 'true' || priceComparisonValue === true;
            const plus = plusValue === 'true' || plusValue === true;
            
            // 숫자 변환 (빈 문자열이면 null 또는 0)
            const workDays = workDaysValue ? parseInt(workDaysValue) : 0;
            if (isNaN(workDays)) {
                alert('작업일수는 숫자로 입력해주세요.');
                return;
            }
            const startDate = document.getElementById('ad-reg-start-date').value;
            const endDate = document.getElementById('ad-reg-end-date').value;
            
            // 유효성 검사
            if (!userid) {
                alert('아이디를 입력해주세요.');
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
            if (new Date(startDate) > new Date(endDate)) {
                alert('시작일은 종료일보다 이전이어야 합니다.');
                return;
            }
            
            // 등록 버튼 비활성화
            adRegSubmitBtn.disabled = true;
            adRegSubmitBtn.textContent = '등록 중...';
            
            try {
                const requestBody = {
                    username: userid,
                    main_keyword: keyword,
                    product_name: productName || null,
                    product_mid: productMid || null,
                    price_comparison_mid: priceMid || null,
                    price_comparison: priceComparison,
                    plus: plus,
                    work_days: workDays,
                    start_date: startDate,
                    end_date: endDate
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
                    document.getElementById('ad-reg-userid').value = '';
                    document.getElementById('ad-reg-keyword').value = '';
                    document.getElementById('ad-reg-product-name').value = '';
                    document.getElementById('ad-reg-product-mid').value = '';
                    document.getElementById('ad-reg-price-mid').value = '';
                    document.getElementById('ad-reg-price-comparison').value = 'false';
                    document.getElementById('ad-reg-plus').value = 'false';
                    document.getElementById('ad-reg-work-days').value = '';
                    const today = new Date().toISOString().split('T')[0];
                    document.getElementById('ad-reg-start-date').value = today;
                    document.getElementById('ad-reg-end-date').value = today;
                    
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
                    headers: getAuthHeaders(),
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
                // 개별 수정 기능은 추후 구현
                alert(`광고 ID ${adId} 수정 기능은 준비 중입니다.`);
            }
        }
    });

    // 초기 광고 목록 로드
    loadAdList();
};
