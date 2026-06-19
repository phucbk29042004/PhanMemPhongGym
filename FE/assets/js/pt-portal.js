/**
 * PT Portal — App logic cho Huấn luyện viên
 */
(function () {

  // ── Guard: chỉ PT được vào trang này ──────────────────────
  async function initPortal() {
    const token = localStorage.getItem('gym-token');
    if (!token) { window.location.href = 'login.html'; return; }

    let user;
    try {
      const res = await window.GymApp.api.get('/auth/me');
      if (!res?.success) { window.location.href = 'login.html'; return; }
      user = res.data;
    } catch (_) { window.location.href = 'login.html'; return; }

    // Nếu không phải PT thì redirect về đúng portal
    if (user.vai_tro === 'admin' || user.vai_tro === 'nhan_vien') {
      window.location.href = 'index.html'; return;
    }
    if (user.vai_tro === 'hoi_vien') {
      window.location.href = 'member-portal.html'; return;
    }

    window.GymApp.auth.user = user;
    _updateHeaderUI(user);

    // Load dữ liệu ban đầu
    await _fetchData();

    // Khởi tạo thông báo bell icon
    _initNotifications();

    // Tự động kết nối Socket.IO
    try {
      const socketUrl = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') ? 'http://localhost:3000' : window.location.origin;
      window.GymApp._socket = io(socketUrl, { transports: ['websocket', 'polling'] });
      const sock = window.GymApp._socket;
      sock.on('connect', () => {
        console.log('🔌 Socket.IO connected for PT:', sock.id);
        sock.emit('join', {
          userId: user.ho_so_id || user.id,
          vai_tro: 'pt'
        });
      });
      sock.on('notification:personal', (payload) => {
        // Cập nhật mảng thông báo local
        const notifs = window.GymApp.data.myNotifications || [];
        notifs.unshift(payload);
        window.GymApp.data.myNotifications = notifs;

        // Cập nhật badge chuông
        const badge = document.getElementById('pt-notif-badge');
        if (badge) {
          badge.textContent = notifs.length > 9 ? '9+' : notifs.length;
          badge.style.display = 'flex';
        }

        // Render lại dropdown thông báo
        _renderPtDropdownList();

        // Hiển thị toast thông báo
        window.GymApp.toast(payload.noi_dung || payload.tieu_de || 'Thông báo mới!', payload.muc_do || 'info');

        // Reload dữ liệu âm thầm
        _fetchData().then(() => {
          if (window.GymApp.currentPage === 'dashboard') {
            navigate('dashboard');
          } else if (window.GymApp.currentPage === 'my-schedule') {
            pages['my-schedule']._applyFilter(false);
          }
        });
      });
    } catch (sockErr) {
      console.warn('Socket.IO init error for PT:', sockErr);
    }

    // Áp dụng theme
    _applyTheme(localStorage.getItem('gym-theme') || 'light');

    // Gắn sự kiện
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      _applyTheme(isDark ? 'light' : 'dark');
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn đăng xuất?')) window.GymApp.auth.logout();
    });

    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('sidebar-collapsed');
    });

    // Click delegation cho navigation
    document.addEventListener('click', function (e) {
      const navBtn = e.target.closest('[data-page]');
      if (navBtn?.dataset.page) {
        navigate(navBtn.dataset.page);
      }
    });

    // Trang mặc định
    navigate('dashboard');
  }

  function _updateHeaderUI(user) {
    const name = user.ho_ten || user.ten_dang_nhap;
    const el = document.getElementById('header-name');
    if (el) el.textContent = name;
    const sidebarName = document.getElementById('sidebar-name');
    if (sidebarName) sidebarName.textContent = name;

    const headerAvatar = document.getElementById('header-avatar');
    if (headerAvatar) headerAvatar.innerHTML = window.GymApp.avatarImg(user.avatar_url, user.ho_ten, 'sm');

    const sidebarAvatar = document.getElementById('sidebar-avatar');
    if (sidebarAvatar) sidebarAvatar.innerHTML = window.GymApp.avatarImg(user.avatar_url, user.ho_ten, 'sm');
  }

  async function _fetchData() {
    try {
      const [schedulesRes, profileRes, notifRes, ptMeRes, studentsRes] = await Promise.all([
        window.GymApp.api.get('/pt/schedules'),
        window.GymApp.api.get('/auth/me'),
        window.GymApp.api.get('/members/me/notifications'),
        window.GymApp.api.get('/pt-me/overview'),
        window.GymApp.api.get('/pt/schedules/my-members'),
      ]);
      if (schedulesRes?.success) window.GymApp.data.ptSchedules = schedulesRes.data || [];
      if (profileRes?.success) window.GymApp.data.myProfile = profileRes.data;
      if (notifRes?.success) window.GymApp.data.myNotifications = notifRes.data?.notifications || [];
      if (ptMeRes?.success) window.GymApp.data.ptMeOverview = ptMeRes.data || {};
      if (studentsRes?.success) window.GymApp.data.ptMeStudents = studentsRes.data || [];
    } catch (err) {
      console.error('PT Portal: fetch data failed', err);
    }
  }

  // ── Thông báo Bell Icon cho PT ──────────────────────

  const PT_NOTIF_STYLE = {
    danger: { bg: 'var(--notif-danger-bg)', border: 'var(--notif-danger-border)', icon_color: 'var(--notif-danger-icon)', text_color: 'var(--notif-danger-text)' },
    warning: { bg: 'var(--notif-warning-bg)', border: 'var(--notif-warning-border)', icon_color: 'var(--notif-warning-icon)', text_color: 'var(--notif-warning-text)' },
    info: { bg: 'var(--notif-info-bg)', border: 'var(--notif-info-border)', icon_color: 'var(--notif-info-icon)', text_color: 'var(--notif-info-text)' },
    success: { bg: 'var(--notif-success-bg)', border: 'var(--notif-success-border)', icon_color: 'var(--notif-success-icon)', text_color: 'var(--notif-success-text)' },
  };

  function _renderPtDropdownList() {
    const notifs = window.GymApp.data.myNotifications || [];
    const list = document.getElementById('pt-notif-list');
    if (!list) return;
    if (!notifs.length) {
      list.innerHTML = `
        <div style="text-align:center;padding:24px 16px;color:var(--text-on-surface-variant)">
          <span class="material-symbols-outlined" style="font-size:32px;display:block;margin-bottom:8px">notifications_none</span>
          <p style="font-size:12px;margin:0">Không có thông báo nào</p>
        </div>
      `;
      return;
    }
    list.innerHTML = notifs.map((n, idx) => {
      const s = PT_NOTIF_STYLE[n.muc_do] || PT_NOTIF_STYLE.info;
      return `
        <div data-notif-idx="${idx}" style="
          margin-bottom:6px;background:${s.bg};border:1px solid ${s.border};
          border-radius:8px;padding:10px 12px;display:flex;align-items:flex-start;gap:10px;
        ">
          <span class="material-symbols-outlined" style="color:${s.icon_color};font-size:18px;flex-shrink:0;margin-top:1px;font-variation-settings:'FILL' 1">${n.icon}</span>
          <div style="flex:1;min-width:0">
            <p style="font-weight:700;font-size:12px;color:${s.text_color};margin:0 0 2px">${n.tieu_de}</p>
            <p style="font-size:11px;color:${s.text_color};opacity:0.85;margin:0;line-height:1.5">${n.noi_dung}</p>
          </div>
          <button class="pt-notif-del" data-idx="${idx}" title="Xóa" style="
            background:rgba(0,0,0,0.08);border:none;cursor:pointer;border-radius:6px;
            padding:3px;display:flex;align-items:center;justify-content:center;flex-shrink:0;
          " onmouseover="this.style.background='rgba(0,0,0,0.18)'" onmouseout="this.style.background='rgba(0,0,0,0.08)'">
            <span class="material-symbols-outlined" style="font-size:14px;color:${s.text_color}">close</span>
          </button>
        </div>
      `;
    }).join('');

    // Bind nút X
    list.querySelectorAll('.pt-notif-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        _removePtNotif(parseInt(btn.dataset.idx));
      });
    });
  }

  function _removePtNotif(index) {
    const notifs = window.GymApp.data.myNotifications || [];
    notifs.splice(index, 1);
    window.GymApp.data.myNotifications = notifs;
    const badge = document.getElementById('pt-notif-badge');
    if (badge) {
      if (notifs.length > 0) { badge.textContent = notifs.length > 9 ? '9+' : notifs.length; badge.style.display = 'flex'; }
      else { badge.style.display = 'none'; }
    }
    _renderPtDropdownList();
  }

  function _initNotifications() {
    const notifs = window.GymApp.data.myNotifications || [];

    // Cập nhật badge
    const badge = document.getElementById('pt-notif-badge');
    if (badge) {
      if (notifs.length > 0) { badge.textContent = notifs.length > 9 ? '9+' : notifs.length; badge.style.display = 'flex'; }
      else { badge.style.display = 'none'; }
    }

    _renderPtDropdownList();

    // Toggle dropdown khi click chuông
    const btn = document.getElementById('pt-notif-btn');
    const dropdown = document.getElementById('pt-notif-dropdown');
    if (btn && dropdown) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display !== 'none' ? 'none' : 'block';
      });
      // Đóng dropdown khi click ra ngoài
      document.addEventListener('click', (e) => {
        if (!document.getElementById('pt-notif-wrapper')?.contains(e.target)) {
          dropdown.style.display = 'none';
        }
      });
    }

    // Nút Xóa tất cả
    document.getElementById('pt-notif-clear-all')?.addEventListener('click', (e) => {
      e.stopPropagation();
      window.GymApp.data.myNotifications = [];
      const badge = document.getElementById('pt-notif-badge');
      if (badge) badge.style.display = 'none';
      _renderPtDropdownList();
    });
  }

  function _applyTheme(t) {
    document.documentElement.classList.toggle('dark', t === 'dark');
    localStorage.setItem('gym-theme', t);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = t === 'dark' ? 'light_mode' : 'dark_mode';
  }

  // ── Navigate ───────────────────────────────────────────────
  function navigate(pageName) {
    if (window.GymApp.currentPage && pages[window.GymApp.currentPage]?.destroy) {
      pages[window.GymApp.currentPage].destroy();
    }
    const page = pages[pageName];
    if (!page) return;

    document.getElementById('content-area').innerHTML = page.render();

    document.querySelectorAll('[data-page]').forEach(btn => {
      btn.classList.remove('nav-active', 'text-brand-primary', 'font-bold');
      btn.classList.add('text-on-surface-variant');
      if (btn.dataset.page === pageName) {
        btn.classList.remove('text-on-surface-variant');
        btn.classList.add('nav-active', 'text-brand-primary', 'font-bold');
      }
    });

    window.GymApp.currentPage = pageName;
    if (page.init) setTimeout(() => page.init(), 50);
  }

  // ── PAGES ──────────────────────────────────────────────────

  const pages = {};

  // ── Dashboard ──────────────────────────────────────────────
  pages['dashboard'] = {
    _refreshTimer: null,
    _TTL_PHUT: 5,

    render() {
      const schedules = window.GymApp.data.ptSchedules || [];
      const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];
      const todaySchedules = schedules.filter(s => s.ngay_tap === today);
      const monthStart = today.slice(0, 7);
      const doneThisMonth = schedules.filter(s => s.trang_thai === 'da_tap' && s.ngay_tap?.startsWith(monthStart)).length;

      // Unique học viên từ lịch tập
      const studentMap = {};
      schedules.forEach(s => {
        if (s.hoi_vien_id && !studentMap[s.hoi_vien_id]) {
          studentMap[s.hoi_vien_id] = { id: s.hoi_vien_id, ten: s.ten_hoi_vien, avatar: s.avatar_hoi_vien, buoi_con_lai: s.buoi_con_lai };
        }
      });
      const students = Object.values(studentMap);

      const stats = [
        { label: 'Lịch hôm nay', value: todaySchedules.length, icon: 'today', color: 'text-brand-primary', bg: 'icon-bg-green' },
        { label: 'Đã tập hôm nay', value: todaySchedules.filter(s => s.trang_thai === 'da_tap').length, icon: 'check_circle', color: 'text-brand-primary', bg: 'icon-bg-green' },
        { label: 'Chờ tập hôm nay', value: todaySchedules.filter(s => s.trang_thai === 'cho_tap').length, icon: 'pending', color: 'text-[#e65100]', bg: 'icon-bg-orange' },
        { label: 'Học viên', value: students.length, icon: 'group', color: 'text-secondary', bg: 'icon-bg-blue' },
      ];

      return `
        <div class="flex flex-col gap-loose">
          <!-- Welcome Banner -->
          <section class="relative overflow-hidden rounded-2xl bg-brand-primary/10 border border-brand-primary/20 p-loose min-h-[160px] flex flex-col justify-center shadow-sm">
            <div class="relative z-10 flex flex-col gap-compact">
              <div class="flex items-center gap-standard">
                <span class="bg-brand-primary/20 text-brand-primary px-standard py-xs rounded-full text-label-xs font-bold border border-brand-primary/30 uppercase">
                  Huấn luyện viên
                </span>
                <span class="bg-surface-lowest text-on-surface-variant px-standard py-xs rounded-full text-label-xs font-bold border border-outline-variant">
                  ${window.GymApp.formatDate(today)}
                </span>
              </div>
              <h1 class="text-display-lg font-bold text-on-surface mt-compact">Xin chào, ${window.GymApp.auth.user?.ho_ten || 'PT'}! 👋</h1>
              <p class="text-body-md text-on-surface-variant max-w-md">Chúc bạn một ngày làm việc hiệu quả tại Paradise GYM. Hôm nay bạn có <strong>${todaySchedules.length}</strong> ca tập được phân công.</p>
            </div>
            <span class="material-symbols-outlined absolute -right-4 -bottom-4 text-[140px] text-brand-primary/5 select-none pointer-events-none" style="font-variation-settings: 'FILL' 1;">sports_gymnastics</span>
          </section>

          <!-- Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-loose">
            ${stats.map(s => `
              <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm flex flex-col gap-standard">
                <div class="flex items-center justify-between">
                  <span class="text-on-surface-variant font-body-sm text-body-sm font-bold uppercase tracking-wider">${s.label}</span>
                  <div class="icon-bg ${s.bg}"><span class="material-symbols-outlined ${s.color} text-xl" style="font-variation-settings:'FILL' 1">${s.icon}</span></div>
                </div>
                <span class="${s.color} font-display-lg text-display-lg font-bold">${s.value}</span>
              </div>
            `).join('')}
          </div>

          <!-- Main Layout Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-loose">
            
            <!-- Cột trái/giữa: Lịch hôm nay & Danh sách học viên -->
            <div class="lg:col-span-2 flex flex-col gap-loose">
              <!-- Lịch hôm nay -->
              <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
                <div class="section-header px-loose py-standard border-b border-outline-variant flex items-center gap-compact">
                  <div class="icon-bg icon-bg-green">
                    <span class="material-symbols-outlined text-brand-primary text-lg" style="font-variation-settings:'FILL' 1">today</span>
                  </div>
                  <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Lịch tập hôm nay</h3>
                  <span class="ml-auto bg-brand-primary text-white px-compact py-xs rounded-full text-label-xs font-bold">${todaySchedules.length} buổi</span>
                </div>
                <div class="p-loose">
                  ${todaySchedules.length === 0
          ? `<div class="py-margin text-center text-on-surface-variant">
                         <span class="material-symbols-outlined text-4xl text-outline block mb-standard">event_available</span>
                         <p class="font-bold">Không có lịch tập hôm nay</p>
                       </div>`
          : `<div class="flex flex-col gap-standard">
                        ${todaySchedules.map(s => `
                          <div class="flex items-center gap-compact p-standard rounded-xl bg-surface-container border border-outline-variant">
                            ${window.GymApp.avatarImg(s.avatar_hoi_vien, s.ten_hoi_vien, 'sm')}
                            <div class="flex-1 min-w-0">
                              <p class="font-bold text-on-surface text-body-md truncate">${s.ten_hoi_vien || '—'}</p>
                              <p class="text-on-surface-variant text-body-sm">${s.gio_bat_dau} — ${s.gio_ket_thuc} · ${s.loai_buoi === 'nhom' ? 'Nhóm' : 'Cá nhân'}</p>
                            </div>
                            ${window.GymApp.statusBadge(s.trang_thai)}
                          </div>
                        `).join('')}
                       </div>`
        }
                </div>
              </div>

              <!-- Danh sách học viên -->
              <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
                <div class="section-header px-loose py-standard border-b border-outline-variant flex items-center gap-compact">
                  <div class="icon-bg icon-bg-blue">
                    <span class="material-symbols-outlined text-secondary text-lg" style="font-variation-settings:'FILL' 1">group</span>
                  </div>
                  <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Học viên của tôi</h3>
                  <span class="ml-auto bg-secondary text-white px-compact py-xs rounded-full text-label-xs font-bold">${students.length} HV</span>
                </div>
                <div class="p-loose grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-loose">
                  ${students.length === 0
          ? `<div class="col-span-3 py-margin text-center text-on-surface-variant">
                         <span class="material-symbols-outlined text-4xl text-outline block mb-standard">person_off</span>
                         Chưa có học viên
                       </div>`
          : students.map(sv => `
                        <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm flex flex-col items-center gap-standard">
                          ${window.GymApp.avatarImg(sv.avatar, sv.ten, 'lg')}
                          <div class="text-center">
                            <p class="font-bold text-on-surface text-body-md">${sv.ten || '—'}</p>
                            <p class="text-on-surface-variant text-body-sm">${sv.buoi_con_lai != null ? sv.buoi_con_lai + ' buổi còn lại' : ''}</p>
                          </div>
                        </div>
                      `).join('')
        }
                </div>
              </div>
            </div>

            <!-- Cột phải: Check-in nhanh bằng QR Code -->
            <div class="flex flex-col gap-loose">
              <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm flex flex-col items-center justify-center text-center">
                <div class="icon-bg icon-bg-green mb-standard" style="width:48px;height:48px;border-radius:12px">
                  <span class="material-symbols-outlined text-brand-primary text-2xl" style="font-variation-settings:'FILL' 1">qr_code_scanner</span>
                </div>
                <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface mb-xs">Check-in ca làm việc</h3>
                <p class="text-on-surface-variant text-body-sm mb-standard">Quét mã QR này tại quầy lễ tân để ghi nhận giờ vào/ra ca dạy.</p>
                
                <div id="qr-wrapper" class="bg-white p-standard rounded-2xl border border-outline-variant shadow-inner mb-standard flex items-center justify-center" style="width:168px;height:168px">
                  <div class="flex flex-col items-center gap-xs text-on-surface-variant">
                    <span class="material-symbols-outlined text-3xl animate-pulse">qr_code_2</span>
                    <p class="text-body-sm">Đang tạo mã...</p>
                  </div>
                </div>
                
                <p id="qr-countdown" class="text-on-surface-variant text-body-sm">Mã hết hạn sau <strong id="qr-seconds" class="text-brand-primary font-bold">—</strong> giây</p>
                
                <button id="btn-refresh-qr" class="mt-standard w-full border border-brand-primary text-brand-primary py-compact rounded-xl font-bold text-body-md hover:bg-brand-primary hover:text-white transition-all">
                  Làm mới mã QR
                </button>
              </div>
            </div>

          </div>
        </div>
      `;
    },

    async _loadQr() {
      try {
        const res = await window.GymApp.api.get('/checkin/my-qr');
        if (!res?.success) {
          const wrapper = document.getElementById('qr-wrapper');
          if (wrapper) wrapper.innerHTML = `<p class="text-error text-body-sm text-center">Không thể tải mã QR.</p>`;
          return;
        }

        const { token, het_han_sau_phut } = res.data;
        this._TTL_PHUT = het_han_sau_phut || 5;
        const wrapper = document.getElementById('qr-wrapper');
        if (!wrapper) return;
        wrapper.innerHTML = '';

        if (typeof QRCode !== 'undefined') {
          new QRCode(wrapper, {
            text: token,
            width: 136,
            height: 136,
            colorDark: '#0a2e13',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M,
          });
        } else {
          wrapper.innerHTML = `<p class="text-body-sm text-on-surface-variant text-center">Lỗi tải thư viện QR.</p>`;
        }

        this._startCountdown((het_han_sau_phut || 5) * 60);
      } catch (err) {
        console.error('QR load error:', err);
        const wrapper = document.getElementById('qr-wrapper');
        if (wrapper) wrapper.innerHTML = `<p class="text-error text-body-sm text-center">Lỗi kết nối máy chủ.</p>`;
      }
    },

    _startCountdown(seconds) {
      clearInterval(this._refreshTimer);
      let remaining = seconds;
      const el = document.getElementById('qr-seconds');
      const updateEl = () => { if (el) el.textContent = remaining; };
      updateEl();

      this._refreshTimer = setInterval(() => {
        remaining -= 1;
        updateEl();
        if (remaining <= 0) {
          clearInterval(this._refreshTimer);
          this._loadQr();
        }
      }, 1000);
    },

    init() {
      this._loadQr();
      document.getElementById('btn-refresh-qr')?.addEventListener('click', () => {
        clearInterval(this._refreshTimer);
        this._loadQr();
        window.GymApp.toast('Đang làm mới mã QR...', 'info');
      });
    },

    destroy() {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }
  };

  // ── PT Schedules Actions Modals ─────────────────────────────────
  async function _showCreateScheduleModal() {
    try {
      const res = await window.GymApp.api.get('/pt/schedules/my-members');
      if (!res?.success) {
        window.GymApp.toast('Không thể lấy danh sách học viên!', 'error');
        return;
      }
      const members = res.data || [];
      if (members.length === 0) {
        window.GymApp.toast('Bạn chưa có học viên nào đăng ký hoạt động!', 'warning');
        return;
      }

      const overlay = document.createElement('div');
      overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9000;padding:20px;`;
      overlay.innerHTML = `
        <div class="animate-fade-in" style="background:var(--bg-surface-lowest);border:1px solid var(--outline-variant);border-radius:24px;width:100%;max-width:500px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,0.15);">
          <!-- Header -->
          <div style="padding:20px 24px;background:linear-gradient(135deg,#1D9336,#0a591c);color:#fff;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-top-left-radius:24px;border-top-right-radius:24px;">
            <div>
              <h3 style="font-size:16px;font-weight:800;margin:0;letter-spacing:0.02em;">ĐẶT LỊCH TẬP MỚI</h3>
              <p style="font-size:11px;opacity:0.85;margin:4px 0 0 0;">Lên lịch dạy học viên của bạn</p>
            </div>
            <button id="close-create-sched" style="background:rgba(255,255,255,0.15);border:none;color:#fff;cursor:pointer;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;margin-left:auto;transition:background .2s;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
              <span class="material-symbols-outlined" style="font-size:20px;">close</span>
            </button>
          </div>
          
          <!-- Body -->
          <div style="overflow-y:auto;flex:1;padding:24px;display:flex;flex-direction:column;gap:16px;">
            <!-- Học viên -->
            <div>
              <label style="display:block;font-size:11px;text-transform:uppercase;font-weight:800;color:var(--text-on-surface-variant);opacity:0.8;margin-bottom:6px;">Học viên <span style="color:#ba1a1a;">*</span></label>
              <select id="cs-member" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-4 py-2.5 rounded-xl focus:border-brand-primary outline-none text-[14px] font-medium transition-all">
                <option value="">— Chọn học viên —</option>
                ${members.map(m => `<option value="${m.dang_ky_id}">${m.ho_ten} (${m.ten_goi_pt || 'Gói PT'} · Còn ${m.buoi_con_lai} buổi)</option>`).join('')}
              </select>
            </div>

            <!-- Ngày tập -->
            <div>
              <label style="display:block;font-size:11px;text-transform:uppercase;font-weight:800;color:var(--text-on-surface-variant);opacity:0.8;margin-bottom:6px;">Ngày tập <span style="color:#ba1a1a;">*</span></label>
              <div class="relative w-full">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">calendar_month</span>
                <input id="cs-date" type="date" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-10 pr-4 py-2.5 rounded-xl focus:border-brand-primary outline-none text-[14px] font-medium transition-all" />
              </div>
            </div>

            <!-- Khung giờ -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
              <div>
                <label style="display:block;font-size:11px;text-transform:uppercase;font-weight:800;color:var(--text-on-surface-variant);opacity:0.8;margin-bottom:6px;">Giờ bắt đầu <span style="color:#ba1a1a;">*</span></label>
                <input id="cs-start" type="time" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-4 py-2.5 rounded-xl focus:border-brand-primary outline-none text-[14px] font-medium transition-all" />
              </div>
              <div>
                <label style="display:block;font-size:11px;text-transform:uppercase;font-weight:800;color:var(--text-on-surface-variant);opacity:0.8;margin-bottom:6px;">Giờ kết thúc <span style="color:#ba1a1a;">*</span></label>
                <input id="cs-end" type="time" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-4 py-2.5 rounded-xl focus:border-brand-primary outline-none text-[14px] font-medium transition-all" />
              </div>
            </div>

            <!-- Loại buổi -->
            <div>
              <label style="display:block;font-size:11px;text-transform:uppercase;font-weight:800;color:var(--text-on-surface-variant);opacity:0.8;margin-bottom:6px;">Loại buổi</label>
              <select id="cs-type" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-4 py-2.5 rounded-xl focus:border-brand-primary outline-none text-[14px] font-medium transition-all">
                <option value="ca_nhan">Cá nhân (1-1)</option>
                <option value="nhom">Nhóm</option>
              </select>
            </div>

            <!-- Ghi chú -->
            <div>
              <label style="display:block;font-size:11px;text-transform:uppercase;font-weight:800;color:var(--text-on-surface-variant);opacity:0.8;margin-bottom:6px;">Ghi chú</label>
              <textarea id="cs-note" placeholder="Ví dụ: Tập Cardio, bài ngực..." rows="2" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-4 py-2.5 rounded-xl focus:border-brand-primary outline-none text-[14px] font-medium transition-all resize-none"></textarea>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding:16px 24px;border-top:1px solid var(--outline-variant);display:flex;justify-content:flex-end;gap:12px;background:var(--bg-surface-low);flex-shrink:0;border-bottom-left-radius:24px;border-bottom-right-radius:24px;">
            <button id="btn-cancel-create-sched" style="padding:10px 20px;border-radius:12px;border:1px solid var(--outline-variant);color:var(--text-on-surface);background:transparent;font-weight:700;font-size:13px;cursor:pointer;">Hủy</button>
            <button id="btn-submit-create-sched" style="padding:10px 24px;border-radius:12px;border:none;color:#fff;background:#1D9336;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(29,147,54,0.3);">Đặt lịch</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const close = () => overlay.remove();
      document.getElementById('close-create-sched').addEventListener('click', close);
      document.getElementById('btn-cancel-create-sched').addEventListener('click', close);

      document.getElementById('btn-submit-create-sched').addEventListener('click', async () => {
        const dangKyPtId = document.getElementById('cs-member').value;
        const ngayTap = document.getElementById('cs-date').value;
        const gioBatDau = document.getElementById('cs-start').value;
        const gioKetThuc = document.getElementById('cs-end').value;
        const loaiBuoi = document.getElementById('cs-type').value;
        const ghiChu = document.getElementById('cs-note').value.trim();

        if (!dangKyPtId || !ngayTap || !gioBatDau || !gioKetThuc) {
          window.GymApp.toast('Vui lòng điền đầy đủ các trường bắt buộc (*)!', 'error');
          return;
        }

        const submitBtn = document.getElementById('btn-submit-create-sched');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang xử lý...';

        try {
          const res = await window.GymApp.api.post('/pt/schedules', {
            dang_ky_pt_id: parseInt(dangKyPtId),
            ngay_tap: ngayTap,
            gio_bat_dau: gioBatDau,
            gio_ket_thuc: gioKetThuc,
            loai_buoi: loaiBuoi,
            ghi_chu: ghiChu || null
          });

          if (res?.success) {
            window.GymApp.toast('Lịch tập mới đã được xếp thành công!', 'success');
            close();
            const fresh = await window.GymApp.api.get('/pt/schedules');
            if (fresh?.success) window.GymApp.data.ptSchedules = fresh.data || [];
            window.GymApp.pages['my-schedule']._applyFilter();
          } else {
            window.GymApp.toast(res?.message || 'Không thể xếp lịch tập!', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Đặt lịch';
          }
        } catch (err) {
          console.error(err);
          window.GymApp.toast('Lỗi máy chủ, vui lòng thử lại sau!', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Đặt lịch';
        }
      });
    } catch (e) {
      console.error(e);
      window.GymApp.toast('Có lỗi xảy ra!', 'error');
    }
  }

  function _showEditScheduleModal(s) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9000;padding:20px;`;
    overlay.innerHTML = `
      <div class="animate-fade-in" style="background:var(--bg-surface-lowest);border:1px solid var(--outline-variant);border-radius:24px;width:100%;max-width:500px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,0.15);">
        <!-- Header -->
        <div style="padding:20px 24px;background:linear-gradient(135deg,#03872c,#156324);color:#fff;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-top-left-radius:24px;border-top-right-radius:24px;">
          <div>
            <h3 style="font-size:16px;font-weight:800;margin:0;letter-spacing:0.02em;">SỬA LỊCH TẬP</h3>
            <p style="font-size:11px;opacity:0.85;margin:4px 0 0 0;">Cập nhật lại thời gian buổi tập</p>
          </div>
          <button id="close-edit-sched" style="background:rgba(255,255,255,0.15);border:none;color:#fff;cursor:pointer;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;margin-left:auto;transition:background .2s;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
            <span class="material-symbols-outlined" style="font-size:20px;">close</span>
          </button>
        </div>
        
        <!-- Body -->
        <div style="overflow-y:auto;flex:1;padding:24px;display:flex;flex-direction:column;gap:16px;">
          <!-- Học viên -->
          <div>
            <label style="display:block;font-size:11px;text-transform:uppercase;font-weight:800;color:var(--text-on-surface-variant);opacity:0.8;margin-bottom:6px;">Học viên</label>
            <input type="text" value="${s.ten_hoi_vien || '—'}" disabled class="w-full bg-surface-container border border-outline-variant text-on-surface-variant px-4 py-2.5 rounded-xl outline-none text-[14px] font-medium cursor-not-allowed" />
          </div>

          <!-- Ngày tập -->
          <div>
            <label style="display:block;font-size:11px;text-transform:uppercase;font-weight:800;color:var(--text-on-surface-variant);opacity:0.8;margin-bottom:6px;">Ngày tập <span style="color:#ba1a1a;">*</span></label>
            <div class="relative w-full">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">calendar_month</span>
              <input id="es-date" type="date" value="${s.ngay_tap ? s.ngay_tap.substring(0, 10) : ''}" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-10 pr-4 py-2.5 rounded-xl focus:border-brand-primary outline-none text-[14px] font-medium transition-all" />
            </div>
          </div>

          <!-- Khung giờ -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div>
              <label style="display:block;font-size:11px;text-transform:uppercase;font-weight:800;color:var(--text-on-surface-variant);opacity:0.8;margin-bottom:6px;">Giờ bắt đầu <span style="color:#ba1a1a;">*</span></label>
              <input id="es-start" type="time" value="${s.gio_bat_dau || ''}" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-4 py-2.5 rounded-xl focus:border-brand-primary outline-none text-[14px] font-medium transition-all" />
            </div>
            <div>
              <label style="display:block;font-size:11px;text-transform:uppercase;font-weight:800;color:var(--text-on-surface-variant);opacity:0.8;margin-bottom:6px;">Giờ kết thúc <span style="color:#ba1a1a;">*</span></label>
              <input id="es-end" type="time" value="${s.gio_ket_thuc || ''}" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-4 py-2.5 rounded-xl focus:border-brand-primary outline-none text-[14px] font-medium transition-all" />
            </div>
          </div>

          <!-- Ghi chú -->
          <div>
            <label style="display:block;font-size:11px;text-transform:uppercase;font-weight:800;color:var(--text-on-surface-variant);opacity:0.8;margin-bottom:6px;">Ghi chú</label>
            <textarea id="es-note" rows="2" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-4 py-2.5 rounded-xl focus:border-brand-primary outline-none text-[14px] font-medium transition-all resize-none">${s.ghi_chu || ''}</textarea>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:16px 24px;border-top:1px solid var(--outline-variant);display:flex;justify-content:flex-end;gap:12px;background:var(--bg-surface-low);flex-shrink:0;border-bottom-left-radius:24px;border-bottom-right-radius:24px;">
          <button id="btn-cancel-edit-sched" style="padding:10px 20px;border-radius:12px;border:1px solid var(--outline-variant);color:var(--text-on-surface);background:transparent;font-weight:700;font-size:13px;cursor:pointer;">Hủy</button>
          <button id="btn-submit-edit-sched" style="padding:10px 24px;border-radius:12px;border:none;color:#fff;background:#1D9336;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(29,147,54,0.3);">Lưu thay đổi</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('close-edit-sched').addEventListener('click', close);
    document.getElementById('btn-cancel-edit-sched').addEventListener('click', close);

    document.getElementById('btn-submit-edit-sched').addEventListener('click', async () => {
      const ngayTap = document.getElementById('es-date').value;
      const gioBatDau = document.getElementById('es-start').value;
      const gioKetThuc = document.getElementById('es-end').value;
      const ghiChu = document.getElementById('es-note').value.trim();

      if (!ngayTap || !gioBatDau || !gioKetThuc) {
        window.GymApp.toast('Vui lòng điền đầy đủ các trường bắt buộc (*)!', 'error');
        return;
      }

      const submitBtn = document.getElementById('btn-submit-edit-sched');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang lưu...';

      try {
        const res = await window.GymApp.api.put(`/pt/schedules/${s.id}`, {
          ngay_tap: ngayTap,
          gio_bat_dau: gioBatDau,
          gio_ket_thuc: gioKetThuc,
          ghi_chu: ghiChu || null
        });

        if (res?.success) {
          window.GymApp.toast('Đã cập nhật lịch tập thành công!', 'success');
          close();
          const fresh = await window.GymApp.api.get('/pt/schedules');
          if (fresh?.success) window.GymApp.data.ptSchedules = fresh.data || [];
          window.GymApp.pages['my-schedule']._applyFilter();
        } else {
          window.GymApp.toast(res?.message || 'Cập nhật lịch tập thất bại!', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Lưu thay đổi';
        }
      } catch (err) {
        console.error(err);
        window.GymApp.toast('Lỗi máy chủ, vui lòng thử lại sau!', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Lưu thay đổi';
      }
    });
  }

  // ── Modal sửa/thêm ghi chú cho buổi tập ─────────────────────────
  function _showNoteModal(scheduleId, currentNote) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9000;padding:20px;`;
    overlay.innerHTML = `
      <div class="animate-fade-in" style="background:var(--bg-surface-lowest);border:1px solid var(--outline-variant);border-radius:24px;width:100%;max-width:440px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,0.15);">
        <!-- Header -->
        <div style="padding:20px 24px;background:linear-gradient(135deg,#1D9336,#0a591c);color:#fff;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-top-left-radius:24px;border-top-right-radius:24px;">
          <div>
            <h3 style="font-size:16px;font-weight:800;margin:0;letter-spacing:0.02em;">GHI CHÚ BUỔI TẬP</h3>
            <p style="font-size:11px;opacity:0.85;margin:4px 0 0 0;">Thêm lưu ý cho buổi tập này</p>
          </div>
          <button id="close-note-modal" style="background:rgba(255,255,255,0.15);border:none;color:#fff;cursor:pointer;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;margin-left:auto;transition:background .2s;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
            <span class="material-symbols-outlined" style="font-size:20px;">close</span>
          </button>
        </div>

        <!-- Body -->
        <div style="overflow-y:auto;flex:1;padding:24px;display:flex;flex-direction:column;gap:16px;">
          <div>
            <label style="display:block;font-size:11px;text-transform:uppercase;font-weight:800;color:var(--text-on-surface-variant);opacity:0.8;margin-bottom:6px;">Nội dung ghi chú</label>
            <textarea id="note-input" rows="4" placeholder="Ví dụ: Tập trung bài lưng, học viên đau vai trái..." class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-4 py-2.5 rounded-xl focus:border-brand-primary outline-none text-[14px] font-medium transition-all resize-none">${currentNote || ''}</textarea>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:16px 24px;border-top:1px solid var(--outline-variant);display:flex;justify-content:flex-end;gap:12px;background:var(--bg-surface-low);flex-shrink:0;border-bottom-left-radius:24px;border-bottom-right-radius:24px;">
          <button id="btn-cancel-note" style="padding:10px 20px;border-radius:12px;border:1px solid var(--outline-variant);color:var(--text-on-surface);background:transparent;font-weight:700;font-size:13px;cursor:pointer;">Hủy</button>
          <button id="btn-save-note" style="padding:10px 24px;border-radius:12px;border:none;color:#fff;background:#1D9336;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(29,147,54,0.3);">Lưu ghi chú</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('close-note-modal').addEventListener('click', close);
    document.getElementById('btn-cancel-note').addEventListener('click', close);

    document.getElementById('btn-save-note').addEventListener('click', async () => {
      const text = document.getElementById('note-input').value.trim();
      const saveBtn = document.getElementById('btn-save-note');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Đang lưu...';

      try {
        const res = await window.GymApp.api.patch(`/pt/schedules/${scheduleId}/note`, { ghi_chu: text || null });
        if (res?.success) {
          window.GymApp.toast('Đã lưu ghi chú thành công!', 'success');
          close();
          const fresh = await window.GymApp.api.get('/pt/schedules');
          if (fresh?.success) window.GymApp.data.ptSchedules = fresh.data || [];
          window.GymApp.pages['my-schedule']._applyFilter();
        } else {
          window.GymApp.toast(res?.message || 'Không thể lưu ghi chú!', 'error');
          saveBtn.disabled = false;
          saveBtn.textContent = 'Lưu ghi chú';
        }
      } catch (err) {
        console.error(err);
        window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Lưu ghi chú';
      }
    });
  }

  async function _cancelScheduleSession(scheduleId, studentName) {
    const reason = prompt(`Nhập lý do hủy buổi tập với ${studentName}:`);
    if (reason === null) return;

    const cleanReason = reason.trim();
    if (!cleanReason) {
      window.GymApp.toast('Lý do hủy không được để trống!', 'error');
      return;
    }

    try {
      const res = await window.GymApp.api.put(`/pt/schedules/${scheduleId}/cancel`, { ly_do: cleanReason });
      if (res?.success) {
        window.GymApp.toast(`Đã hủy thành công buổi tập với ${studentName}!`, 'success');
        const fresh = await window.GymApp.api.get('/pt/schedules');
        if (fresh?.success) window.GymApp.data.ptSchedules = fresh.data || [];
        window.GymApp.pages['my-schedule']._applyFilter();
      } else {
        window.GymApp.toast(res?.message || 'Hủy buổi tập thất bại!', 'error');
      }
    } catch (err) {
      console.error(err);
      window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
    }
  }

  async function _confirmScheduleSession(scheduleId, studentName, btn) {
    try {
      const res = await window.GymApp.api.put(`/pt/schedules/${scheduleId}/confirm`, {});
      if (res?.success) {
        window.GymApp.toast(`Đã xác nhận buổi tập với ${studentName} hoàn thành!`, 'success');
        const fresh = await window.GymApp.api.get('/pt/schedules');
        if (fresh?.success) window.GymApp.data.ptSchedules = fresh.data || [];
        window.GymApp.pages['my-schedule']._applyFilter();
      } else {
        window.GymApp.toast(res?.message || 'Xác nhận buổi tập thất bại!', 'error');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `<span class="material-symbols-outlined text-sm">done</span> Xong`;
        }
      }
    } catch (err) {
      console.error(err);
      window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined text-sm">done</span> Xong`;
      }
    }
  }

  // ── Lịch tập của tôi ──────────────────────────────────────
  pages['my-schedule'] = {
    _filter: '',
    _status: '',
    _currentPage: 1,
    _pageSize: 10,

    render() {
      const schedules = window.GymApp.data.ptSchedules || [];
      return `
        <div class="flex flex-col gap-loose">
          <!-- Filter -->
          <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-standard shadow-sm">
            <div class="flex flex-wrap items-center gap-standard">
              <div class="relative flex-1 min-w-[180px]">
                <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                <input id="sch-search" class="w-full bg-surface-container-low border border-outline-variant text-on-surface pl-8 pr-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md transition-colors" placeholder="Tìm theo tên học viên..." type="text" />
              </div>
              <select id="sch-status" class="bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md min-w-[140px] transition-colors">
                <option value="">Tất cả trạng thái</option>
                <option value="cho_tap">Chờ tập</option>
                <option value="da_tap">Đã tập</option>
                <option value="da_huy">Đã hủy</option>
                <option value="vang">Vắng</option>
              </select>
              <input id="sch-date" type="date" class="bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md transition-colors" />
              <button id="sch-reload" class="flex items-center gap-xs px-loose py-compact rounded-xl border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-all font-body-md whitespace-nowrap">
                <span class="material-symbols-outlined text-sm">refresh</span>Tải lại
              </button>
              <button id="sch-create" class="flex items-center gap-xs px-loose py-compact rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 active:scale-95 transition-all font-bold text-body-md whitespace-nowrap shadow-sm">
                <span class="material-symbols-outlined text-sm">add</span>Đặt lịch mới
              </button>
            </div>
          </div>

          <!-- Table / Cards -->
          <div id="schedule-table-wrap">
            ${this._renderTable(schedules)}
          </div>
        </div>
      `;
    },

    _renderTable(list) {
      if (!list.length) return `
        <div class="p-margin text-center text-on-surface-variant">
          <span class="material-symbols-outlined text-4xl text-outline block mb-standard">event_busy</span>
          <p class="font-bold text-label-md mt-s2">Không tìm thấy lịch tập</p>
        </div>`;

      // 1. Sắp xếp: Ngày giảm dần (mới nhất lên đầu), Giờ tăng dần (sáng đến tối)
      const sortedList = [...list].sort((a, b) => {
        if (a.ngay_tap !== b.ngay_tap) {
          return new Date(b.ngay_tap || 0) - new Date(a.ngay_tap || 0); // Ngày mới nhất ở trên
        }
        return (a.gio_bat_dau || '').localeCompare(b.gio_bat_dau || ''); // Giờ tăng dần
      });

      // 2. Pagination
      const totalRecords = sortedList.length;
      const totalPages = Math.ceil(totalRecords / this._pageSize);
      if (this._currentPage > totalPages) this._currentPage = 1; // reset if out of bounds
      const startIdx = (this._currentPage - 1) * this._pageSize;
      const paginatedList = sortedList.slice(startIdx, startIdx + this._pageSize);

      // 3. Gom nhóm theo ngày
      const grouped = {};
      paginatedList.forEach(s => {
        const d = s.ngay_tap || 'Chưa xác định';
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push(s);
      });

      // 4. Render các nhóm
      const groupsHtml = Object.entries(grouped).map(([dateStr, schedules]) => {
        const dayObj = dateStr !== 'Chưa xác định' ? new Date(dateStr) : null;
        const weekday = dayObj ? dayObj.toLocaleDateString('vi-VN', { weekday: 'long' }) : '';
        const formattedDate = dayObj ? dayObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : dateStr;

        return `
        <div class="mb-10">
          <div class="flex items-center gap-3 mb-5 pl-2">
            <span class="material-symbols-outlined text-brand-primary text-2xl" style="font-variation-settings: 'FILL' 1;">calendar_month</span>
            <h3 class="font-display-xl text-display-xl text-on-surface font-bold capitalize tracking-tight">${weekday}, ${formattedDate}</h3>
            <span class="bg-brand-primary/10 text-brand-primary text-label-sm px-3 py-1 rounded-full font-bold ml-2">${schedules.length} buổi</span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            ${schedules.map(s => {
          return `
              <div class="group relative rounded-3xl overflow-hidden flex flex-col gap-4 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 bg-surface-container-lowest border border-outline-variant">
                <!-- Accent bar top -->
                <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#1D9336,#4ade80);border-radius:3px 3px 0 0;"></div>

                <!-- Card Header: Time & Status -->
                <div class="flex items-start justify-between gap-2 pt-5 px-5">
                  <div class="flex flex-col min-w-0">
                    <span class="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-1">Khung giờ</span>
                    <div class="flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-brand-primary text-[18px] shrink-0">schedule</span>
                      <span class="font-bold text-on-surface text-body-lg truncate whitespace-nowrap">${s.gio_bat_dau || '—'} - ${s.gio_ket_thuc || '—'}</span>
                    </div>
                  </div>
                  <div class="shrink-0 ml-2">${window.GymApp.statusBadge(s.trang_thai)}</div>
                </div>

                <!-- Student Info -->
                <div class="flex items-center gap-4 px-5">
                  <div class="relative flex-shrink-0">
                    ${window.GymApp.avatarImg(s.avatar_hoi_vien, s.ten_hoi_vien, 'lg')}
                  </div>
                  <div class="flex flex-col min-w-0 flex-1">
                    <span class="font-bold text-on-surface text-body-lg truncate block leading-tight mb-1" title="${s.ten_hoi_vien || 'Không rõ'}">${s.ten_hoi_vien || 'Không rõ'}</span>
                    <div class="flex">
                      <span class="bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider border border-brand-primary/20">${s.loai_buoi === 'nhom' ? 'Nhóm' : 'Cá nhân'}</span>
                    </div>
                  </div>
                </div>

                <!-- Notes Area -->
                <div class="px-5">
                  <div class="bg-surface-container-low/50 rounded-2xl p-3 flex items-start gap-2 h-[68px]">
                    <span class="material-symbols-outlined text-brand-primary text-[16px] shrink-0 mt-0.5" style="font-variation-settings: 'FILL' 1;">sticky_note_2</span>
                    <p class="text-body-sm text-on-surface-variant line-clamp-2" title="${s.ghi_chu}">${s.ghi_chu ? s.ghi_chu : '<span class="italic opacity-60">Chưa có ghi chú</span>'}</p>
                  </div>
                </div>

                <!-- Actions Footer -->
                <div class="mt-auto px-5 pb-5 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/30 pt-4">
                  <button class="btn-pt-edit-note text-on-surface-variant hover:text-brand-primary hover:bg-brand-primary/10 w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 shadow-sm border border-transparent hover:border-brand-primary/30 focus-ring shrink-0" data-id="${s.id}" data-ghi-chu="${(s.ghi_chu || '').replace(/"/g, '&quot;')}" title="${s.ghi_chu ? 'Sửa ghi chú' : 'Thêm ghi chú'}">
                    <span class="material-symbols-outlined text-lg">${s.ghi_chu ? 'edit_note' : 'add_comment'}</span>
                  </button>
                  
                  <div class="flex flex-wrap items-center gap-1.5 justify-end">
                    ${s.trang_thai === 'cho_tap'
              ? `<button class="btn-cancel-session w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 shadow-sm border border-error/50 text-error hover:bg-error/10 hover:border-error focus-ring shrink-0" data-id="${s.id}" data-name="${s.ten_hoi_vien || 'học viên'}" title="Hủy lịch">
                           <span class="material-symbols-outlined text-lg">close</span>
                         </button>
                         <button class="btn-edit-session w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 shadow-sm border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary bg-surface-container-lowest focus-ring shrink-0" data-id="${s.id}" data-sdata='${encodeURIComponent(JSON.stringify(s))}' title="Sửa lịch">
                           <span class="material-symbols-outlined text-lg">edit</span>
                         </button>
                         <button class="btn-confirm-session flex items-center gap-1 px-3 h-9 rounded-xl transition-all duration-300 shadow-sm bg-brand-primary text-white hover:bg-brand-primary/90 hover:-translate-y-0.5 active:scale-95 font-bold text-label-sm focus-ring shrink-0" data-id="${s.id}" data-name="${s.ten_hoi_vien || 'học viên'}" title="Xác nhận hoàn thành">
                           <span class="material-symbols-outlined text-sm">done</span> Xong
                         </button>`
              : `<span class="text-outline text-body-sm italic mr-2 shrink-0">—</span>`
            }
                  </div>
                </div>
              </div>
              `;
        }).join('')}
          </div>
        </div>
        `;
      }).join('');

      // 5. Build Pagination UI
      let paginationHtml = '';
      if (totalPages > 1) {
        let pagesHtml = '';
        // Hiển thị tối đa 5 trang gần nhất
        let startPage = Math.max(1, this._currentPage - 2);
        let endPage = Math.min(totalPages, this._currentPage + 2);
        if (startPage > 1) pagesHtml += `<button class="btn-sch-page w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border border-outline-variant" data-page="1">1</button>${startPage > 2 ? '<span class="px-2 text-outline">...</span>' : ''}`;

        for (let i = startPage; i <= endPage; i++) {
          pagesHtml += `<button class="btn-sch-page w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${i === this._currentPage ? 'bg-brand-primary text-white shadow-md' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border border-outline-variant'}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) pagesHtml += `${endPage < totalPages - 1 ? '<span class="px-2 text-outline">...</span>' : ''}<button class="btn-sch-page w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border border-outline-variant" data-page="${totalPages}">${totalPages}</button>`;

        paginationHtml = `
          <div class="flex flex-col sm:flex-row items-center justify-between gap-s4 mt-s6 pt-s5 border-t border-outline-variant">
            <span class="text-body-md text-on-surface-variant font-medium">Đang hiển thị ${startIdx + 1}-${Math.min(startIdx + this._pageSize, totalRecords)} trên tổng ${totalRecords} lịch tập</span>
            <div class="flex items-center gap-s2">
              <button class="btn-sch-page-prev p-2 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed" ${this._currentPage === 1 ? 'disabled' : ''}>
                <span class="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              ${pagesHtml}
              <button class="btn-sch-page-next p-2 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed" ${this._currentPage === totalPages ? 'disabled' : ''}>
                <span class="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        `;
      }

      return `
        <div>
          ${groupsHtml}
          ${paginationHtml}
        </div>
      `;
    },

    _applyFilter(resetPage = true) {
      if (resetPage) this._currentPage = 1;
      const q = (document.getElementById('sch-search')?.value || '').toLowerCase();
      const status = document.getElementById('sch-status')?.value || '';
      const date = document.getElementById('sch-date')?.value || '';
      const filtered = (window.GymApp.data.ptSchedules || []).filter(s => {
        const matchQ = !q || (s.ten_hoi_vien || '').toLowerCase().includes(q);
        const matchS = !status || s.trang_thai === status;
        const matchD = !date || s.ngay_tap === date;
        return matchQ && matchS && matchD;
      });
      document.getElementById('schedule-table-wrap').innerHTML = this._renderTable(filtered);
    },

    init() {
      const self = this;
      document.getElementById('sch-search')?.addEventListener('input', () => self._applyFilter(true));
      document.getElementById('sch-status')?.addEventListener('change', () => self._applyFilter(true));
      document.getElementById('sch-date')?.addEventListener('change', () => self._applyFilter(true));
      document.getElementById('sch-reload')?.addEventListener('click', async () => {
        const btn = document.getElementById('sch-reload');
        btn?.classList.add('opacity-50', 'pointer-events-none');
        try {
          const res = await window.GymApp.api.get('/pt/schedules');
          if (res?.success) window.GymApp.data.ptSchedules = res.data || [];
        } catch (e) { console.error(e); }
        const searchInput = document.getElementById('sch-search');
        const statusSelect = document.getElementById('sch-status');
        const dateInput = document.getElementById('sch-date');
        if (searchInput) searchInput.value = '';
        if (statusSelect) statusSelect.value = '';
        if (dateInput) dateInput.value = '';
        self._applyFilter(true);
        btn?.classList.remove('opacity-50', 'pointer-events-none');
        window.GymApp.toast('Đã tải lại lịch tập!', 'success');
      });

      // Đặt lịch mới
      document.getElementById('sch-create')?.addEventListener('click', () => {
        _showCreateScheduleModal();
      });

      // Bắt sự kiện click (Event Delegation) cho bảng & phân trang
      document.getElementById('schedule-table-wrap')?.addEventListener('click', async (e) => {
        // --- Pagination ---
        const pageBtn = e.target.closest('.btn-sch-page');
        if (pageBtn) {
          self._currentPage = parseInt(pageBtn.dataset.page, 10);
          self._applyFilter(false);
          return;
        }
        const prevBtn = e.target.closest('.btn-sch-page-prev');
        if (prevBtn) {
          if (self._currentPage > 1) {
            self._currentPage--;
            self._applyFilter(false);
          }
          return;
        }
        const nextBtn = e.target.closest('.btn-sch-page-next');
        if (nextBtn) {
          self._currentPage++;
          self._applyFilter(false);
          return;
        }

        // --- Xác nhận đã tập ---
        const confirmBtn = e.target.closest('.btn-confirm-session');
        if (confirmBtn && !confirmBtn.disabled) {
          const scheduleId = confirmBtn.dataset.id;
          const studentName = confirmBtn.dataset.name;

          if (!confirm(`Xác nhận buổi tập với ${studentName} đã hoàn thành?\n(Buổi này sẽ được trừ từ gói PT.)`)) return;

          confirmBtn.disabled = true;
          confirmBtn.innerHTML = `<span class="material-symbols-outlined text-xs animate-spin">autorenew</span> Đang lưu...`;

          await _confirmScheduleSession(scheduleId, studentName, confirmBtn);
          return;
        }

        // --- Hủy buổi tập ---
        const cancelBtn = e.target.closest('.btn-cancel-session');
        if (cancelBtn) {
          const scheduleId = cancelBtn.dataset.id;
          const studentName = cancelBtn.dataset.name;
          await _cancelScheduleSession(scheduleId, studentName);
          return;
        }

        // --- Sửa lịch tập ---
        const editBtn = e.target.closest('.btn-edit-session');
        if (editBtn) {
          try {
            const sData = JSON.parse(decodeURIComponent(editBtn.dataset.sdata));
            _showEditScheduleModal(sData);
          } catch (err) {
            console.error(err);
          }
          return;
        }

        // --- Thêm/sửa ghi chú ---
        const noteBtn = e.target.closest('.btn-pt-edit-note');
        if (noteBtn) {
          const scheduleId = noteBtn.dataset.id;
          const currentNote = noteBtn.dataset.ghiChu || '';
          _showNoteModal(scheduleId, currentNote);
          return;
        }
      });

      // Tự động tải lịch dạy mới nhất từ backend khi vào tab
      try {
        const res = await window.GymApp.api.get('/pt/schedules');
        if (res?.success) {
          window.GymApp.data.ptSchedules = res.data || [];
          self._applyFilter(false);
        }
      } catch (e) {
        console.error('PT Schedule auto-fetch error:', e);
      }
    }
  };

  // ── Học viên của tôi ──────────────────────────────────────
  pages['my-students'] = {
    render() {
      return `
        <div class="flex flex-col gap-loose">
          <div id="students-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-loose">
            <div class="col-span-full bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose text-center text-on-surface-variant">
              <span class="material-symbols-outlined text-4xl block mb-standard animate-spin">refresh</span>
              <p class="font-body-sm text-body-sm">Đang tải...</p>
            </div>
          </div>
        </div>
      `;
    },

    async init() {
      try {
        const res = await window.GymApp.api.get('/pt/schedules/my-members');
        if (res?.success) {
          window.GymApp.data.myStudents = (res.data || []).map(m => ({
            ...m,
            buoi_da_tap: m.so_buoi_da_tap || 0,
            tong_buoi_dk: m.so_buoi_dang_ky || 0,
            ngay_het_han: m.den_ngay || null
          }));
        }
      } catch (e) {
        // Fallback: tổng hợp từ ptSchedules nếu API chưa sẵn sàng
        const schedules = window.GymApp.data.ptSchedules || [];
        const map = {};
        schedules.forEach(s => {
          if (!s.hoi_vien_id) return;
          if (!map[s.hoi_vien_id]) map[s.hoi_vien_id] = {
            ho_so_id: s.hoi_vien_id, ho_ten: s.ten_hoi_vien, avatar_url: s.avatar_hoi_vien,
            buoi_da_tap: 0, buoi_con_lai: s.buoi_con_lai ?? 0, tong_buoi_dk: 0,
            ten_goi_pt: '—', ngay_het_han: null,
          };
          map[s.hoi_vien_id].tong_buoi_dk++;
          if (s.trang_thai === 'da_tap' || s.trang_thai === 'da_xac_nhan') map[s.hoi_vien_id].buoi_da_tap++;
          map[s.hoi_vien_id].buoi_con_lai = s.buoi_con_lai ?? 0;
        });
        window.GymApp.data.myStudents = Object.values(map);
      }
      this._renderGrid();
    },

    _renderGrid() {
      const students = window.GymApp.data.myStudents || [];
      const grid = document.getElementById('students-grid');
      if (!grid) return;

      if (!students.length) {
        grid.innerHTML = `
          <div class="col-span-full bg-surface-container-lowest rounded-2xl border border-outline-variant p-margin text-center text-on-surface-variant">
            <span class="material-symbols-outlined text-4xl text-outline block mb-standard">person_off</span>
            <p class="font-bold text-on-surface">Chưa có học viên nào</p>
            <p class="font-body-sm text-body-sm mt-xs">Học viên sẽ xuất hiện khi bạn có lịch tập đang hoạt động</p>
          </div>`;
        return;
      }

      grid.innerHTML = students.map(sv => {
        const total = sv.tong_buoi_dk || (sv.buoi_da_tap + sv.buoi_con_lai) || 0;
        const done = sv.buoi_da_tap || 0;
        const left = sv.buoi_con_lai ?? 0;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const isAlert = left <= 3 && left > 0;
        const isAlmost = pct >= 80;

        const progressColor = pct >= 80 ? '#e65100' : pct >= 50 ? '#f59e0b' : '#1D9336';
        const progressGradient = pct >= 80 ? 'linear-gradient(90deg,#ea580c,#f97316)' : pct >= 50 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#15803d,#4ade80)';
        const hetHan = sv.ngay_het_han ? window.GymApp.formatDate(sv.ngay_het_han) : null;

        return `
          <div class="group relative rounded-3xl overflow-hidden flex flex-col gap-4 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 bg-surface-container-lowest border ${isAlmost ? 'border-[#fdba74]' : 'border-outline-variant'}">
            <!-- Accent bar top -->
            <div style="position:absolute;top:0;left:0;right:0;height:4px;background:${progressGradient};border-radius:4px 4px 0 0;"></div>
            
            <!-- Card Header: Avatar & Info -->
            <div class="flex items-start gap-4 pt-6 px-5 relative">
              <div class="relative flex-shrink-0">
                ${window.GymApp.avatarImg(sv.avatar_url, sv.ho_ten, 'lg')}
                ${isAlert ? `<span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#e65100] border-2 border-surface-lowest rounded-full shadow-sm animate-pulse" title="Sắp hết buổi"></span>` : ''}
              </div>
              <div class="flex flex-col min-w-0 flex-1 pt-1">
                <span class="font-bold text-on-surface text-body-lg truncate block leading-tight mb-1" title="${sv.ho_ten || '—'}">${sv.ho_ten || '—'}</span>
                <span class="text-on-surface-variant font-body-sm truncate block mb-1">${sv.ten_goi_pt || 'Gói PT'}</span>
                ${isAlert ? `<span class="inline-flex w-fit items-center px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider bg-[#fff7ed] text-[#ea580c] border border-[#ffedd5]">Còn ${left} buổi</span>` : ''}
              </div>
            </div>

            <!-- Stats Grid -->
            <div class="px-5 mt-2">
              <div class="grid grid-cols-3 gap-2 p-1 bg-surface-container-low rounded-2xl border border-outline-variant/30 text-center relative overflow-hidden">
                <div class="py-2 z-10 flex flex-col items-center justify-center">
                  <span class="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-0.5">Đã tập</span>
                  <span class="font-bold text-brand-primary text-body-lg leading-none">${done}</span>
                </div>
                <div class="py-2 z-10 flex flex-col items-center justify-center border-x border-outline-variant/30">
                  <span class="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-0.5">Còn lại</span>
                  <span class="font-bold text-body-lg leading-none ${left <= 3 ? 'text-[#e65100]' : 'text-on-surface'}">${left}</span>
                </div>
                <div class="py-2 z-10 flex flex-col items-center justify-center">
                  <span class="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-0.5">Tổng</span>
                  <span class="font-bold text-on-surface text-body-lg leading-none">${total}</span>
                </div>
              </div>
            </div>

            <!-- Progress section -->
            <div class="px-5 pb-6 mt-auto">
              <div class="flex justify-between items-end mb-2">
                <span class="text-[11px] uppercase font-bold tracking-widest text-on-surface-variant">Tiến độ</span>
                <span class="font-bold text-body-sm leading-none" style="color:${progressColor}">${pct}%</span>
              </div>
              <div class="h-2.5 rounded-full bg-surface-container overflow-hidden shadow-inner">
                <div class="h-full rounded-full transition-all duration-1000 ease-out" style="width:${pct}%;background:${progressGradient};box-shadow:inset 0 1px 2px rgba(255,255,255,0.3)"></div>
              </div>
              ${hetHan ? `<div class="mt-4 flex items-center gap-1.5 text-on-surface-variant bg-surface-container-low/50 w-fit px-3 py-1.5 rounded-lg border border-outline-variant/30">
                <span class="material-symbols-outlined text-[14px]">event</span>
                <span class="text-[11px] font-medium">Hết hạn: ${hetHan}</span>
              </div>` : ''}
            </div>
          </div>
        `;
      }).join('');
    }
  };

  // ── Hồ sơ cá nhân ─────────────────────────────────────────
  pages['pt-me'] = {
    async _load(memberId) {
      const endpoint = memberId ? `/pt-me/thread?hoi_vien_id=${memberId}` : '/pt-me/overview';
      const res = await window.GymApp.api.get(endpoint);
      if (res?.success) {
        if (memberId) window.GymApp.data.ptMeThread = res.data || {};
        else window.GymApp.data.ptMeOverview = res.data || {};
      }
    },
    render() {
      const latest = window.GymApp.data.ptMeOverview?.latest || [];
      const students = (window.GymApp.data.ptMeStudents || []).map(s => ({
        id: s.hoi_vien_id,
        name: s.ho_ten || s.ten_hoi_vien || s.ma_ho_so,
      }));
      const seen = new Set();
      latest.forEach(x => {
        if (x.hoi_vien_id && !seen.has(x.hoi_vien_id)) {
          seen.add(x.hoi_vien_id);
          if (!students.some(s => s.id === x.hoi_vien_id)) {
            students.push({ id: x.hoi_vien_id, name: x.ten_hoi_vien });
          }
        }
      });
      return `
        <div class="flex flex-col gap-loose">
          <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm">
            <h2 class="text-display-sm font-bold text-on-surface">PT & Tôi</h2>
            <p class="text-on-surface-variant mt-1">Xem cập nhật của học viên và gửi lời dặn cho buổi tiếp theo.</p>
            <div class="mt-4 flex flex-wrap gap-3">
              <select id="ptme-member" class="bg-surface-container-low border border-outline-variant text-on-surface px-4 py-3 rounded-xl outline-none min-w-[220px]">
                <option value="">Chọn học viên</option>
                ${students.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
              </select>
              <button id="ptme-load" class="px-5 py-3 rounded-xl bg-brand-primary text-white font-bold">Mở luồng</button>
            </div>
          </div>
          <section id="ptme-thread" class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            ${this._renderLatest(latest)}
          </section>
        </div>
      `;
    },
    _renderLatest(list) {
      if (!list.length) return `<div class="p-margin text-center text-on-surface-variant"><span class="material-symbols-outlined text-4xl text-outline block mb-standard">forum</span><p class="font-bold">Chưa có cập nhật PT & Tôi</p></div>`;
      const currentUserId = window.GymApp.auth?.user?.id;
      return `<div class="divide-y divide-outline-variant">${list.map(item => `
        <div class="p-loose">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-bold text-on-surface">${item.ten_hoi_vien || item.ten_nguoi_gui || 'Học viên'} ${item.da_chinh_sua ? '<span class="text-label-sm text-on-surface-variant">(đã chỉnh sửa)</span>' : ''}</p>
              <span class="text-label-sm text-on-surface-variant">${item.ngay_cap_nhat || item.ngay_tao || ''}</span>
            </div>
            ${item.nguoi_gui_id === currentUserId ? `<button class="ptme-edit text-brand-primary font-bold text-label-md" data-id="${item.id}">Sửa</button>` : ''}
          </div>
          <p class="text-body-sm text-on-surface-variant mt-2">${item.cam_nhan_tap || item.khau_phan_an || item.noi_dung_tap || item.loi_dan || item.ghi_chu || '—'}</p>
        </div>
      `).join('')}</div>`;
    },
    _renderThread(data) {
      const entries = data.entries || [];
      const pair = data.pair || {};
      return `
        <div class="p-loose border-b border-outline-variant">
          <h3 class="font-bold text-on-surface text-display-xs">${pair.ten_hoi_vien || 'Học viên'}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <textarea id="ptme-workout" rows="2" class="bg-surface-container border border-outline-variant rounded-xl px-4 py-3 outline-none" placeholder="Hôm nay/tới buổi sau tập gì?"></textarea>
            <textarea id="ptme-food" rows="2" class="bg-surface-container border border-outline-variant rounded-xl px-4 py-3 outline-none" placeholder="Cần ăn gì, lưu ý khẩu phần?"></textarea>
            <input id="ptme-minutes" type="number" min="0" max="600" class="bg-surface-container border border-outline-variant rounded-xl px-4 py-3 outline-none" placeholder="Số phút tập đề xuất" />
            <textarea id="ptme-note" rows="2" class="bg-surface-container border border-outline-variant rounded-xl px-4 py-3 outline-none" placeholder="Lời dặn thêm"></textarea>
          </div>
          <button id="ptme-submit" class="mt-4 px-5 py-3 rounded-xl bg-brand-primary text-white font-bold">Gửi lời dặn</button>
        </div>
        ${this._renderLatest(entries)}
      `;
    },
    async init() {
      await this._load();
      document.getElementById('ptme-load')?.addEventListener('click', async () => {
        const memberId = document.getElementById('ptme-member')?.value;
        if (!memberId) return window.GymApp.toast('Vui lòng chọn học viên', 'error');
        await this._load(memberId);
        const wrap = document.getElementById('ptme-thread');
        if (wrap) wrap.innerHTML = this._renderThread(window.GymApp.data.ptMeThread || {});
        wrap?.addEventListener('click', e => {
          const editBtn = e.target.closest('.ptme-edit');
          if (!editBtn) return;
          const item = (window.GymApp.data.ptMeThread?.entries || []).find(x => String(x.id) === String(editBtn.dataset.id));
          if (!item) return;
          document.getElementById('ptme-workout').value = item.noi_dung_tap || '';
          document.getElementById('ptme-food').value = item.khau_phan_an || '';
          document.getElementById('ptme-minutes').value = item.so_phut_tap ?? '';
          document.getElementById('ptme-note').value = item.loi_dan || '';
          const submit = document.getElementById('ptme-submit');
          submit.dataset.editId = item.id;
          submit.textContent = 'Cập nhật lời dặn';
          document.getElementById('ptme-workout')?.focus();
        });
        document.getElementById('ptme-submit')?.addEventListener('click', async () => {
          const btn = document.getElementById('ptme-submit');
          btn.disabled = true; btn.textContent = 'Đang gửi...';
          try {
            const payload = {
              hoi_vien_id: Number(memberId),
              noi_dung_tap: document.getElementById('ptme-workout')?.value?.trim(),
              khau_phan_an: document.getElementById('ptme-food')?.value?.trim(),
              so_phut_tap: document.getElementById('ptme-minutes')?.value ? Number(document.getElementById('ptme-minutes').value) : null,
              loi_dan: document.getElementById('ptme-note')?.value?.trim(),
            };
            const editId = btn.dataset.editId;
            const res = editId ? await window.GymApp.api.put(`/pt-me/thread/${editId}`, payload) : await window.GymApp.api.post('/pt-me/thread', payload);
            if (res?.success) {
              window.GymApp.toast(editId ? 'Đã cập nhật và báo cho hội viên!' : 'Đã gửi lời dặn cho hội viên!', 'success');
              await this._load(memberId);
              wrap.innerHTML = this._renderThread(window.GymApp.data.ptMeThread || {});
            }
          } finally {
            delete btn.dataset.editId;
            btn.disabled = false; btn.textContent = 'Gửi lời dặn';
          }
        });
      });
    }
  };

  pages['my-profile'] = {
    render() {
      const u = window.GymApp.data.myProfile || window.GymApp.auth.user || {};
      const fields = [
        { label: 'Mã hồ sơ', value: u.ma_ho_so, icon: 'badge' },
        { label: 'Họ tên', value: u.ho_ten, icon: 'person' },
        { label: 'Giới tính', value: u.gioi_tinh === 'nam' ? 'Nam' : u.gioi_tinh === 'nu' ? 'Nữ' : u.gioi_tinh || '—', icon: 'wc' },
        { label: 'Ngày sinh', value: window.GymApp.formatDate(u.ngay_sinh), icon: 'cake' },
        { label: 'Số điện thoại', value: u.so_dien_thoai, icon: 'phone' },
        { label: 'Email', value: u.email, icon: 'email' },
        { label: 'Chuyên môn', value: u.chuyen_mon, icon: 'fitness_center' },
        { label: 'Chi nhánh', value: u.chi_nhanh, icon: 'location_on' },
      ];

      const isActive = u.trang_thai === 'hoat_dong';
      const statusText = isActive ? '● Đang làm việc' : '○ Tạm nghỉ';
      const rating = u.danh_gia || u.rating || 0;
      const stars = Array.from({ length: 5 }, (_, i) =>
        `<span class="material-symbols-outlined" style="font-size:14px;color:${i < Math.round(rating) ? '#fbbf24' : 'rgba(255,255,255,0.3)'};font-variation-settings:'FILL' 1;">star</span>`
      ).join('');

      return `
        <div class="flex flex-col gap-6">
          <div class="bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm overflow-hidden">

            <!-- Banner Header (members-list style) -->
            <div style="background:linear-gradient(135deg,#065f46 0%,#10b981 60%,#34d399 100%);padding:20px 24px 0;position:relative;overflow:hidden;min-height:130px;">
              <div style="position:absolute;top:-30px;right:-30px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.07);"></div>
              <div style="position:absolute;top:20px;right:80px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>
              <div style="position:absolute;bottom:-20px;left:120px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>

              <!-- Avatar + Name -->
              <div style="display:flex;align-items:flex-end;gap:16px;margin-bottom:16px;position:relative;z-index:1;">
                <div style="position:relative;flex-shrink:0;">
                  <div style="width:80px;height:80px;border-radius:50%;border:3px solid rgba(255,255,255,0.6);overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.25);">
                    ${window.GymApp.avatarImg(u.avatar_url, u.ho_ten, 'lg', 'width:100%;height:100%;object-fit:cover;')}
                  </div>
                  <span style="position:absolute;bottom:3px;right:3px;width:14px;height:14px;border-radius:50%;background:${isActive ? '#4ade80' : '#94a3b8'};border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></span>
                </div>
                <div style="flex:1;min-width:0;padding-bottom:4px;">
                  <h3 style="font-size:22px;font-weight:800;color:#fff;line-height:1.2;margin:0 0 4px;text-shadow:0 1px 4px rgba(0,0,0,0.2);">${u.ho_ten || '—'}</h3>
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span style="font-size:12px;color:rgba(255,255,255,0.85);font-weight:600;">${u.ma_ho_so || '—'}</span>
                    <span style="width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.5);"></span>
                    <span style="font-size:12px;color:rgba(255,255,255,0.85);">Huấn luyện viên</span>
                    <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:${isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};color:#fff;border:1px solid rgba(255,255,255,0.3);">${statusText}</span>
                  </div>
                  <!-- Stars -->
                  <div style="display:flex;align-items:center;gap:3px;margin-top:6px;">
                    ${stars}
                    <span style="font-size:12px;font-weight:700;color:#fff;margin-left:4px;">${rating ? rating.toFixed(1) : '—'}/5</span>
                  </div>
                </div>
              </div>

              <!-- Quick Stats Bar -->
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,0.15);border-radius:12px 12px 0 0;overflow:hidden;">
                <div style="background:rgba(0,0,0,0.15);padding:10px 14px;backdrop-filter:blur(4px);">
                  <div style="font-size:10px;color:rgba(255,255,255,0.65);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">Chuyên môn</div>
                  <div style="font-size:13px;font-weight:800;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${u.chuyen_mon || '—'}">${u.chuyen_mon || '—'}</div>
                </div>
                <div style="background:rgba(0,0,0,0.15);padding:10px 14px;backdrop-filter:blur(4px);">
                  <div style="font-size:10px;color:rgba(255,255,255,0.65);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">Kinh nghiệm</div>
                  <div style="font-size:13px;font-weight:800;color:#fff;">${u.kinh_nghiem || 0} năm</div>
                </div>
                <div style="background:rgba(0,0,0,0.15);padding:10px 14px;backdrop-filter:blur(4px);">
                  <div style="font-size:10px;color:rgba(255,255,255,0.65);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">Tổng buổi dạy</div>
                  <div style="font-size:13px;font-weight:800;color:#fff;">${u.tong_buoi_da_day || 0} buổi</div>
                </div>
              </div>
            </div>

            <!-- Info Body -->
            <div style="padding:20px 24px 24px;" class="bg-surface-container-lowest">
              <!-- Section title -->
              <div style="display:flex;align-items:center;gap:8px;margin:4px 0 16px;">
                <span class="material-symbols-outlined" style="font-size:15px;color:#10b981;font-variation-settings:'FILL' 1;">badge</span>
                <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#10b981;">Thông tin cá nhân</span>
                <div style="flex:1;height:1px;background:linear-gradient(to right,#10b98140,transparent);margin-left:4px;"></div>
              </div>

              <!-- 2-col info grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-[1px] bg-outline-variant rounded-xl overflow-hidden border border-outline-variant">
                ${fields.map(f => `
                  <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg-surface-lowest, #fff);">
                    <div style="width:32px;height:32px;border-radius:8px;background:var(--bg-surface-low, #eff8ff);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                      <span class="material-symbols-outlined" style="font-size:16px;color:#0ea5e9;font-variation-settings:'FILL' 1;">${f.icon}</span>
                    </div>
                    <div style="flex:1;min-width:0;">
                      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-on-surface-variant);opacity:0.6;margin-bottom:2px;">${f.label}</div>
                      <div style="font-size:13px;font-weight:700;color:var(--text-on-surface);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${f.value || '—'}">${f.value || '—'}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    },
    async init() {
      try {
        const res = await window.GymApp.api.get('/members/me/profile');
        if (res?.success) {
          window.GymApp.data.myProfile = { ...res.data, ...res.data.ho_so };
          document.getElementById('content-area').innerHTML = this.render();
        }
      } catch (e) { console.error(e); }
    }
  };

  pages['gym-rules'] = {
    rules: [],
    render() {
      const activeRules = this.rules.filter(r => r.is_active === 1 && (r.ap_dung_cho === 'tat_ca' || r.ap_dung_cho === 'pt'));
      return `
        <div class="flex flex-col gap-loose">
          <div class="page-title-bar">
            <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Nội quy phòng tập</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs">Quy định và hướng dẫn chung dành cho Huấn luyện viên (PT) tại Paradise GYM</p>
          </div>

          <div class="grid grid-cols-1 gap-standard">
            ${activeRules.length === 0 ? `
              <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-margin text-center text-on-surface-variant">
                <span class="material-symbols-outlined text-4xl text-outline block mb-standard">gavel</span>
                <p class="font-bold text-on-surface">Không có nội quy nào</p>
              </div>
            ` : activeRules.map((r, index) => `
              <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-start gap-standard">
                  <div class="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold shrink-0">
                    ${index + 1}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-on-surface text-body-md">${r.tieu_de}</h3>
                    <p class="text-body-sm text-on-surface-variant mt-xs whitespace-pre-line leading-relaxed">${r.noi_dung}</p>
                    <div class="mt-standard flex items-center gap-xs opacity-40">
                      <span class="material-symbols-outlined text-sm">schedule</span>
                      <span class="text-xs font-bold">Cập nhật: ${window.GymApp.formatDate(r.ngay_cap_nhat)}</span>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    },
    async init() {
      const self = this;
      try {
        const res = await window.GymApp.api.get('/config/rules');
        if (res?.success) {
          self.rules = res.data || [];
          const container = document.getElementById('content-area');
          if (window.GymApp.currentPage === 'gym-rules' && container) {
            container.innerHTML = self.render();
          }
        }
      } catch (err) {
        console.error('Lỗi tải nội quy:', err);
      }
    }
  };

  window.GymApp = window.GymApp || {};
  window.GymApp.pages = pages;

  // ── Khởi động ──────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', initPortal);

})();