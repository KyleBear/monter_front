document.addEventListener('DOMContentLoaded', () => {
    // 1. 로그인 체크 (비정상 접근 방지)
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        alert('로그인이 필요합니다.');
        location.href = 'index.html';
        return;
    }

    // 2. 유저 정보 표시
    const userName = sessionStorage.getItem('userName');
    document.getElementById('display-user-name').textContent = userName;
    document.getElementById('info-name').textContent = userName;

    // 3. 네비게이션 드롭다운
    const profileBtn = document.getElementById('profile-btn');
    const dropdown = document.getElementById('user-dropdown');
    
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    window.addEventListener('click', () => dropdown.classList.remove('show'));

    // 4. 로그아웃
    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.clear();
        location.href = 'index.html';
    });

    // 5. 사이드바 메뉴 및 컨텐츠 전환 (Partial SPA 방식)
    const menuItems = document.querySelectorAll('.menu-item');
    const pageTitle = document.getElementById('page-title');
    const pageContent = document.getElementById('page-content');

    const loadContent = (pageKey, pageName) => {
        pageTitle.textContent = pageName;
        // 실제 구현 시 여기서 fetch() 등을 사용해 페이지 내용을 가져올 수 있습니다.
        pageContent.innerHTML = `
            <div class="content-card">
                <h3>${pageName} 화면</h3>
                <p>${pageName} 관련 데이터와 리스트가 여기에 표시됩니다.</p>
                <div style="margin-top: 20px; padding: 20px; border: 1px dashed #ccc; border-radius: 8px; text-align: center; color: #999;">
                    [ ${pageName} 컨텐츠 영역 ]
                </div>
            </div>
        `;
    };

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const pageKey = item.getAttribute('data-page');
            const pageName = item.textContent;
            loadContent(pageKey, pageName);
        });
    });

    // 초기 로드 (공지사항)
    const activeMenu = document.querySelector('.menu-item.active');
    if (activeMenu) {
        loadContent(activeMenu.getAttribute('data-page'), activeMenu.textContent);
    }

    // 6. 햄버거 메뉴 토글
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
});

