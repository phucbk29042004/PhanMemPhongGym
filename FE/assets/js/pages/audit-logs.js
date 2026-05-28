window.GymApp.pages['audit-logs'] = {
  // Trạng thái bộ lọc và phân trang
  currentFilterRole: 'all', // 'all', 'admin', 'le_tan', 'pt', 'hoi_vien'
  currentAction: '',
  searchKeyword: '',
  fromDate: '',
  toDate: '',

  currentPageNum: 1,
  limitPerPage: 10, // Giới hạn 10 record trên một trang

  // Dữ liệu cache
  logs: [],
  actions: [],
  pagination: null,

  // Thống kê nhanh
  stats: {
    total: 0,
    admin: 0,
    le_tan: 0,
    pt: 0,
    hoi_vien: 0
  },

  // Bản đồ dịch đối tượng dữ liệu sang Tiếng Việt
  objectTranslations: {
    'ho_so': 'Hồ sơ',
    'goi_tap': 'Gói tập Gym',
    'goi_pt': 'Gói tập PT',
    'lich_tap': 'Lịch tập',
    'dang_ky_goi_tap': 'Đăng ký gói',
    'dang_ky_pt': 'Đăng ký PT',
    'luot_vao_ra': 'Lượt vào ra',
    'tai_khoan': 'Tài khoản',
    'pt_toi_nhat_ky': 'PT & Tôi',
    'danh_gia_pt': 'Đánh giá PT'
  },

  translateObject: function (obj) {
    if (!obj) return '—';
    return this.objectTranslations[obj] || obj;
  },

  // Bản đồ dịch hành động sang Tiếng Việt
  actionTranslations: {
    'CREATE': 'Thêm mới',
    'UPDATE': 'Cập nhật',
    'DELETE': 'Xóa',
    'LOGIN': 'Đăng nhập',
    'LOGOUT': 'Đăng xuất',
    'CHECKIN': 'Điểm danh',
    'NOTIFY': 'Gửi thông báo',
    'CONFIG': 'Cấu hình'
  },

  translateAction: function (act) {
    if (!act) return '—';
    if (this.actionTranslations[act]) return this.actionTranslations[act];
    let translated = act;
    Object.keys(this.actionTranslations).forEach(key => {
      if (translated.includes(key)) {
        translated = translated.replace(key, this.actionTranslations[key]);
      }
    });
    return translated;
  },

  // Nhãn hành động
  getActionBadge: function (action) {
    let cls = 'bg-surface-container-highest text-on-surface';
    if (action.includes('CREATE') || action.includes('ADD') || action.includes('REGISTER')) {
      cls = 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20';
    } else if (action.includes('UPDATE') || action.includes('EDIT')) {
      cls = 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20';
    } else if (action.includes('DELETE') || action.includes('REMOVE') || action.includes('CANCEL')) {
      cls = 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20';
    } else if (action.includes('LOGIN')) {
      cls = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20';
    } else if (action.includes('CHECKIN')) {
      cls = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20';
    }
    return `<span class="text-body-sm font-extrabold px-2 py-0.5 rounded-full ${cls}">${this.translateAction(action)}</span>`;
  },

  // Bản đồ nhãn vai trò và class styling
  roleLabels: {
    admin: { label: 'Quản trị viên', class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    le_tan: { label: 'Lễ tân', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    pt: { label: 'HLV / PT', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
    hoi_vien: { label: 'Hội viên', class: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' }
  },

  render: function () {
    const self = this;

    return `
      <div class="flex flex-col gap-standard animate-fadeIn">
        
        <!-- Header Actions (Chỉ có nút tải dữ liệu) -->
        <div class="flex justify-end items-center mb-0.5">
          <button id="btn-refresh-audit" class="btn-primary text-white px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95 text-body-md">
            <span class="material-symbols-outlined text-[16px] animate-hover-spin">refresh</span>
            Tải lại dữ liệu
          </button>
        </div>

        <!-- Filter Card (Các bộ lọc gom cùng 1 hàng bên dưới) -->
        <div class="bg-white dark:bg-[#1e1e1e] p-standard rounded-2xl border border-outline-variant/50 shadow-sm flex flex-col gap-2.5">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-standard">
            
            <!-- Search Keyword -->
            <div>
              <label class="text-xs font-bold text-on-surface-variant mb-1 block uppercase tracking-wider">Từ khóa tìm kiếm</label>
              <div class="relative group">
                <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">search</span>
                <input id="audit-filter-keyword" type="text" value="${self.searchKeyword}" placeholder="Tài khoản, họ tên, ghi chú..." class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-8 pr-2.5 py-2 rounded-xl text-body-md outline-none focus:border-brand-primary transition-all" />
              </div>
            </div>

            <!-- Role Select Dropdown -->
            <div>
              <label class="text-xs font-bold text-on-surface-variant mb-1 block uppercase tracking-wider">Vai trò thực hiện</label>
              <select id="audit-filter-role" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-2.5 py-2 rounded-xl text-body-md outline-none focus:border-brand-primary transition-all">
                <option value="all" ${self.currentFilterRole === 'all' ? 'selected' : ''}>Xem tất cả vai trò</option>
                <option value="admin" ${self.currentFilterRole === 'admin' ? 'selected' : ''}>Quản trị viên</option>
                <option value="le_tan" ${self.currentFilterRole === 'le_tan' ? 'selected' : ''}>Lễ tân</option>
                <option value="pt" ${self.currentFilterRole === 'pt' ? 'selected' : ''}>Huấn luyện viên</option>
                <option value="hoi_vien" ${self.currentFilterRole === 'hoi_vien' ? 'selected' : ''}>Hội viên</option>
              </select>
            </div>

            <!-- Action Type Select -->
            <div>
              <label class="text-xs font-bold text-on-surface-variant mb-1 block uppercase tracking-wider">Loại hành động</label>
              <select id="audit-filter-action" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-2.5 py-2 rounded-xl text-body-md outline-none focus:border-brand-primary transition-all">
                <option value="">Tất cả hành động</option>
                ${self.actions.map(act => `<option value="${act}" ${self.currentAction === act ? 'selected' : ''}>${self.translateAction(act)}</option>`).join('')}
              </select>
            </div>

            <!-- From Date Picker -->
            <div>
              <label class="text-xs font-bold text-on-surface-variant mb-1 block uppercase tracking-wider">Từ ngày</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">calendar_today</span>
                <input id="audit-filter-from-date" type="date" value="${self.fromDate}" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-8 pr-2.5 py-2 rounded-xl text-body-md outline-none focus:border-brand-primary transition-all" />
              </div>
            </div>

            <!-- To Date Picker -->
            <div>
              <label class="text-xs font-bold text-on-surface-variant mb-1 block uppercase tracking-wider">Đến ngày</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">calendar_today</span>
                <input id="audit-filter-to-date" type="date" value="${self.toDate}" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-8 pr-2.5 py-2 rounded-xl text-body-md outline-none focus:border-brand-primary transition-all" />
              </div>
            </div>

          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2 justify-end border-t border-outline-variant/20 pt-2">
            <button id="btn-reset-filters" class="px-4 py-2 rounded-xl text-body-md font-bold text-on-surface-variant hover:bg-surface-container transition-all">Đặt lại</button>
          </div>
        </div>

        <!-- Logs Table -->
        <div class="bg-white dark:bg-[#1e1e1e] rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden flex flex-col">
          <div class="overflow-x-auto" style="scrollbar-width: thin; scrollbar-color: var(--outline-variant) transparent;">
            <table class="w-full text-left border-collapse table-auto">
              <thead>
                <tr class="h-10 border-b border-outline-variant/40 bg-surface-container-low/10">
                  <th class="px-4 font-bold text-on-surface-variant uppercase tracking-wider text-xs whitespace-nowrap">Thời điểm</th>
                  <th class="px-4 font-bold text-on-surface-variant uppercase tracking-wider text-xs whitespace-nowrap">Tài khoản thực hiện</th>
                  <th class="px-4 font-bold text-on-surface-variant uppercase tracking-wider text-xs whitespace-nowrap">Vai trò</th>
                  <th class="px-4 font-bold text-on-surface-variant uppercase tracking-wider text-xs whitespace-nowrap">Hành động</th>
                  <th class="px-4 font-bold text-on-surface-variant uppercase tracking-wider text-xs whitespace-nowrap">Đối tượng tác động</th>
                  <th class="px-4 font-bold text-on-surface-variant uppercase tracking-wider text-xs">Ghi chú chi tiết</th>
                </tr>
              </thead>
              <tbody id="audit-table-tbody" class="divide-y divide-outline-variant/30">
                <!-- Body được render qua hàm _renderTableRows() -->
              </tbody>
            </table>
          </div>
          
          <!-- Pagination -->
          <div id="audit-pagination-container">
            <!-- Phân trang render qua _renderPagination() -->
          </div>
        </div>

      </div>
    `;
  },

  _renderTableRows: function () {
    const self = this;

    // Lọc danh sách theo từ khóa tìm kiếm (local filter)
    let displayLogs = self.logs;
    if (self.searchKeyword) {
      const kw = self.searchKeyword.toLowerCase();
      displayLogs = self.logs.filter(log => {
        let actorUser = log.ten_dang_nhap || 'system';
        let actorName = log.ho_ten || 'Hệ thống';
        if (actorUser === 'system') {
          actorUser = 'admin';
          actorName = 'Quản trị viên';
        }
        
        const objTrans = self.translateObject(log.doi_tuong).toLowerCase();
        const actTrans = self.translateAction(log.hanh_dong).toLowerCase();
        
        return (
          actorUser.toLowerCase().includes(kw) ||
          actorName.toLowerCase().includes(kw) ||
          (log.ghi_chu || '').toLowerCase().includes(kw) ||
          objTrans.includes(kw) ||
          actTrans.includes(kw)
        );
      });
    }

    if (displayLogs.length === 0) {
      return `
        <tr>
          <td colspan="6" class="text-center py-16 text-on-surface-variant text-body-md" style="font-size: 14px;">
            <div style="display:flex;flex-direction:column;align-items:center;opacity:0.4;">
              <span class="material-symbols-outlined text-[36px] text-outline mb-2">history</span>
              <p style="font-weight:600;margin:0;">Không tìm thấy lịch sử hoạt động phù hợp.</p>
            </div>
          </td>
        </tr>
      `;
    }

    return displayLogs.map(log => {
      let tenDangNhap = log.ten_dang_nhap || 'system';
      let vaiTro = log.vai_tro || 'system';
      let hoTen = log.ho_ten || '';

      if (tenDangNhap === 'system') {
        tenDangNhap = 'admin';
        vaiTro = 'admin';
        hoTen = 'Quản trị viên';
      }

      const roleStyle = self.roleLabels[vaiTro] || { label: vaiTro, class: 'bg-surface-container text-on-surface-variant' };
      const formattedTime = log.thoi_diem ? new Date(log.thoi_diem).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
      const actorName = hoTen || tenDangNhap;

      return `
        <tr class="h-12 hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10 transition-colors text-body-md border-b border-outline-variant/30 bg-white dark:bg-[#1e1e1e] odd:bg-[#fafafa] odd:dark:bg-[#15171e]">
          <td class="px-4 font-medium text-on-surface-variant/90 border-r border-outline-variant/20 whitespace-nowrap" style="padding: 8px 14px; font-size: 14px;">${formattedTime}</td>
          <td class="px-4 border-r border-outline-variant/20 font-bold text-on-surface" style="padding: 8px 14px; font-size: 14px;">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-[10px] text-brand-primary font-bold flex-shrink-0">
                ${tenDangNhap.slice(0, 2).toUpperCase()}
              </span>
              <div class="flex flex-col leading-tight min-w-0">
                <span class="truncate max-w-[150px]" title="${actorName}" style="font-size: 14px; font-weight: 700;">${actorName}</span>
                <span class="text-xs text-on-surface-variant/60 font-normal">@${tenDangNhap}</span>
              </div>
            </div>
          </td>
          <td class="px-4 border-r border-outline-variant/20 whitespace-nowrap" style="padding: 8px 14px; font-size: 14px;">
            <span class="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${roleStyle.class}">
              ${roleStyle.label}
            </span>
          </td>
          <td class="px-4 border-r border-outline-variant/20 whitespace-nowrap" style="padding: 8px 14px; font-size: 14px;">${self.getActionBadge(log.hanh_dong)}</td>
          <td class="px-4 border-r border-outline-variant/20" style="padding: 8px 14px; font-size: 14px;">
            <div class="flex flex-col leading-tight">
              <span style="font-weight: 700;">${self.translateObject(log.doi_tuong)}</span>
              ${log.doi_tuong_id ? `<span class="text-xs text-brand-primary font-bold mt-0.5">ID: #${log.doi_tuong_id}</span>` : ''}
            </div>
          </td>
          <td class="px-4 text-on-surface-variant/80 font-medium" style="padding: 8px 14px; font-size: 14px; word-break: break-word;">
            ${log.ghi_chu || '—'}
          </td>
        </tr>
      `;
    }).join('');
  },

  _renderPaginationOnly: function () {
    const self = this;
    const container = document.getElementById('audit-pagination-container');
    if (container && self.pagination) {
      container.innerHTML = window.GymApp.renderPagination(self.pagination.page, self.pagination.total, self.pagination.limit, null);
      
      // Gắn lại sự kiện phân trang
      container.querySelectorAll('[data-pg]').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetPage = parseInt(btn.dataset.pg);
          if (!isNaN(targetPage) && targetPage > 0) {
            self.currentPageNum = targetPage;
            self._loadData({ keepDOM: true });
          }
        });
      });
    }
  },

  init: function () {
    const self = this;

    // Tải dữ liệu ban đầu nếu chưa có
    if (self.logs.length === 0) {
      self._loadData();
      return;
    }

    // Render hàng loạt hàng dữ liệu vào body
    const tbody = document.getElementById('audit-table-tbody');
    if (tbody) tbody.innerHTML = self._renderTableRows();
    self._renderPaginationOnly();

    // 1. Tự động tìm kiếm tức thì khi gõ từ khóa
    const searchInput = document.getElementById('audit-filter-keyword');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        self.searchKeyword = e.target.value.trim();
        if (tbody) tbody.innerHTML = self._renderTableRows();
      });
    }

    // 2. Tự động reload từ API khi chọn vai trò
    const roleSelect = document.getElementById('audit-filter-role');
    if (roleSelect) {
      roleSelect.addEventListener('change', (e) => {
        self.currentFilterRole = e.target.value;
        self.currentPageNum = 1;
        self._loadData({ keepDOM: true });
      });
    }

    // 3. Tự động reload từ API khi chọn hành động
    const actionSelect = document.getElementById('audit-filter-action');
    if (actionSelect) {
      actionSelect.addEventListener('change', (e) => {
        self.currentAction = e.target.value;
        self.currentPageNum = 1;
        self._loadData({ keepDOM: true });
      });
    }

    // 4. Lắng nghe thay đổi từ ngày/đến ngày từ AirDatepicker
    const fromDateInput = document.getElementById('audit-filter-from-date');
    const toDateInput = document.getElementById('audit-filter-to-date');

    const handleDateChange = () => {
      self.fromDate = fromDateInput.value;
      self.toDate = toDateInput.value;
      self.currentPageNum = 1;
      self._loadData({ keepDOM: true });
    };

    if (fromDateInput) fromDateInput.addEventListener('change', handleDateChange);
    if (toDateInput) toDateInput.addEventListener('change', handleDateChange);

    // 5. Gắn sự kiện nút Refresh
    document.getElementById('btn-refresh-audit')?.addEventListener('click', () => {
      self._loadData({ keepDOM: true });
    });

    // 6. Sự kiện nút Đặt lại bộ lọc
    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (roleSelect) roleSelect.value = 'all';
      if (actionSelect) actionSelect.value = '';
      if (fromDateInput) fromDateInput.value = '';
      if (toDateInput) toDateInput.value = '';

      self.searchKeyword = '';
      self.currentFilterRole = 'all';
      self.currentAction = '';
      self.fromDate = '';
      self.toDate = '';
      self.currentPageNum = 1;
      self._loadData({ keepDOM: true });
    });
  },

  // ===== PRIVATE HELPERS =====
  _loadData: async function (options = {}) {
    const self = this;
    const tbody = document.getElementById('audit-table-tbody');

    // Hiển thị trạng thái loading spinner nếu không giữ DOM
    if (!options.keepDOM && tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-16">
            <span class="material-symbols-outlined animate-spin text-brand-primary text-3xl mb-compact">autorenew</span>
            <p class="text-on-surface-variant text-body-sm mt-1">Đang tải nhật ký hệ thống...</p>
          </td>
        </tr>
      `;
    }

    try {
      // 1. Tải danh sách hành động (chỉ tải một lần)
      if (self.actions.length === 0) {
        const actRes = await window.GymApp.api.get('/audit/actions');
        if (actRes?.success) self.actions = actRes.data || [];
      }

      // 2. Xây dựng URL API với bộ lọc và phân trang
      let queryStr = `page=${self.currentPageNum}&limit=${self.limitPerPage}`;
      if (self.currentFilterRole !== 'all') queryStr += `&vai_tro=${self.currentFilterRole}`;
      if (self.currentAction) queryStr += `&hanh_dong=${encodeURIComponent(self.currentAction)}`;
      if (self.fromDate) queryStr += `&tu_ngay=${self.fromDate}`;
      if (self.toDate) queryStr += `&den_ngay=${self.toDate}`;

      const res = await window.GymApp.api.get(`/audit?${queryStr}`);
      if (res?.success) {
        self.logs = res.data.logs || [];
        self.pagination = res.data.pagination || null;

        // Tải stats thống kê tổng số lượng
        await self._loadStats();
      } else {
        window.GymApp.toast(res?.message || 'Không thể lấy dữ liệu nhật ký!', 'error');
      }
    } catch (err) {
      console.error(err);
      window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
    } finally {
      if (options.keepDOM) {
        if (tbody) tbody.innerHTML = self._renderTableRows();
        self._renderPaginationOnly();
      } else {
        self._refreshView();
      }
    }
  },

  _loadStats: async function () {
    const self = this;
    try {
      const [allRes, adminRes, letanRes, ptRes, hvRes] = await Promise.all([
        window.GymApp.api.get('/audit?limit=1'),
        window.GymApp.api.get('/audit?vai_tro=admin&limit=1'),
        window.GymApp.api.get('/audit?vai_tro=le_tan&limit=1'),
        window.GymApp.api.get('/audit?vai_tro=pt&limit=1'),
        window.GymApp.api.get('/audit?vai_tro=hoi_vien&limit=1')
      ]);

      self.stats.total = allRes?.data?.pagination?.total ?? 0;
      self.stats.admin = adminRes?.data?.pagination?.total ?? 0;
      self.stats.le_tan = letanRes?.data?.pagination?.total ?? 0;
      self.stats.pt = ptRes?.data?.pagination?.total ?? 0;
      self.stats.hoi_vien = hvRes?.data?.pagination?.total ?? 0;
    } catch (err) {
      console.error('Không thể cập nhật thống kê log:', err);
    }
  },

  _refreshView: function () {
    const self = this;
    const content = document.getElementById('content-area');
    if (content) {
      content.innerHTML = self.render();
      self.init();

      // Auto-initialize datepickers if available
      if (window.GymApp.initDatePickers) {
        window.GymApp.initDatePickers(content);
      }
    }
  },

  guideHtml: `
    <div class="space-y-4 text-xs">
      <div class="flex items-start gap-2 bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/10">
        <span class="material-symbols-outlined text-brand-primary text-base flex-shrink-0 mt-0.5">info</span>
        <p class="text-on-surface-variant leading-relaxed">Trang <strong>Nhật ký kiểm tra</strong> cho phép kiểm soát viên hoặc quản trị viên kiểm tra tất cả dấu vết thao tác của người dùng trong hệ thống (Tạo, Sửa, Xóa, Đăng nhập, Check-in...).</p>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">🔍 Phân luồng vai trò (Tabs):</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li><strong>Xem tất cả:</strong> Lọc hiển thị toàn bộ lịch sử không phân biệt vai trò.</li>
          <li><strong>Các tab vai trò cụ thể:</strong> Click vào các tab như **Quản trị viên**, **Lễ tân**, **Huấn luyện viên**, **Hội viên** để chỉ xem các hoạt động được thực hiện bởi người dùng có vai trò đó.</li>
        </ul>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">⚙️ Bộ lọc nâng cao:</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li><strong>Từ khóa tìm kiếm:</strong> Nhập tài khoản, họ tên hoặc nội dung ghi chú để tìm nhanh log cụ thể.</li>
          <li><strong>Loại hành động:</strong> Lọc theo các loại thao tác như LOGIN, CREATE_MEMBER, CHECKIN...</li>
          <li><strong>Khoảng thời gian:</strong> Nhập ngày bắt đầu và ngày kết thúc để giới hạn thời điểm ghi nhận hoạt động.</li>
        </ul>
      </div>
    </div>
  `
};
