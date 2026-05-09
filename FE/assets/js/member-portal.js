/**
 * Member Portal — App logic cho Hội viên
 */
(function () {

  // ── Guard: chỉ hội viên được vào trang này ────────────────
  async function initPortal() {
    const token = localStorage.getItem('gym-token');
    if (!token) { window.location.href = 'login.html'; return; }

    let user;
    try {
      const res = await window.GymApp.api.get('/auth/me');
      if (!res?.success) { window.location.href = 'login.html'; return; }
      user = res.data;
    } catch (_) { window.location.href = 'login.html'; return; }

    // Nếu không phải hội viên thì redirect về đúng portal
    if (user.vai_tro === 'admin' || user.vai_tro === 'le_tan') {
      window.location.href = 'index.html'; return;
    }
    if (user.vai_tro === 'pt') {
      window.location.href = 'pt-portal.html'; return;
    }

    window.GymApp.auth.user = user;
    _updateHeaderUI(user);

    // Load dữ liệu ban đầu song song
    await _fetchData();

    // Áp dụng theme
    _applyTheme(localStorage.getItem('gym-theme') || 'light');

    // Sự kiện
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      _applyTheme(isDark ? 'light' : 'dark');
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn đăng xuất?')) window.GymApp.auth.logout();
    });

    // Click delegation cho bottom tab bar và header avatar
    document.addEventListener('click', function (e) {
      const tabBtn = e.target.closest('[data-tab]');
      if (tabBtn?.dataset.tab) {
        navigate(tabBtn.dataset.tab);
      }
    });

    // Trang mặc định
    navigate('dashboard');
  }

  function _updateHeaderUI(user) {
    if (!user.avatar_url) return;
    const headerAvatar = document.getElementById('header-avatar');
    if (headerAvatar) {
      headerAvatar.innerHTML = `<img src="${user.avatar_url}" class="w-full h-full rounded-full object-cover">`;
    }
  }

  async function _fetchData() {
    try {
      const [schedulesRes, profileRes, checkinsRes] = await Promise.all([
        window.GymApp.api.get('/pt/schedules'),
        window.GymApp.api.get('/members/me/profile'),
        window.GymApp.api.get('/checkins/me?limit=30'),
      ]);
      if (schedulesRes?.success) window.GymApp.data.ptSchedules = schedulesRes.data || [];
      if (profileRes?.success) {
        const d = profileRes.data;
        window.GymApp.data.myProfile = d;
        // Backend trả về goi_tap và dang_ky_pt
        window.GymApp.data.myPackages    = d.goi_tap    || [];
        window.GymApp.data.myPtContracts = d.dang_ky_pt || [];
      }
      if (checkinsRes?.success) window.GymApp.data.myCheckins = checkinsRes.data?.data || checkinsRes.data || [];
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

  // ── Navigate ───────────────────────────────────────────────
  function navigate(tabName) {
    const page = pages[tabName];
    if (!page) return;

    document.getElementById('content-area').innerHTML = page.render();

    // Cập nhật active tab
    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.classList.remove('text-brand-primary');
      btn.classList.add('text-on-surface-variant');
      if (btn.dataset.tab === tabName) {
        btn.classList.remove('text-on-surface-variant');
        btn.classList.add('text-brand-primary');
      }
    });

    window.GymApp.currentPage = tabName;
    if (page.init) setTimeout(() => page.init(), 50);
  }

  // ── PAGES ──────────────────────────────────────────────────

  const pages = {};

  // ── Dashboard ──────────────────────────────────────────────
  pages['dashboard'] = {
    render() {
      const user     = window.GymApp.auth.user || {};
      const packages = window.GymApp.data.myPackages || [];
      const ptContracts = window.GymApp.data.myPtContracts || [];
      const schedules = window.GymApp.data.ptSchedules || [];
      const today = new Date().toISOString().split('T')[0];

      // Gói tập còn hạn
      const activePackage = packages.find(p => p.trang_thai === 'dang_hoat_dong') || packages[0];
      const daysLeft = activePackage?.den_ngay
        ? Math.max(0, Math.round((new Date(activePackage.den_ngay) - new Date()) / 86400000))
        : null;
      const isExpiringSoon = daysLeft !== null && daysLeft <= 7;

      // Gói PT còn hiệu lực
      const activePt = ptContracts.find(p => p.trang_thai === 'dang_hoat_dong');
      const buoiConLai = activePt ? (activePt.so_buoi_dang_ky - activePt.so_buoi_da_tap) : null;

      // Lịch sắp tới
      const upcoming = schedules
        .filter(s => s.trang_thai === 'cho_tap' && s.ngay_tap >= today)
        .slice(0, 3);

      return `
        <div class="flex flex-col gap-loose">
          <!-- Greeting -->
          <div class="page-title-bar">
            <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Xin chào, ${user.ho_ten || 'Hội viên'} 👋</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs">${window.GymApp.formatDate(today)}</p>
          </div>

          ${isExpiringSoon ? `
          <!-- Cảnh báo sắp hết hạn -->
          <div class="rounded-2xl border border-[#e65100] p-standard flex items-center gap-compact" style="background:#fff3e0">
            <span class="material-symbols-outlined text-[#e65100] text-2xl flex-shrink-0" style="font-variation-settings:'FILL' 1">warning</span>
            <div>
              <p class="font-bold text-[#e65100] text-body-md">Gói tập sắp hết hạn!</p>
              <p class="text-[#b84500] text-body-sm">Còn <strong>${daysLeft} ngày</strong> — Liên hệ lễ tân để gia hạn.</p>
            </div>
          </div>
          ` : ''}

          <!-- Gói tập -->
          <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm">
            <div class="flex items-center gap-compact mb-standard">
              <div class="icon-bg icon-bg-green"><span class="material-symbols-outlined text-brand-primary text-lg" style="font-variation-settings:'FILL' 1">card_membership</span></div>
              <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Gói tập hiện tại</h3>
            </div>
            ${activePackage
              ? `<div class="grid grid-cols-2 gap-standard">
                   <div class="bg-surface-container rounded-xl p-standard">
                     <p class="text-on-surface-variant text-body-sm">Gói tập</p>
                     <p class="font-bold text-on-surface text-body-md">${activePackage.ten_goi || '—'}</p>
                   </div>
                   <div class="bg-surface-container rounded-xl p-standard">
                     <p class="text-on-surface-variant text-body-sm">Hết hạn</p>
                     <p class="font-bold ${isExpiringSoon ? 'text-[#e65100]' : 'text-on-surface'} text-body-md">${window.GymApp.formatDate(activePackage.den_ngay)}</p>
                   </div>
                   <div class="bg-surface-container rounded-xl p-standard">
                     <p class="text-on-surface-variant text-body-sm">Ngày bắt đầu</p>
                     <p class="font-bold text-on-surface text-body-md">${window.GymApp.formatDate(activePackage.tu_ngay)}</p>
                   </div>
                   <div class="bg-surface-container rounded-xl p-standard">
                     <p class="text-on-surface-variant text-body-sm">Còn lại</p>
                     <p class="font-bold ${isExpiringSoon ? 'text-[#e65100]' : 'text-brand-primary'} text-body-md">${daysLeft ?? '—'} ngày</p>
                   </div>
                 </div>`
              : `<p class="text-on-surface-variant text-body-sm text-center py-standard">Chưa có gói tập nào đang hoạt động.</p>`
            }
          </div>

          <!-- PT hiện tại -->
          <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm">
            <div class="flex items-center gap-compact mb-standard">
              <div class="icon-bg icon-bg-orange"><span class="material-symbols-outlined text-[#e65100] text-lg" style="font-variation-settings:'FILL' 1">sports_gymnastics</span></div>
              <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Huấn luyện viên</h3>
            </div>
            ${activePt
              ? `<div class="flex items-center gap-compact p-standard rounded-xl bg-surface-container">
                   ${window.GymApp.avatarImg(activePt.avatar_pt, activePt.ten_pt, 'lg')}
                   <div class="flex-1 min-w-0">
                     <p class="font-bold text-on-surface text-body-md">${activePt.ten_pt || '—'}</p>
                     <p class="text-on-surface-variant text-body-sm">${activePt.chuyen_mon || ''}</p>
                   </div>
                   <div class="text-right">
                     <p class="font-bold text-brand-primary text-display-2xl">${buoiConLai ?? '—'}</p>
                     <p class="text-on-surface-variant text-body-sm">buổi còn lại</p>
                   </div>
                 </div>`
              : `<p class="text-on-surface-variant text-body-sm text-center py-standard">Chưa đăng ký gói PT nào.</p>`
            }
          </div>

          <!-- Lịch sắp tới -->
          <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm">
            <div class="flex items-center gap-compact mb-standard">
              <div class="icon-bg icon-bg-blue"><span class="material-symbols-outlined text-secondary text-lg" style="font-variation-settings:'FILL' 1">event_upcoming</span></div>
              <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Lịch tập sắp tới</h3>
            </div>
            ${upcoming.length === 0
              ? `<p class="text-on-surface-variant text-body-sm text-center py-standard">Không có lịch tập sắp tới.</p>`
              : `<div class="flex flex-col gap-standard">
                  ${upcoming.map(s => `
                    <div class="flex items-center gap-compact p-standard rounded-xl bg-surface-container border border-outline-variant">
                      <div class="icon-bg icon-bg-green flex-shrink-0" style="width:36px;height:36px;border-radius:10px">
                        <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">calendar_month</span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-bold text-on-surface text-body-md">${window.GymApp.formatDate(s.ngay_tap)}</p>
                        <p class="text-on-surface-variant text-body-sm">${s.gio_bat_dau} — ${s.gio_ket_thuc} · PT: ${s.ten_pt || '—'}</p>
                      </div>
                      ${window.GymApp.statusBadge(s.trang_thai)}
                    </div>
                  `).join('')}
                </div>`
            }
          </div>
        </div>
      `;
    },
    init() {}
  };

  // ── Lịch tập ──────────────────────────────────────────────
  pages['my-schedule'] = {
    render() {
      const schedules = window.GymApp.data.ptSchedules || [];
      return `
        <div class="flex flex-col gap-loose">
          <div class="page-title-bar">
            <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Lịch tập của tôi</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs">Toàn bộ lịch tập đã đặt</p>
          </div>

          <!-- Filter -->
          <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-standard shadow-sm">
            <div class="flex flex-wrap gap-standard">
              <select id="ms-status" class="bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md flex-1 min-w-[140px] transition-colors">
                <option value="">Tất cả trạng thái</option>
                <option value="cho_tap">Chờ tập</option>
                <option value="da_tap">Đã tập</option>
                <option value="da_huy">Đã hủy</option>
                <option value="vang">Vắng</option>
              </select>
              <input id="ms-date" type="date" class="bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md flex-1 min-w-[140px] transition-colors" />
            </div>
          </div>

          <div id="ms-list" class="flex flex-col gap-standard">
            ${this._renderList(schedules)}
          </div>
        </div>
      `;
    },

    _renderList(list) {
      if (!list.length) return `
        <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-margin text-center text-on-surface-variant">
          <span class="material-symbols-outlined text-4xl text-outline block mb-standard">event_busy</span>
          <p class="font-bold">Không tìm thấy lịch tập</p>
        </div>`;

      return list.map(s => `
        <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm flex flex-col gap-standard">
          <div class="flex items-center justify-between">
            <p class="font-bold text-on-surface text-body-md">${window.GymApp.formatDate(s.ngay_tap)}</p>
            ${window.GymApp.statusBadge(s.trang_thai)}
          </div>
          <div class="flex items-center gap-compact">
            <div class="icon-bg icon-bg-orange flex-shrink-0" style="width:32px;height:32px;border-radius:8px">
              <span class="material-symbols-outlined text-[#e65100] text-sm" style="font-variation-settings:'FILL' 1">schedule</span>
            </div>
            <p class="font-bold text-on-surface text-body-md">${s.gio_bat_dau} — ${s.gio_ket_thuc}</p>
          </div>
          <div class="flex items-center gap-compact">
            ${window.GymApp.avatarImg(s.avatar_pt, s.ten_pt, 'sm')}
            <div>
              <p class="text-on-surface-variant text-body-sm">Huấn luyện viên</p>
              <p class="font-bold text-on-surface text-body-md">${s.ten_pt || '—'}</p>
            </div>
          </div>
          ${s.ghi_chu ? `<p class="text-on-surface-variant text-body-sm border-t border-outline-variant pt-standard">${s.ghi_chu}</p>` : ''}
        </div>
      `).join('');
    },

    _applyFilter() {
      const status = document.getElementById('ms-status')?.value || '';
      const date = document.getElementById('ms-date')?.value || '';
      const filtered = (window.GymApp.data.ptSchedules || []).filter(s => {
        const matchS = !status || s.trang_thai === status;
        const matchD = !date || s.ngay_tap === date;
        return matchS && matchD;
      });
      document.getElementById('ms-list').innerHTML = this._renderList(filtered);
    },

    init() {
      const self = this;
      document.getElementById('ms-status')?.addEventListener('change', () => self._applyFilter());
      document.getElementById('ms-date')?.addEventListener('change', () => self._applyFilter());
    }
  };

  // ── Lịch sử vào/ra ────────────────────────────────────────
  pages['checkins'] = {
    _page: 1,
    _perPage: 15,

    render() {
      const checkins = window.GymApp.data.myCheckins || [];
      return `
        <div class="flex flex-col gap-loose">
          <div class="page-title-bar">
            <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Lịch sử vào / ra</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs">Lịch sử các lần bạn check-in phòng tập</p>
          </div>

          <button id="ci-reload" class="self-end flex items-center gap-xs px-loose py-compact rounded-xl border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-all font-body-md whitespace-nowrap text-body-md">
            <span class="material-symbols-outlined text-sm">refresh</span>Tải lại
          </button>

          <div id="ci-list" class="flex flex-col gap-standard">
            ${this._renderList(checkins)}
          </div>
        </div>
      `;
    },

    _renderList(list) {
      if (!list.length) return `
        <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-margin text-center text-on-surface-variant">
          <span class="material-symbols-outlined text-4xl text-outline block mb-standard">history</span>
          <p class="font-bold">Chưa có lịch sử vào/ra</p>
        </div>`;

      return list.map(c => `
        <div class="flex items-center gap-compact p-standard rounded-xl bg-surface-container-lowest border border-outline-variant">
          <div class="icon-bg ${c.loai === 'vao' ? 'icon-bg-green' : 'icon-bg-blue'} flex-shrink-0" style="width:36px;height:36px;border-radius:10px">
            <span class="material-symbols-outlined ${c.loai === 'vao' ? 'text-brand-primary' : 'text-secondary'} text-sm" style="font-variation-settings:'FILL' 1">${c.loai === 'vao' ? 'login' : 'logout'}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-on-surface text-body-md">${c.gio_hien_thi || new Date(c.thoi_diem).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
            <p class="text-on-surface-variant text-body-sm">${window.GymApp.formatDate(c.thoi_diem?.split('T')[0] || c.thoi_diem)} · ${c.phuong_thuc === 'the_tu' ? 'Thẻ từ' : c.phuong_thuc === 'qr_code' ? 'QR Code' : c.phuong_thuc === 'khuon_mat' ? 'Khuôn mặt' : 'Thủ công'}</p>
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
        } catch (e) { console.error(e); }
        document.getElementById('ci-list').innerHTML = self._renderList(window.GymApp.data.myCheckins || []);
        window.GymApp.toast('Đã tải lại!', 'success');
      });
    }
  };

  // ── Hồ sơ cá nhân ─────────────────────────────────────────
  pages['profile'] = {
    render() {
      // API getMyProfile trả về flat object (không nested)
      const p = window.GymApp.data.myProfile || {};
      const u = window.GymApp.auth.user || {};

      const fields = [
        { label: 'Mã hồ sơ', value: p.ma_ho_so, icon: 'badge' },
        { label: 'Họ tên', value: p.ho_ten, icon: 'person' },
        { label: 'Giới tính', value: p.gioi_tinh === 'nam' ? 'Nam' : p.gioi_tinh === 'nu' ? 'Nữ' : p.gioi_tinh || '—', icon: 'wc' },
        { label: 'Ngày sinh', value: window.GymApp.formatDate(p.ngay_sinh), icon: 'cake' },
        { label: 'Số điện thoại', value: p.so_dien_thoai, icon: 'phone' },
        { label: 'Email', value: p.email, icon: 'email' },
        { label: 'Chi nhánh', value: p.chi_nhanh, icon: 'location_on' },
        { label: 'Loại hội viên', value: p.loai_hv, icon: 'star' },
        { label: 'Ghi chú', value: p.ghi_chu, icon: 'notes' },
      ];

      const avatarUrl = p.avatar_url || u.avatar_url;
      const tenHV = p.ho_ten || u.ho_ten;

      return `
        <div class="flex flex-col gap-loose">
          <div class="page-title-bar">
            <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Hồ sơ cá nhân</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs">Thông tin cá nhân của bạn (chỉ xem)</p>
          </div>

          <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <!-- Avatar -->
            <div class="section-header px-loose py-loose border-b border-outline-variant flex items-center gap-loose">
              <div style="width:72px;height:72px;border-radius:50%;overflow:hidden;flex-shrink:0;border:3px solid #1D9336;">
                ${avatarUrl
                  ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;" />`
                  : window.GymApp.avatarInitials(tenHV, 'lg')
                }
              </div>
              <div>
                <p class="font-bold text-on-surface text-display-2xl">${tenHV || '—'}</p>
                <p class="text-on-surface-variant text-body-sm mt-xs">Hội viên · ${p.loai_hv || 'Thường'}</p>
              </div>
            </div>

            <!-- Fields -->
            <div class="p-loose grid grid-cols-1 gap-standard">
              ${fields.map(f => `
                <div class="flex items-start gap-compact p-standard rounded-xl bg-surface-container">
                  <div class="icon-bg icon-bg-green flex-shrink-0" style="width:32px;height:32px;border-radius:8px">
                    <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">${f.icon}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-on-surface-variant text-body-sm">${f.label}</p>
                    <p class="font-bold text-on-surface text-body-md">${f.value || '—'}</p>
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
          window.GymApp.data.myProfile = res.data;
          window.GymApp.data.myPackages    = res.data.goi_tap    || [];
          window.GymApp.data.myPtContracts = res.data.dang_ky_pt || [];
          document.getElementById('content-area').innerHTML = this.render();
        }
      } catch (e) { console.error(e); }
    }
  };

  // ── Khởi động ──────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', initPortal);

})();
