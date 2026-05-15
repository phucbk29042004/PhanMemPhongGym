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
          <div class="flex items-center gap-1 bg-surface-container p-1 rounded-2xl border border-outline-variant w-fit shadow-sm overflow-x-auto max-w-full">
            <button id="tab-expired-list" class="px-loose py-2.5 rounded-xl font-bold text-body-sm bg-brand-primary text-white shadow-lg shadow-brand-primary/20 transition-all duration-300 flex items-center gap-xs whitespace-nowrap">
              <span class="material-symbols-outlined text-[18px]">cancel</span>
              <span id="tab-expired-count">Hết hạn (0)</span>
            </button>
            <button id="tab-expiring-list" class="px-loose py-2.5 rounded-xl font-bold text-body-sm text-on-surface-variant hover:text-brand-primary transition-all duration-300 flex items-center gap-xs whitespace-nowrap">
              <span class="material-symbols-outlined text-[18px]">warning_amber</span>
              <span id="tab-expiring-count">Sắp hết (0)</span>
            </button>
            <button id="tab-requests-list" class="px-loose py-2.5 rounded-xl font-bold text-body-sm text-on-surface-variant hover:text-brand-primary transition-all duration-300 flex items-center gap-xs whitespace-nowrap relative">
              <span class="material-symbols-outlined text-[18px]">history_edu</span>
              <span id="tab-requests-count">Yêu cầu (0)</span>
              <div id="requests-badge" class="hidden absolute -top-1 -right-1 w-4 h-4 bg-error text-white text-[10px] rounded-full flex items-center justify-center font-black border-2 border-surface-container-lowest"></div>
            </button>
          </div>

          <div class="flex items-center gap-compact bg-surface-container-low/50 backdrop-blur-md p-2 rounded-2xl border border-outline-variant shadow-sm flex-1 max-w-md">
            <div class="relative flex-1 group">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors text-[20px]">search</span>
              <input id="expired-search" type="text" placeholder="Tìm tên, SĐT..." class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-10 pr-4 py-2 rounded-xl focus:border-brand-primary outline-none transition-all text-body-sm font-medium" value="${this._searchQuery}">
            </div>
            <button id="btn-refresh-expired" class="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-brand-primary transition-all shadow-sm">
              <span class="material-symbols-outlined text-[20px]">refresh</span>
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

    try {
      const [expiredRes, expiringRes, requestsRes] = await Promise.all([
        window.GymApp.api.get('/members/expired'),
        window.GymApp.api.get('/members/expiring?days=30'),
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
    }
  },

  _refreshView: function() {
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
      <div class="bg-surface-container-lowest p-loose rounded-[28px] border ${s.border} shadow-sm flex items-center gap-loose transition-all hover:-translate-y-1 hover:shadow-lg group">
        <div class="w-[60px] h-[60px] rounded-2xl ${s.bg} flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
          <span class="material-symbols-outlined ${s.color} text-[32px]" style="font-variation-settings:'FILL' 1">${s.icon}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-on-surface-variant text-[12px] uppercase tracking-widest font-black opacity-50">${s.label}</span>
          <span class="${s.color} text-headline-lg font-black tracking-tighter leading-none mt-1">${s.value}</span>
        </div>
      </div>
    `).join('');
  },

  _renderExpiredTable: function (list) {
    if (list.length === 0) return this._renderEmptyState('Không có hội viên hết hạn');
    
    const start = (this._expiredPage - 1) * this._perPage;
    const paginated = list.slice(start, start + this._perPage);

    const rows = paginated.map(m => `
      <tr class="group hover:bg-surface-container-low transition-colors border-b border-outline-variant/30">
        <td class="px-standard py-3">
          <div class="flex items-center gap-standard">
            ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'lg', 'width:48px;height:48px;border-radius:16px;')}
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-xs">
                <p class="font-black text-on-surface text-body-md truncate">${m.ho_ten}</p>
                ${m.co_yeu_cau_gia_han ? `
                  <span class="flex items-center gap-[2px] bg-warning-container text-warning text-[9px] px-1.5 py-0.5 rounded-lg font-black animate-pulse" title="Có yêu cầu gia hạn từ App">
                    <span class="material-symbols-outlined text-[12px]">app_registration</span>
                    APP
                  </span>` : ''}
              </div>
              <p class="text-on-surface-variant text-body-sm font-bold opacity-60">${m.so_dien_thoai || '—'}</p>
            </div>
          </div>
        </td>
        <td class="px-standard py-3">
          <span class="text-on-surface-variant text-[11px] font-mono font-black bg-surface-container px-2.5 py-1 rounded-xl border border-outline-variant/30">${m.ma_ho_so}</span>
        </td>
        <td class="px-standard py-3">
          <div class="flex flex-col">
            <span class="text-on-surface font-black text-body-sm truncate max-w-[180px]">${m.ten_goi_tap || 'N/A'}</span>
            <span class="text-error text-[11px] font-black mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">event_busy</span>
              Hết hạn: ${window.GymApp.formatDate(m.ngay_het_han)}
            </span>
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
            <button class="call-btn w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-brand-primary hover:text-white transition-all shadow-sm active:scale-95" data-phone="${m.so_dien_thoai}" title="Gọi điện">
              <span class="material-symbols-outlined text-[20px]">call</span>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    return `
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low/30 border-b border-outline-variant/50">
                <th class="px-standard py-4 font-black text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60">Hội viên</th>
                <th class="px-standard py-4 font-black text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60">Mã HV</th>
                <th class="px-standard py-4 font-black text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60">Gói tập</th>
                <th class="px-standard py-4 font-black text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60 text-center">Thao tác</th>
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
        <tr class="group hover:bg-surface-container-low transition-colors border-b border-outline-variant/30">
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
            <span class="text-on-surface-variant text-[11px] font-mono font-black bg-surface-container px-2.5 py-1 rounded-xl border border-outline-variant/30">${m.ma_ho_so}</span>
          </td>
          <td class="px-standard py-3">
            <div class="flex flex-col">
              <span class="text-on-surface font-black text-body-sm truncate max-w-[180px]">${m.ten_goi_tap || 'N/A'}</span>
              <div class="flex items-center gap-xs mt-1">
                 <span class="text-on-surface-variant text-[11px] font-bold opacity-50">Hạn: ${window.GymApp.formatDate(m.ngay_het_han)}</span>
                 <span class="${urgency} ${urgencyBg} text-[9px] font-black px-1.5 py-0.5 rounded-lg border border-current/20">Còn ${m.daysLeft} ngày</span>
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
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low/30 border-b border-outline-variant/50">
                <th class="px-standard py-4 font-black text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60">Hội viên</th>
                <th class="px-standard py-4 font-black text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60">Mã HV</th>
                <th class="px-standard py-4 font-black text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60">Gói tập</th>
                <th class="px-standard py-4 font-black text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60 text-center">Thao tác</th>
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

    // Load data after DOM is ready
    setTimeout(() => self._loadData(), 50);

    document.getElementById('expired-search')?.addEventListener('input', (e) => {
      self._searchQuery = e.target.value;
      self._expiredPage = 1;
      self._expiringPage = 1;
      self._refreshView();
    });

    document.getElementById('btn-refresh-expired')?.addEventListener('click', () => self._loadData());

    window.GymApp._pgHandler = function (pg) {
      if (self._tab === 'expired') {
        self._expiredPage = pg;
      } else {
        self._expiringPage = pg;
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

  _updateTabStyles: function() {
    const tabs = ['expired', 'expiring', 'requests'];
    tabs.forEach(t => {
      const btn = document.getElementById(`tab-${t}-list`);
      if (!btn) return;
      const isActive = this._tab === t;
      btn.className = isActive 
        ? 'px-loose py-2.5 rounded-xl font-bold text-body-sm bg-brand-primary text-white shadow-lg shadow-brand-primary/20 transition-all duration-300 flex items-center gap-xs whitespace-nowrap'
        : 'px-loose py-2.5 rounded-xl font-bold text-body-sm text-on-surface-variant hover:text-brand-primary transition-all duration-300 flex items-center gap-xs whitespace-nowrap';
    });
  },

  _renderRequestsTable: function (list) {
    if (list.length === 0) return this._renderEmptyState('Không có yêu cầu gia hạn nào');
    
    const start = (this._requestsPage - 1) * this._perPage;
    const paginated = list.slice(start, start + this._perPage);

    const rows = paginated.map(req => `
      <tr class="group hover:bg-surface-container-low transition-colors border-b border-outline-variant/30">
        <td class="px-standard py-3">
          <div class="flex items-center gap-standard">
            ${window.GymApp.avatarImg(null, req.ho_ten, 'lg', 'width:48px;height:48px;border-radius:16px;')}
            <div class="flex flex-col min-w-0">
              <p class="font-black text-on-surface text-body-md truncate">${req.ho_ten}</p>
              <p class="text-on-surface-variant text-[11px] font-mono font-black opacity-60">${req.ma_ho_so}</p>
            </div>
          </div>
        </td>
        <td class="px-standard py-3">
          <div class="flex flex-col">
            <span class="text-on-surface font-black text-body-sm">${req.ten_goi_tap}</span>
            <span class="text-on-surface-variant text-[11px] font-bold opacity-50">Từ: ${window.GymApp.formatDate(req.tu_ngay)}</span>
          </div>
        </td>
        <td class="px-standard py-3">
          <div class="flex flex-col">
             <span class="text-brand-primary font-black text-body-md">${Number(req.gia_thuc_te).toLocaleString('vi-VN')}đ</span>
             <span class="text-on-surface-variant text-[11px] font-bold opacity-50">Hạn: ${window.GymApp.formatDate(req.den_ngay)}</span>
          </div>
        </td>
        <td class="px-standard py-3 text-center">
          <div class="flex justify-center items-center gap-compact">
            <button class="request-reject-btn w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low text-error hover:bg-error hover:text-white transition-all shadow-sm active:scale-95" data-id="${req.id}" title="Từ chối">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
            <button class="request-approve-btn h-9 px-loose flex items-center justify-center rounded-xl bg-brand-primary text-white hover:shadow-lg hover:shadow-brand-primary/20 transition-all gap-compact font-black text-body-xs active:scale-95" data-id="${req.id}">
              <span class="material-symbols-outlined text-[18px]">check</span>
              DUYỆT
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    return `
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low/30 border-b border-outline-variant/50">
                <th class="px-standard py-4 font-black text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60">Hội viên</th>
                <th class="px-standard py-4 font-black text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60">Gói tập</th>
                <th class="px-standard py-4 font-black text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60">Thanh toán</th>
                <th class="px-standard py-4 font-black text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
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
        <div class="bg-surface-container-lowest w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-outline-variant">
          <div class="px-loose py-loose bg-brand-primary text-white flex items-center gap-standard">
            <div class="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <span class="material-symbols-outlined text-3xl">task_alt</span>
            </div>
            <div>
              <h3 class="text-headline-sm font-black tracking-tight">Xác nhận duyệt</h3>
              <p class="text-body-sm opacity-80 font-medium mt-0.5">Hội viên: ${req.ho_ten}</p>
            </div>
          </div>
          <div class="p-loose space-y-standard">
            <div class="bg-surface-container-low p-standard rounded-2xl border border-outline-variant/30 space-y-compact">
               <div class="flex justify-between items-center">
                  <span class="text-label-sm text-outline font-bold">Gói tập</span>
                  <span class="text-body-sm font-black text-brand-primary">${req.ten_goi_tap}</span>
               </div>
               <div class="flex justify-between items-center">
                  <span class="text-label-sm text-outline font-bold">Thời gian</span>
                  <span class="text-body-sm font-bold text-on-surface">${window.GymApp.formatDate(req.tu_ngay)} - ${window.GymApp.formatDate(req.den_ngay)}</span>
               </div>
            </div>
            <div>
              <label class="block text-label-sm text-on-surface-variant font-black mb-compact ml-1 uppercase tracking-widest opacity-70">Số tiền thực thu (VNĐ)</label>
              <input type="number" id="approve-price" value="${req.gia_thuc_te}" class="w-full bg-surface-container-low border border-outline-variant px-loose py-4 rounded-2xl outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 text-headline-sm font-black transition-all" />
            </div>
            <div>
              <label class="block text-label-sm text-on-surface-variant font-black mb-compact ml-1 uppercase tracking-widest opacity-70">Phương thức thanh toán</label>
              <select id="approve-method" class="w-full bg-surface-container-low border border-outline-variant px-loose py-3 rounded-2xl outline-none focus:border-brand-primary transition-all font-bold">
                <option value="tien_mat">Tiền mặt</option>
                <option value="chuyen_khoan">Chuyển khoản</option>
                <option value="the">Quẹt thẻ</option>
              </select>
            </div>
            <div>
              <label class="block text-label-sm text-on-surface-variant font-black mb-compact ml-1 uppercase tracking-widest opacity-70">Ghi chú giao dịch</label>
              <input type="text" id="approve-note" placeholder="VD: Đã nhận tiền qua Vietcombank..." class="w-full bg-surface-container-low border border-outline-variant px-loose py-3 rounded-2xl outline-none focus:border-brand-primary transition-all" />
            </div>
          </div>
          <div class="px-loose py-loose bg-surface-container-low flex gap-standard border-t border-outline-variant/30">
            <button id="btn-approve-cancel" class="flex-1 py-3 rounded-2xl font-bold text-on-surface-variant hover:bg-surface-container-high transition-all">Hủy bỏ</button>
            <button id="btn-approve-submit" class="flex-[2] py-3 rounded-2xl font-black bg-brand-primary text-white shadow-lg shadow-brand-primary/20 active:scale-95 transition-all">HOÀN TẤT DUYỆT</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('btn-approve-cancel').onclick = () => document.getElementById('modal-approve-renewal').remove();
    document.getElementById('btn-approve-submit').onclick = async () => {
      const data = {
        action: 'approve',
        gia_thuc_te: document.getElementById('approve-price').value,
        phuong_thuc_tt: document.getElementById('approve-method').value,
        ghi_chu_tt: document.getElementById('approve-note').value
      };
      const btn = document.getElementById('btn-approve-submit');
      btn.disabled = true; btn.textContent = 'Đang xử lý...';
      try {
        const res = await window.GymApp.api.put(`/members/package-requests/${id}/approve`, data);
        if (res?.success) {
          window.GymApp.toast('Kích hoạt gói thành công!', 'success');
          document.getElementById('modal-approve-renewal').remove();
          self._loadData();
          await window.GymApp.refreshData();
        } else { window.GymApp.toast(res?.message || 'Lỗi khi duyệt.', 'error'); }
      } catch (e) { window.GymApp.toast('Lỗi kết nối.', 'error'); }
      finally { btn.disabled = false; btn.textContent = 'Xác nhận'; }
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
        await window.GymApp.refreshData();
      });
    } else {
      window.GymApp.toast('Module gia hạn chưa sẵn sàng!', 'warning');
    }
  }
};