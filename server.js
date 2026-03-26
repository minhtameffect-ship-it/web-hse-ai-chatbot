const express = require('express');
const cors = require('cors');
const fs = require('fs');
const OpenAI = require('openai');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
// Phục vụ frontend tĩnh từ thư mục public
app.use(express.static('public'));

// Đọc dữ liệu từ file để làm context (System Prompt)
const systemContext = fs.readFileSync(path.join(__dirname, 'chatbot_data.txt'), 'utf8');

// Khởi tạo client OpenAI với cấu hình tùy chỉnh
const openai = new OpenAI({
    baseURL: 'https://9router.vuhai.io.vn/v1',
    apiKey: 'sk-4bd27113b7dc78d1-lh6jld-f4f9c69f',
});

app.post('/api/chat', async (req, res) => {
    try {
        const userMessages = req.body.messages || [];
        
        // Thêm system prompt theo yêu cầu
        const messages = [
            { 
                role: 'system', 
                content: `Vai trò: Bạn là AI trợ lý độc quyền cho chuyên gia Nguyễn Văn A.
Chỉ được trả lời dựa trên Knowledge Base sau đây. Nếu câu hỏi nằm ngoài phạm vi, hãy từ chối nhẹ nhàng và hướng dẫn người dùng liên hệ thông tin bên dưới.
Luôn chào thân thiện, trả lời rõ ràng và kết thúc bằng một câu hỏi mở để mời họ trao đổi thêm.
Tất cả câu trả lời phải được định dạng bằng Markdown đẹp mắt.

KNOWLEDGE BASE:
${systemContext}`
            },
            ...userMessages
        ];

        const response = await openai.chat.completions.create({
            model: 'ces-chatbot-gpt-5.4',
            messages: messages
        });

        res.json({ reply: response.choices[0].message.content });
    } catch (error) {
        console.error("Lỗi gọi API:", error.message);
        res.status(500).json({ error: "Thật xin lỗi, máy chủ của tôi đang gặp sự cố. Bạn vui lòng liên hệ Zalo hoặc Email để được hỗ trợ nhé." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Chatbot Backend đang chạy tại: http://localhost:${PORT}`);
    console.log(`Frontend có thể truy cập tại: http://localhost:${PORT}/index.html`);
});
