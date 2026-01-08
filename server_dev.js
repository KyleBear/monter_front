const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 정적 파일 서빙
app.use(express.static(path.join(__dirname)));

// 모든 라우트를 index.html로 (SPA 지원)
app.get('*', (req, res) => {
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
    console.log(`Backend: http://localhost:8001`);
    console.log(`Note: Frontend directly calls backend (CORS required)`);
    console.log(`=================================`);
});

