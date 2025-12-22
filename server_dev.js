const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

// 정적 파일 서빙
app.use(express.static(path.join(__dirname)));

// API 프록시 설정 (로컬 개발용)
// /api/* 요청을 백엔드 서버(http://localhost:8000)로 전달
app.use('/api', createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] ${req.method} ${req.url} -> http://localhost:8000${req.url}`);
    },
    onError: (err, req, res) => {
        console.error('[Proxy Error]', err.message);
        res.status(500).json({ 
            success: false, 
            message: '백엔드 서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하세요.' 
        });
    }
}));

// 모든 라우트를 index.html로 (SPA 지원)
app.get('*', (req, res) => {
    // API 요청은 프록시로 처리되므로 여기서는 제외
    if (req.path.startsWith('/api')) {
        return;
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
    console.log(`Monter Frontend Server (Dev Mode)`);
    console.log(`=================================`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`API Proxy: /api -> http://localhost:8000/api`);
    console.log(`=================================`);
});

