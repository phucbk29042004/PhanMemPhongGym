(function () {
  const PAGE_TITLES = {
    'dashboard': 'Tổng quan', 'members-list': 'Danh sách hội viên',
    'member-add': 'Thêm mới hội viên', 'checkin': 'Vào - Ra',
    'expired': 'Danh sách hết hạn', 'pt-training': 'Lịch đào tạo PT',
    'pt-register': 'Đăng ký lịch tập PT', 'packages': 'Danh sách gói tập',
    'birthday': 'Sinh nhật hội viên',
  };
  const SUB_PAGES = ['members-list', 'member-add', 'checkin', 'expired', 'pt-training', 'pt-register', 'packages', 'birthday'];

  // ===== NAVIGATE =====
  window.GymApp.navigate = function (pageName) {
    const page = window.GymApp.pages[pageName];
    if (!page) return;

    if (window.GymApp._activeChart) {
      window.GymApp._activeChart.destroy();
      window.GymApp._activeChart = null;
    }

    // Render content
    document.getElementById('content-area').innerHTML = page.render();

    // Update nav active state
    document.querySelectorAll('[data-page]').forEach(btn => {
      btn.classList.remove('nav-active', 'text-brand-primary', 'font-bold', 'bg-[#e7f5e9]');
      btn.classList.add('text-on-surface-variant');
      if (btn.dataset.page === pageName) {
        btn.classList.remove('text-on-surface-variant');
        btn.classList.add('nav-active', 'text-brand-primary', 'font-bold');
      }
    });

    // Auto-open accordion for sub-pages
    if (SUB_PAGES.includes(pageName)) _openAccordion('hoi-vien');

    window.GymApp.currentPage = pageName;

    // Birthday: render page immediately, then auto-run celebration effect.
    if (pageName === 'birthday') {
      if (page.init) setTimeout(() => page.init(), 50);
      setTimeout(() => window.GymApp.showBirthdayEffect(), 120);
      return;
    }

    if (page.init) setTimeout(() => page.init(), 50);
  };

  // ===== ACCORDION =====
  function _openAccordion(id) {
    const content = document.getElementById('accordion-' + id);
    const trigger = document.querySelector('[data-accordion="' + id + '"]');
    if (!content || !trigger) return;
    content.style.maxHeight = content.scrollHeight + 400 + 'px';
    const arrow = trigger.querySelector('.arrow-icon');
    if (arrow) arrow.style.transform = 'rotate(90deg)';
    trigger.classList.add('text-brand-primary');
    trigger.classList.remove('text-on-surface-variant');
  }

  function _toggleAccordion(id) {
    const content = document.getElementById('accordion-' + id);
    const trigger = document.querySelector('[data-accordion="' + id + '"]');
    if (!content || !trigger) return;
    
    // Kiểm tra trạng thái thực tế dựa trên maxHeight
    const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';
    
    if (isOpen) {
      content.style.maxHeight = '0px';
      const arrow = trigger.querySelector('.arrow-icon');
      if (arrow) arrow.style.transform = 'rotate(0deg)';
      trigger.classList.remove('text-brand-primary');
      trigger.classList.add('text-on-surface-variant');
    } else {
      // Tính toán chiều cao thực tế của nội dung bên trong
      content.style.maxHeight = (content.scrollHeight + 50) + 'px';
      const arrow = trigger.querySelector('.arrow-icon');
      if (arrow) arrow.style.transform = 'rotate(90deg)';
      trigger.classList.add('text-brand-primary');
      trigger.classList.remove('text-on-surface-variant');
    }
  }

  // ===== SIDEBAR TOGGLE =====
  function _toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('sidebar-collapsed');
  }

  // ===== BIRTHDAY EFFECT =====
  window.GymApp.showBirthdayEffect = function (callback) {
    document.getElementById('birthday-auto-effect-layer')?.remove();

    const today = new Date();
    const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const count = (window.GymApp.data.members || []).filter(m => {
      if (!m.ngay_sinh) return false;
      const p = m.ngay_sinh.split('-'); return `${p[1]}-${p[2]}` === todayMD;
    }).length;

    const colors = ['#1D9336', '#a52d59', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];

    const layer = document.createElement('div');
    layer.id = 'birthday-auto-effect-layer';
    layer.style.cssText = 'position:fixed;inset:0;z-index:9997;pointer-events:none;overflow:hidden;';
    document.body.appendChild(layer);

    for (let i = 0; i < 140; i++) {
      const el = document.createElement('div');
      const size = Math.random() * 10 + 6;
      const dur = Math.random() * 2.5 + 2;
      const delay = Math.random() * 1.5;
      el.className = 'confetti-piece';
      el.style.cssText = `left:${Math.random() * 100}vw;top:-20px;width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random() * colors.length)]};border-radius:${Math.random() > 0.5 ? '50%' : '3px'};animation-duration:${dur}s,${dur * 0.6}s;animation-delay:${delay}s,${delay}s;`;
      layer.appendChild(el);
    }

    for (let i = 0; i < 60; i++) {
      const bubble = document.createElement('span');
      const size = 18 + Math.random() * 54;
      bubble.className = 'birthday-bubble';
      bubble.style.cssText = `
        left:${Math.random() * 100}vw;bottom:-80px;width:${size}px;height:${size}px;
        border-color:${colors[Math.floor(Math.random() * colors.length)]};
        animation-duration:${3 + Math.random() * 3}s;
        animation-delay:${Math.random() * 0.7}s;
      `;
      layer.appendChild(bubble);
    }

    for (let burst = 0; burst < 4; burst++) {
      const x = window.innerWidth * (0.18 + Math.random() * 0.64);
      const y = window.innerHeight * (0.18 + Math.random() * 0.42);
      for (let i = 0; i < 28; i++) {
        const spark = document.createElement('span');
        const angle = Math.random() * Math.PI * 2;
        const distance = 70 + Math.random() * 190;
        const size = 4 + Math.random() * 8;
        spark.className = 'birthday-firework-spark';
        spark.style.cssText = `
          left:${x}px;top:${y}px;width:${size}px;height:${size}px;
          background:${colors[Math.floor(Math.random() * colors.length)]};
          --tx:${Math.cos(angle) * distance}px;--ty:${Math.sin(angle) * distance}px;
          animation-delay:${burst * 0.28 + Math.random() * 0.12}s;
        `;
        layer.appendChild(spark);
      }
    }

    const banner = document.createElement('div');
    banner.className = 'birthday-burst-banner';
    banner.innerHTML = `
      <span class="material-symbols-outlined">celebration</span>
      <strong>Không khí sinh nhật</strong>
      <span>${count > 0 ? `${count} hội viên sinh nhật hôm nay` : 'Lịch sinh nhật đã sẵn sàng'}</span>
    `;
    layer.appendChild(banner);

    setTimeout(() => layer.remove(), 6200);
    if (callback) callback();
  };

  // ===== MODAL =====
  window.GymApp.showModal = function (htmlContent) {
    document.getElementById('gym-modal')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'gym-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);backdrop-filter:blur(3px);padding:20px;';
    overlay.innerHTML = `
      <div class="modal-card" style="background:#f7f9ff;border-radius:16px;max-width:640px;width:100%;max-height:90vh;overflow-y:auto;position:relative;box-shadow:0 25px 60px rgba(0,0,0,0.25);">
        <button id="close-modal" style="position:absolute;top:12px;right:12px;background:transparent;border:none;cursor:pointer;z-index:1;" title="Đóng">
          <span class="material-symbols-outlined" style="color:#6e7a6b;font-size:22px;">close</span>
        </button>
        ${htmlContent}
      </div>`;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('close-modal').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    const escHandler = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);
  };

  // ===== AVATAR WITH IMAGE =====
  window.GymApp.avatarImg = function (avatarUrl, name, size = 'md') {
    const dim = size === 'sm' ? 32 : size === 'lg' ? 48 : 36;
    const cls = `border border-outline-variant flex-shrink-0 avatar-img`;
    if (avatarUrl) {
      return `<img src="${avatarUrl}" alt="${name}" width="${dim}" height="${dim}" style="width:${dim}px;height:${dim}px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid #becab9;" loading="lazy">`;
    }
    return window.GymApp.avatarInitials(name, size);
  };

  // ===== UTILITIES =====
  window.GymApp.toast = function (message, type = 'success') {
    const colors = { success: 'background:#1D9336', error: 'background:#ba1a1a', info: 'background:#575f67' };
    const icons = { success: 'check_circle', error: 'error', info: 'info' };
    const el = document.createElement('div');
    el.className = 'gym-toast';
    el.style.cssText = `position:fixed;bottom:20px;right:20px;z-index:9997;${colors[type]};color:#fff;padding:10px 20px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-size:14px;display:flex;align-items:center;gap:8px;font-weight:500;`;
    el.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px">${icons[type]}</span>${message}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  window.GymApp.formatCurrency = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  window.GymApp.formatDate = d => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  window.GymApp.statusBadge = function (status) {
    const map = {
      active: { cls: 'background:#e7f5e9;color:#1D9336', label: 'Hoạt động' },
      inactive: { cls: 'background:#e0e3e8;color:#3f4a3c', label: 'Không HĐ' },
      expired: { cls: 'background:#ffdad6;color:#93000a', label: 'Hết hạn' },
      pending: { cls: 'background:#fff3e0;color:#e65100', label: 'Chờ XN' },
      confirmed: { cls: 'background:#e7f5e9;color:#1D9336', label: 'Đã XN' },
    };
    const s = map[status] || { cls: 'background:#ebeef3;color:#181c20', label: status };
    return `<span style="padding:2px 8px;border-radius:999px;font-size:9.6px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;${s.cls}">${s.label}</span>`;
  };

  window.GymApp.avatarInitials = function (name, size = 'md') {
    const parts = (name || '').trim().split(' ');
    const initials = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : (name || '??').slice(0, 2).toUpperCase();
    const bgColors = ['#006b20', '#a52d59', '#575f67', '#03872c', '#005317', '#1D9336'];
    const bg = bgColors[((name || '').charCodeAt(0) || 0) % bgColors.length];
    const dim = size === 'sm' ? 32 : size === 'lg' ? 48 : 36;
    const fs = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;
    return `<div style="width:${dim}px;height:${dim}px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${fs}px;flex-shrink:0;">${initials}</div>`;
  };

  // Phân trang helper
  window.GymApp.renderPagination = function (page, total, perPage, onPageChange) {
    const totalPages = Math.ceil(total / perPage);
    if (totalPages <= 1) return '';
    const start = (page - 1) * perPage + 1;
    const end = Math.min(page * perPage, total);
    const pages = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pages.push(i);

    return `
      <div class="flex items-center justify-between px-loose py-standard bg-surface-container-low border-t border-outline-variant">
        <span style="font-size:12px;color:#3f4a3c;">Hiển thị ${start}–${end} / ${total}</span>
        <div style="display:flex;gap:4px;align-items:center;">
          <button data-pg="${page - 1}" ${page === 1 ? 'disabled' : ''} style="padding:4px 6px;border:1px solid #becab9;border-radius:4px;cursor:${page === 1 ? 'not-allowed' : 'pointer'};opacity:${page === 1 ? '0.4' : '1'};background:#fff;">
            <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;">chevron_left</span>
          </button>
          ${pages.map(p => `<button data-pg="${p}" style="width:28px;height:28px;border-radius:4px;border:${p === page ? 'none' : '1px solid #becab9'};background:${p === page ? '#1D9336' : '#fff'};color:${p === page ? '#fff' : '#181c20'};font-weight:${p === page ? '700' : '400'};font-size:12px;cursor:pointer;">${p}</button>`).join('')}
          <button data-pg="${page + 1}" ${page >= totalPages ? 'disabled' : ''} style="padding:4px 6px;border:1px solid #becab9;border-radius:4px;cursor:${page >= totalPages ? 'not-allowed' : 'pointer'};opacity:${page >= totalPages ? '0.4' : '1'};background:#fff;">
            <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;">chevron_right</span>
          </button>
        </div>
      </div>
    `;
  };

  // ===== THEME =====
  function _applyTheme(t) {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('gym-theme', t);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = t === 'dark' ? 'light_mode' : 'dark_mode';
  }

  // ===== DATA SYNC =====
  window.GymApp.fetchInitialData = async function () {
    try {
      const [membersRes, ptsRes, packagesRes, dashboardRes] = await Promise.all([
        window.GymApp.api.get('/members?limit=100'),
        window.GymApp.api.get('/trainers'),
        window.GymApp.api.get('/packages'),
        window.GymApp.api.get('/revenue/dashboard')
      ]);

      if (membersRes?.success) {
        // Backend trả về { data: [...], pagination: {...} } cho members
        window.GymApp.data.members = Array.isArray(membersRes.data) ? membersRes.data : (membersRes.data.data || []);
      }
      if (ptsRes?.success) {
        window.GymApp.data.pts = Array.isArray(ptsRes.data) ? ptsRes.data : (ptsRes.data.data || []);
      }
      if (packagesRes?.success) {
        window.GymApp.data.packages = Array.isArray(packagesRes.data) ? packagesRes.data : (packagesRes.data.data || []);
      }
      if (dashboardRes?.success) window.GymApp.data.stats = dashboardRes.data;

      console.log('Global Data Synced with SQL');
    } catch (err) {
      console.error('Failed to sync global data', err);
    }
  };

  // ===== DOM READY =====
  document.addEventListener('DOMContentLoaded', async function () {
    console.log('Paradise GYM: DOMContentLoaded');
    
    // 1. Kiểm tra xác thực (Auth)
    try {
        const isAuthenticated = await window.GymApp.auth.init();
        if (!isAuthenticated) return;
    } catch (e) {
        console.error('Auth check failed:', e);
        // Nếu auth.js chưa load kịp hoặc bị lỗi, cho phép chạy tiếp nhưng báo lỗi
    }

    // 2. Đồng bộ dữ liệu SQL
    try {
        await window.GymApp.fetchInitialData();
    } catch (e) {
        console.error('Initial data fetch failed:', e);
    }

    // 3. Áp dụng Theme
    _applyTheme(localStorage.getItem('gym-theme') || 'light');

    // 4. Các sự kiện cố định
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      _applyTheme(isDark ? 'light' : 'dark');
    });

    const logoutBtn = document.querySelector('button[title="Đăng xuất"]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn đăng xuất?')) window.GymApp.auth.logout();
      });
    }

    // 5. Click delegation (Cực kỳ quan trọng)
    document.addEventListener('click', function (e) {
      // Sidebar Toggle
      const sidebarToggle = e.target.closest('#sidebar-toggle');
      if (sidebarToggle) {
        _toggleSidebar();
        return;
      }

      // Accordion
      const accBtn = e.target.closest('[data-accordion]');
      if (accBtn) {
        e.preventDefault();
        _toggleAccordion(accBtn.dataset.accordion);
        return;
      }

      // Navigate
      const navBtn = e.target.closest('[data-page]');
      if (navBtn) {
        const page = navBtn.dataset.page;
        if (page) {
          // Xử lý đóng sidebar trên mobile sau khi click
          if (window.innerWidth < 1024) {
             const sidebar = document.getElementById('sidebar');
             if (sidebar && !sidebar.classList.contains('-translate-x-full')) _toggleSidebar();
          }
          
          window.GymApp.navigate(page);
          return;
        }
      }

      // Pagination
      const pgBtn = e.target.closest('[data-pg]');
      if (pgBtn && !pgBtn.disabled) {
        const pg = parseInt(pgBtn.dataset.pg);
        if (window.GymApp._pgHandler && pg > 0) window.GymApp._pgHandler(pg);
      }
    });

    // 6. Điều hướng mặc định
    console.log('Paradise GYM: Ready');
    window.GymApp.navigate('dashboard');
  });

})();
