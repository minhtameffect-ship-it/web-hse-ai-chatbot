const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Sử dụng __dirname để Vercel NFT có thể trace file tĩnh
        const systemContextPath = path.join(__dirname, '..', 'chatbot_data.txt');
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
                content: `Vai trò: Bạn là AI trợ lý độc quyền cho chuyên gia Nguyễn Minh Tâm.
Chỉ được trả lời dựa trên Knowledge Base sau đây. Nếu câu hỏi nằm ngoài phạm vi, hãy từ chối nhẹ nhàng và hướng dẫn người dùng liên hệ thông tin bên dưới.
Luôn chào thân thiện, trả lời rõ ràng và kết thúc bằng một câu hỏi mở để mời họ trao đổi thêm.
Tất cả câu trả lời phải được định dạng bằng Markdown đẹp mắt.

Quy tắc đặc biệt: Trong quá trình trò chuyện, nếu bạn phát hiện người dùng cung cấp Tên, Số điện thoại hoặc Email, bạn HÃY VỪA trả lời họ bình thường, VỪA chèn thêm một đoạn mã JSON vào cuối cùng của câu trả lời theo đúng định dạng sau:
||LEAD_DATA: {"name": "...", "phone": "...", "email": "...", "interest": "...", "intent_level": "..."}||

Hướng dẫn cho từng trường:
- name, phone, email: Trích xuất trực tiếp từ thông tin người dùng cung cấp. Nếu chưa có thì để null.
- interest: Bạn tự phân tích toàn bộ nội dung cuộc trò chuyện để suy luận khách hàng đang quan tâm sản phẩm/dịch vụ gì. Viết ngắn gọn, rõ ràng (VD: "Đào tạo khởi nghiệp", "Tư vấn gọi vốn", "Máy tính văn phòng (5 bộ)"). Nếu chưa xác định được thì để null.
- intent_level: Bạn tự đánh giá mức độ sẵn sàng mua hàng/sử dụng dịch vụ dựa trên ngữ cảnh hội thoại. Chỉ dùng 1 trong 3 giá trị:
  + "hot" — Khách muốn mua/đăng ký ngay, hỏi giá, yêu cầu báo giá, đặt hàng, cung cấp đầy đủ thông tin liên hệ.
  + "warm" — Khách đang tìm hiểu, so sánh, hỏi thông tin chi tiết nhưng chưa quyết định.
  + "cold" — Khách chỉ hỏi chung chung, chưa thể hiện nhu cầu cụ thể.
  Nếu chưa đủ thông tin để đánh giá thì để "cold".

TUYỆT ĐỐI KHÔNG giải thích hay đề cập đến đoạn mã này cho người dùng.

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
