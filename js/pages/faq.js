export const initFAQPage = (container) => {
    container.innerHTML = `
        <div class="content-card">
            <h3>자주묻는 질문</h3>
            <p>자주 발생하는 질문들에 대한 답변입니다.</p>
            <div style="margin-top: 20px; padding: 20px; border: 1px dashed #ccc; border-radius: 8px; text-align: center; color: #999;">
                [ FAQ 목록 영역 ]
            </div>
        </div>
    `;
};

