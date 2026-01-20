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

// FAQ 목록 로드
const loadFAQList = async () => {
    try {
        const url = `${API_BASE_URL}/notices/faqs`;
        console.log('FAQ 목록 API 호출:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('FAQ 목록 API 응답:', data);
            
            // 응답 형식 확인 (배열 또는 객체)
            let faqs = [];
            if (Array.isArray(data)) {
                faqs = data;
            } else if (data.data && Array.isArray(data.data)) {
                faqs = data.data;
            } else if (data.faqs && Array.isArray(data.faqs)) {
                faqs = data.faqs;
            }
            
            // sort_order로 정렬 (오름차순)
            faqs.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            
            renderFAQList(faqs);
        } else {
            let errorData = {};
            try {
                const errorText = await response.text();
                errorData = errorText ? JSON.parse(errorText) : {};
            } catch (e) {
                errorData = { message: `서버 오류 (${response.status})` };
            }
            console.error('FAQ 목록 로드 실패:', response.status, errorData);
            alert(`FAQ 목록을 불러올 수 없습니다.\n오류: ${errorData.message || errorData.detail || '서버 내부 오류'}`);
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
};

// FAQ 상세 조회
const loadFAQDetail = async (faqId) => {
    try {
        const url = `${API_BASE_URL}/notices/faqs/${faqId}`;
        console.log('FAQ 상세 API 호출:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('FAQ 상세 API 응답:', data);
            showFAQDetail(data);
        } else {
            let errorData = {};
            try {
                const errorText = await response.text();
                errorData = errorText ? JSON.parse(errorText) : {};
            } catch (e) {
                errorData = { message: `서버 오류 (${response.status})` };
            }
            console.error('FAQ 상세 로드 실패:', response.status, errorData);
            alert(`FAQ를 불러올 수 없습니다.\n오류: ${errorData.message || errorData.detail || '서버 내부 오류'}`);
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
};

// FAQ 목록 렌더링
const renderFAQList = (faqs) => {
    const listContainer = document.getElementById('faq-list-container');
    if (!listContainer) return;
    
    if (!faqs || faqs.length === 0) {
        listContainer.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #999;">
                등록된 FAQ가 없습니다.
            </div>
        `;
        return;
    }
    
    // 카테고리별로 그룹화
    const faqsByCategory = {};
    faqs.forEach(faq => {
        const category = faq.category || '기타';
        if (!faqsByCategory[category]) {
            faqsByCategory[category] = [];
        }
        faqsByCategory[category].push(faq);
    });
    
    let html = '';
    
    // 카테고리별로 표시
    Object.keys(faqsByCategory).sort().forEach(category => {
        html += `<div style="margin-bottom: 30px;">`;
        html += `<h4 style="margin-bottom: 15px; color: #333; font-size: 16px; font-weight: 600; padding-bottom: 8px; border-bottom: 2px solid #e0e0e0;">${category}</h4>`;
        
        faqsByCategory[category].forEach(faq => {
            html += createFAQItem(faq);
        });
        
        html += `</div>`;
    });
    
    listContainer.innerHTML = html;
    
    // 클릭 이벤트 바인딩
    document.querySelectorAll('.faq-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // 버튼 클릭이 아닌 경우에만 상세 조회
            if (!e.target.closest('.faq-action-btn')) {
                const faqId = item.getAttribute('data-faq-id');
                if (faqId) {
                    loadFAQDetail(faqId);
                }
            }
        });
    });
    
    // 관리자 버튼 이벤트 바인딩
    if (isAdmin()) {
        document.querySelectorAll('.faq-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const faqId = btn.getAttribute('data-faq-id');
                if (faqId) {
                    openEditModal(faqId);
                }
            });
        });
        
        document.querySelectorAll('.faq-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const faqId = btn.getAttribute('data-faq-id');
                if (faqId) {
                    deleteFAQ(faqId);
                }
            });
        });
    }
};

// FAQ 아이템 생성
const createFAQItem = (faq) => {
    const adminControls = isAdmin() ? `
        <div class="faq-action-btn" style="display: flex; gap: 5px;">
            <button class="faq-edit-btn" data-faq-id="${faq.faq_id}" style="padding: 4px 8px; font-size: 12px; background-color: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer;">수정</button>
            <button class="faq-delete-btn" data-faq-id="${faq.faq_id}" style="padding: 4px 8px; font-size: 12px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">삭제</button>
        </div>
    ` : '';
    
    return `
        <div class="faq-item" data-faq-id="${faq.faq_id}" style="padding: 15px; margin-bottom: 10px; border: 1px solid #e0e0e0; border-radius: 8px; cursor: pointer; background-color: #fff; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#f5f5f5'" onmouseout="this.style.backgroundColor='#fff'">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <span style="color: #17a2b8; font-weight: bold;">Q.</span>
                        <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: #333;">${faq.question || '질문 없음'}</h4>
                    </div>
                    <div style="color: #666; font-size: 14px; margin-bottom: 8px; line-height: 1.5; padding-left: 25px;">
                        <span style="color: #28a745; font-weight: bold;">A.</span>
                        <span style="margin-left: 5px;">${faq.answer ? (faq.answer.length > 100 ? faq.answer.substring(0, 100) + '...' : faq.answer) : ''}</span>
                    </div>
                    <div style="color: #999; font-size: 12px; padding-left: 25px;">
                        작성일: ${formatDate(faq.created_at)}
                        ${faq.updated_at && faq.updated_at !== faq.created_at ? ` | 수정일: ${formatDate(faq.updated_at)}` : ''}
                    </div>
                </div>
                ${adminControls}
            </div>
        </div>
    `;
};

// FAQ 상세 보기
const showFAQDetail = (faq) => {
    const detailModal = document.getElementById('faq-detail-modal');
    if (!detailModal) return;
    
    const detailContent = document.getElementById('faq-detail-content');
    if (!detailContent) return;
    
    detailContent.innerHTML = `
        <div style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                <h3 style="margin: 0; font-size: 20px; color: #333;">FAQ 상세</h3>
                <button id="faq-detail-close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">&times;</button>
            </div>
            <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <span style="color: #17a2b8; font-weight: bold; font-size: 18px;">Q.</span>
                    <h4 style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">${faq.question || '질문 없음'}</h4>
                </div>
                ${faq.category ? `<div style="margin-top: 10px;"><span style="background-color: #17a2b8; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${faq.category}</span></div>` : ''}
            </div>
            <div style="margin-bottom: 20px; padding: 15px; background-color: #f0f8f0; border-radius: 8px;">
                <div style="display: flex; align-items: start; gap: 10px;">
                    <span style="color: #28a745; font-weight: bold; font-size: 18px;">A.</span>
                    <div style="flex: 1; color: #333; font-size: 15px; line-height: 1.8; white-space: pre-wrap;">
                        ${faq.answer || '답변 없음'}
                    </div>
                </div>
            </div>
            <div style="color: #666; font-size: 14px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
                작성일: ${formatDate(faq.created_at)}
                ${faq.updated_at && faq.updated_at !== faq.created_at ? ` | 수정일: ${formatDate(faq.updated_at)}` : ''}
            </div>
        </div>
    `;
    
    detailModal.style.display = 'block';
    
    // 닫기 버튼 이벤트
    const closeBtn = document.getElementById('faq-detail-close-btn');
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

// FAQ 등록
const createFAQ = async (question, answer, category, sortOrder) => {
    try {
        const url = `${API_BASE_URL}/notices/faqs`;
        console.log('FAQ 등록 API 호출:', url);
        
        const requestBody = {
            question: question,
            answer: answer
        };
        
        if (category && category.trim()) {
            requestBody.category = category.trim();
        }
        
        if (sortOrder !== undefined && sortOrder !== null && sortOrder !== '') {
            requestBody.sort_order = parseInt(sortOrder, 10) || 0;
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });

        if (response.ok || response.status === 201) {
            const data = await response.json();
            console.log('FAQ 등록 성공:', data);
            alert('FAQ가 등록되었습니다.');
            
            // 등록 모달 닫기
            const registerModal = document.getElementById('faq-register-modal');
            if (registerModal) {
                registerModal.style.display = 'none';
            }
            
            // 폼 초기화
            document.getElementById('faq-reg-question').value = '';
            document.getElementById('faq-reg-answer').value = '';
            document.getElementById('faq-reg-category').value = '';
            document.getElementById('faq-reg-sort-order').value = '0';
            
            // 목록 새로고침
            await loadFAQList();
        } else {
            let errorData = {};
            try {
                const errorText = await response.text();
                errorData = errorText ? JSON.parse(errorText) : {};
            } catch (e) {
                errorData = { message: `서버 오류 (${response.status})` };
            }
            console.error('FAQ 등록 실패:', response.status, errorData);
            alert(`FAQ 등록에 실패했습니다.\n오류: ${errorData.message || errorData.detail || '서버 내부 오류'}`);
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
};

// FAQ 수정
const updateFAQ = async (faqId, question, answer, category, sortOrder) => {
    try {
        const url = `${API_BASE_URL}/notices/faqs/${faqId}`;
        console.log('FAQ 수정 API 호출:', url);
        
        const requestBody = {};
        if (question !== undefined) requestBody.question = question;
        if (answer !== undefined) requestBody.answer = answer;
        if (category !== undefined) requestBody.category = category;
        if (sortOrder !== undefined && sortOrder !== null && sortOrder !== '') {
            requestBody.sort_order = parseInt(sortOrder, 10);
        }
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('FAQ 수정 성공:', data);
            alert('FAQ가 수정되었습니다.');
            
            // 수정 모달 닫기
            const editModal = document.getElementById('faq-edit-modal');
            if (editModal) {
                editModal.style.display = 'none';
            }
            
            // 목록 새로고침
            await loadFAQList();
        } else {
            let errorData = {};
            try {
                const errorText = await response.text();
                errorData = errorText ? JSON.parse(errorText) : {};
            } catch (e) {
                errorData = { message: `서버 오류 (${response.status})` };
            }
            console.error('FAQ 수정 실패:', response.status, errorData);
            alert(`FAQ 수정에 실패했습니다.\n오류: ${errorData.message || errorData.detail || '서버 내부 오류'}`);
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
};

// FAQ 삭제
const deleteFAQ = async (faqId) => {
    if (!confirm('정말 이 FAQ를 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const url = `${API_BASE_URL}/notices/faqs/${faqId}`;
        console.log('FAQ 삭제 API 호출:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok || response.status === 204) {
            console.log('FAQ 삭제 성공');
            alert('FAQ가 삭제되었습니다.');
            
            // 목록 새로고침
            await loadFAQList();
        } else {
            let errorData = {};
            try {
                const errorText = await response.text();
                errorData = errorText ? JSON.parse(errorText) : {};
            } catch (e) {
                errorData = { message: `서버 오류 (${response.status})` };
            }
            console.error('FAQ 삭제 실패:', response.status, errorData);
            alert(`FAQ 삭제에 실패했습니다.\n오류: ${errorData.message || errorData.detail || '서버 내부 오류'}`);
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        alert('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
};

// 등록 모달 열기
const openRegisterModal = () => {
    const modal = document.getElementById('faq-register-modal');
    if (modal) {
        modal.style.display = 'block';
    }
};

// 수정 모달 열기
const openEditModal = async (faqId) => {
    // 먼저 FAQ 상세 정보를 가져옴
    try {
        const url = `${API_BASE_URL}/notices/faqs/${faqId}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (response.ok) {
            const faq = await response.json();
            
            // 수정 모달의 입력 필드에 값 채우기
            document.getElementById('faq-edit-id').value = faq.faq_id;
            document.getElementById('faq-edit-question').value = faq.question || '';
            document.getElementById('faq-edit-answer').value = faq.answer || '';
            document.getElementById('faq-edit-category').value = faq.category || '';
            document.getElementById('faq-edit-sort-order').value = faq.sort_order || 0;
            
            // 모달 표시
            const modal = document.getElementById('faq-edit-modal');
            if (modal) {
                modal.style.display = 'block';
            }
        } else {
            alert('FAQ 정보를 불러올 수 없습니다.');
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        alert('서버 연결에 실패했습니다.');
    }
};

// 이벤트 초기화
const initFAQEvents = () => {
    const userName = sessionStorage.getItem('userName') || '';
    const isAdminUser = userName === 'admin' || userName === 'monteur';
    
    // 등록 버튼
    if (isAdminUser) {
        const registerBtn = document.getElementById('faq-register-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                openRegisterModal();
            });
        }
        
        // 등록 모달 제출 버튼
        const regSubmitBtn = document.getElementById('faq-reg-submit-btn');
        if (regSubmitBtn) {
            regSubmitBtn.addEventListener('click', async () => {
                const question = document.getElementById('faq-reg-question').value.trim();
                const answer = document.getElementById('faq-reg-answer').value.trim();
                const category = document.getElementById('faq-reg-category').value.trim();
                const sortOrder = document.getElementById('faq-reg-sort-order').value.trim();
                
                if (!question) {
                    alert('질문을 입력해주세요.');
                    return;
                }
                if (!answer) {
                    alert('답변을 입력해주세요.');
                    return;
                }
                
                await createFAQ(question, answer, category, sortOrder);
            });
        }
        
        // 등록 모달 닫기 버튼
        const regCloseBtn = document.getElementById('faq-reg-close-btn');
        if (regCloseBtn) {
            regCloseBtn.addEventListener('click', () => {
                const modal = document.getElementById('faq-register-modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        // 수정 모달 제출 버튼
        const editSubmitBtn = document.getElementById('faq-edit-submit-btn');
        if (editSubmitBtn) {
            editSubmitBtn.addEventListener('click', async () => {
                const faqId = document.getElementById('faq-edit-id').value;
                const question = document.getElementById('faq-edit-question').value.trim();
                const answer = document.getElementById('faq-edit-answer').value.trim();
                const category = document.getElementById('faq-edit-category').value.trim();
                const sortOrder = document.getElementById('faq-edit-sort-order').value.trim();
                
                if (!faqId) {
                    alert('FAQ ID를 찾을 수 없습니다.');
                    return;
                }
                if (!question) {
                    alert('질문을 입력해주세요.');
                    return;
                }
                if (!answer) {
                    alert('답변을 입력해주세요.');
                    return;
                }
                
                await updateFAQ(faqId, question, answer, category, sortOrder);
            });
        }
        
        // 수정 모달 닫기 버튼
        const editCloseBtn = document.getElementById('faq-edit-close-btn');
        if (editCloseBtn) {
            editCloseBtn.addEventListener('click', () => {
                const modal = document.getElementById('faq-edit-modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }
};

export const initFAQPage = (container) => {
    const userName = sessionStorage.getItem('userName') || '';
    const isAdminUser = userName === 'admin' || userName === 'monteur';
    
    container.innerHTML = `
        <div class="content-card">
            <h3>자주묻는 질문</h3>
            <p>자주 발생하는 질문들에 대한 답변입니다.</p>
            
            ${isAdminUser ? `
            <div style="margin-top: 20px; margin-bottom: 20px; text-align: right;">
                <button id="faq-register-btn" class="btn-register" style="background-color: #17a2b8; margin-right: 10px;">등록</button>
            </div>
            ` : ''}
            
            <div id="faq-list-container" style="margin-top: 20px;">
                <div style="padding: 40px; text-align: center; color: #999;">
                    로딩 중...
                </div>
            </div>
        </div>
        
        <!-- FAQ 상세 모달 -->
        <div id="faq-detail-modal" class="modal" style="display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5);">
            <div class="modal-content" style="background-color: #fefefe; margin: 5% auto; padding: 0; border: 1px solid #888; width: 80%; max-width: 800px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div id="faq-detail-content">
                    <!-- 상세 내용이 여기에 동적으로 로드됩니다 -->
                </div>
            </div>
        </div>
        
        ${isAdminUser ? `
        <!-- FAQ 등록 모달 -->
        <div id="faq-register-modal" class="modal" style="display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5);">
            <div class="modal-content" style="background-color: #fefefe; margin: 5% auto; padding: 20px; border: 1px solid #888; width: 80%; max-width: 600px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0;">FAQ 등록</h3>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">질문 <span style="color: red;">*</span></label>
                    <input type="text" id="faq-reg-question" placeholder="질문을 입력하세요" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">답변 <span style="color: red;">*</span></label>
                    <textarea id="faq-reg-answer" placeholder="답변을 입력하세요" rows="8" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; resize: vertical;"></textarea>
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">카테고리</label>
                    <input type="text" id="faq-reg-category" placeholder="카테고리 (예: 계정, 광고, 정산 등)" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">정렬 순서</label>
                    <input type="number" id="faq-reg-sort-order" placeholder="정렬 순서 (숫자가 작을수록 먼저 표시)" value="0" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="text-align: right; margin-top: 20px;">
                    <button id="faq-reg-submit-btn" class="btn-submit" style="padding: 8px 20px; background-color: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">등록</button>
                    <button id="faq-reg-close-btn" class="btn-close" style="padding: 8px 20px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">취소</button>
                </div>
            </div>
        </div>
        
        <!-- FAQ 수정 모달 -->
        <div id="faq-edit-modal" class="modal" style="display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5);">
            <div class="modal-content" style="background-color: #fefefe; margin: 5% auto; padding: 20px; border: 1px solid #888; width: 80%; max-width: 600px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0;">FAQ 수정</h3>
                <input type="hidden" id="faq-edit-id">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">질문 <span style="color: red;">*</span></label>
                    <input type="text" id="faq-edit-question" placeholder="질문을 입력하세요" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">답변 <span style="color: red;">*</span></label>
                    <textarea id="faq-edit-answer" placeholder="답변을 입력하세요" rows="8" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; resize: vertical;"></textarea>
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">카테고리</label>
                    <input type="text" id="faq-edit-category" placeholder="카테고리 (예: 계정, 광고, 정산 등)" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">정렬 순서</label>
                    <input type="number" id="faq-edit-sort-order" placeholder="정렬 순서 (숫자가 작을수록 먼저 표시)" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="text-align: right; margin-top: 20px;">
                    <button id="faq-edit-submit-btn" class="btn-submit" style="padding: 8px 20px; background-color: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">수정</button>
                    <button id="faq-edit-close-btn" class="btn-close" style="padding: 8px 20px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">취소</button>
                </div>
            </div>
        </div>
        ` : ''}
    `;
    
    // 이벤트 초기화
    initFAQEvents();
    
    // FAQ 목록 로드
    loadFAQList();
};
