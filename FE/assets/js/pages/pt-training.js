window.GymApp.pages['pt-training'] = {
  _keyword: '',
  _filterPt: '',
  _filterMember: '',
  _filterFrom: '',
  _filterTo: '',
  _filterStatus: '',
  _currentPage: 1,
  _daysPerPage: 3,
  _panelOpen: false,
  _collapsedDates: null,

  render: function () {
    const pts = window.GymApp.data.pts || [];
    const selectedBranch = window.GymApp.selectedBranch || '';
    const allSchedules = window.GymApp.data.ptSchedules || [];
    const schedules = selectedBranch ? allSchedules.filter(s => s.chi_nhanh_tap === selectedBranch) : allSchedules;
    const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];
    const todaySchedules = schedules.filter(s => s.ngay_tap === today);

    const timeSlots = [];
    for (let h = 0; h < 24; h++) {
      for (let mn = 0; mn < 60; mn += 15) {
        timeSlots.push(`${String(h).padStart(2, '0')}:${String(mn).padStart(2, '0')}`);
      }
    }

    const stats = [
      { label: 'Tổng PT', value: pts.length, icon: 'sports_gymnastics', iconBg: 'icon-bg-green', color: 'text-brand-primary' },
      { label: 'Lịch hôm nay', value: todaySchedules.length, icon: 'event_available', iconBg: 'icon-bg-green', color: 'text-brand-primary' },
      { label: 'Đã tập', value: todaySchedules.filter(s => s.trang_thai === 'da_tap').length, icon: 'check_circle', iconBg: 'icon-bg-green', color: 'text-brand-primary' },
      { label: 'Chờ tập', value: todaySchedules.filter(s => s.trang_thai === 'cho_tap' || s.trang_thai === 'pending').length, icon: 'pending', iconBg: 'icon-bg-orange', color: 'text-[#e65100]' },
    ];

    return `
      <style>
        .custom-scroll::-webkit-scrollbar { height: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #bdbdbd; }
        .dark .custom-scroll::-webkit-scrollbar-thumb { background: #424242; }
        .dark .custom-scroll::-webkit-scrollbar-thumb:hover { background: #616161; }
      </style>
      <div class="flex flex-col gap-lg">
        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-standard">
          ${stats.map(s => `
            <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-standard shadow-sm flex flex-col gap-standard hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div class="flex items-center justify-between">
                <span class="text-on-surface-variant text-body-sm font-bold uppercase tracking-wider leading-tight" style="max-width:calc(100% - 48px)">${s.label}</span>
                <div class="icon-bg ${s.iconBg}">
                  <span class="material-symbols-outlined ${s.color} text-xl" style="font-variation-settings:'FILL' 1">${s.icon}</span>
                </div>
              </div>
              <span class="${s.color} text-3xl font-bold tracking-tight">${s.value}</span>
            </div>
          `).join('')}
        </div>

        <!-- Filter Bar -->
        <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-standard shadow-sm">
          <div class="flex flex-wrap items-center gap-standard">
            <div class="relative flex-1 min-w-[min(200px,100%)] group">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors text-[18px]">search</span>
              <input
                id="pt-search"
                class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface pl-10 pr-4 py-2 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none placeholder-outline-variant/60 font-body-md text-body-md transition-all shadow-sm focus:shadow-none"
                placeholder="Tìm nhanh PT hoặc hội viên..."
                type="text"
                value="${this._keyword || ''}"
              />
            </div>

            <!-- Button Bộ Lọc (funnel icon, green background) -->
            <button id="btn-pt-filter-toggle" class="flex items-center justify-center gap-xs px-4 py-2 rounded-xl bg-[#1D9336] text-white hover:opacity-90 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer whitespace-nowrap">
              <span class="material-symbols-outlined text-base">filter_alt</span>
              Bộ lọc
            </button>

            <!-- Button Tải Lại (reload icon, outlined style) -->
            <button id="pt-reload" class="flex items-center justify-center gap-xs px-4 py-2 rounded-xl border border-outline-variant bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer whitespace-nowrap">
              <span class="material-symbols-outlined text-base">refresh</span>
              Tải lại
            </button>

            <!-- Button Xuất Excel -->
            <button id="btn-export-schedules" class="flex items-center justify-center gap-xs px-4 py-2 rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer whitespace-nowrap">
              <span class="material-symbols-outlined text-base text-[#1D9336]">download</span>
              Xuất Excel
            </button>
          </div>

          <!-- Collapsible Filter Panel -->
          <div id="pt-filter-panel" class="${this._panelOpen ? '' : 'hidden'} mt-4 pt-4 border-t border-outline-variant/30 flex flex-col gap-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-standard">
              <!-- PERSONAL TRAINER select -->
              <div>
                <label class="flex items-center gap-xs text-[11px] uppercase font-bold tracking-wider text-[#1D9336] mb-1.5">
                  <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">sports_gymnastics</span>
                  PERSONAL TRAINER
                </label>
                <select id="pt-filter-pt" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-3 py-1.5 rounded-xl focus:border-brand-primary outline-none transition-all text-body-sm font-semibold cursor-pointer">
                  <option value="">Tất cả PT</option>
                  ${pts.map(p => `<option value="${p.id}" ${this._filterPt == p.id ? 'selected' : ''}>${p.ho_ten || p.name}</option>`).join('')}
                </select>
              </div>

              <!-- HỘI VIÊN select -->
              <div>
                <label class="flex items-center gap-xs text-[11px] uppercase font-bold tracking-wider text-[#1D9336] mb-1.5">
                  <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">person</span>
                  HỘI VIÊN
                </label>
                <select id="pt-filter-member" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-3 py-1.5 rounded-xl focus:border-brand-primary outline-none transition-all text-body-sm font-semibold cursor-pointer">
                  <option value="">Tất cả hội viên</option>
                  ${(window.GymApp.data.members || []).map(m => `<option value="${m.id}" ${this._filterMember == m.id ? 'selected' : ''}>${m.ho_ten || m.name}</option>`).join('')}
                </select>
              </div>

              <!-- TỪ NGÀY datepicker -->
              <div>
                <label class="flex items-center gap-xs text-[11px] uppercase font-bold tracking-wider text-[#1D9336] mb-1.5">
                  <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">calendar_month</span>
                  TỪ NGÀY
                </label>
                <input id="pt-filter-from" type="date" value="${this._filterFrom || ''}" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-3 py-1.5 rounded-xl focus:border-brand-primary outline-none transition-all text-body-sm font-semibold cursor-pointer shadow-sm" />
              </div>

              <!-- ĐẾN NGÀY datepicker -->
              <div>
                <label class="flex items-center gap-xs text-[11px] uppercase font-bold tracking-wider text-[#1D9336] mb-1.5">
                  <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">calendar_month</span>
                  ĐẾN NGÀY
                </label>
                <input id="pt-filter-to" type="date" value="${this._filterTo || ''}" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-3 py-1.5 rounded-xl focus:border-brand-primary outline-none transition-all text-body-sm font-semibold cursor-pointer shadow-sm" />
              </div>
            </div>

            <!-- Panel buttons -->
            <div class="flex gap-standard justify-start mt-1">
              <button id="btn-pt-filter-search" class="flex items-center justify-center gap-xs px-5 py-2 rounded-xl bg-[#1D9336] text-white hover:opacity-90 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer whitespace-nowrap">
                <span class="material-symbols-outlined text-sm">search</span>
                Tìm kiếm
              </button>
              <button id="btn-pt-filter-reset" class="flex items-center justify-center gap-xs px-5 py-2 rounded-xl border border-outline-variant bg-white dark:bg-[#1e1e1e] text-on-surface hover:bg-surface-container-low transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer whitespace-nowrap">
                <span class="material-symbols-outlined text-sm">restart_alt</span>
                Đặt lại
              </button>
            </div>
          </div>
        </div>

        <!-- Cards lịch đào tạo -->
        <div id="pt-schedule-container" class="w-full">
          ${this._renderCards(schedules, selectedBranch)}
        </div>

        </div>

      </div>

      <!-- Modal Sửa lịch -->
      <div id="modal-edit-schedule" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-xl w-full max-w-lg mx-loose p-standard flex flex-col gap-lg">
          <div class="flex items-center justify-between">
            <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Sửa lịch tập</h3>
            <button id="close-edit-schedule" class="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors">close</button>
          </div>
          <input type="hidden" id="edit-schedule-id" />
          <div class="flex flex-col gap-standard">
            <div>
              <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Ngày tập</label>
              <input id="edit-schedule-date" type="date" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md transition-colors" />
            </div>
            <div>
              <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Chọn giờ bắt đầu</label>
              <div id="edit-schedule-time-display" class="text-body-sm mb-compact font-bold" style="min-height:18px;color:#6e7a6b;">Chưa chọn giờ</div>
              <div style="border:1px solid #becab9;border-radius:12px;overflow:hidden;max-height:260px;overflow-y:auto;" class="bg-surface-container-low">
                <div class="time-slot-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:4px;padding:8px;">
                  ${timeSlots.map(t => `<button class="edit-time-slot-btn bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container transition-all text-body-sm" data-time="${t}" style="padding:6px 2px;border-radius:8px;font-weight:600;cursor:pointer;text-align:center;">${t}</button>`).join('')}
                </div>
              </div>
              <input type="hidden" id="edit-schedule-start" />
              <input type="hidden" id="edit-schedule-end" />
            </div>
            <div>
              <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Ghi chú</label>
              <textarea id="edit-schedule-note" rows="2" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md resize-none transition-colors"></textarea>
            </div>
          </div>
          <div class="flex gap-standard justify-end pt-xs border-t border-outline-variant">
            <button id="cancel-edit-schedule" class="px-standard py-compact rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all font-bold text-body-md">Hủy bỏ</button>
            <button id="save-edit-schedule" class="px-standard py-compact rounded-xl btn-primary text-white font-bold text-body-md flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">save</span>Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    `;
  },

  _renderCards: function (schedules, activeBranch) {
    const list = Array.isArray(schedules) ? schedules : [];
    if (list.length === 0) {
      return `
        <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-standard text-center">
          <div class="icon-bg icon-bg-orange mx-auto mb-standard" style="width:56px;height:56px;border-radius:16px">
            <span class="material-symbols-outlined text-[#e65100] text-2xl">event_busy</span>
          </div>
          <p class="text-on-surface font-bold text-body-md">Không tìm thấy lịch đào tạo</p>
          <p class="text-on-surface-variant text-body-sm mt-xs">Thử thay đổi bộ lọc hoặc tải lại dữ liệu</p>
        </div>
      `;
    }

    // Sort by date (descending) and time (ascending)
    const sortedList = [...list].sort((a, b) => {
      if (a.ngay_tap !== b.ngay_tap) {
        return new Date(b.ngay_tap || 0) - new Date(a.ngay_tap || 0);
      }
      return (a.gio_bat_dau || '').localeCompare(b.gio_bat_dau || '');
    });

    // Group by date
    const grouped = {};
    sortedList.forEach(s => {
      const d = s.ngay_tap || 'Chưa xác định';
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(s);
    });

    const entries = Object.entries(grouped);
    const total = entries.length;
    const startIdx = (this._currentPage - 1) * this._daysPerPage;
    const endIdx = this._currentPage * this._daysPerPage;
    const paginatedEntries = entries.slice(startIdx, endIdx);

    // Initialize collapsed dates if not exists
    if (!this._collapsedDates) {
      this._collapsedDates = new Set();
    }

    const groupsHtml = paginatedEntries.map(([dateStr, items]) => {
      const dayObj = dateStr !== 'Chưa xác định' ? new Date(dateStr) : null;
      const weekday = dayObj ? dayObj.toLocaleDateString('vi-VN', { weekday: 'long' }) : '';
      const formattedDate = dayObj ? dayObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : dateStr;

      const isCollapsed = this._collapsedDates.has(dateStr);
      const iconCollapse = isCollapsed ? 'expand_more' : 'expand_less';

      return `
      <div class="mb-4 bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/30 overflow-hidden shadow-sm">
        <!-- Header Collapsible -->
        <div class="pt-header-toggle flex items-center justify-between gap-2 px-standard py-3 bg-surface-container-low/20 hover:bg-surface-container-low/40 cursor-pointer select-none transition-colors border-b border-outline-variant/20" data-date="${dateStr}">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-brand-primary text-xl" style="font-variation-settings: 'FILL' 1;">calendar_month</span>
            <h3 class="font-bold text-on-surface text-body-lg capitalize tracking-tight">${weekday}, ${formattedDate}</h3>
            <span class="bg-brand-primary/10 text-brand-primary text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">${items.length} buổi</span>
          </div>
          <span class="material-symbols-outlined text-on-surface-variant transition-transform duration-200">${iconCollapse}</span>
        </div>

        <!-- Card Container Grid -->
        <div class="pt-cards-container p-standard flex flex-row overflow-x-auto gap-3 transition-all duration-200 custom-scroll ${isCollapsed ? 'hidden' : ''}">
          ${items.map(s => {
        const hasActions = (s.trang_thai === 'cho_tap' || s.status === 'cho_tap') || ((s.trang_thai === 'da_tap' || s.status === 'da_tap') && (s.ghi_chu === 'auto_cron' || s.notes === 'auto_cron'));
        return `
            <div class="group relative rounded-xl overflow-hidden flex flex-col gap-2 p-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 bg-surface-container-lowest border border-outline-variant w-[280px] sm:w-[calc(50%-6px)] md:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)] shrink-0">
              <!-- Card Header: Time & Status -->
              <div class="flex items-start justify-between gap-2">
                <div class="flex flex-col min-w-0">
                  <span class="text-[9px] uppercase font-bold tracking-widest text-on-surface-variant mb-0.5">Khung giờ</span>
                  <div class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-brand-primary text-[16px] shrink-0">schedule</span>
                    <span class="font-extrabold text-on-surface text-body-sm truncate whitespace-nowrap">${s.gio_bat_dau || '—'} - ${s.gio_ket_thuc || '—'}</span>
                  </div>
                </div>
                <div class="shrink-0">${window.GymApp.statusBadge(s.trang_thai || s.status)}</div>
              </div>

              <!-- Info (Hội viên & PT xếp chồng) -->
              <div class="flex flex-col gap-2 pt-1">
                <!-- Hội viên -->
                <div class="flex items-center gap-2">
                  <div class="relative flex-shrink-0">
                    ${window.GymApp.avatarImg(s.avatar_hoi_vien, s.ten_hoi_vien || s.memberName, 'sm')}
                  </div>
                  <div class="flex flex-col min-w-0 justify-center">
                    <span class="text-[9px] uppercase font-bold text-on-surface-variant leading-none mb-0.5">Hội viên</span>
                    <span class="font-bold text-on-surface text-body-sm truncate leading-tight">${s.ten_hoi_vien || s.memberName || 'Không rõ'}</span>
                  </div>
                </div>

                <!-- PT -->
                <div class="flex items-center gap-2">
                  <div class="relative flex-shrink-0">
                    ${window.GymApp.avatarImg(s.avatar_pt, s.ten_pt || s.ptName, 'sm')}
                  </div>
                  <div class="flex flex-col min-w-0 justify-center">
                    <span class="text-[9px] uppercase font-bold text-on-surface-variant leading-none mb-0.5">Huấn luyện viên</span>
                    <span class="font-bold text-on-surface text-body-sm truncate leading-tight">${s.ten_pt || s.ptName || '—'}</span>
                  </div>
                </div>
              </div>

              <!-- Notes Area -->
              <div class="flex flex-wrap items-center justify-between gap-1 pt-1 pb-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="bg-surface-container-low px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold border border-outline-variant/30 text-brand-primary shrink-0">${window.GymApp.formatEnumLabel(s.loai_buoi || s.type || 'ca_nhan')}</span>
                  ${!activeBranch && (s.chi_nhanh_tap) ? `
                  <div class="flex items-center gap-0.5 shrink-0 bg-success/10 px-1.5 py-0.5 rounded-full border border-success/20">
                    <span class="material-symbols-outlined text-[10px] text-[#1D9336]" style="font-variation-settings:'FILL' 1">location_on</span>
                    <span class="text-[9px] font-bold text-[#1D9336] truncate" title="${s.chi_nhanh_tap}">${s.chi_nhanh_tap.replace('Chi nhánh ', '')}</span>
                  </div>` : ''}
                </div>
                ${s.ghi_chu || s.notes ? `<span class="text-on-surface-variant text-[11px] truncate" title="${s.ghi_chu || s.notes}">${s.ghi_chu || s.notes}</span>` : ''}
              </div>

              <!-- Actions Footer -->
              ${hasActions ? `
              <div class="mt-auto flex flex-wrap items-center justify-end gap-1.5 border-t border-outline-variant/30 pt-2 bg-surface-container-low/5">
                ${s.trang_thai === 'cho_tap' || s.status === 'cho_tap' ? `
                  <button class="btn-edit-schedule flex items-center justify-center text-outline hover:text-brand-primary p-1 rounded-md hover:bg-brand-primary/10 transition-colors"
                    data-id="${s.id}" data-ngay="${s.ngay_tap || ''}" data-start="${s.gio_bat_dau || ''}" data-end="${s.gio_ket_thuc || ''}" data-ghi-chu="${(s.ghi_chu || '').replace(/"/g, '&quot;')}"
                    title="Sửa lịch"><span class="material-symbols-outlined text-[16px]">edit</span></button>
                  <button class="btn-cancel-schedule flex items-center justify-center text-outline hover:text-error p-1 rounded-md hover:bg-error/10 transition-colors"
                    data-id="${s.id}" title="Hủy lịch"><span class="material-symbols-outlined text-[16px]">event_busy</span></button>
                ` : ''}
                ${(s.trang_thai === 'da_tap' || s.status === 'da_tap') && (s.ghi_chu === 'auto_cron' || s.notes === 'auto_cron')
              ? `<button class="btn-hoan-tac flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-[#e65100] hover:bg-orange-100 transition-all text-[11px] font-bold" data-id="${s.id}" title="Hoàn tác xác nhận">
                       <span class="material-symbols-outlined text-[14px]">undo</span>Hoàn tác
                     </button>`
              : ''
            }
              </div>
              ` : ''}
            </div>
            `;
      }).join('')}
        </div>
      </div>
      `;
    }).join('');

    const paginationHtml = window.GymApp.renderPagination(this._currentPage, total, this._daysPerPage);
    return groupsHtml + paginationHtml;
  },

  _applyFilter: function () {
    const q = this._keyword.toLowerCase();
    const status = this._filterStatus;
    const ptId = this._filterPt;
    const memberId = this._filterMember;
    const fromDate = this._filterFrom;
    const toDate = this._filterTo;
    const branch = window.GymApp.selectedBranch || '';

    const filtered = (window.GymApp.data.ptSchedules || []).filter(s => {
      const ptName = (s.ten_pt || s.ptName || '').toLowerCase();
      const hvName = (s.ten_hoi_vien || s.memberName || '').toLowerCase();

      const matchQ = !q || ptName.includes(q) || hvName.includes(q);
      const matchS = !status || s.trang_thai === status || s.status === status;
      const matchPt = !ptId || s.pt_id == ptId || s.ptId == ptId;
      const matchMember = !memberId || s.hoi_vien_id == memberId || s.memberId == memberId;
      const matchBranch = !branch || s.chi_nhanh_tap === branch;

      const sDate = s.ngay_tap || '';
      const matchFrom = !fromDate || sDate >= fromDate;
      const matchTo = !toDate || sDate <= toDate;

      return matchQ && matchS && matchPt && matchMember && matchFrom && matchTo && matchBranch;
    });

    // Khi áp dụng bộ lọc mới, Reset trang hiện tại về trang 1
    document.getElementById('pt-schedule-container').innerHTML = this._renderCards(filtered, branch);
  },

  init: async function (skipFetch = false) {
    const self = this;
    this._currentPage = this._currentPage || 1;
    this._daysPerPage = 3;

    // Lắng nghe sự kiện socket để tự động cập nhật danh sách lịch tập PT realtime
    if (window.GymApp._socket && !skipFetch) {
      // Đảm bảo không bị lặp đăng ký
      if (this._onPtScheduleChanged) {
        window.GymApp._socket.off('pt_schedule_changed', this._onPtScheduleChanged);
      }
      this._onPtScheduleChanged = async () => {
        try {
          const res = await window.GymApp.api.get('/pt/schedules');
          if (res?.success) {
            window.GymApp.data.ptSchedules = Array.isArray(res.data) ? res.data : [];
            self._applyFilter();
          }
        } catch (err) {
          console.error('Realtime sync schedules failed:', err);
        }
      };
      window.GymApp._socket.on('pt_schedule_changed', this._onPtScheduleChanged);
    }

    if (!skipFetch) {
      // Tải dữ liệu PT nếu chưa có
      if (!window.GymApp.data.pts || window.GymApp.data.pts.length === 0) {
        try {
          const res = await window.GymApp.api.get('/members?loai=pt');
          if (res?.success) window.GymApp.data.pts = res.data;
        } catch (err) { console.error('Failed to fetch PTs', err); }
      }

      // Tải danh sách hội viên nếu chưa có
      if (!window.GymApp.data.members || window.GymApp.data.members.length === 0) {
        try {
          const res = await window.GymApp.api.get('/members?limit=200');
          if (res?.success) window.GymApp.data.members = Array.isArray(res.data) ? res.data : (res.data.data || []);
        } catch (err) { console.error('Failed to fetch members', err); }
      }

      // Tải lịch tập mới nhất
      try {
        const res = await window.GymApp.api.get('/pt/schedules');
        if (res?.success) {
          window.GymApp.data.ptSchedules = Array.isArray(res.data) ? res.data : [];

          const contentArea = document.getElementById('content-area');
          if (contentArea && window.GymApp.currentPage === 'pt-training') {
            contentArea.innerHTML = self.render();
            return self.init(true); // Gọi lại với skipFetch = true để bind sự kiện
          }
        }
      } catch (err) {
        console.error('Failed to fetch pt schedules', err);
      }
      // Người dùng đã navigate sang trang khác trong khi fetch — dừng lại
      return;
    }

    // Guard: nếu trang đã bị navigate đi, không bind events
    if (window.GymApp.currentPage !== 'pt-training') return;

    // Đăng ký callback phân trang
    window.GymApp._pgHandler = (page) => {
      self._currentPage = page;
      self._applyFilter();
    };

    // Toggle panel lọc
    document.getElementById('btn-pt-filter-toggle')?.addEventListener('click', () => {
      const panel = document.getElementById('pt-filter-panel');
      if (panel) {
        panel.classList.toggle('hidden');
        self._panelOpen = !panel.classList.contains('hidden');
      }
    });

    // Sự kiện Tìm Kiếm từ panel lọc
    document.getElementById('btn-pt-filter-search')?.addEventListener('click', () => {
      self._keyword = document.getElementById('pt-search')?.value.trim() || '';
      self._filterPt = document.getElementById('pt-filter-pt')?.value || '';
      self._filterMember = document.getElementById('pt-filter-member')?.value || '';
      self._filterFrom = document.getElementById('pt-filter-from')?.value || '';
      self._filterTo = document.getElementById('pt-filter-to')?.value || '';
      self._filterStatus = document.getElementById('pt-filter-status')?.value || '';
      self._currentPage = 1; // Reset về trang 1
      self._applyFilter();
    });

    // Enter trong input tìm kiếm
    document.getElementById('pt-search')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('btn-pt-filter-search')?.click();
      }
    });

    // Sự kiện Đặt Lại từ panel lọc
    document.getElementById('btn-pt-filter-reset')?.addEventListener('click', () => {
      self._keyword = '';
      self._filterPt = '';
      self._filterMember = '';
      self._filterFrom = '';
      self._filterTo = '';
      self._filterStatus = '';
      self._currentPage = 1;

      const qIn = document.getElementById('pt-search');
      if (qIn) qIn.value = '';
      const ptSel = document.getElementById('pt-filter-pt');
      if (ptSel) ptSel.value = '';
      const mSel = document.getElementById('pt-filter-member');
      if (mSel) mSel.value = '';
      const fromIn = document.getElementById('pt-filter-from');
      if (fromIn) fromIn.value = '';
      const toIn = document.getElementById('pt-filter-to');
      if (toIn) toIn.value = '';
      const stSel = document.getElementById('pt-filter-status');
      if (stSel) stSel.value = '';

      self._applyFilter();
    });

    // Toggle Collapse/Expand day group (event delegation)
    document.getElementById('pt-schedule-container')?.addEventListener('click', function (e) {
      const header = e.target.closest('.pt-header-toggle');
      if (!header) return;
      const dateStr = header.dataset.date;
      if (!self._collapsedDates) self._collapsedDates = new Set();

      if (self._collapsedDates.has(dateStr)) {
        self._collapsedDates.delete(dateStr);
      } else {
        self._collapsedDates.add(dateStr);
      }
      self._applyFilter();
    });

    document.getElementById('pt-reload')?.addEventListener('click', async () => {
      const btn = document.getElementById('pt-reload');
      const icon = btn?.querySelector('.material-symbols-outlined');
      if (icon) icon.classList.add('animate-spin');
      if (btn) btn.classList.add('pointer-events-none', 'opacity-50');
      try {
        const res = await window.GymApp.api.get('/pt/schedules');
        if (res?.success) window.GymApp.data.ptSchedules = Array.isArray(res.data) ? res.data : [];
      } catch (err) { console.error(err); }

      self._keyword = '';
      self._filterPt = '';
      self._filterMember = '';
      self._filterFrom = '';
      self._filterTo = '';
      self._filterStatus = '';
      self._currentPage = 1;

      const qIn = document.getElementById('pt-search');
      if (qIn) qIn.value = '';
      const ptSel = document.getElementById('pt-filter-pt');
      if (ptSel) ptSel.value = '';
      const mSel = document.getElementById('pt-filter-member');
      if (mSel) mSel.value = '';
      const fromIn = document.getElementById('pt-filter-from');
      if (fromIn) fromIn.value = '';
      const toIn = document.getElementById('pt-filter-to');
      if (toIn) toIn.value = '';
      const stSel = document.getElementById('pt-filter-status');
      if (stSel) stSel.value = '';

      self._applyFilter();
      if (icon) icon.classList.remove('animate-spin');
      if (btn) btn.classList.remove('pointer-events-none', 'opacity-50');
      window.GymApp.toast('Đã tải lại danh sách!', 'success');
    });

    document.getElementById('btn-export-schedules')?.addEventListener('click', async () => {
      window.GymApp.toast('Đang xuất lịch tập PT...', 'info');
      const ptId = self._filterPt;
      const fromDate = self._filterFrom;
      const toDate = self._filterTo;
      const branch = window.GymApp.selectedBranch || '';

      const params = [];
      if (ptId) params.push('pt_id=' + encodeURIComponent(ptId));
      if (fromDate) params.push('tu_ngay=' + encodeURIComponent(fromDate));
      if (toDate) params.push('den_ngay=' + encodeURIComponent(toDate));
      if (branch) params.push('chi_nhanh=' + encodeURIComponent(branch));

      const query = params.length ? '?' + params.join('&') : '';
      const ok = await window.GymApp.api.download('/export/pt-schedules' + query, 'lich-pt.xlsx');
      if (ok) window.GymApp.toast('Đã tải xuống file Excel lịch tập PT!', 'success');
    });

    // Cập nhật trạng thái disable cho các nút giờ dựa theo ngày đã chọn
    const _updateTimeSlotDisabled = (selectedDate) => {
      const modalEl = document.getElementById('modal-edit-schedule');
      if (!modalEl) return;
      const todayStr = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' });
      const isToday = selectedDate === todayStr;
      const nowHour = new Date().getHours();
      const nowMin = new Date().getMinutes();
      modalEl.querySelectorAll('.edit-time-slot-btn').forEach(b => {
        const t = b.dataset.time || '';
        const [h, mn] = t.split(':').map(Number);
        const isPast = isToday && (h < nowHour || (h === nowHour && mn <= nowMin));
        if (isPast) {
          b.disabled = true;
          b.style.opacity = '0.35';
          b.style.cursor = 'not-allowed';
          b.style.background = '';
          b.style.color = '';
          b.title = 'Giờ đã qua';
        } else {
          b.disabled = false;
          b.style.opacity = '';
          b.style.cursor = 'pointer';
          b.title = '';
        }
      });
    };

    // Sửa lịch tập (event delegation)
    document.getElementById('pt-schedule-container')?.addEventListener('click', function (e) {
      const btn = e.target.closest('.btn-edit-schedule');
      if (!btn) return;
      const selectedDate = btn.dataset.ngay || '';
      document.getElementById('edit-schedule-id').value = btn.dataset.id;
      document.getElementById('edit-schedule-date').value = selectedDate;
      const todayStr = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' });
      const dateInput = document.getElementById('edit-schedule-date');
      if (dateInput) {
        dateInput.min = todayStr;
      }
      const startVal = btn.dataset.start || '';
      const endVal = btn.dataset.end || '';
      document.getElementById('edit-schedule-start').value = startVal;
      document.getElementById('edit-schedule-end').value = endVal;
      document.getElementById('edit-schedule-note').value = btn.dataset.ghiChu || '';

      const currStart = startVal.substring(0, 5);
      const timeDisplay = document.getElementById('edit-schedule-time-display');
      const modalEl = document.getElementById('modal-edit-schedule');

      // Reset button styles then apply disabled state for past hours
      modalEl.querySelectorAll('.edit-time-slot-btn').forEach(b => {
        b.style.transform = 'scale(1)';
        b.style.background = '';
        b.style.color = '';
      });
      _updateTimeSlotDisabled(selectedDate);

      let matchedBtn = null;
      if (currStart) {
        matchedBtn = modalEl.querySelector(`.edit-time-slot-btn[data-time="${currStart}"]:not([disabled])`);
        if (!matchedBtn) matchedBtn = modalEl.querySelector(`.edit-time-slot-btn[data-time="${currStart}"]`);
      }

      if (matchedBtn && !matchedBtn.disabled) {
        matchedBtn.style.transform = 'scale(1.05)';
        matchedBtn.style.background = '#1D9336';
        matchedBtn.style.color = '#fff';
        timeDisplay.textContent = `Đã chọn: ${currStart} — ${endVal.substring(0, 5)}`;
        timeDisplay.style.color = '#1D9336';
        timeDisplay.style.fontWeight = '700';

        setTimeout(() => {
          matchedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      } else {
        timeDisplay.textContent = 'Chưa chọn giờ';
        timeDisplay.style.color = '';
        timeDisplay.style.fontWeight = '';
      }

      modalEl.classList.remove('hidden');
    });

    // Khi đổi ngày, cập nhật lại trạng thái disable của các nút giờ
    document.getElementById('edit-schedule-date')?.addEventListener('change', function () {
      _updateTimeSlotDisabled(this.value);
      // Reset giờ đã chọn nếu giờ cũ là giờ đã qua
      const startEl = document.getElementById('edit-schedule-start');
      const timeDisplay = document.getElementById('edit-schedule-time-display');
      const selectedTime = startEl?.value?.substring(0, 5);
      if (selectedTime) {
        const modalEl = document.getElementById('modal-edit-schedule');
        const btn = modalEl?.querySelector(`.edit-time-slot-btn[data-time="${selectedTime}"]`);
        if (btn?.disabled) {
          startEl.value = '';
          document.getElementById('edit-schedule-end').value = '';
          if (timeDisplay) { timeDisplay.textContent = 'Chưa chọn giờ'; timeDisplay.style.color = ''; timeDisplay.style.fontWeight = ''; }
          modalEl.querySelectorAll('.edit-time-slot-btn').forEach(b => { b.style.transform = 'scale(1)'; b.style.background = ''; b.style.color = ''; });
        }
      }
    });

    // Custom time slot buttons interaction
    const calculateEndTime = (startStr) => {
      const [h, min] = startStr.split(':').map(Number);
      const d = new Date();
      d.setHours(h, min + 60);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    document.querySelectorAll('.edit-time-slot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const t = btn.dataset.time;
        const startEl = document.getElementById('edit-schedule-start');
        const endEl = document.getElementById('edit-schedule-end');
        const timeDisplay = document.getElementById('edit-schedule-time-display');

        // Reset all buttons style (skip disabled ones)
        document.querySelectorAll('.edit-time-slot-btn').forEach(b => {
          if (!b.disabled) { b.style.transform = 'scale(1)'; b.style.background = ''; b.style.color = ''; }
        });

        // Style active button
        btn.style.transform = 'scale(1.05)';
        btn.style.background = '#1D9336';
        btn.style.color = '#fff';

        const endTime = calculateEndTime(t);
        startEl.value = t;
        endEl.value = endTime;

        timeDisplay.textContent = `Đã chọn: ${t} — ${endTime}`;
        timeDisplay.style.color = '#1D9336';
        timeDisplay.style.fontWeight = '700';
      });
    });

    // Hủy lịch tập (event delegation)
    document.getElementById('pt-schedule-container')?.addEventListener('click', async function (e) {
      const btn = e.target.closest('.btn-cancel-schedule');
      if (!btn) return;
      const scheduleId = btn.dataset.id;
      const ly_do = window.prompt('Lý do hủy lịch (tuỳ chọn):');
      if (ly_do === null) return; // user bấm Cancel

      try {
        btn.disabled = true;
        const res = await window.GymApp.api.put(`/pt/schedules/${scheduleId}/cancel`, { ly_do: ly_do || 'Không có lý do' });
        if (res?.success) {
          window.GymApp.toast('Đã hủy lịch tập thành công!', 'success');
          const idx = (window.GymApp.data.ptSchedules || []).findIndex(s => s.id == scheduleId);
          if (idx !== -1) window.GymApp.data.ptSchedules[idx].trang_thai = 'da_huy';
          self._applyFilter();
        } else {
          window.GymApp.toast(res?.message || 'Hủy lịch thất bại!', 'error');
          btn.disabled = false;
        }
      } catch (err) {
        console.error(err);
        if (err.message === 'Failed to fetch' || !err.message) {
          window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
        }
        btn.disabled = false;
      }
    });

    // Đóng modal sửa
    document.getElementById('close-edit-schedule')?.addEventListener('click', () => {
      document.getElementById('modal-edit-schedule').classList.add('hidden');
    });
    document.getElementById('cancel-edit-schedule')?.addEventListener('click', () => {
      document.getElementById('modal-edit-schedule').classList.add('hidden');
    });
    document.getElementById('modal-edit-schedule')?.addEventListener('click', function (e) {
      if (e.target === this) this.classList.add('hidden');
    });

    // Lưu thay đổi lịch
    document.getElementById('save-edit-schedule')?.addEventListener('click', async function () {
      const id = document.getElementById('edit-schedule-id').value;
      const ngay_tap = document.getElementById('edit-schedule-date').value;
      const gio_bat_dau = document.getElementById('edit-schedule-start').value;
      const gio_ket_thuc = document.getElementById('edit-schedule-end').value;
      const ghi_chu = document.getElementById('edit-schedule-note').value;

      if (!ngay_tap || !gio_bat_dau || !gio_ket_thuc) {
        window.GymApp.toast('Vui lòng điền đầy đủ ngày và giờ!', 'error');
        return;
      }
      const todayStr = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];
      if (ngay_tap < todayStr) {
        window.GymApp.toast('Không thể dời lịch tập về ngày trong quá khứ!', 'error');
        return;
      }
      if (gio_ket_thuc <= gio_bat_dau) {
        window.GymApp.toast('Giờ kết thúc phải sau giờ bắt đầu!', 'error');
        return;
      }

      this.disabled = true;
      this.textContent = 'Đang lưu...';
      try {
        const res = await window.GymApp.api.put(`/pt/schedules/${id}`, { ngay_tap, gio_bat_dau, gio_ket_thuc, ghi_chu });
        if (res?.success) {
          window.GymApp.toast('Cập nhật lịch tập thành công!', 'success');
          document.getElementById('modal-edit-schedule').classList.add('hidden');
          // Cập nhật local data
          const idx = (window.GymApp.data.ptSchedules || []).findIndex(s => s.id == id);
          if (idx !== -1) {
            window.GymApp.data.ptSchedules[idx].ngay_tap = ngay_tap;
            window.GymApp.data.ptSchedules[idx].gio_bat_dau = gio_bat_dau;
            window.GymApp.data.ptSchedules[idx].gio_ket_thuc = gio_ket_thuc;
            window.GymApp.data.ptSchedules[idx].ghi_chu = ghi_chu;
          }
          self._applyFilter();
        } else {
          window.GymApp.toast(res?.message || 'Cập nhật thất bại!', 'error');
        }
      } catch (err) {
        console.error(err);
        if (err.message === 'Failed to fetch' || !err.message) {
          window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
        }
      }
      this.disabled = false;
      this.innerHTML = '<span class="material-symbols-outlined text-sm">save</span>Lưu thay đổi';
    });

    // Hoàn tác buổi tập (event delegation)
    document.getElementById('pt-schedule-container')?.addEventListener('click', async function (e) {
      const btn = e.target.closest('.btn-hoan-tac');
      if (!btn) return;
      const scheduleId = btn.dataset.id;
      const ly_do = window.prompt('Lý do hoàn tác (tuỳ chọn):');
      if (ly_do === null) return; // user bấm Cancel

      try {
        btn.disabled = true;
        btn.textContent = 'Đang xử lý...';
        const res = await window.GymApp.api.patch(`/pt/schedules/${scheduleId}/hoan-tac`, { ly_do });
        if (res?.success) {
          window.GymApp.toast('Hoàn tác thành công!', 'success');
          // Cập nhật local data và re-render
          const idx = (window.GymApp.data.ptSchedules || []).findIndex(s => s.id == scheduleId);
          if (idx !== -1) {
            window.GymApp.data.ptSchedules[idx].trang_thai = 'cho_tap';
            window.GymApp.data.ptSchedules[idx].ghi_chu = ly_do ? `Hoàn tác: ${ly_do}` : 'Hoàn tác bởi admin';
          }
          self._applyFilter();
        } else {
          window.GymApp.toast(res?.message || 'Hoàn tác thất bại!', 'error');
          btn.disabled = false;
          btn.innerHTML = '<span class="material-symbols-outlined text-sm">undo</span>Hoàn tác';
        }
      } catch (err) {
        console.error(err);
        if (err.message === 'Failed to fetch' || !err.message) {
          window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
        }
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">undo</span>Hoàn tác';
      }
    });
  },

  guideHtml: `
    <div class="space-y-4 text-xs">
      <div class="flex items-start gap-2 bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/10">
        <span class="material-symbols-outlined text-brand-primary text-base flex-shrink-0 mt-0.5">info</span>
        <p class="text-on-surface-variant leading-relaxed">Trang <strong>Lịch đào tạo PT</strong> hiển thị danh sách các buổi tập luyện cá nhân của hội viên cùng Huấn luyện viên (PT) và quản lý trạng thái buổi học.</p>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">Tìm kiếm & Bộ lọc:</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li><strong>Tìm nhanh:</strong> Gõ tên PT hoặc hội viên vào ô tìm kiếm để lọc nhanh danh sách lịch tập.</li>
          <li><strong>Bộ lọc nâng cao:</strong> Bấm <strong>Bộ lọc</strong> để mở rộng tuỳ chọn lọc theo Huấn luyện viên cụ thể, Trạng thái buổi học, hoặc Khoảng ngày diễn ra buổi tập.</li>
        </ul>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">Cập nhật trạng thái buổi tập:</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li><strong>Điểm danh dạy (Duyệt dạy):</strong> Khi buổi tập diễn ra, bấm **Điểm danh** để đổi trạng thái sang <strong>Đã tập</strong> (ghi nhận buổi dạy cho PT).</li>
          <li><strong>Hủy buổi:</strong> Bấm **Hủy buổi** (nhập lý do) nếu hội viên bận đột xuất hoặc có việc riêng không thể tập.</li>
          <li><strong>Hoàn tác:</strong> Cho phép khôi phục trạng thái buổi học về <strong>Chờ tập</strong> nếu có sai sót trong quá trình điểm danh trước đó.</li>
        </ul>
      </div>
    </div>
  `,
  destroy: function () {
    if (window.GymApp._socket && this._onPtScheduleChanged) {
      window.GymApp._socket.off('pt_schedule_changed', this._onPtScheduleChanged);
      this._onPtScheduleChanged = null;
    }
  }
};
