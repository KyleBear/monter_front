import { initAccountPage } from './pages/account.js';
import { initNoticePage } from './pages/notice.js';
import { initFAQPage } from './pages/faq.js';
import { initAdPage } from './pages/ad.js';
import { initSettlementPage } from './pages/settlement.js';
import { initRewardPage } from './pages/reward.js';
import { initRewardMgmtPage } from './pages/reward_mgmt.js';
import { initRewardMgmtLinkPage } from './pages/reward_mgmt_link.js';

// 전역 스크롤 위치 관리
const SCROLL_POSITION_KEY_PREFIX = 'pageScrollPosition_';

// 현재 페이지의 스크롤 위치 저장
const saveScrollPosition = (pageKey) => {
    if (!pageKey) return;
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    sessionStorage.setItem(`${SCROLL_POSITION_KEY_PREFIX}${pageKey}`, scrollPosition.toString());
};

// 현재 페이지의 스크롤 위치 복원
const restoreScrollPosition = (pageKey) => {
    if (!pageKey) return;
    const savedScrollPosition = sessionStorage.getItem(`${SCROLL_POSITION_KEY_PREFIX}${pageKey}`);
    if (savedScrollPosition) {
        requestAnimationFrame(() => {
            window.scrollTo(0, parseInt(savedScrollPosition, 10));
        });
    }
};

// 현재 페이지 키 가져오기
const getCurrentPageKey = () => {
    const activeMenu = document.querySelector('.menu-item.active');
    return activeMenu ? activeMenu.getAttribute('data-page') : null;
};

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
    const userRole = sessionStorage.getItem('userRole');
    
    document.getElementById('display-user-name').textContent = userName;
    document.getElementById('info-name').textContent = userName;
    
    // role에 따라 권한 텍스트 설정
    const roleMap = {
        'admin': '마스터 권한',
        'total': '총판사 권한',
        'agency': '대행사 권한',
        'advertiser': '광고주 권한'
    };
    
    const roleText = roleMap[userRole] || '권한 없음';
    const roleElement = document.getElementById('info-role');
    if (roleElement) {
        roleElement.textContent = roleText;
    }

    // 계정관리 메뉴는 광고주에게 숨김
    const accountMenuItem = document.querySelector('.menu-item[data-page="account"]');
    if (accountMenuItem) {
        if (userRole === 'advertiser') {
            accountMenuItem.style.display = 'none';
        } else {
            accountMenuItem.style.display = 'block';
        }
    }    

    // 리워드 메뉴는 관리자만 표시
    const rewardMenuItem = document.getElementById('reward-menu-item');
    if (rewardMenuItem) {
        if (userRole === 'admin') {
            rewardMenuItem.style.display = 'block';
        } else {
            rewardMenuItem.style.display = 'none';
        }
    }

    // 리워드 링크 관리 메뉴는 관리자만 표시
    const rewardMgmtLinkMenuItem = document.getElementById('reward-mgmt-link-menu-item');
    if (rewardMgmtLinkMenuItem) {
        if (userRole === 'admin') {
            rewardMgmtLinkMenuItem.style.display = 'block';
        } else {
            rewardMgmtLinkMenuItem.style.display = 'none';
        }
    }

    // 리워드 키워드 관리 메뉴는 관리자만 표시 (임시로 숨김)
    const rewardMgmtMenuItem = document.getElementById('reward-mgmt-menu-item');
    if (rewardMgmtMenuItem) {
        // 임시로 숨김 처리
        rewardMgmtMenuItem.style.display = 'none';
        // if (userRole === 'admin') {
        //     rewardMgmtMenuItem.style.display = 'block';
        // } else {
        //     rewardMgmtMenuItem.style.display = 'none';
        // }
    }

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

    let currentPageKey = null;

    const loadContent = (pageKey, pageName) => {
        // 이전 페이지의 스크롤 위치 저장
        if (currentPageKey) {
            saveScrollPosition(currentPageKey);
        }
        
        pageTitle.textContent = pageName;
        currentPageKey = pageKey;
        
        // 현재 페이지 저장
        sessionStorage.setItem('currentPageKey', pageKey);
        
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
            case 'reward':
                initRewardPage(pageContent);
                break;
            // case 'reward-mgmt':
            //     initRewardMgmtPage(pageContent);
            //     break;
            case 'reward-mgmt-link':
                initRewardMgmtLinkPage(pageContent);
                break;
            default:
                pageContent.innerHTML = `<p>${pageName} 화면을 준비 중입니다.</p>`;
        }
        
        // 페이지 로드 후 스크롤 위치 복원
        setTimeout(() => {
            restoreScrollPosition(pageKey);
        }, 100);
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

    // 초기 로드: 저장된 페이지가 있으면 복원, 없으면 활성 메뉴 사용
    const savedPageKey = sessionStorage.getItem('currentPageKey');
    let initialPageKey = null;
    let initialPageName = null;
    
    if (savedPageKey) {
        // 저장된 페이지 찾기
        const savedMenuItem = document.querySelector(`.menu-item[data-page="${savedPageKey}"]`);
        if (savedMenuItem && savedMenuItem.style.display !== 'none') {
            // 저장된 메뉴 활성화
            menuItems.forEach(i => i.classList.remove('active'));
            savedMenuItem.classList.add('active');
            initialPageKey = savedPageKey;
            initialPageName = savedMenuItem.textContent;
        }
    }
    
    // 저장된 페이지가 없거나 유효하지 않으면 기본 활성 메뉴 사용
    if (!initialPageKey) {
        const activeMenu = document.querySelector('.menu-item.active');
        if (activeMenu) {
            initialPageKey = activeMenu.getAttribute('data-page');
            initialPageName = activeMenu.textContent;
        }
    }
    
    if (initialPageKey) {
        currentPageKey = initialPageKey;
        loadContent(initialPageKey, initialPageName);
    }

    // 6. 햄버거 메뉴 토글
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // 7. 전역 스크롤 이벤트 리스너 (모든 페이지에서 스크롤 위치 저장)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const pageKey = getCurrentPageKey();
            if (pageKey) {
                saveScrollPosition(pageKey);
            }
        }, 100); // 디바운싱: 100ms마다 저장
    }, { passive: true });

    // 8. 페이지 언로드 시 현재 페이지의 스크롤 위치 저장
    window.addEventListener('beforeunload', () => {
        const pageKey = getCurrentPageKey();
        if (pageKey) {
            saveScrollPosition(pageKey);
        }
    });
});
