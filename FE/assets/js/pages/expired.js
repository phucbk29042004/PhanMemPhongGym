window.GymApp.pages['expired'] = {
  _tab: 'expired',
  _expiredPage: 1, _expiringPage: 1, _perPage: 10,
  _expiredList: [], _expiringList: [],

  render: function () {
    const raw = window.GymApp.data.members;
    const members = Array.isArray(raw) ? raw : [];
    const now = new Date();

    const expired = members.filter(m => m.trang_thai === 'expired' || m.trang_thai === 'het_han');
    this._expiredList = expired;
    const expiring = members.filter(m => {
      if (m.trang_thai !== 'active' && m.trang_thai !== 'dang_tap') return false;
      const expireDate = m.ngay_het_han || m.expireDate;
      if (!expireDate) return false;
      const diff = (new Date(expireDate) - now) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    }).map(m => {
      const expireDate = m.ngay_het_han || m.expireDate;
      return {
        ...m,
        daysLeft: Math.ceil((new Date(expireDate) - now) / (1000 * 60 * 60 * 24))
      };
    });
    this._expiringList = expiring;

    return `
      <div class="flex flex-col gap-margin">

        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-standard">
          <div>
            <h2 class="font-display-2xl text-display-2xl text-on-surface font-bold">Danh sách hết hạn</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm">Theo dõi hội viên hết hạn và sắp hết hạn gói tập</p>
          </div>
          <button class="bg-brand-primary text-white px-loose py-compact rounded-lg font-bold hover:bg-[#187a2d] flex items-center gap-compact shadow-sm">
            <span class="material-symbols-outlined text-sm">send</span>
            Gửi thông báo gia hạn
          </button>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-loose">
          ${[
            { label: 'Đã hết hạn', value: expired.length, color: 'text-error', icon: 'cancel', bg: 'bg-error-container' },
            { label: 'Sắp hết hạn (30 ngày)', value: expiring.length, color: 'text-[#e65100]', icon: 'warning', bg: 'bg-[#fff3e0]' },
            { label: 'Cần liên hệ hôm nay', value: Math.ceil(expired.length * 0.4), color: 'text-brand-primary', icon: 'phone', bg: 'bg-[#e7f5e9]' },
          ].map(s => `
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-loose shadow-sm flex items-center gap-loose">
              <div class="w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0">
                <span class="material-symbols-outlined ${s.color}">${s.icon}</span>
              </div>
              <div>
                <p class="text-on-surface-variant text-body-sm font-bold">${s.label}</p>
                <p class="${s.color} font-display-2xl text-display-2xl font-bold">${s.value}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Tabs -->
        <div class="flex gap-xs bg-surface-container p-xs rounded-xl border border-outline-variant w-fit">
          <button id="tab-expired-list" class="px-loose py-compact rounded-lg font-bold text-body-md bg-surface-container-lowest text-brand-primary shadow-sm">
            Đã hết hạn (${expired.length})
          </button>
          <button id="tab-expiring-list" class="px-loose py-compact rounded-lg font-bold text-body-md text-on-surface-variant hover:text-brand-primary">
            Sắp hết hạn (${expiring.length})
          </button>
        </div>

        <!-- Table Đã hết hạn -->
        <div id="panel-expired">
          <div id="expired-table-container">${this._renderExpiredTable(expired)}</div>
        </div>

        <!-- Table Sắp hết hạn -->
        <div id="panel-expiring" class="hidden">
          <div id="expiring-table-container">${this._renderExpiringTable(expiring)}</div>
        </div>

      </div>
    `;
  },

  _renderExpiredTable: function (list) {
    if (!list) list = this._expiredList;
    if (list.length === 0) return `<div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-margin text-center text-on-surface-variant">Không có hội viên hết hạn</div>`;
    const start = (this._expiredPage - 1) * this._perPage;
    const paginated = list.slice(start, start + this._perPage);
    return `
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead class="bg-surface-container-high">
              <tr class="h-10">
                <th class="px-loose font-bold text-body-md">Hội viên</th>
                <th class="px-loose font-bold text-body-md">Mã HV</th>
                <th class="px-loose font-bold text-body-md">Gói tập</th>
                <th class="px-loose font-bold text-body-md">Chi nhánh</th>
                <th class="px-loose font-bold text-body-md">Hết hạn từ</th>
                <th class="px-loose font-bold text-body-md">Trạng thái</th>
                <th class="px-loose font-bold text-body-md text-right">Thao tác</th>
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
                  <td class="px-loose text-on-surface-variant text-body-sm font-bold">${m.ma_ho_so}</td>
                  <td class="px-loose text-body-md">${m.ten_goi_tap || 'N/A'}</td>
                  <td class="px-loose text-on-surface-variant text-body-sm">Main Gym</td>
                  <td class="px-loose text-error text-body-sm font-bold">${window.GymApp.formatDate(m.ngay_het_han)}</td>
                  <td class="px-loose">${window.GymApp.statusBadge('expired')}</td>
                  <td class="px-loose text-right">
                    <div class="flex justify-end gap-atom">
                      <button class="flex items-center gap-xs text-body-sm bg-brand-primary text-white px-compact py-xs rounded-lg hover:bg-[#187a2d] transition-colors font-bold renew-btn">
                        <span class="material-symbols-outlined text-sm">autorenew</span>
                        Gia hạn
                      </button>
                      <button class="material-symbols-outlined text-outline hover:text-brand-primary transition-colors text-xl p-atom rounded" title="Gọi điện">phone</button>
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
    if (list.length === 0) return `<div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-margin text-center text-on-surface-variant">Không có hội viên sắp hết hạn</div>`;
    const sorted = [...list].sort((a, b) => a.daysLeft - b.daysLeft);
    const start = (this._expiringPage - 1) * this._perPage;
    const paginated = sorted.slice(start, start + this._perPage);
    return `
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead class="bg-surface-container-high">
              <tr class="h-10">
                <th class="px-loose font-bold text-body-md">Hội viên</th>
                <th class="px-loose font-bold text-body-md">Mã HV</th>
                <th class="px-loose font-bold text-body-md">Gói tập</th>
                <th class="px-loose font-bold text-body-md">Hết hạn</th>
                <th class="px-loose font-bold text-body-md">Còn lại</th>
                <th class="px-loose font-bold text-body-md text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${paginated.map(m => {
                const urgency = m.daysLeft <= 7 ? 'text-error' : m.daysLeft <= 15 ? 'text-[#e65100]' : 'text-[#f59e0b]';
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
                    <td class="px-loose text-on-surface-variant text-body-sm font-bold">${m.ma_ho_so}</td>
                    <td class="px-loose text-body-md">${m.ten_goi_tap || 'N/A'}</td>
                    <td class="px-loose text-on-surface-variant text-body-sm">${window.GymApp.formatDate(m.ngay_het_han)}</td>
                    <td class="px-loose">
                      <span class="${urgency} font-bold text-body-sm">${m.daysLeft} ngày</span>
                    </td>
                    <td class="px-loose text-right">
                      <div class="flex justify-end gap-atom">
                        <button class="flex items-center gap-xs text-body-sm bg-brand-primary text-white px-compact py-xs rounded-lg hover:bg-[#187a2d] transition-colors font-bold renew-btn">
                          <span class="material-symbols-outlined text-sm">autorenew</span>
                          Gia hạn ngay
                        </button>
                      </div>
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

    // Pagination handler
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
      document.getElementById('tab-expired-list').className = 'px-loose py-compact rounded-lg font-bold text-body-md bg-surface-container-lowest text-brand-primary shadow-sm';
      document.getElementById('tab-expiring-list').className = 'px-loose py-compact rounded-lg font-bold text-body-md text-on-surface-variant hover:text-brand-primary';
    });
    document.getElementById('tab-expiring-list')?.addEventListener('click', () => {
      self._tab = 'expiring';
      document.getElementById('panel-expiring').classList.remove('hidden');
      document.getElementById('panel-expired').classList.add('hidden');
      document.getElementById('tab-expiring-list').className = 'px-loose py-compact rounded-lg font-bold text-body-md bg-surface-container-lowest text-brand-primary shadow-sm';
      document.getElementById('tab-expired-list').className = 'px-loose py-compact rounded-lg font-bold text-body-md text-on-surface-variant hover:text-brand-primary';
    });

    this._bindRenewBtns();
  },

  _bindRenewBtns: function () {
    document.querySelectorAll('.renew-btn').forEach(btn => {
      btn.addEventListener('click', () => window.GymApp.toast('Đã gửi yêu cầu gia hạn!', 'success'));
    });
  }
};
