window.GymApp.pages['expired'] = {
  _tab: 'expired',
  _expiredPage: 1, _expiringPage: 1, _requestsPage: 1, _perPage: 10,
  _expiredList: [], _expiringList: [], _requestsList: [],
  _searchQuery: '',

  render: function () {
    return `
      <div class="flex flex-col gap-standard animate-in fade-in duration-500">
        
        <!-- Stats Row -->
        <div id="expired-stats" class="grid grid-cols-1 sm:grid-cols-3 gap-standard">
          ${this._renderStats(0, 0)}
        </div>

        <!-- Filter & Tabs Row -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-compact">
          <div class="flex items-center gap-1 bg-surface-container-low/50 backdrop-blur-sm p-1 rounded-2xl border-2 border-outline-variant/50 w-fit shadow-sm overflow-x-auto max-w-full">
            <button id="tab-expired-list" class="px-4 py-2 rounded-xl font-bold text-sm bg-brand-primary text-white shadow-sm transition-all duration-300 flex items-center gap-xs whitespace-nowrap border border-brand-primary/20">
              <span class="material-symbols-outlined text-[18px]">cancel</span>
              <span id="tab-expired-count">Hết hạn (0)</span>
            </button>
            <button id="tab-expiring-list" class="px-4 py-2 rounded-xl font-bold text-sm text-on-surface-variant hover:text-brand-primary hover:bg-brand-primary/5 transition-all duration-300 flex items-center gap-xs whitespace-nowrap border border-transparent">
              <span class="material-symbols-outlined text-[18px]">warning_amber</span>
              <span id="tab-expiring-count">Sắp hết (0)</span>
            </button>
            <button id="tab-requests-list" class="px-4 py-2 rounded-xl font-bold text-sm text-on-surface-variant hover:text-brand-primary hover:bg-brand-primary/5 transition-all duration-300 flex items-center gap-xs whitespace-nowrap relative border border-transparent">
              <span class="material-symbols-outlined text-[18px]">history_edu</span>
              <span id="tab-requests-count">Yêu cầu (0)</span>
              <div id="requests-badge" class="hidden absolute -top-1 -right-1 w-4 h-4 bg-error text-white text-label-xs rounded-full flex items-center justify-center font-black border-2 border-surface-container-lowest"></div>
            </button>
          </div>

          <div class="flex items-center gap-compact flex-1 max-w-md">
            <div class="relative flex-1 group">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors text-[18px]">search</span>
              <input id="expired-search" type="text" placeholder="Tìm tên, SĐT..." class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface pl-10 pr-4 py-2 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none placeholder-outline-variant/60 font-body-md text-body-md transition-all shadow-sm focus:shadow-none" value="${this._searchQuery}">
            </div>
            <button id="btn-refresh-expired" class="w-10 h-10 flex items-center justify-center rounded-xl border border-outline-variant bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all shadow-sm active:scale-95 duration-200 cursor-pointer">
              <span class="material-symbols-outlined text-base">refresh</span>
            </button>
          </div>
        </div>

        <!-- Content Area -->
        <div class="relative min-h-[400px]">
          <!-- Loading Overlay -->
          <div id="expired-loading" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl transition-all duration-500">
             <div class="relative w-16 h-16">
               <div class="absolute inset-0 border-4 border-brand-primary/10 rounded-2xl"></div>
               <div class="absolute inset-0 border-4 border-t-brand-primary rounded-2xl animate-spin"></div>
             </div>
             <p class="mt-loose text-body-md font-black text-brand-primary animate-pulse tracking-wide">ĐANG TẢI DỮ LIỆU...</p>
          </div>

          <!-- Table Đã hết hạn -->
          <div id="panel-expired" class="hidden animate-in slide-in-from-bottom-4 duration-500">
            <div id="expired-table-container"></div>
          </div>

          <!-- Table Sắp hết hạn -->
          <div id="panel-expiring" class="hidden animate-in slide-in-from-bottom-4 duration-500">
            <div id="expiring-table-container"></div>
          </div>

          <!-- Table Yêu cầu gia hạn -->
          <div id="panel-requests" class="hidden animate-in slide-in-from-bottom-4 duration-500">
            <div id="requests-table-container"></div>
          </div>
        </div>
      </div>
    `;
  },

  _loadData: async function () {
    const self = this;
    const loading = document.getElementById('expired-loading');
    if (loading) {
      loading.classList.remove('opacity-0', 'hidden');
      loading.style.display = 'flex';
    }

    const btn = document.getElementById('btn-refresh-expired');
    const icon = btn?.querySelector('.material-symbols-outlined');
    if (icon) icon.classList.add('animate-spin');
    if (btn) btn.classList.add('pointer-events-none', 'opacity-50');

    try {
      const [expiredRes, expiringRes, requestsRes] = await Promise.all([
        window.GymApp.api.get('/members/expired'),
        window.GymApp.api.get('/members/expiring?days=7'),
        window.GymApp.api.get('/members/package-requests'),
      ]);

      const now = new Date();
      self._expiredList = (expiredRes && expiredRes.success) ? (expiredRes.data || []) : [];
      self._expiringList = (expiringRes && expiringRes.success ? (expiringRes.data || []) : []).map(m => {
        const diff = m.ngay_het_han
          ? (new Date(m.ngay_het_han) - now) / (1000 * 60 * 60 * 24)
          : 999;
        return { ...m, daysLeft: Math.max(0, Math.ceil(diff)) };
      });
      self._requestsList = (requestsRes && requestsRes.success) ? (requestsRes.data || []) : [];

      // Update UI
      const statsEl = document.getElementById('expired-stats');
      if (statsEl) statsEl.innerHTML = self._renderStats(self._expiredList.length, self._expiringList.length, self._requestsList.length);

      const tabExpired = document.getElementById('tab-expired-count');
      const tabExpiring = document.getElementById('tab-expiring-count');
      const tabRequests = document.getElementById('tab-requests-count');
      const badge = document.getElementById('requests-badge');

      if (tabExpired) tabExpired.textContent = `Hết hạn (${self._expiredList.length})`;
      if (tabExpiring) tabExpiring.textContent = `Sắp hết (${self._expiringList.length})`;
      if (tabRequests) tabRequests.textContent = `Yêu cầu (${self._requestsList.length})`;
      if (badge) {
        badge.textContent = self._requestsList.length;
        badge.classList.toggle('hidden', self._requestsList.length === 0);
      }

      self._refreshView();

      // Hide loading
      if (loading) {
        loading.classList.add('opacity-0');
        setTimeout(() => {
          loading.classList.add('hidden');
          loading.style.display = 'none';
        }, 500);
      }
    } catch (err) {
      console.error('Lỗi load dữ liệu expired:', err);
      if (loading) {
        loading.innerHTML = `
          <div class="text-center p-standard bg-error/10 border border-error/20 rounded-2xl">
            <span class="material-symbols-outlined text-error text-4xl mb-compact">error</span>
            <p class="text-error font-bold">Lỗi kết nối máy chủ!</p>
            <button onclick="window.GymApp.pages['expired']._loadData()" class="mt-standard px-loose py-compact bg-error text-white rounded-xl font-bold">Thử lại</button>
          </div>`;
      }
    } finally {
      if (icon) icon.classList.remove('animate-spin');
      if (btn) btn.classList.remove('pointer-events-none', 'opacity-50');
    }
  },

  _refreshView: function () {
    const self = this;
    const query = (this._searchQuery || '').toLowerCase().trim();

    const filterFn = m => !query ||
      (m.ho_ten && m.ho_ten.toLowerCase().includes(query)) ||
      (m.ma_ho_so && m.ma_ho_so.toLowerCase().includes(query)) ||
      (m.so_dien_thoai && m.so_dien_thoai.includes(query));

    if (this._tab === 'expired') {
      const filtered = this._expiredList.filter(filterFn);
      const panel = document.getElementById('panel-expired');
      if (panel) {
        panel.classList.remove('hidden');
        document.getElementById('panel-expiring').classList.add('hidden');
        document.getElementById('panel-requests').classList.add('hidden');
        document.getElementById('expired-table-container').innerHTML = this._renderExpiredTable(filtered);
      }
    } else if (this._tab === 'expiring') {
      const filtered = this._expiringList.filter(filterFn);
      const panel = document.getElementById('panel-expiring');
      if (panel) {
        panel.classList.remove('hidden');
        document.getElementById('panel-expired').classList.add('hidden');
        document.getElementById('panel-requests').classList.add('hidden');
        document.getElementById('expiring-table-container').innerHTML = this._renderExpiringTable(filtered);
      }
    } else {
      const filtered = this._requestsList.filter(filterFn);
      const panel = document.getElementById('panel-requests');
      if (panel) {
        panel.classList.remove('hidden');
        document.getElementById('panel-expired').classList.add('hidden');
        document.getElementById('panel-expiring').classList.add('hidden');
        document.getElementById('requests-table-container').innerHTML = this._renderRequestsTable(filtered);
      }
    }
    this._bindTableEvents();
  },

  _renderStats: function (expiredCount, expiringCount, requestsCount) {
    const stats = [
      { label: 'Hội viên hết hạn', value: expiredCount, color: 'text-error', icon: 'person_off', bg: 'bg-error/10', border: 'border-error/20' },
      { label: 'Sắp hết hạn', value: expiringCount, color: 'text-[#e65100]', icon: 'pending_actions', bg: 'bg-[#e65100]/10', border: 'border-[#e65100]/20' },
      { label: 'Yêu cầu từ App', value: requestsCount, color: 'text-brand-primary', icon: 'app_shortcut', bg: 'bg-brand-primary/10', border: 'border-brand-primary/20' },
    ];

    return stats.map(s => `
      <div class="bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl border-2 border-outline-variant/50 shadow-sm flex items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group relative overflow-hidden">
        <div class="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500 group-hover:scale-125 transform">
          <span class="material-symbols-outlined text-[100px]">${s.icon}</span>
        </div>
        <div class="w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-sm">
          <span class="material-symbols-outlined ${s.color} text-[22px]" style="font-variation-settings:'FILL' 1">${s.icon}</span>
        </div>
        <div class="flex flex-col relative z-10 min-w-0">
          <span class="text-on-surface-variant text-body-sm font-bold mb-1">${s.label}</span>
          <div class="flex items-baseline gap-1">
            <span class="${s.color} text-headline font-bold tracking-tight leading-none">${s.value}</span>
            <span class="text-on-surface-variant text-label-xs font-bold opacity-40">hv</span>
          </div>
        </div>
      </div>
    `).join('');
  },

  _renderExpiredTable: function (list) {
    if (list.length === 0) return this._renderEmptyState('Không có hội viên hết hạn');

    const start = (this._expiredPage - 1) * this._perPage;
    const paginated = list.slice(start, start + this._perPage);

    const rows = paginated.map(m => `
      <tr class="group hover:bg-brand-primary/5 transition-colors border-b border-outline-variant/30">
        <td class="px-standard py-3">
          <div class="flex items-center gap-standard">
            ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'lg', 'width:48px;height:48px;border-radius:16px;')}
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-xs">
                <p class="font-black text-on-surface text-body-md truncate">${m.ho_ten}</p>
                ${m.co_yeu_cau_gia_han ? `
                  <span class="flex items-center gap-[2px] bg-warning-container text-warning text-label-xs px-1.5 py-0.5 rounded-lg font-black animate-pulse" title="Có yêu cầu gia hạn từ App">
                    <span class="material-symbols-outlined text-[12px]">app_registration</span>
                    APP
                  </span>` : ''}
              </div>
              <p class="text-on-surface-variant text-body-sm font-bold opacity-60">${m.so_dien_thoai || '—'}</p>
            </div>
          </div>
        </td>
        <td class="px-standard py-3">
          <span class="text-on-surface-variant text-body-sm font-mono font-black bg-surface-container px-2.5 py-1 rounded-xl border border-outline-variant/30">${m.ma_ho_so}</span>
        </td>
        <td class="px-standard py-3">
          <div class="flex flex-col gap-1">
            <div class="inline-flex items-center px-2 py-0.5 rounded-lg bg-surface-container text-on-surface text-body-sm font-black border border-outline-variant/50 w-fit">
              ${m.ten_goi_tap || 'N/A'}
            </div>
            <div class="flex items-center gap-1.5 text-error">
              <span class="material-symbols-outlined text-[16px]">event_busy</span>
              <span class="text-body-sm font-black">Hết hạn: ${window.GymApp.formatDate(m.ngay_het_han)}</span>
            </div>
          </div>
        </td>
        <td class="px-standard py-3 text-center">
          <div class="flex justify-center items-center gap-compact">
            <button class="notify-btn w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-brand-primary hover:text-white transition-all shadow-sm active:scale-95" data-id="${m.id}" title="Gửi nhắc nhở">
              <span class="material-symbols-outlined text-[20px]">notifications_active</span>
            </button>
            <button class="renew-btn w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-brand-primary hover:text-white transition-all shadow-sm active:scale-95" data-id="${m.id}" title="Lập phiếu gia hạn">
              <span class="material-symbols-outlined text-[20px]">history_edu</span>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    return `
      <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low/30 border-b border-outline-variant/50">
                <th class="px-standard py-4 font-black text-label-bold text-on-surface-variant uppercase tracking-widest opacity-60">Hội viên</th>
                <th class="px-standard py-4 font-black text-label-bold text-on-surface-variant uppercase tracking-widest opacity-60">Mã HV</th>
                <th class="px-standard py-4 font-black text-label-bold text-on-surface-variant uppercase tracking-widest opacity-60">Gói tập</th>
                <th class="px-standard py-4 font-black text-label-bold text-on-surface-variant uppercase tracking-widest opacity-60 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${window.GymApp.renderPagination(this._expiredPage, list.length, this._perPage)}
      </div>
    `;
  },

  _renderExpiringTable: function (list) {
    if (list.length === 0) return this._renderEmptyState('Không có hội viên sắp hết hạn');

    const sorted = [...list].sort((a, b) => a.daysLeft - b.daysLeft);
    const start = (this._expiringPage - 1) * this._perPage;
    const paginated = sorted.slice(start, start + this._perPage);

    const rows = paginated.map(m => {
      const urgency = m.daysLeft <= 3 ? 'text-error' : m.daysLeft <= 7 ? 'text-[#e65100]' : 'text-[#f59e0b]';
      const urgencyBg = m.daysLeft <= 3 ? 'bg-error/10' : m.daysLeft <= 7 ? 'bg-[#e65100]/10' : 'bg-[#f59e0b]/10';

      return `
        <tr class="group hover:bg-brand-primary/5 transition-colors border-b border-outline-variant/30">
          <td class="px-standard py-3">
            <div class="flex items-center gap-standard">
              ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'lg', 'width:48px;height:48px;border-radius:16px;')}
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-xs">
                  <p class="font-black text-on-surface text-body-md truncate">${m.ho_ten}</p>
                </div>
                <p class="text-on-surface-variant text-body-sm font-bold opacity-60">${m.so_dien_thoai || '—'}</p>
              </div>
            </div>
          </td>
          <td class="px-standard py-3">
            <span class="text-on-surface-variant text-body-sm font-mono font-black bg-surface-container px-2.5 py-1 rounded-xl border border-outline-variant/30">${m.ma_ho_so}</span>
          </td>
          <td class="px-standard py-3">
            <div class="flex flex-col gap-1">
              <div class="inline-flex items-center px-2 py-0.5 rounded-lg bg-surface-container text-on-surface text-body-sm font-black border border-outline-variant/50 w-fit">
                ${m.ten_goi_tap || 'N/A'}
              </div>
              <div class="flex items-center gap-2">
                <span class="text-on-surface-variant text-body-sm font-bold opacity-50 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">event</span>
                  ${window.GymApp.formatDate(m.ngay_het_han)}
                </span>
                <span class="${urgency} ${urgencyBg} text-label-xs font-black px-2 py-0.5 rounded-full border border-current/20 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[12px]">schedule</span>
                  ${m.daysLeft} ngày
                </span>
              </div>
            </div>
          </td>
          <td class="px-standard py-3 text-center">
            <div class="flex justify-center items-center gap-compact">
              <button class="notify-btn w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-brand-primary hover:text-white transition-all shadow-sm active:scale-95" data-id="${m.id}" title="Gửi nhắc nhở">
                <span class="material-symbols-outlined text-[20px]">notifications_active</span>
              </button>
              <button class="renew-btn w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-brand-primary hover:text-white transition-all shadow-sm active:scale-95" data-id="${m.id}" title="Lập phiếu gia hạn">
                <span class="material-symbols-outlined text-[20px]">history_edu</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low/30 border-b border-outline-variant/50">
                <th class="px-standard py-4 font-black text-label-bold text-on-surface-variant uppercase tracking-widest opacity-60">Hội viên</th>
                <th class="px-standard py-4 font-black text-label-bold text-on-surface-variant uppercase tracking-widest opacity-60">Mã HV</th>
                <th class="px-standard py-4 font-black text-label-bold text-on-surface-variant uppercase tracking-widest opacity-60">Gói tập</th>
                <th class="px-standard py-4 font-black text-label-bold text-on-surface-variant uppercase tracking-widest opacity-60 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${window.GymApp.renderPagination(this._expiringPage, list.length, this._perPage)}
      </div>
    `;
  },

  _renderEmptyState: function (msg) {
    return `
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 shadow-sm">
        <div class="w-16 h-16 rounded-full bg-brand-primary/5 flex items-center justify-center mb-compact">
          <span class="material-symbols-outlined text-4xl text-brand-primary/20">verified_user</span>
        </div>
        <h3 class="text-body-md font-black text-on-surface mb-xs">${msg}</h3>
        <p class="text-[12px] text-on-surface-variant opacity-60">Mọi thứ hiện tại đã ổn định!</p>
      </div>`;
  },

  init: function () {
    const self = this;
    this._expiredPage = 1;
    this._expiringPage = 1;
    this._requestsPage = 1;

    // Load data after DOM is ready
    setTimeout(() => self._loadData(), 50);

    document.getElementById('expired-search')?.addEventListener('input', (e) => {
      self._searchQuery = e.target.value;
      self._expiredPage = 1;
      self._expiringPage = 1;
      self._requestsPage = 1;
      self._refreshView();
    });

    document.getElementById('btn-refresh-expired')?.addEventListener('click', () => self._loadData());

    window.GymApp._pgHandler = function (pg) {
      if (self._tab === 'expired') {
        self._expiredPage = pg;
      } else if (self._tab === 'expiring') {
        self._expiringPage = pg;
      } else {
        self._requestsPage = pg;
      }
      self._refreshView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    document.getElementById('tab-expired-list')?.addEventListener('click', () => {
      self._tab = 'expired';
      self._updateTabStyles();
      self._refreshView();
    });

    document.getElementById('tab-expiring-list')?.addEventListener('click', () => {
      self._tab = 'expiring';
      self._updateTabStyles();
      self._refreshView();
    });

    document.getElementById('tab-requests-list')?.addEventListener('click', () => {
      self._tab = 'requests';
      self._updateTabStyles();
      self._refreshView();
    });
  },

  _updateTabStyles: function () {
    const tabs = ['expired', 'expiring', 'requests'];
    tabs.forEach(t => {
      const btn = document.getElementById(`tab-${t}-list`);
      if (!btn) return;
      const isActive = this._tab === t;
      btn.className = isActive
        ? 'px-4 py-2 rounded-xl font-bold text-sm bg-brand-primary text-white shadow-sm transition-all duration-300 flex items-center gap-xs whitespace-nowrap border border-brand-primary/20'
        : 'px-4 py-2 rounded-xl font-bold text-sm text-on-surface-variant hover:text-brand-primary hover:bg-brand-primary/5 transition-all duration-300 flex items-center gap-xs whitespace-nowrap border border-transparent';
    });
  },

  _renderRequestsTable: function (list) {
    if (list.length === 0) return this._renderEmptyState('Không có yêu cầu gia hạn nào');

    const start = (this._requestsPage - 1) * this._perPage;
    const paginated = list.slice(start, start + this._perPage);

    const rows = paginated.map(req => `
      <tr class="group hover:bg-brand-primary/5 transition-colors border-b border-outline-variant/30">
        <td class="px-standard py-3">
          <div class="flex items-center gap-standard">
            ${window.GymApp.avatarImg(null, req.ho_ten, 'lg', 'width:48px;height:48px;border-radius:16px;')}
            <div class="flex flex-col min-w-0">
              <p class="font-black text-on-surface text-body-md truncate">${req.ho_ten}</p>
              <div class="flex items-center gap-xs">
                <p class="text-on-surface-variant text-body-sm font-mono font-black opacity-60">${req.ma_ho_so}</p>
                ${req.chi_nhanh_mua ? `
                  <span class="flex items-center gap-[2px] bg-surface-container text-on-surface-variant text-label-xs px-1.5 py-0.5 rounded-lg font-black border border-outline-variant/30" title="Chi nhánh đăng ký mua">
                    <span class="material-symbols-outlined text-[12px]">store</span>
                    ${req.chi_nhanh_mua}
                  </span>` : ''}
              </div>
            </div>
          </div>
        </td>
        <td class="px-standard py-3">
          <div class="flex flex-col gap-1">
            <div class="inline-flex items-center px-2 py-0.5 rounded-lg bg-brand-primary/10 text-brand-primary text-body-sm font-black border border-brand-primary/20 w-fit">
              ${req.ten_goi_tap}
            </div>
            <div class="flex items-center gap-1 text-on-surface-variant text-body-sm font-bold opacity-50">
              <span class="material-symbols-outlined text-[14px]">calendar_today</span>
              Từ: ${window.GymApp.formatDate(req.tu_ngay)}
            </div>
          </div>
        </td>
        <td class="px-standard py-3">
          <div class="flex flex-col gap-1">
             <div class="flex items-center gap-1.5">
               <span class="text-brand-primary font-black text-body-lg">${Number(req.gia_thuc_te).toLocaleString('vi-VN')}</span>
               <span class="text-brand-primary/60 text-label-xs font-black uppercase">VND</span>
             </div>
             <div class="flex items-center gap-1 text-on-surface-variant text-body-sm font-bold opacity-50">
               <span class="material-symbols-outlined text-[14px]">event_repeat</span>
               Hạn: ${window.GymApp.formatDate(req.den_ngay)}
             </div>
             <div class="mt-1">
               ${req.phuong_thuc_tt === 'chuyen_khoan' ? (
                 req.payos_status === 'PAID' ? `
                   <span style="background: rgba(29, 147, 54, 0.1); color: #1D9336; border: 1px solid rgba(29, 147, 54, 0.2);" class="inline-flex items-center gap-[4px] text-label-xs px-2 py-0.5 rounded-lg font-black animate-pulse shadow-sm">
                     <span class="material-symbols-outlined text-[12px] font-black">check_circle</span>
                     Đã thanh toán (PayOS)
                   </span>` : `
                   <span style="background: rgba(230, 81, 0, 0.1); color: #e65100; border: 1px solid rgba(230, 81, 0, 0.2);" class="inline-flex items-center gap-[4px] text-label-xs px-2 py-0.5 rounded-lg font-black">
                     <span class="material-symbols-outlined text-[12px]">hourglass_empty</span>
                     Chờ thanh toán (PayOS)
                   </span>`
               ) : `
                 <span style="background: rgba(107, 114, 128, 0.1); color: rgb(107, 114, 128); border: 1px solid rgba(107, 114, 128, 0.2);" class="inline-flex items-center gap-[4px] text-label-xs px-2 py-0.5 rounded-lg font-black">
                   <span class="material-symbols-outlined text-[12px]">payments</span>
                   Tiền mặt
                 </span>`}
             </div>
          </div>
        </td>
        <td class="px-standard py-3 text-center">
          <div class="flex justify-center items-center gap-compact">
            <button class="request-reject-btn w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low text-error hover:bg-error hover:text-white transition-all shadow-sm active:scale-95" data-id="${req.id}" title="Từ chối">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
            <button class="request-approve-btn h-9 px-loose flex items-center justify-center rounded-xl bg-brand-primary text-white hover:shadow-lg hover:shadow-brand-primary/20 transition-all gap-compact font-black text-body-md active:scale-95" data-id="${req.id}">
              <span class="material-symbols-outlined text-[18px]">check</span>
              DUYỆT
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    return `
      <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-sm overflow-hidden">
        <!-- Desktop Table view -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low/30 border-b border-outline-variant/50">
                <th class="px-standard py-4 font-black text-label-bold text-on-surface-variant uppercase tracking-widest opacity-60">Hội viên</th>
                <th class="px-standard py-4 font-black text-label-bold text-on-surface-variant uppercase tracking-widest opacity-60">Gói tập</th>
                <th class="px-standard py-4 font-black text-label-bold text-on-surface-variant uppercase tracking-widest opacity-60">Thanh toán</th>
                <th class="px-standard py-4 font-black text-label-bold text-on-surface-variant uppercase tracking-widest opacity-60 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>

        <!-- Mobile Cards view -->
        <div class="md:hidden flex flex-col gap-compact p-compact bg-surface-container-low/10">
          ${paginated.map(req => `
            <div class="rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300" data-req-id="${req.id}">
              <div class="px-compact py-compact flex items-center gap-compact border-b border-outline-variant">
                ${window.GymApp.avatarImg(null, req.ho_ten, 'lg', 'width:36px;height:36px;border-radius:12px;')}
                <div class="flex-1 min-w-0">
                  <p class="font-black text-on-surface text-body-sm truncate">${req.ho_ten || '—'}</p>
                  <p class="text-on-surface-variant text-label-xs">${req.ma_ho_so || ''}</p>
                </div>
                ${req.phuong_thuc_tt === 'chuyen_khoan' ? (
                  req.payos_status === 'PAID' ? `
                    <span style="background: rgba(29, 147, 54, 0.1); color: #1D9336; border: 1px solid rgba(29, 147, 54, 0.2);" class="text-label-xs px-2 py-0.5 rounded-full font-black border animate-pulse shadow-sm flex items-center gap-1">
                      <span class="material-symbols-outlined text-[12px] font-black">check_circle</span>
                      Đã thanh toán (PayOS)
                    </span>` : `
                    <span style="background: rgba(230, 81, 0, 0.1); color: #e65100; border: 1px solid rgba(230, 81, 0, 0.2);" class="text-label-xs px-2 py-0.5 rounded-full font-black border flex items-center gap-1">
                      <span class="material-symbols-outlined text-[12px]">hourglass_empty</span>
                      Chờ thanh toán (PayOS)
                    </span>`
                ) : `
                  <span class="text-label-xs px-2 py-0.5 rounded-full font-black bg-warning-container text-warning border border-warning/20">Chờ duyệt</span>`}
              </div>
              <div class="p-compact grid grid-cols-2 gap-xs text-body-sm">
                <div>
                  <p class="text-on-surface-variant opacity-60 font-bold">Gói tập</p>
                  <p class="font-black text-brand-primary truncate">${req.ten_goi_tap || '—'}</p>
                </div>
                <div>
                  <p class="text-on-surface-variant opacity-60 font-bold">Chi nhánh mua</p>
                  <p class="font-bold text-on-surface truncate">${req.chi_nhanh_mua || '—'}</p>
                </div>
                <div>
                  <p class="text-on-surface-variant opacity-60 font-bold">Từ ngày</p>
                  <p class="font-bold text-on-surface">${req.tu_ngay ? window.GymApp.formatDate(req.tu_ngay) : '—'}</p>
                </div>
                <div>
                  <p class="text-on-surface-variant opacity-60 font-bold">Hạn dùng</p>
                  <p class="font-bold text-on-surface">${req.den_ngay ? window.GymApp.formatDate(req.den_ngay) : '—'}</p>
                </div>
                <div>
                  <p class="text-on-surface-variant opacity-60 font-bold">Số tiền</p>
                  <p class="font-black text-brand-primary">${req.gia_thuc_te ? Number(req.gia_thuc_te).toLocaleString('vi-VN') + 'đ' : '—'}</p>
                </div>
                <div>
                  <p class="text-on-surface-variant opacity-60 font-bold">Hình thức</p>
                  <p class="font-bold text-on-surface">${req.phuong_thuc_tt === 'chuyen_khoan' ? 'Chuyển khoản' : 'Tiền mặt'}</p>
                </div>
              </div>
              <div class="px-compact pb-compact flex gap-compact border-t border-outline-variant/10 pt-compact mt-xs">
                <button class="request-reject-btn flex-1 py-1.5 rounded-lg font-bold border border-outline-variant text-error hover:bg-error hover:text-white transition-all text-body-sm active:scale-95 flex items-center justify-center gap-xs"
                  data-id="${req.id}">
                  <span class="material-symbols-outlined text-sm">close</span> Từ chối
                </button>
                <button class="request-approve-btn flex-[1.5] py-1.5 rounded-lg font-black text-white transition-all text-body-sm active:scale-95 flex items-center justify-center gap-xs"
                  style="background:#1D9336" data-id="${req.id}">
                  <span class="material-symbols-outlined text-sm">check</span> Duyệt
                </button>
              </div>
            </div>
          `).join('')}
        </div>

        ${window.GymApp.renderPagination(this._requestsPage, list.length, this._perPage)}
      </div>
    `;
  },

  _bindTableEvents: function () {
    const self = this;

    // Notify
    document.querySelectorAll('.notify-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const list = self._tab === 'expired' ? self._expiredList : self._expiringList;
        const member = list.find(m => m.id == id);
        if (member) self._handleNotify(member);
      });
    });

    // Renew
    document.querySelectorAll('.renew-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const list = self._tab === 'expired' ? self._expiredList : self._expiringList;
        const member = list.find(m => m.id == id);
        if (member) self._handleRenew(member);
      });
    });

    // Call
    document.querySelectorAll('.call-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const phone = btn.dataset.phone;
        if (phone && phone !== '—') {
          window.location.href = `tel:${phone}`;
        } else {
          window.GymApp.toast('Không có số điện thoại!', 'error');
        }
      });
    });

    // Request Reject
    document.querySelectorAll('.request-reject-btn').forEach(btn => {
      btn.addEventListener('click', () => self._handleRequestAction(btn.dataset.id, 'reject'));
    });

    // Request Approve
    document.querySelectorAll('.request-approve-btn').forEach(btn => {
      btn.addEventListener('click', () => self._handleRequestAction(btn.dataset.id, 'approve'));
    });
  },

  _handleRequestAction: async function (id, action) {
    const self = this;
    const req = this._requestsList.find(r => r.id == id);
    if (!req) return;

    if (action === 'reject') {
      const confirm = await window.GymApp.confirm(`Bạn có chắc muốn từ chối yêu cầu gia hạn của <strong>${req.ho_ten}</strong>?`, 'Cảnh báo');
      if (!confirm) return;

      try {
        const res = await window.GymApp.api.put(`/members/package-requests/${id}/approve`, { action: 'reject' });
        if (res?.success) {
          window.GymApp.toast('Đã từ chối yêu cầu.', 'info');
          self._loadData();
        }
      } catch (e) { window.GymApp.toast('Lỗi hệ thống.', 'error'); }
      return;
    }

    // Approve logic with modal
    const modalHtml = `
      <div id="modal-approve-renewal" class="fixed inset-0 z-[100] flex items-center justify-center p-standard bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div class="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-outline-variant">
          <!-- Header -->
          <div class="px-standard py-standard bg-brand-primary text-white flex items-center gap-standard">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
              <span class="material-symbols-outlined text-2xl">task_alt</span>
            </div>
            <div>
              <h3 class="text-body-lg font-black tracking-tight">Xác nhận duyệt gia hạn</h3>
              <p class="text-body-xs opacity-90 font-bold">Hội viên: ${req.ho_ten}</p>
            </div>
          </div>
          
          <!-- Content -->
          <div class="p-standard space-y-standard">
            <!-- Info Box -->
            <div class="bg-surface-container-low p-compact rounded-xl border border-outline-variant/30 space-y-xs text-body-xs">
               <div class="flex justify-between items-center">
                  <span class="text-outline font-bold">Gói tập yêu cầu:</span>
                  <span class="font-black text-brand-primary">${req.ten_goi_tap}</span>
               </div>
               ${req.chi_nhanh_mua ? `
               <div class="flex justify-between items-center border-t border-outline-variant/10 pt-xs mt-xs">
                  <span class="text-outline font-bold">Chi nhánh mua:</span>
                  <span class="font-bold text-on-surface">${req.chi_nhanh_mua}</span>
               </div>` : ''}
               <div class="flex justify-between items-center border-t border-outline-variant/10 pt-xs mt-xs">
                  <span class="text-outline font-bold">Thời gian gia hạn:</span>
                  <span class="font-bold text-on-surface">${window.GymApp.formatDate(req.tu_ngay)} - ${window.GymApp.formatDate(req.den_ngay)}</span>
               </div>
            </div>
            
            <!-- Inputs -->
            <div class="space-y-compact">
              <div>
                <label class="block text-body-xs font-bold text-on-surface-variant mb-xs ml-0.5">Số tiền thực thu (VNĐ)</label>
                <div class="relative">
                  <input type="text" inputmode="numeric" id="approve-price" value="${new Intl.NumberFormat('vi-VN').format(req.gia_thuc_te || 0)}" class="w-full bg-surface-container-lowest border border-outline-variant pl-standard pr-12 py-2 rounded-xl outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 text-body-sm font-black transition-all" />
                  <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline text-label-xs font-black opacity-50">VNĐ</span>
                </div>
              </div>
              
              <div>
                <label class="block text-body-xs font-bold text-on-surface-variant mb-xs ml-0.5">Phương thức thanh toán</label>
                <select id="approve-method" class="w-full bg-surface-container-lowest border border-outline-variant px-standard py-2 rounded-xl outline-none focus:border-brand-primary transition-all text-body-sm font-bold">
                  <option value="tien_mat" ${req.phuong_thuc_tt === 'tien_mat' ? 'selected' : ''}>Tiền mặt</option>
                  <option value="chuyen_khoan" ${req.phuong_thuc_tt === 'chuyen_khoan' ? 'selected' : ''}>Chuyển khoản</option>
                </select>
              </div>
              
              <div>
                <label class="block text-body-xs font-bold text-on-surface-variant mb-xs ml-0.5">Ghi chú giao dịch</label>
                <input type="text" id="approve-note" value="${req.payos_status === 'PAID' ? 'Đã thanh toán qua PayOS (Order: ' + req.payos_order_code + ')' : ''}" placeholder="Ví dụ: Đã nhận tiền qua chuyển khoản..." class="w-full bg-surface-container-lowest border border-outline-variant px-standard py-2 rounded-xl outline-none focus:border-brand-primary transition-all text-body-sm font-medium" />
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="px-standard py-standard bg-surface-container-low flex gap-compact border-t border-outline-variant/30">
            <button id="btn-approve-cancel" class="flex-1 py-2 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container-high transition-all text-body-sm">Hủy bỏ</button>
            <button id="btn-approve-submit" class="flex-[2] py-2 rounded-xl font-black bg-brand-primary text-white shadow-md active:scale-95 hover:bg-[#187a2d] transition-all text-body-sm">DUYỆT GIA HẠN</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Format VNĐ helper — dùng cho field Số tiền thực thu
    const _fmtVND = n => n > 0 ? new Intl.NumberFormat('vi-VN').format(n) : '0';
    const _parseVND = s => parseInt((s || '').replace(/\./g, '').replace(/,/g, '')) || 0;

    const priceEl = document.getElementById('approve-price');
    priceEl?.addEventListener('focus', function () {
      const raw = _parseVND(this.value);
      this.value = raw > 0 ? String(raw) : '';
    });
    priceEl?.addEventListener('blur', function () {
      const raw = _parseVND(this.value);
      this.value = raw > 0 ? _fmtVND(raw) : '0';
    });

    document.getElementById('btn-approve-cancel').onclick = () => document.getElementById('modal-approve-renewal').remove();
    document.getElementById('btn-approve-submit').onclick = async () => {
      const data = {
        action: 'approve',
        gia_thuc_te: _parseVND(document.getElementById('approve-price').value),
        phuong_thuc_tt: document.getElementById('approve-method').value,
        ghi_chu_tt: document.getElementById('approve-note').value
      };
      const btn = document.getElementById('btn-approve-submit');
      btn.disabled = true; btn.textContent = 'Đang xử lý...';
      try {
        const res = await window.GymApp.api.put(`/members/package-requests/${id}/approve`, data);
        if (res?.success) {
          // Nếu gói đã được kích hoạt tự động qua PayOS, hiển thị thông báo phù hợp
          const msg = res?.data?.auto_activated
            ? 'Gói tập đã được kích hoạt tự động sau khi hội viên thanh toán PayOS. Không cần duyệt thêm!'
            : 'Kích hoạt gói tập thành công!';
          window.GymApp.toast(msg, 'success');
          document.getElementById('modal-approve-renewal').remove();
          self._loadData();
          if (window.GymApp.fetchInitialData) await window.GymApp.fetchInitialData();
        } else {
          window.GymApp.toast(res?.message || 'Lỗi khi duyệt.', 'error');
        }
      } catch (e) {
        window.GymApp.toast('Lỗi kết nối.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'DUYỆT GIA HẠN';
      }
    };
  },

  _handleNotify: async function (member) {
    const isExpired = this._tab === 'expired';
    const title = isExpired ? 'Gói tập đã hết hạn' : 'Gói tập sắp hết hạn';
    const content = isExpired
      ? `Chào ${member.ho_ten}, gói tập của bạn đã hết hạn ngày ${window.GymApp.formatDate(member.ngay_het_han)}. Hãy gia hạn ngay nhé!`
      : `Chào ${member.ho_ten}, gói tập của bạn sẽ hết hạn vào ngày ${window.GymApp.formatDate(member.ngay_het_han)}. Gia hạn sớm để nhận ưu đãi nhé!`;

    const confirm = await window.GymApp.confirm(`Gửi thông báo nhắc nhở cho <strong>${member.ho_ten}</strong>?`, 'Xác nhận gửi');
    if (!confirm) return;

    try {
      const res = await window.GymApp.api.post(`/members/${member.id}/notify`, {
        tieu_de: title,
        noi_dung: content,
        loai: 'nhac_nho_gia_han'
      });
      if (res?.success) {
        window.GymApp.toast(`Đã gửi thông báo cho ${member.ho_ten}!`, 'success');
      } else {
        window.GymApp.toast(res?.message || 'Lỗi gửi tin', 'error');
      }
    } catch (err) {
      window.GymApp.toast('Lỗi kết nối!', 'error');
    }
  },

  _handleRenew: function (member) {
    const self = this;
    const membersListPage = window.GymApp.pages['members-list'];
    if (membersListPage && membersListPage._showAddPackageModal) {
      membersListPage._showAddPackageModal(member, async () => {
        window.GymApp.toast('Đã gia hạn thành công!', 'success');
        self._loadData();
        if (window.GymApp.fetchInitialData) await window.GymApp.fetchInitialData();
      });
    } else {
      window.GymApp.toast('Module gia hạn chưa sẵn sàng!', 'warning');
    }
  },

  guideHtml: `
    <div class="space-y-4 text-xs">
      <div class="flex items-start gap-2 bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/10">
        <span class="material-symbols-outlined text-brand-primary text-base flex-shrink-0 mt-0.5">info</span>
        <p class="text-on-surface-variant leading-relaxed">Trang <strong>Hết hạn / Sắp hết hạn</strong> giúp quản lý danh sách các khách hàng đã kết thúc gói tập hoặc sắp đến ngày hết hạn để nhân viên kịp thời chăm sóc và gia hạn.</p>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">Các tab chức năng:</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li><strong>Hết hạn:</strong> Danh sách hội viên đã quá ngày kết thúc gói tập (hiện tại không thể quét mã vào tập).</li>
          <li><strong>Sắp hết:</strong> Danh sách hội viên có gói tập sẽ hết hạn trong vòng 7 ngày tới.</li>
          <li><strong>Yêu cầu:</strong> Danh sách yêu cầu gia hạn gói tập do hội viên gửi trực tiếp từ ứng dụng điện thoại (App).</li>
        </ul>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">Thao tác xử lý:</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li><strong>Gửi nhắc nhở:</strong> Bấm biểu tượng Chuông báo để gửi thông báo đẩy (push notification) nhắc nhở hội viên gia hạn qua App.</li>
          <li><strong>Lập phiếu gia hạn:</strong> Bấm biểu tượng Tờ giấy để mở nhanh hộp thoại đăng ký gói tập mới cho hội viên.</li>
          <li><strong>Duyệt yêu cầu:</strong> Tại tab Yêu cầu, bấm <strong>Duyệt</strong> để xác nhận thu tiền và kích hoạt gói mới cho hội viên, hoặc bấm <strong>Từ chối</strong> nếu có sai sót.</li>
        </ul>
      </div>
    </div>
  `
};