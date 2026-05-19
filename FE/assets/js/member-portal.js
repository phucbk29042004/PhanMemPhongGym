/**
 * Member Portal - logic cho hoi vien.
 * Chi render giao dien; luong API/auth/QR giu theo backend hien co.
 */
(function () {
  const pages = window.GymApp.pages;

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function daysBetweenToday(dateValue) {
    if (!dateValue) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateValue);
    target.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((target - today) / 86400000));
  }

  function sortSchedules(list) {
    return [...(list || [])].sort((a, b) => {
      const left = `${a.ngay_tap || ''} ${a.gio_bat_dau || ''}`;
      const right = `${b.ngay_tap || ''} ${b.gio_bat_dau || ''}`;
      return left.localeCompare(right);
    });
  }

  function getActivePackage() {
    const packages = window.GymApp.data.myPackages || [];
    const today = todayKey();
    const active = packages.find(p => p.trang_thai === 'dang_hoat_dong' && p.den_ngay >= today);
    if (active) return active;
    return packages[0] || null;
  }

  function getActivePt() {
    const contracts = window.GymApp.data.myPtContracts || [];
    return contracts.find(p => p.trang_thai === 'dang_hoat_dong') || null;
  }

  function nextSchedules(limit = 3) {
    const today = todayKey();
    return sortSchedules(window.GymApp.data.ptSchedules || [])
      .filter(s => s.trang_thai === 'cho_tap' && s.ngay_tap >= today)
      .slice(0, limit);
  }

  async function initPortal() {
    const token = localStorage.getItem('gym-token');
    if (!token) { window.location.href = 'login.html'; return; }

    let user;
    try {
      const res = await window.GymApp.api.get('/auth/me');
      if (!res?.success) { window.location.href = 'login.html'; return; }
      user = res.data;
    } catch (_) {
      window.location.href = 'login.html';
      return;
    }

    if (user.vai_tro === 'admin' || user.vai_tro === 'le_tan') {
      window.location.href = 'index.html';
      return;
    }
    if (user.vai_tro === 'pt') {
      window.location.href = 'pt-portal.html';
      return;
    }

    window.GymApp.auth.user = user;
    _updateHeaderUI(user);
    await _fetchData();
    _initMemberNotifications(); // Khởi tạo bell icon thông báo
    _applyTheme(localStorage.getItem('gym-theme') || 'light');

    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      _applyTheme(isDark ? 'light' : 'dark');
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn đăng xuất?')) window.GymApp.auth.logout();
    });

    document.addEventListener('click', function (e) {
      const tabBtn = e.target.closest('[data-tab]');
      if (tabBtn?.dataset.tab) { navigate(tabBtn.dataset.tab); return; }

      const noteBtn = e.target.closest('.btn-member-edit-note');
      if (noteBtn) {
        const scheduleId = noteBtn.dataset.id;
        const oldNote = noteBtn.dataset.ghiChu;
        pages['my-schedule']._showEditNoteModal(scheduleId, oldNote);
      }
    });

    navigate('dashboard');
  }

  function _updateHeaderUI(user) {
    const headerAvatar = document.getElementById('header-avatar');
    if (headerAvatar) {
      headerAvatar.innerHTML = window.GymApp.avatarImg(user.avatar_url, user.ho_ten, 'sm');
    }
  }

  async function _fetchData() {
    try {
      const [schedulesRes, profileRes, checkinsRes, notifRes] = await Promise.all([
        window.GymApp.api.get('/pt/schedules'),
        window.GymApp.api.get('/members/me/profile'),
        window.GymApp.api.get('/checkins/me?limit=30'),
        window.GymApp.api.get('/members/me/notifications'),
      ]);

      if (schedulesRes?.success) window.GymApp.data.ptSchedules = schedulesRes.data || [];
      if (profileRes?.success) {
        const d = profileRes.data;
        window.GymApp.data.myProfile = d;
        window.GymApp.data.myPackages = d.goi_tap || [];
        window.GymApp.data.myPtContracts = d.dang_ky_pt || [];
      }
      if (checkinsRes?.success) {
        window.GymApp.data.myCheckins = checkinsRes.data?.data || checkinsRes.data || [];
      }
      if (notifRes?.success) {
        window.GymApp.data.myNotifications = notifRes.data?.notifications || [];
        window.GymApp.data.daCheckInHomNay = notifRes.data?.da_check_in_hom_nay || false;
      }
    } catch (err) {
      console.error('Member Portal: fetch data failed', err);
    }
  }

  function _applyTheme(t) {
    document.documentElement.classList.toggle('dark', t === 'dark');
    localStorage.setItem('gym-theme', t);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = t === 'dark' ? 'light_mode' : 'dark_mode';
  }

  // ── Bell Icon Thông Báo — Hội Viên ────────────────────

  // Xóa 1 thông báo khỏi mảng local và cập nhật UI
  function _removeMemberNotif(index) {
    const notifs = window.GymApp.data.myNotifications || [];
    notifs.splice(index, 1);
    window.GymApp.data.myNotifications = notifs;
    // Cập nhật badge
    const badge = document.getElementById('member-notif-badge');
    if (badge) {
      if (notifs.length > 0) { badge.textContent = notifs.length > 9 ? '9+' : notifs.length; badge.style.display = 'flex'; }
      else { badge.style.display = 'none'; }
    }
    // Re-render dropdown list
    _renderMemberDropdownList();
    // Re-render banner cards nếu đang ở dashboard
    if (window.GymApp.currentPage === 'dashboard') {
      const bannerWrap = document.getElementById('member-banner-notifs');
      if (bannerWrap) bannerWrap.outerHTML = _buildBannerHTML();
      _bindBannerButtons();
    }
  }

  // Xóa tất cả thông báo khỏi bộ nhớ và UI
  function _clearAllMemberNotifs() {
    window.GymApp.data.myNotifications = [];
    const badge = document.getElementById('member-notif-badge');
    if (badge) badge.style.display = 'none';
    _renderMemberDropdownList();
    if (window.GymApp.currentPage === 'dashboard') {
      const bannerWrap = document.getElementById('member-banner-notifs');
      if (bannerWrap) bannerWrap.remove();
    }
  }

  const NOTIF_STYLE = {
    danger:  { bg: 'var(--notif-danger-bg)', border: 'var(--notif-danger-border)', icon_color: 'var(--notif-danger-icon)', text_color: 'var(--notif-danger-text)' },
    warning: { bg: 'var(--notif-warning-bg)', border: 'var(--notif-warning-border)', icon_color: 'var(--notif-warning-icon)', text_color: 'var(--notif-warning-text)' },
    info:    { bg: 'var(--notif-info-bg)', border: 'var(--notif-info-border)', icon_color: 'var(--notif-info-icon)', text_color: 'var(--notif-info-text)' },
    success: { bg: 'var(--notif-success-bg)', border: 'var(--notif-success-border)', icon_color: 'var(--notif-success-icon)', text_color: 'var(--notif-success-text)' },
  };

  function _renderMemberDropdownList() {
    const notifs = window.GymApp.data.myNotifications || [];
    const list = document.getElementById('member-notif-list');
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
      const s = NOTIF_STYLE[n.muc_do] || NOTIF_STYLE.info;
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
          <button class="member-notif-del" data-idx="${idx}" title="Xóa" style="
            background:rgba(0,0,0,0.08);border:none;cursor:pointer;border-radius:6px;
            padding:3px;display:flex;align-items:center;justify-content:center;flex-shrink:0;
          " onmouseover="this.style.background='rgba(0,0,0,0.18)'" onmouseout="this.style.background='rgba(0,0,0,0.08)'">
            <span class="material-symbols-outlined" style="font-size:14px;color:${s.text_color}">close</span>
          </button>
        </div>
      `;
    }).join('');

    // Bind nút X trong dropdown
    list.querySelectorAll('.member-notif-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        _removeMemberNotif(parseInt(btn.dataset.idx));
      });
    });
  }

  function _initMemberNotifications() {
    const notifs = window.GymApp.data.myNotifications || [];

    // Badge
    const badge = document.getElementById('member-notif-badge');
    if (badge) {
      if (notifs.length > 0) { badge.textContent = notifs.length > 9 ? '9+' : notifs.length; badge.style.display = 'flex'; }
      else { badge.style.display = 'none'; }
    }

    _renderMemberDropdownList();

    // Toggle dropdown
    const btn = document.getElementById('member-notif-btn');
    const dropdown = document.getElementById('member-notif-dropdown');
    if (btn && dropdown) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display !== 'none' ? 'none' : 'block';
      });
      document.addEventListener('click', (e) => {
        if (!document.getElementById('member-notif-wrapper')?.contains(e.target)) {
          dropdown.style.display = 'none';
        }
      });
    }

    // Nút Xóa tất cả
    document.getElementById('member-notif-clear-all')?.addEventListener('click', (e) => {
      e.stopPropagation();
      _clearAllMemberNotifs();
    });
  }

  function navigate(tabName) {
    const page = pages[tabName];
    if (!page) return;

    const currentPage = pages[window.GymApp.currentPage];
    if (currentPage?.destroy) currentPage.destroy();

    const content = document.getElementById('content-area');
    if (content) content.innerHTML = page.render();

    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.classList.remove('member-nav-active', 'text-brand-primary', 'font-bold');
      btn.classList.add('text-on-surface-variant');
      if (btn.dataset.tab === tabName) {
        btn.classList.remove('text-on-surface-variant');
        btn.classList.add('member-nav-active', 'text-brand-primary', 'font-bold');
      }
    });

    window.GymApp.currentPage = tabName;
    if (page.init) setTimeout(() => { page.init(); _bindBannerButtons(); }, 50);
    else _bindBannerButtons();
  }

  function emptyState(icon, title, text = '') {
    return `
      <div class="member-card p-margin text-center text-on-surface-variant">
        <span class="material-symbols-outlined text-4xl text-outline block mb-standard">${icon}</span>
        <p class="font-bold text-on-surface">${title}</p>
        ${text ? `<p class="text-body-sm mt-xs">${text}</p>` : ''}
      </div>
    `;
  }

  // Helper: tạo HTML banner cards
  function _buildBannerHTML() {
    const notifs = window.GymApp.data.myNotifications || [];
    if (!notifs.length) return '';
    const cards = notifs.map((n, idx) => {
      const s = NOTIF_STYLE[n.muc_do] || NOTIF_STYLE.info;
      return `
        <div data-banner-idx="${idx}" style="
          background:${s.bg};border:1px solid ${s.border};
          border-radius:10px;padding:14px 16px;
          display:flex;align-items:flex-start;gap:12px;
          transition:opacity .25s;
        ">
          <span class="material-symbols-outlined" style="color:${s.icon_color};font-size:20px;flex-shrink:0;margin-top:1px;font-variation-settings:'FILL' 1">${n.icon}</span>
          <div style="flex:1;min-width:0">
            <p style="font-weight:700;font-size:13px;color:${s.text_color};margin:0 0 2px">${n.tieu_de}</p>
            <p style="font-size:12px;color:${s.text_color};opacity:0.85;margin:0;line-height:1.5">${n.noi_dung}</p>
          </div>
          <button class="banner-notif-del" data-idx="${idx}" title="Ẩn thông báo" style="
            background:rgba(0,0,0,0.08);border:none;cursor:pointer;border-radius:6px;
            padding:3px 4px;display:flex;align-items:center;flex-shrink:0;
          " onmouseover="this.style.background='rgba(0,0,0,0.18)'" onmouseout="this.style.background='rgba(0,0,0,0.08)'">
            <span class="material-symbols-outlined" style="font-size:16px;color:${s.text_color}">close</span>
          </button>
        </div>
      `;
    }).join('');
    return `<section id="member-banner-notifs" style="display:flex;flex-direction:column;gap:8px;">${cards}</section>`;
  }

  function _bindBannerButtons() {
    document.querySelectorAll('.banner-notif-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('[data-banner-idx]');
        if (!card) return;
        const idx = parseInt(btn.dataset.idx);
        card.style.opacity = '0';
        setTimeout(() => {
          _removeMemberNotif(idx);
          // Re-bind sau khi xóa vì index thay đổi
          _bindBannerButtons();
        }, 250);
      });
    });
  }

  // Helper: render danh sách Banner Card thông báo realtime
  function renderNotificationBanners() {
    return _buildBannerHTML();
  }

  function scheduleRow(s) {
    const day = s.ngay_tap ? new Date(s.ngay_tap) : null;
    const weekday = day ? day.toLocaleDateString('vi-VN', { weekday: 'short' }) : '—';
    const date = day ? day.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '—';
    return `
      <div class="p-s5 flex flex-col gap-s2 hover:bg-surface-container transition-colors">
        <div class="flex items-center gap-s4">
          <div class="bg-surface-container-low w-14 h-14 rounded-lg flex flex-col items-center justify-center shrink-0">
            <span class="font-bold text-brand-primary">${weekday}</span>
            <span class="text-label-sm text-on-surface-variant">${date}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-on-surface text-label-md truncate">${s.ten_pt ? `Tập cùng ${s.ten_pt}` : 'Lịch tập PT'}</p>
            <p class="text-label-sm text-on-surface-variant">${window.GymApp.formatTime(s.gio_bat_dau)} - ${window.GymApp.formatTime(s.gio_ket_thuc)} | ${window.GymApp.formatEnumLabel(s.loai_buoi || 'ca_nhan')}</p>
          </div>
          <div class="flex items-center gap-s2 shrink-0">
            <button class="btn-member-edit-note text-brand-primary hover:text-brand-primary/80 flex items-center justify-center p-2 rounded-xl hover:bg-brand-primary/10 transition-colors" data-id="${s.id}" data-ghi-chu="${(s.ghi_chu || '').replace(/"/g, '&quot;')}" title="Ghi chú">
              <span class="material-symbols-outlined text-[20px]">${s.ghi_chu ? 'edit_note' : 'add_notes'}</span>
            </button>
            ${window.GymApp.statusBadge(s.trang_thai)}
          </div>
        </div>
        ${s.ghi_chu ? `
          <div class="ml-[72px] bg-brand-primary/5 border border-brand-primary/10 rounded-xl p-s2 flex items-start gap-s1">
            <span class="material-symbols-outlined text-brand-primary text-[16px] shrink-0 mt-0.5" style="font-variation-settings:'FILL' 1">description</span>
            <p class="text-body-sm font-medium text-brand-primary/90 break-words flex-1"><strong class="text-brand-primary/70">Ghi chú:</strong> ${s.ghi_chu}</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  pages['dashboard'] = {
    _refreshTimer: null,
    _TTL_PHUT: 5,

    render() {
      const user = window.GymApp.auth.user || {};
      const activePackage = getActivePackage();
      const activePt = getActivePt();
      const upcoming = nextSchedules(3);
      const next = upcoming[0] || null;
      const daysLeft = daysBetweenToday(activePackage?.den_ngay);
      const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
      const ptRemain = activePt ? Math.max(0, (activePt.so_buoi_dang_ky || 0) - (activePt.so_buoi_da_tap || 0)) : null;
      const checkins = window.GymApp.data.myCheckins || [];

      const today = todayKey();
      const isExpired = !activePackage || activePackage.trang_thai === 'het_han' || activePackage.den_ngay < today;
      const pkgStatus = activePackage 
        ? (activePackage.den_ngay < today ? 'het_han' : activePackage.trang_thai) 
        : 'chua_dang_ky';

      return `
        <div class="space-y-s6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-s6">
            <section class="lg:col-span-2 relative overflow-hidden rounded-xl bg-primary-container text-white p-s6 min-h-[240px] flex flex-col justify-between">
              <div class="absolute inset-0 opacity-15 pointer-events-none" style="background:radial-gradient(circle at 20% 20%,#ffffff 0,transparent 28%),linear-gradient(135deg,#004d2a,#0c6c40 60%,#84d8a2)"></div>
              <div class="relative z-10">
                <span class="inline-block bg-white/20 px-s3 py-s1 rounded-full text-label-sm mb-s3">Buổi tập tiếp theo</span>
                <h2 class="text-display font-bold mb-s2">${next ? 'Lịch tập PT' : `Xin chào, ${user.ho_ten || 'Hội viên'}`}</h2>
                ${next ? `
                  <div class="flex flex-wrap items-center gap-s4 text-body-base opacity-95">
                    <span class="flex items-center gap-s1"><span class="material-symbols-outlined text-[20px]">schedule</span>${window.GymApp.formatDate(next.ngay_tap)}, ${next.gio_bat_dau || '—'}</span>
                    <span class="flex items-center gap-s1"><span class="material-symbols-outlined text-[20px]">person</span>PT: ${next.ten_pt || '—'}</span>
                  </div>
                ` : `<p class="text-body-base opacity-95">Hiện chưa có lịch tập sắp tới. Khi có lịch mới, thông tin sẽ xuất hiện tại đây.</p>`}
              </div>
              <div class="relative z-10 flex flex-wrap gap-s3">
                <button data-tab="my-schedule" class="bg-white text-primary-container px-s6 py-s3 rounded-full font-bold text-label-md hover:bg-surface-container-low transition-colors focus-ring">Xem lịch tập</button>
                ${isExpired 
                  ? `<button id="btn-banner-renew" class="bg-[#ba1a1a] hover:bg-[#961212] active:scale-95 text-white px-s4 py-s3 rounded-full text-label-md font-bold shadow-sm flex items-center gap-s1 transition-all"><span class="material-symbols-outlined text-[18px]">autorenew</span>Gia hạn ngay</button>`
                  : (isExpiringSoon ? `<button id="btn-banner-renew" class="bg-white/20 hover:bg-white/30 active:scale-95 text-white px-s4 py-s3 rounded-full text-label-md font-bold flex items-center gap-s1 transition-all"><span class="material-symbols-outlined text-[18px]">autorenew</span>Gia hạn ngay (còn ${daysLeft} ngày)</button>` : '')}
              </div>
            </section>
 
            <section class="member-card p-s6 flex flex-col items-center justify-center text-center">
              <h3 class="text-headline-sm font-bold text-brand-primary mb-s4">Check-in nhanh</h3>
              <div id="qr-wrapper" class="bg-white p-s4 rounded-xl border border-outline-variant shadow-sm mb-s4 flex items-center justify-center" style="width:168px;height:168px">
                <div class="flex flex-col items-center gap-s2 text-on-surface-variant">
                  <span class="material-symbols-outlined text-4xl">qr_code_2</span>
                  <p class="text-body-sm">Đang tạo mã...</p>
                </div>
              </div>
              <p id="qr-countdown" class="text-on-surface-variant text-label-sm">Mã hết hạn sau <strong id="qr-seconds">—</strong> giây</p>
              <button id="btn-refresh-qr" class="mt-s4 border border-brand-primary text-brand-primary px-s4 py-s2 rounded-full text-label-md font-bold hover:bg-surface-container transition-colors focus-ring">
                Làm mới mã
              </button>
            </section>
          </div>
 
          <div class="grid grid-cols-2 md:grid-cols-4 gap-s4">
            ${[
              { label: 'Gói tập', value: activePackage?.ten_goi || 'Chưa có', icon: 'card_membership', sub: activePackage ? `Hết hạn ${window.GymApp.formatDate(activePackage.den_ngay)}` : 'Liên hệ lễ tân' },
              { label: 'Ngày còn lại', value: daysLeft ?? '—', icon: 'hourglass_top', sub: activePackage ? 'Tính theo gói hiện tại' : 'Chưa đăng ký' },
              { label: 'Buổi PT còn lại', value: ptRemain ?? '—', icon: 'sports_gymnastics', sub: activePt?.ten_pt || 'Chưa có PT' },
              { label: 'Lượt vào/ra', value: checkins.length, icon: 'how_to_reg', sub: '30 lượt gần nhất' },
            ].map(item => `
              <div class="member-card p-s4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-s2">
                  <span class="text-on-surface-variant text-label-md">${item.label}</span>
                  <span class="material-symbols-outlined text-brand-primary">${item.icon}</span>
                </div>
                <div class="text-headline-sm font-bold text-on-surface truncate">${item.value}</div>
                <div class="text-brand-primary text-label-sm mt-s1 truncate">${item.sub}</div>
              </div>
            `).join('')}
          </div>
 
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-s6">
            <section class="member-card overflow-hidden">
              <div class="p-s5 border-b border-outline-variant flex justify-between items-center">
                <h3 class="text-headline-sm font-bold text-brand-primary">Lịch tập sắp tới</h3>
                <button data-tab="my-schedule" class="text-brand-primary text-label-md font-bold hover:underline">Xem tất cả</button>
              </div>
              <div class="divide-y divide-outline-variant">
                ${upcoming.length ? upcoming.map(scheduleRow).join('') : `<div class="p-s6">${emptyState('event_busy', 'Chưa có lịch sắp tới')}</div>`}
              </div>
            </section>
 
            <section class="member-card p-s5 flex flex-col gap-s4">
              <div class="flex items-center justify-between gap-s4">
                <h3 class="text-headline-sm font-bold text-brand-primary">Tình trạng hội viên</h3>
                <button id="btn-dashboard-renew" class="flex items-center gap-s1 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-s4 py-s2 rounded-full font-bold text-label-sm transition-all active:scale-95">
                  <span class="material-symbols-outlined text-[16px]">autorenew</span>Gia hạn gói
                </button>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-s4">
                <div class="bg-surface-container rounded-xl p-s4">
                  <p class="text-on-surface-variant text-label-md">Trạng thái gói</p>
                  <div class="mt-s2">${window.GymApp.statusBadge(pkgStatus)}</div>
                  <p class="text-body-sm text-on-surface-variant mt-s3">${activePackage ? `${window.GymApp.formatDate(activePackage.tu_ngay)} - ${window.GymApp.formatDate(activePackage.den_ngay)}` : 'Chưa có gói đang hoạt động'}</p>
                </div>
                <div class="bg-surface-container rounded-xl p-s4">
                  <p class="text-on-surface-variant text-label-md">Huấn luyện viên</p>
                  <p class="font-bold text-on-surface text-body-base mt-s2">${activePt?.ten_pt || 'Chưa đăng ký PT'}</p>
                  <p class="text-body-sm text-on-surface-variant mt-s1">${activePt ? `${ptRemain} buổi còn lại` : 'Có thể đăng ký tại quầy lễ tân'}</p>
                </div>
              </div>
              <div class="bg-surface-container rounded-xl p-s4">
                <p class="text-on-surface-variant text-label-md">Ghi chú</p>
                <p class="text-body-md text-on-surface mt-s2">${isExpiringSoon ? `Gói tập còn ${daysLeft} ngày. Bạn có thể gia hạn ngay trên App hoặc liên hệ lễ tân.` : 'Tất cả dữ liệu trên được lấy từ hệ thống hiện tại.'}</p>
              </div>
            </section>
          </div>
        </div>
      `;
    },

    async _loadQr() {
      try {
        const res = await window.GymApp.api.get('/checkin/my-qr');
        if (!res?.success) {
          document.getElementById('qr-wrapper').innerHTML = `<p class="text-error text-body-sm text-center">Không thể tải mã QR.</p>`;
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

      document.getElementById('btn-dashboard-renew')?.addEventListener('click', () => {
        _showMemberRenewalModal();
      });
      document.getElementById('btn-banner-renew')?.addEventListener('click', () => {
        _showMemberRenewalModal();
      });
    },

    destroy() {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    },
  };

  pages['my-schedule'] = {
    render() {
      const schedules = sortSchedules(window.GymApp.data.ptSchedules || []);
      return `
        <div class="space-y-s6">
          <div>
            <h2 class="text-headline-md font-bold text-on-surface">Lịch tập của tôi</h2>
            <p class="text-on-surface-variant text-body-md mt-s1">Toàn bộ lịch tập đã đặt trong hệ thống</p>
          </div>

          <div class="member-card p-s4">
            <div class="flex flex-wrap gap-s4 items-center">
              <select id="ms-status" class="bg-surface-container-low border border-outline-variant text-on-surface px-s4 py-s3 rounded-xl focus:border-brand-primary outline-none text-body-md flex-1 min-w-[160px]">
                <option value="">Tất cả trạng thái</option>
                <option value="cho_tap">Chờ tập</option>
                <option value="da_tap">Đã tập</option>
                <option value="da_huy">Đã hủy</option>
                <option value="vang">Vắng</option>
              </select>
              <input id="ms-date" type="date" class="bg-surface-container-low border border-outline-variant text-on-surface px-s4 py-s3 rounded-xl focus:border-brand-primary outline-none text-body-md flex-1 min-w-[160px]" />
              <button id="ms-reload" class="flex items-center gap-s2 px-s5 py-s3 rounded-full border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-all font-bold text-label-md">
                <span class="material-symbols-outlined text-sm">refresh</span>Tải lại
              </button>
            </div>
          </div>

          <section class="member-card overflow-hidden">
            <div id="ms-list" class="divide-y divide-outline-variant">
              ${this._renderList(schedules)}
            </div>
          </section>
        </div>
      `;
    },

    _renderList(list) {
      if (!list.length) return `<div class="p-s6">${emptyState('event_busy', 'Không tìm thấy lịch tập', 'Thử thay đổi bộ lọc hoặc tải lại dữ liệu.')}</div>`;
      return list.map(scheduleRow).join('');
    },

    _applyFilter() {
      const status = document.getElementById('ms-status')?.value || '';
      const date = document.getElementById('ms-date')?.value || '';
      const filtered = sortSchedules(window.GymApp.data.ptSchedules || []).filter(s => {
        const matchStatus = !status || s.trang_thai === status;
        const matchDate = !date || s.ngay_tap === date;
        return matchStatus && matchDate;
      });
      const list = document.getElementById('ms-list');
      if (list) list.innerHTML = this._renderList(filtered);
    },

    async init() {
      const self = this;
      try {
        const res = await window.GymApp.api.get('/pt/schedules');
        if (res?.success) {
          window.GymApp.data.ptSchedules = res.data || [];
          const list = document.getElementById('ms-list');
          if (list) list.innerHTML = self._renderList(sortSchedules(res.data || []));
        }
      } catch (e) {
        console.error('my-schedule fetch error', e);
      }

      document.getElementById('ms-status')?.addEventListener('change', () => self._applyFilter());
      document.getElementById('ms-date')?.addEventListener('change', () => self._applyFilter());
      document.getElementById('ms-list')?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-member-edit-note');
        if (editBtn) {
          const scheduleId = editBtn.dataset.id;
          const oldNote = editBtn.dataset.ghiChu;
          self._showEditNoteModal(scheduleId, oldNote);
        }
      });
      document.getElementById('ms-reload')?.addEventListener('click', async () => {
        const btn = document.getElementById('ms-reload');
        btn?.classList.add('opacity-50', 'pointer-events-none');
        try {
          const res = await window.GymApp.api.get('/pt/schedules');
          if (res?.success) {
            window.GymApp.data.ptSchedules = res.data || [];
            self._applyFilter();
          }
        } catch (e) {
          console.error(e);
        }
        btn?.classList.remove('opacity-50', 'pointer-events-none');
        window.GymApp.toast('Đã tải lại lịch tập!', 'success');
      });
    },

    _showEditNoteModal(scheduleId, oldNote) {
      const self = this;
      const overlay = document.createElement('div');
      overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9000;padding:20px;`;
      overlay.innerHTML = `
        <div class="animate-fade-in member-card" style="width:100%;max-width:440px;display:flex;flex-direction:column;border-radius:20px;overflow:hidden;background:var(--bg-surface-lowest);border:1px solid var(--outline-variant);box-shadow:0 12px 40px rgba(0,0,0,0.15);">
          <!-- Header -->
          <div style="padding:16px 20px;background:linear-gradient(135deg,#1D9336,#0a591c);color:#fff;display:flex;align-items:center;justify-content:space-between;">
            <h3 style="font-size:15px;font-weight:800;margin:0;">📝 GHI CHÚ BUỔI TẬP</h3>
            <button id="close-note-modal" style="background:none;border:none;color:#fff;cursor:pointer;margin-left:auto;display:flex;align-items:center;">
              <span class="material-symbols-outlined" style="font-size:20px;">close</span>
            </button>
          </div>
          <!-- Body -->
          <div style="padding:20px;display:flex;flex-direction:column;gap:12px;">
            <p class="text-body-sm text-on-surface-variant font-medium">Nhập ghi chú cho buổi tập này (ví dụ: yêu cầu bài tập, ghi chú thể trạng...):</p>
            <textarea id="note-input" rows="3" placeholder="Yêu cầu tập tay, đau chân nhẹ..." class="w-full bg-surface-container border border-outline-variant text-on-surface px-4 py-2.5 rounded-xl focus:border-brand-primary outline-none text-body-md transition-colors resize-none">${oldNote || ''}</textarea>
          </div>
          <!-- Footer -->
          <div style="padding:12px 20px;border-top:1px solid var(--outline-variant);display:flex;justify-content:flex-end;gap:10px;background:var(--bg-surface-low);">
            <button id="btn-cancel-note" class="px-loose py-compact rounded-xl border border-outline-variant text-on-surface text-body-sm font-bold" style="padding:8px 16px; border-radius:8px; border:1px solid var(--outline-variant); cursor:pointer;">Hủy</button>
            <button id="btn-save-note" class="px-loose py-compact rounded-xl bg-brand-primary text-white text-body-sm font-bold" style="padding:8px 18px; border-radius:8px; border:none; background:var(--brand-primary); color:white; cursor:pointer;">Lưu ghi chú</button>
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
            if (window.GymApp.currentPage === 'my-schedule') {
              self._applyFilter();
            } else {
              navigate(window.GymApp.currentPage);
            }
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
  };

  pages['checkins'] = {
    render() {
      const checkins = window.GymApp.data.myCheckins || [];
      return `
        <div class="space-y-s6">
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-s4">
            <div>
              <h2 class="text-headline-md font-bold text-on-surface">Lịch sử vào / ra</h2>
              <p class="text-on-surface-variant text-body-md mt-s1">Các lần check-in phòng tập gần nhất</p>
            </div>
            <button id="ci-reload" class="flex items-center justify-center gap-s2 px-s5 py-s3 rounded-full border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-all font-bold text-label-md">
              <span class="material-symbols-outlined text-sm">refresh</span>Tải lại
            </button>
          </div>

          <section id="ci-list" class="space-y-s3">
            ${this._renderList(checkins)}
          </section>
        </div>
      `;
    },

    _renderList(list) {
      if (!list.length) return emptyState('history', 'Chưa có lịch sử vào/ra');

      return list.map(c => `
        <div class="member-card p-s4 flex items-center gap-s4">
          <div class="w-10 h-10 rounded-xl ${c.loai === 'vao' ? 'bg-[#e7f5e9]' : 'bg-[#e3f2fd]'} flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined ${c.loai === 'vao' ? 'text-brand-primary' : 'text-secondary'}" style="font-variation-settings:'FILL' 1">${c.loai === 'vao' ? 'login' : 'logout'}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-on-surface text-body-base">${c.gio_hien_thi || new Date(c.thoi_diem).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
            <p class="text-on-surface-variant text-body-sm">${window.GymApp.formatDate(c.thoi_diem?.split('T')[0] || c.thoi_diem)} | ${window.GymApp.formatEnumLabel(c.phuong_thuc || 'thu_cong')}</p>
          </div>
          ${window.GymApp.statusBadge(c.loai)}
        </div>
      `).join('');
    },

    init() {
      const self = this;
      document.getElementById('ci-reload')?.addEventListener('click', async () => {
        try {
          const res = await window.GymApp.api.get('/checkins/me?limit=30');
          if (res?.success) window.GymApp.data.myCheckins = res.data?.data || res.data || [];
        } catch (e) {
          console.error(e);
        }
        const list = document.getElementById('ci-list');
        if (list) list.innerHTML = self._renderList(window.GymApp.data.myCheckins || []);
        window.GymApp.toast('Đã tải lại!', 'success');
      });
    }
  };

  pages['profile'] = {
    render() {
      const p = window.GymApp.data.myProfile || {};
      const u = window.GymApp.auth.user || {};
      const avatarUrl = p.avatar_url || u.avatar_url;
      const tenHV = p.ho_ten || u.ho_ten || 'Hội viên';
      const diaChiParts = [p.dia_chi_tam_tru, p.phuong_xa, p.quan_huyen, p.tinh_thanh].filter(Boolean);
      const diaChi = diaChiParts.length ? diaChiParts.join(', ') : null;

      const fields = [
        { label: 'Mã hồ sơ', value: p.ma_ho_so, icon: 'badge' },
        { label: 'Họ tên', value: p.ho_ten, icon: 'person' },
        { label: 'Giới tính', value: p.gioi_tinh === 'nam' || p.gioi_tinh === 'male' ? 'Nam' : p.gioi_tinh === 'nu' || p.gioi_tinh === 'female' ? 'Nữ' : p.gioi_tinh, icon: 'wc' },
        { label: 'Ngày sinh', value: window.GymApp.formatDate(p.ngay_sinh), icon: 'cake' },
        { label: 'Ngày tham gia', value: window.GymApp.formatDate(p.ngay_tao), icon: 'event' },
        { label: 'Số điện thoại', value: p.so_dien_thoai, icon: 'phone' },
        { label: 'Email', value: p.email, icon: 'email' },
        { label: 'CCCD', value: p.cccd, icon: 'id_card' },
        { label: 'Quê quán', value: p.que_quan, icon: 'home_pin' },
        { label: 'Địa chỉ', value: diaChi, icon: 'location_on' },
        { label: 'Chi nhánh', value: p.chi_nhanh, icon: 'store' },
        { label: 'Loại hội viên', value: window.GymApp.formatEnumLabel(p.loai_hv || 'thuong'), icon: 'star' },
      ];

      return `
        <div class="space-y-s6">
          <div>
            <h2 class="text-headline-md font-bold text-on-surface">Hồ sơ cá nhân</h2>
            <p class="text-on-surface-variant text-body-md mt-s1">Thông tin cá nhân của bạn trong hệ thống</p>
          </div>

          <section class="member-card overflow-hidden">
            <div class="p-s6 border-b border-outline-variant flex items-center gap-s5">
              ${window.GymApp.avatarImg(avatarUrl, tenHV, 'xl')}
              <div class="min-w-0">
                <p class="font-bold text-headline-sm text-on-surface truncate">${tenHV}</p>
                <p class="text-on-surface-variant text-body-sm mt-s1">Hội viên | ${window.GymApp.formatEnumLabel(p.loai_hv || 'thuong')}</p>
              </div>
            </div>

            <div class="p-s6 grid grid-cols-1 md:grid-cols-2 gap-s4">
              ${fields.map(f => `
                <div class="flex items-start gap-s3 p-s4 rounded-xl bg-surface-container">
                  <div class="w-9 h-9 rounded-lg bg-[#e7f5e9] flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">${f.icon}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="text-on-surface-variant text-body-sm">${f.label}</p>
                    <p class="font-bold text-on-surface text-body-md break-words">${f.value || '—'}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
        </div>
      `;
    },

    async init() {
      try {
        const res = await window.GymApp.api.get('/members/me/profile');
        if (res?.success) {
          window.GymApp.data.myProfile = res.data;
          window.GymApp.data.myPackages = res.data.goi_tap || [];
          window.GymApp.data.myPtContracts = res.data.dang_ky_pt || [];
          const content = document.getElementById('content-area');
          if (content) content.innerHTML = this.render();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // ── Tab: Thông báo cá nhân ────────────────────────────────
  pages['notifications'] = {
    render() {
      return `
        <div class="space-y-s6">
          <div class="flex items-center justify-between flex-wrap gap-s3">
            <div>
              <h2 class="text-headline-md font-bold text-on-surface">Thông báo của tôi</h2>
              <p class="text-on-surface-variant text-body-md mt-s1">Các thông báo từ hệ thống Paradise GYM</p>
            </div>
            <button id="btn-notif-clear-all"
              class="flex items-center gap-s2 px-s4 py-s3 rounded-xl border border-outline-variant text-on-surface-variant hover:text-error hover:border-error hover:bg-error-container transition-all text-label-md font-bold">
              <span class="material-symbols-outlined text-sm">delete_sweep</span>Xóa tất cả
            </button>
          </div>
          <div id="notif-page-list" class="flex flex-col gap-s3">
            <div class="member-card p-s6 text-center text-on-surface-variant">
              <span class="material-symbols-outlined text-3xl block mb-s3 animate-spin">refresh</span>
              <p class="text-body-sm">Đang tải thông báo...</p>
            </div>
          </div>
        </div>
      `;
    },

    async init() {
      try {
        const res = await window.GymApp.api.get('/members/me/notifications');
        if (res?.success) {
          window.GymApp.data.myNotifications = res.data?.notifications || [];
          window.GymApp.data.daCheckInHomNay = res.data?.da_check_in_hom_nay || false;
          // Sync badge
          const badge = document.getElementById('member-notif-badge');
          const notifs = window.GymApp.data.myNotifications;
          if (badge) {
            if (notifs.length > 0) { badge.textContent = notifs.length > 9 ? '9+' : notifs.length; badge.style.display = 'flex'; }
            else badge.style.display = 'none';
          }
        }
      } catch (e) { console.error(e); }

      this._renderList();

      document.getElementById('btn-notif-clear-all')?.addEventListener('click', async () => {
        if (!confirm('Xóa tất cả thông báo?')) return;
        try {
          await window.GymApp.api.delete('/members/me/notifications');
        } catch (_) {}
        window.GymApp.data.myNotifications = [];
        const badge = document.getElementById('member-notif-badge');
        if (badge) badge.style.display = 'none';
        this._renderList();
        _renderMemberDropdownList();
      });
    },

    _renderList() {
      const notifs = window.GymApp.data.myNotifications || [];
      const container = document.getElementById('notif-page-list');
      if (!container) return;

      if (!notifs.length) {
        container.innerHTML = emptyState('notifications_none', 'Không có thông báo nào', 'Hệ thống sẽ gửi thông báo khi có cập nhật quan trọng');
        return;
      }

      container.innerHTML = notifs.map((n, idx) => {
        const s = NOTIF_STYLE[n.muc_do] || NOTIF_STYLE.info;
        const iconMap = { danger: 'warning', warning: 'info', info: 'notifications', success: 'check_circle' };
        const icon = n.icon || iconMap[n.muc_do] || 'notifications';
        const dateStr = n.ngay_tao ? new Date(n.ngay_tao).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
        return `
          <div class="member-card overflow-hidden transition-all" data-notif-idx="${idx}"
            style="border-left:4px solid ${s.border}">
            <div class="p-s4 flex items-start gap-s4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style="background:${s.bg}">
                <span class="material-symbols-outlined" style="color:${s.icon_color};font-size:20px;font-variation-settings:'FILL' 1">${icon}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-s2">
                  <p class="font-bold text-body-md" style="color:${s.text_color}">${n.tieu_de}</p>
                  <button class="page-notif-del flex-shrink-0 p-s1 rounded-lg hover:bg-surface-container transition-colors" data-idx="${idx}" title="Xóa">
                    <span class="material-symbols-outlined text-on-surface-variant" style="font-size:16px">close</span>
                  </button>
                </div>
                <p class="text-body-sm mt-s1" style="color:${s.text_color};opacity:0.85;line-height:1.6">${n.noi_dung}</p>
                ${dateStr ? `<p class="text-body-sm text-on-surface-variant mt-s2">${dateStr}</p>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');

      container.querySelectorAll('.page-notif-del').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx);
          window.GymApp.data.myNotifications.splice(idx, 1);
          const badge = document.getElementById('member-notif-badge');
          const count = window.GymApp.data.myNotifications.length;
          if (badge) { badge.textContent = count > 9 ? '9+' : count; badge.style.display = count > 0 ? 'flex' : 'none'; }
          this._renderList();
          _renderMemberDropdownList();
        });
      });
    }
  };

  // ── Tab: Lịch sử Vào / Ra ─────────────────────────────────
  pages['checkins'] = {
    _filter: 'all',

    render() {
      return `
        <div class="space-y-s6">
          <div>
            <h2 class="text-headline-md font-bold text-on-surface">Lịch sử Vào / Ra</h2>
            <p class="text-on-surface-variant text-body-md mt-s1">Nhật ký ra vào phòng tập của bạn</p>
          </div>

          <!-- Stat cards -->
          <div id="checkin-stats" class="grid grid-cols-3 gap-s4"></div>

          <!-- Filter -->
          <div class="flex items-center gap-s2 p-s1 bg-surface-container rounded-2xl w-fit border border-outline-variant">
            ${['all','vao','ra'].map(f => `
              <button class="checkin-filter-btn px-s4 py-s2 rounded-xl text-label-md font-bold transition-all ${f === 'all' ? 'bg-brand-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}"
                data-filter="${f}">
                ${{ all: 'Tất cả', vao: 'Vào', ra: 'Ra' }[f]}
              </button>
            `).join('')}
          </div>

          <!-- List -->
          <div id="checkin-list" class="flex flex-col gap-s3">
            <div class="member-card p-s6 text-center text-on-surface-variant">
              <span class="material-symbols-outlined text-3xl block mb-s3 animate-spin">refresh</span>
              <p class="text-body-sm">Đang tải...</p>
            </div>
          </div>
        </div>
      `;
    },

    async init() {
      try {
        const res = await window.GymApp.api.get('/checkins/me?limit=50');
        if (res?.success) {
          window.GymApp.data.myCheckins = res.data?.data || res.data || [];
        }
      } catch (e) { console.error(e); }

      this._renderStats();
      this._renderList();

      document.querySelectorAll('.checkin-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this._filter = btn.dataset.filter;
          document.querySelectorAll('.checkin-filter-btn').forEach(b => {
            const active = b.dataset.filter === this._filter;
            b.className = `checkin-filter-btn px-s4 py-s2 rounded-xl text-label-md font-bold transition-all ${active ? 'bg-brand-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`;
          });
          this._renderList();
        });
      });
    },

    _renderStats() {
      const all = window.GymApp.data.myCheckins || [];
      const vao = all.filter(c => c.loai === 'vao').length;
      const ra  = all.filter(c => c.loai === 'ra').length;
      const stats = [
        { label: 'Tổng lượt', value: all.length, icon: 'history', color: '#1D9336', bg: '#e7f5e9' },
        { label: 'Lượt vào',  value: vao, icon: 'login',   color: '#1565c0', bg: '#e3f2fd' },
        { label: 'Lượt ra',   value: ra,  icon: 'logout',  color: '#6a1b9a', bg: '#f3e5f5' },
      ];
      const el = document.getElementById('checkin-stats');
      if (!el) return;
      el.innerHTML = stats.map(s => `
        <div class="member-card p-s4 flex items-center gap-s3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:${s.bg}">
            <span class="material-symbols-outlined" style="color:${s.color};font-size:20px;font-variation-settings:'FILL' 1">${s.icon}</span>
          </div>
          <div>
            <p class="text-on-surface-variant text-body-sm">${s.label}</p>
            <p class="font-bold text-headline-sm text-on-surface">${s.value}</p>
          </div>
        </div>
      `).join('');
    },

    _renderList() {
      const all = window.GymApp.data.myCheckins || [];
      const filtered = this._filter === 'all' ? all : all.filter(c => c.loai === this._filter);
      const el = document.getElementById('checkin-list');
      if (!el) return;

      if (!filtered.length) {
        el.innerHTML = emptyState('how_to_reg', 'Chưa có lượt nào', 'Dữ liệu sẽ xuất hiện sau khi bạn check-in');
        return;
      }

      el.innerHTML = filtered.map(c => {
        const isVao = c.loai === 'vao';
        const color = isVao ? '#1565c0' : '#6a1b9a';
        const bg = isVao ? '#e3f2fd' : '#f3e5f5';
        const icon = isVao ? 'login' : 'logout';
        const phuongThucMap = { qr_code: 'QR Code', thu_cong: 'Thủ công', the_tu: 'Thẻ từ' };
        const thoiGian = c.thoi_gian ? new Date(c.thoi_gian).toLocaleString('vi-VN', {
          weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '—';
        return `
          <div class="member-card overflow-hidden" style="border-left:4px solid ${color}30">
            <div class="p-s4 flex items-center gap-s4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:${bg}">
                <span class="material-symbols-outlined" style="color:${color};font-size:20px;font-variation-settings:'FILL' 1">${icon}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-s2 flex-wrap">
                  <span class="font-bold text-body-md text-on-surface">${isVao ? 'Vào phòng tập' : 'Ra phòng tập'}</span>
                  <span style="padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;background:${bg};color:${color}">${isVao ? 'VÀO' : 'RA'}</span>
                </div>
                <p class="text-body-sm text-on-surface-variant mt-s1">${thoiGian}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="text-body-sm text-on-surface-variant">${phuongThucMap[c.phuong_thuc] || c.phuong_thuc || '—'}</p>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  };

  async function _showMemberRenewalModal() {
    const activePackage = getActivePackage();
    const today = todayKey();
    let defaultStart = today;
    
    if (activePackage && activePackage.den_ngay >= today) {
      const d = new Date(activePackage.den_ngay);
      d.setDate(d.getDate() + 1);
      defaultStart = d.toISOString().split('T')[0];
    }

    let packages = [];
    try {
      const res = await window.GymApp.api.get('/packages');
      if (res?.success) packages = res.data || [];
    } catch (e) { console.error(e); }

    const modalHtml = `
      <div id="modal-member-renewal" class="fixed inset-0 z-[100] flex items-center justify-center p-standard bg-black/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl animate-scale-in">
          <div class="px-s6 py-s5 bg-primary-container text-white" style="border-top-left-radius: 16px; border-top-right-radius: 16px;">
            <h3 class="text-headline-sm font-bold">Gia hạn gói tập</h3>
            <p class="text-body-sm opacity-90 mt-s1">Chọn gói tập và ngày bắt đầu để tiếp tục tập luyện</p>
          </div>
          
          <div class="p-s6 space-y-s5">
            <div>
              <label class="block text-label-sm text-on-surface-variant font-bold mb-s2">Chọn gói tập</label>
              <select id="renew-pkg-id" class="w-full bg-surface-container-low border border-outline-variant px-s4 py-s3 rounded-xl outline-none focus:border-brand-primary text-body-md">
                ${packages.map(p => `<option value="${p.id}" ${p.id === activePackage?.goi_tap_id ? 'selected' : ''}>${p.ten_goi} — ${Number(p.gia).toLocaleString('vi-VN')}đ</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-label-sm text-on-surface-variant font-bold mb-s2">Ngày bắt đầu</label>
              <input type="date" id="renew-start-date" value="${defaultStart}" class="w-full bg-surface-container-low border border-outline-variant px-s4 py-s3 rounded-xl outline-none focus:border-brand-primary text-body-md" />
              <p class="text-label-xs text-brand-primary mt-s2">Mặc định: ${activePackage && activePackage.den_ngay >= today ? 'Nối tiếp gói cũ' : 'Hôm nay'}</p>
            </div>

            <div class="bg-surface-container rounded-xl p-s4">
              <p class="text-label-xs text-on-surface-variant font-bold uppercase tracking-wider">Lưu ý</p>
              <p class="text-body-sm text-on-surface mt-s1">Yêu cầu của bạn sẽ được gửi đến lễ tân. Vui lòng thanh toán tại quầy hoặc chuyển khoản để kích hoạt gói.</p>
            </div>
          </div>

          <div class="px-s6 py-s5 bg-surface-container border-t border-outline-variant flex gap-s3" style="border-bottom-left-radius: 16px; border-bottom-right-radius: 16px;">
            <button id="btn-renew-cancel" class="flex-1 px-s4 py-s3 rounded-xl font-bold text-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors">Hủy bỏ</button>
            <button id="btn-renew-submit" class="flex-1 px-s4 py-s3 rounded-xl font-bold text-label-md bg-brand-primary text-white hover:opacity-90 transition-all shadow-md active:scale-95">Gửi yêu cầu</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const closeModal = () => document.getElementById('modal-member-renewal')?.remove();
    document.getElementById('btn-renew-cancel').onclick = closeModal;
    document.getElementById('btn-renew-submit').onclick = async () => {
      const goi_tap_id = document.getElementById('renew-pkg-id').value;
      const tu_ngay = document.getElementById('renew-start-date').value;
      
      const btn = document.getElementById('btn-renew-submit');
      btn.disabled = true;
      btn.textContent = 'Đang gửi...';

      try {
        const res = await window.GymApp.api.post('/members/me/package-request', { goi_tap_id, tu_ngay });
        if (res?.success) {
          window.GymApp.toast('Đã gửi yêu cầu gia hạn!', 'success');
          closeModal();
          // Reload dashboard
          await _fetchData();
          navigate('dashboard');
        } else {
          window.GymApp.toast(res?.message || 'Lỗi khi gửi yêu cầu.', 'error');
        }
      } catch (e) {
        window.GymApp.toast('Lỗi kết nối máy chủ.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Gửi yêu cầu';
      }
    };
  }

  pages['gym-rules'] = {
    rules: [],
    render() {
      const activeRules = this.rules.filter(r => r.is_active === 1 && (r.ap_dung_cho === 'tat_ca' || r.ap_dung_cho === 'hoi_vien'));
      return `
        <div class="space-y-s6">
          <div>
            <h2 class="text-headline-md font-bold text-on-surface">Nội quy phòng tập</h2>
            <p class="text-on-surface-variant text-body-md mt-s1">Quy định và hướng dẫn chung dành cho hội viên tại Paradise GYM</p>
          </div>

          <div class="grid grid-cols-1 gap-s4">
            ${activeRules.length === 0 ? `
              <div class="member-card p-s6 text-center text-on-surface-variant">
                <span class="material-symbols-outlined text-4xl text-outline block mb-s3">gavel</span>
                <p class="font-bold text-on-surface">Không có nội quy nào</p>
              </div>
            ` : activeRules.map((r, index) => `
              <div class="member-card p-s5 hover:shadow-md transition-shadow">
                <div class="flex items-start gap-s4">
                  <div class="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold shrink-0 text-label-md">
                    ${index + 1}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-on-surface text-label-md">${r.tieu_de}</h3>
                    <p class="text-body-sm text-on-surface-variant mt-s2 whitespace-pre-line leading-relaxed">${r.noi_dung}</p>
                    <div class="mt-s4 flex items-center gap-s2 opacity-40">
                      <span class="material-symbols-outlined text-[14px]">schedule</span>
                      <span class="text-[11px] font-bold">Cập nhật: ${window.GymApp.formatDate(r.ngay_cap_nhat)}</span>
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

  document.addEventListener('DOMContentLoaded', initPortal);
})();
