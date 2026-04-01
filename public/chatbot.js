let chatHistory = [];
const DEFAULT_GREETING = "Xin chào! Tôi là Nguyễn Minh Tâm, chuyên gia tư vấn tại Hệ sinh thái Khởi nghiệp Hạnh phúc (HSE). Tôi ở đây để đồng hành cùng bạn trên con đường xây dựng doanh nghiệp phát triển bền vững và tạo ra những tác động tích cực cho xã hội. Bạn đang quan tâm đến các chương trình đào tạo, kết nối gọi vốn hay cần tìm một người cố vấn chiến lược?";

// ============================================================
// HÀM BÓC TÁCH DỮ LIỆU LEAD TỪ CÂU TRẢ LỜI CỦA AI VÀ LƯU TRỮ
// ============================================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyv118478_tByNN5hqGt3dl9_cKC1F1_ZmFy5ujlw-NraV2XDB8RTSSIYwUH-P2SHIW_Q/exec';
const AI_CHAT_SESSION_ID = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

function processAIResponse(aiResponse, chatHistoryArray = []) {
    const dataPattern = /\|\|LEAD_DATA:\s*(\{.*?\})\s*\|\|/;

    let formattedHistory = "";
    if (chatHistoryArray && chatHistoryArray.length > 0) {
        formattedHistory = chatHistoryArray.map(msg => {
            let role = msg.role === 'user' ? 'Khách' : 'AI';
            let content = msg.content.replace(dataPattern, "").trim();
            return `${role}: ${content}`;
        }).join('\n\n');
    }

    if (aiResponse.includes("||LEAD_DATA:")) {
        const match = aiResponse.match(dataPattern);

        if (match && match[1]) {
            try {
                const leadData = JSON.parse(match[1]);
                console.log("✅ Dữ liệu khách hàng bóc được:", leadData);

                if (leadData.name || leadData.phone || leadData.email) {
                    sendLeadToGoogleSheets(leadData, formattedHistory);
                }
            } catch (error) {
                console.error("❌ Lỗi parse JSON từ AI:", error);
            }
        }
        aiResponse = aiResponse.replace(dataPattern, "").trim();
    }
    return aiResponse;
}

async function sendLeadToGoogleSheets(leadData, chatHistoryText) {
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: leadData.name || '',
                phone: leadData.phone || '',
                email: leadData.email || '',
                interest: leadData.interest || '',
                intent_level: leadData.intent_level || '',
                source: window.location.href,
                sessionId: AI_CHAT_SESSION_ID,
                chatHistory: chatHistoryText,
                timestamp: new Date().toLocaleString('vi-VN')
            })
        });
        console.log("📤 Đã đồng bộ dữ liệu vào Google Sheets!");
    } catch (err) {
        console.warn("⚠️ Không gửi được dữ liệu lead:", err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const chatContainer = document.getElementById("chatbot-container");
    const chatToggle = document.getElementById("chat-toggle");
    const closeBtn = document.getElementById("chat-close");
    const refreshBtn = document.getElementById("chat-refresh");
    const refreshIcon = document.getElementById("refresh-icon");
    const messagesEl = document.getElementById("chat-messages");
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("chat-send");

    // Setting options for MarkedJS
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            breaks: true,
            gfm: true
        });
    }

    // Nút mở/đóng chatbot (Floating Chatbot)
    chatToggle.addEventListener("click", () => {
        chatContainer.classList.remove("hidden");
        chatToggle.style.transform = "scale(0)";
        
        // Nếu mới mở, chào hỏi
        if (chatHistory.length === 0) {
            appendMessage('bot', DEFAULT_GREETING);
        }
    });

    closeBtn.addEventListener("click", () => {
        chatContainer.classList.add("hidden");
        chatToggle.style.transform = "scale(1)";
    });

    // Handle Nút Refresh
    refreshBtn.addEventListener("click", () => {
        // Animation 500ms
        refreshIcon.classList.add("animate-spin-fast");
        setTimeout(() => {
            refreshIcon.classList.remove("animate-spin-fast");
        }, 500);

        // Reset dữ liệu chat
        messagesEl.innerHTML = "";
        chatHistory = [];
        
        // Hiển thị lại tin nhắn chào mặc định
        appendMessage('bot', DEFAULT_GREETING);
    });

    // Handle Gửi Tin Nhắn
    const sendMessage = async () => {
        const text = chatInput.value.trim();
        if (!text) return;

        chatInput.value = ""; // Xóa input
        
        // Hiển thị và lưu log User request
        appendMessage('user', text);
        chatHistory.push({ role: 'user', content: text });

        // Hiển thị 3 dấu chấm Typing...
        const typingEl = showTyping();

        try {
            // POST to Chatbot Backend (Vercel)
            const response = await fetch('/api/chat.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatHistory })
            });

            const data = await response.json();
            typingEl.remove();

            if (data.reply) {
                const cleanReply = processAIResponse(data.reply, chatHistory);
                appendMessage('bot', cleanReply);
                chatHistory.push({ role: 'assistant', content: data.reply });
            } else if (data.error) {
                appendMessage('bot', data.error);
            } else {
                appendMessage('bot', "Xin lỗi, đã có lỗi kết nối.");
            }
        } catch (error) {
            typingEl.remove();
            appendMessage('bot', "Không thể kết nối đến máy chủ.");
        }
    };

    sendBtn.addEventListener("click", sendMessage);
    
    // Gửi bằng phím Enter (không cần shift)
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Helpers function
    function appendMessage(sender, text) {
        const wrapper = document.createElement("div");
        wrapper.className = `message-wrapper ${sender}`;

        const div = document.createElement("div");
        div.className = `message ${sender} chat-markdown`;
        
        if (sender === 'bot') {
            // Dùng MarkedJs để parse
            div.innerHTML = marked.parse(text);
        } else {
            // User message escape để an toàn
            div.textContent = text;
        }

        wrapper.appendChild(div);
        messagesEl.appendChild(wrapper);
        scrollToBottom();
    }

    function showTyping() {
        const wrapper = document.createElement("div");
        wrapper.className = "message-wrapper bot";

        const div = document.createElement("div");
        div.className = "typing-indicator";
        div.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
        
        wrapper.appendChild(div);
        messagesEl.appendChild(wrapper);
        scrollToBottom();
        return wrapper;
    }

    function scrollToBottom() {
        // Auto scroll hiệu ứng mượt
        messagesEl.scrollTo({
            top: messagesEl.scrollHeight,
            behavior: "smooth"
        });
    }
});
