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

// 관리자 여부 확인
const isAdmin = () => {
    const userName = sessionStorage.getItem('userName') || '';
    return userName === 'admin' || userName === 'monteur';
};

// 날짜 포맷팅
const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 공지사항 목록 로드
const loadNoticeList = async () => {
    try {
        const url = `${API_BASE_URL}/notices/notices`;
        console.log('공지사항 목록 API 호출:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('공지사항 목록 API 응답:', data);
            
            // 응답 형식 확인 (배열 또는 객체)
            let notices = [];
            if (Array.isArray(data)) {
                notices = data;
            } else if (data.data && Array.isArray(data.data)) {
                notices = data.data;
            } else if (data.notices && Array.isArray(data.notices)) {
                notices = data.notices;
            }
            
            renderNoticeList(notices);
        } else {
            let errorData = {};
            try {
                const errorText = await response.text();
                errorData = errorText ? JSON.parse(errorText) : {};
            } catch (e) {
                errorData = { message: `서버 오류 (${response.status})` };
            }
            console.error('공지사항 목록 로드 실패:', response.status, errorData);
            alert(`공지사항 목록을 불러올 수 없습니다.\n오류: ${errorData.message || errorData.detail || '서버 내부 오류'}`);
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
};

// 공지사항 상세 조회
const loadNoticeDetail = async (noticeId) => {
    try {
        const url = `${API_BASE_URL}/notices/notices/${noticeId}`;
        console.log('공지사항 상세 API 호출:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('공지사항 상세 API 응답:', data);
            showNoticeDetail(data);
        } else {
            let errorData = {};
            try {
                const errorText = await response.text();
                errorData = errorText ? JSON.parse(errorText) : {};
            } catch (e) {
                errorData = { message: `서버 오류 (${response.status})` };
            }
            console.error('공지사항 상세 로드 실패:', response.status, errorData);
            alert(`공지사항을 불러올 수 없습니다.\n오류: ${errorData.message || errorData.detail || '서버 내부 오류'}`);
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
};

// 공지사항 목록 렌더링
const renderNoticeList = (notices) => {
    const listContainer = document.getElementById('notice-list-container');
    if (!listContainer) return;
    
    if (!notices || notices.length === 0) {
        listContainer.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #999;">
                등록된 공지사항이 없습니다.
            </div>
        `;
        return;
    }
    
    // 고정 공지사항과 일반 공지사항 분리
    const pinnedNotices = notices.filter(n => n.is_pinned === true);
    const normalNotices = notices.filter(n => !n.is_pinned || n.is_pinned === false);
    
    let html = '';
    
    // 고정 공지사항 표시
    if (pinnedNotices.length > 0) {
        html += '<div style="margin-bottom: 20px;">';
        html += '<h4 style="margin-bottom: 10px; color: #ff6b6b; font-size: 14px;">📌 고정 공지</h4>';
        pinnedNotices.forEach(notice => {
            html += createNoticeItem(notice);
        });
        html += '</div>';
    }
    
    // 일반 공지사항 표시
    if (normalNotices.length > 0) {
        if (pinnedNotices.length > 0) {
            html += '<h4 style="margin-bottom: 10px; margin-top: 20px; color: #666; font-size: 14px;">공지사항</h4>';
        }
        normalNotices.forEach(notice => {
            html += createNoticeItem(notice);
        });
    }
    
    listContainer.innerHTML = html;
    
    // 클릭 이벤트 바인딩
    document.querySelectorAll('.notice-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // 버튼 클릭이 아닌 경우에만 상세 조회
            if (!e.target.closest('.notice-action-btn')) {
                const noticeId = item.getAttribute('data-notice-id');
                if (noticeId) {
                    loadNoticeDetail(noticeId);
                }
            }
        });
    });
    
    // 관리자 버튼 이벤트 바인딩
    if (isAdmin()) {
        document.querySelectorAll('.notice-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const noticeId = btn.getAttribute('data-notice-id');
                if (noticeId) {
                    openEditModal(noticeId);
                }
            });
        });
        
        document.querySelectorAll('.notice-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const noticeId = btn.getAttribute('data-notice-id');
                if (noticeId) {
                    deleteNotice(noticeId);
                }
            });
        });
    }
};

// 공지사항 아이템 생성
const createNoticeItem = (notice) => {
    const adminControls = isAdmin() ? `
        <div class="notice-action-btn" style="display: flex; gap: 5px;">
            <button class="notice-edit-btn" data-notice-id="${notice.notice_id}" style="padding: 4px 8px; font-size: 12px; background-color: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer;">수정</button>
            <button class="notice-delete-btn" data-notice-id="${notice.notice_id}" style="padding: 4px 8px; font-size: 12px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">삭제</button>
        </div>
    ` : '';
    
    return `
        <div class="notice-item" data-notice-id="${notice.notice_id}" style="padding: 15px; margin-bottom: 10px; border: 1px solid #e0e0e0; border-radius: 8px; cursor: pointer; background-color: ${notice.is_pinned ? '#fff9e6' : '#fff'}; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#f5f5f5'" onmouseout="this.style.backgroundColor='${notice.is_pinned ? '#fff9e6' : '#fff'}'">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        ${notice.is_pinned ? '<span style="color: #ff6b6b; font-weight: bold;">📌</span>' : ''}
                        <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: #333;">${notice.title || '제목 없음'}</h4>
                    </div>
                    <div style="color: #666; font-size: 14px; margin-bottom: 8px; line-height: 1.5;">
                        ${notice.content ? (notice.content.length > 100 ? notice.content.substring(0, 100) + '...' : notice.content) : ''}
                    </div>
                    <div style="color: #999; font-size: 12px;">
                        작성일: ${formatDate(notice.created_at)}
                        ${notice.updated_at && notice.updated_at !== notice.created_at ? ` | 수정일: ${formatDate(notice.updated_at)}` : ''}
                    </div>
                </div>
                ${adminControls}
            </div>
        </div>
    `;
};

// 공지사항 상세 보기
const showNoticeDetail = (notice) => {
    const detailModal = document.getElementById('notice-detail-modal');
    if (!detailModal) return;
    
    const detailContent = document.getElementById('notice-detail-content');
    if (!detailContent) return;
    
    detailContent.innerHTML = `
        <div style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                <h3 style="margin: 0; font-size: 20px; color: #333;">
                    ${notice.is_pinned ? '📌 ' : ''}${notice.title || '제목 없음'}
                </h3>
                <button id="notice-detail-close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">&times;</button>
            </div>
            <div style="color: #666; font-size: 14px; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0;">
                작성일: ${formatDate(notice.created_at)}
                ${notice.updated_at && notice.updated_at !== notice.created_at ? ` | 수정일: ${formatDate(notice.updated_at)}` : ''}
            </div>
            <div style="color: #333; font-size: 15px; line-height: 1.8; white-space: pre-wrap;">
                ${notice.content || '내용 없음'}
            </div>
        </div>
    `;
    
    detailModal.style.display = 'block';
    
    // 닫기 버튼 이벤트
    const closeBtn = document.getElementById('notice-detail-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            detailModal.style.display = 'none';
        });
    }
    
    // 모달 외부 클릭 시 닫기
    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) {
            detailModal.style.display = 'none';
        }
    });
};

// 공지사항 등록
const createNotice = async (title, content, isPinned) => {
    try {
        const url = `${API_BASE_URL}/notices/notices`;
        console.log('공지사항 등록 API 호출:', url);
        
        const requestBody = {
            title: title,
            content: content,
            is_pinned: isPinned || false
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });

        if (response.ok || response.status === 201) {
            const data = await response.json();
            console.log('공지사항 등록 성공:', data);
            alert('공지사항이 등록되었습니다.');
            
            // 등록 모달 닫기
            const registerModal = document.getElementById('notice-register-modal');
            if (registerModal) {
                registerModal.style.display = 'none';
            }
            
            // 폼 초기화
            document.getElementById('notice-reg-title').value = '';
            document.getElementById('notice-reg-content').value = '';
            document.getElementById('notice-reg-pinned').checked = false;
            
            // 목록 새로고침
            await loadNoticeList();
        } else {
            let errorData = {};
            try {
                const errorText = await response.text();
                errorData = errorText ? JSON.parse(errorText) : {};
            } catch (e) {
                errorData = { message: `서버 오류 (${response.status})` };
            }
            console.error('공지사항 등록 실패:', response.status, errorData);
            alert(`공지사항 등록에 실패했습니다.\n오류: ${errorData.message || errorData.detail || '서버 내부 오류'}`);
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
};

// 공지사항 수정
const updateNotice = async (noticeId, title, content, isPinned) => {
    try {
        const url = `${API_BASE_URL}/notices/notices/${noticeId}`;
        console.log('공지사항 수정 API 호출:', url);
        
        const requestBody = {};
        if (title !== undefined) requestBody.title = title;
        if (content !== undefined) requestBody.content = content;
        if (isPinned !== undefined) requestBody.is_pinned = isPinned;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('공지사항 수정 성공:', data);
            alert('공지사항이 수정되었습니다.');
            
            // 수정 모달 닫기
            const editModal = document.getElementById('notice-edit-modal');
            if (editModal) {
                editModal.style.display = 'none';
            }
            
            // 목록 새로고침
            await loadNoticeList();
        } else {
            let errorData = {};
            try {
                const errorText = await response.text();
                errorData = errorText ? JSON.parse(errorText) : {};
            } catch (e) {
                errorData = { message: `서버 오류 (${response.status})` };
            }
            console.error('공지사항 수정 실패:', response.status, errorData);
            alert(`공지사항 수정에 실패했습니다.\n오류: ${errorData.message || errorData.detail || '서버 내부 오류'}`);
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
};

// 공지사항 삭제
const deleteNotice = async (noticeId) => {
    if (!confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const url = `${API_BASE_URL}/notices/notices/${noticeId}`;
        console.log('공지사항 삭제 API 호출:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok || response.status === 204) {
            console.log('공지사항 삭제 성공');
            alert('공지사항이 삭제되었습니다.');
            
            // 목록 새로고침
            await loadNoticeList();
        } else {
            let errorData = {};
            try {
                const errorText = await response.text();
                errorData = errorText ? JSON.parse(errorText) : {};
            } catch (e) {
                errorData = { message: `서버 오류 (${response.status})` };
            }
            console.error('공지사항 삭제 실패:', response.status, errorData);
            alert(`공지사항 삭제에 실패했습니다.\n오류: ${errorData.message || errorData.detail || '서버 내부 오류'}`);
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
};

// 등록 모달 열기
const openRegisterModal = () => {
    const modal = document.getElementById('notice-register-modal');
    if (modal) {
        modal.style.display = 'block';
    }
};

// 수정 모달 열기
const openEditModal = async (noticeId) => {
    // 먼저 공지사항 상세 정보를 가져옴
    try {
        const url = `${API_BASE_URL}/notices/notices/${noticeId}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (response.ok) {
            const notice = await response.json();
            
            // 수정 모달의 입력 필드에 값 채우기
            document.getElementById('notice-edit-id').value = notice.notice_id;
            document.getElementById('notice-edit-title').value = notice.title || '';
            document.getElementById('notice-edit-content').value = notice.content || '';
            document.getElementById('notice-edit-pinned').checked = notice.is_pinned || false;
            
            // 모달 표시
            const modal = document.getElementById('notice-edit-modal');
            if (modal) {
                modal.style.display = 'block';
            }
        } else {
            alert('공지사항 정보를 불러올 수 없습니다.');
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        alert('서버 연결에 실패했습니다.');
    }
};

// 이벤트 초기화
const initNoticeEvents = () => {
    const userName = sessionStorage.getItem('userName') || '';
    const isAdminUser = userName === 'admin' || userName === 'monteur';
    
    // 등록 버튼
    if (isAdminUser) {
        const registerBtn = document.getElementById('notice-register-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                openRegisterModal();
            });
        }
        
        // 등록 모달 제출 버튼
        const regSubmitBtn = document.getElementById('notice-reg-submit-btn');
        if (regSubmitBtn) {
            regSubmitBtn.addEventListener('click', async () => {
                const title = document.getElementById('notice-reg-title').value.trim();
                const content = document.getElementById('notice-reg-content').value.trim();
                const isPinned = document.getElementById('notice-reg-pinned').checked;
                
                if (!title) {
                    alert('제목을 입력해주세요.');
                    return;
                }
                if (!content) {
                    alert('내용을 입력해주세요.');
                    return;
                }
                
                await createNotice(title, content, isPinned);
            });
        }
        
        // 등록 모달 닫기 버튼
        const regCloseBtn = document.getElementById('notice-reg-close-btn');
        if (regCloseBtn) {
            regCloseBtn.addEventListener('click', () => {
                const modal = document.getElementById('notice-register-modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        // 수정 모달 제출 버튼
        const editSubmitBtn = document.getElementById('notice-edit-submit-btn');
        if (editSubmitBtn) {
            editSubmitBtn.addEventListener('click', async () => {
                const noticeId = document.getElementById('notice-edit-id').value;
                const title = document.getElementById('notice-edit-title').value.trim();
                const content = document.getElementById('notice-edit-content').value.trim();
                const isPinned = document.getElementById('notice-edit-pinned').checked;
                
                if (!noticeId) {
                    alert('공지사항 ID를 찾을 수 없습니다.');
                    return;
                }
                if (!title) {
                    alert('제목을 입력해주세요.');
                    return;
                }
                if (!content) {
                    alert('내용을 입력해주세요.');
                    return;
                }
                
                await updateNotice(noticeId, title, content, isPinned);
            });
        }
        
        // 수정 모달 닫기 버튼
        const editCloseBtn = document.getElementById('notice-edit-close-btn');
        if (editCloseBtn) {
            editCloseBtn.addEventListener('click', () => {
                const modal = document.getElementById('notice-edit-modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }
};

export const initNoticePage = (container) => {
    const userName = sessionStorage.getItem('userName') || '';
    const isAdminUser = userName === 'admin' || userName === 'monteur';
    
    container.innerHTML = `
        <div class="content-card">
            <h3>공지사항</h3>
            <p>중요한 소식과 업데이트 내용을 확인하세요.</p>
            
            ${isAdminUser ? `
            <div style="margin-top: 20px; margin-bottom: 20px; text-align: right;">
                <button id="notice-register-btn" class="btn-register" style="background-color: #17a2b8; margin-right: 10px;">등록</button>
            </div>
            ` : ''}
            
            <div id="notice-list-container" style="margin-top: 20px;">
                <div style="padding: 40px; text-align: center; color: #999;">
                    로딩 중...
                </div>
            </div>
        </div>
        
        <!-- 공지사항 상세 모달 -->
        <div id="notice-detail-modal" class="modal" style="display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5);">
            <div class="modal-content" style="background-color: #fefefe; margin: 5% auto; padding: 0; border: 1px solid #888; width: 80%; max-width: 800px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div id="notice-detail-content">
                    <!-- 상세 내용이 여기에 동적으로 로드됩니다 -->
                </div>
            </div>
        </div>
        
        ${isAdminUser ? `
        <!-- 공지사항 등록 모달 -->
        <div id="notice-register-modal" class="modal" style="display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5);">
            <div class="modal-content" style="background-color: #fefefe; margin: 5% auto; padding: 20px; border: 1px solid #888; width: 80%; max-width: 600px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0;">공지사항 등록</h3>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">제목 <span style="color: red;">*</span></label>
                    <input type="text" id="notice-reg-title" placeholder="공지사항 제목을 입력하세요" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="form-group" style="margin-bottom: 15px; text-align: left;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">내용 <span style="color: red;">*</span></label>
                    <textarea id="notice-reg-content" placeholder="공지사항 내용을 입력하세요" rows="10" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; resize: vertical;"></textarea>
                </div>
                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="display: inline-flex; align-items: center; cursor: pointer; white-space: nowrap;">
                        <input type="checkbox" id="notice-reg-pinned" style="margin-right: 4px;">
                        고정공지
                    </label>
                </div>
                <div style="text-align: right; margin-top: 20px;">
                    <button id="notice-reg-submit-btn" class="btn-submit" style="padding: 8px 20px; background-color: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">등록</button>
                    <button id="notice-reg-close-btn" class="btn-close" style="padding: 8px 20px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">취소</button>
                </div>
            </div>
        </div>
        
        <!-- 공지사항 수정 모달 -->
        <div id="notice-edit-modal" class="modal" style="display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5);">
            <div class="modal-content" style="background-color: #fefefe; margin: 5% auto; padding: 20px; border: 1px solid #888; width: 80%; max-width: 600px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0;">공지사항 수정</h3>
                <input type="hidden" id="notice-edit-id">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">제목 <span style="color: red;">*</span></label>
                    <input type="text" id="notice-edit-title" placeholder="공지사항 제목을 입력하세요" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">내용 <span style="color: red;">*</span></label>
                    <textarea id="notice-edit-content" placeholder="공지사항 내용을 입력하세요" rows="10" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; resize: vertical;"></textarea>
                </div>
                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="display: inline-flex; align-items: center; cursor: pointer; white-space: nowrap;">
                        <input type="checkbox" id="notice-edit-pinned" style="margin-right: 4px;">
                        고정공지
                    </label>
                </div>
                <div style="text-align: right; margin-top: 20px;">
                    <button id="notice-edit-submit-btn" class="btn-submit" style="padding: 8px 20px; background-color: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">수정</button>
                    <button id="notice-edit-close-btn" class="btn-close" style="padding: 8px 20px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">취소</button>
                </div>

                </div>

            </div>
        </div>
        ` : ''}
    `;
    
    // 이벤트 초기화
    initNoticeEvents();
    
    // 공지사항 목록 로드
    loadNoticeList();
};
