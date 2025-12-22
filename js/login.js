import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const message = document.getElementById('message');

    // 1. 저장된 아이디 불러오기
    const savedId = localStorage.getItem('monter_saved_id');
    if (savedId) {
        usernameInput.value = savedId;
        rememberMeCheckbox.checked = true;
    }

    // // 2. 로그인 처리
    // loginForm.addEventListener('submit', (e) => {
    //     e.preventDefault();
    //     const username = usernameInput.value;
    //     const password = document.getElementById('password').value;

    //     // 임시 검증 (실제로는 API 호출)
    //     if (username === 'admin' && password === '1234') {
    //         if (rememberMeCheckbox.checked) {
    //             localStorage.setItem('monter_saved_id', username);
    //         } else {
    //             localStorage.removeItem('monter_saved_id');
    //         }
            
    //         // 세션 정보 저장 후 페이지 이동
    //         sessionStorage.setItem('isLoggedIn', 'true');
    //         sessionStorage.setItem('userName', username);
    //         location.href = 'main.html';
    //     } else {
    //         message.textContent = '아이디 또는 비밀번호가 일치하지 않습니다.';
    //     }
    // });

    // 2. 로그인 처리
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const password = document.getElementById('password').value;

        try {
            // API 호출
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    remember_me: rememberMeCheckbox.checked
                })
            });

            const result = await response.json();

            if (result.success) {
                if (rememberMeCheckbox.checked) {
                    localStorage.setItem('monter_saved_id', username);
                } else {
                    localStorage.removeItem('monter_saved_id');
                }
                
                // 세션 정보 저장
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('userName', result.data.username);
                sessionStorage.setItem('userId', result.data.user_id);  // user_id 저장 추가
                sessionStorage.setItem('userRole', result.data.role);    // role 저장 추가
                sessionStorage.setItem('userAffiliation', result.data.affiliation || '');  // affiliation 저장 추가
                sessionStorage.setItem('sessionToken', result.data.session_token); // 토큰 저장 추가
                
                location.href = 'main.html';
            } else {
                message.textContent = result.message || '아이디 또는 비밀번호가 일치하지 않습니다.';
            }
        } catch (error) {
            console.error('Login error:', error);
            message.textContent = '로그인 중 오류가 발생했습니다.';
        }
    });
});

