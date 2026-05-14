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
    if (user.vai_tro === 'admin' || user.vai_tro === 'le_tan') {
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
      const [schedulesRes, profileRes, notifRes] = await Promise.all([
        window.GymApp.api.get('/pt/schedules'),
        window.GymApp.api.get('/auth/me'),
        window.GymApp.api.get('/members/me/notifications'),
      ]);
      if (schedulesRes?.success) window.GymApp.data.ptSchedules = schedulesRes.data || [];
      if (profileRes?.success) window.GymApp.data.myProfile = profileRes.data;
      if (notifRes?.success) window.GymApp.data.myNotifications = notifRes.data?.notifications || [];
    } catch (err) {
      console.error('PT Portal: fetch data failed', err);
    }
  }

  // ── Thông báo Bell Icon cho PT ──────────────────────

  const PT_NOTIF_STYLE = {
    danger: { bg: '#fff0f0', border: '#fca5a5', icon_color: '#dc2626', text_color: '#7f1d1d' },
    warning: { bg: '#fffbeb', border: '#fcd34d', icon_color: '#d97706', text_color: '#78350f' },
    info: { bg: '#eff6ff', border: '#93c5fd', icon_color: '#2563eb', text_color: '#1e3a5f' },
    success: { bg: '#f0fdf4', border: '#86efac', icon_color: '#16a34a', text_color: '#14532d' },
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
          <div class="page-title-bar">
            <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Xin chào, ${window.GymApp.auth.user?.ho_ten || 'PT'} 👋</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs">Đây là tổng quan lịch làm việc của bạn hôm nay.</p>
          </div>

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

  // ── Lịch tập của tôi ──────────────────────────────────────
  pages['my-schedule'] = {
    _filter: '',
    _status: '',

    render() {
      const schedules = window.GymApp.data.ptSchedules || [];
      return `
        <div class="flex flex-col gap-loose">
          <div class="page-title-bar">
            <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Lịch tập của tôi</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs">Toàn bộ lịch tập được phân công cho bạn</p>
          </div>

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
            </div>
          </div>

          <!-- Table -->
          <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <div id="schedule-table-wrap">
              ${this._renderTable(schedules)}
            </div>
          </div>
        </div>
      `;
    },

    _renderTable(list) {
      if (!list.length) return `
        <div class="p-margin text-center text-on-surface-variant">
          <span class="material-symbols-outlined text-4xl text-outline block mb-standard">event_busy</span>
          <p class="font-bold">Không tìm thấy lịch tập</p>
        </div>`;

      return `
        <div class="overflow-x-auto">
          <table class="gym-table w-full">
            <thead>
              <tr>
                <th>Học viên</th>
                <th>Ngày tập</th>
                <th>Giờ</th>
                <th>Loại buổi</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
                <th class="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(s => `
                <tr>
                  <td>
                    <div class="flex items-center gap-compact">
                      ${window.GymApp.avatarImg(s.avatar_hoi_vien, s.ten_hoi_vien, 'sm')}
                      <span class="font-bold text-on-surface">${s.ten_hoi_vien || '—'}</span>
                    </div>
                  </td>
                  <td class="text-on-surface-variant">${window.GymApp.formatDate(s.ngay_tap)}</td>
                  <td class="font-bold text-on-surface">${s.gio_bat_dau} — ${s.gio_ket_thuc}</td>
                  <td><span class="bg-surface-container px-compact py-xs rounded-full text-body-sm text-on-surface-variant font-bold">${s.loai_buoi === 'nhom' ? 'Nhóm' : 'Cá nhân'}</span></td>
                  <td>${window.GymApp.statusBadge(s.trang_thai)}</td>
                  <td class="text-on-surface-variant text-body-sm max-w-[160px] truncate">${s.ghi_chu || '—'}</td>
                  <td class="text-center">
                    ${s.trang_thai === 'cho_tap'
          ? `<button
                            class="btn-confirm-session inline-flex items-center gap-xs px-standard py-xs rounded-xl bg-brand-primary text-white font-bold text-body-sm hover:bg-brand-primary/80 active:scale-95 transition-all shadow-sm whitespace-nowrap"
                            data-id="${s.id}"
                            data-name="${s.ten_hoi_vien || 'học viên'}"
                          >
                            <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1"></span>
                            Xác nhận đã tập
                          </button>`
          : `<span class="text-outline text-body-sm">—</span>`
        }
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`;
    },

    _applyFilter() {
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
      document.getElementById('sch-search')?.addEventListener('input', () => self._applyFilter());
      document.getElementById('sch-status')?.addEventListener('change', () => self._applyFilter());
      document.getElementById('sch-date')?.addEventListener('change', () => self._applyFilter());
      document.getElementById('sch-reload')?.addEventListener('click', async () => {
        try {
          const res = await window.GymApp.api.get('/pt/schedules');
          if (res?.success) window.GymApp.data.ptSchedules = res.data || [];
        } catch (e) { console.error(e); }
        document.getElementById('sch-search').value = '';
        document.getElementById('sch-status').value = '';
        document.getElementById('sch-date').value = '';
        self._applyFilter();
        window.GymApp.toast('Đã tải lại lịch tập!', 'success');
      });

      // Xác nhận buổi tập — event delegation
      document.getElementById('schedule-table-wrap')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-confirm-session');
        if (!btn || btn.disabled) return;

        const scheduleId = btn.dataset.id;
        const studentName = btn.dataset.name;

        if (!confirm(`Xác nhận buổi tập với ${studentName} đã hoàn thành?\n(Buổi này sẽ được trừ từ gói PT.)`)) return;

        // Hiện trạng thái loading trên nút
        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">autorenew</span> Đang xử lý...`;

        try {
          const res = await window.GymApp.api.put(`/pt/schedules/${scheduleId}/confirm`, {});
          if (res?.success) {
            // Cập nhật dữ liệu cục bộ ngay không cần reload toàn bộ
            window.GymApp.toast(`✅ Đã xác nhận buổi tập với ${studentName}!`, 'success');

            // Reload lại dữ liệu từ server rồi render lại bảng
            const fresh = await window.GymApp.api.get('/pt/schedules');
            if (fresh?.success) window.GymApp.data.ptSchedules = fresh.data || [];
            self._applyFilter();
          } else {
            window.GymApp.toast(res?.message || 'Xác nhận thất bại!', 'error');
            btn.disabled = false;
            btn.innerHTML = `<span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">check_circle</span> Xác nhận đã tập`;
          }
        } catch (err) {
          console.error(err);
          window.GymApp.toast('Lỗi kết nối, vui lòng thử lại.', 'error');
          btn.disabled = false;
          btn.innerHTML = `<span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">check_circle</span> Xác nhận đã tập`;
        }
      });
    }
  };

  // ── Học viên của tôi ──────────────────────────────────────
  pages['my-students'] = {
    render() {
      const schedules = window.GymApp.data.ptSchedules || [];
      const studentMap = {};
      schedules.forEach(s => {
        if (!s.hoi_vien_id) return;
        if (!studentMap[s.hoi_vien_id]) {
          studentMap[s.hoi_vien_id] = {
            id: s.hoi_vien_id, ten: s.ten_hoi_vien, avatar: s.avatar_hoi_vien,
            buoi_con_lai: s.buoi_con_lai, tong_buoi: 0, da_tap: 0,
          };
        }
        studentMap[s.hoi_vien_id].tong_buoi++;
        if (s.trang_thai === 'da_tap') studentMap[s.hoi_vien_id].da_tap++;
        studentMap[s.hoi_vien_id].buoi_con_lai = s.buoi_con_lai;
      });
      const students = Object.values(studentMap);

      return `
        <div class="flex flex-col gap-loose">
          <div class="page-title-bar">
            <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Học viên của tôi</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs">Danh sách học viên đang tập với bạn</p>
          </div>

          ${students.length === 0
          ? `<div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-margin text-center text-on-surface-variant">
                 <span class="material-symbols-outlined text-4xl text-outline block mb-standard">person_off</span>
                 <p class="font-bold">Chưa có học viên nào</p>
               </div>`
          : `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-loose">
                ${students.map(sv => `
                  <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm flex flex-col items-center gap-standard">
                    ${window.GymApp.avatarImg(sv.avatar, sv.ten, 'lg')}
                    <div class="text-center">
                      <p class="font-bold text-on-surface text-body-md">${sv.ten || '—'}</p>
                    </div>
                    <div class="w-full grid grid-cols-2 gap-sm">
                      <div class="bg-surface-container rounded-xl p-compact text-center">
                        <p class="text-on-surface-variant text-body-sm">Đã tập</p>
                        <p class="font-bold text-brand-primary text-body-md">${sv.da_tap}</p>
                      </div>
                      <div class="bg-surface-container rounded-xl p-compact text-center">
                        <p class="text-on-surface-variant text-body-sm">Còn lại</p>
                        <p class="font-bold text-[#e65100] text-body-md">${sv.buoi_con_lai ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>`
        }
        </div>
      `;
    },
    init() { }
  };

  // ── Hồ sơ cá nhân ─────────────────────────────────────────
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

      return `
        <div class="flex flex-col gap-loose">
          <div class="page-title-bar">
            <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Hồ sơ cá nhân</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs">Thông tin cá nhân của bạn (chỉ xem)</p>
          </div>

          <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <!-- Avatar header -->
            <div class="section-header px-loose py-loose border-b border-outline-variant flex items-center gap-loose">
            <div class="flex-shrink-0">
                ${window.GymApp.avatarImg(u.avatar_url, u.ho_ten, 'xl')}
              </div>
              <div>
                <p class="font-bold text-on-surface text-display-2xl">${u.ho_ten || '—'}</p>
                <p class="text-on-surface-variant text-body-sm mt-xs">Huấn luyện viên · ${u.chuyen_mon || 'Chưa cập nhật chuyên môn'}</p>
              </div>
            </div>

            <!-- Fields -->
            <div class="p-loose grid grid-cols-1 md:grid-cols-2 gap-standard">
              ${fields.map(f => `
                <div class="flex items-start gap-compact p-standard rounded-xl bg-surface-container">
                  <div class="icon-bg icon-bg-green flex-shrink-0" style="width:32px;height:32px;border-radius:8px">
                    <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">${f.icon}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="text-on-surface-variant text-body-sm">${f.label}</p>
                    <p class="font-bold text-on-surface text-body-md truncate">${f.value || '—'}</p>
                  </div>
                </div>
              `).join('')}
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

  // ── Khởi động ──────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', initPortal);

})();
