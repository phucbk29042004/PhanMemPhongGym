window.GymApp.pages['expired'] = {
  _tab: 'expired',
  _expiredPage: 1, _expiringPage: 1, _perPage: 10,
  _expiredList: [], _expiringList: [],

  render: function () {
    this._loadData();

    return `
      <div class="flex flex-col gap-margin">

        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-standard">
          <div class="page-title-bar">
            <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Hết hạn & Sắp hết hạn</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs">Theo dõi và gia hạn gói tập cho hội viên</p>
          </div>
          <button class="btn-primary text-white px-loose py-compact rounded-xl font-bold flex items-center gap-compact">
            <span class="material-symbols-outlined text-sm">send</span>
            Gửi thông báo gia hạn
          </button>
        </div>

        <!-- Stats -->
        <div id="expired-stats" class="grid grid-cols-1 md:grid-cols-3 gap-loose">
          ${this._renderStats(0, 0)}
        </div>

        <!-- Tabs -->
        <div class="flex gap-xs bg-surface-container p-xs rounded-2xl border border-outline-variant w-fit shadow-sm">
          <button id="tab-expired-list" class="px-loose py-compact rounded-xl font-bold text-body-md bg-surface-container-lowest text-brand-primary shadow-sm transition-all">
            <span class="flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">cancel</span>
              <span id="tab-expired-count">Đã hết hạn (0)</span>
            </span>
          </button>
          <button id="tab-expiring-list" class="px-loose py-compact rounded-xl font-bold text-body-md text-on-surface-variant hover:text-brand-primary transition-all">
            <span class="flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">warning_amber</span>
              <span id="tab-expiring-count">Sắp hết hạn (0)</span>
            </span>
          </button>
        </div>

        <!-- Loading -->
        <div id="expired-loading" class="text-center py-margin text-on-surface-variant">
          <span class="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
          <p class="mt-standard text-body-sm">Đang tải dữ liệu...</p>
        </div>

        <!-- Table Đã hết hạn -->
        <div id="panel-expired" class="hidden">
          <div id="expired-table-container"></div>
        </div>

        <!-- Table Sắp hết hạn -->
        <div id="panel-expiring" class="hidden">
          <div id="expiring-table-container"></div>
        </div>

      </div>
    `;
  },

  // 🔧 ĐÃ SỬA: Dùng window.GymApp.api thay vì fetch thủ công
  // BASE_URL đã có sẵn trong api.js = http://localhost:3000/api
  _loadData: function () {
    const self = this;

    Promise.all([
      window.GymApp.api.get('/members/expired'),
      window.GymApp.api.get('/members/expiring?days=7'),
    ]).then(([expiredRes, expiringRes]) => {
      const now = new Date();

      self._expiredList = expiredRes && expiredRes.success ? (expiredRes.data || []) : [];

      self._expiringList = (expiringRes && expiringRes.success ? (expiringRes.data || []) : []).map(m => {
        const diff = m.ngay_het_han
          ? (new Date(m.ngay_het_han) - now) / (1000 * 60 * 60 * 24)
          : 999;
        return { ...m, daysLeft: Math.max(0, Math.ceil(diff)) };
      });

      // Ẩn loading
      const loading = document.getElementById('expired-loading');
      if (loading) loading.classList.add('hidden');

      // Cập nhật stats
      const statsEl = document.getElementById('expired-stats');
      if (statsEl) statsEl.innerHTML = self._renderStats(self._expiredList.length, self._expiringList.length);

      // Cập nhật tab count
      const tabExpired = document.getElementById('tab-expired-count');
      const tabExpiring = document.getElementById('tab-expiring-count');
      if (tabExpired) tabExpired.textContent = `Đã hết hạn (${self._expiredList.length})`;
      if (tabExpiring) tabExpiring.textContent = `Sắp hết hạn (${self._expiringList.length})`;

      // Hiện bảng theo tab hiện tại
      if (self._tab === 'expired') {
        const panel = document.getElementById('panel-expired');
        if (panel) {
          panel.classList.remove('hidden');
          document.getElementById('expired-table-container').innerHTML = self._renderExpiredTable();
        }
      } else {
        const panel = document.getElementById('panel-expiring');
        if (panel) {
          panel.classList.remove('hidden');
          document.getElementById('expiring-table-container').innerHTML = self._renderExpiringTable();
        }
      }

      self._bindRenewBtns();
    }).catch(err => {
      console.error('Lỗi load dữ liệu expired:', err);
      const loading = document.getElementById('expired-loading');
      if (loading) loading.innerHTML = `<p class="text-error text-body-sm">Lỗi tải dữ liệu. Vui lòng thử lại.</p>`;
    });
  },

  _renderStats: function (expiredCount, expiringCount) {
    return [
      { label: 'Đã hết hạn', value: expiredCount, color: 'text-error', icon: 'cancel', iconBg: 'icon-bg-red' },
      { label: 'Sắp hết hạn (30 ngày)', value: expiringCount, color: 'text-[#e65100]', icon: 'warning_amber', iconBg: 'icon-bg-orange' },
      { label: 'Cần liên hệ hôm nay', value: Math.ceil(expiredCount * 0.4), color: 'text-brand-primary', icon: 'phone_in_talk', iconBg: 'icon-bg-green' },
    ].map(s => `
      <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm flex items-center gap-loose">
        <div class="icon-bg ${s.iconBg}" style="width:48px;height:48px;border-radius:14px">
          <span class="material-symbols-outlined ${s.color} text-2xl" style="font-variation-settings:'FILL' 1">${s.icon}</span>
        </div>
        <div>
          <p class="text-on-surface-variant text-body-sm font-bold">${s.label}</p>
          <p class="${s.color} font-display-lg text-display-lg font-bold">${s.value}</p>
        </div>
      </div>
    `).join('');
  },

  _renderExpiredTable: function (list) {
    if (!list) list = this._expiredList;
    if (list.length === 0) return `
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-margin text-center">
        <span class="material-symbols-outlined text-4xl text-outline">event_available</span>
        <p class="text-on-surface-variant text-body-sm mt-standard">Không có hội viên hết hạn</p>
      </div>`;
    const start = (this._expiredPage - 1) * this._perPage;
    const paginated = list.slice(start, start + this._perPage);
    return `
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse gym-table">
            <thead>
              <tr class="h-10">
                <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Hội viên</th>
                <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Mã HV</th>
                <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Gói tập</th>
                <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Hết hạn từ</th>
                <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Trạng thái</th>
                <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${paginated.map(m => `
                <tr class="h-12 border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                  <td class="px-loose">
                    <div class="flex items-center gap-compact">
                      ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'sm')}
                      <div>
                        <p class="font-bold text-on-surface text-body-md">${m.ho_ten}</p>
                        <p class="text-on-surface-variant text-body-sm">${m.so_dien_thoai || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-loose">
                    <span class="text-on-surface-variant text-body-sm font-bold bg-surface-container px-compact py-xs rounded-lg">${m.ma_ho_so}</span>
                  </td>
                  <td class="px-loose text-body-md">${m.ten_goi_tap || 'N/A'}</td>
                  <td class="px-loose">
                    <div class="flex items-center gap-xs text-error text-body-sm font-bold">
                      <span class="material-symbols-outlined" style="font-size:14px">event_busy</span>
                      ${window.GymApp.formatDate(m.ngay_het_han)}
                    </div>
                  </td>
                  <td class="px-loose">${window.GymApp.statusBadge('het_han')}</td>
                  <td class="px-loose text-right">
                    <div class="flex justify-end gap-atom">
                      <button class="renew-btn flex items-center gap-xs text-body-sm btn-primary text-white px-compact py-xs rounded-lg font-bold" data-id="${m.id}">
                        <span class="material-symbols-outlined text-sm">autorenew</span>
                        Gia hạn
                      </button>
                      <button class="material-symbols-outlined text-outline hover:text-brand-primary transition-colors text-xl p-atom rounded-lg hover:bg-surface-container" title="Gọi điện">phone</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${window.GymApp.renderPagination(this._expiredPage, list.length, this._perPage)}
      </div>
    `;
  },

  _renderExpiringTable: function (list) {
    if (!list) list = this._expiringList;
    if (list.length === 0) return `
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-margin text-center">
        <span class="material-symbols-outlined text-4xl text-outline">event_available</span>
        <p class="text-on-surface-variant text-body-sm mt-standard">Không có hội viên sắp hết hạn</p>
      </div>`;
    const sorted = [...list].sort((a, b) => a.daysLeft - b.daysLeft);
    const start = (this._expiringPage - 1) * this._perPage;
    const paginated = sorted.slice(start, start + this._perPage);
    return `
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse gym-table">
            <thead>
              <tr class="h-10">
                <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Hội viên</th>
                <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Mã HV</th>
                <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Gói tập</th>
                <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Hết hạn</th>
                <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Còn lại</th>
                <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${paginated.map(m => {
                const urgency = m.daysLeft <= 7 ? 'text-error' : m.daysLeft <= 15 ? 'text-[#e65100]' : 'text-[#f59e0b]';
                const urgencyBg = m.daysLeft <= 7 ? 'bg-error-container' : m.daysLeft <= 15 ? 'bg-[#fff3e0]' : 'bg-[#fffde7]';
                return `
                  <tr class="h-12 border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                    <td class="px-loose">
                      <div class="flex items-center gap-compact">
                        ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'sm')}
                        <div>
                          <p class="font-bold text-on-surface text-body-md">${m.ho_ten}</p>
                          <p class="text-on-surface-variant text-body-sm">${m.so_dien_thoai || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-loose">
                      <span class="text-on-surface-variant text-body-sm font-bold bg-surface-container px-compact py-xs rounded-lg">${m.ma_ho_so}</span>
                    </td>
                    <td class="px-loose text-body-md">${m.ten_goi_tap || 'N/A'}</td>
                    <td class="px-loose text-on-surface-variant text-body-sm">${window.GymApp.formatDate(m.ngay_het_han)}</td>
                    <td class="px-loose">
                      <span class="${urgency} ${urgencyBg} font-bold text-body-sm px-compact py-xs rounded-full">${m.daysLeft} ngày</span>
                    </td>
                    <td class="px-loose text-right">
                      <button class="renew-btn flex items-center gap-xs text-body-sm btn-primary text-white px-compact py-xs rounded-lg font-bold ml-auto" data-id="${m.id}">
                        <span class="material-symbols-outlined text-sm">autorenew</span>
                        Gia hạn
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        ${window.GymApp.renderPagination(this._expiringPage, list.length, this._perPage)}
      </div>
    `;
  },

  init: function () {
    const self = this;
    this._expiredPage = 1;
    this._expiringPage = 1;

    window.GymApp._pgHandler = function (pg) {
      if (self._tab === 'expired') {
        self._expiredPage = pg;
        document.getElementById('expired-table-container').innerHTML = self._renderExpiredTable();
        self._bindRenewBtns();
      } else {
        self._expiringPage = pg;
        document.getElementById('expiring-table-container').innerHTML = self._renderExpiringTable();
        self._bindRenewBtns();
      }
    };

    document.getElementById('tab-expired-list')?.addEventListener('click', () => {
      self._tab = 'expired';
      document.getElementById('panel-expired').classList.remove('hidden');
      document.getElementById('panel-expiring').classList.add('hidden');
      document.getElementById('tab-expired-list').className = 'px-loose py-compact rounded-xl font-bold text-body-md bg-surface-container-lowest text-brand-primary shadow-sm transition-all';
      document.getElementById('tab-expiring-list').className = 'px-loose py-compact rounded-xl font-bold text-body-md text-on-surface-variant hover:text-brand-primary transition-all';
      document.getElementById('expired-table-container').innerHTML = self._renderExpiredTable();
      self._bindRenewBtns();
    });

    document.getElementById('tab-expiring-list')?.addEventListener('click', () => {
      self._tab = 'expiring';
      document.getElementById('panel-expiring').classList.remove('hidden');
      document.getElementById('panel-expired').classList.add('hidden');
      document.getElementById('tab-expiring-list').className = 'px-loose py-compact rounded-xl font-bold text-body-md bg-surface-container-lowest text-brand-primary shadow-sm transition-all';
      document.getElementById('tab-expired-list').className = 'px-loose py-compact rounded-xl font-bold text-body-md text-on-surface-variant hover:text-brand-primary transition-all';
      document.getElementById('expiring-table-container').innerHTML = self._renderExpiringTable();
      self._bindRenewBtns();
    });

    this._bindRenewBtns();
  },

  _bindRenewBtns: function () {
    document.querySelectorAll('.renew-btn').forEach(btn => {
      btn.addEventListener('click', () => window.GymApp.toast('Đã gửi yêu cầu gia hạn!', 'success'));
    });
  }
};