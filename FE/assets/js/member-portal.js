/**
 * Member Portal - logic cho hoi vien.
 * Chi render giao dien; luong API/auth/QR giu theo backend hien co.
 */
(function () {
  const pages = {};

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
    // Ưu tiên gói đang hoạt động, KHÔNG dùng gói cho_duyet làm fallback
    const active = packages.find(p => p.trang_thai === 'dang_hoat_dong');
    if (active) return active;
    // Fallback: gói hết hạn gần nhất (không dùng cho_duyet)
    return packages.find(p => p.trang_thai === 'het_han') || null;
  }

  function getPendingPackage() {
    const packages = window.GymApp.data.myPackages || [];
    return packages.find(p => p.trang_thai === 'cho_duyet') || null;
  }

  function getScheduledPackage() {
    const packages = window.GymApp.data.myPackages || [];
    return packages.find(p => p.trang_thai === 'cho_kich_hoat') || null;
  }

  function getActivePt() {
    const contracts = window.GymApp.data.myPtContracts || [];
    return contracts.find(p => p.trang_thai === 'dang_hoat_dong') || null;
  }

  function calcBmi(heightCm, weightKg) {
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (!h || !w) return null;
    const value = w / Math.pow(h / 100, 2);
    const category = value < 18.5 ? 'Gầy' : value < 25 ? 'Bình thường' : value < 30 ? 'Thừa cân' : 'Béo phì';
    const advice = value < 18.5
      ? 'Nên tăng năng lượng nạp vào và tập sức mạnh đều đặn.'
      : value < 25
        ? 'Duy trì lịch tập, ngủ đủ và cân bằng dinh dưỡng.'
        : value < 30
          ? 'Ưu tiên cardio vừa sức, kiểm soát khẩu phần và tăng vận động hằng ngày.'
          : 'Nên trao đổi với PT/bác sĩ để có kế hoạch giảm cân an toàn.';
    return { value, category, advice };
  }

  function ratingStars(value = 0) {
    const rounded = Math.round(Number(value) || 0);
    return Array.from({ length: 5 }, (_, i) => `
      <span class="material-symbols-outlined" style="font-size:18px;color:${i < rounded ? '#f59e0b' : 'var(--outline)'};font-variation-settings:'FILL' 1">star</span>
    `).join('');
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

    if (user.vai_tro === 'admin' || user.vai_tro === 'nhan_vien') {
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
        return;
      }

      const ratingBtn = e.target.closest('.btn-member-rating');
      if (ratingBtn) {
        const scheduleId = ratingBtn.dataset.id;
        const schedule = (window.GymApp.data.ptSchedules || []).find(x => String(x.id) === String(scheduleId));
        _showRatingModal(schedule);
        return;
      }

      const confirmBtn = e.target.closest('.btn-member-confirm');
      if (confirmBtn) {
        const scheduleId = confirmBtn.dataset.id;
        if (confirm('Bạn có chắc chắn muốn xác nhận đã hoàn thành buổi tập này không?')) {
          confirmBtn.disabled = true;
          confirmBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span>';
          window.GymApp.api.put('/pt/schedules/' + scheduleId + '/confirm')
            .then(res => {
              if (res?.success) {
                window.GymApp.toast('Đã xác nhận buổi tập thành công!', 'success');
                return _fetchData();
              } else {
                throw new Error(res?.message || 'Không thể xác nhận');
              }
            })
            .then(() => {
              if (window.GymApp.currentPage === 'my-schedule') {
                pages['my-schedule']._applyFilter();
              } else {
                navigate(window.GymApp.currentPage);
              }
            })
            .catch(err => {
              console.error(err);
              window.GymApp.toast(err.message || 'Lỗi kết nối máy chủ!', 'error');
              confirmBtn.disabled = false;
              confirmBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span>';
            });
        }
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
      const [schedulesRes, profileRes, checkinsRes, notifRes, ptMeRes] = await Promise.all([
        window.GymApp.api.get('/pt/schedules'),
        window.GymApp.api.get('/members/me/profile'),
        window.GymApp.api.get('/checkins/me?limit=30'),
        window.GymApp.api.get('/members/me/notifications'),
        window.GymApp.api.get('/pt-me/overview'),
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
      if (ptMeRes?.success) window.GymApp.data.ptMeOverview = ptMeRes.data || {};
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
            ${s.trang_thai === 'da_tap' ? `
              <button class="btn-member-rating flex items-center gap-1 text-[#b45309] bg-[#fffbeb] hover:bg-[#fef3c7] border border-[#fbbf24]/40 px-3 py-2 rounded-xl transition-colors text-label-sm font-bold" data-id="${s.id}" title="${s.danh_gia_sao ? 'Sửa đánh giá' : 'Đánh giá PT'}">
                <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">star</span>${s.danh_gia_sao ? `${s.danh_gia_sao}/5` : 'Đánh giá'}
              </button>
            ` : ''}
            ${s.trang_thai === 'cho_tap' ? `
              <button class="btn-member-confirm text-white bg-brand-primary hover:bg-brand-primary/90 flex items-center justify-center p-2 rounded-xl transition-colors shadow-sm ml-s1" data-id="${s.id}" title="Xác nhận đã tập">
                <span class="material-symbols-outlined text-[18px]">check</span>
              </button>
            ` : ''}
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

  function _showRatingModal(schedule) {
    if (!schedule) return;
    const positiveTags = ['Tận tâm', 'Đúng giờ', 'Dễ hiểu', 'Truyền động lực', 'Bài tập phù hợp'];
    const negativeTags = ['Đi trễ', 'Thiếu tập trung', 'Bài quá nặng', 'Khó hiểu', 'Chưa sát mục tiêu'];
    let selectedStars = Number(schedule.danh_gia_sao) || 0;
    let selectedTags = Array.isArray(schedule.danh_gia_tags) ? [...schedule.danh_gia_tags] : [];

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9000;padding:20px;';
    const renderDynamic = () => {
      const isLow = selectedStars > 0 && selectedStars < 3;
      const tags = selectedStars === 5 ? positiveTags : isLow ? negativeTags : positiveTags;
      return `
        <div class="space-y-3">
          <div class="flex flex-wrap gap-2">
            ${tags.map(tag => `
              <button type="button" class="rating-tag px-3 py-2 rounded-full border text-label-sm font-bold ${selectedTags.includes(tag) ? 'bg-brand-primary text-white border-brand-primary' : 'border-outline-variant text-on-surface-variant'}" data-tag="${tag}">${tag}</button>
            `).join('')}
          </div>
          ${isLow ? `
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              ${['Chuyên môn', 'Thái độ', 'Đúng giờ'].map(k => `
                <label class="bg-surface-container rounded-xl p-3 text-label-sm font-bold text-on-surface-variant">${k}
                  <select class="rating-criterion mt-2 w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-2 py-1" data-key="${k}">
                    <option value="5">Tốt</option><option value="3">Tạm</option><option value="1">Cần xử lý</option>
                  </select>
                </label>
              `).join('')}
            </div>
            <p class="text-error text-body-sm font-bold">Bạn có thể nhập lý do để Admin hỗ trợ xử lý ngay.</p>
          ` : ''}
          <textarea id="rating-note" rows="3" class="w-full bg-surface-container border border-outline-variant text-on-surface px-4 py-3 rounded-xl outline-none focus:border-brand-primary resize-none" placeholder="${isLow ? 'Nhập lý do hoặc tình huống cần hỗ trợ...' : 'Chia sẻ thêm cảm nhận của bạn...'}">${schedule.danh_gia_noi_dung || ''}</textarea>
        </div>
      `;
    };

    overlay.innerHTML = `
      <div class="member-card" style="width:100%;max-width:520px;background:var(--bg-surface-lowest);border-radius:20px;overflow:hidden;">
        <div class="p-5 border-b border-outline-variant flex items-center justify-between">
          <div>
            <h3 class="text-headline-sm font-bold text-on-surface">Đánh giá HLV ${schedule.ten_pt || ''}</h3>
            <p class="text-body-sm text-on-surface-variant">${window.GymApp.formatDate(schedule.ngay_tap)} · ${schedule.gio_bat_dau || ''}</p>
          </div>
          <button id="rating-close" class="p-2 rounded-full hover:bg-surface-container"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="p-5 space-y-4">
          <div id="rating-stars" class="flex justify-center gap-2">
            ${[1,2,3,4,5].map(n => `<button type="button" class="rating-star" data-star="${n}" style="font-size:0;border:none;background:none;cursor:pointer;"><span class="material-symbols-outlined" style="font-size:42px;color:${n <= selectedStars ? '#f59e0b' : 'var(--outline)'};font-variation-settings:'FILL' 1">star</span></button>`).join('')}
          </div>
          <div id="rating-dynamic">${selectedStars ? renderDynamic() : '<p class="text-center text-on-surface-variant text-body-sm">Chọn số sao để tiếp tục.</p>'}</div>
        </div>
        <div class="p-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-low">
          <button id="rating-cancel" class="px-4 py-2 rounded-xl border border-outline-variant font-bold">Hủy</button>
          <button id="rating-submit" class="px-5 py-2 rounded-xl bg-brand-primary text-white font-bold" ${selectedStars ? '' : 'disabled'}>Gửi</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    const rerender = () => {
      overlay.querySelector('#rating-stars').innerHTML = [1,2,3,4,5].map(n => `<button type="button" class="rating-star" data-star="${n}" style="font-size:0;border:none;background:none;cursor:pointer;"><span class="material-symbols-outlined" style="font-size:42px;color:${n <= selectedStars ? '#f59e0b' : 'var(--outline)'};font-variation-settings:'FILL' 1">star</span></button>`).join('');
      overlay.querySelector('#rating-dynamic').innerHTML = selectedStars ? renderDynamic() : '<p class="text-center text-on-surface-variant text-body-sm">Chọn số sao để tiếp tục.</p>';
      overlay.querySelector('#rating-submit').disabled = !selectedStars;
    };

    overlay.addEventListener('click', async (e) => {
      if (e.target.id === 'rating-close' || e.target.closest('#rating-close') || e.target.id === 'rating-cancel') close();
      const starBtn = e.target.closest('.rating-star');
      if (starBtn) { selectedStars = Number(starBtn.dataset.star); selectedTags = []; rerender(); }
      const tagBtn = e.target.closest('.rating-tag');
      if (tagBtn) {
        const tag = tagBtn.dataset.tag;
        selectedTags = selectedTags.includes(tag) ? selectedTags.filter(x => x !== tag) : [...selectedTags, tag];
        rerender();
      }
      if (e.target.id === 'rating-submit') {
        const criteria = {};
        overlay.querySelectorAll('.rating-criterion').forEach(el => { criteria[el.dataset.key] = Number(el.value); });
        const note = overlay.querySelector('#rating-note')?.value?.trim() || '';
        const btn = e.target;
        btn.disabled = true; btn.textContent = 'Đang gửi...';
        try {
          const res = await window.GymApp.api.post(`/pt/schedules/${schedule.id}/rating`, { so_sao: selectedStars, tags: selectedTags, tieu_chi: criteria, noi_dung: note });
          if (res?.success) {
            window.GymApp.toast('Đã lưu đánh giá PT!', 'success');
            close();
            await _fetchData();
            if (window.GymApp.currentPage === 'my-schedule') pages['my-schedule']._applyFilter();
            else navigate(window.GymApp.currentPage);
          }
        } catch (err) {
          btn.disabled = false; btn.textContent = 'Gửi';
        }
      }
    });
  }

  pages['dashboard'] = {
    _refreshTimer: null,
    _TTL_PHUT: 5,

    render() {
      const user = window.GymApp.auth.user || {};
      const activePackage = getActivePackage();
      const pendingPackage = getPendingPackage();
      const scheduledPackage = getScheduledPackage();
      const activePt = getActivePt();
      const upcoming = nextSchedules(3);
      const next = upcoming[0] || null;
      const daysLeft = daysBetweenToday(activePackage?.den_ngay);
      const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
      const ptRemain = activePt ? Math.max(0, (activePt.so_buoi_dang_ky || 0) - (activePt.so_buoi_da_tap || 0)) : null;
      const checkins = window.GymApp.data.myCheckins || [];

      const isExpired = activePackage?.trang_thai === 'het_han' || !activePackage;

      return `
        <div class="space-y-s6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-s6">
            <!-- Welcome Banner -->
            <section class="lg:col-span-2 relative overflow-hidden rounded-2xl bg-brand-primary/10 border border-brand-primary/20 p-s6 min-h-[240px] flex flex-col justify-between">
              <div class="relative z-10 flex flex-col gap-s2">
                <div class="flex items-center gap-s3">
                  <span class="bg-brand-primary/20 text-brand-primary px-s3 py-s1 rounded-full text-label-sm font-bold border border-brand-primary/30">
                    ${user.loai_hv === 'vip' ? 'VIP MEMBER' : user.loai_hv === 'premium' ? 'PREMIUM' : 'STANDARD'}
                  </span>
                  ${next ? `<span class="bg-warning-light text-warning px-s3 py-s1 rounded-full text-label-sm font-bold border border-warning/20">Buổi tập tiếp theo: ${window.GymApp.formatDate(next.ngay_tap)}</span>` : ''}
                </div>
                <h1 class="text-display-lg font-bold text-on-surface mt-s2">Xin chào, ${user.ho_ten || 'Hội viên'}! 👋</h1>
                <p class="text-body-lg text-on-surface-variant max-w-md">
                  ${next 
                    ? `Bạn có lịch tập PT lúc <strong>${next.gio_bat_dau || '—'}</strong> với HLV <strong>${next.ten_pt || '—'}</strong>. Đừng quên mang theo bình nước nhé!` 
                    : 'Chào mừng bạn trở lại Paradise GYM. Hãy bắt đầu một buổi tập tuyệt vời hôm nay!'}
                </p>
              </div>
              <div class="relative z-10 flex flex-wrap gap-s3 mt-s4">
                <button data-tab="my-schedule" class="bg-brand-primary text-white px-s6 py-s3 rounded-full font-bold text-label-md hover:bg-brand-primary/90 transition-colors shadow-sm focus-ring flex items-center gap-s2">
                  <span class="material-symbols-outlined text-[20px]">calendar_month</span> Xem lịch tập
                </button>
                ${pendingPackage ? `
                <button disabled class="bg-surface-container text-on-surface-variant border border-outline-variant px-s6 py-s3 rounded-full font-bold text-label-md cursor-not-allowed flex items-center gap-s2 opacity-80">
                  <span class="material-symbols-outlined text-[20px] animate-spin">sync</span> Đang chờ duyệt yêu cầu gia hạn...
                </button>
                ` : (isExpired || isExpiringSoon) ? `
                <button id="btn-dashboard-renew" class="bg-white text-brand-primary border border-brand-primary px-s6 py-s3 rounded-full font-bold text-label-md hover:bg-surface-container transition-colors shadow-sm focus-ring flex items-center gap-s2">
                  <span class="material-symbols-outlined text-[20px]">bolt</span> Gia hạn gói tập
                </button>
                ` : ''}
                ${(isExpiringSoon && !pendingPackage) ? `<span class="bg-error/10 text-error border border-error/20 px-s4 py-s3 rounded-full text-label-md font-bold flex items-center gap-s2"><span class="material-symbols-outlined text-[18px]">warning</span> Gói còn ${daysLeft} ngày</span>` : ''}
              </div>
              <span class="material-symbols-outlined absolute -right-4 -bottom-4 text-[180px] text-brand-primary/5 select-none pointer-events-none" style="font-variation-settings: 'FILL' 1;">fitness_center</span>
            </section>

            <!-- QR Code Card -->
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
              { 
                label: 'Gói tập', 
                value: activePackage?.ten_goi || (pendingPackage ? `${pendingPackage.ten_goi} (Chờ duyệt)` : 'Chưa có'), 
                icon: 'card_membership', 
                sub: activePackage ? `Hết hạn ${window.GymApp.formatDate(activePackage.den_ngay)}` : pendingPackage ? 'Đang chờ lễ tân duyệt' : 'Chưa có gói tập' 
              },
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
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-s6 mt-s6">
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
              <h3 class="text-headline-sm font-bold text-brand-primary">Tình trạng hội viên</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-s4">
                <div class="bg-surface-container rounded-xl p-s4">
                  <p class="text-on-surface-variant text-label-md">Trạng thái gói</p>
                  <div class="mt-s2 flex items-center gap-s2 flex-wrap">
                    ${activePackage ? window.GymApp.statusBadge(activePackage.trang_thai) : window.GymApp.statusBadge('chua_dang_ky')}
                    ${pendingPackage ? window.GymApp.statusBadge('cho_duyet') : ''}
                    ${scheduledPackage ? window.GymApp.statusBadge('cho_kich_hoat') : ''}
                  </div>
                  <p class="text-body-sm text-on-surface-variant mt-s3">
                    ${activePackage ? `${window.GymApp.formatDate(activePackage.tu_ngay)} - ${window.GymApp.formatDate(activePackage.den_ngay)}` : 'Chưa có gói đang hoạt động'}
                    ${pendingPackage ? `<br><span class="text-[#e65100] font-semibold flex items-center gap-1 mt-1"><span class="material-symbols-outlined text-[14px]">schedule</span> Chờ duyệt: ${pendingPackage.ten_goi}</span>` : ''}
                    ${scheduledPackage ? `<br><span class="text-[#e65100] font-semibold flex items-center gap-1 mt-1"><span class="material-symbols-outlined text-[14px]">event_available</span> Sẽ kích hoạt ${window.GymApp.formatDate(scheduledPackage.tu_ngay)}: ${scheduledPackage.ten_goi}</span>` : ''}
                  </p>
                </div>
                <div class="bg-surface-container rounded-xl p-s4">
                  <p class="text-on-surface-variant text-label-md">Huấn luyện viên</p>
                  <p class="font-bold text-on-surface text-body-base mt-s2">${activePt?.ten_pt || 'Chưa đăng ký PT'}</p>
                  <p class="text-body-sm text-on-surface-variant mt-s1">${activePt ? `${ptRemain} buổi còn lại` : 'Có thể đăng ký tại quầy lễ tân'}</p>
                </div>
              </div>
              <div class="bg-surface-container rounded-xl p-s4">
                <p class="text-on-surface-variant text-label-md">Ghi chú</p>
                <p class="text-body-md text-on-surface mt-s2">
                  ${pendingPackage ? `Yêu cầu gia hạn gói "${pendingPackage.ten_goi}" đang chờ duyệt. Vui lòng thanh toán tại quầy hoặc chuyển khoản để kích hoạt.` : scheduledPackage ? `Gói tập "${scheduledPackage.ten_goi}" đã được duyệt và sẽ tự động kích hoạt vào ngày ${window.GymApp.formatDate(scheduledPackage.tu_ngay)}.` : isExpiringSoon ? `Gói tập còn ${daysLeft} ngày. Bạn có thể gia hạn ngay trên App hoặc liên hệ lễ tân.` : 'Tất cả dữ liệu trên được lấy từ hệ thống hiện tại.'}
                </p>
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

  pages['pt-me'] = {
    async _load() {
      const res = await window.GymApp.api.get('/pt-me/thread');
      if (res?.success) window.GymApp.data.ptMeThread = res.data || { entries: [] };
    },
    render() {
      const data = window.GymApp.data.ptMeThread || window.GymApp.data.ptMeOverview || {};
      const entries = data.entries || data.latest || [];
      const pair = data.pair;
      return `
        <div class="space-y-s6">
          <div>
            <h2 class="text-headline-md font-bold text-on-surface">PT & Tôi</h2>
            <p class="text-on-surface-variant text-body-md mt-s1">${pair ? `Trao đổi với HLV ${pair.ten_pt || ''}` : 'Bạn chưa có PT đang hoạt động.'}</p>
          </div>
          ${pair ? `
            <section class="member-card p-s5">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-s4">
                <textarea id="ptme-feeling" rows="3" class="bg-surface-container border border-outline-variant text-on-surface px-4 py-3 rounded-xl outline-none focus:border-brand-primary resize-none" placeholder="Hôm nay bạn tập luyện như thế nào sau khi tập?"></textarea>
                <textarea id="ptme-food" rows="3" class="bg-surface-container border border-outline-variant text-on-surface px-4 py-3 rounded-xl outline-none focus:border-brand-primary resize-none" placeholder="Khẩu phần ăn hôm nay, bạn đã ăn gì?"></textarea>
                <input id="ptme-minutes" type="number" min="0" max="600" class="bg-surface-container border border-outline-variant text-on-surface px-4 py-3 rounded-xl outline-none focus:border-brand-primary" placeholder="Hôm nay bạn tập bao nhiêu phút?" />
                <textarea id="ptme-workout" rows="2" class="bg-surface-container border border-outline-variant text-on-surface px-4 py-3 rounded-xl outline-none focus:border-brand-primary resize-none" placeholder="Nội dung tập luyện / bài tập đã làm"></textarea>
              </div>
              <div class="flex justify-end mt-s4">
                <button id="ptme-submit" class="px-5 py-3 rounded-xl bg-brand-primary text-white font-bold flex items-center gap-2"><span class="material-symbols-outlined">send</span>Gửi cho PT</button>
              </div>
            </section>
            <section class="member-card overflow-hidden">
              <div class="p-s5 border-b border-outline-variant flex items-center justify-between">
                <h3 class="text-headline-sm font-bold text-brand-primary">Nhật ký trao đổi</h3>
                <button id="ptme-reload" class="text-brand-primary font-bold text-label-md">Tải lại</button>
              </div>
              <div id="ptme-list" class="divide-y divide-outline-variant">${this._renderEntries(entries)}</div>
            </section>
          ` : emptyState('person_search', 'Chưa có PT đang hoạt động', 'Khi đăng ký gói PT, luồng trao đổi sẽ xuất hiện tại đây.')}
        </div>
      `;
    },
    _renderEntries(entries) {
      if (!entries?.length) return `<div class="p-s6">${emptyState('forum', 'Chưa có trao đổi nào')}</div>`;
      const currentUserId = window.GymApp.auth?.user?.id;
      return entries.map(item => `
        <div class="p-s5">
          <div class="flex items-start justify-between gap-s3">
            <div>
              <p class="font-bold text-on-surface">${item.vai_tro_gui === 'pt' ? 'PT dặn dò' : 'Bạn cập nhật'} ${item.da_chinh_sua ? '<span class="text-label-sm text-on-surface-variant">(đã chỉnh sửa)</span>' : ''}</p>
              <p class="text-label-sm text-on-surface-variant">${item.ngay_cap_nhat || item.ngay_tao || ''}</p>
            </div>
            ${item.nguoi_gui_id === currentUserId ? `<button class="ptme-edit text-brand-primary font-bold text-label-md" data-id="${item.id}">Sửa</button>` : ''}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-s3 mt-s3 text-body-sm">
            ${item.cam_nhan_tap ? `<div class="bg-surface-container rounded-xl p-s3"><b>Cảm nhận:</b> ${item.cam_nhan_tap}</div>` : ''}
            ${item.khau_phan_an ? `<div class="bg-surface-container rounded-xl p-s3"><b>Ăn uống:</b> ${item.khau_phan_an}</div>` : ''}
            ${item.so_phut_tap != null ? `<div class="bg-surface-container rounded-xl p-s3"><b>Thời lượng:</b> ${item.so_phut_tap} phút</div>` : ''}
            ${item.noi_dung_tap ? `<div class="bg-surface-container rounded-xl p-s3"><b>Tập luyện:</b> ${item.noi_dung_tap}</div>` : ''}
            ${item.loi_dan ? `<div class="bg-[#ecfdf5] text-[#065f46] rounded-xl p-s3 md:col-span-2"><b>Lời dặn:</b> ${item.loi_dan}</div>` : ''}
          </div>
        </div>
      `).join('');
    },
    async init() {
      await this._load();
      const list = document.getElementById('ptme-list');
      if (list) list.innerHTML = this._renderEntries(window.GymApp.data.ptMeThread?.entries || []);
      list?.addEventListener('click', e => {
        const btn = e.target.closest('.ptme-edit');
        if (!btn) return;
        const item = (window.GymApp.data.ptMeThread?.entries || []).find(x => String(x.id) === String(btn.dataset.id));
        if (!item) return;
        document.getElementById('ptme-feeling').value = item.cam_nhan_tap || '';
        document.getElementById('ptme-food').value = item.khau_phan_an || '';
        document.getElementById('ptme-minutes').value = item.so_phut_tap ?? '';
        document.getElementById('ptme-workout').value = item.noi_dung_tap || '';
        const submit = document.getElementById('ptme-submit');
        submit.dataset.editId = item.id;
        submit.innerHTML = '<span class="material-symbols-outlined">edit</span>Cập nhật';
        document.getElementById('ptme-feeling')?.focus();
      });
      document.getElementById('ptme-reload')?.addEventListener('click', async () => {
        await this._load();
        const listEl = document.getElementById('ptme-list');
        if (listEl) listEl.innerHTML = this._renderEntries(window.GymApp.data.ptMeThread?.entries || []);
      });
      document.getElementById('ptme-submit')?.addEventListener('click', async () => {
        const btn = document.getElementById('ptme-submit');
        btn.disabled = true; btn.textContent = 'Đang gửi...';
        try {
          const payload = {
            cam_nhan_tap: document.getElementById('ptme-feeling')?.value?.trim(),
            khau_phan_an: document.getElementById('ptme-food')?.value?.trim(),
            so_phut_tap: document.getElementById('ptme-minutes')?.value ? Number(document.getElementById('ptme-minutes').value) : null,
            noi_dung_tap: document.getElementById('ptme-workout')?.value?.trim(),
          };
          const editId = btn.dataset.editId;
          const res = editId ? await window.GymApp.api.put(`/pt-me/thread/${editId}`, payload) : await window.GymApp.api.post('/pt-me/thread', payload);
          if (res?.success) {
            window.GymApp.toast(editId ? 'Đã cập nhật và báo cho PT!' : 'Đã gửi cập nhật cho PT!', 'success');
            await this._load();
            navigate('pt-me');
          }
        } finally {
          delete btn.dataset.editId;
          btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined">send</span>Gửi cho PT';
        }
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

      const activePackage = getActivePackage();
      const pendingPackage = getPendingPackage();
      const displayPackage = activePackage || pendingPackage || null;
      const activePt = getActivePt();
      const memberType = window.GymApp.formatEnumLabel(p.loai_hv || 'thuong');
      
      let statusText = '○ Hết hạn';
      if (activePackage?.trang_thai === 'dang_hoat_dong') {
        statusText = '● Còn hạn';
        if (pendingPackage) {
          statusText = '● Có yêu cầu gia hạn';
        }
      } else if (pendingPackage) {
        statusText = '● Đang chờ duyệt';
      }
      const isActive = activePackage?.trang_thai === 'dang_hoat_dong';
      const bmi = calcBmi(p.chieu_cao_cm, p.can_nang_kg);

      return `
        <div class="flex flex-col gap-6">
          <div class="bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm overflow-hidden">

            <!-- Banner Header (members-list style) -->
            <div style="background:linear-gradient(135deg,#065f46 0%,#1D9336 60%,#4ade80 100%);padding:20px 24px 0;flex-shrink:0;position:relative;overflow:hidden;min-height:130px;">
              <!-- Background orbs -->
              <div style="position:absolute;top:-30px;right:-30px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.07);"></div>
              <div style="position:absolute;top:20px;right:80px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>
              <div style="position:absolute;bottom:-20px;left:120px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>

              <!-- Avatar + Name -->
              <div style="display:flex;align-items:flex-end;gap:16px;margin-bottom:16px;position:relative;z-index:1;">
                <div style="position:relative;flex-shrink:0;">
                  <div style="width:80px;height:80px;border-radius:50%;border:3px solid rgba(255,255,255,0.6);overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.25);">
                    ${window.GymApp.avatarImg(avatarUrl, tenHV, 'lg', 'width:100%;height:100%;object-fit:cover;')}
                  </div>
                  <span style="position:absolute;bottom:3px;right:3px;width:14px;height:14px;border-radius:50%;background:${isActive ? '#4ade80' : pendingPackage ? '#f59e0b' : '#94a3b8'};border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></span>
                </div>
                <div style="flex:1;min-width:0;padding-bottom:4px;">
                  <h3 style="font-size:22px;font-weight:800;color:#fff;line-height:1.2;margin:0 0 4px;text-shadow:0 1px 4px rgba(0,0,0,0.2);">${tenHV}</h3>
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span style="font-size:12px;color:rgba(255,255,255,0.85);font-weight:600;">${p.ma_ho_so || '—'}</span>
                    <span style="width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.5);"></span>
                    <span style="font-size:12px;color:rgba(255,255,255,0.85);">Hội viên</span>
                    <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:${isActive ? 'rgba(255,255,255,0.2)' : pendingPackage ? 'rgba(245,158,11,0.3)' : 'rgba(0,0,0,0.2)'};color:#fff;border:1px solid ${isActive ? 'rgba(255,255,255,0.3)' : pendingPackage ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.2)'};">${statusText}</span>
                  </div>
                </div>
              </div>

              <!-- Quick Stats Bar -->
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,0.15);border-radius:12px 12px 0 0;overflow:hidden;">
                <div style="background:rgba(0,0,0,0.15);padding:10px 14px;backdrop-filter:blur(4px);">
                  <div style="font-size:10px;color:rgba(255,255,255,0.65);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">Loại hội viên</div>
                  <div style="font-size:13px;font-weight:800;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${memberType}</div>
                </div>
                <div style="background:rgba(0,0,0,0.15);padding:10px 14px;backdrop-filter:blur(4px);">
                  <div style="font-size:10px;color:rgba(255,255,255,0.65);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">Gói tập</div>
                  <div style="font-size:13px;font-weight:800;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${displayPackage?.ten_goi || 'Chưa đăng ký'}">${displayPackage?.ten_goi || 'Chưa đăng ký'}${pendingPackage && activePackage ? ' (Gia hạn chờ duyệt)' : pendingPackage ? ' (Chờ duyệt)' : ''}</div>
                </div>
                <div style="background:rgba(0,0,0,0.15);padding:10px 14px;backdrop-filter:blur(4px);">
                  <div style="font-size:10px;color:rgba(255,255,255,0.65);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">Huấn luyện viên</div>
                  <div style="font-size:13px;font-weight:800;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${activePt?.ten_pt || 'Chưa có PT'}</div>
                </div>
              </div>
            </div>

            <!-- Info Body -->
            <div style="padding:20px 24px 24px;" class="bg-surface-container-lowest">
              <!-- Section title -->
              <div style="display:flex;align-items:center;gap:8px;margin:4px 0 16px;">
                <span class="material-symbols-outlined" style="font-size:15px;color:#1D9336;font-variation-settings:'FILL' 1;">badge</span>
                <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#1D9336;">Thông tin cá nhân</span>
                <div style="flex:1;height:1px;background:linear-gradient(to right,#1D933640,transparent);margin-left:4px;"></div>
              </div>

              <div class="mb-4 bg-surface-container rounded-xl p-s4 border border-outline-variant">
                <div class="flex flex-col md:flex-row md:items-center gap-s3">
                  <div class="flex-1">
                    <p class="text-label-md font-bold text-on-surface-variant">Chỉ số BMI</p>
                    <div class="flex items-end gap-s2 mt-s1">
                      <span class="text-headline-md font-black text-brand-primary">${bmi ? bmi.value.toFixed(1) : '—'}</span>
                      <span class="font-bold text-on-surface">${bmi ? bmi.category : 'Chưa có dữ liệu'}</span>
                    </div>
                    <p class="text-body-sm text-on-surface-variant mt-s1">${bmi ? bmi.advice : 'Nhập chiều cao và cân nặng hiện tại để hệ thống tính BMI.'}</p>
                  </div>
                  <div class="flex gap-s2">
                    <input id="bmi-height" type="number" min="80" max="250" value="${p.chieu_cao_cm || ''}" placeholder="cm" class="w-24 bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 outline-none" />
                    <input id="bmi-weight" type="number" min="20" max="300" value="${p.can_nang_kg || ''}" placeholder="kg" class="w-24 bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 outline-none" />
                    <button id="bmi-save" class="px-4 py-2 rounded-xl bg-brand-primary text-white font-bold">Lưu</button>
                  </div>
                </div>
              </div>

              <!-- 2-col info grid (exact members-list style) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-[1px] bg-outline-variant rounded-xl overflow-hidden border border-outline-variant">
                ${fields.map(f => `
                  <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg-surface-lowest, #fff);">
                    <div style="width:32px;height:32px;border-radius:8px;background:var(--bg-surface-low, #e7f5e9);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                      <span class="material-symbols-outlined" style="font-size:16px;color:#1D9336;font-variation-settings:'FILL' 1;">${f.icon}</span>
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
          window.GymApp.data.myProfile = res.data;
          window.GymApp.data.myPackages = res.data.goi_tap || [];
          window.GymApp.data.myPtContracts = res.data.dang_ky_pt || [];
          const content = document.getElementById('content-area');
          if (content) content.innerHTML = this.render();
        }
      } catch (e) {
        console.error(e);
      }
      document.getElementById('bmi-save')?.addEventListener('click', async () => {
        const btn = document.getElementById('bmi-save');
        btn.disabled = true; btn.textContent = 'Đang lưu...';
        try {
          const res = await window.GymApp.api.patch('/members/me/health', {
            chieu_cao_cm: document.getElementById('bmi-height')?.value || null,
            can_nang_kg: document.getElementById('bmi-weight')?.value || null,
          });
          if (res?.success) {
            window.GymApp.toast('Đã cập nhật BMI!', 'success');
            const fresh = await window.GymApp.api.get('/members/me/profile');
            if (fresh?.success) {
              window.GymApp.data.myProfile = fresh.data;
              navigate('profile');
            }
          }
        } finally {
          btn.disabled = false; btn.textContent = 'Lưu';
        }
      });
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
        <div class="bg-surface-container-lowest w-full max-w-md rounded-[24px] shadow-2xl animate-scale-in flex flex-col">
          <div class="px-s6 py-s5 text-white flex-shrink-0" style="background:linear-gradient(135deg,#1D9336,#0a591c); border-top-left-radius: 24px; border-top-right-radius: 24px;">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-headline-sm font-bold uppercase tracking-wider">Gia hạn gói tập</h3>
                <p class="text-body-sm opacity-85 mt-s1">Chọn gói tập và ngày bắt đầu</p>
              </div>
              <button id="btn-renew-close" class="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-s2 rounded-full transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>
          
          <div class="p-s6 space-y-s5 flex-1 overflow-y-auto">
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

          <div class="px-s6 py-s5 bg-surface-low border-t border-outline-variant flex justify-end gap-s3" style="border-bottom-left-radius: 24px; border-bottom-right-radius: 24px;">
            <button id="btn-renew-cancel" class="px-s5 py-s3 rounded-xl font-bold text-label-md border border-outline-variant text-on-surface hover:bg-surface-container transition-colors">Hủy bỏ</button>
            <button id="btn-renew-submit" class="px-s6 py-s3 rounded-xl font-bold text-label-md bg-brand-primary text-white hover:opacity-90 transition-all shadow-[0_2px_8px_rgba(29,147,54,0.3)] active:scale-95">Gửi yêu cầu</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const closeModal = () => document.getElementById('modal-member-renewal')?.remove();
    document.getElementById('btn-renew-cancel').onclick = closeModal;
    document.getElementById('btn-renew-close').onclick = closeModal;
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
