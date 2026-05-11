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
    return packages.find(p => p.trang_thai === 'dang_hoat_dong') || packages[0] || null;
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
      if (tabBtn?.dataset.tab) navigate(tabBtn.dataset.tab);
    });

    navigate('dashboard');
  }

  function _updateHeaderUI(user) {
    const headerAvatar = document.getElementById('header-avatar');
    if (!headerAvatar) return;
    if (user.avatar_url) {
      headerAvatar.innerHTML = `<img src="${user.avatar_url}" class="w-full h-full rounded-full object-cover" alt="${user.ho_ten || ''}">`;
    } else {
      headerAvatar.innerHTML = `<span class="material-symbols-outlined text-on-surface-variant" style="font-variation-settings:'FILL' 1">person</span>`;
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
        window.GymApp.data.myPackages = d.goi_tap || [];
        window.GymApp.data.myPtContracts = d.dang_ky_pt || [];
      }
      if (checkinsRes?.success) {
        window.GymApp.data.myCheckins = checkinsRes.data?.data || checkinsRes.data || [];
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
    if (page.init) setTimeout(() => page.init(), 50);
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

  function scheduleRow(s) {
    const day = s.ngay_tap ? new Date(s.ngay_tap) : null;
    const weekday = day ? day.toLocaleDateString('vi-VN', { weekday: 'short' }) : '—';
    const date = day ? day.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '—';
    return `
      <div class="p-s5 flex items-center gap-s4 hover:bg-surface-container transition-colors">
        <div class="bg-surface-container-low w-14 h-14 rounded-lg flex flex-col items-center justify-center shrink-0">
          <span class="font-bold text-brand-primary">${weekday}</span>
          <span class="text-label-sm text-on-surface-variant">${date}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-bold text-on-surface text-label-md truncate">${s.ten_pt ? `Tập cùng ${s.ten_pt}` : 'Lịch tập PT'}</p>
          <p class="text-label-sm text-on-surface-variant">${window.GymApp.formatTime(s.gio_bat_dau)} - ${window.GymApp.formatTime(s.gio_ket_thuc)} | ${window.GymApp.formatEnumLabel(s.loai_buoi || 'ca_nhan')}</p>
        </div>
        ${window.GymApp.statusBadge(s.trang_thai)}
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
                ${isExpiringSoon ? `<span class="bg-white/20 px-s4 py-s3 rounded-full text-label-md">Gói còn ${daysLeft} ngày</span>` : ''}
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
              <h3 class="text-headline-sm font-bold text-brand-primary">Tình trạng hội viên</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-s4">
                <div class="bg-surface-container rounded-xl p-s4">
                  <p class="text-on-surface-variant text-label-md">Trạng thái gói</p>
                  <div class="mt-s2">${activePackage ? window.GymApp.statusBadge(activePackage.trang_thai) : window.GymApp.statusBadge('chua_dang_ky')}</div>
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
                <p class="text-body-md text-on-surface mt-s2">${isExpiringSoon ? `Gói tập còn ${daysLeft} ngày. Bạn nên liên hệ lễ tân để gia hạn.` : 'Tất cả dữ liệu trên được lấy từ hệ thống hiện tại.'}</p>
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
              ${avatarUrl ? `<img src="${avatarUrl}" class="w-[72px] h-[72px] rounded-full object-cover border-2 border-brand-primary" alt="${tenHV}">` : window.GymApp.avatarInitials(tenHV, 'xl')}
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

  document.addEventListener('DOMContentLoaded', initPortal);
})();
