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

    // Dọn dẹp trang hiện tại (chart, timer, v.v.)
    const currentPage = window.GymApp.pages[window.GymApp.currentPage];
    if (currentPage?.destroy) currentPage.destroy();

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

  window.GymApp.formatEnumLabel = function (value) {
    const map = {
      con_han: 'Còn hạn',
      sap_het_han: 'Sắp hết hạn',
      het_han: 'Hết hạn',
      chua_dang_ky: 'Chưa đăng ký',
      dang_hoat_dong: 'Đang hoạt động',
      hoat_dong: 'Hoạt động',
      dang_ban: 'Đang bán',
      dang_tap: 'Đang tập',
      da_ket_thuc: 'Đã kết thúc',
      cho_kich_hoat: 'Chờ kích hoạt',
      cho_tap: 'Chờ tập',
      da_tap: 'Đã tập',
      da_xac_nhan: 'Đã xác nhận',
      da_huy: 'Đã hủy',
      hoan_tac: 'Hoàn tác',
      vang: 'Vắng',
      vao: 'Vào',
      ra: 'Ra',
      ca_nhan: 'Cá nhân',
      nhom: 'Nhóm',
      hoi_vien: 'Hội viên',
      pt: 'Huấn luyện viên',
      le_tan: 'Lễ tân',
      nhan_vien: 'Nhân viên',
      admin: 'Quản trị viên',
      thuong: 'Thường',
      Normal: 'Thường',
      Student: 'Sinh viên',
      vip: 'VIP',
      premium: 'Premium',
      the_tu: 'Thẻ từ',
      qr_code: 'QR Code',
      khuon_mat: 'Khuôn mặt',
      thu_cong: 'Thủ công',
      tien_mat: 'Tiền mặt',
      chuyen_khoan: 'Chuyển khoản',
      the: 'Thẻ',
      vi_dien_tu: 'Ví điện tử',
      paid: 'Đã thanh toán',
      debt: 'Còn nợ',
      free: 'Miễn phí',
      active: 'Hoạt động',
      inactive: 'Không hoạt động',
      expired: 'Hết hạn',
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
    };
    if (!value) return '—';
    return map[value] || String(value).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  window.GymApp.statusBadge = function (status) {
    const map = {
      // Trạng thái hội viên (từ BE)
      con_han:        { cls: 'background:#e7f5e9;color:#1D9336',  label: 'Còn hạn' },
      sap_het_han:    { cls: 'background:#fff8e1;color:#f57f17',  label: 'Sắp hết hạn' },
      het_han:        { cls: 'background:#ffdad6;color:#ba1a1a',  label: 'Hết hạn' },
      chua_dang_ky:   { cls: 'background:#e0e3e8;color:#3f4a3c',  label: 'Chưa ĐK' },
      // Trạng thái lịch tập PT
      cho_tap:        { cls: 'background:#e8def8;color:#6750a4',  label: 'Chờ tập' },
      da_tap:         { cls: 'background:#e7f5e9;color:#1D9336',  label: 'Đã tập' },
      da_xac_nhan:    { cls: 'background:#e7f5e9;color:#1D9336',  label: 'Đã XN' },
      da_huy:         { cls: 'background:#ffdad6;color:#ba1a1a',  label: 'Đã hủy' },
      hoan_tac:       { cls: 'background:#fff8e1;color:#f57f17',  label: 'Hoàn tác' },
      vang:           { cls: 'background:#f3e5f5;color:#6a1b9a',  label: 'Vắng' },
      // Trạng thái gói tập
      dang_hoat_dong: { cls: 'background:#e7f5e9;color:#1D9336',  label: 'Đang dùng' },
      hoat_dong:      { cls: 'background:#e7f5e9;color:#1D9336',  label: 'Hoạt động' },
      dang_ban:       { cls: 'background:#e7f5e9;color:#1D9336',  label: 'Đang bán' },
      cho_kich_hoat:  { cls: 'background:#fff3e0;color:#e65100',  label: 'Chờ kích hoạt' },
      da_ket_thuc:    { cls: 'background:#e0e3e8;color:#3f4a3c',  label: 'Kết thúc' },
      // Alias legacy
      active:         { cls: 'background:#e7f5e9;color:#1D9336',  label: 'Hoạt động' },
      inactive:       { cls: 'background:#e0e3e8;color:#3f4a3c',  label: 'Không HĐ' },
      expired:        { cls: 'background:#ffdad6;color:#ba1a1a',  label: 'Hết hạn' },
      pending:        { cls: 'background:#fff3e0;color:#e65100',  label: 'Chờ XN' },
      confirmed:      { cls: 'background:#e7f5e9;color:#1D9336',  label: 'Đã XN' },
      vao:            { cls: 'background:#e7f5e9;color:#1D9336',  label: 'Vào' },
      ra:             { cls: 'background:#e0e3e8;color:#3f4a3c',  label: 'Ra' },
    };
    const s = map[status] || { cls: 'background:#ebeef3;color:#181c20', label: window.GymApp.formatEnumLabel(status) };
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

    // Re-render dashboard charts if active
    if (window.GymApp.currentPage === 'dashboard') {
      const db = window.GymApp.pages['dashboard'];
      if (db && db.init) db.init();
    }
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

    document.getElementById('btn-qr-scan')?.addEventListener('click', () => {
      window._openQrModal?.();
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


  // ===== QR SCAN MODAL =====
  (function () {
    let _scanner = null;
    let _isScanning = false;
    let _lastScanned = '';
    let _lastScannedTime = 0;

    function _openQrModal() {
      const modal = document.getElementById('modal-qr-scan');
      if (!modal) return;
      // Reset kết quả cũ mỗi lần mở
      document.getElementById('qr-modal-result').innerHTML = '';
      document.getElementById('qr-modal-manual-token').value = '';
      modal.style.display = 'flex';
    }

    function _closeQrModal() {
      _stopScanner();
      const modal = document.getElementById('modal-qr-scan');
      if (modal) modal.style.display = 'none';
    }

    function _startScanner() {
      if (_isScanning) return;
      _scanner = new Html5Qrcode('qr-modal-reader');
      _scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => _handleScan(decodedText),
        () => {}
      ).then(() => {
        _isScanning = true;
        document.getElementById('qr-modal-btn-start').style.display = 'none';
        document.getElementById('qr-modal-btn-stop').style.display = 'flex';
      }).catch(err => {
        _showResultError('Không thể mở camera: ' + err);
      });
    }

    function _stopScanner() {
      if (!_isScanning || !_scanner) return;
      _scanner.stop().then(() => {
        _isScanning = false;
        _scanner = null;
        const btnStart = document.getElementById('qr-modal-btn-start');
        const btnStop  = document.getElementById('qr-modal-btn-stop');
        if (btnStart) btnStart.style.display = 'flex';
        if (btnStop)  btnStop.style.display  = 'none';
      }).catch(() => {});
    }

    async function _handleScan(qrToken) {
      const now = Date.now();
      if (qrToken === _lastScanned && now - _lastScannedTime < 3000) return;
      _lastScanned = qrToken;
      _lastScannedTime = now;

      _stopScanner();
      _showLoading();

      try {
        const res = await window.GymApp.api.post('/checkin/scan', { qr_token: qrToken });
        if (res?.success) {
          _showSuccess(res.data, res.message);
        } else {
          _showResultError(res?.message || 'Check-in thất bại.');
        }
      } catch (e) {
        _showResultError('Lỗi kết nối máy chủ.');
      }
    }

    function _showLoading() {
      document.getElementById('qr-modal-result').innerHTML = `
        <div style="background:#fff;border:1px solid #e0e8dc;border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px;">
          <div style="width:36px;height:36px;border-radius:50%;background:#e8f4fd;display:flex;align-items:center;justify-content:center;">
            <span class="material-symbols-outlined" style="color:#1565c0;font-size:20px;animation:spin 1s linear infinite">sync</span>
          </div>
          <p style="font-weight:700;color:#3f4a3c;font-size:13px">Đang xử lý...</p>
        </div>`;
    }

    function _showSuccess(data, message) {
      const area = document.getElementById('qr-modal-result');
      area.innerHTML = `
        <div style="border:2px solid #1D9336;border-radius:12px;overflow:hidden;animation:slideUp 0.25s ease;">
          <div style="background:#e7f5e9;display:flex;align-items:center;gap:10px;padding:12px 14px;">
            <span class="material-symbols-outlined" style="color:#1D9336;font-size:28px;font-variation-settings:'FILL' 1">check_circle</span>
            <div>
              <p style="font-weight:700;color:#1D9336;font-size:13px">Check-in thành công!</p>
              <p style="color:#157a2a;font-size:11px">${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:#fff;">
            ${data.avatar_url
              ? `<img src="${data.avatar_url}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid #1D9336;flex-shrink:0;" />`
              : `<div style="width:52px;height:52px;border-radius:50%;background:#1D9336;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="color:#fff;font-weight:700;font-size:20px">${(data.ho_ten || '?').charAt(0)}</span></div>`
            }
            <div>
              <p style="font-weight:700;color:#181c20;font-size:14px">${data.ho_ten || '—'}</p>
              <p style="color:#6e7a6b;font-size:11px">${data.ma_ho_so || ''}</p>
              <p style="color:#1D9336;font-size:11px;margin-top:2px">Gói tập đến: ${data.ngay_ket_thuc ? new Date(data.ngay_ket_thuc).toLocaleDateString('vi-VN') : '—'}</p>
            </div>
          </div>
          <div style="padding:0 14px 14px;background:#fff;">
            <button id="qr-modal-btn-next" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border-radius:10px;background:#1D9336;color:#fff;font-weight:700;font-size:12px;border:none;cursor:pointer;">
              <span class="material-symbols-outlined" style="font-size:15px">qr_code_scanner</span>Quét hội viên tiếp theo
            </button>
          </div>
        </div>`;
      document.getElementById('qr-modal-btn-next')?.addEventListener('click', () => {
        document.getElementById('qr-modal-result').innerHTML = '';
        _startScanner();
      });
      // Cập nhật dữ liệu check-in ở trang checkin nếu đang mở
      if (window.GymApp.currentPage === 'checkin') {
        window.GymApp.pages['checkin']?._fetchAndRefresh?.();
      }
    }

    function _showResultError(msg) {
      const area = document.getElementById('qr-modal-result');
      area.innerHTML = `
        <div style="border:2px solid #ba1a1a;border-radius:12px;overflow:hidden;">
          <div style="background:#ffdad6;display:flex;align-items:center;gap:10px;padding:12px 14px;">
            <span class="material-symbols-outlined" style="color:#ba1a1a;font-size:28px;font-variation-settings:'FILL' 1">error</span>
            <div>
              <p style="font-weight:700;color:#93000a;font-size:13px">Check-in thất bại</p>
              <p style="color:#ba1a1a;font-size:11px">${msg}</p>
            </div>
          </div>
          <div style="padding:10px 14px;background:#fff;">
            <button id="qr-modal-btn-retry" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border-radius:10px;border:1px solid #cdd6ca;background:#fff;color:#3f4a3c;font-weight:700;font-size:12px;cursor:pointer;">
              <span class="material-symbols-outlined" style="font-size:15px">refresh</span>Quét lại
            </button>
          </div>
        </div>`;
      document.getElementById('qr-modal-btn-retry')?.addEventListener('click', () => {
        document.getElementById('qr-modal-result').innerHTML = '';
        _startScanner();
      });
    }

    // Bind sự kiện sau khi DOM ready
    document.addEventListener('DOMContentLoaded', function () {
      document.getElementById('btn-close-qr-modal')?.addEventListener('click', _closeQrModal);

      // Click overlay để đóng
      document.getElementById('modal-qr-scan')?.addEventListener('click', function (e) {
        if (e.target === this) _closeQrModal();
      });

      // Phím Escape
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          const modal = document.getElementById('modal-qr-scan');
          if (modal && modal.style.display === 'flex') _closeQrModal();
        }
      });

      document.getElementById('qr-modal-btn-start')?.addEventListener('click', _startScanner);
      document.getElementById('qr-modal-btn-stop')?.addEventListener('click', _stopScanner);

      document.getElementById('qr-modal-btn-manual')?.addEventListener('click', () => {
        const t = document.getElementById('qr-modal-manual-token')?.value?.trim();
        if (!t) { window.GymApp.toast('Vui lòng dán token QR vào ô nhập.', 'error'); return; }
        _handleScan(t);
        document.getElementById('qr-modal-manual-token').value = '';
      });

      document.getElementById('qr-modal-manual-token')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('qr-modal-btn-manual')?.click();
      });

      document.getElementById('qr-modal-input-upload')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const statusEl = document.getElementById('qr-modal-upload-status');
        const labelEl  = document.getElementById('qr-modal-label-upload');
        statusEl.style.display = 'block';
        labelEl.style.opacity = '0.5';
        labelEl.style.pointerEvents = 'none';

        try {
          const tempScanner = new Html5Qrcode('qr-modal-reader');
          const decoded = await tempScanner.scanFile(file, false);
          statusEl.style.display = 'none';
          labelEl.style.opacity = '';
          labelEl.style.pointerEvents = '';
          e.target.value = '';
          _handleScan(decoded);
        } catch (err) {
          statusEl.style.display = 'none';
          labelEl.style.opacity = '';
          labelEl.style.pointerEvents = '';
          e.target.value = '';
          _showResultError('Không tìm thấy mã QR trong ảnh. Hãy thử ảnh rõ hơn hoặc dùng camera trực tiếp.');
        }
      });
    });

    // Export để btn-qr-scan dùng được
    window._openQrModal = _openQrModal;
  })();

  // ===== NOTIFICATIONS (BELL ICON) =====
  (function () {
    let _pollingTimer = null;
    let _dropdownOpen = false;

    const LOAI_ICON = {
      sap_het_han_goi_tap:       'schedule',
      het_han_goi_tap:           'event_busy',
      check_in:                  'how_to_reg',
      chua_check_in_truoc_buoi_pt: 'warning',
      cron_tu_xac_nhan:          'smart_toy',
      sap_het_buoi_pt:           'fitness_center',
      ho_so_moi:                 'person_add',
    };
    const LOAI_COLOR = {
      sap_het_han_goi_tap:       'text-amber-500',
      het_han_goi_tap:           'text-red-500',
      check_in:                  'text-green-600',
      chua_check_in_truoc_buoi_pt:'text-orange-500',
      cron_tu_xac_nhan:          'text-blue-500',
      sap_het_buoi_pt:           'text-orange-400',
      ho_so_moi:                 'text-purple-500',
    };

    function _timeAgo(dateStr) {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diff < 60) return 'vừa xong';
      if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
      return `${Math.floor(diff / 86400)} ngày trước`;
    }

    function _updateBadge(count) {
      const badge = document.getElementById('notif-badge');
      if (!badge) return;
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    async function _fetchUnreadCount() {
      try {
        const res = await window.GymApp.api.get('/notifications/unread-count');
        if (res?.success) _updateBadge(res.data.count);
      } catch (_) {}
    }

    async function _openDropdown() {
      const dropdown = document.getElementById('notif-dropdown');
      const listEl = document.getElementById('notif-list');
      if (!dropdown || !listEl) return;

      dropdown.classList.remove('hidden');
      _dropdownOpen = true;

      listEl.innerHTML = `<div class="text-center py-8 text-on-surface-variant text-body-sm">Đang tải...</div>`;

      try {
        const res = await window.GymApp.api.get('/notifications');
        if (!res?.success) throw new Error();
        const items = res.data;

        if (!items || items.length === 0) {
          listEl.innerHTML = `<div class="text-center py-10 text-on-surface-variant text-body-sm">Không có thông báo nào</div>`;
          return;
        }

        listEl.innerHTML = items.map(n => {
          const icon = LOAI_ICON[n.loai] || 'notifications';
          const color = LOAI_COLOR[n.loai] || 'text-on-surface-variant';
          const bg = n.da_doc === 0 ? 'bg-[#e7f5e9] dark:bg-[#0d2b14]' : '';
          return `
            <div class="notif-item flex items-start gap-3 px-4 py-3 border-b border-outline-variant cursor-pointer hover:bg-surface-container transition-colors ${bg}"
                 data-notif-id="${n.id}" data-da-doc="${n.da_doc}">
              <span class="material-symbols-outlined ${color} flex-shrink-0 mt-0.5" style="font-size:20px;font-variation-settings:'FILL' 1">${icon}</span>
              <div class="flex-1 min-w-0">
                <p class="text-body-sm font-semibold text-on-surface leading-snug">${n.tieu_de}</p>
                <p class="text-body-sm text-on-surface-variant mt-0.5 leading-snug">${n.noi_dung}</p>
                <p class="text-[10px] text-on-surface-variant mt-1">${_timeAgo(n.ngay_tao)}</p>
              </div>
              ${n.da_doc === 0 ? '<span class="w-2 h-2 bg-brand-primary rounded-full flex-shrink-0 mt-1.5"></span>' : ''}
            </div>`;
        }).join('');
      } catch (_) {
        listEl.innerHTML = `<div class="text-center py-8 text-red-500 text-body-sm">Không tải được thông báo</div>`;
      }
    }

    function _closeDropdown() {
      document.getElementById('notif-dropdown')?.classList.add('hidden');
      _dropdownOpen = false;
    }

    async function _markOneRead(id, itemEl) {
      try {
        await window.GymApp.api.patch(`/notifications/${id}/read`);
        itemEl.classList.remove('bg-[#e7f5e9]', 'dark:bg-[#0d2b14]');
        itemEl.dataset.daDoe = '1';
        itemEl.querySelector('.w-2.h-2.bg-brand-primary')?.remove();
        _fetchUnreadCount();
      } catch (_) {}
    }

    async function _markAllRead() {
      try {
        await window.GymApp.api.patch('/notifications/read-all');
        document.querySelectorAll('.notif-item').forEach(el => {
          el.classList.remove('bg-[#e7f5e9]', 'dark:bg-[#0d2b14]');
          el.querySelector('.w-2.h-2.bg-brand-primary')?.remove();
        });
        _updateBadge(0);
      } catch (_) {}
    }

    async function _showLoginSummary() {
      try {
        const res = await window.GymApp.api.get('/notifications/summary');
        if (!res?.success) return;
        const d = res.data;
        if (d.tong_chua_doc === 0) return;

        const parts = [];
        if (d.sap_het_han > 0) parts.push(`${d.sap_het_han} hội viên sắp hết hạn`);
        if (d.het_han > 0) parts.push(`${d.het_han} hội viên đã hết hạn`);
        if (d.sap_het_buoi_pt > 0) parts.push(`${d.sap_het_buoi_pt} hội viên sắp hết buổi PT`);

        if (parts.length > 0) {
          window.GymApp.toast(parts.join(', '), 'info');
        }
      } catch (_) {}
    }

    document.addEventListener('DOMContentLoaded', function () {
      const bellBtn = document.getElementById('btn-bell');
      const wrapper = document.getElementById('notif-wrapper');
      if (!bellBtn) return;

      // Mở/đóng dropdown khi bấm bell
      bellBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (_dropdownOpen) {
          _closeDropdown();
        } else {
          _openDropdown();
        }
      });

      // Đóng khi click ngoài
      document.addEventListener('click', function (e) {
        if (_dropdownOpen && !wrapper?.contains(e.target)) {
          _closeDropdown();
        }
      });

      // Đánh dấu tất cả đã đọc
      document.getElementById('btn-notif-read-all')?.addEventListener('click', function (e) {
        e.stopPropagation();
        _markAllRead();
      });

      // Click vào item → đánh dấu đã đọc
      document.getElementById('notif-list')?.addEventListener('click', function (e) {
        const item = e.target.closest('.notif-item');
        if (!item) return;
        const id = item.dataset.notifId;
        const daDoc = item.dataset.daDoc;
        if (id && daDoc === '0') _markOneRead(id, item);
      });

      // Polling mỗi 30 giây
      _fetchUnreadCount();
      _pollingTimer = setInterval(_fetchUnreadCount, 30000);

      // Gọi summary khi app load xong (sau khi auth xác nhận)
      setTimeout(_showLoginSummary, 1500);
    });
  })();

})();
