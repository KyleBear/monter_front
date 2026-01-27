const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 정적 파일 서빙
// app.use(express.static(path.join(__dirname)));

// 정적 파일 서빙 (JavaScript 모듈 포함)
app.use(express.static(path.join(__dirname), {
    setHeaders: (res, filePath) => {
        // JavaScript 파일에 올바른 MIME type 설정
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
    }
}));
// /redirect/{short_code} 경로는 redirect.html로 라우팅 (인증 불필요)
app.get('/redirect/:shortCode', (req, res) => {
    res.sendFile(path.join(__dirname, 'redirect.html'));
});

// /reward/redirect/{short_code} 경로도 redirect.html로 라우팅
app.get('/reward/redirect/:shortCode', (req, res) => {
    res.sendFile(path.join(__dirname, 'redirect.html'));
});

// reward.html 직접 접근 (인증 불필요)
app.get('/reward.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'reward.html'));
});

// 모든 라우트를 index.html로 (SPA 지원)
// app.get('*', (req, res) => {
//     // main.html로 직접 접근하는 경우
//     if (req.path === '/main.html' || req.path === '/main') {
//         res.sendFile(path.join(__dirname, 'main.html'));
//     } else {
//         res.sendFile(path.join(__dirname, 'index.html'));
//     }
// });

app.get('*', (req, res) => {
    // 정적 파일 확장자가 있으면 404 (express.static이 처리해야 함)
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|map)$/)) {
        return res.status(404).send('Not Found');
    }
    
    // main.html로 직접 접근하는 경우
    if (req.path === '/main.html' || req.path === '/main') {
        res.sendFile(path.join(__dirname, 'main.html'));
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================`);
    console.log(`Monter Frontend Server Started`);
    console.log(`=================================`);
    console.log(`Server IP: 115.68.195.145`);
    console.log(`Domain: https://re-switch.co.kr`);
    console.log(`Port: ${PORT}`);
    console.log(`Access: http://115.68.195.145:${PORT}`);
    console.log(`=================================`);
});

