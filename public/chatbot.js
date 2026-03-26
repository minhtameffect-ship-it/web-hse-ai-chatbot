let chatHistory = [];
const DEFAULT_GREETING = "Xin chào! Tôi là trợ lý ảo AI chuyên biệt. Chuyên gia có thể hỗ trợ được gì cho bạn hôm nay?";

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
            // POST to Chatbot Backend
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatHistory })
            });

            const data = await response.json();
            typingEl.remove();

            if (data.reply) {
                appendMessage('bot', data.reply);
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
