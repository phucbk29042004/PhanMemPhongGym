window.GymApp.pages['members-list'] = {
  _tab: 'members',
  _memberPage: 1, _memberFiltered: [],
  _ptPage: 1, _ptFiltered: [],
  _perPage: 10,
  _filterState: { status: '', pkg: '', gender: '' },
  _ptFilterState: { specialty: '', status: '' },
  _ptSortState: '',
  _memberPackageHistory: {},

  render: function () {
    const rawMembers = window.GymApp.data.members;
    const rawPts = window.GymApp.data.pts;
    this._memberFiltered = Array.isArray(rawMembers) ? [...rawMembers] : [];
    this._ptFiltered = Array.isArray(rawPts) ? [...rawPts] : [];
    this._ptSortState = '';
    return `
      <div class="flex flex-col gap-margin">

        <!-- Action Bar -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-standard">
          <div>
            <h2 class="font-display-2xl text-display-2xl text-on-surface font-bold">Danh sách hội viên</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm">Quản lý toàn bộ hội viên và huấn luyện viên</p>
          </div>
          <button class="bg-brand-primary text-white px-loose py-compact rounded-lg font-bold hover:bg-[#187a2d] transition-all flex items-center gap-compact shadow-sm" data-page="member-add">
            <span class="material-symbols-outlined text-sm">person_add</span>
            Thêm hội viên mới
          </button>
        </div>

        <!-- Tab Bar -->
        <div class="flex gap-atom bg-surface-container p-atom rounded-xl border border-outline-variant w-fit shadow-sm">
          <button id="tab-members" class="tab-btn px-loose py-compact rounded-lg font-bold text-body-md transition-all" data-tab="members">
            <span class="flex items-center gap-compact">
              <span class="material-symbols-outlined text-sm">people</span>Hội viên
            </span>
          </button>
          <button id="tab-pts" class="tab-btn px-loose py-compact rounded-lg font-bold text-body-md transition-all" data-tab="pts">
            <span class="flex items-center gap-compact">
              <span class="material-symbols-outlined text-sm">sports_gymnastics</span>PT / HLV
            </span>
          </button>
        </div>

        <!-- Tab: Hội viên -->
        <div id="tab-content-members" class="tab-content">
          <div class="flex flex-wrap items-center gap-standard bg-surface-container p-standard rounded-xl border border-outline-variant shadow-sm mb-standard">
            <div class="relative flex-1" style="min-width:180px;">
              <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
              <input id="member-search" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-8 pr-standard py-compact rounded-lg focus:border-brand-primary outline-none placeholder-outline font-body-md text-body-md" placeholder="Tìm theo tên, mã HV, số điện thoại..." type="text" />
            </div>
            <button id="btn-view-all-members" class="flex items-center gap-xs px-standard py-compact rounded-lg border border-outline-variant text-on-surface-variant text-body-sm font-bold flex-shrink-0 hover:text-brand-primary hover:border-brand-primary transition-colors">
              <span class="material-symbols-outlined text-sm">format_list_bulleted</span>Xem tất cả
            </button>
            <button id="btn-show-all" class="hidden items-center gap-xs px-standard py-compact rounded-lg border border-outline-variant text-on-surface-variant text-body-sm font-bold flex-shrink-0 hover:text-error hover:border-error transition-colors">
              <span class="material-symbols-outlined text-sm">filter_alt_off</span>Xóa lọc
            </button>
            <button id="btn-filter" class="relative flex items-center gap-xs px-standard py-compact rounded-lg border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-colors flex-shrink-0">
              <span class="material-symbols-outlined text-sm">tune</span>
              <span class="text-body-sm font-bold">Lọc</span>
              <span id="filter-badge" style="display:none;position:absolute;top:-6px;right:-6px;width:18px;height:18px;background:#1D9336;color:#fff;border-radius:50%;font-size:9px;align-items:center;justify-content:center;font-weight:700;"></span>
            </button>
          </div>
          <div id="members-table-container" class="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant shadow-sm">
            ${this._renderMemberTable()}
          </div>
        </div>

        <!-- Tab: PT / HLV -->
        <div id="tab-content-pts" class="tab-content hidden">
          <div class="flex flex-wrap items-center gap-standard bg-surface-container p-standard rounded-xl border border-outline-variant shadow-sm mb-standard">
            <div class="relative flex-1" style="min-width:180px;">
              <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
              <input id="pt-search" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-8 pr-standard py-compact rounded-lg focus:border-brand-primary outline-none placeholder-outline font-body-md text-body-md" placeholder="Tìm theo tên, chuyên môn..." type="text" />
            </div>
            <button id="btn-view-all-pts" class="flex items-center gap-xs px-standard py-compact rounded-lg border border-outline-variant text-on-surface-variant text-body-sm font-bold flex-shrink-0 hover:text-brand-primary hover:border-brand-primary transition-colors">
              <span class="material-symbols-outlined text-sm">format_list_bulleted</span>Xem tất cả
            </button>
            <button id="btn-show-all-pt" class="hidden items-center gap-xs px-standard py-compact rounded-lg border border-outline-variant text-on-surface-variant text-body-sm font-bold flex-shrink-0 hover:text-error hover:border-error transition-colors">
              <span class="material-symbols-outlined text-sm">filter_alt_off</span>Xóa lọc
            </button>
            <button id="btn-filter-pt" class="relative flex items-center gap-xs px-standard py-compact rounded-lg border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-colors flex-shrink-0">
              <span class="material-symbols-outlined text-sm">tune</span>
              <span class="text-body-sm font-bold">Lọc</span>
              <span id="pt-filter-badge" style="display:none;position:absolute;top:-6px;right:-6px;width:18px;height:18px;background:#1D9336;color:#fff;border-radius:50%;font-size:9px;align-items:center;justify-content:center;font-weight:700;"></span>
            </button>
            <button id="btn-sort-pt" class="relative flex items-center gap-xs px-standard py-compact rounded-lg border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-colors flex-shrink-0">
              <span class="material-symbols-outlined text-sm">sort</span>
              <span class="text-body-sm font-bold">Sắp xếp</span>
              <span id="pt-sort-badge" style="display:none;position:absolute;top:-6px;right:-6px;width:18px;height:18px;background:#1D9336;color:#fff;border-radius:50%;font-size:9px;align-items:center;justify-content:center;font-weight:700;">1</span>
            </button>
          </div>
          <div id="pt-table-container" class="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant shadow-sm">
            ${this._renderPtTable()}
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-loose">
          ${
            (function() {
              const stats = window.GymApp.data.stats?.hoi_vien || { tong: 0, con_han: 0, het_han: 0 };
              return [
                { label: 'Tổng hội viên', value: stats.tong, color: 'text-brand-primary' },
                { label: 'Đang hoạt động', value: stats.con_han, color: 'text-brand-primary' },
                { label: 'Hết hạn', value: stats.het_han, color: 'text-error' },
              ].map(s => `
                <div class="bg-surface-container-lowest p-loose rounded-xl border border-outline-variant shadow-sm flex flex-col gap-atom">
                  <span class="text-on-surface-variant font-body-sm text-body-sm uppercase tracking-wider font-bold">${s.label}</span>
                  <span class="${s.color} font-display-2xl text-display-2xl font-bold">${s.value}</span>
                </div>
              `).join('');
            })()
          }
        </div>
      </div>
    `;
  },

  _renderMemberTable: function () {
    const self = this;
    const start = (self._memberPage - 1) * self._perPage;
    const paginated = self._memberFiltered.slice(start, start + self._perPage);
    const rows = paginated.length === 0
      ? `<tr><td colspan="7" class="px-loose py-margin text-center text-on-surface-variant text-body-sm">Không có dữ liệu</td></tr>`
      : paginated.map(m => `
        <tr class="h-12 border-b border-outline-variant hover:bg-surface-container-low transition-colors">
          <td class="px-loose">
            <div class="flex items-center gap-compact">
              ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'sm')}
              <div>
                <p class="font-bold text-brand-primary text-body-md cursor-pointer hover:underline member-name-link" data-id="${m.id}">${m.ho_ten}</p>
                <p class="text-on-surface-variant text-body-sm">${m.so_dien_thoai || '—'}</p>
              </div>
            </div>
          </td>
          <td class="px-loose text-on-surface-variant text-body-sm font-bold">${m.ma_ho_so}</td>
          <td class="px-loose">${window.GymApp.statusBadge(m.trang_thai)}</td>
          <td class="px-loose text-body-md text-on-surface">${m.ten_goi_tap || 'Chưa ĐK'}</td>
          <td class="px-loose text-on-surface-variant text-body-sm">Paradise Gym</td>
          <td class="px-loose text-on-surface-variant text-body-sm">${window.GymApp.formatDate(m.ngay_het_han)}</td>
          <td class="px-loose text-right">
            <div class="flex justify-end gap-atom">
              <button class="material-symbols-outlined text-outline hover:text-brand-primary transition-colors text-xl p-atom rounded hover:bg-surface-container member-view-btn" data-id="${m.id}" title="Xem chi tiết">visibility</button>
              <button class="material-symbols-outlined text-outline hover:text-brand-primary transition-colors text-xl p-atom rounded hover:bg-surface-container" title="Sửa">edit</button>
              <button class="material-symbols-outlined text-outline hover:text-error transition-colors text-xl p-atom rounded hover:bg-error-container" title="Xóa">delete</button>
            </div>
          </td>
        </tr>
      `).join('');
    return `
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-surface-container-high text-on-surface">
            <tr class="h-10">
              <th class="px-loose font-bold font-body-md text-body-md">Hội viên</th>
              <th class="px-loose font-bold font-body-md text-body-md">Mã HV</th>
              <th class="px-loose font-bold font-body-md text-body-md">Trạng thái</th>
              <th class="px-loose font-bold font-body-md text-body-md">Gói tập</th>
              <th class="px-loose font-bold font-body-md text-body-md">Chi nhánh</th>
              <th class="px-loose font-bold font-body-md text-body-md">Hết hạn</th>
              <th class="px-loose font-bold font-body-md text-body-md text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="text-on-surface">${rows}</tbody>
        </table>
      </div>
      ${window.GymApp.renderPagination(self._memberPage, self._memberFiltered.length, self._perPage)}
    `;
  },

  _renderPtTable: function () {
    const self = this;
    const start = (self._ptPage - 1) * self._perPage;
    const paginated = self._ptFiltered.slice(start, start + self._perPage);
    const rows = paginated.length === 0
      ? `<tr><td colspan="6" class="px-loose py-margin text-center text-on-surface-variant text-body-sm">Không có dữ liệu</td></tr>`
      : paginated.map(pt => `
        <tr class="h-12 border-b border-outline-variant hover:bg-surface-container-low transition-colors">
          <td class="px-loose">
            <div class="flex items-center gap-compact">
              ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten, 'sm')}
              <div>
                <p class="font-bold text-brand-primary text-body-md cursor-pointer hover:underline pt-name-link" data-id="${pt.id}">${pt.ho_ten}</p>
                <p class="text-on-surface-variant text-body-sm">${pt.so_dien_thoai || '—'}</p>
              </div>
            </div>
          </td>
          <td class="px-loose text-on-surface-variant text-body-sm font-bold">${pt.ma_ho_so}</td>
          <td class="px-loose text-body-md text-on-surface">${pt.chuyen_mon || pt.specialty || 'Huấn luyện viên'}</td>
          <td class="px-loose">
            <div class="flex items-center gap-atom">
              <span class="material-symbols-outlined text-sm" style="color:#f59e0b;font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">star</span>
              <span class="font-bold text-body-md text-on-surface">4.8</span>
            </div>
          </td>
          <td class="px-loose text-on-surface-variant text-body-sm">${pt.kinh_nghiem || 0} năm</td>
          <td class="px-loose text-right">
            <div class="flex justify-end gap-atom">
              <button class="material-symbols-outlined text-outline hover:text-brand-primary transition-colors text-xl p-atom rounded hover:bg-surface-container pt-view-btn" data-id="${pt.id}" title="Xem chi tiết">visibility</button>
              <button class="material-symbols-outlined text-outline hover:text-brand-primary transition-colors text-xl p-atom rounded hover:bg-surface-container" title="Sửa">edit</button>
            </div>
          </td>
        </tr>
      `).join('');
    return `
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-surface-container-high text-on-surface">
            <tr class="h-10">
              <th class="px-loose font-bold font-body-md text-body-md">Huấn luyện viên</th>
              <th class="px-loose font-bold font-body-md text-body-md">Mã PT</th>
              <th class="px-loose font-bold font-body-md text-body-md">Chuyên môn</th>
              <th class="px-loose font-bold font-body-md text-body-md">Đánh giá</th>
              <th class="px-loose font-bold font-body-md text-body-md">Kinh nghiệm</th>
              <th class="px-loose font-bold font-body-md text-body-md text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="text-on-surface">${rows}</tbody>
        </table>
      </div>
      ${window.GymApp.renderPagination(self._ptPage, self._ptFiltered.length, self._perPage)}
    `;
  },

  // ===== MODAL CHI TIẾT HỘI VIÊN (3 TAB) =====
  _showMemberModal: function (id) {
    const self = this;
    const m = (window.GymApp.data.members || []).find(x => (x.id || x.ho_so_id) == id);
    if (!m) return;
    document.getElementById('gym-member-modal')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'gym-member-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);padding:16px;';

    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:16px;width:100%;max-width:740px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;position:relative;box-shadow:0 25px 60px rgba(0,0,0,0.3);">
        <!-- Header -->
        <div class="bg-surface-container-lowest px-loose py-standard border-b border-outline-variant flex-shrink-0">
          <button id="close-member-modal" style="position:absolute;top:12px;right:12px;background:transparent;border:none;cursor:pointer;" title="Đóng">
            <span class="material-symbols-outlined text-on-surface-variant text-xl">close</span>
          </button>
          <div class="flex items-center gap-loose mb-standard">
            ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'lg')}
            <div>
              <h3 class="font-bold text-on-surface" style="font-size:18px;">${m.ho_ten}</h3>
              <p class="text-on-surface-variant text-body-sm">${m.ma_ho_so} · ${m.loai_ho_so || 'Hội viên'}</p>
              <div class="mt-atom">${window.GymApp.statusBadge(m.trang_thai)}</div>
            </div>
          </div>
          <!-- Tabs -->
          <div class="flex flex-wrap gap-atom bg-surface-container p-atom rounded-xl border border-outline-variant w-fit">
            ${[['info','Thông tin chung','info'],['package','Lịch sử đăng ký gói tập','fitness_center'],['schedule','Lịch tập với PT','event_note']].map(([t,l,ic]) => `
              <button class="member-detail-tab px-standard py-xs rounded-lg font-bold text-body-sm transition-all flex items-center gap-xs" data-mtab="${t}" style="background:transparent;color:#3f4a3c;border:none;cursor:pointer;">
                <span class="material-symbols-outlined text-sm">${ic}</span>${l}
              </button>
            `).join('')}
          </div>
        </div>
        <!-- Body -->
        <div id="member-modal-body" style="overflow-y:auto;flex:1;padding:20px 24px;" class="bg-surface-container-lowest">
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const setTab = (t) => {
      overlay.querySelectorAll('.member-detail-tab').forEach(btn => {
        const active = btn.dataset.mtab === t;
        btn.style.background = active ? '#1D9336' : 'transparent';
        btn.style.color = active ? '#fff' : '';
        btn.className = btn.className;
      });
      const pkgHistory = self._getMemberPackageHistory(m);
      const memberSchedules = self._getMemberSchedules(m);
      document.getElementById('member-modal-body').innerHTML = self._renderMemberTab(t, m, pkgHistory, memberSchedules);
      self._bindMemberTabEvents(t, m, () => setTab(t));
    };

    overlay.querySelectorAll('.member-detail-tab').forEach(btn => {
      btn.addEventListener('click', () => setTab(btn.dataset.mtab));
    });
    setTab('info');

    const close = () => overlay.remove();
    document.getElementById('close-member-modal').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    const escH = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escH); } };
    document.addEventListener('keydown', escH);
  },

  _mockPkgHistory: function (m) {
    return [
      {
        id: `${m.id}-current`,
        name: m.package,
        price: this._getPackagePrice(m.package) || 0,
        from: m.joinDate,
        to: m.expireDate,
        status: m.status === 'active' ? 'Đã thanh toán' : 'Hết hạn',
        note: 'Gói hiện tại',
      },
      {
        id: `${m.id}-previous`,
        name: 'Gói 1 tháng',
        price: this._getPackagePrice('Gói 1 tháng') || 300000,
        from: '2024-01-01',
        to: '2024-01-31',
        status: 'Đã thanh toán',
        note: 'Gói trước đó',
      },
    ];
  },

  _getPackagePrice: function (packageName) {
    const pkg = (window.GymApp.data.packages || []).find(p => p.name === packageName);
    return pkg ? pkg.price : 0;
  },

  _getMemberPackageHistory: function (m) {
    const added = this._memberPackageHistory[m.id] || [];
    return [...added, ...this._mockPkgHistory(m)].sort((a, b) => new Date(b.from) - new Date(a.from));
  },

  _getUpcomingPackages: function (m) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (this._memberPackageHistory[m.id] || [])
      .filter(p => new Date(p.from) > today)
      .sort((a, b) => new Date(a.from) - new Date(b.from));
  },

  _getMemberSchedules: function (m) {
    return (window.GymApp.data.ptSchedules || [])
      .filter(s => s.memberId === m.id || s.memberName === m.name)
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  },

  _packageStatusBadge: function (status) {
    const palette = {
      'Đã thanh toán': ['#e7f5e9', '#1D9336'],
      'Còn nợ': ['#fff2cc', '#7a5b00'],
      'Miễn phí': ['#e0f2fe', '#0369a1'],
      'Sắp tới': ['#e8def8', '#6750a4'],
      'Hết hạn': ['#ffdad6', '#ba1a1a'],
    };
    const colors = palette[status] || ['#e0e3e8', '#3f4a3c'];
    return `<span style="padding:2px 8px;border-radius:999px;font-size:9.6px;font-weight:700;background:${colors[0]};color:${colors[1]};">${status}</span>`;
  },

  _renderMemberTab: function (tab, m, pkgHistory, memberSchedules) {
    if (tab === 'info') {
      return `
        <div class="grid grid-cols-2 gap-standard">
          ${
            [
              ['Giới tính', m.gioi_tinh === 'male' ? 'Nam' : 'Nữ'],
              ['Ngày sinh', window.GymApp.formatDate(m.ngay_sinh)],
              ['Số điện thoại', m.so_dien_thoai],
              ['Email', m.email],
              ['Gói tập hiện tại', m.ten_goi_tap || 'Chưa đăng ký'],
              ['Ngày tham gia', window.GymApp.formatDate(m.ngay_tao)],
              ['Ngày hết hạn', window.GymApp.formatDate(m.ngay_het_han)],
              ['Địa chỉ', m.dia_chi || '—'],
            ].map(([label, val]) => `
              <div class="bg-surface-container p-standard rounded-lg">
                <p class="text-on-surface-variant text-body-sm font-bold uppercase tracking-wider mb-atom">${label}</p>
                <p class="text-on-surface text-body-md font-bold">${val || '—'}</p>
              </div>
            `).join('')
          }
        </div>
      `;
    }

    if (tab === 'package') {
      const upcomingPackages = this._getUpcomingPackages(m);
      const upcomingRows = upcomingPackages.length === 0
        ? `<tr><td colspan="5" class="px-standard py-standard text-center text-on-surface-variant text-body-sm">Chưa có gói sắp tới</td></tr>`
        : upcomingPackages.map(p => `
          <tr class="h-11 border-t border-outline-variant hover:bg-surface-container-low transition-colors">
            <td class="px-standard text-body-md font-bold text-on-surface">${p.name}</td>
            <td class="px-standard text-body-sm text-on-surface-variant">${window.GymApp.formatCurrency(p.price || 0)}</td>
            <td class="px-standard text-body-sm text-on-surface-variant">${window.GymApp.formatDate(p.from)}</td>
            <td class="px-standard text-body-sm text-on-surface-variant">${window.GymApp.formatDate(p.to)}</td>
            <td class="px-standard">${this._packageStatusBadge('Sắp tới')}</td>
          </tr>
        `).join('');
      return `
        <div class="bg-surface-container rounded-xl border border-outline-variant p-standard mb-standard">
          <div class="flex items-center justify-between mb-standard">
            <h4 class="font-bold text-on-surface text-body-md flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm text-brand-primary">fitness_center</span>
              Gói đang sử dụng
            </h4>
            ${window.GymApp.statusBadge(m.trang_thai)}
          </div>
          <div class="grid grid-cols-4 gap-standard">
            <div>
              <p class="text-on-surface-variant text-body-sm mb-atom">Tên gói</p>
              <p class="font-bold text-on-surface text-body-md">${m.ten_goi_tap || 'N/A'}</p>
            </div>
            <div>
              <p class="text-on-surface-variant text-body-sm mb-atom">Giá gói</p>
              <p class="font-bold text-on-surface text-body-md">${window.GymApp.formatCurrency(m.gia_goi_tap || 0)}</p>
            </div>
            <div>
              <p class="text-on-surface-variant text-body-sm mb-atom">Từ ngày</p>
              <p class="font-bold text-on-surface text-body-md">${window.GymApp.formatDate(m.ngay_bat_dau)}</p>
            </div>
            <div>
              <p class="text-on-surface-variant text-body-sm mb-atom">Đến ngày</p>
              <p class="font-bold text-on-surface text-body-md">${window.GymApp.formatDate(m.ngay_het_han)}</p>
            </div>
          </div>
        </div>
        <!-- Nút thêm gói -->
        <div class="flex justify-end mb-standard">
          <button id="btn-add-package" class="flex items-center gap-xs px-standard py-compact rounded-lg text-white font-bold text-body-sm hover:opacity-90 transition-all" style="background:#1D9336;">
            <span class="material-symbols-outlined text-sm">add</span>Thêm gói
            </button>
          </div>
        <!-- Gói sắp tới -->
        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden mb-standard">
          <div class="bg-surface-container-high px-standard py-compact">
            <p class="font-bold text-on-surface text-body-sm uppercase tracking-wider">Gói sắp tới</p>
          </div>
          <table class="w-full text-left border-collapse">
            <thead class="bg-surface-container">
              <tr class="h-10">
                <th class="px-standard font-bold text-body-sm text-on-surface">Gói tập</th>
                <th class="px-standard font-bold text-body-sm text-on-surface">Giá</th>
                <th class="px-standard font-bold text-body-sm text-on-surface">Từ ngày</th>
                <th class="px-standard font-bold text-body-sm text-on-surface">Đến ngày</th>
                <th class="px-standard font-bold text-body-sm text-on-surface">Trạng thái</th>
              </tr>
            </thead>
            <tbody>${upcomingRows}</tbody>
          </table>
        </div>
        <!-- Lịch sử gói -->
        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
          <div class="bg-surface-container-high px-standard py-compact">
            <p class="font-bold text-on-surface text-body-sm uppercase tracking-wider">Lịch sử đăng ký gói tập</p>
          </div>
          <table class="w-full text-left border-collapse">
            <thead class="bg-surface-container">
              <tr class="h-10">
                <th class="px-standard font-bold text-body-sm text-on-surface">Gói tập</th>
                <th class="px-standard font-bold text-body-sm text-on-surface">Giá</th>
                <th class="px-standard font-bold text-body-sm text-on-surface">Từ ngày</th>
                <th class="px-standard font-bold text-body-sm text-on-surface">Đến ngày</th>
                <th class="px-standard font-bold text-body-sm text-on-surface">Trạng thái</th>
                <th class="px-standard font-bold text-body-sm text-on-surface">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              ${pkgHistory.map(p => `
                <tr class="h-11 border-t border-outline-variant hover:bg-surface-container-low transition-colors">
                  <td class="px-standard text-body-md font-bold text-on-surface">${p.name}</td>
                  <td class="px-standard text-body-sm text-on-surface-variant">${window.GymApp.formatCurrency(p.price || 0)}</td>
                  <td class="px-standard text-body-sm text-on-surface-variant">${window.GymApp.formatDate(p.from)}</td>
                  <td class="px-standard text-body-sm text-on-surface-variant">${window.GymApp.formatDate(p.to)}</td>
                  <td class="px-standard">${this._packageStatusBadge(p.status)}</td>
                  <td class="px-standard text-body-sm text-on-surface-variant">${p.note || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    if (tab === 'schedule') {
      const rows = memberSchedules.length === 0
        ? `<tr><td colspan="5" class="px-standard py-loose text-center text-on-surface-variant text-body-sm">Chưa có lịch tập nào được đặt</td></tr>`
        : memberSchedules.map(s => `
          <tr class="h-11 border-t border-outline-variant hover:bg-surface-container-low transition-colors">
            <td class="px-standard text-body-sm font-bold text-on-surface">${s.ptName}</td>
            <td class="px-standard text-body-sm text-on-surface-variant">${window.GymApp.formatDate(s.date)}</td>
            <td class="px-standard text-body-sm text-on-surface-variant">${s.startTime} — ${s.endTime}</td>
            <td class="px-standard">${window.GymApp.statusBadge(s.status)}</td>
            <td class="px-standard text-body-sm text-on-surface-variant">${s.notes || '—'}</td>
          </tr>
        `).join('');
      return `
        <div class="flex justify-end mb-standard">
          <button id="btn-add-schedule" class="flex items-center gap-xs px-standard py-compact rounded-lg text-white font-bold text-body-sm hover:opacity-90 transition-all" style="background:#1D9336;">
            <span class="material-symbols-outlined text-sm">add</span>Đăng ký lịch mới
          </button>
        </div>
        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
          <div class="bg-surface-container-high px-standard py-compact">
            <p class="font-bold text-on-surface text-body-sm uppercase tracking-wider">Lịch tập với PT</p>
          </div>
          <table class="w-full text-left border-collapse">
            <thead class="bg-surface-container">
              <tr class="h-10">
                <th class="px-standard font-bold text-body-sm text-on-surface">Huấn luyện viên</th>
                <th class="px-standard font-bold text-body-sm text-on-surface">Ngày</th>
                <th class="px-standard font-bold text-body-sm text-on-surface">Giờ</th>
                <th class="px-standard font-bold text-body-sm text-on-surface">Trạng thái</th>
                <th class="px-standard font-bold text-body-sm text-on-surface">Ghi chú</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    }
    return '';
  },

  _bindMemberTabEvents: function (tab, m, refreshTab) {
    const self = this;
    if (tab === 'package') {
      document.getElementById('btn-add-package')?.addEventListener('click', () => self._showAddPackageModal(m, refreshTab));
    }
    if (tab === 'schedule') {
      document.getElementById('btn-add-schedule')?.addEventListener('click', () => self._showAddScheduleModal(m, refreshTab));
    }
  },

  // ===== MODAL THÊM GÓI TẬP =====
  _showAddPackageModal: function (m, onSaved) {
    const self = this;
    document.getElementById('gym-sub-modal')?.remove();

    const pkgs = window.GymApp.data.packages || [];
    const pkgNames = pkgs.length
      ? pkgs.map(p => ({ name: typeof p === 'object' ? p.name : p, price: typeof p === 'object' ? (p.price || 0) : 0 }))
      : [...new Set(window.GymApp.data.members.map(x => x.package))].map(n => ({ name: n, price: 0 }));

    const REQ = `<span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>`;
    const inputCls = `class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;"`;

    const overlay = document.createElement('div');
    overlay.id = 'gym-sub-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);padding:16px;';

    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:16px;width:100%;max-width:660px;max-height:92vh;overflow-y:auto;position:relative;box-shadow:0 30px 80px rgba(0,0,0,0.4);">
        <div class="bg-surface-container-lowest border-b border-outline-variant px-loose py-standard flex items-center justify-between" style="position:sticky;top:0;z-index:1;">
          <div>
            <h3 class="font-bold text-on-surface" style="font-size:16px;">Thêm gói tập</h3>
            <p class="text-on-surface-variant text-body-sm">Hội viên: <strong>${m.name}</strong></p>
          </div>
          <button id="close-sub-modal" style="background:transparent;border:none;cursor:pointer;">
            <span class="material-symbols-outlined text-on-surface-variant text-xl">close</span>
          </button>
        </div>
        <div class="p-loose bg-surface-container-lowest">
          <div class="grid grid-cols-2 gap-standard">

            <!-- Tên gói tập -->
            <div style="grid-column:1/-1;">
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Tên gói tập ${REQ}</label>
              <select id="pkg-name" ${inputCls}>
                <option value="">— Chọn gói tập —</option>
                ${pkgNames.map(p => `<option value="${p.name}" data-price="${p.price}">${p.name}${p.price ? ' — ' + window.GymApp.formatCurrency(p.price) : ''}</option>`).join('')}
              </select>
            </div>

            <!-- Giá gói tập -->
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Giá gói tập (VNĐ) ${REQ}</label>
              <input id="pkg-price" type="number" min="0" placeholder="Nhập giá..." ${inputCls} />
            </div>

            <!-- Mã giảm giá -->
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Mã giảm giá</label>
              <input id="pkg-discount-code" type="text" placeholder="Nhập mã (nếu có)..." ${inputCls} />
            </div>

            <!-- Từ ngày -->
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Từ ngày ${REQ}</label>
              <input id="pkg-from" type="date" value="${new Date().toISOString().split('T')[0]}" ${inputCls} />
            </div>

            <!-- Đến ngày -->
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Đến ngày ${REQ}</label>
              <input id="pkg-to" type="date" ${inputCls} />
            </div>

            <!-- Trạng thái đăng ký -->
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Trạng thái đăng ký ${REQ}</label>
              <select id="pkg-reg-status" ${inputCls}>
                <option value="paid">Đã thanh toán</option>
                <option value="debt">Còn nợ</option>
                <option value="free">Miễn phí</option>
              </select>
            </div>

            <!-- Ngày thanh toán -->
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Ngày thanh toán</label>
              <input id="pkg-payment-date" type="date" value="${new Date().toISOString().split('T')[0]}" ${inputCls} />
            </div>

            <!-- Cần thanh toán (readonly) -->
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Cần thanh toán (VNĐ)</label>
              <input id="pkg-need-pay" type="number" min="0" placeholder="Tự tính từ giá gói..." class="bg-surface-container text-on-surface border border-outline-variant" readonly
                style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;cursor:not-allowed;" />
            </div>

            <!-- Tiền khách đưa -->
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Tiền khách đưa (VNĐ)</label>
              <input id="pkg-paid" type="number" min="0" placeholder="Nhập số tiền..." ${inputCls} />
            </div>

            <!-- Khách nợ (readonly) -->
            <div style="grid-column:1/-1;">
              <label class="block text-body-sm font-bold mb-xs" style="color:#93000a;">Khách nợ (VNĐ)</label>
              <input id="pkg-debt" type="number" value="0" readonly
                style="width:100%;background:#ffdad6;border:1px solid #f2b8b5;color:#93000a;font-weight:700;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;cursor:not-allowed;" />
            </div>

            <!-- Ghi chú -->
            <div style="grid-column:1/-1;">
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Ghi chú</label>
              <textarea id="pkg-note" rows="3" placeholder="Ghi chú thêm về gói tập này..." class="bg-surface-container-lowest text-on-surface border border-outline-variant"
                style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;resize:vertical;font-family:inherit;"></textarea>
            </div>

          </div>
          <p class="text-on-surface-variant text-body-sm mt-standard" style="font-size:11px;">Các trường có dấu <span style="color:#ba1a1a;font-weight:700;">*</span> là bắt buộc</p>
          <div class="flex gap-standard mt-standard">
            <button id="pkg-cancel-btn" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Hủy</button>
            <button id="pkg-save-btn" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#1D9336;">Lưu gói tập</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('close-sub-modal').addEventListener('click', close);
    document.getElementById('pkg-cancel-btn').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    // Auto-fill price when package selected
    document.getElementById('pkg-name').addEventListener('change', function () {
      const opt = this.options[this.selectedIndex];
      const price = parseFloat(opt.dataset.price) || 0;
      if (price > 0) {
        document.getElementById('pkg-price').value = price;
        calcDebt();
      }
    });

    // Auto-calc need-to-pay & debt
    document.getElementById('pkg-price').addEventListener('input', calcDebt);
    document.getElementById('pkg-discount-code').addEventListener('input', calcDebt);
    document.getElementById('pkg-paid').addEventListener('input', calcDebt);

    function calcDebt() {
      const price = parseFloat(document.getElementById('pkg-price').value) || 0;
      const discountCode = document.getElementById('pkg-discount-code').value.trim().toUpperCase();
      const discount = discountCode ? Math.round(price * 0.1) : 0;
      const need = Math.max(0, price - discount);
      const paid = parseFloat(document.getElementById('pkg-paid').value) || 0;
      document.getElementById('pkg-need-pay').value = need;
      document.getElementById('pkg-debt').value = Math.max(0, need - paid);
    }

    document.getElementById('pkg-save-btn').addEventListener('click', () => {
      const name = document.getElementById('pkg-name').value;
      const price = parseFloat(document.getElementById('pkg-price').value) || 0;
      const from = document.getElementById('pkg-from').value;
      const to = document.getElementById('pkg-to').value;
      const regStatus = document.getElementById('pkg-reg-status').value;
      if (!name || !price || !from || !to || !regStatus) {
        window.GymApp.toast('Vui lòng điền đầy đủ các trường bắt buộc (*)', 'error');
        return;
      }
      if (new Date(to) < new Date(from)) {
        window.GymApp.toast('Ngày kết thúc không được nhỏ hơn ngày bắt đầu', 'error');
        return;
      }
      const statusMap = { paid: 'Đã thanh toán', debt: 'Còn nợ', free: 'Miễn phí' };
      const paid = parseFloat(document.getElementById('pkg-paid').value) || 0;
      const newPackage = {
        id: `PKH-${Date.now()}`,
        name,
        price,
        from,
        to,
        status: statusMap[regStatus] || 'Đã thanh toán',
        discountCode: document.getElementById('pkg-discount-code').value.trim(),
        needPay: parseFloat(document.getElementById('pkg-need-pay').value) || 0,
        paid,
        debt: parseFloat(document.getElementById('pkg-debt').value) || 0,
        paymentDate: document.getElementById('pkg-payment-date').value,
        note: document.getElementById('pkg-note').value.trim() || 'Gói vừa thêm',
      };
      self._memberPackageHistory[m.id] = [newPackage, ...(self._memberPackageHistory[m.id] || [])];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(from) <= today && today <= new Date(to)) {
        m.package = name;
        m.expireDate = to;
        m.status = 'active';
        self._applyMemberFilter();
      }
      window.GymApp.toast('Đã lưu gói tập thành công!', 'success');
      close();
      if (typeof onSaved === 'function') onSaved();
    });
  },

  // ===== MODAL ĐĂNG KÝ LỊCH TẬP PT =====
  _showAddScheduleModal: function (m, onSaved) {
    document.getElementById('gym-sub-modal')?.remove();

    const REQ = `<span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>`;
    const inputCls = `class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;"`;

    // Generate time slots 00:00 → 23:45 per 15 min
    const timeSlots = [];
    for (let h = 0; h < 24; h++) {
      for (let mn = 0; mn < 60; mn += 15) {
        timeSlots.push(`${String(h).padStart(2,'0')}:${String(mn).padStart(2,'0')}`);
      }
    }

    const overlay = document.createElement('div');
    overlay.id = 'gym-sub-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);padding:16px;';

    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:16px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;position:relative;box-shadow:0 30px 80px rgba(0,0,0,0.4);">
        <div class="bg-surface-container-lowest border-b border-outline-variant px-loose py-standard flex items-center justify-between" style="position:sticky;top:0;z-index:1;">
          <div>
            <h3 class="font-bold text-on-surface" style="font-size:16px;">Đăng ký lịch tập PT</h3>
            <p class="text-on-surface-variant text-body-sm">Hội viên: <strong>${m.name}</strong></p>
          </div>
          <button id="close-sub-modal" style="background:transparent;border:none;cursor:pointer;">
            <span class="material-symbols-outlined text-on-surface-variant text-xl">close</span>
          </button>
        </div>
        <div class="p-loose flex flex-col gap-standard bg-surface-container-lowest">

          <!-- Chọn PT -->
          <div>
            <label class="block text-body-sm font-bold text-on-surface mb-xs">Huấn luyện viên ${REQ}</label>
            <select id="sch-pt" ${inputCls}>
              <option value="">— Chọn huấn luyện viên —</option>
              ${window.GymApp.data.pts.map(pt => `<option value="${pt.id}">${pt.name} — ${pt.specialty}</option>`).join('')}
            </select>
          </div>

          <!-- Chọn ngày -->
          <div>
            <label class="block text-body-sm font-bold text-on-surface mb-xs">Chọn ngày ${REQ}</label>
            <input id="sch-date" type="date" value="${new Date().toISOString().split('T')[0]}" min="${new Date().toISOString().split('T')[0]}" ${inputCls} />
          </div>

          <!-- Chọn giờ -->
          <div>
            <label class="block text-body-sm font-bold text-on-surface mb-xs">Chọn giờ bắt đầu ${REQ}</label>
            <div id="sch-time-display" class="text-body-sm mb-compact" style="min-height:18px;color:#6e7a6b;">Chưa chọn giờ</div>
            <div style="border:1px solid #becab9;border-radius:10px;overflow:hidden;max-height:210px;overflow-y:auto;">
              <div class="time-slot-grid" style="display:grid;grid-template-columns:repeat(8,1fr);gap:3px;padding:8px;">
                ${timeSlots.map(t => `
                  <button class="time-slot-btn" data-time="${t}"
                    style="padding:5px 1px;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.15s;text-align:center;line-height:1.3;">
                    ${t}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Ghi chú -->
          <div>
            <label class="block text-body-sm font-bold text-on-surface mb-xs">Ghi chú</label>
            <input id="sch-note" type="text" placeholder="Ghi chú thêm (không bắt buộc)..." ${inputCls} />
          </div>

          <p class="text-on-surface-variant" style="font-size:11px;">Các trường có dấu <span style="color:#ba1a1a;font-weight:700;">*</span> là bắt buộc</p>

          <div class="flex gap-standard">
            <button id="sch-cancel-btn" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Hủy</button>
            <button id="sch-save-btn" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#1D9336;">Đăng ký</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    let selectedTime = '';

    overlay.querySelectorAll('.time-slot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.time-slot-btn').forEach(b => {
          b.style.transform = 'scale(1)';
          b.classList.remove('is-selected');
        });
        btn.style.transform = 'scale(1.05)';
        btn.classList.add('is-selected');
        selectedTime = btn.dataset.time;
        const display = document.getElementById('sch-time-display');
        display.textContent = `Đã chọn: ${selectedTime}`;
        display.style.color = '#1D9336';
        display.style.fontWeight = '700';
      });
    });

    const close = () => overlay.remove();
    document.getElementById('close-sub-modal').addEventListener('click', close);
    document.getElementById('sch-cancel-btn').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('sch-save-btn').addEventListener('click', () => {
      const pt = document.getElementById('sch-pt').value;
      const date = document.getElementById('sch-date').value;
      if (!pt || !date || !selectedTime) {
        window.GymApp.toast('Vui lòng chọn đầy đủ PT, ngày và giờ (*)', 'error');
        return;
      }
      const trainer = window.GymApp.data.pts.find(x => x.id === pt);
      const [hour, minute] = selectedTime.split(':').map(Number);
      const end = new Date(`${date}T${selectedTime}:00`);
      end.setMinutes(end.getMinutes() + 60);
      const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
      window.GymApp.data.ptSchedules = window.GymApp.data.ptSchedules || [];
      window.GymApp.data.ptSchedules.push({
        id: `SCH-${String(window.GymApp.data.ptSchedules.length + 1).padStart(3, '0')}-${Date.now()}`,
        ptId: pt,
        ptName: trainer ? trainer.name : pt,
        memberId: m.id,
        memberName: m.name,
        date,
        startTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        endTime,
        type: 'Cá nhân',
        status: 'pending',
        notes: document.getElementById('sch-note').value.trim(),
      });
      window.GymApp.toast('Đã đăng ký lịch tập thành công!', 'success');
      close();
      if (typeof onSaved === 'function') onSaved();
    });
  },

  // ===== MODAL CHI TIẾT PT =====
  _showPtModal: function (id) {
    const pt = window.GymApp.data.pts.find(x => x.id === id);
    if (!pt) return;
    const stars = Array.from({ length: 5 }, (_, i) =>
      `<span class="material-symbols-outlined text-sm" style="color:${i < Math.round(pt.rating) ? '#f59e0b' : '#becab9'};font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">star</span>`
    ).join('');
    window.GymApp.showModal(`
      <div class="p-loose">
        <div class="flex items-center gap-loose mb-loose pb-loose border-b border-outline-variant">
          ${window.GymApp.avatarImg(pt.avatar, pt.name, 'lg')}
          <div>
            <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">${pt.name}</h3>
            <p class="text-on-surface-variant text-body-sm">${pt.id} · Huấn luyện viên</p>
            <div class="flex items-center gap-atom mt-atom">${stars}<span class="ml-atom font-bold text-body-md text-on-surface">${pt.rating}/5</span></div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-standard">
          ${[
            ['Chuyên môn', pt.specialty], ['Kinh nghiệm', `${pt.experience} năm`],
            ['Số điện thoại', pt.phone], ['Email', pt.email],
            ['Buổi đã dạy', `${pt.sessions} buổi`], ['Ngày gia nhập', window.GymApp.formatDate(pt.joinDate)],
            ['Trạng thái', pt.status === 'active' ? 'Đang làm việc' : 'Nghỉ'],
          ].map(([label, val]) => `
            <div class="bg-surface-container p-standard rounded-lg">
              <p class="text-on-surface-variant text-body-sm font-bold uppercase tracking-wider mb-atom">${label}</p>
              <p class="text-on-surface text-body-md font-bold">${val || '—'}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `);
  },

  // ===== FILTER MODAL HỘI VIÊN =====
  _showFilterModal: function () {
    const self = this;
    document.getElementById('gym-filter-modal')?.remove();

    const packages = [...new Set(window.GymApp.data.members.map(m => m.package))];

    const radioGroup = (name, options, currentVal) =>
      options.map(([v, l]) => `
        <label class="flex items-center gap-compact cursor-pointer py-xs">
          <input type="radio" name="${name}" value="${v}" style="accent-color:#1D9336;width:16px;height:16px;" ${currentVal === v ? 'checked' : ''} />
          <span class="text-body-md text-on-surface" style="font-size:13px;">${l}</span>
        </label>
      `).join('');

    const overlay = document.createElement('div');
    overlay.id = 'gym-filter-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);padding:20px;';

    overlay.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl shadow-xl" style="width:360px;max-width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,0.35);">
        <div class="flex items-center justify-between px-loose py-standard border-b border-outline-variant">
          <h3 class="text-on-surface font-bold" style="font-size:16px;">Bộ lọc — Hội viên</h3>
          <button id="close-filter-modal" class="material-symbols-outlined text-on-surface-variant hover:text-on-surface text-xl p-atom rounded hover:bg-surface-container transition-colors" style="background:transparent;border:none;cursor:pointer;">close</button>
        </div>
        <div class="px-loose py-standard border-b border-outline-variant">
          <h4 class="text-on-surface font-bold mb-compact" style="font-size:14px;">Gói tập</h4>
          <div class="grid grid-cols-2 gap-xs">
            ${radioGroup('f-pkg', [['', 'Tất cả'], ...packages.map(p => [p, p])], self._filterState.pkg)}
          </div>
        </div>
        <div class="px-loose py-standard border-b border-outline-variant">
          <h4 class="text-on-surface font-bold mb-compact" style="font-size:14px;">Trạng thái</h4>
          <div class="grid grid-cols-2 gap-xs">
            ${radioGroup('f-status', [['','Tất cả'],['active','Đang hoạt động'],['inactive','Không hoạt động'],['expired','Hết hạn']], self._filterState.status)}
          </div>
        </div>
        <div class="px-loose py-standard border-b border-outline-variant">
          <h4 class="text-on-surface font-bold mb-compact" style="font-size:14px;">Giới tính</h4>
          <div class="flex gap-loose">
            ${radioGroup('f-gender', [['','Tất cả'],['Nam','Nam'],['Nữ','Nữ']], self._filterState.gender)}
          </div>
        </div>
        <div class="flex gap-standard px-loose py-standard">
          <button id="filter-reset-btn" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Đặt lại</button>
          <button id="filter-apply-btn" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#1D9336;">Áp dụng</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('close-filter-modal')?.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });

    document.getElementById('filter-reset-btn')?.addEventListener('click', () => {
      overlay.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = r.value === ''; });
    });

    document.getElementById('filter-apply-btn')?.addEventListener('click', () => {
      self._filterState.pkg    = overlay.querySelector('input[name="f-pkg"]:checked')?.value || '';
      self._filterState.status = overlay.querySelector('input[name="f-status"]:checked')?.value || '';
      self._filterState.gender = overlay.querySelector('input[name="f-gender"]:checked')?.value || '';
      self._memberPage = 1;
      self._applyMemberFilter();
      close();
    });
  },

  // ===== FILTER MODAL PT =====
  _showPtFilterModal: function () {
    const self = this;
    document.getElementById('gym-pt-filter-modal')?.remove();

    const specialties = [...new Set(window.GymApp.data.pts.map(p => p.specialty))];

    const radioGroup = (name, options, currentVal) =>
      options.map(([v, l]) => `
        <label class="flex items-center gap-compact cursor-pointer py-xs">
          <input type="radio" name="${name}" value="${v}" style="accent-color:#1D9336;width:16px;height:16px;" ${currentVal === v ? 'checked' : ''} />
          <span class="text-body-md text-on-surface" style="font-size:13px;">${l}</span>
        </label>
      `).join('');

    const overlay = document.createElement('div');
    overlay.id = 'gym-pt-filter-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);padding:20px;';

    overlay.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl shadow-xl" style="width:360px;max-width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,0.35);">
        <div class="flex items-center justify-between px-loose py-standard border-b border-outline-variant">
          <h3 class="text-on-surface font-bold" style="font-size:16px;">Bộ lọc — Huấn luyện viên</h3>
          <button id="close-pt-filter-modal" class="material-symbols-outlined text-on-surface-variant hover:text-on-surface text-xl p-atom rounded hover:bg-surface-container transition-colors" style="background:transparent;border:none;cursor:pointer;">close</button>
        </div>
        <div class="px-loose py-standard border-b border-outline-variant">
          <h4 class="text-on-surface font-bold mb-compact" style="font-size:14px;">Chuyên môn</h4>
          <div class="grid grid-cols-2 gap-xs">
            ${radioGroup('pt-f-spec', [['', 'Tất cả'], ...specialties.map(s => [s, s])], self._ptFilterState.specialty)}
          </div>
        </div>
        <div class="px-loose py-standard border-b border-outline-variant">
          <h4 class="text-on-surface font-bold mb-compact" style="font-size:14px;">Trạng thái</h4>
          <div class="grid grid-cols-2 gap-xs">
            ${radioGroup('pt-f-status', [['','Tất cả'],['active','Đang làm việc'],['inactive','Nghỉ']], self._ptFilterState.status)}
          </div>
        </div>
        <div class="flex gap-standard px-loose py-standard">
          <button id="pt-filter-reset-btn" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Đặt lại</button>
          <button id="pt-filter-apply-btn" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#1D9336;">Áp dụng</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('close-pt-filter-modal')?.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });

    document.getElementById('pt-filter-reset-btn')?.addEventListener('click', () => {
      overlay.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = r.value === ''; });
    });

    document.getElementById('pt-filter-apply-btn')?.addEventListener('click', () => {
      self._ptFilterState.specialty = overlay.querySelector('input[name="pt-f-spec"]:checked')?.value || '';
      self._ptFilterState.status    = overlay.querySelector('input[name="pt-f-status"]:checked')?.value || '';
      self._ptPage = 1;
      self._applyPtFilter();
      close();
    });
  },

  // ===== SORT MODAL PT =====
  _showPtSortModal: function () {
    const self = this;
    document.getElementById('gym-pt-sort-modal')?.remove();

    const options = [
      ['', 'Mặc định'],
      ['name-asc', 'Tên A → Z'],
      ['name-desc', 'Tên Z → A'],
      ['rating-desc', 'Đánh giá cao nhất'],
      ['experience-desc', 'Kinh nghiệm nhiều nhất'],
      ['sessions-desc', 'Buổi đã dạy nhiều nhất'],
      ['joinDate-desc', 'Ngày gia nhập mới nhất'],
    ];

    const overlay = document.createElement('div');
    overlay.id = 'gym-pt-sort-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);padding:20px;';

    overlay.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl shadow-xl" style="width:360px;max-width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,0.35);">
        <div class="flex items-center justify-between px-loose py-standard border-b border-outline-variant">
          <h3 class="text-on-surface font-bold" style="font-size:16px;">Sắp xếp — Huấn luyện viên</h3>
          <button id="close-pt-sort-modal" class="material-symbols-outlined text-on-surface-variant hover:text-on-surface text-xl p-atom rounded hover:bg-surface-container transition-colors" style="background:transparent;border:none;cursor:pointer;">close</button>
        </div>
        <div class="px-loose py-standard border-b border-outline-variant">
          <div class="flex flex-col gap-xs">
            ${options.map(([value, label]) => `
              <label class="flex items-center gap-compact cursor-pointer py-xs">
                <input type="radio" name="pt-sort" value="${value}" style="accent-color:#1D9336;width:16px;height:16px;" ${self._ptSortState === value ? 'checked' : ''} />
                <span class="text-body-md text-on-surface" style="font-size:13px;">${label}</span>
              </label>
            `).join('')}
          </div>
        </div>
        <div class="flex gap-standard px-loose py-standard">
          <button id="pt-sort-reset-btn" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Đặt lại</button>
          <button id="pt-sort-apply-btn" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#1D9336;">Áp dụng</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('close-pt-sort-modal')?.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });

    document.getElementById('pt-sort-reset-btn')?.addEventListener('click', () => {
      const defaultSort = overlay.querySelector('input[name="pt-sort"][value=""]');
      if (defaultSort) defaultSort.checked = true;
    });

    document.getElementById('pt-sort-apply-btn')?.addEventListener('click', () => {
      self._ptSortState = overlay.querySelector('input[name="pt-sort"]:checked')?.value || '';
      self._ptPage = 1;
      self._applyPtFilter();
      close();
    });
  },

  // ===== UI HELPERS =====
  _updateFilterUI: function () {
    const count = (this._filterState.status ? 1 : 0) + (this._filterState.pkg ? 1 : 0) + (this._filterState.gender ? 1 : 0);
    const badge = document.getElementById('filter-badge');
    const showAll = document.getElementById('btn-show-all');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
    if (showAll) { showAll.classList.toggle('hidden', count === 0); showAll.classList.toggle('flex', count > 0); }
  },

  _updatePtFilterUI: function () {
    const count = (this._ptFilterState.specialty ? 1 : 0) + (this._ptFilterState.status ? 1 : 0);
    const badge = document.getElementById('pt-filter-badge');
    const showAll = document.getElementById('btn-show-all-pt');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
    if (showAll) { showAll.classList.toggle('hidden', count === 0); showAll.classList.toggle('flex', count > 0); }
  },

  _updatePtSortUI: function () {
    const badge = document.getElementById('pt-sort-badge');
    if (badge) badge.style.display = this._ptSortState ? 'flex' : 'none';
  },

  _switchTab: function (tab) {
    this._tab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const active = btn.dataset.tab === tab;
      btn.style.background = active ? '#1D9336' : 'transparent';
      btn.style.color = active ? '#fff' : '#3f4a3c';
    });
    document.getElementById('tab-content-members').classList.toggle('hidden', tab !== 'members');
    document.getElementById('tab-content-pts').classList.toggle('hidden', tab !== 'pts');
  },

  // ===== FILTER LOGIC =====
  _applyMemberFilter: function () {
    const q = document.getElementById('member-search')?.value.toLowerCase() || '';
    const { status, pkg, gender } = this._filterState;
    const rawMembers = window.GymApp.data.members;
    const members = Array.isArray(rawMembers) ? rawMembers : [];
    this._memberFiltered = members.filter(m => {
      const matchQ = !q || (m.ho_ten || '').toLowerCase().includes(q) || (m.ma_ho_so || '').toLowerCase().includes(q) || (m.so_dien_thoai || '').includes(q);
      return matchQ && (!status || m.trang_thai === status) && (!pkg || m.ten_goi_tap === pkg) && (!gender || m.gioi_tinh === gender);
    });
    this._memberPage = 1;
    this._refreshMemberTable();
    this._updateFilterUI();
  },

  _sortPtList: function (list) {
    const sorted = [...list];
    switch (this._ptSortState) {
      case 'name-asc':
        return sorted.sort((a, b) => (a.ho_ten || '').localeCompare(b.ho_ten || '', 'vi'));
      case 'name-desc':
        return sorted.sort((a, b) => (b.ho_ten || '').localeCompare(a.ho_ten || '', 'vi'));
      case 'rating-desc':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'experience-desc':
        return sorted.sort((a, b) => (b.experience || 0) - (a.experience || 0));
      case 'sessions-desc':
        return sorted.sort((a, b) => (b.sessions || 0) - (a.sessions || 0));
      case 'joinDate-desc':
        return sorted.sort((a, b) => new Date(b.ngay_tao) - new Date(a.ngay_tao));
      default:
        return sorted;
    }
  },

  _applyPtFilter: function () {
    const q = document.getElementById('pt-search')?.value.toLowerCase() || '';
    const { specialty, status } = this._ptFilterState;
    this._ptFiltered = this._sortPtList((window.GymApp.data.pts || []).filter(pt => {
      const name = (pt.ho_ten || '').toLowerCase();
      const spec = (pt.chuyen_mon || '').toLowerCase();
      const matchQ = !q || name.includes(q) || spec.includes(q);
      const matchS = !status || pt.trang_thai === status || pt.status === status;
      const matchSpec = !specialty || pt.chuyen_mon === specialty || pt.specialty === specialty;
      return matchQ && matchSpec && matchS;
    }));
    this._ptPage = 1;
    this._refreshPtTable();
    this._updatePtFilterUI();
    this._updatePtSortUI();
  },

  // ===== REFRESH =====
  _refreshMemberTable: function () {
    const c = document.getElementById('members-table-container');
    if (c) { c.innerHTML = this._renderMemberTable(); this._bindMemberTableEvents(); }
  },

  _refreshPtTable: function () {
    const c = document.getElementById('pt-table-container');
    if (c) { c.innerHTML = this._renderPtTable(); this._bindPtTableEvents(); }
  },

  _bindMemberTableEvents: function () {
    const self = this;
    document.querySelectorAll('.member-name-link, .member-view-btn').forEach(el => {
      el.addEventListener('click', () => self._showMemberModal(el.dataset.id));
    });
  },

  _bindPtTableEvents: function () {
    const self = this;
    document.querySelectorAll('.pt-name-link, .pt-view-btn').forEach(el => {
      el.addEventListener('click', () => self._showPtModal(el.dataset.id));
    });
  },

  _setupPgHandler: function () {
    const self = this;
    window.GymApp._pgHandler = function (pg) {
      if (self._tab === 'members') {
        self._memberPage = pg;
        self._refreshMemberTable();
      } else {
        self._ptPage = pg;
        self._refreshPtTable();
      }
    };
  },

  init: function () {
    const self = this;
    this._memberPage = 1;
    this._ptPage = 1;

    // Sử dụng dữ liệu đã được app.js nạp sẵn
    this._memberFiltered = [...(window.GymApp.data.members || [])];
    this._ptFiltered = [...(window.GymApp.data.pts || [])];

    this._setupPgHandler();
    this._bindMemberTableEvents();
    this._bindPtTableEvents();

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => self._switchTab(btn.dataset.tab));
    });

    // Re-render tables with new data
    this._refreshMemberTable();
    this._refreshPtTable();
    
    self._switchTab(self._tab);

    // Search
    document.getElementById('member-search')?.addEventListener('input', () => self._applyMemberFilter());
    document.getElementById('pt-search')?.addEventListener('input', () => self._applyPtFilter());

    // --- Hội viên buttons ---
    document.getElementById('btn-view-all-members')?.addEventListener('click', () => {
      self._filterState = { status: '', pkg: '', gender: '' };
      const s = document.getElementById('member-search');
      if (s) s.value = '';
      self._memberFiltered = [...window.GymApp.data.members];
      self._memberPage = 1;
      self._refreshMemberTable();
      self._updateFilterUI();
      window.GymApp.toast(`Hiển thị tất cả ${window.GymApp.data.members.length} hội viên`, 'info');
    });

    document.getElementById('btn-show-all')?.addEventListener('click', () => {
      self._filterState = { status: '', pkg: '', gender: '' };
      const s = document.getElementById('member-search');
      if (s) s.value = '';
      self._memberFiltered = [...window.GymApp.data.members];
      self._memberPage = 1;
      self._refreshMemberTable();
      self._updateFilterUI();
    });

    document.getElementById('btn-filter')?.addEventListener('click', () => self._showFilterModal());

    // --- PT buttons ---
    document.getElementById('btn-view-all-pts')?.addEventListener('click', () => {
      self._ptFilterState = { specialty: '', status: '' };
      self._ptSortState = '';
      const s = document.getElementById('pt-search');
      if (s) s.value = '';
      self._ptFiltered = [...window.GymApp.data.pts];
      self._ptPage = 1;
      self._refreshPtTable();
      self._updatePtFilterUI();
      self._updatePtSortUI();
      window.GymApp.toast(`Hiển thị tất cả ${window.GymApp.data.pts.length} huấn luyện viên`, 'info');
    });

    document.getElementById('btn-show-all-pt')?.addEventListener('click', () => {
      self._ptFilterState = { specialty: '', status: '' };
      const s = document.getElementById('pt-search');
      if (s) s.value = '';
      self._ptFiltered = [...window.GymApp.data.pts];
      self._ptPage = 1;
      self._refreshPtTable();
      self._updatePtFilterUI();
    });

    document.getElementById('btn-filter-pt')?.addEventListener('click', () => self._showPtFilterModal());
    document.getElementById('btn-sort-pt')?.addEventListener('click', () => self._showPtSortModal());
    self._updatePtSortUI();
  }
};
