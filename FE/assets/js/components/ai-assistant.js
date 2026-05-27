(function () {
  // Đợi DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    // Chỉ khởi tạo nếu người dùng đã đăng nhập (có token)
    const token = localStorage.getItem('gym-token');
    if (!token) return;

    // Tạo các style bổ sung bằng CSS
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .ai-chat-open {
        animation: slideInUp 0.25s forwards cubic-bezier(0.4, 0, 0.2, 1);
      }
      .ai-chat-close {
        animation: slideOutDown 0.25s forwards cubic-bezier(0.4, 0, 0.2, 1);
      }
      @keyframes slideInUp {
        from { opacity: 0; transform: translateY(15px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes slideOutDown {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to { opacity: 0; transform: translateY(15px) scale(0.97); }
      }
      .dot-flashing {
        position: relative;
        width: 6px;
        height: 6px;
        border-radius: 5px;
        background-color: #1D9336;
        color: #1D9336;
        animation: dotFlashing 1s infinite linear alternate;
        animation-delay: .5s;
      }
      .dot-flashing::before, .dot-flashing::after {
        content: '';
        display: inline-block;
        position: absolute;
        top: 0;
      }
      .dot-flashing::before {
        left: -12px;
        width: 6px;
        height: 6px;
        border-radius: 5px;
        background-color: #1D9336;
        color: #1D9336;
        animation: dotFlashing 1s infinite alternate;
        animation-delay: 0s;
      }
      .dot-flashing::after {
        left: 12px;
        width: 6px;
        height: 6px;
        border-radius: 5px;
        background-color: #1D9336;
        color: #1D9336;
        animation: dotFlashing 1s infinite alternate;
        animation-delay: 1s;
      }
      @keyframes dotFlashing {
        0% { background-color: #1D9336; }
        50%, 100% { background-color: rgba(29, 147, 54, 0.2); }
      }
    `;
    document.head.appendChild(styleEl);

    // HTML Structure for Chat Bubble & Chat Window
    const container = document.createElement('div');
    container.id = 'ai-assistant-container';
    container.className = 'fixed bottom-6 right-6 z-[9990] flex flex-col items-end font-sans';
    container.innerHTML = `
      <!-- Chat Window (hidden by default) -->
      <!-- Đặt bottom sát góc bottom-0 để thay thế vị trí nút toggle khi ẩn -->
      <div id="ai-chat-window" class="hidden w-[360px] h-[520px] max-h-[85vh] bg-surface-container-lowest border border-outline-variant/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
        <!-- Header -->
        <div class="px-5 py-4 bg-brand-primary text-white flex items-center justify-between shadow-md">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
              <span class="material-symbols-outlined text-white text-xl">forum</span>
            </div>
            <div>
              <h4 class="text-xs font-black tracking-tight m-0">Trợ lý ảo Paradise AI</h4>
              <div class="flex items-center gap-1 mt-0.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-[9.5px] text-emerald-100 font-bold tracking-wide uppercase">Đang hoạt động</span>
              </div>
            </div>
          </div>
          <button id="btn-ai-chat-close" class="text-white hover:bg-white/10 transition-colors p-1.5 rounded-xl flex items-center justify-center" title="Thu nhỏ">
            <span class="material-symbols-outlined text-lg">expand_more</span>
          </button>
        </div>

        <!-- Chat Messages -->
        <div id="ai-chat-messages" class="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f8faf9] dark:bg-[#121212] flex flex-col" style="scrollbar-width: thin; scrollbar-color: var(--outline-variant) transparent;">
          <!-- Welcome Message -->
          <div class="flex gap-2 max-w-[85%] self-start">
            <div class="w-7 h-7 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-brand-primary text-xs">forum</span>
            </div>
            <div class="bg-white dark:bg-[#1e1e1e] border border-outline-variant/30 text-on-surface text-xs rounded-2xl px-3.5 py-2 shadow-sm leading-relaxed">
              Xin chào! Mình là <strong>Trợ lý ảo Paradise AI</strong>. Mình hỗ trợ tư vấn cá nhân hóa về gym, lịch tập và dinh dưỡng. Hôm nay bạn cần hỗ trợ gì?
            </div>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div id="ai-typing-indicator" class="hidden px-4 py-2 flex gap-2 max-w-[85%] self-start">
          <div class="w-7 h-7 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-brand-primary text-xs">forum</span>
          </div>
          <div class="bg-white dark:bg-[#1e1e1e] border border-outline-variant/30 rounded-2xl px-4 py-3 shadow-sm flex items-center justify-center min-w-[50px]">
            <div class="dot-flashing"></div>
          </div>
        </div>

        <!-- Input Footer -->
        <div class="p-3 border-t border-outline-variant/40 bg-surface-container-low flex gap-2 items-center">
          <input id="ai-chat-input" type="text" placeholder="Hỏi về lịch tập, thực đơn dinh dưỡng..." class="flex-1 bg-white dark:bg-[#1e1e1e] border border-outline-variant/50 text-on-surface text-xs rounded-xl px-4 py-2 outline-none focus:border-brand-primary transition-all" />
          <button id="btn-ai-chat-send" class="w-8 h-8 rounded-xl bg-brand-primary hover:bg-[#157a2a] text-white flex items-center justify-center active:scale-95 transition-all shadow-md">
            <span class="material-symbols-outlined text-base">send</span>
          </button>
        </div>
      </div>

      <!-- Floating Bubble Button (Sử dụng icon chat bubble thay thế hình robot) -->
      <button id="btn-ai-chat-toggle" class="w-14 h-14 rounded-full bg-brand-primary hover:bg-[#157a2a] text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer relative" title="Trợ lý ảo AI">
        <span class="material-symbols-outlined text-2xl">chat</span>
        <span class="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
      </button>
    `;

    document.body.appendChild(container);

    // DOM Elements
    const chatWindow = document.getElementById('ai-chat-window');
    const chatToggle = document.getElementById('btn-ai-chat-toggle');
    const chatClose = document.getElementById('btn-ai-chat-close');
    const chatInput = document.getElementById('ai-chat-input');
    const chatSend = document.getElementById('btn-ai-chat-send');
    const chatMessages = document.getElementById('ai-chat-messages');
    const typingIndicator = document.getElementById('ai-typing-indicator');

    // Toggle Chat Window & Hide/Show Toggle Button
    const openChat = () => {
      // Ẩn nút toggle tròn
      chatToggle.classList.add('hidden');
      
      // Hiện và chạy animation mở chatbox
      chatWindow.classList.remove('hidden');
      chatWindow.classList.remove('ai-chat-close');
      chatWindow.classList.add('ai-chat-open');
      chatInput.focus();

      // Xóa dấu chấm đỏ thông báo
      const dot = chatToggle.querySelector('.bg-red-500');
      if (dot) dot.remove();
    };

    const closeChat = () => {
      // Chạy animation đóng
      chatWindow.classList.remove('ai-chat-open');
      chatWindow.classList.add('ai-chat-close');
      
      setTimeout(() => {
        chatWindow.classList.add('hidden');
        // Hiện lại nút toggle tròn sau khi đóng xong
        chatToggle.classList.remove('hidden');
      }, 250);
    };

    chatToggle.addEventListener('click', openChat);
    chatClose.addEventListener('click', closeChat);

    // Send Message
    const sendMessage = async () => {
      const text = chatInput.value.trim();
      if (!text) return;

      // Append User Message
      appendMessage(text, 'user');
      chatInput.value = '';

      // Show Typing Indicator
      typingIndicator.classList.remove('hidden');
      chatMessages.appendChild(typingIndicator); // Chuyển indicator xuống dưới cùng
      scrollToBottom();

      try {
        const response = await window.GymApp.api.post('/assistant/chat', { message: text });
        // Hide Typing Indicator
        typingIndicator.classList.add('hidden');

        if (response && response.success && response.data?.reply) {
          appendMessage(response.data.reply, 'ai');
        } else {
          appendMessage('Rất tiếc, mình gặp sự cố khi xử lý câu hỏi này. Bạn thử lại nhé!', 'ai');
        }
      } catch (err) {
        typingIndicator.classList.add('hidden');
        appendMessage('Không thể kết nối với Trợ lý AI. Vui lòng kiểm tra lại kết nối mạng.', 'ai');
      }
      scrollToBottom();
    };

    // Append Message helper
    const appendMessage = (text, sender) => {
      const msgWrap = document.createElement('div');
      msgWrap.className = sender === 'user' ? 'flex gap-2 max-w-[85%] self-end flex-row-reverse' : 'flex gap-2 max-w-[85%] self-start';

      const avatarHtml = sender === 'user'
        ? `<div class="w-7 h-7 rounded-full bg-brand-primary text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">Tôi</div>`
        : `<div class="w-7 h-7 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center flex-shrink-0"><span class="material-symbols-outlined text-brand-primary text-xs">forum</span></div>`;

      const bubbleCls = sender === 'user'
        ? 'bg-brand-primary text-white text-xs rounded-2xl px-3.5 py-2 shadow-sm leading-relaxed'
        : 'bg-white dark:bg-[#1e1e1e] border border-outline-variant/30 text-on-surface text-xs rounded-2xl px-3.5 py-2 shadow-sm leading-relaxed';

      msgWrap.innerHTML = `
        ${avatarHtml}
        <div class="${bubbleCls}">
          ${formatText(text)}
        </div>
      `;

      chatMessages.appendChild(msgWrap);
      scrollToBottom();
    };

    // Simple formatting for bold, bullet points, line breaks
    const formatText = (text) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/- (.*?)(<br>|$)/g, '• $1$2');
    };

    const scrollToBottom = () => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    // Event Listeners
    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  });
})();
