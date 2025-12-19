import { initAccountPage } from './pages/account.js';
import { initNoticePage } from './pages/notice.js';
import { initFAQPage } from './pages/faq.js';
import { initAdPage } from './pages/ad.js';
import { initSettlementPage } from './pages/settlement.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. 로그인 체크
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
    
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
    }

    window.addEventListener('click', () => dropdown.classList.remove('show'));

    // 4. 로그아웃
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.clear();
            location.href = 'index.html';
        });
    }

    // 5. 사이드바 메뉴 및 컨텐츠 전환 (라우팅)
    const menuItems = document.querySelectorAll('.menu-item');
    const pageTitle = document.getElementById('page-title');
    const pageContent = document.getElementById('page-content');

    const loadContent = (pageKey, pageName) => {
        pageTitle.textContent = pageName;
        
        switch (pageKey) {
            case 'notice':
                initNoticePage(pageContent);
                break;
            case 'faq':
                initFAQPage(pageContent);
                break;
            case 'account':
                initAccountPage(pageContent);
                break;
            case 'ad':
                initAdPage(pageContent);
                break;
            case 'settlement':
                initSettlementPage(pageContent);
                break;
            default:
                pageContent.innerHTML = `<p>${pageName} 화면을 준비 중입니다.</p>`;
        }
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

    // 초기 로드 (공지사항 또는 활성화된 메뉴)
    const activeMenu = document.querySelector('.menu-item.active');
    if (activeMenu) {
        loadContent(activeMenu.getAttribute('data-page'), activeMenu.textContent);
    }

    // 6. 햄버거 메뉴 토글
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
});
