const fs = require('fs');
const OpenAI = require('openai');

// Đọc dữ liệu từ file để làm context (System Prompt)
const systemContext = fs.readFileSync('chatbot_data.txt', 'utf8');

// Khởi tạo client OpenAI với cấu hình tùy chỉnh
const openai = new OpenAI({
    baseURL: 'https://9router.vuhai.io.vn/v1',
    apiKey: 'sk-4bd27113b7dc78d1-lh6jld-f4f9c69f',
});

async function main() {
    console.log("Đang gọi API chatbot...");
    
    try {
        const response = await openai.chat.completions.create({
            model: 'ces-chatbot-gpt-5.4',
            messages: [
                { role: 'system', content: `Bạn là trợ lý ảo đại diện cho chuyên gia theo thông tin sau:\n\n${systemContext}` },
                { role: 'user', content: 'Xin chào, bạn chuyên môn về lĩnh vực gì và có cung cấp dịch vụ N8N AI không?' }
            ]
        });

        console.log('\n=== PHẢN HỒI TỪ CHATBOT ===\n');
        console.log(response.choices[0].message.content);
        console.log('\n===========================\n');
    } catch (error) {
        console.error("Lỗi khi gọi API:", error);
    }
}

main();
