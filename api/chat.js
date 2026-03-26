const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Đọc dữ liệu từ file để làm context (System Prompt)
        const systemContextPath = path.join(process.cwd(), 'chatbot_data.txt');
        const systemContext = fs.readFileSync(systemContextPath, 'utf8');

        // Khởi tạo client OpenAI với cấu hình tùy chỉnh
        const openai = new OpenAI({
            baseURL: 'https://9router.vuhai.io.vn/v1',
            apiKey: 'sk-4bd27113b7dc78d1-lh6jld-f4f9c69f',
        });

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

        res.status(200).json({ reply: response.choices[0].message.content });
    } catch (error) {
        console.error("Lỗi gọi API:", error.message);
        res.status(500).json({ error: "Thật xin lỗi, máy chủ của tôi đang gặp sự cố. Bạn vui lòng liên hệ Zalo hoặc Email để được hỗ trợ nhé." });
    }
}
