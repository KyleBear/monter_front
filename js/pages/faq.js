export const initFAQPage = (container) => {
    container.innerHTML = `
        <div class="content-card">
            <h3>자주묻는 질문</h3>
            <p>자주 발생하는 질문들에 대한 답변입니다.</p>
            <div style="margin-top: 20px;">
                <!-- 첫번째 FAQ 항목: 링크 예시 -->
                <div style="margin-bottom: 20px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
                    <h4 style="margin-top: 0; margin-bottom: 15px; color: #333; font-size: 16px; font-weight: 600;">링크 입력 예시</h4>
                    <div style="margin-bottom: 15px;">
                        <div style="margin-bottom: 8px; font-weight: 500; color: #555;">(1) 상품링크 예시</div>
                        <div style="padding: 10px; background-color: #fff; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 13px; color: #0066cc; word-break: break-all;">
                            https://smartstore.naver.com/nature-pure/products/12977850522
                        </div>
                    </div>
                    <div>
                        <div style="margin-bottom: 8px; font-weight: 500; color: #555;">(2) 가격비교 링크 예시</div>
                        <div style="padding: 10px; background-color: #fff; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 13px; color: #0066cc; word-break: break-all;">
                            https://smartstore.naver.com/stuhl/products/5425963168
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

