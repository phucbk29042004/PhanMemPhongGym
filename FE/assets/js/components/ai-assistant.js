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
        <div class="px-5 py-4 bg-brand-primary text-white flex items-center justify-between shadow-md cursor-grab active:cursor-grabbing">
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
          <div class="flex items-center gap-1">
            <button id="btn-ai-chat-clear" class="text-white hover:bg-white/10 transition-colors p-1.5 rounded-xl flex items-center justify-center" title="Xóa lịch sử">
              <span class="material-symbols-outlined text-lg">delete</span>
            </button>
            <button id="btn-ai-chat-close" class="text-white hover:bg-white/10 transition-colors p-1.5 rounded-xl flex items-center justify-center" title="Thu nhỏ">
              <span class="material-symbols-outlined text-lg">expand_more</span>
            </button>
          </div>
        </div>

        <!-- Chat Messages -->
        <div id="ai-chat-messages" class="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f8faf9] dark:bg-[#121212] flex flex-col" style="scrollbar-width: thin; scrollbar-color: var(--outline-variant) transparent;">
          <!-- Messages will be loaded dynamically -->
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
      <button id="btn-ai-chat-toggle" class="w-14 h-14 rounded-full bg-brand-primary hover:bg-[#157a2a] text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-grab active:cursor-grabbing relative" title="Trợ lý ảo AI">
        <span class="material-symbols-outlined text-2xl">chat</span>
        <span class="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
      </button>
    `;

    document.body.appendChild(container);

    // DOM Elements
    const chatWindow = document.getElementById('ai-chat-window');
    const chatToggle = document.getElementById('btn-ai-chat-toggle');
    const chatClose = document.getElementById('btn-ai-chat-close');
    const chatClear = document.getElementById('btn-ai-chat-clear');
    const chatInput = document.getElementById('ai-chat-input');
    const chatSend = document.getElementById('btn-ai-chat-send');
    const chatMessages = document.getElementById('ai-chat-messages');
    const typingIndicator = document.getElementById('ai-typing-indicator');

    // Chat History Management
    let chatHistory = [];

    const loadHistory = () => {
      const stored = localStorage.getItem('gym-chat-history');
      if (stored) {
        try {
          chatHistory = JSON.parse(stored);
        } catch (e) {
          chatHistory = [];
        }
      }
      
      if (!chatHistory || chatHistory.length === 0) {
        chatHistory = [{
          text: "Xin chào! Mình là **Trợ lý ảo Paradise AI**. Mình hỗ trợ tư vấn cá nhân hóa về gym, lịch tập và dinh dưỡng. Hôm nay bạn cần hỗ trợ gì?",
          sender: "ai"
        }];
        localStorage.setItem('gym-chat-history', JSON.stringify(chatHistory));
      }

      chatMessages.innerHTML = '';
      chatHistory.forEach(msg => {
        appendMessage(msg.text, msg.sender, false);
      });
    };

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

    chatToggle.addEventListener('click', (e) => {
      if (hasMoved) {
        hasMoved = false; // reset
        return;
      }
      openChat();
    });
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
        const chi_nhanh = window.GymApp?.selectedBranch || '';
        const response = await window.GymApp.api.post('/assistant/chat', { message: text, chi_nhanh });
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
    const appendMessage = (text, sender, save = true) => {
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

      if (save) {
        chatHistory.push({ text, sender });
        localStorage.setItem('gym-chat-history', JSON.stringify(chatHistory));
      }
    };

    // Simple formatting for bold, bullet points, line breaks, and paragraphs
    const formatText = (text) => {
      const lines = text.split('\n');
      let html = '';
      let inList = false;

      lines.forEach((line) => {
        const trimmed = line.trim();
        // Kiểm tra xem dòng có phải là một gạch đầu dòng danh sách không
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          if (!inList) {
            html += '<ul class="list-disc pl-5 my-1.5 space-y-1">';
            inList = true;
          }
          const content = trimmed.replace(/^[-*•]\s+/, '');
          html += `<li>${content}</li>`;
        } else {
          if (inList) {
            html += '</ul>';
            inList = false;
          }
          if (trimmed === '') {
            html += '<div class="h-2"></div>'; // Dòng trống tạo khoảng giãn cách nhỏ
          } else {
            html += `<p class="mb-1.5 last:mb-0">${line}</p>`;
          }
        }
      });

      if (inList) {
        html += '</ul>';
      }

      // Apply formatting for bold and italic
      return html
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
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

    chatClear.addEventListener('click', () => {
      const confirmClear = confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện không?');
      if (confirmClear) {
        localStorage.removeItem('gym-chat-history');
        loadHistory();
        if (window.GymApp && typeof window.GymApp.toast === 'function') {
          window.GymApp.toast('Đã xóa lịch sử trò chuyện.', 'info');
        }
      }
    });

    // Drag and drop implementation
    let isMouseDown = false;
    let dragThreshold = 5; // pixels
    let hasMoved = false;
    let startX, startY;
    let initialLeft, initialTop;

    const onMouseDown = (e) => {
      // Don't drag if clicking buttons, inputs, etc.
      if (
        e.target.closest('#btn-ai-chat-close') || 
        e.target.closest('#btn-ai-chat-clear') || 
        e.target.closest('input') || 
        e.target.closest('#btn-ai-chat-send') || 
        e.target.closest('a')
      ) {
        return;
      }

      const isHeader = e.target.closest('#ai-chat-window > div:first-child');
      const isToggleBtn = e.target.closest('#btn-ai-chat-toggle');
      
      if (!isHeader && !isToggleBtn) return;

      isMouseDown = true;
      hasMoved = false;
      
      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
      
      startX = clientX;
      startY = clientY;
      
      const rect = container.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      
      if (e.type === 'touchstart') {
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd);
      } else {
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      }
    };

    const onMouseMove = (e) => {
      if (!isMouseDown) return;
      
      const clientX = e.clientX;
      const clientY = e.clientY;
      
      const dx = clientX - startX;
      const dy = clientY - startY;
      
      if (!hasMoved && Math.sqrt(dx*dx + dy*dy) > dragThreshold) {
        hasMoved = true;
        const rect = container.getBoundingClientRect();
        container.style.bottom = 'auto';
        container.style.right = 'auto';
        container.style.left = rect.left + 'px';
        container.style.top = rect.top + 'px';
        container.classList.add('cursor-grabbing');
      }
      
      if (hasMoved) {
        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;
        
        // Restrict within viewport
        const rect = container.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;
        
        newLeft = Math.max(0, Math.min(newLeft, maxX));
        newTop = Math.max(0, Math.min(newTop, maxY));
        
        container.style.left = newLeft + 'px';
        container.style.top = newTop + 'px';
        
        e.preventDefault();
      }
    };

    const onMouseUp = (e) => {
      isMouseDown = false;
      container.classList.remove('cursor-grabbing');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    const onTouchMove = (e) => {
      if (!isMouseDown) return;
      
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;
      
      const dx = clientX - startX;
      const dy = clientY - startY;
      
      if (!hasMoved && Math.sqrt(dx*dx + dy*dy) > dragThreshold) {
        hasMoved = true;
        const rect = container.getBoundingClientRect();
        container.style.bottom = 'auto';
        container.style.right = 'auto';
        container.style.left = rect.left + 'px';
        container.style.top = rect.top + 'px';
      }
      
      if (hasMoved) {
        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;
        
        const rect = container.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;
        
        newLeft = Math.max(0, Math.min(newLeft, maxX));
        newTop = Math.max(0, Math.min(newTop, maxY));
        
        container.style.left = newLeft + 'px';
        container.style.top = newTop + 'px';
        
        if (e.cancelable) e.preventDefault();
      }
    };

    const onTouchEnd = (e) => {
      isMouseDown = false;
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('touchstart', onMouseDown, { passive: true });

    // Load Chat History on startup
    loadHistory();
  });
})();
