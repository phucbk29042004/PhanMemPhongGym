window.GymApp.pages['members-list'] = {
  _tab: 'members',
  _memberPage: 1, _memberFiltered: [],
  _ptPage: 1, _ptFiltered: [],
  _perPage: 20,
  _filterState: { status: '', pkg: '', gender: '', hasPt: '', checkinToday: '', chi_nhanh: '' },
  _ptFilterState: { specialty: '', status: '' },
  _ptSortState: '',
  _memberSortState: '',
  _memberPackageHistory: {},

  _parseLocalDate: function (dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  },

  _syncExpiredPackages: function (member) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const self = this;
    if (Array.isArray(member.goi_tap_hien_tai)) {
      member.goi_tap_hien_tai.forEach(g => {
        if (g.trang_thai === 'dang_hoat_dong' && g.den_ngay) {
          const dVal = self._parseLocalDate(g.den_ngay);
          if (dVal && dVal < today) {
            g.trang_thai = 'het_han';
          }
        }
      });
      member.goi_tap_hien_tai.sort((a, b) => {
        const da = self._parseLocalDate(a.den_ngay);
        const db = self._parseLocalDate(b.den_ngay);
        if (da && db && da.getTime() !== db.getTime()) return db - da;
        return b.id - a.id;
      });
    }
    if (Array.isArray(member.pt_hien_tai)) {
      member.pt_hien_tai.forEach(p => {
        if (p.trang_thai === 'dang_hoat_dong' && p.den_ngay) {
          const dVal = self._parseLocalDate(p.den_ngay);
          if (dVal && dVal < today) {
            p.trang_thai = 'hoan_thanh';
          }
        }
      });
    }
    return member;
  },

  render: function () {
    const rawMembers = window.GymApp.data.members;
    const rawPts = window.GymApp.data.pts;
    const branch = window.GymApp.selectedBranch || '';
    this._memberFiltered = Array.isArray(rawMembers) ? [...rawMembers] : [];
    this._ptFiltered = Array.isArray(rawPts) ? rawPts.filter(pt => !branch || pt.chi_nhanh === branch) : [];
    this._ptSortState = '';
    return `
        <div class="flex flex-col gap-standard animate-in fade-in duration-500">

        <!-- Top Header: Tabs & Add Action -->
        <div class="flex flex-wrap items-center justify-between gap-standard">
          <!-- Tab Bar -->
          <div class="flex p-1 bg-surface-container-low/50 backdrop-blur-sm rounded-2xl border-2 border-outline-variant/50 w-fit shadow-sm group">
            <button id="tab-members" class="tab-btn flex items-center gap-compact px-loose py-atom rounded-2xl font-bold text-body-md transition-all duration-300 relative overflow-hidden" data-tab="members">
              <span class="material-symbols-outlined text-lg">groups</span>
              <span>Hội viên</span>
            </button>
            <button id="tab-pts" class="tab-btn flex items-center gap-compact px-loose py-atom rounded-2xl font-bold text-body-md transition-all duration-300 relative overflow-hidden" data-tab="pts">
              <span class="material-symbols-outlined text-lg">sports_gymnastics</span>
              <span>Huấn luyện viên</span>
            </button>
          </div>

          <!-- Add / Action Buttons (Dynamic based on tab) -->
          <div class="flex items-center gap-compact">
            <button id="btn-add-member-header" class="flex items-center justify-center gap-xs px-4 py-atom rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 hover:shadow-lg transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer group" data-page="member-add">
              <span class="material-symbols-outlined text-base transition-transform group-hover:scale-110">person_add</span>
              <span>Thêm hội viên</span>
            </button>
            <button id="btn-add-pt-header" class="hidden flex items-center justify-center gap-xs px-4 py-atom rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 hover:shadow-lg transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer group">
              <span class="material-symbols-outlined text-base transition-transform group-hover:scale-110">person_add</span>
              <span>Thêm HLV</span>
            </button>
            <button id="btn-members-reload" class="flex items-center justify-center gap-xs px-4 py-atom rounded-xl border border-outline-variant bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer whitespace-nowrap">
              <span class="material-symbols-outlined text-base">refresh</span>
              <span>Tải lại</span>
            </button>
            <button id="btn-pts-reload" class="hidden items-center justify-center gap-xs px-4 py-atom rounded-xl border border-outline-variant bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer whitespace-nowrap">
              <span class="material-symbols-outlined text-base">refresh</span>
              <span>Tải lại</span>
            </button>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="relative min-h-[500px]">
          
          <!-- Tab: Hội viên -->
          <div id="tab-content-members" class="tab-content animate-in slide-in-from-left-4 duration-500">
            <!-- Filter Bar -->
            <div class="flex flex-wrap items-center justify-between gap-standard bg-white dark:bg-[#1e1e1e] p-standard rounded-2xl border-2 border-outline-variant/50 shadow-sm mb-standard transition-all duration-300 hover:shadow-md">
              <!-- Search Box -->
              <div class="relative flex-1 group" style="min-width:min(280px,100%); max-width:450px;">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors text-[18px]">search</span>
                <input id="member-search" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface pl-10 pr-4 py-2.5 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none placeholder-outline-variant/60 font-body-md text-body-md transition-all shadow-sm focus:shadow-none" placeholder="Tìm theo tên, mã HV, số điện thoại..." type="text" />
              </div>
              
              <!-- Filter Actions -->
              <div class="flex flex-wrap items-center gap-compact">
                <button id="btn-view-all-members" class="group flex items-center justify-center gap-xs px-4 py-2 rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer">
                  <span class="material-symbols-outlined text-base transition-transform group-hover:rotate-12">format_list_bulleted</span>
                  <span>Xem tất cả</span>
                </button>
                
                <button id="btn-show-all" class="hidden items-center justify-center gap-xs px-4 py-2 rounded-xl border-2 border-error/20 bg-white dark:bg-[#1e1e1e] text-error hover:bg-error/5 hover:border-error transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer">
                  <span class="material-symbols-outlined text-base">filter_alt_off</span>
                  <span>Xóa lọc</span>
                </button>
                
                <button id="btn-filter" class="relative flex items-center justify-center gap-xs px-4 py-2 rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer group">
                  <span class="material-symbols-outlined text-base transition-transform group-hover:scale-110">filter_alt</span>
                  <span>Lọc dữ liệu</span>
                  <span id="filter-badge" style="display:none;position:absolute;top:-8px;right:-8px;width:22px;height:22px;background:#1D9336;color:#fff;border-radius:50%;font-size:11px;align-items:center;justify-content:center;font-weight:800;box-shadow:0 2px 8px rgba(29,147,54,0.4);border:2px solid #fff;"></span>
                </button>
                
                <button id="btn-sort-member" class="relative flex items-center justify-center gap-xs px-4 py-2 rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer group">
                  <span class="material-symbols-outlined text-base transition-transform group-hover:rotate-180 duration-500">sort</span>
                  <span>Sắp xếp</span>
                  <span id="member-sort-badge" style="display:none;position:absolute;top:-8px;right:-8px;width:22px;height:22px;background:#1D9336;color:#fff;border-radius:50%;font-size:11px;align-items:center;justify-content:center;font-weight:800;box-shadow:0 2px 8px rgba(29,147,54,0.4);border:2px solid #fff;">1</span>
                </button>
                
                <button id="btn-import-members" class="flex items-center justify-center gap-xs px-4 py-2 rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer group">
                  <span class="material-symbols-outlined text-base text-[#0284c7]">upload</span>
                  <span>Nhập Excel</span>
                </button>

                <button id="btn-export-members" class="flex items-center justify-center gap-xs px-4 py-2 rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer group">
                  <span class="material-symbols-outlined text-base text-[#1D9336]">download</span>
                  <span>Xuất Excel</span>
                </button>
              </div>
            </div>

            <div id="members-table-container" class="w-full">
              ${this._renderMemberTable()}
            </div>
          </div>

          <!-- Tab: PT / HLV -->
          <div id="tab-content-pts" class="tab-content hidden animate-in slide-in-from-right-4 duration-500">
            <div class="flex flex-wrap items-center justify-between gap-standard bg-white dark:bg-[#1e1e1e] p-standard rounded-2xl border-2 border-outline-variant/50 shadow-sm mb-standard transition-all duration-300 hover:shadow-md">
              <div class="relative flex-1 group" style="min-width:min(280px,100%); max-width:450px;">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors text-[18px]">search</span>
                <input id="pt-search" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface pl-10 pr-4 py-2.5 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none placeholder-outline-variant/60 font-body-md text-body-md transition-all shadow-sm focus:shadow-none" placeholder="Tìm theo tên, chuyên môn..." type="text" />
              </div>
              
              <div class="flex flex-wrap items-center gap-compact">
                <button id="btn-view-all-pts" class="group flex items-center justify-center gap-xs px-4 py-2 rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer">
                  <span class="material-symbols-outlined text-base transition-transform group-hover:rotate-12">format_list_bulleted</span>
                  <span>Xem tất cả</span>
                </button>
                
                <button id="btn-show-all-pt" class="hidden items-center justify-center gap-xs px-4 py-2 rounded-xl border-2 border-error/20 bg-white dark:bg-[#1e1e1e] text-error hover:bg-error/5 hover:border-error transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer">
                  <span class="material-symbols-outlined text-base">filter_alt_off</span>
                  <span>Xóa lọc</span>
                </button>
                
                <button id="btn-filter-pt" class="relative flex items-center justify-center gap-xs px-4 py-2 rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer group">
                  <span class="material-symbols-outlined text-base transition-transform group-hover:scale-110">filter_alt</span>
                  <span>Lọc</span>
                  <span id="pt-filter-badge" style="display:none;position:absolute;top:-8px;right:-8px;width:22px;height:22px;background:#1D9336;color:#fff;border-radius:50%;font-size:11px;align-items:center;justify-content:center;font-weight:800;box-shadow:0 2px 8px rgba(29,147,54,0.4);border:2px solid #fff;"></span>
                </button>
                
                <button id="btn-sort-pt" class="relative flex items-center justify-center gap-xs px-4 py-2 rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer group">
                  <span class="material-symbols-outlined text-base transition-transform group-hover:rotate-180 duration-500">sort</span>
                  <span>Sắp xếp</span>
                  <span id="pt-sort-badge" style="display:none;position:absolute;top:-8px;right:-8px;width:22px;height:22px;background:#1D9336;color:#fff;border-radius:50%;font-size:11px;align-items:center;justify-content:center;font-weight:800;box-shadow:0 2px 8px rgba(29,147,54,0.4);border:2px solid #fff;">1</span>
                </button>
 
                <button id="btn-export-pts" class="hidden items-center justify-center gap-xs px-4 py-2 rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer group">
                  <span class="material-symbols-outlined text-base text-[#1D9336]">download</span>
                  <span>Xuất Excel</span>
                </button>
              </div>
            </div>
            <div id="pt-cards-container" class="w-full">
              ${this._renderPtCards()}
            </div>
          </div>

        </div>
      </div>
    `;
  },

  _normalizeListResponse: function (res) {
    if (!res?.success) return [];
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    return [];
  },

  _fetchMembersData: async function (page = 1, isAppend = false) {
    const self = this;
    const q = document.getElementById('member-search')?.value.trim() || '';
    const { status, chi_nhanh } = self._filterState;
    try {
      let url = `/members?page=${page}&limit=${self._perPage}&search=${encodeURIComponent(q)}&status=${status}`;
      if (chi_nhanh) {
        url += `&chi_nhanh=${encodeURIComponent(chi_nhanh)}`;
      }
      const res = await window.GymApp.api.get(url);
      const newData = self._normalizeListResponse(res) || [];

      if (isAppend) {
        const merged = [...(window.GymApp.data.members || []), ...newData];
        const unique = [];
        const seen = new Set();
        for (const m of merged) {
          if (!seen.has(m.id)) {
            seen.add(m.id);
            unique.push(m);
          }
        }
        window.GymApp.data.members = unique;
      } else {
        window.GymApp.data.members = newData;
      }

      self._applyMemberFilterLocal();
      self._refreshMemberTable(isAppend);
    } catch (err) {
      console.error('Failed to fetch members page:', err);
    }
  },

  _applyMemberFilterLocal: function () {
    const q = document.getElementById('member-search')?.value.toLowerCase() || '';
    const { status, pkg, gender, hasPt, checkinToday, chi_nhanh } = this._filterState;
    const members = Array.isArray(window.GymApp.data.members) ? window.GymApp.data.members : [];

    let filtered = members.filter(m => {
      const matchQ = !q || (m.ho_ten || '').toLowerCase().includes(q) || (m.ma_ho_so || '').toLowerCase().includes(q) || (m.so_dien_thoai || '').includes(q);
      const matchStatus = !status || m.trang_thai === status;
      const matchPkg = !pkg || m.ten_goi_tap === pkg;
      let mGender = m.gioi_tinh;
      if (mGender === 'male' || mGender === 'nam') mGender = 'Nam';
      if (mGender === 'female' || mGender === 'nu') mGender = 'Nữ';
      const matchGender = !gender || mGender === gender;
      const matchHasPt = !hasPt || (hasPt === 'yes' ? (m.co_pt > 0) : (m.co_pt == 0));
      const matchCheckinToday = !checkinToday || (checkinToday === 'yes' ? (m.da_check_in_hom_nay == 1) : (!m.da_check_in_hom_nay));
      const matchBranch = !chi_nhanh || m.chi_nhanh === chi_nhanh;
      return matchQ && matchStatus && matchPkg && matchGender && matchHasPt && matchCheckinToday && matchBranch;
    });

    this._memberFiltered = this._sortMemberList(filtered);
    this._updateFilterUI();
    this._updateMemberSortUI();
  },

  _refreshMembersFromApi: async function () {
    this._memberPage = 1;
    await this._fetchMembersData(1, false);
  },

  _refreshPtsFromApi: async function () {
    const ptsRes = await window.GymApp.api.get('/trainers');
    window.GymApp.data.pts = this._normalizeListResponse(ptsRes);
    this._applyPtFilter();
  },

  _renderMemberTable: function () {
    const self = this;
    const paginated = self._memberFiltered.slice(0, self._memberPage * self._perPage);

    let rowsHtml = '';
    if (paginated.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="8" style="padding:60px 20px;text-align:center;color:var(--text-on-surface-variant);">
            <div style="display:flex;flex-direction:column;align-items:center;opacity:0.4;">
              <span class="material-symbols-outlined" style="font-size:48px;margin-bottom:8px;">person_search</span>
              <p style="font-weight:600;margin:0;">Không tìm thấy hội viên nào</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      rowsHtml = paginated.map((m, index) => {
        const isExpiringSoon = m.trang_thai === 'sap_het_han';
        return `
          <tr class="member-row transition-colors hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10 border-b border-outline-variant/30 cursor-pointer bg-white dark:bg-[#1e1e1e] odd:bg-[#fafafa] odd:dark:bg-[#15171e]" data-id="${m.id}">
            
            <!-- Cell 1: Avatar + Tên -->
            <td class="border-r border-outline-variant/30 sticky-col-left" style="padding:8px 14px; white-space:nowrap; text-align:left;">
              <div style="display:flex; align-items:center; justify-content:left; gap:12px; margin:0 auto; max-width:240px;">
                
                <!-- Avatar bigger -->
                <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;flex-shrink:0;
                  border:2px solid #e2e8f0;box-shadow:0 2px 4px rgba(0,0,0,0.05);">
                  ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'sm', 'width:100%;height:100%;')}
                </div>

                <div style="min-width:0; text-align:left;">
                  
                  <!-- Tên: bigger font -->
                  <div style="font-size:15px;font-weight:700;color:var(--text-on-surface);
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">
                    ${m.ho_ten || '—'}
                  </div>

                  <!-- Badge APP nếu có yêu cầu gia hạn -->
                  ${m.co_yeu_cau_gia_han ? `
                    <span style="display:inline-flex;align-items:center;gap:2px;
                      font-size:10px;font-weight:800;padding:1px 6px;border-radius:4px;
                      background:#fef9c3;color:#a16207;margin-top:2px;" class="animate-pulse">
                      <span class="material-symbols-outlined" style="font-size:10px;">app_registration</span>APP
                    </span>
                  ` : ''}

                </div>
              </div>
            </td>

            <!-- Cell 2: Mã HV -->
            <td class="member-table-col-mahv border-r border-outline-variant/30" style="padding:8px 14px; font-size:14px; font-weight:700; color:var(--text-on-surface-variant); white-space:nowrap; text-align:center;">
              ${m.ma_ho_so || '—'}
            </td>

            <!-- Cell 3: SĐT -->
            <td class="member-table-col-sdt border-r border-outline-variant/30" style="padding:8px 14px; font-size:14px; font-weight:500; color:var(--text-on-surface-variant); white-space:nowrap; text-align:center;">
              ${m.so_dien_thoai || '—'}
            </td>

            <!-- Cell 4: Gói tập -->
            <td class="member-table-col-goi border-r border-outline-variant/30" style="padding:8px 14px; text-align:center;">
              <span style="font-size:13px;font-weight:600;color:var(--text-on-surface-variant);
                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;max-width:140px; margin:0 auto;"
                title="${m.ten_goi_tap || 'Chưa đăng ký'}">
                ${m.ten_goi_tap ||
          '<span class="text-outline-variant font-medium italic">Chưa đăng ký</span>'}
              </span>
            </td>

            <!-- Cell 5: PT -->
            <td class="member-table-col-pt border-r border-outline-variant/30" style="padding:8px 14px; text-align:center;">
              ${m.co_pt > 0
            ? '<span class="inline-flex items-center gap-1 px-2 py-1 bg-[#f0fdf4] dark:bg-[#0b2010] text-[#16a34a] dark:text-[#4cce5f] rounded-full text-xs font-bold"><span class="material-symbols-outlined" style="font-size:14px;">sports_gymnastics</span>Có PT</span>'
            : '<span class="text-outline-variant font-medium">—</span>'}
            </td>

            <!-- Cell 6: Trạng thái -->
            <td class="border-r border-outline-variant/30" style="padding:8px 14px; white-space:nowrap; text-align:center;">
              ${window.GymApp.statusBadge(m.trang_thai)}
            </td>

            <!-- Cell 7: Chi nhánh -->
            <td class="member-table-col-branch border-r border-outline-variant/30" style="padding:8px 14px; text-align:center;">
              <span style="font-size:13px;font-weight:600;color:var(--text-on-surface-variant);
                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;max-width:130px; margin:0 auto;"
                title="${m.chi_nhanh || '—'}">
                ${m.chi_nhanh || '—'}
              </span>
            </td>

            <!-- Cell 8: Hết hạn -->
            <td class="member-table-col-han border-r border-outline-variant/30" style="padding:8px 14px; white-space:nowrap; text-align:center;">
              <span style="font-size:13px;font-weight:600;
                color:${isExpiringSoon ? '#d97706' : 'var(--text-on-surface-variant)'};">
                ${m.ngay_het_han ? window.GymApp.formatDate(m.ngay_het_han) : '—'}
              </span>
            </td>

            <!-- Cell 9: Hành động -->
            <td class="sticky-col-right" style="padding:8px 14px; text-align:center; white-space:nowrap;">
              <div style="display:inline-flex;gap:4px;align-items:center;">
                
                <!-- Xem -->
                <button class="member-view-btn w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all bg-[#f0fdf4] dark:bg-[#0b2010] text-[#1D9336] dark:text-[#4cce5f] hover:bg-[#1D9336] dark:hover:bg-[#4cce5f] hover:text-white dark:hover:text-[#111318]" data-id="${m.id}" title="Xem chi tiết">
                  <span class="material-symbols-outlined" style="font-size:15px;">visibility</span>
                </button>

                <!-- Sửa -->
                <button class="member-edit-btn w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all bg-[#eff6ff] dark:bg-[#0b1a30] text-[#3b82f6] dark:text-[#60a5fa] hover:bg-[#3b82f6] dark:hover:bg-[#60a5fa] hover:text-white dark:hover:text-[#111318]" data-id="${m.id}" title="Chỉnh sửa">
                  <span class="material-symbols-outlined" style="font-size:15px;">edit</span>
                </button>

                <!-- Xóa -->
                ${window.GymApp.auth.user?.vai_tro === 'admin' ? `
                <button class="member-delete-btn w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all bg-[#fff1f2] dark:bg-[#2e0b10] text-[#f43f5e] dark:text-[#f87171] hover:bg-[#f43f5e] dark:hover:bg-[#f87171] hover:text-white dark:hover:text-[#111318]" data-id="${m.id}" data-name="${m.ho_ten || ''}" title="Xóa">
                  <span class="material-symbols-outlined" style="font-size:15px;">delete</span>
                </button>
                ` : ''}

              </div>
            </td>

        `;
      }).join('');
    }

    // Card layout cho mobile (≤640px)
    const cardRowsHtml = paginated.length === 0 ? `
      <div style="padding:40px 16px;text-align:center;color:var(--text-on-surface-variant);">
        <div style="display:flex;flex-direction:column;align-items:center;opacity:0.4;">
          <span class="material-symbols-outlined" style="font-size:40px;margin-bottom:8px;">person_search</span>
          <p style="font-weight:600;margin:0;">Không tìm thấy hội viên nào</p>
        </div>
      </div>
    ` : paginated.map(m => {
      const isExpiringSoon = m.trang_thai === 'sap_het_han';
      return `
        <div class="member-row" data-id="${m.id}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--outline-variant,#e2e8f0);cursor:pointer;transition:background 0.12s;background:var(--bg-surface-lowest,#fff);" onmouseover="this.style.background='rgba(29,147,54,0.04)'" onmouseout="this.style.background='var(--bg-surface-lowest,#fff)'">
          <div style="flex-shrink:0;">
            <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;border:2px solid #e2e8f0;">
              ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'sm', 'width:100%;height:100%;')}
            </div>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:700;color:var(--text-on-surface);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.ho_ten || '—'}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:2px;flex-wrap:wrap;">
              <span style="font-size:11px;font-weight:600;color:var(--text-on-surface-variant);">${m.ma_ho_so || '—'}</span>
              ${m.so_dien_thoai ? `<span style="font-size:11px;color:var(--text-on-surface-variant);">· ${m.so_dien_thoai}</span>` : ''}
              ${m.chi_nhanh ? `<span style="font-size:11px;color:#1D9336;font-weight:600;">· ${m.chi_nhanh}</span>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px;flex-wrap:wrap;">
              ${window.GymApp.statusBadge(m.trang_thai)}
              ${m.ten_goi_tap ? `<span style="font-size:11px;font-weight:600;color:var(--text-on-surface-variant);background:var(--bg-surface-container,#ebeef3);padding:1px 6px;border-radius:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px;" title="${m.ten_goi_tap}">${m.ten_goi_tap}</span>` : ''}
              ${m.ngay_het_han ? `<span style="font-size:11px;font-weight:600;color:${isExpiringSoon ? '#d97706' : 'var(--text-on-surface-variant)'};">HH: ${window.GymApp.formatDate(m.ngay_het_han)}</span>` : ''}
            </div>
          </div>
          <div style="display:flex;gap:4px;align-items:center;flex-shrink:0;">
            <button class="member-view-btn" data-id="${m.id}" title="Xem" style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#f0fdf4;color:#1D9336;border:none;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='#1D9336';this.style.color='#fff'" onmouseout="this.style.background='#f0fdf4';this.style.color='#1D9336'">
              <span class="material-symbols-outlined" style="font-size:15px;">visibility</span>
            </button>
            <button class="member-edit-btn" data-id="${m.id}" title="Sửa" style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#eff6ff;color:#3b82f6;border:none;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='#3b82f6';this.style.color='#fff'" onmouseout="this.style.background='#eff6ff';this.style.color='#3b82f6'">
              <span class="material-symbols-outlined" style="font-size:15px;">edit</span>
            </button>
            ${window.GymApp.auth.user?.vai_tro === 'admin' ? `
            <button class="member-delete-btn" data-id="${m.id}" data-name="${m.ho_ten || ''}" title="Xóa" style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#fff1f2;color:#f43f5e;border:none;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='#f43f5e';this.style.color='#fff'" onmouseout="this.style.background='#fff1f2';this.style.color='#f43f5e'">
              <span class="material-symbols-outlined" style="font-size:15px;">delete</span>
            </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    return `
      <style>
        .member-table-col-mahv   { display: table-cell; }
        .member-table-col-sdt    { display: table-cell; }
        .member-table-col-goi    { display: table-cell; }
        .member-table-col-pt     { display: table-cell; }
        .member-table-col-branch { display: table-cell; }
        .member-table-col-han    { display: table-cell; }
        .member-table-desktop    { display: block; }
        .member-table-mobile     { display: none; }
        
        /* Custom scrollbar cho bảng để tránh lổm màu trắng ở góc */
        #members-scroll-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        #members-scroll-container::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, #1D9336 40px, transparent 40px) !important;
        }
        #members-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 4px;
        }
        .dark #members-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
        }
        #members-scroll-container::-webkit-scrollbar-corner {
          background: transparent !important;
        }
        
        /* Cột cố định (Sticky) */
        .sticky-col-left {
          position: sticky !important;
          left: 0;
          z-index: 2;
          box-shadow: 2px 0 5px -2px rgba(0,0,0,0.1);
          transition: background-color 0.15s ease-in-out;
        }
        .sticky-col-right {
          position: sticky !important;
          right: 0;
          z-index: 2;
          box-shadow: -2px 0 5px -2px rgba(0,0,0,0.1);
          transition: background-color 0.15s ease-in-out;
        }
        th.sticky-col-left {
          z-index: 12 !important;
          background: #1D9336 !important;
        }
        th.sticky-col-right {
          z-index: 12 !important;
          background: #1D9336 !important;
        }
        
        /* Đồng bộ màu nền cho cột sticky theo dòng chẵn/lẻ */
        tr.member-row td.sticky-col-left,
        tr.member-row td.sticky-col-right {
          background: #fff !important;
        }
        tr.member-row:nth-child(odd) td.sticky-col-left,
        tr.member-row:nth-child(odd) td.sticky-col-right {
          background: #fafafa !important;
        }
        .dark tr.member-row td.sticky-col-left,
        .dark tr.member-row td.sticky-col-right {
          background: #1e1e1e !important;
        }
        .dark tr.member-row:nth-child(odd) td.sticky-col-left,
        .dark tr.member-row:nth-child(odd) td.sticky-col-right {
          background: #15171e !important;
        }

        /* Hiệu ứng hover đồng bộ cho các cột sticky (dùng mã màu solid pha trộn hoàn hảo để không bị lệch màu) */
        tr.member-row:hover td.sticky-col-left,
        tr.member-row:hover td.sticky-col-right {
          background: #f4faf5 !important; /* Trắng + 5% xanh thương hiệu */
        }
        tr.member-row:nth-child(odd):hover td.sticky-col-left,
        tr.member-row:nth-child(odd):hover td.sticky-col-right {
          background: #eff5f0 !important; /* Xám nhạt + 5% xanh thương hiệu */
        }
        .dark tr.member-row:hover td.sticky-col-left,
        .dark tr.member-row:hover td.sticky-col-right {
          background: #1e2a20 !important; /* Tối + 10% xanh thương hiệu */
        }
        .dark tr.member-row:nth-child(odd):hover td.sticky-col-left,
        .dark tr.member-row:nth-child(odd):hover td.sticky-col-right {
          background: #162320 !important; /* Tối lẻ + 10% xanh thương hiệu */
        }

        #members-scroll-container th { border-radius: 0 !important; }
        @media (max-width: 1000px) {
          .member-table-col-pt   { display: none; }
          .member-table-col-branch { display: none; }
        }
        @media (max-width: 900px) {
          .member-table-col-han  { display: none; }
        }
        @media (max-width: 700px) {
          .member-table-col-mahv { display: none; }
          .member-table-col-sdt  { display: none; }
          .member-table-col-goi  { display: none; }
        }
        @media (max-width: 640px) {
          .member-table-desktop  { display: none; }
          .member-table-mobile   { display: block; }
        }
      </style>
      <div class="col-span-full w-full rounded-2xl overflow-hidden border border-outline-variant shadow-sm">

        <!-- TABLE (≥641px) -->
        <div id="members-scroll-container" class="member-table-desktop" style="max-height: 500px; overflow-y: auto; overflow-x: auto; position: relative;">
          <table style="width:100%;border-collapse:collapse;min-width:480px;position:relative;">
            <thead>
              <tr>
                <th class="sticky-col-left" style="position:sticky;top:0;z-index:10;background:#1D9336;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Họ và tên</th>
                <th class="member-table-col-mahv" style="position:sticky;top:0;z-index:10;background:#1D9336;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Mã HV</th>
                <th class="member-table-col-sdt" style="position:sticky;top:0;z-index:10;background:#1D9336;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Số ĐT</th>
                <th class="member-table-col-goi" style="position:sticky;top:0;z-index:10;background:#1D9336;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Gói tập</th>
                <th class="member-table-col-pt" style="position:sticky;top:0;z-index:10;background:#1D9336;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">PT</th>
                <th style="position:sticky;top:0;z-index:10;background:#1D9336;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Trạng thái</th>
                <th class="member-table-col-branch" style="position:sticky;top:0;z-index:10;background:#1D9336;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Chi nhánh</th>
                <th class="member-table-col-han" style="position:sticky;top:0;z-index:10;background:#1D9336;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Hết hạn</th>
                <th class="sticky-col-right" style="position:sticky;top:0;z-index:10;background:#1D9336;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Thao tác</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>

        <!-- CARD LIST (≤640px) -->
        <div id="members-scroll-mobile-container" class="member-table-mobile" style="max-height: 500px; overflow-y: auto;">
          ${cardRowsHtml}
        </div>

        <!-- INFO / FOOTER -->
        <div class="px-standard py-standard border-t border-outline-variant bg-white dark:bg-[#1e1e1e] flex justify-between items-center text-body-sm font-medium text-on-surface-variant">
          <span>Hiển thị ${Math.min(self._memberPage * self._perPage, self._memberFiltered.length)} / ${self._memberFiltered.length} hội viên</span>
        </div>
      </div>
    `;
  },

  _renderPtCards: function () {
    const self = this;
    const paginated = self._ptFiltered.slice(0, self._ptPage * self._perPage);

    if (paginated.length === 0) {
      return `
        <div class="col-span-full py-20 text-center text-on-surface-variant bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border border-outline-variant shadow-sm">
           <div class="flex flex-col items-center opacity-40">
             <span class="material-symbols-outlined text-6xl mb-xs">sports_gymnastics</span>
             <p class="font-medium">Không tìm thấy huấn luyện viên nào</p>
           </div>
        </div>`;
    }

    let rowsHtml = paginated.map(pt => {
      const rating = pt.danh_gia || pt.rating || 0;
      const ratingDisplay = rating ? rating.toFixed(1) : '—';
      const isActive = (pt.trang_thai_lam_viec || pt.trang_thai) === 'hoat_dong';

      const ratingStars = Array.from({ length: 5 }, (_, i) =>
        `<span class="material-symbols-outlined text-xs" style="color:${i < Math.round(rating) ? '#fbbf24' : 'rgba(0,0,0,0.15)'};font-variation-settings:'FILL' 1;">star</span>`
      ).join('');

      const ratingHtml = `
        <div class="inline-flex items-center gap-1" title="${ratingDisplay}/5">
          <span class="font-bold text-body-sm text-brand-primary" style="margin-right:2px;">${ratingDisplay}</span>
          ${ratingStars}
        </div>
      `;

      const statusBadge = isActive
        ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#e7f5e9] dark:bg-[#0b2010] text-[#1D9336] dark:text-[#4cce5f]"><span class="w-1.5 h-1.5 rounded-full bg-[#1D9336] dark:bg-[#4cce5f]"></span>Đang làm việc</span>`
        : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#f1f5f9] dark:bg-[#1e293b] text-[#64748b] dark:text-[#94a3b8]"><span class="w-1.5 h-1.5 rounded-full bg-[#64748b] dark:bg-[#94a3b8]"></span>Tạm nghỉ</span>`;

      return `
        <tr class="pt-row transition-colors hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10 border-b border-outline-variant/30 cursor-pointer bg-white dark:bg-[#1e1e1e] odd:bg-[#fafafa] odd:dark:bg-[#15171e]" data-id="${pt.id}">
          <!-- Cột 1: Họ và tên -->
          <td class="border-r border-outline-variant/30" style="padding:8px 14px; white-space:nowrap; text-align:left;">
            <div style="display:flex; align-items:center; justify-content:left; gap:12px; margin:0 auto; max-width:240px;">
              <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;flex-shrink:0; border:2px solid #e2e8f0;box-shadow:0 2px 4px rgba(0,0,0,0.05);">
                ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten, 'sm', 'width:100%;height:100%;')}
              </div>
              <div style="min-width:0; text-align:left;">
                <div style="font-size:15px;font-weight:700;color:var(--text-on-surface); white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">
                  <button class="pt-name-link hover:text-brand-primary text-left font-bold text-body-md truncate cursor-pointer transition-colors" data-id="${pt.id}" title="${pt.ho_ten}">
                    ${pt.ho_ten}
                  </button>
                </div>
              </div>
            </div>
          </td>

          <!-- Cột 2: Mã HLV -->
          <td class="pt-table-col-code border-r border-outline-variant/30" style="padding:8px 14px; font-size:14px; font-weight:700; color:var(--text-on-surface-variant); white-space:nowrap; text-align:center;">
            PT-${pt.id || ''}
          </td>

          <!-- Cột Chi nhánh -->
          <td class="pt-table-col-branch border-r border-outline-variant/30" style="padding:8px 14px; font-size:14px; font-weight:600; color:var(--text-on-surface-variant); text-align:center;">
            ${pt.chi_nhanh || '—'}
          </td>

          <!-- Cột 3: Chuyên môn -->
          <td class="pt-table-col-spec border-r border-outline-variant/30" style="padding:8px 14px; font-size:14px; font-weight:600; color:var(--text-on-surface-variant); text-align:center;">
            ${pt.chuyen_mon || pt.specialty || 'Huấn luyện viên'}
          </td>

          <!-- Cột 4: Kinh nghiệm -->
          <td class="pt-table-col-exp border-r border-outline-variant/30" style="padding:8px 14px; font-size:14px; font-weight:600; color:var(--text-on-surface-variant); white-space:nowrap; text-align:center;">
            ${pt.kinh_nghiem || 0} năm
          </td>

          <!-- Cột 5: Đánh giá -->
          <td class="pt-table-col-rating border-r border-outline-variant/30" style="padding:8px 14px; text-align:center; white-space:nowrap;">
            ${ratingHtml}
          </td>

          <!-- Cột 6: Trạng thái -->
          <td class="pt-table-col-status border-r border-outline-variant/30" style="padding:8px 14px; white-space:nowrap; text-align:center;">
            ${statusBadge}
          </td>

          <!-- Cột 7: Thao tác -->
          <td style="padding:8px 14px; text-align:center; white-space:nowrap;">
            <div style="display:inline-flex;gap:4px;align-items:center;">
              <button class="pt-view-btn w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all bg-[#f0fdf4] dark:bg-[#0b2010] text-[#1D9336] dark:text-[#4cce5f] hover:bg-[#1D9336] dark:hover:bg-[#4cce5f] hover:text-white dark:hover:text-[#111318]" data-id="${pt.id}" title="Xem chi tiết">
                <span class="material-symbols-outlined" style="font-size:15px;">visibility</span>
              </button>
              <button class="pt-edit-btn w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all bg-[#eff6ff] dark:bg-[#0b1a30] text-[#3b82f6] dark:text-[#60a5fa] hover:bg-[#3b82f6] dark:hover:bg-[#60a5fa] hover:text-white dark:hover:text-[#111318]" data-id="${pt.id}" title="Chỉnh sửa">
                <span class="material-symbols-outlined" style="font-size:15px;">edit</span>
              </button>
              ${window.GymApp.auth.user?.vai_tro === 'admin' ? `
              <button class="pt-delete-btn w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all bg-[#fff1f2] dark:bg-[#2e0b10] text-[#f43f5e] dark:text-[#f87171] hover:bg-[#f43f5e] dark:hover:bg-[#f87171] hover:text-white dark:hover:text-[#111318]" data-id="${pt.id}" data-name="${pt.ho_ten || ''}" title="Xóa">
                <span class="material-symbols-outlined" style="font-size:15px;">delete</span>
              </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    const cardRowsHtml = paginated.map(pt => {
      const rating = pt.danh_gia || pt.rating || 0;
      const ratingDisplay = rating ? rating.toFixed(1) : '—';
      const isActive = (pt.trang_thai_lam_viec || pt.trang_thai) === 'hoat_dong';
      return `
        <div class="member-row" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--outline-variant,#e2e8f0);cursor:pointer;transition:background 0.12s;background:var(--bg-surface-lowest,#fff);" onmouseover="this.style.background='rgba(29,147,54,0.04)'" onmouseout="this.style.background='var(--bg-surface-lowest,#fff)'">
          <div style="flex-shrink:0;">
            <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;border:2px solid #e2e8f0;">
              ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten, 'sm', 'width:100%;height:100%;')}
            </div>
          </div>
          <div style="flex:1;min-width:0;text-align:left;">
            <div style="font-size:14px;font-weight:700;color:var(--text-on-surface);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              <button class="pt-name-link text-left" data-id="${pt.id}" style="font-weight:700;background:transparent;border:none;padding:0;cursor:pointer;color:var(--text-on-surface);">${pt.ho_ten || '—'}</button>
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:2px;flex-wrap:wrap;">
              <span style="font-size:11px;font-weight:600;color:var(--text-on-surface-variant);">PT-${pt.id || ''}</span>
              <span style="font-size:11px;color:var(--text-on-surface-variant);">· ${pt.chuyen_mon || pt.specialty || 'Huấn luyện viên'}</span>
            </div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px;flex-wrap:wrap;">
              ${isActive
          ? `<span style="font-size:10px;font-weight:800;padding:1px 6px;border-radius:4px;background:#e7f5e9;color:#1D9336;">Đang làm việc</span>`
          : `<span style="font-size:10px;font-weight:800;padding:1px 6px;border-radius:4px;background:#f1f5f9;color:#64748b;">Tạm nghỉ</span>`}
              <span style="font-size:11px;font-weight:600;color:var(--text-on-surface-variant);background:var(--bg-surface-container,#ebeef3);padding:1px 6px;border-radius:4px;white-space:nowrap;">KN: ${pt.kinh_nghiem || 0} năm</span>
              <span style="font-size:11px;font-weight:600;color:#fbbf24;">★ ${ratingDisplay}</span>
              <span style="font-size:11px;font-weight:600;color:#0284c7;background:#e0f2fe;padding:1px 6px;border-radius:4px;white-space:nowrap;">${pt.chi_nhanh || 'Chưa rõ'}</span>
            </div>
          </div>
          <div style="display:flex;gap:4px;align-items:center;flex-shrink:0;">
            <button class="pt-view-btn" data-id="${pt.id}" title="Xem" style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#f0fdf4;color:#1D9336;border:none;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='#1D9336';this.style.color='#fff'" onmouseout="this.style.background='#f0fdf4';this.style.color='#1D9336'">
              <span class="material-symbols-outlined" style="font-size:15px;">visibility</span>
            </button>
            <button class="pt-edit-btn" data-id="${pt.id}" title="Sửa" style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#eff6ff;color:#3b82f6;border:none;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='#3b82f6';this.style.color='#fff'" onmouseout="this.style.background='#eff6ff';this.style.color='#3b82f6'">
              <span class="material-symbols-outlined" style="font-size:15px;">edit</span>
            </button>
            ${window.GymApp.auth.user?.vai_tro === 'admin' ? `
            <button class="pt-delete-btn" data-id="${pt.id}" data-name="${pt.ho_ten || ''}" title="Xóa" style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#fff1f2;color:#f43f5e;border:none;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='#f43f5e';this.style.color='#fff'" onmouseout="this.style.background='#fff1f2';this.style.color='#f43f5e'">
              <span class="material-symbols-outlined" style="font-size:15px;">delete</span>
            </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    return `
      <style>
        .pt-table-col-code      { display: table-cell; }
        .pt-table-col-branch    { display: table-cell; }
        .pt-table-col-spec      { display: table-cell; }
        .pt-table-col-exp       { display: table-cell; }
        .pt-table-col-rating    { display: table-cell; }
        .pt-table-col-status    { display: table-cell; }
        .pt-table-desktop       { display: block; }
        .pt-table-mobile        { display: none; }
        #pt-scroll-container th { border-radius: 0 !important; }
        
        /* Custom scrollbar cho bảng HLV */
        #pt-scroll-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        #pt-scroll-container::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, #065f46 40px, transparent 40px) !important;
        }
        #pt-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 4px;
        }
        .dark #pt-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
        }
        #pt-scroll-container::-webkit-scrollbar-corner {
          background: transparent !important;
        }
        
        @media (max-width: 900px) {
          .pt-table-col-rating  { display: none; }
          .pt-table-col-exp     { display: none; }
          .pt-table-col-branch  { display: none; }
        }
        @media (max-width: 700px) {
          .pt-table-col-code    { display: none; }
          .pt-table-col-status  { display: none; }
        }
        @media (max-width: 640px) {
          .pt-table-desktop     { display: none; }
          .pt-table-mobile      { display: block; }
        }
      </style>
      
      <div class="col-span-full w-full rounded-2xl overflow-hidden border border-outline-variant shadow-sm">
        <!-- TABLE (≥641px) -->
        <div id="pt-scroll-container" class="pt-table-desktop" style="max-height: 500px; overflow-y: auto; overflow-x: auto; position: relative;">
          <table style="width:100%;border-collapse:collapse;min-width:480px;position:relative;">
            <thead>
              <tr>
                <th style="position:sticky;top:0;z-index:10;background:#065f46;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Họ và tên</th>
                <th class="pt-table-col-code" style="position:sticky;top:0;z-index:10;background:#065f46;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Mã HLV</th>
                <th class="pt-table-col-branch" style="position:sticky;top:0;z-index:10;background:#065f46;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Chi nhánh</th>
                <th class="pt-table-col-spec" style="position:sticky;top:0;z-index:10;background:#065f46;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Chuyên môn</th>
                <th class="pt-table-col-exp" style="position:sticky;top:0;z-index:10;background:#065f46;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Kinh nghiệm</th>
                <th class="pt-table-col-rating" style="position:sticky;top:0;z-index:10;background:#065f46;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Đánh giá</th>
                <th class="pt-table-col-status" style="position:sticky;top:0;z-index:10;background:#065f46;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Trạng thái</th>
                <th style="position:sticky;top:0;z-index:10;background:#065f46;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Thao tác</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>

        <!-- CARD LIST (≤640px) -->
        <div id="pt-scroll-mobile-container" class="pt-table-mobile" style="max-height: 500px; overflow-y: auto;">
          ${cardRowsHtml}
        </div>

        <!-- INFO / FOOTER -->
        <div class="px-standard py-standard border-t border-outline-variant bg-white dark:bg-[#1e1e1e] flex justify-between items-center text-body-sm font-medium text-on-surface-variant">
          <span>Hiển thị ${Math.min(self._ptPage * self._perPage, self._ptFiltered.length)} / ${self._ptFiltered.length} huấn luyện viên</span>
        </div>
      </div>
    `;
  },

  _showPtModal: async function (id) {
    const self = this;
    let pt = null;
    let ptMembers = [];
    let ptSchedules = [];
    this._showLoadingOverlay('Tải thông tin PT...');

    try {
      const [ptRes, membersRes, schedulesRes] = await Promise.all([
        window.GymApp.api.get(`/trainers/${id}`),
        window.GymApp.api.get(`/trainers/${id}/members`),
        window.GymApp.api.get(`/trainers/${id}/schedules`),
      ]);
      pt = ptRes?.data || (window.GymApp.data.pts || []).find(x => x.id == id);
      ptMembers = Array.isArray(membersRes?.data) ? membersRes.data
        : Array.isArray(membersRes?.data?.data) ? membersRes.data.data : [];
      ptSchedules = Array.isArray(schedulesRes?.data) ? schedulesRes.data
        : Array.isArray(schedulesRes?.data?.data) ? schedulesRes.data.data : [];

      // Cập nhật cache PT với dữ liệu mới từ API để thống kê luôn chính xác
      if (pt && ptRes?.data) {
        const ptIndex = (window.GymApp.data.pts || []).findIndex(x => x.id == id);
        if (ptIndex !== -1) {
          window.GymApp.data.pts[ptIndex] = { ...window.GymApp.data.pts[ptIndex], ...pt };
        }
      }
    } catch (err) {
      console.error('Failed to fetch PT details:', err);
      pt = (window.GymApp.data.pts || []).find(x => x.id == id);
    } finally {
      this._hideLoadingOverlay();
    }
    if (!pt) return;

    document.getElementById('gym-pt-modal')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'gym-pt-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);backdrop-filter:blur(6px);padding:16px;';

    const rating = pt.danh_gia || pt.rating || 0;
    const isActive = (pt.trang_thai_lam_viec || pt.trang_thai) === 'hoat_dong';
    const statusText = isActive ? '● Đang làm việc' : '○ Tạm nghỉ';
    const stars = Array.from({ length: 5 }, (_, i) =>
      `<span class="material-symbols-outlined" style="font-size:16px;color:${i < Math.round(rating) ? '#fbbf24' : 'rgba(255,255,255,0.3)'};font-variation-settings:'FILL' 1;">star</span>`
    ).join('');

    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:20px;width:100%;max-width:780px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;position:relative;box-shadow:0 24px 60px rgba(0,0,0,0.2);">

        <!-- Banner Header -->
        <div style="background:linear-gradient(135deg,#065f46 0%,#10b981 60%,#34d399 100%);padding:20px 24px 0;flex-shrink:0;position:relative;overflow:hidden;">
          <div style="position:absolute;top:-30px;right:-30px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.07);"></div>
          <div style="position:absolute;top:20px;right:60px;width:70px;height:70px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>

          <!-- Nút đóng -->
          <button id="close-pt-modal" style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,0.15);border:none;cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'" title="Đóng">
            <span class="material-symbols-outlined" style="color:#fff;font-size:18px;">close</span>
          </button>

          <!-- Avatar + Thông tin chính -->
          <div style="display:flex;align-items:flex-end;gap:16px;margin-bottom:16px;">
            <div style="position:relative;flex-shrink:0;">
              <div style="width:72px;height:72px;border-radius:50%;border:3px solid rgba(255,255,255,0.6);overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.25);">
                ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten, 'lg', 'width:100%;height:100%;')}
              </div>
              <span style="position:absolute;bottom:2px;right:2px;width:14px;height:14px;border-radius:50%;background:${isActive ? '#4ade80' : '#94a3b8'};border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></span>
            </div>
            <div style="flex:1;min-width:0;padding-bottom:4px;">
              <h3 style="font-size:20px;font-weight:800;color:#fff;line-height:1.2;margin:0 0 4px;text-shadow:0 1px 4px rgba(0,0,0,0.2);">${pt.ho_ten || '—'}</h3>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span style="font-size:12px;color:rgba(255,255,255,0.8);">Huấn luyện viên</span>
                <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:${isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};color:#fff;border:1px solid rgba(255,255,255,0.3);">${statusText}</span>
              </div>
              <!-- Rating stars -->
              <div style="display:flex;align-items:center;gap:4px;margin-top:6px;">
                ${stars}
                <span style="font-size:12px;font-weight:700;color:#fff;margin-left:4px;">${rating ? rating.toFixed(1) : '—'}/5</span>
              </div>
            </div>
          </div>

          <!-- Quick Stats Bar -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,0.15);border-radius:12px 12px 0 0;overflow:hidden;">
            <div style="background:rgba(0,0,0,0.15);padding:10px 14px;backdrop-filter:blur(4px);">
              <div style="font-size:10px;color:rgba(255,255,255,0.65);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">Chuyên môn</div>
              <div style="font-size:13px;font-weight:800;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${pt.chuyen_mon || '—'}">${pt.chuyen_mon || '—'}</div>
            </div>
            <div style="background:rgba(0,0,0,0.15);padding:10px 14px;backdrop-filter:blur(4px);">
              <div style="font-size:10px;color:rgba(255,255,255,0.65);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">Kinh nghiệm</div>
              <div style="font-size:13px;font-weight:800;color:#fff;">${pt.kinh_nghiem || 0} năm</div>
            </div>
            <div style="background:rgba(0,0,0,0.15);padding:10px 14px;backdrop-filter:blur(4px);">
              <div style="font-size:10px;color:rgba(255,255,255,0.65);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">Học viên</div>
              <div style="font-size:13px;font-weight:800;color:#fff;">${pt.so_hoc_vien || ptMembers.length || 0} người</div>
            </div>
          </div>
        </div>

        <!-- Tab Bar -->
        <div style="display:flex;background:var(--bg-surface-lowest);border-bottom:1px solid var(--outline-variant);flex-shrink:0;padding:0 16px;">
          ${[['info', 'Thông tin', 'info'], ['members', 'Học viên', 'people'], ['schedule', 'Lịch dạy', 'event_note'], ['reviews', 'Đánh giá', 'star']].map(([t, l, ic]) => `
            <button class="pt-detail-tab" data-ptab="${t}" style="display:flex;align-items:center;gap:6px;padding:12px 16px;font-size:13px;font-weight:700;border:none;background:transparent;cursor:pointer;border-bottom:2.5px solid transparent;transition:all 0.2s;color:var(--text-on-surface-variant);white-space:nowrap;">
              <span class="material-symbols-outlined" style="font-size:16px;">${ic}</span>${l}
            </button>
          `).join('')}
        </div>

        <!-- Body -->
        <div id="pt-modal-body" style="overflow-y:auto;flex:1;padding:20px 24px;" class="bg-surface-container-lowest">
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const setTab = (t) => {
      overlay.querySelectorAll('.pt-detail-tab').forEach(btn => {
        const active = btn.dataset.ptab === t;
        btn.style.color = active ? '#10b981' : 'var(--text-on-surface-variant)';
        btn.style.borderBottomColor = active ? '#10b981' : 'transparent';
        btn.style.fontWeight = active ? '800' : '700';
      });
      document.getElementById('pt-modal-body').innerHTML = self._renderPtTab(t, pt, ptMembers, ptSchedules);
      self._bindPtModalTabEvents(t, pt);
    };

    overlay.querySelectorAll('.pt-detail-tab').forEach(btn => {
      btn.addEventListener('click', () => setTab(btn.dataset.ptab));
    });
    setTab('info');

    const close = () => overlay.remove();
    document.getElementById('close-pt-modal').addEventListener('click', close);
    const escH = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escH); } };
    document.addEventListener('keydown', escH);
  },

  _renderPtTab: function (tab, pt, ptMembers, ptSchedules) {
    const sectionTitle = (icon, title, color = '#0ea5e9') => `
      <div style="display:flex;align-items:center;gap:8px;margin:16px 0 6px;">
        <span class="material-symbols-outlined" style="font-size:15px;color:${color};font-variation-settings:'FILL' 1;">${icon}</span>
        <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:${color};">${title}</span>
        <div style="flex:1;height:1px;background:linear-gradient(to right,${color}40,transparent);margin-left:4px;"></div>
      </div>`;

    const infoRow = (icon, label, value, wrap = false) => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg-surface-lowest, #fff);">
        <div style="width:32px;height:32px;border-radius:8px;background:var(--bg-surface-low, #eff8ff);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span class="material-symbols-outlined" style="font-size:16px;color:#0ea5e9;font-variation-settings:'FILL' 1;">${icon}</span>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-on-surface-variant, #3f4a3c);opacity:0.6;margin-bottom:2px;">${label}</div>
          <div style="font-size:13px;font-weight:700;color:var(--text-on-surface, #1a2018);line-height:1.4;${wrap ? '' : 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'}" title="${value || '—'}">${value || '—'}</div>
        </div>
      </div>`;

    if (tab === 'info') {
      const hasAccount = !!pt.tai_khoan_id;
      return `
        ${sectionTitle('badge', 'Thông tin cá nhân')}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-[1px] bg-outline-variant rounded-xl overflow-hidden border border-outline-variant">
          ${infoRow('badge', 'Mã HLV', `PT-${pt.id || ''}`)}
          ${infoRow('call', 'Số điện thoại', pt.so_dien_thoai || pt.phone)}
          ${infoRow('mail', 'Email', pt.email)}
          ${infoRow('store', 'Chi nhánh', pt.chi_nhanh)}
          ${infoRow('sports_gymnastics', 'Chuyên môn', pt.chuyen_mon || pt.specialty)}
          ${infoRow('military_tech', 'Kinh nghiệm', `${pt.kinh_nghiem || 0} năm`)}
          ${infoRow('calendar_today', 'Ngày gia nhập', window.GymApp.formatDate(pt.ngay_tao || pt.joinDate))}
          ${infoRow('how_to_reg', 'Tổng buổi đã dạy', `${pt.tong_buoi_da_day || pt.sessions || 0} buổi`)}
          <div class="col-span-1 sm:col-span-2">${infoRow('edit_note', 'Ghi chú', pt.ghi_chu || '—', true)}</div>
        </div>

        ${sectionTitle('bar_chart', 'Thống kê')}
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-standard mb-standard">
          ${[
          { icon: 'people', label: 'Học viên hiện tại', value: pt.so_hoc_vien || 0, color: '#0ea5e9', bg: 'var(--bg-surface-low, #eff8ff)' },
          { icon: 'star', label: 'Đánh giá trung bình', value: (pt.danh_gia || pt.rating || 0).toFixed(1) + ' ★', color: '#f59e0b', bg: 'var(--bg-surface-low, #fffbeb)' },
          { icon: 'play_lesson', label: 'Tổng buổi dạy', value: pt.tong_buoi_da_day || pt.sessions || 0, color: '#10b981', bg: 'var(--bg-surface-low, #f0fdf4)' },
        ].map(s => `
            <div style="background:var(--bg-surface-lowest, #fff);border:1px solid var(--outline-variant, #e2e8f0);border-radius:12px;padding:14px;text-align:center;">
              <div style="width:40px;height:40px;border-radius:10px;background:${s.bg};display:flex;align-items:center;justify-content:center;margin:0 auto 8px;">
                <span class="material-symbols-outlined" style="color:${s.color};font-size:22px;font-variation-settings:'FILL' 1;">${s.icon}</span>
              </div>
              <div style="font-size:18px;font-weight:800;color:var(--text-on-surface,#1a2018);">${s.value}</div>
              <div style="font-size:11px;color:var(--text-on-surface-variant,#64748b);font-weight:600;margin-top:2px;">${s.label}</div>
            </div>
          `).join('')}
        </div>

        <div style="margin-top:16px;border:1px solid var(--outline-variant,#e0e5de);border-radius:12px;overflow:hidden;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--bg-surface-container,#eff2ef);">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="material-symbols-outlined" style="font-size:16px;color:#0ea5e9;font-variation-settings:'FILL' 1;">manage_accounts</span>
              <span style="font-size:13px;font-weight:700;color:var(--text-on-surface,#1a2018);">Tài khoản đăng nhập</span>
            </div>
            ${hasAccount
          ? `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#e7f5e9] dark:bg-[#0b2010] text-[#1D9336] dark:text-[#4cce5f]">✓ Đã có tài khoản</span>`
          : `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#fff3e0] dark:bg-[#20120b] text-[#e65100] dark:text-[#ffa726]">Chưa có tài khoản</span>`}
          </div>
          <div style="padding:12px 16px;background:var(--bg-surface-lowest,#fff);">
            ${hasAccount
          ? `<p style="font-size:13px;color:var(--text-on-surface-variant,#3f4a3c);">PT này đã được liên kết với tài khoản đăng nhập.</p>`
          : `<div class="grid grid-cols-1 sm:grid-cols-2 gap-standard" id="pt-modal-account-form">
                  <div>
                    <label style="display:block;font-size:11px;font-weight:700;color:var(--text-on-surface-variant);margin-bottom:4px;">Tên đăng nhập <span style="color:#ba1a1a;">*</span></label>
                    <input id="pt-modal-username" type="text" value="${pt.so_dien_thoai || ''}" placeholder="Số điện thoại hoặc tên đăng nhập"
                      style="width:100%;padding:8px 12px;border:1px solid var(--outline-variant);border-radius:8px;outline:none;font-size:13px;box-sizing:border-box;background:var(--bg-surface-lowest);color:var(--text-on-surface);" />
                  </div>
                  <div>
                    <label style="display:block;font-size:11px;font-weight:700;color:var(--text-on-surface-variant);margin-bottom:4px;">Mật khẩu <span style="color:#ba1a1a;">*</span></label>
                    <input id="pt-modal-password" type="password" placeholder="Ít nhất 6 ký tự"
                      style="width:100%;padding:8px 12px;border:1px solid var(--outline-variant);border-radius:8px;outline:none;font-size:13px;box-sizing:border-box;background:var(--bg-surface-lowest);color:var(--text-on-surface);" />
                  </div>
                  <div style="grid-column:1/-1;display:flex;justify-content:flex-end;">
                    <button id="btn-pt-create-account" data-id="${pt.id}"
                      style="display:flex;align-items:center;gap:6px;padding:8px 16px;background:#1D9336;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">
                      <span class="material-symbols-outlined" style="font-size:16px;">person_add</span>
                      Tạo tài khoản
                    </button>
                  </div>
                </div>`}
          </div>
        </div>
      `;
    }

    if (tab === 'members') {
      if (ptMembers.length === 0) {
        return `
          <div style="text-align:center;padding:60px 20px;color:var(--text-on-surface-variant, #64748b);background:var(--bg-surface-low, #f8fafc);border-radius:16px;border:1px dashed var(--outline-variant, #cbd5e1);">
            <span class="material-symbols-outlined" style="font-size:48px;opacity:0.3;display:block;margin-bottom:12px;">person_search</span>
            <p style="font-size:14px;font-weight:600;margin:0;">PT chưa có học viên nào</p>
          </div>`;
      }
      return `
        <div style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">
          <h4 style="font-size:14px;font-weight:800;color:var(--text-on-surface);margin:0;">Danh sách học viên (${ptMembers.length})</h4>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
          ${ptMembers.map(m => {
        const isActive = m.trang_thai === 'con_han' || m.trang_thai === 'active' || m.trang_thai === 'dang_tap';
        const isCheckedIn = m.da_check_in_hom_nay == 1;
        return `
              <div style="background:var(--bg-surface-lowest, #fff);border:1px solid var(--outline-variant, #e2e8f0);border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,0.03);transition:transform 0.2s,box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.03)'">
                <div style="position:relative;flex-shrink:0;">
                  ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'sm')}
                  <span style="position:absolute;bottom:0;right:0;width:10px;height:10px;border-radius:50%;background:${isCheckedIn ? '#4ade80' : '#94a3b8'};border:2px solid var(--bg-surface-lowest, #fff);"></span>
                </div>
                <div style="flex:1;min-width:0;">
                  <button class="pt-member-link text-left" data-mid="${m.id}" style="font-size:13px;font-weight:700;color:var(--text-on-surface);background:transparent;border:none;padding:0;cursor:pointer;display:block;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" onmouseover="this.style.color='#0ea5e9'" onmouseout="this.style.color='var(--text-on-surface)'">
                    ${m.ho_ten || '—'}
                  </button>
                  <div style="font-size:11px;color:var(--text-on-surface-variant, #64748b);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.ten_goi_tap || 'Chưa ĐK gói'}</div>
                  <div style="margin-top:4px;">${window.GymApp.statusBadge(m.trang_thai)}</div>
                </div>
              </div>
            `;
      }).join('')}
        </div>
      `;
    }

    if (tab === 'schedule') {
      const today = new Date(); today.setHours(0, 0, 0, 0);

      if (ptSchedules.length === 0) {
        return `
          <div style="text-align:center;padding:60px 20px;color:var(--text-on-surface-variant, #64748b);background:var(--bg-surface-low, #f8fafc);border-radius:16px;border:1px dashed var(--outline-variant, #cbd5e1);">
            <span class="material-symbols-outlined" style="font-size:48px;opacity:0.3;display:block;margin-bottom:12px;">event_note</span>
            <p style="font-size:14px;font-weight:600;margin:0;">Chưa có lịch dạy nào</p>
          </div>`;
      }

      const grouped = {};
      ptSchedules.forEach(s => {
        const dateKey = s.ngay_tap || s.date || '';
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(s);
      });

      const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

      return `
        <div style="margin-bottom:12px;">
          <h4 style="font-size:14px;font-weight:800;color:var(--text-on-surface);margin:0 0 4px;">Lịch dạy gần đây (${ptSchedules.length} buổi)</h4>
        </div>
        ${sortedDates.map(dateKey => {
        const dateObj = new Date(dateKey);
        const isPast = dateObj < today;
        const dateLabel = dateObj.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
        return `
            <div style="margin-bottom:20px;">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                <div style="padding:4px 12px;border-radius:999px;background:${isPast ? 'var(--bg-surface-low, #f1f5f9)' : 'rgba(29, 147, 54, 0.1)'};border:1px solid ${isPast ? 'var(--outline-variant, #e2e8f0)' : 'rgba(29, 147, 54, 0.2)'};">
                  <span style="font-size:12px;font-weight:700;color:${isPast ? 'var(--text-on-surface-variant, #64748b)' : '#166534'};text-transform:capitalize;">${dateLabel}</span>
                </div>
                <div style="flex:1;height:1px;background:var(--outline-variant, #e2e8f0);"></div>
              </div>
              ${grouped[dateKey].map(s => {
          const statusStr = s.trang_thai || s.status || 'cho_tap';
          return `
                  <div style="display:flex;align-items:stretch;gap:14px;background:var(--bg-surface-lowest, #fff);border:1px solid var(--outline-variant, #e2e8f0);border-radius:12px;overflow:hidden;margin-bottom:8px;box-shadow:0 2px 6px rgba(0,0,0,0.02);">
                    <div style="background:${isPast ? 'var(--bg-surface-low, #f1f5f9)' : 'rgba(29, 147, 54, 0.1)'};width:72px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 6px;border-right:1px dashed var(--outline-variant, #e2e8f0);flex-shrink:0;">
                      <span style="font-size:22px;font-weight:800;color:${isPast ? 'var(--text-on-surface-variant, #475569)' : '#1D9336'};line-height:1;">${String(dateObj.getDate()).padStart(2, '0')}</span>
                      <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:${isPast ? 'var(--text-on-surface-variant, #94a3b8)' : '#16a34a'};margin-top:2px;">Tháng ${dateObj.getMonth() + 1}</span>
                    </div>
                    <div style="flex:1;padding:12px;display:flex;flex-direction:column;justify-content:center;">
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                        <div style="display:flex;align-items:center;gap:6px;">
                          <span class="material-symbols-outlined" style="font-size:15px;color:#64748b;">schedule</span>
                          <span style="font-size:13px;font-weight:800;color:var(--text-on-surface, #1e293b);">${s.gio_bat_dau || s.startTime || '—'} — ${s.gio_ket_thuc || s.endTime || '—'}</span>
                        </div>
                        ${window.GymApp.statusBadge(statusStr)}
                      </div>
                      <div style="display:flex;align-items:center;gap:14px;font-size:12px;color:var(--text-on-surface-variant, #475569);flex-wrap:wrap;">
                        <span style="display:flex;align-items:center;gap:4px;"><span class="material-symbols-outlined" style="font-size:13px;opacity:0.7;">person</span>HV: <b>${s.ten_hoi_vien || s.memberName || '—'}</b></span>
                      </div>
                      ${s.ghi_chu ? `<div style="margin-top:5px;font-size:12px;color:var(--text-on-surface-variant, #64748b);font-style:italic;">📝 ${s.ghi_chu}</div>` : ''}
                    </div>
                  </div>
                `;
        }).join('')}
            </div>
          `;
      }).join('')}
      `;
    }

    if (tab === 'reviews') {
      const reviews = pt.danh_sach_danh_gia || [];
      if (reviews.length === 0) {
        return `
          <div style="text-align:center;padding:60px 20px;color:var(--text-on-surface-variant, #64748b);background:var(--bg-surface-low, #f8fafc);border-radius:16px;border:1px dashed var(--outline-variant, #cbd5e1);">
            <span class="material-symbols-outlined" style="font-size:48px;opacity:0.3;display:block;margin-bottom:12px;">rate_review</span>
            <p style="font-size:14px;font-weight:600;margin:0;">Chưa có đánh giá nào từ hội viên</p>
          </div>`;
      }

      return `
        <div style="margin-bottom:12px;">
          <h4 style="font-size:14px;font-weight:800;color:var(--text-on-surface);margin:0 0 8px;">Nhận xét từ hội viên (${reviews.length} lượt)</h4>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${reviews.map(r => {
        const stars = Array.from({ length: 5 }, (_, i) =>
          `<span class="material-symbols-outlined text-[13px]" style="color:${i < r.so_sao ? '#fbbf24' : 'rgba(0,0,0,0.12)'};font-variation-settings:'FILL' 1;">star</span>`
        ).join('');
        const dateStr = window.GymApp.formatDate(r.ngay_tao);

        let tagsHtml = '';
        if (Array.isArray(r.tags) && r.tags.length > 0) {
          tagsHtml = `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
                ${r.tags.map(tag => `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;background:rgba(29, 147, 54, 0.08);color:#1D9336;"># ${tag}</span>`).join('')}
              </div>`;
        }

        return `
              <div style="background:var(--bg-surface-lowest, #fff);border:1px solid var(--outline-variant, #e2e8f0);border-radius:14px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.02);">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="flex-shrink:0;width:36px;height:36px;border-radius:50%;overflow:hidden;border:1.5px solid #e2e8f0;">
                      ${window.GymApp.avatarImg(r.avatar_hoi_vien, r.ten_hoi_vien, 'sm', 'width:100%;height:100%;')}
                    </div>
                    <div>
                      <div style="font-size:13px;font-weight:800;color:var(--text-on-surface);">${r.ten_hoi_vien || 'Hội viên ẩn danh'}</div>
                      <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                        ${stars}
                        <span style="font-size:11px;color:var(--text-on-surface-variant,#64748b);font-weight:600;margin-left:4px;">${r.so_sao} sao</span>
                      </div>
                    </div>
                  </div>
                  <div style="font-size:11px;color:var(--text-on-surface-variant, #94a3b8);font-weight:600;">
                    ${dateStr}
                  </div>
                </div>
                ${r.noi_dung ? `<div style="margin-top:10px;font-size:13px;color:var(--text-on-surface,#334155);line-height:1.5;padding:8px 12px;background:var(--bg-surface-low, #f8fafc);border-radius:8px;font-style:italic;">"${r.noi_dung}"</div>` : ''}
                ${tagsHtml}
              </div>
            `;
      }).join('')}
        </div>
      `;
    }
    return '';
  },

  _bindPtModalTabEvents: function (tab, pt) {
    if (tab === 'info') {
      document.getElementById('btn-pt-create-account')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-pt-create-account');
        const username = document.getElementById('pt-modal-username')?.value.trim();
        const password = document.getElementById('pt-modal-password')?.value;
        if (!username || !password) return window.GymApp.toast('Vui lòng nhập đủ tên đăng nhập và mật khẩu.', 'error');
        btn.disabled = true;
        btn.innerHTML = '<span class="animate-spin material-symbols-outlined" style="font-size:16px;">sync</span> Đang tạo...';
        try {
          const res = await window.GymApp.api.post(`/members/${pt.id}/create-account`, { ten_dang_nhap: username, mat_khau: password });
          if (res.success) {
            window.GymApp.toast(`Đã tạo tài khoản "${username}" thành công!`, 'success');
            document.getElementById('gym-pt-modal')?.remove();
          } else {
            window.GymApp.toast(res.message || 'Không thể tạo tài khoản.', 'error');
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;">person_add</span> Tạo tài khoản';
          }
        } catch (e) {
          window.GymApp.toast('Lỗi kết nối máy chủ.', 'error');
          btn.disabled = false;
          btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;">person_add</span> Tạo tài khoản';
        }
      });
    }
    if (tab === 'members') {
      document.querySelectorAll('.pt-member-link').forEach(el => {
        el.addEventListener('click', () => {
          document.getElementById('gym-pt-modal')?.remove();
          this._showMemberModal(el.dataset.mid);
        });
      });
    }
  },

  _showPtEditModal: async function (id) {
    const self = this;
    let pt = null;
    this._showLoadingOverlay('Tải thông tin...');
    try {
      const res = await window.GymApp.api.get(`/trainers/${id}`);
      pt = res?.data || null;
    } catch (_) { }
    this._hideLoadingOverlay();
    if (!pt) {
      pt = (window.GymApp.data.pts || []).find(x => x.id == id);
    }
    if (!pt) { window.GymApp.toast('Không tìm thấy thông tin PT!', 'error'); return; }

    const branchOptions = [
      { v: 'Chi nhánh Gò Vấp', l: 'Chi nhánh Gò Vấp' },
      { v: 'Chi nhánh Bình Thạnh', l: 'Chi nhánh Bình Thạnh' },
      { v: 'Chi nhánh Tân Bình', l: 'Chi nhánh Tân Bình' },
      { v: 'Chi nhánh Phú Nhuận', l: 'Chi nhánh Phú Nhuận' },
      { v: 'Chi nhánh Quận 1', l: 'Chi nhánh Quận 1' },
      { v: 'Chi nhánh Quận 3', l: 'Chi nhánh Quận 3' },
      { v: 'Chi nhánh Quận 5', l: 'Chi nhánh Quận 5' },
      { v: 'Chi nhánh Quận 7', l: 'Chi nhánh Quận 7' },
      { v: 'Chi nhánh Quận 10', l: 'Chi nhánh Quận 10' },
      { v: 'Chi nhánh Bình Tân', l: 'Chi nhánh Bình Tân' },
      { v: 'Chi nhánh Thủ Đức', l: 'Chi nhánh Thủ Đức' },
      { v: 'Chi nhánh Nhà Bè', l: 'Chi nhánh Nhà Bè' }
    ];

    document.getElementById('gym-pt-edit-modal')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'gym-pt-edit-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);backdrop-filter:blur(6px);padding:16px;';

    const field = (icon, label, fid, type, value, required = false, readonly = false, isFull = false) => `
      <div class="${isFull ? 'col-span-full' : ''}">
        <label class="text-on-surface-variant text-body-sm uppercase font-bold tracking-wider block mb-1 opacity-80">${label}${required ? ' <span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>' : ''}</label>
        <div class="relative group">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors text-[18px]">${icon}</span>
          <input id="pte-${fid}" type="${type}" value="${value || ''}" ${readonly
        ? 'readonly class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-10 pr-4 py-2.5 rounded-xl outline-none cursor-not-allowed text-body-md font-medium opacity-70"'
        : 'class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-10 pr-4 py-2.5 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-body-md font-medium transition-all"'} />
        </div>
      </div>
    `;

    const selectField = (icon, label, fid, options, selectedValue, isFull = false) => `
      <div class="${isFull ? 'col-span-full' : ''}">
        <label class="text-on-surface-variant text-body-sm uppercase font-bold tracking-wider block mb-1 opacity-80">${label}</label>
        <div class="relative group">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors text-[18px] z-10">${icon}</span>
          <select id="pte-${fid}" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-10 pr-10 py-2.5 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-body-md font-medium transition-all cursor-pointer relative z-0" style="appearance:none !important;-webkit-appearance:none !important;-moz-appearance:none !important;background-image:none !important;">
            ${options.map(o => `<option value="${o.v}" ${o.v === selectedValue ? 'selected' : ''}>${o.l}</option>`).join('')}
          </select>
          <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none z-10">expand_more</span>
        </div>
      </div>
    `;

    const textareaField = (icon, label, fid, value, isFull = false) => `
      <div class="${isFull ? 'col-span-full' : ''}">
        <label class="text-on-surface-variant text-body-sm uppercase font-bold tracking-wider block mb-1 opacity-80">${label}</label>
        <div class="relative group">
          <span class="material-symbols-outlined absolute left-3 top-3 text-outline group-focus-within:text-brand-primary transition-colors text-[18px]">${icon}</span>
          <textarea id="pte-${fid}" rows="2" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-10 pr-4 py-2.5 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-body-md font-medium transition-all resize-none">${value || ''}</textarea>
        </div>
      </div>
    `;

    overlay.innerHTML = `
      <div style="border-radius:24px;width:100%;max-width:560px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.2);background:var(--bg-surface-lowest);">
        <div style="padding:24px 24px 16px;flex-shrink:0;position:relative;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--outline-variant);border-top-left-radius:24px;border-top-right-radius:24px;">
          <div>
            <h3 style="font-size:20px;font-weight:800;color:var(--text-on-surface);margin:0 0 4px;">Chỉnh sửa hồ sơ HLV</h3>
            <p style="font-size:13px;color:var(--text-on-surface-variant);margin:0;opacity:0.8;">Mã HLV: ${pt.ma_ho_so || '—'}</p>
          </div>
          <button id="close-pt-edit-modal" style="background:var(--bg-surface-variant);border:none;cursor:pointer;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;" class="hover:bg-outline-variant/30 transition-all">
            <span class="material-symbols-outlined" style="color:var(--text-on-surface);font-size:20px;">close</span>
          </button>
        </div>
        <div class="bg-surface-container-lowest overflow-y-auto flex-1 p-loose" style="display:flex;flex-direction:column;gap:20px;">
          <!-- Avatar Preview Centered -->
          <div style="display:flex;justify-content:center;margin-bottom:8px;">
            <div id="pte-avatar-container" class="relative group cursor-pointer" title="Nhấn để đổi ảnh đại diện">
              <div style="width:90px;height:90px;border-radius:50%;border:4px solid var(--brand-primary-container);overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);" id="pte-avatar-preview">
                ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten, 'lg', 'width:100%;height:100%;object-fit:cover;border-radius:50%;')}
              </div>
              <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="material-symbols-outlined text-white text-[22px]">photo_camera</span>
              </div>
              <input type="file" id="pte-avatar-input" accept="image/*" style="display:none;" />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-x-standard gap-y-4">
            ${field('person', 'Họ và tên', 'ho_ten', 'text', pt.ho_ten, true, false, true)}
            ${field('call', 'Số điện thoại', 'so_dien_thoai', 'tel', pt.so_dien_thoai, false)}
            ${field('mail', 'Email', 'email', 'email', pt.email, false)}
            ${field('fitness_center', 'Chuyên môn', 'chuyen_mon', 'text', pt.chuyen_mon || pt.specialty, false)}
            ${field('work_history', 'Kinh nghiệm (năm)', 'kinh_nghiem', 'number', pt.kinh_nghiem || 0, false)}
            ${selectField('store', 'Chi nhánh', 'chi_nhanh', branchOptions, pt.chi_nhanh, false)}
            ${selectField('toggle_on', 'Trạng thái', 'trang_thai', [{ v: 'hoat_dong', l: 'Đang làm việc' }, { v: 'tam_nghi', l: 'Tạm nghỉ' }], pt.trang_thai_lam_viec || 'hoat_dong', false)}
            ${textareaField('description', 'Ghi chú', 'ghi_chu', pt.ghi_chu, true)}
          </div>
        </div>
        <div class="bg-surface-container-lowest px-loose py-standard border-t border-outline-variant flex gap-standard justify-end flex-shrink-0" style="border-bottom-left-radius:24px;border-bottom-right-radius:24px;">
          <button id="cancel-pt-edit" class="px-loose py-2.5 rounded-xl border-2 border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-all active:scale-95">Hủy</button>
          <button id="save-pt-edit" class="px-loose py-2.5 rounded-xl font-bold text-white hover:opacity-90 transition-all flex items-center gap-xs active:scale-95 shadow-md hover:shadow-lg" style="background:#10b981;">
            <span class="material-symbols-outlined text-sm">save</span> Lưu thay đổi
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    let ptAvatarFile = null;

    document.getElementById('pte-avatar-container').addEventListener('click', () => {
      document.getElementById('pte-avatar-input').click();
    });

    document.getElementById('pte-avatar-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        window.GymApp.toast('Ảnh vượt quá 5MB!', 'error');
        return;
      }
      ptAvatarFile = file;
      const reader = new FileReader();
      reader.onload = (re) => {
        document.getElementById('pte-avatar-preview').innerHTML = `<img src="${re.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('close-pt-edit-modal').addEventListener('click', close);
    document.getElementById('cancel-pt-edit').addEventListener('click', close);

    document.getElementById('save-pt-edit').addEventListener('click', async () => {
      const btn = document.getElementById('save-pt-edit');
      const ho_ten = document.getElementById('pte-ho_ten').value.trim();
      if (!ho_ten) { window.GymApp.toast('Họ tên không được để trống!', 'error'); return; }

      btn.disabled = true;
      btn.innerHTML = '<span class="animate-spin material-symbols-outlined text-sm">sync</span> Đang lưu...';
      try {
        if (ptAvatarFile) {
          const fd = new FormData();
          fd.append('avatar', ptAvatarFile);
          await window.GymApp.api.upload(`/trainers/${id}/avatar`, fd);
        }

        const updatePayload = {
          ho_ten,
          so_dien_thoai: document.getElementById('pte-so_dien_thoai').value.trim(),
          email: document.getElementById('pte-email').value.trim(),
          chuyen_mon: document.getElementById('pte-chuyen_mon').value.trim(),
          kinh_nghiem: parseInt(document.getElementById('pte-kinh_nghiem').value) || 0,
          chi_nhanh: document.getElementById('pte-chi_nhanh').value,
          trang_thai: document.getElementById('pte-trang_thai').value,
          ghi_chu: document.getElementById('pte-ghi_chu').value.trim(),
        };

        await window.GymApp.api.put(`/trainers/${id}`, updatePayload);
        window.GymApp.toast('Đã cập nhật thông tin PT thành công!', 'success');

        if (window.GymApp.fetchInitialData) {
          await window.GymApp.fetchInitialData();
        } else {
          const idx = (window.GymApp.data.pts || []).findIndex(x => x.id == id);
          if (idx !== -1) {
            window.GymApp.data.pts[idx] = { ...window.GymApp.data.pts[idx], ...updatePayload };
          }
        }
        self._ptFiltered = [...(window.GymApp.data.pts || [])];
        self._applyPtFilter();

        close();
      } catch (err) {
        window.GymApp.toast(err.message || 'Lỗi khi lưu thông tin PT', 'error');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm align-middle">save</span> Lưu thay đổi';
      }
    });
  },

  _showMemberModal: async function (id) {
    const self = this;
    let m = null;
    let pkgHistory = [];
    let memberSchedules = [];

    const _fetchModalData = async () => {
      const [memberRes, historyRes, schedRes] = await Promise.all([
        window.GymApp.api.get(`/members/${id}`),
        window.GymApp.api.get(`/members/${id}/history`),
        window.GymApp.api.get(`/pt/schedules?hoi_vien_id=${id}`),
      ]);
      const listMember = (window.GymApp.data.members || []).find(x => (x.id || x.ho_so_id) == id) || {};
      m = { ...listMember, ...(memberRes.data || {}) };
      m = self._syncExpiredPackages(m);
      pkgHistory = Array.isArray(historyRes.data) ? historyRes.data : [];
      memberSchedules = Array.isArray(schedRes.data) ? schedRes.data : [];
    };

    this._showLoadingOverlay('Tải thông tin hội viên...');
    try {
      await _fetchModalData();
    } catch (err) {
      console.error('Failed to fetch member details:', err);
      m = (window.GymApp.data.members || []).find(x => (x.id || x.ho_so_id) == id);
    } finally {
      this._hideLoadingOverlay();
    }
    if (!m) return;
    document.getElementById('gym-member-modal')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'gym-member-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);backdrop-filter:blur(6px);padding:16px;';

    const isActive = m.trang_thai === 'con_han' || m.trang_thai === 'sap_het_han' || m.trang_thai === 'active' || m.trang_thai === 'dang_tap';
    const isCheckedIn = m.da_check_in_hom_nay == 1;
    const activePkg = Array.isArray(m.goi_tap_hien_tai)
      ? (m.goi_tap_hien_tai.find(g => {
        if (g.trang_thai !== 'dang_hoat_dong') return false;
        if (!g.tu_ngay) return true;
        const tuNgayVal = self._parseLocalDate(g.tu_ngay);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return tuNgayVal && tuNgayVal <= today;
      }) || null)
      : null;
    const pkgName = activePkg ? (activePkg.ten_goi || activePkg.ten_goi_tap) : (m.ten_goi_tap || 'Chưa đăng ký');
    const hetHanVal = activePkg ? activePkg.den_ngay : m.ngay_het_han;
    const expDate = hetHanVal ? window.GymApp.formatDate(hetHanVal) : '—';
    const genderLabel = m.gioi_tinh === 'nam' || m.gioi_tinh === 'male' ? 'Nam' : m.gioi_tinh === 'nu' || m.gioi_tinh === 'female' ? 'Nữ' : (m.gioi_tinh || '—');

    let statusText = '○ Hết hạn';
    if (isActive) statusText = '● Đang hoạt động';
    else if (m.trang_thai === 'chua_dang_ky') statusText = '○ Chưa đăng ký';

    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:20px;width:100%;max-width:780px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;position:relative;box-shadow:0 32px 80px rgba(0,0,0,0.35);">
        <div style="background:linear-gradient(160deg,#2d6a4f 0%,#40916c 55%,#52b788 100%);padding:20px 24px 0;flex-shrink:0;position:relative;overflow:hidden;">
          <!-- Decorative blobs nhẹ -->
          <div style="position:absolute;top:-40px;right:-20px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.06);pointer-events:none;"></div>
          <div style="position:absolute;bottom:0;left:-30px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.04);pointer-events:none;"></div>
          <button id="close-member-modal" style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.25);cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.18)'" title="Đóng">
            <span class="material-symbols-outlined" style="color:#fff;font-size:17px;">close</span>
          </button>
          <!-- Avatar + tên -->
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:18px;">
            <div style="position:relative;flex-shrink:0;">
              <div style="width:68px;height:68px;border-radius:50%;border:2.5px solid rgba(255,255,255,0.55);overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,0.18);">
                ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'lg', 'width:100%;height:100%;')}
              </div>
              <span style="position:absolute;bottom:2px;right:2px;width:13px;height:13px;border-radius:50%;background:${isCheckedIn ? '#74c69d' : '#adb5bd'};border:2px solid #fff;"></span>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px;">
                <h3 style="font-size:19px;font-weight:800;color:#fff;margin:0;letter-spacing:-0.01em;">${m.ho_ten || '—'}</h3>
                ${m.co_yeu_cau_gia_han ? `
                  <span style="display:inline-flex;align-items:center;gap:3px;background:rgba(255,214,0,0.22);color:#fde68a;font-size:10px;padding:2px 7px;border-radius:20px;font-weight:700;border:1px solid rgba(255,214,0,0.35);" class="animate-pulse">
                    <span class="material-symbols-outlined" style="font-size:11px;">app_registration</span>Chờ duyệt
                  </span>
                ` : ''}
              </div>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <span style="font-size:11px;color:rgba(255,255,255,0.75);font-weight:500;">${window.GymApp.formatEnumLabel(m.loai_ho_so || 'hoi_vien')}</span>
                <span style="width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,0.4);"></span>
                <span style="font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:${isActive ? 'rgba(116,198,157,0.3)' : 'rgba(255,255,255,0.12)'};color:${isActive ? '#d8f3dc' : 'rgba(255,255,255,0.75)'};border:1px solid ${isActive ? 'rgba(116,198,157,0.4)' : 'rgba(255,255,255,0.2)'};">${statusText}</span>
              </div>
            </div>
          </div>
          <!-- Stats bar -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;background:rgba(255,255,255,0.08);border-radius:10px 10px 0 0;overflow:hidden;border:1px solid rgba(255,255,255,0.12);border-bottom:none;">
            <div style="padding:9px 14px;border-right:1px solid rgba(255,255,255,0.1);">
              <div style="font-size:9.5px;color:rgba(255,255,255,0.6);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px;">Gói tập</div>
              <div style="font-size:13px;font-weight:700;color:#d8f3dc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${pkgName}">${pkgName}</div>
            </div>
            <div style="padding:9px 14px;border-right:1px solid rgba(255,255,255,0.1);">
              <div style="font-size:9.5px;color:rgba(255,255,255,0.6);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px;">Hết hạn</div>
              <div style="font-size:13px;font-weight:700;color:#d8f3dc;">${expDate}</div>
            </div>
            <div style="padding:9px 14px;">
              <div style="font-size:9.5px;color:rgba(255,255,255,0.6);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px;">Giới tính</div>
              <div style="font-size:13px;font-weight:700;color:#d8f3dc;">${genderLabel}</div>
            </div>
          </div>
        </div>
        <!-- Tabs -->
        <div style="display:flex;background:var(--bg-surface-lowest);border-bottom:1px solid var(--outline-variant);flex-shrink:0;padding:0 8px;">
          ${[['info', 'Thông tin', 'person'], ['package', 'Gói tập', 'fitness_center'], ['schedule', 'Lịch PT', 'event_note']].map(([t, l, ic]) => `
            <button class="member-detail-tab" data-mtab="${t}" style="display:flex;align-items:center;gap:5px;padding:11px 14px;font-size:13px;font-weight:600;border:none;background:transparent;cursor:pointer;border-bottom:2.5px solid transparent;transition:all 0.18s;color:var(--text-on-surface-variant);white-space:nowrap;border-radius:0;">
              <span class="material-symbols-outlined" style="font-size:15px;">${ic}</span>${l}
            </button>
          `).join('')}
        </div>
        <div id="member-modal-body" style="overflow-y:auto;flex:1;padding:20px 24px;" class="bg-surface-container-lowest"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    const refreshAndSetTab = async (t) => {
      try {
        if (window.GymApp.fetchInitialData) {
          await window.GymApp.fetchInitialData();
        }
        const [memberRes, historyRes, schedRes] = await Promise.all([
          window.GymApp.api.get(`/members/${id}`),
          window.GymApp.api.get(`/members/${id}/history`),
          window.GymApp.api.get(`/pt/schedules?hoi_vien_id=${id}`),
        ]);
        m = memberRes.data;
        m = self._syncExpiredPackages(m);
        pkgHistory = Array.isArray(historyRes.data) ? historyRes.data : [];
        memberSchedules = Array.isArray(schedRes.data) ? schedRes.data : [];

        self._memberFiltered = [...(window.GymApp.data.members || [])];
        self._refreshMemberTable();
      } catch (_) { }
      setTab(t);
    };

    overlay.refreshAndSetTab = refreshAndSetTab;

    const setTab = (t) => {
      const tabs = overlay.querySelectorAll('.member-detail-tab');
      tabs.forEach(btn => {
        const active = btn.dataset.mtab === t;
        btn.style.color = active ? '#1D9336' : 'var(--text-on-surface-variant)';
        btn.style.borderBottomColor = active ? '#1D9336' : 'transparent';
        btn.style.fontWeight = active ? '800' : '700';
      });
      document.getElementById('member-modal-body').innerHTML = self._renderMemberTab(t, m, pkgHistory, memberSchedules);
      self._bindMemberTabEvents(t, m, () => refreshAndSetTab(t), pkgHistory);
    };

    overlay.querySelectorAll('.member-detail-tab').forEach(btn => {
      btn.addEventListener('click', () => setTab(btn.dataset.mtab));
    });
    setTab('info');

    const close = () => overlay.remove();
    document.getElementById('close-member-modal').addEventListener('click', close);
    const escH = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escH); } };
    document.addEventListener('keydown', escH);
  },

  _packageStatusBadge: function (status) {
    const dbMap = {
      'dang_hoat_dong': 'Đang hoạt động', 'het_han': 'Hết hạn', 'da_huy': 'Hủy gói', 'huy': 'Hủy gói',
      'da_ket_thuc': 'Đã kết thúc', 'dang_cho': 'Đang chờ', 'cho_duyet': 'Đang chờ',
      'cho_kich_hoat': 'Chờ kích hoạt', 'paid': 'Đã thanh toán', 'debt': 'Còn nợ', 'free': 'Miễn phí',
      'Đổi gói': 'Đổi gói', 'Sửa gói': 'Sửa gói', 'Hủy gói': 'Hủy gói'
    };
    status = dbMap[status] || window.GymApp.formatEnumLabel(status);
    const palette = {
      'Đang hoạt động': 'bg-[#e7f5e9] dark:bg-[#0b2010] text-[#1D9336] dark:text-[#4cce5f]',
      'Đã thanh toán': 'bg-[#e7f5e9] dark:bg-[#0b2010] text-[#1D9336] dark:text-[#4cce5f]',
      'Còn nợ': 'bg-[#fff2cc] dark:bg-[#201c0b] text-[#7a5b00] dark:text-[#ffd666]',
      'Miễn phí': 'bg-[#e0f2fe] dark:bg-[#081a2e] text-[#0369a1] dark:text-[#38bdf8]',
      'Sắp tới': 'bg-[#e8def8] dark:bg-[#201035] text-[#6750a4] dark:text-[#b89eff]',
      'Hết hạn': 'bg-[#ffdad6] dark:bg-[#3d080c] text-[#ba1a1a] dark:text-[#ff8a93]',
      'Hủy gói': 'bg-[#fef2f2] dark:bg-[#3a0808] text-[#dc2626] dark:text-[#f87171]',
      'Đổi gói': 'bg-[#eff6ff] dark:bg-[#0b1a30] text-[#1d4ed8] dark:text-[#60a5fa]',
      'Sửa gói': 'bg-[#fdf4ff] dark:bg-[#2a0b30] text-[#c026d3] dark:text-[#e879f9]'
    };
    const classes = palette[status] || 'bg-[#e0e3e8] dark:bg-[#2c2d30] text-[#3f4a3c] dark:text-[#c4c7cc]';
    return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${classes}">${status}</span>`;
  },

  _renderMemberTab: function (tab, m, pkgHistory, memberSchedules) {
    if (tab === 'info') {
      const hasAccount = !!m.tai_khoan_id;
      const genderLabel = m.gioi_tinh === 'nam' || m.gioi_tinh === 'male' ? 'Nam' : m.gioi_tinh === 'nu' || m.gioi_tinh === 'female' ? 'Nữ' : (m.gioi_tinh || '—');
      const diaChiFull = [m.dia_chi_tam_tru, m.phuong_xa, m.quan_huyen, m.tinh_thanh].filter(Boolean).join(', ') || '—';
      const self = this;
      const activePkg = Array.isArray(m.goi_tap_hien_tai)
        ? (m.goi_tap_hien_tai.find(g => {
          if (g.trang_thai !== 'dang_hoat_dong') return false;
          if (!g.tu_ngay) return true;
          const tuNgayVal = self._parseLocalDate(g.tu_ngay);
          const today = new Date(); today.setHours(0, 0, 0, 0);
          return tuNgayVal && tuNgayVal <= today;
        }) || null)
        : null;
      const pkgName = activePkg ? (activePkg.ten_goi || activePkg.ten_goi_tap) : (m.ten_goi_tap || 'Chưa đăng ký');
      const hetHanVal = activePkg ? activePkg.den_ngay : m.ngay_het_han;
      const expDate = hetHanVal ? window.GymApp.formatDate(hetHanVal) : '—';

      const infoRow = (icon, label, value, accent, wrap = false) => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg-surface-lowest, #fff);">
          <div style="width:32px;height:32px;border-radius:8px;background:${accent || 'var(--bg-surface-low, #f0f7f1)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <span class="material-symbols-outlined" style="font-size:16px;color:${accent ? '#fff' : '#1D9336'};font-variation-settings:'FILL' 1;">${icon}</span>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-on-surface-variant, #3f4a3c);opacity:0.6;margin-bottom:2px;">${label}</div>
            <div style="font-size:13px;font-weight:700;color:var(--text-on-surface, #1a2018);line-height:1.4;${wrap ? '' : 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'}" title="${value || '—'}">${value || '—'}</div>
          </div>
        </div>`;

      const sectionTitle = (icon, title) => `
        <div style="display:flex;align-items:center;gap:8px;margin:16px 0 6px;">
          <span class="material-symbols-outlined" style="font-size:15px;color:#1D9336;font-variation-settings:'FILL' 1;">${icon}</span>
          <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#1D9336;">${title}</span>
          <div style="flex:1;height:1px;background:linear-gradient(to right,#1D933630,transparent);margin-left:4px;"></div>
        </div>`;

      return `
        ${sectionTitle('badge', 'Thông tin cá nhân')}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-[1px] bg-outline-variant rounded-xl overflow-hidden border border-outline-variant">
          ${infoRow('cake', 'Ngày sinh', window.GymApp.formatDate(m.ngay_sinh))}
          ${infoRow('wc', 'Giới tính', genderLabel)}
          ${infoRow('badge', 'CCCD / CMND', m.cccd || '—')}
          ${infoRow('home_pin', 'Quê quán', m.que_quan || '—')}
          <div class="col-span-1 sm:col-span-2">${infoRow('location_on', 'Địa chỉ', diaChiFull, null, true)}</div>
        </div>
        ${sectionTitle('contact_page', 'Liên hệ & Tài khoản')}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-[1px] bg-outline-variant rounded-xl overflow-hidden border border-outline-variant">
          ${infoRow('call', 'Số điện thoại', m.so_dien_thoai)}
          ${infoRow('mail', 'Email', m.email)}
        </div>
        ${sectionTitle('fitness_center', 'Thông tin tập luyện')}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-[1px] bg-outline-variant rounded-xl overflow-hidden border border-outline-variant">
          <div class="col-span-1 sm:col-span-2">${infoRow('card_membership', 'Gói tập hiện tại', pkgName, null, true)}</div>
          ${infoRow('calendar_today', 'Tham gia', window.GymApp.formatDate(m.ngay_tao))}
          ${infoRow('event_busy', 'Hết hạn', expDate)}
        </div>
        <div style="margin-top:16px;border:1px solid var(--outline-variant,#e0e5de);border-radius:12px;overflow:hidden;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--bg-surface-container,#eff2ef);">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="material-symbols-outlined" style="font-size:16px;color:#1D9336;font-variation-settings:'FILL' 1;">manage_accounts</span>
              <span style="font-size:13px;font-weight:700;color:var(--text-on-surface,#1a2018);">Tài khoản đăng nhập</span>
            </div>
            ${hasAccount
          ? `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#e7f5e9] dark:bg-[#0b2010] text-[#1D9336] dark:text-[#4cce5f]">✓ Đã có tài khoản</span>`
          : `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#fff3e0] dark:bg-[#20120b] text-[#e65100] dark:text-[#ffa726]">Chưa có tài khoản</span>`}
          </div>
          <div style="padding:12px 16px;background:var(--bg-surface-lowest,#fff);">
            ${hasAccount
          ? `<p style="font-size:13px;color:var(--text-on-surface-variant,#3f4a3c);">Hội viên này đã được liên kết với tài khoản đăng nhập.</p>`
          : `<div class="grid grid-cols-1 sm:grid-cols-2 gap-standard" id="member-modal-account-form">
                  <div>
                    <label style="display:block;font-size:11px;font-weight:700;color:var(--text-on-surface-variant);margin-bottom:4px;">Tên đăng nhập <span style="color:#ba1a1a;">*</span></label>
                    <input id="modal-username" type="text" value="${m.so_dien_thoai || ''}" placeholder="Số điện thoại hoặc tên đăng nhập"
                      style="width:100%;padding:8px 12px;border:1px solid var(--outline-variant);border-radius:8px;outline:none;font-size:13px;box-sizing:border-box;background:var(--bg-surface-lowest);color:var(--text-on-surface);" />
                  </div>
                  <div>
                    <label style="display:block;font-size:11px;font-weight:700;color:var(--text-on-surface-variant);margin-bottom:4px;">Mật khẩu <span style="color:#ba1a1a;">*</span></label>
                    <input id="modal-password" type="password" placeholder="Ít nhất 6 ký tự"
                      style="width:100%;padding:8px 12px;border:1px solid var(--outline-variant);border-radius:8px;outline:none;font-size:13px;box-sizing:border-box;background:var(--bg-surface-lowest);color:var(--text-on-surface);" />
                  </div>
                  <div style="grid-column:1/-1;display:flex;justify-content:flex-end;">
                    <button id="btn-create-account"
                      style="display:flex;align-items:center;gap:6px;padding:8px 16px;background:#1D9336;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">
                      <span class="material-symbols-outlined" style="font-size:16px;">person_add</span>
                      Tạo tài khoản
                    </button>
                  </div>
                </div>`}
          </div>
        </div>
      `;
    }

    if (tab === 'package') {
      const self = this;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const activePkg = Array.isArray(m.goi_tap_hien_tai)
        ? (m.goi_tap_hien_tai.find(g => {
          if (g.trang_thai !== 'dang_hoat_dong') return false;
          if (!g.tu_ngay) return true;
          const tuNgayVal = self._parseLocalDate(g.tu_ngay);
          return tuNgayVal && tuNgayVal <= today;
        }) || null)
        : null;

      // Tìm các gói đang chờ kích hoạt (nối tiếp)
      const pendingPkgs = Array.isArray(m.goi_tap_hien_tai)
        ? m.goi_tap_hien_tai.filter(g => {
          if (g.trang_thai === 'cho_kich_hoat') return true;
          if (g.trang_thai === 'dang_hoat_dong' && g.tu_ngay) {
            const tuNgayVal = self._parseLocalDate(g.tu_ngay);
            return tuNgayVal && tuNgayVal > today;
          }
          return false;
        })
        : [];

      const otherPackages = pkgHistory.filter(p => {
        if (activePkg && p.id === activePkg.id) return false;
        if (pendingPkgs.some(pg => pg.id === p.id)) return false;
        // Không hiển thị cho_kich_hoat trong lịch sử (đã được hiển thị riêng ở pendingPkgs)
        if (p.trang_thai === 'cho_kich_hoat') return false;
        return true;
      });

      const _actionBtns = (p, dark = false) => {
        if (p.trang_thai === 'huy' || p.trang_thai === 'het_han') return '';
        const base = dark
          ? 'background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:#fff;'
          : 'background:var(--bg-surface-container,#f1f5f9);border:1px solid var(--outline-variant,#e2e8f0);color:var(--text-on-surface-variant,#475569);';
        const danger = dark
          ? 'background:rgba(220,38,38,0.25);border:1px solid rgba(255,100,100,0.3);color:#fca5a5;'
          : 'background:#fef2f2;border:1px solid #fecaca;color:#dc2626;';
        const blue = dark
          ? 'background:rgba(99,179,237,0.2);border:1px solid rgba(147,210,255,0.3);color:#bfdbfe;'
          : 'background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;';
        const print = dark
          ? 'background:rgba(29,147,54,0.25);border:1px solid rgba(100,255,100,0.3);color:#a7f3d0;'
          : 'background:#e6f4ea;border:1px solid #b7e1cd;color:#137333;';
        const btn = (cls, icon, label, style) =>
          `<button class="${cls}" data-pkg-id="${p.id}" data-member-id="${m.id}"
            style="display:inline-flex;align-items:center;gap:3px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;${style}">
            <span class="material-symbols-outlined" style="font-size:13px;">${icon}</span>${label}
          </button>`;
        return `<div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap;">
          ${btn('btn-print-pkg', 'print', 'In hóa đơn', print)}
          ${btn('btn-edit-pkg', 'edit', 'Sửa', base)}
          ${btn('btn-switch-pkg', 'swap_horiz', 'Đổi gói', blue)}
          ${window.GymApp.auth.user?.vai_tro === 'admin' ? btn('btn-cancel-pkg', 'cancel', 'Hủy gói', danger) : ''}
        </div>`;
      };

      const renderPkgCard = (p) => {
        const tuNgayVal = self._parseLocalDate(p.tu_ngay || p.from);
        const isUpcoming = tuNgayVal && tuNgayVal > today && p.trang_thai !== 'huy' && p.trang_thai !== 'het_han';
        const isCanceled = p.trang_thai === 'huy';

        let statusForBadge = p.trang_thai || (isUpcoming ? 'cho_kich_hoat' : 'het_han');
        let accentColor = isCanceled ? '#dc2626' : (isUpcoming ? '#d97706' : '#94a3b8');
        let borderColor = isCanceled ? 'var(--outline-variant, #fecaca)' : (isUpcoming ? 'var(--outline-variant, #fde68a)' : 'var(--outline-variant, #e2e8f0)');
        let icon = isCanceled ? 'cancel' : (isUpcoming ? 'schedule' : 'history');

        if (isCanceled) {
          const reason = (p.ly_do_huy || '').toLowerCase();
          if (reason.includes('đổi gói') || reason.includes('đổi sang')) {
            statusForBadge = 'Đổi gói';
            accentColor = '#1d4ed8';
            borderColor = '#bfdbfe';
            icon = 'swap_horiz';
          } else if (reason.includes('sửa gói') || reason.includes('chỉnh sửa')) {
            statusForBadge = 'Sửa gói';
            accentColor = '#c026d3';
            borderColor = '#f5d0fe';
            icon = 'edit';
          } else {
            statusForBadge = 'Hủy gói';
          }
        }

        return `
          <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--bg-surface-lowest, #fff);border:1px solid ${borderColor};border-left:3px solid ${accentColor};border-radius:10px;margin-bottom:8px;">
            <span class="material-symbols-outlined" style="font-size:18px;color:${accentColor};margin-top:1px;flex-shrink:0;">${icon}</span>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <span style="font-size:13px;font-weight:800;color:var(--text-on-surface,#1a2018);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.ten_goi || '—'}</span>
                ${this._packageStatusBadge(statusForBadge)}
              </div>
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:3px;font-size:11px;color:var(--text-on-surface-variant,#64748b);">
                <span style="font-weight:600;">${window.GymApp.formatCurrency(p.gia_thuc_te || p.gia || 0)}</span>
                <span>${window.GymApp.formatDate(p.tu_ngay)} – ${window.GymApp.formatDate(p.den_ngay)}</span>
              </div>
              ${p.ly_do_huy ? `<div style="margin-top:3px;font-size:11px;color:#dc2626;font-style:italic;">${p.ly_do_huy}${p.so_tien_hoan > 0 ? ` · Hoàn: ${window.GymApp.formatCurrency(p.so_tien_hoan)}` : ''}</div>` : ''}
              ${p.ghi_chu_tt ? `<div style="margin-top:2px;font-size:11px;color:var(--text-on-surface-variant,#94a3b8);font-style:italic;">${p.ghi_chu_tt}</div>` : ''}
              ${_actionBtns(p, false)}
            </div>
          </div>`;
      };

      const sectionLabel = (label) =>
        `<p style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-on-surface-variant);margin:0 0 8px;">${label}</p>`;
      const emptyState = (msg) =>
        `<div style="text-align:center;padding:16px;background:var(--bg-surface-low,#f8fafc);border-radius:10px;border:1px dashed var(--outline-variant,#cbd5e1);font-size:12px;color:var(--text-on-surface-variant);">${msg}</div>`;

      return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <span style="font-size:14px;font-weight:800;color:var(--text-on-surface);">Gói tập</span>
          <button id="btn-add-package" class="flex items-center gap-xs px-standard py-compact rounded-lg font-bold text-body-sm text-white transition-all hover:opacity-90" style="background:#1D9336;border:none;cursor:pointer;">
            <span class="material-symbols-outlined text-sm">add_circle</span>Đăng ký gói
          </button>
        </div>

        ${activePkg ? `
          <div style="background:linear-gradient(160deg,#2d6a4f 0%,#40916c 55%,#52b788 100%);border-radius:12px;padding:14px 16px;color:#fff;position:relative;overflow:hidden;margin-bottom:16px;">
            <div style="position:absolute;right:-12px;top:-12px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.07);pointer-events:none;"></div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;position:relative;z-index:1;">
              <div style="min-width:0;">
                <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;opacity:0.75;margin-bottom:4px;">Đang sử dụng</div>
                <div style="font-size:16px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${activePkg.ten_goi || '—'}</div>
                <div style="font-size:11px;opacity:0.85;margin-top:3px;">${window.GymApp.formatDate(activePkg.tu_ngay)} – ${window.GymApp.formatDate(activePkg.den_ngay)} · ${window.GymApp.formatCurrency(activePkg.gia_thuc_te)}</div>
              </div>
              <span class="material-symbols-outlined" style="font-size:32px;opacity:0.7;flex-shrink:0;">card_membership</span>
            </div>
            ${_actionBtns(activePkg, true)}
          </div>` : `
          <div style="padding:16px;background:var(--bg-surface-low,#f8fafc);border:1px dashed var(--outline-variant,#cbd5e1);border-radius:12px;text-align:center;margin-bottom:16px;">
            <span class="material-symbols-outlined text-on-surface-variant" style="font-size:28px;opacity:0.4;">fitness_center</span>
            <p style="font-size:13px;font-weight:700;color:var(--text-on-surface-variant);margin:4px 0 0;">Chưa có gói tập đang hoạt động</p>
          </div>`}

        ${pendingPkgs.length > 0 ? pendingPkgs.map(g => {
        const isDuyet = g.trang_thai === 'cho_kich_hoat';
        const labelTop = isDuyet ? 'Đã duyệt — Chờ kích hoạt nối tiếp' : 'Gói nối tiếp — Chờ kích hoạt';
        const icon = isDuyet ? 'event_available' : 'schedule';
        const printPending = 'background:#e6f4ea;border:1px solid #b7e1cd;color:#137333;';
        const basePending = 'background:#fff8e1;border:1px solid #fde68a;color:#92400e;';
        const bluePending = 'background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;';
        const dangerPending = 'background:#fef2f2;border:1px solid #fecaca;color:#dc2626;';
        const pendingBtn = (cls, icon2, label, style) =>
          `<button class="${cls}" data-pkg-id="${g.id}" data-member-id="${m.id}"
            style="display:inline-flex;align-items:center;gap:3px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;${style}">
            <span class="material-symbols-outlined" style="font-size:13px;">${icon2}</span>${label}
          </button>`;
        return `
          <div style="border:2px dashed #d97706;border-radius:12px;padding:12px 16px;margin-bottom:16px;background:#fffbeb;">
            <div style="display:flex;align-items:flex-start;gap:10px;">
              <span class="material-symbols-outlined" style="font-size:20px;color:#d97706;margin-top:2px;flex-shrink:0;">${icon}</span>
              <div style="flex:1;min-width:0;">
                <div style="font-size:9px;font-weight:800;text-transform:uppercase;color:#d97706;margin-bottom:4px;">${labelTop}</div>
                <div style="font-size:15px;font-weight:800;color:#92400e;">${g.ten_goi || '—'}</div>
                <div style="font-size:11px;color:#a16207;margin-top:3px;">
                  Bắt đầu: ${window.GymApp.formatDate(g.tu_ngay)} — Kết thúc: ${window.GymApp.formatDate(g.den_ngay)}
                  · <span style="font-weight:700;">${window.GymApp.formatCurrency(g.gia_thuc_te || 0)}</span>
                </div>
                <div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap;">
                  ${pendingBtn('btn-print-pkg', 'print', 'In hóa đơn', printPending)}
                  ${pendingBtn('btn-edit-pkg', 'edit', 'Sửa', basePending)}
                  ${pendingBtn('btn-switch-pkg', 'swap_horiz', 'Đổi gói', bluePending)}
                  ${window.GymApp.auth.user?.vai_tro === 'admin' ? pendingBtn('btn-cancel-pkg', 'cancel', 'Hủy gói', dangerPending) : ''}
                </div>
              </div>
            </div>
          </div>`;
      }).join('') : ''}

        <div>
          ${sectionLabel('Lịch sử & Gói khác')}
          ${otherPackages.length === 0 ? emptyState('Chưa có lịch sử gói tập') : otherPackages.map(p => renderPkgCard(p)).join('')}
        </div>
      `;
    }

    if (tab === 'schedule') {
      const self = this;
      const ptContracts = Array.isArray(m.pt_hien_tai) ? m.pt_hien_tai : [];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const canSchedule = ptContracts.some(c => {
        const buoiConLai = (c.buoi_dang_ky || 0) - (c.buoi_da_tap || 0);
        const conHan = !c.den_ngay || new Date(c.den_ngay) >= today;
        return buoiConLai > 0 && conHan;
      });

      const pendingPtContracts = Array.isArray(m.pt_hien_tai)
        ? m.pt_hien_tai.filter(c => {
          if (c.trang_thai === 'cho_kich_hoat') return true;
          if (c.trang_thai === 'dang_hoat_dong' && c.tu_ngay) {
            const tuNgayVal = self._parseLocalDate(c.tu_ngay);
            return tuNgayVal && tuNgayVal > today;
          }
          return false;
        })
        : [];

      const activePtContracts = ptContracts.filter(c => !pendingPtContracts.some(p => p.id === c.id));

      const renderPtActionBtns = (c, dark = false) => {
        const baseBtn = dark
          ? 'background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:#fff;'
          : 'background:var(--bg-surface-container,#f1f5f9);border:1px solid var(--outline-variant,#e2e8f0);color:var(--text-on-surface-variant,#475569);';
        const dangerBtn = dark
          ? 'background:rgba(220,38,38,0.25);border:1px solid rgba(255,100,100,0.3);color:#fca5a5;'
          : 'background:#fef2f2;border:1px solid #fecaca;color:#dc2626;';
        const blueBtn = dark
          ? 'background:rgba(99,179,237,0.2);border:1px solid rgba(147,210,255,0.3);color:#bfdbfe;'
          : 'background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;';
        const printBtn = dark
          ? 'background:rgba(29,147,54,0.25);border:1px solid rgba(100,255,100,0.3);color:#a7f3d0;'
          : 'background:#e6f4ea;border:1px solid #b7e1cd;color:#137333;';

        const btn = (cls, icon, label, style, dataAttrs) =>
          `<button class="${cls}" ${dataAttrs} style="display:inline-flex;align-items:center;gap:3px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;${style}">
            <span class="material-symbols-outlined" style="font-size:13px;">${icon}</span>${label}
          </button>`;

        return `<div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap;">
          ${btn('btn-print-pt-reg', 'print', 'In hóa đơn', printBtn, `data-contract-id="${c.id}"`)}
          ${btn('btn-edit-pt-reg', 'edit', 'Sửa', baseBtn, `data-contract-id="${c.id}"`)}
          ${btn('btn-switch-pt-reg', 'swap_horiz', 'Đổi gói', blueBtn, `data-contract-id="${c.id}"`)}
          ${window.GymApp.auth.user?.vai_tro === 'admin' ? btn('btn-cancel-pt-contract', 'cancel', 'Hủy gói', dangerBtn, `data-contract-id="${c.id}" data-pt-name="${c.ten_pt || ''}" data-member-name="${m.ho_ten || ''}"`) : ''}
        </div>`;
      };

      let pendingPtContractsHTML = '';
      if (pendingPtContracts.length > 0) {
        pendingPtContractsHTML = pendingPtContracts.map(c => {
          const isDuyet = c.trang_thai === 'cho_kich_hoat';
          const labelTop = isDuyet ? 'Đã duyệt — Chờ kích hoạt nối tiếp' : 'Gói PT nối tiếp — Chờ kích hoạt';
          const icon = isDuyet ? 'event_available' : 'schedule';
          
          const printPending = 'background:#e6f4ea;border:1px solid #b7e1cd;color:#137333;';
          const basePending = 'background:#fff8e1;border:1px solid #fde68a;color:#92400e;';
          const bluePending = 'background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;';
          const dangerPending = 'background:#fef2f2;border:1px solid #fecaca;color:#dc2626;';
          
          const pendingBtn = (cls, icon2, label, style) =>
            `<button class="${cls}" data-contract-id="${c.id}" data-member-id="${m.id}" data-pt-name="${c.ten_pt || ''}" data-member-name="${m.ho_ten || ''}"
              style="display:inline-flex;align-items:center;gap:3px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;${style}">
              <span class="material-symbols-outlined" style="font-size:13px;">${icon2}</span>${label}
            </button>`;

          return `
            <div style="border:2px dashed #d97706;border-radius:12px;padding:12px 16px;margin-bottom:16px;background:#fffbeb;">
              <div style="display:flex;align-items:flex-start;gap:10px;">
                <span class="material-symbols-outlined" style="font-size:20px;color:#d97706;margin-top:2px;flex-shrink:0;">${icon}</span>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:9px;font-weight:800;text-transform:uppercase;color:#d97706;margin-bottom:4px;">${labelTop}</div>
                  <div style="font-size:15px;font-weight:800;color:#92400e;">PT: ${c.ten_pt || '—'}</div>
                  <div style="font-size:11px;color:#a16207;margin-top:3px;">
                    Bắt đầu: ${window.GymApp.formatDate(c.tu_ngay)} — Hạn: ${c.den_ngay ? window.GymApp.formatDate(c.den_ngay) : 'Không giới hạn'}
                    · Số buổi: <span style="font-weight:700;">${c.so_buoi_dang_ky || c.buoi_dang_ky || 0}</span>
                    · <span style="font-weight:700;">${window.GymApp.formatCurrency(c.gia_thuc_te || 0)}</span>
                  </div>
                  <div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap;">
                    ${pendingBtn('btn-print-pt-reg', 'print', 'In hóa đơn', printPending)}
                    ${pendingBtn('btn-edit-pt-reg', 'edit', 'Sửa', basePending)}
                    ${pendingBtn('btn-switch-pt-reg', 'swap_horiz', 'Đổi gói', bluePending)}
                    ${window.GymApp.auth.user?.vai_tro === 'admin' ? pendingBtn('btn-cancel-pt-contract', 'cancel', 'Hủy gói', dangerPending) : ''}
                  </div>
                </div>
              </div>
            </div>`;
        }).join('');
      }

      const currentPtContracts = activePtContracts.filter(c => {
        const buoiConLai = (c.buoi_dang_ky || 0) - (c.buoi_da_tap || 0);
        const conHan = !c.den_ngay || new Date(c.den_ngay) >= today;
        return buoiConLai > 0 && conHan;
      });

      const historyPtContracts = activePtContracts.filter(c => {
        const buoiConLai = (c.buoi_dang_ky || 0) - (c.buoi_da_tap || 0);
        const conHan = !c.den_ngay || new Date(c.den_ngay) >= today;
        return !(buoiConLai > 0 && conHan);
      });

      let currentPtContractsHTML = '';
      if (currentPtContracts.length === 0 && pendingPtContracts.length === 0 && historyPtContracts.length === 0) {
        currentPtContractsHTML = `<div style="text-align:center;padding:20px;background:var(--bg-surface-low, #f8fafc);border-radius:12px;border:1px dashed var(--outline-variant, #cbd5e1);font-size:12px;color:var(--text-on-surface-variant, #cbd5e1);margin-bottom:16px;">Hội viên chưa đăng ký gói PT nào.</div>`;
      } else if (currentPtContracts.length === 0) {
        currentPtContractsHTML = `
          <div style="padding:16px;background:var(--bg-surface-low,#f8fafc);border:1px dashed var(--outline-variant,#cbd5e1);border-radius:12px;text-align:center;margin-bottom:16px;">
            <span class="material-symbols-outlined text-on-surface-variant" style="font-size:28px;opacity:0.4;">sports_gymnastics</span>
            <p style="font-size:13px;font-weight:700;color:var(--text-on-surface-variant);margin:4px 0 0;">Chưa có gói PT đang hoạt động</p>
          </div>`;
      } else {
        currentPtContractsHTML = `
          <div style="margin-bottom:16px;">
            ${currentPtContracts.map(c => {
              const buoiConLai = (c.buoi_dang_ky || 0) - (c.buoi_da_tap || 0);
              return `
                <div style="background:linear-gradient(160deg,#2d6a4f 0%,#40916c 55%,#52b788 100%);border-radius:12px;padding:14px 16px;color:#fff;position:relative;overflow:hidden;margin-bottom:8px;">
                  <div style="position:absolute;right:-12px;top:-12px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.07);pointer-events:none;"></div>
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;position:relative;z-index:1;">
                    <div style="min-width:0;">
                      <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;opacity:0.75;margin-bottom:4px;">Đang tập (${buoiConLai}/${c.buoi_dang_ky} buổi)</div>
                      <div style="font-size:16px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.ten_pt || '—'}</div>
                      <div style="font-size:11px;opacity:0.85;margin-top:3px;">${c.chuyen_mon || 'Huấn luyện viên'} · Hạn: ${c.den_ngay ? window.GymApp.formatDate(c.den_ngay) : 'Không giới hạn'}</div>
                    </div>
                    <span class="material-symbols-outlined" style="font-size:32px;opacity:0.7;flex-shrink:0;">sports_gymnastics</span>
                  </div>
                  ${renderPtActionBtns(c, true)}
                </div>`;
            }).join('')}
          </div>`;
      }

      let historyPtContractsHTML = '';
      if (historyPtContracts.length > 0) {
        historyPtContractsHTML = `
          <div style="margin-top:16px;">
            <p style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-on-surface-variant);margin:0 0 8px;">Lịch sử & Gói PT khác</p>
            ${historyPtContracts.map(c => {
              const buoiConLai = (c.buoi_dang_ky || 0) - (c.buoi_da_tap || 0);
              const conHan = !c.den_ngay || new Date(c.den_ngay) >= today;
              const statusLabel = (!conHan) ? 'Hết hạn' : 'Hết buổi';
              const isExp = statusLabel === 'Hết hạn';
              const borderColor = isExp ? '#fecaca' : '#fde68a';
              const accentColor = isExp ? '#dc2626' : '#d97706';
              return `
                <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--bg-surface-lowest, #fff);border:1px solid var(--outline-variant, ${borderColor});border-left:3px solid ${accentColor};border-radius:10px;margin-bottom:8px;">
                  <span class="material-symbols-outlined" style="font-size:18px;color:${accentColor};margin-top:1px;flex-shrink:0;">${isExp ? 'event_busy' : 'history'}</span>
                  <div style="flex:1;min-width:0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                      <span style="font-size:13px;font-weight:800;color:var(--text-on-surface,#1a2018);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.ten_pt || '—'}</span>
                      <span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:999px;background:${isExp ? '#fef2f2' : '#fffbeb'};color:${accentColor};">${statusLabel}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:3px;font-size:11px;color:var(--text-on-surface-variant,#64748b);">
                      <span style="font-weight:600;">Còn ${buoiConLai}/${c.buoi_dang_ky} buổi</span>
                      <span>Hạn: ${c.den_ngay ? window.GymApp.formatDate(c.den_ngay) : 'Không giới hạn'}</span>
                    </div>
                    ${c.chuyen_mon ? `<div style="margin-top:2px;font-size:11px;color:var(--text-on-surface-variant,#94a3b8);font-style:italic;">${c.chuyen_mon}</div>` : ''}
                    ${renderPtActionBtns(c, false)}
                  </div>
                </div>`;
            }).join('')}
          </div>`;
      }

      const scheduleRows = memberSchedules.length === 0
        ? `<div style="text-align:center;padding:24px;background:var(--bg-surface-low, #f8fafc);border-radius:12px;border:1px dashed var(--outline-variant, #cbd5e1);font-size:13px;color:var(--text-on-surface-variant, #cbd5e1);margin-bottom:16px;">Chưa có lịch tập nào được đặt</div>`
        : memberSchedules.map(s => {
          const dateObj = new Date(s.ngay_tap || s.date);
          const isPast = dateObj < today;
          const statusStr = s.trang_thai || s.status || 'Chờ tập';
          return `
              <div style="display:flex;align-items:stretch;gap:16px;background:var(--bg-surface-lowest, #fff);border:1px solid var(--outline-variant, #e2e8f0);border-radius:12px;overflow:hidden;margin-bottom:12px;">
                <div style="background:${isPast ? 'var(--bg-surface-low, #f1f5f9)' : 'rgba(29, 147, 54, 0.1)'};width:80px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 8px;border-right:1px dashed var(--outline-variant, #cbd5e1);flex-shrink:0;">
                  <span style="font-size:11px;font-weight:800;text-transform:uppercase;color:${isPast ? 'var(--text-on-surface-variant, #64748b)' : '#166534'};margin-bottom:4px;">Tháng ${dateObj.getMonth() + 1}</span>
                  <span style="font-size:24px;font-weight:800;color:${isPast ? 'var(--text-on-surface-variant, #475569)' : '#1D9336'};line-height:1;">${dateObj.getDate()}</span>
                </div>
                <div style="flex:1;padding:12px;display:flex;flex-direction:column;justify-content:center;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span class="material-symbols-outlined" style="font-size:16px;color:var(--text-on-surface-variant, #64748b);">schedule</span>
                      <span style="font-size:13px;font-weight:800;color:var(--text-on-surface, #1e293b);">${s.gio_bat_dau || s.startTime} — ${s.gio_ket_thuc || s.endTime}</span>
                    </div>
                    ${window.GymApp.statusBadge(statusStr)}
                  </div>
                  <div style="font-size:12px;color:var(--text-on-surface-variant, #475569);">PT: <b>${s.ten_pt || '—'}</b></div>
                  ${s.ghi_chu ? `<div style="margin-top:5px;font-size:12px;color:var(--text-on-surface-variant, #64748b);font-style:italic;">📝 ${s.ghi_chu}</div>` : ''}
                </div>
              </div>`;
        }).join('');

      return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h4 style="font-size:16px;font-weight:800;color:var(--text-on-surface);">Thông Tin Gói PT</h4>
          <button id="btn-add-pt-reg" style="display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;background:linear-gradient(135deg,#1D9336,#22c55e);color:#fff;font-weight:700;font-size:13px;border:none;cursor:pointer;">
            <span class="material-symbols-outlined" style="font-size:18px;">add_circle</span>Đăng ký PT
          </button>
        </div>
        ${currentPtContractsHTML}
        ${pendingPtContractsHTML}
        ${historyPtContractsHTML}
        <div style="margin-top:32px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
          <h4 style="font-size:16px;font-weight:800;color:var(--text-on-surface);">Lịch Tập Gần Đây</h4>
          <button id="btn-add-schedule" ${!canSchedule ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : 'style="cursor:pointer;"'} class="flex items-center gap-xs px-standard py-compact rounded-lg font-bold text-body-sm bg-surface-container hover:bg-surface-container-high transition-all border border-outline-variant text-on-surface">
            <span class="material-symbols-outlined text-sm">calendar_add_on</span>Đặt lịch mới
          </button>
        </div>
        ${scheduleRows}
      `;
    }
    return '';
  },

  _bindMemberTabEvents: function (tab, m, refreshTab, pkgHistory) {
    const self = this;
    if (tab === 'info') {
      document.getElementById('btn-create-account')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-create-account');
        const username = document.getElementById('modal-username')?.value.trim();
        const password = document.getElementById('modal-password')?.value;
        if (!username || !password) return window.GymApp.toast('Vui lòng nhập đủ tên đăng nhập và mật khẩu.', 'error');
        btn.disabled = true;
        btn.innerHTML = '<span class="animate-spin material-symbols-outlined" style="font-size:16px;">sync</span> Đang tạo...';
        try {
          const res = await window.GymApp.api.post(`/members/${m.id}/create-account`, { ten_dang_nhap: username, mat_khau: password });
          if (res.success) {
            window.GymApp.toast(`Đã tạo tài khoản "${username}" thành công!`, 'success');
            refreshTab();
          } else {
            window.GymApp.toast(res.message || 'Không thể tạo tài khoản.', 'error');
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined text-lg">person_add</span> Cấp tài khoản mới';
          }
        } catch (err) {
          window.GymApp.toast('Lỗi khi tạo tài khoản.', 'error');
          btn.disabled = false;
          btn.innerHTML = '<span class="material-symbols-outlined text-lg">person_add</span> Cấp tài khoản mới';
        }
      });
    }
    if (tab === 'package') {
      document.getElementById('btn-add-package')?.addEventListener('click', () => self._showAddPackageModal(m, refreshTab));
      document.querySelectorAll('.btn-print-pkg').forEach(btn => {
        btn.addEventListener('click', async () => {
          const pkgId = btn.dataset.pkgId;
          const allPkgs = [...(m.goi_tap_hien_tai || []), ...(pkgHistory || [])];
          const pkg = allPkgs.find(p => String(p.id) === String(pkgId));
          if (!pkg) return;
          try {
            const branchList = await fetch('assets/data/branches.json').then(r => r.json());
            const userBranchName = window.GymApp.selectedBranch || m.chi_nhanh || '';
            const branch = branchList.find(b => b.ten === userBranchName) || branchList[0] || { ten: 'Paradise GYM', dia_chi: 'Hệ thống phòng tập Paradise GYM' };
            window.GymApp.printInvoice({
              type: 'goi_tap',
              member: m,
              pkg: pkg,
              branch: branch,
              creator: window.GymApp.auth?.user?.ten_dang_nhap || 'Lễ tân'
            });
          } catch (e) {
            window.GymApp.toast('Không thể tải thông tin chi nhánh để in!', 'error');
          }
        });
      });
      document.querySelectorAll('.btn-edit-pkg').forEach(btn => {
        btn.addEventListener('click', () => {
          const pkgId = btn.dataset.pkgId;
          const allPkgs = [...(m.goi_tap_hien_tai || []), ...(pkgHistory || [])];
          const pkg = allPkgs.find(p => String(p.id) === String(pkgId));
          if (pkg) self._showEditPackageModal(m, pkg, refreshTab);
        });
      });
      document.querySelectorAll('.btn-cancel-pkg').forEach(btn => {
        btn.addEventListener('click', () => {
          const pkgId = btn.dataset.pkgId;
          const allPkgs = [...(m.goi_tap_hien_tai || []), ...(pkgHistory || [])];
          const pkg = allPkgs.find(p => String(p.id) === String(pkgId));
          if (pkg) self._showCancelPackageModal(m, pkg, refreshTab);
        });
      });
      document.querySelectorAll('.btn-switch-pkg').forEach(btn => {
        btn.addEventListener('click', () => {
          const pkgId = btn.dataset.pkgId;
          const allPkgs = [...(m.goi_tap_hien_tai || []), ...(pkgHistory || [])];
          const pkg = allPkgs.find(p => String(p.id) === String(pkgId));
          if (pkg) self._showSwitchPackageModal(m, pkg, refreshTab);
        });
      });
    }
    if (tab === 'schedule') {
      document.getElementById('btn-add-pt-reg')?.addEventListener('click', () => self._showAddPtRegistrationModal(m, refreshTab));
      document.getElementById('btn-add-schedule')?.addEventListener('click', () => self._showAddScheduleModal(m, refreshTab));
      const ptContracts = Array.isArray(m.pt_hien_tai) ? m.pt_hien_tai : [];
      document.querySelectorAll('.btn-print-pt-reg').forEach(btn => {
        btn.addEventListener('click', async () => {
          const contractId = btn.dataset.contractId;
          const contract = ptContracts.find(c => String(c.id) === String(contractId));
          if (!contract) return;
          try {
            const branchList = await fetch('assets/data/branches.json').then(r => r.json());
            const userBranchName = window.GymApp.selectedBranch || m.chi_nhanh || '';
            const branch = branchList.find(b => b.ten === userBranchName) || branchList[0] || { ten: 'Paradise GYM', dia_chi: 'Hệ thống phòng tập Paradise GYM' };
            window.GymApp.printInvoice({
              type: 'goi_pt',
              member: m,
              pkg: contract,
              ptName: contract.ten_pt || '—',
              branch: branch,
              creator: window.GymApp.auth?.user?.ten_dang_nhap || 'Lễ tân'
            });
          } catch (e) {
            window.GymApp.toast('Không thể tải thông tin chi nhánh để in!', 'error');
          }
        });
      });
      document.querySelectorAll('.btn-edit-pt-reg').forEach(btn => {
        btn.addEventListener('click', () => {
          const contractId = btn.dataset.contractId;
          const contract = ptContracts.find(c => String(c.id) === String(contractId));
          if (contract) self._showEditPtRegistrationModal(m, contract, refreshTab);
        });
      });
      document.querySelectorAll('.btn-switch-pt-reg').forEach(btn => {
        btn.addEventListener('click', () => {
          const contractId = btn.dataset.contractId;
          const contract = ptContracts.find(c => String(c.id) === String(contractId));
          if (contract) self._showSwitchPtRegistrationModal(m, contract, refreshTab);
        });
      });
      document.querySelectorAll('.btn-cancel-pt-contract').forEach(btn => {
        btn.addEventListener('click', () => {
          const contractId = btn.dataset.contractId;
          const contract = ptContracts.find(c => String(c.id) === String(contractId));
          if (contract) self._showCancelPtContractModal(m, contract, refreshTab);
        });
      });
    }
  },

  // ===== MODAL THÊM GÓI TẬP — giữ nguyên =====
  _showAddPackageModal: async function (m, onSaved) {
    const self = this;
    document.getElementById('gym-sub-modal')?.remove();
    const pkgs = window.GymApp.data.packages || [];
    const pkgNames = pkgs.length
      ? pkgs.map(p => ({ name: p.ten_goi || p.name, price: p.gia || p.price || 0 }))
      : [...new Set(window.GymApp.data.members.map(x => x.ten_goi_tap || x.package))].map(n => ({ name: n, price: 0 }));
    const REQ = `<span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>`;
    const inputCls = `class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;"`;

    // Fetch khuyến mãi đang hoạt động
    let activePromos = [];
    try {
      const promoRes = await window.GymApp.api.get('/promotions/active');
      if (promoRes?.success) activePromos = promoRes.data || [];
    } catch (e) { /* bỏ qua */ }

    // Tìm gói tập hiện tại đang hoạt động
    const activePkg = Array.isArray(m.goi_tap_hien_tai)
      ? (m.goi_tap_hien_tai.find(g => {
        if (g.trang_thai !== 'dang_hoat_dong') return false;
        if (!g.tu_ngay) return true;
        const tuNgayVal = self._parseLocalDate(g.tu_ngay);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return tuNgayVal && tuNgayVal <= today;
      }) || null)
      : null;

    const getNextDayStr = (dateStr) => {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    };

    const defaultFromDate = activePkg ? getNextDayStr(activePkg.den_ngay) : new Date().toISOString().split('T')[0];

    const overlay = document.createElement('div');
    overlay.id = 'gym-sub-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);padding:16px;';
    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:24px;width:100%;max-width:660px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;position:relative;box-shadow:0 24px 70px rgba(0,0,0,0.25);background:#fff;font-family:'Inter', sans-serif;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1b4332,#2d6a4f);padding:20px 24px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.1);">
          <div>
            <h3 style="font-size:16px;font-weight:800;color:#fff;margin:0 0 4px;letter-spacing:-0.01em;">Đăng ký Gói Tập Mới</h3>
            <p style="font-size:12px;color:rgba(255,255,255,0.85);margin:0;font-weight:500;">Hội viên: <strong style="color:#d8f3dc;font-weight:700;">${m.ho_ten || m.name}</strong></p>
          </div>
          <button id="close-sub-modal" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
            <span class="material-symbols-outlined" style="color:#fff;font-size:18px;">close</span>
          </button>
        </div>
        
        <!-- Form Content -->
        <div class="p-loose flex-grow overflow-y-auto" style="padding:16px 20px;background:#fff;display:flex;flex-direction:column;gap:12px;">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <div class="col-span-1 sm:col-span-2">
              <label class="block text-body-sm font-bold text-on-surface mb-xs" style="font-size:13px;font-weight:700;color:#475569;margin-bottom:4px;">Tên gói tập ${REQ}</label>
              <select id="pkg-name" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #cbd5e1;outline:none;font-size:13px;box-sizing:border-box;font-weight:600;color:#1e293b;background-color:#fff;"><option value="">— Chọn gói tập —</option>${pkgNames.map(p => `<option value="${p.name}" data-price="${p.price}">${p.name}${p.price ? ' — ' + window.GymApp.formatCurrency(p.price) : ''}</option>`).join('')}</select>
            </div>
            
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs" style="font-size:13px;font-weight:700;color:#475569;margin-bottom:4px;">Giá gốc gói tập (VNĐ)</label>
              <input id="pkg-price-original" type="text" readonly class="bg-surface-container text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e2e8f0;outline:none;font-size:13px;box-sizing:border-box;cursor:not-allowed;background:#f8fafc;color:#64748b;font-weight:700;" placeholder="Chọn gói tập..." />
            </div>
            
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs" style="font-size:13px;font-weight:700;color:#475569;margin-bottom:4px;">Khuyến mãi</label>
              <select id="pkg-promo-select" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #cbd5e1;outline:none;font-size:13px;box-sizing:border-box;font-weight:600;color:#1e293b;background-color:#fff;">
                <option value="">— Không áp dụng KM —</option>
                ${activePromos.map(p => {
                  return `<option value="${p.id}" data-loai="${p.loai}" data-gia-tri="${p.gia_tri}">${p.ten}</option>`;
                }).join('')}
              </select>
              <div id="pkg-promo-badge" style="display:none;margin-top:6px;padding:4px 8px;border-radius:6px;background:#dcfce7;border:1px solid #86efac;font-size:11px;font-weight:700;color:#166534;display:inline-flex;align-items:center;gap:4px;"></div>
            </div>

            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs" style="font-size:13px;font-weight:700;color:#475569;margin-bottom:4px;">Từ ngày ${REQ}</label>
              <input id="pkg-from" type="date" value="${defaultFromDate}" min="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #cbd5e1;outline:none;font-size:13px;box-sizing:border-box;font-weight:600;" />
              ${activePkg ? `
                <div style="margin-top: 6px; display: flex; align-items: center; gap: 8px; background:#f0fdf4; padding: 4px 8px; border-radius: 6px; border: 1px dashed #bbf7d0;">
                  <input type="checkbox" id="pkg-stack-mode" checked style="cursor: pointer; width: 14px; height: 14px; accent-color: #1D9336;" />
                  <label for="pkg-stack-mode" style="font-size: 11px; font-weight: 700; color: #166534; cursor: pointer; user-select: none;">
                    Nối tiếp sau gói hiện tại (${window.GymApp.formatDate(activePkg.den_ngay)})
                  </label>
                </div>
              ` : ''}
            </div>

            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs" style="font-size:13px;font-weight:700;color:#475569;margin-bottom:4px;">Đến ngày ${REQ}</label>
              <input id="pkg-to" type="date" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #cbd5e1;outline:none;font-size:13px;box-sizing:border-box;font-weight:600;" />
            </div>

            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs" style="font-size:13px;font-weight:700;color:#475569;margin-bottom:4px;">Phương thức TT ${REQ}</label>
              <select id="pkg-payment-method" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #cbd5e1;outline:none;font-size:13px;box-sizing:border-box;font-weight:600;color:#1e293b;background-color:#fff;"><option value="tien_mat">Tiền mặt</option><option value="chuyen_khoan">Chuyển khoản</option></select>
            </div>

            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs" style="font-size:13px;font-weight:700;color:#475569;margin-bottom:4px;">Ngày thanh toán</label>
              <input id="pkg-payment-date" type="date" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #cbd5e1;outline:none;font-size:13px;box-sizing:border-box;font-weight:600;" />
            </div>

            <div class="col-span-1 sm:col-span-2">
              <label class="block text-body-sm font-bold text-on-surface mb-xs" style="font-size:13px;font-weight:700;color:#475569;margin-bottom:4px;">Giá thực thu (VNĐ) ${REQ}</label>
              <input id="pkg-price" type="text" readonly class="bg-surface-container text-on-surface border border-outline-variant" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid #e2e8f0;outline:none;font-size:15px;box-sizing:border-box;cursor:not-allowed;background:#f0fdf4;color:#166534;font-weight:800;text-align:right;" placeholder="Chọn gói tập..." />
            </div>

            <!-- Thêm các field ẩn để logic cũ vẫn chạy mượt mà mà không hiển thị -->
            <input type="hidden" id="pkg-reg-status" value="paid" />
            <input type="hidden" id="pkg-need-pay" value="" />
            <input type="hidden" id="pkg-paid" value="" />
            <input type="hidden" id="pkg-debt" value="0" />

            <div class="col-span-1 sm:col-span-2">
              <label class="block text-body-sm font-bold text-on-surface mb-xs" style="font-size:13px;font-weight:700;color:#475569;margin-bottom:4px;">Ghi chú giao dịch</label>
              <textarea id="pkg-note" rows="2" placeholder="Ghi chú chi tiết về giao dịch..." style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #cbd5e1;outline:none;font-size:13px;box-sizing:border-box;resize:vertical;font-family:inherit;font-weight:500;color:#1e293b;"></textarea>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="border-top:1px solid #e2e8f0;padding:16px 24px;background:#fff;display:flex;gap:12px;flex-shrink:0;">
          <button id="pkg-cancel-btn" style="flex:1;padding:12px;border-radius:12px;border:1px solid #cbd5e1;background:#fff;color:#475569;font-weight:700;font-size:14px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">Hủy</button>
          <button id="pkg-save-btn" style="flex:1;padding:12px;border-radius:12px;border:none;background:#1D9336;color:#fff;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(29,147,54,0.2);transition:all 0.2s;" onmouseover="this.style.opacity='0.95';this.style.boxShadow='0 6px 16px rgba(29,147,54,0.3)'" onmouseout="this.style.opacity='1';this.style.boxShadow='0 4px 12px rgba(29,147,54,0.2)'">Lưu gói tập</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    const stackCheckbox = document.getElementById('pkg-stack-mode');
    if (stackCheckbox && activePkg) {
      stackCheckbox.addEventListener('change', function () {
        const fromEl = document.getElementById('pkg-from');
        if (this.checked) {
          fromEl.value = getNextDayStr(activePkg.den_ngay);
        } else {
          fromEl.value = new Date().toISOString().split('T')[0];
        }
        fromEl.dispatchEvent(new Event('change'));
      });
    }

    const close = () => overlay.remove();
    document.getElementById('close-sub-modal').addEventListener('click', close);
    document.getElementById('pkg-cancel-btn').addEventListener('click', close);
    document.getElementById('pkg-name').addEventListener('change', function () {
      const name = this.value;
      const pkg = (window.GymApp.data.packages || []).find(p => (p.ten_goi || p.name) === name);
      if (!pkg) return;
      if (pkg.gia > 0) {
        document.getElementById('pkg-price-original').value = fmtVND(pkg.gia);
        calcDiscount();
      }
      const fromVal = document.getElementById('pkg-from').value;
      if (fromVal && (pkg.so_thang || pkg.so_ngay_them)) {
        const from = new Date(fromVal);
        from.setMonth(from.getMonth() + (pkg.so_thang || 0));
        from.setDate(from.getDate() + (pkg.so_ngay_them || 0));
        document.getElementById('pkg-to').value = from.toISOString().split('T')[0];
      }
    });
    document.getElementById('pkg-from').addEventListener('change', function () {
      const name = document.getElementById('pkg-name').value;
      const pkg = (window.GymApp.data.packages || []).find(p => (p.ten_goi || p.name) === name);
      if (!pkg || !this.value) return;
      const from = new Date(this.value);
      from.setMonth(from.getMonth() + (pkg.so_thang || 0));
      from.setDate(from.getDate() + (pkg.so_ngay_them || 0));
      document.getElementById('pkg-to').value = from.toISOString().split('T')[0];
      // Tự động đồng bộ ngày thanh toán = ngày đăng ký
      const paymentDateEl = document.getElementById('pkg-payment-date');
      if (paymentDateEl) paymentDateEl.value = this.value;
    });
    const fmtVND = n => n > 0 ? new Intl.NumberFormat('vi-VN').format(n) : '0';
    const parseVND = s => parseInt((s || '').replace(/\./g, '').replace(/,/g, '')) || 0;

    function calcDiscount() {
      const giaGoc = parseVND(document.getElementById('pkg-price-original').value);
      const promoSel = document.getElementById('pkg-promo-select');
      const selOpt = promoSel?.selectedOptions[0];
      let giaSauKm = giaGoc;
      const badge = document.getElementById('pkg-promo-badge');

      if (selOpt && selOpt.value) {
        const loai = selOpt.dataset.loai;
        const giaTri = parseFloat(selOpt.dataset.giaTri) || 0;
        if (loai === 'phan_tram') {
          giaSauKm = Math.max(0, Math.round(giaGoc * (1 - giaTri / 100)));
          if (badge) { badge.style.display = ''; badge.textContent = `Giảm ${giaTri}%: ${fmtVND(giaGoc)} → ${fmtVND(giaSauKm)}đ`; }
        } else {
          giaSauKm = Math.max(0, giaGoc - giaTri);
          if (badge) { badge.style.display = ''; badge.textContent = `Giảm ${fmtVND(giaTri)}đ: ${fmtVND(giaGoc)} → ${fmtVND(giaSauKm)}đ`; }
        }
      } else {
        if (badge) badge.style.display = 'none';
      }

      const pkgPriceEl = document.getElementById('pkg-price');
      if (pkgPriceEl) {
        if (document.getElementById('pkg-price-original').value) {
          pkgPriceEl.value = fmtVND(giaSauKm);
        } else {
          pkgPriceEl.value = '';
        }
      }
      const pkgPaidEl = document.getElementById('pkg-paid');
      if (pkgPaidEl) {
        pkgPaidEl.value = pkgPriceEl ? pkgPriceEl.value : '';
      }
      calcDebt();
    }

    function calcDebt() {
      const need = parseVND(document.getElementById('pkg-price').value);
      const paid = parseVND(document.getElementById('pkg-paid').value);
      const diff = paid - need;
      document.getElementById('pkg-need-pay').value = fmtVND(need);
      const balanceLabel = document.getElementById('pkg-balance-label');
      const debtEl = document.getElementById('pkg-debt');
      if (balanceLabel) {
        if (diff > 0) {
          balanceLabel.textContent = 'Khách dư (VNĐ)';
          balanceLabel.style.color = '#166534';
          if (debtEl) { debtEl.style.background = '#dcfce7'; debtEl.style.color = '#166534'; }
        } else if (diff < 0) {
          balanceLabel.textContent = 'Khách nợ (VNĐ)';
          balanceLabel.style.color = '#93000a';
          if (debtEl) { debtEl.style.background = '#fce4e4'; debtEl.style.color = '#93000a'; }
        } else {
          balanceLabel.textContent = 'Số dư (VNĐ)';
          balanceLabel.style.color = '';
          if (debtEl) { debtEl.style.background = ''; debtEl.style.color = ''; }
        }
      }
      if (debtEl) debtEl.value = fmtVND(Math.abs(diff));
    }

    let pkgPaymentPaid = false;

    document.getElementById('pkg-payment-method')?.addEventListener('change', async function () {
      const val = this.value;
      if (val === 'chuyen_khoan') {
        const name = document.getElementById('pkg-name').value;
        const price = parseVND(document.getElementById('pkg-price').value);
        const from = document.getElementById('pkg-from').value;
        const to = document.getElementById('pkg-to').value;
        const today = new Date().toISOString().split('T')[0];

        if (!name || document.getElementById('pkg-price').value === '' || !from || !to) {
          window.GymApp.toast('Vui lòng chọn gói tập và điền ngày bắt đầu trước', 'error');
          this.value = 'tien_mat';
          return;
        }

        if (from < today) {
          window.GymApp.toast('Ngày bắt đầu không được là ngày trong quá khứ', 'error');
          this.value = 'tien_mat';
          return;
        }

        const saveBtn = document.getElementById('pkg-save-btn');
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.style.opacity = '0.5';
          saveBtn.textContent = 'Đang chờ thanh toán chuyển khoản...';
        }

        try {
          const promoSelEl = document.getElementById('pkg-promo-select');
          const khuyenMaiId = promoSelEl?.value ? Number(promoSelEl.value) : undefined;
          const paymentDate = document.getElementById('pkg-payment-date').value;
          const paidVal = document.getElementById('pkg-paid').value.trim();

          const resData = await window.GymApp.api.post(`/members/${m.id}/package`, {
            goi_tap_id: (window.GymApp.data.packages || []).find(p => (p.ten_goi || p.name) === name)?.id,
            tu_ngay: from,
            gia_thuc_te: price,
            phuong_thuc_tt: 'chuyen_khoan',
            ghi_chu_tt: document.getElementById('pkg-note').value.trim(),
            ngay_thanh_toan: paymentDate,
            so_tien_da_thu: parseVND(paidVal),
            khuyen_mai_id: khuyenMaiId,
          });

          if (resData?.data?.orderCode) {
            self._showPayosQrModal(resData.data, m, async () => {
              pkgPaymentPaid = true;
              const saveBtn2 = document.getElementById('pkg-save-btn');
              if (saveBtn2) {
                saveBtn2.disabled = false;
                saveBtn2.style.opacity = '1';
                saveBtn2.textContent = 'Lưu gói tập (Đã thanh toán)';
              }
            }, () => {
              this.value = 'tien_mat';
              const saveBtn2 = document.getElementById('pkg-save-btn');
              if (saveBtn2) {
                saveBtn2.disabled = false;
                saveBtn2.style.opacity = '1';
                saveBtn2.textContent = 'Lưu gói tập';
              }
            });
          }
        } catch (err) {
          window.GymApp.toast(err.message || 'Lỗi khi kết nối cổng thanh toán', 'error');
          this.value = 'tien_mat';
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            saveBtn.textContent = 'Lưu gói tập';
          }
        }
      }
    });

    document.getElementById('pkg-promo-select')?.addEventListener('change', calcDiscount);

    const pkgPaidEl = document.getElementById('pkg-paid');
    pkgPaidEl.addEventListener('focus', function () { const v = parseVND(this.value); this.value = v > 0 ? String(v) : ''; });
    pkgPaidEl.addEventListener('blur', function () { const v = parseVND(this.value); this.value = fmtVND(v); calcDebt(); });
    pkgPaidEl.addEventListener('input', function () {
      calcDebt();
      const errEl = document.getElementById('err-pkg-paid-modal');
      if (errEl) errEl.classList.add('hidden');
      this.style.borderColor = '';
    });
    document.getElementById('pkg-save-btn').addEventListener('click', async () => {
      const payMethod = document.getElementById('pkg-payment-method').value;
      if (payMethod === 'chuyen_khoan') {
        if (pkgPaymentPaid) {
          window.GymApp.toast('Đăng ký gói tập thành công!', 'success');
          if (window.GymApp.fetchInitialData) await window.GymApp.fetchInitialData();
          self._applyMemberFilter();
          close();
          if (typeof onSaved === 'function') onSaved();
          return;
        } else {
          window.GymApp.toast('Vui lòng hoàn tất thanh toán chuyển khoản trước khi lưu', 'error');
          return;
        }
      }

      const name = document.getElementById('pkg-name').value;
      const price = parseVND(document.getElementById('pkg-price').value);
      const from = document.getElementById('pkg-from').value;
      const today = new Date().toISOString().split('T')[0];

      // Thêm đoạn này:
      if (from < today) {
        window.GymApp.toast('Ngày bắt đầu không được là ngày trong quá khứ', 'error');
        document.getElementById('pkg-from').style.borderColor = '#ba1a1a';
        return;
      }
      const to = document.getElementById('pkg-to').value;
      const paymentDate = document.getElementById('pkg-payment-date').value;
      const regStatus = document.getElementById('pkg-reg-status').value;
      const paidVal = document.getElementById('pkg-paid').value.trim();
      const paidErrEl = document.getElementById('err-pkg-paid-modal');
      const paidInput = document.getElementById('pkg-paid');

      // Highlight & validate
      const hlField = (id, bad) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.borderColor = bad ? '#ba1a1a' : '';
      };
      hlField('pkg-name', !name);
      hlField('pkg-price', document.getElementById('pkg-price').value === '');
      hlField('pkg-from', !from);
      hlField('pkg-to', !to);
      hlField('pkg-payment-date', !paymentDate);
      hlField('pkg-reg-status', !regStatus);
      const paidMissing = !paidVal;
      if (paidMissing) {
        if (paidErrEl) { paidErrEl.textContent = 'Vui lòng nhập số tiền khách đưa'; paidErrEl.classList.remove('hidden'); }
        if (paidInput) paidInput.style.borderColor = '#ba1a1a';
      } else {
        if (paidErrEl) paidErrEl.classList.add('hidden');
        if (paidInput) paidInput.style.borderColor = '';
      }

      if (!name || document.getElementById('pkg-price').value === '' || !from || !to || !regStatus || paidMissing || !paymentDate) { window.GymApp.toast('Vui lòng điền đầy đủ các trường bắt buộc (*)', 'error'); return; }

      if (to && paymentDate > to) {
        hlField('pkg-payment-date', true);
        window.GymApp.toast('Ngày thanh toán không được vượt quá ngày kết thúc gói tập', 'error');
        return;
      }

      // Validate: số tiền khách đưa phải đủ (trừ khi chọn "Còn nợ")
      {
        const needToPay = price; // pkg-price đã là giá sau KM
        const paidAmt = parseVND(paidVal);
        if (regStatus !== 'debt' && paidAmt < needToPay) {
          const fmt = n => new Intl.NumberFormat('vi-VN').format(n);
          window.GymApp.toast(
            `Số tiền khách đưa (${fmt(paidAmt)} ₫) chưa đủ so với cần thanh toán (${fmt(needToPay)} ₫). Chọn trạng thái "Còn nợ" nếu muốn cho phép nợ.`,
            'error'
          );
          hlField('pkg-paid', true);
          return;
        }
      }

      const pkg = (window.GymApp.data.packages || []).find(p => (p.ten_goi || p.name) === name);
      if (!pkg) { window.GymApp.toast('Gói tập không hợp lệ', 'error'); return; }

      // Nếu có gói active VÀ người dùng KHÔNG chọn nối tiếp (bỏ tích checkbox)
      // thì kết thúc gói cũ trước khi tạo gói mới
      const stackCheckboxEl = document.getElementById('pkg-stack-mode');
      if (activePkg && stackCheckboxEl && !stackCheckboxEl.checked) {
        // Hiện confirm dialog
        const confirmed = confirm(
          `Gói "${activePkg.ten_goi || activePkg.ten_goi_tap}" hiện tại sẽ kết thúc ngay hôm nay.\nBạn có chắc chắn muốn kích hoạt gói mới song song không?`
        );
        if (!confirmed) return; // user hủy

        // Gọi API kết thúc sớm gói cũ
        try {
          await window.GymApp.api.patch(`/members/${m.id}/package/${activePkg.id}/cancel`, {
            ly_do_huy: 'Kết thúc sớm để kích hoạt gói mới',
            so_tien_hoan: 0
          });
        } catch (err) {
          window.GymApp.toast('Không thể kết thúc gói cũ: ' + (err.message || 'Lỗi không xác định'), 'error');
          return;
        }
      }

      try {
        const promoSelEl = document.getElementById('pkg-promo-select');
        const khuyenMaiId = promoSelEl?.value ? Number(promoSelEl.value) : undefined;
        const resData = await window.GymApp.api.post(`/members/${m.id}/package`, {
          goi_tap_id: pkg.id, tu_ngay: from, gia_thuc_te: price,
          phuong_thuc_tt: payMethod,
          ghi_chu_tt: document.getElementById('pkg-note').value.trim(),
          ngay_thanh_toan: paymentDate,
          so_tien_da_thu: parseVND(paidVal),
          khuyen_mai_id: khuyenMaiId,
        });

        if (payMethod === 'chuyen_khoan' && resData?.data?.orderCode) {
          // Luồng PayOS: hiện QR modal và poll trạng thái
          close();
          self._showPayosQrModal(resData.data, m, async () => {
            if (window.GymApp.fetchInitialData) await window.GymApp.fetchInitialData();
            self._applyMemberFilter();
            if (typeof onSaved === 'function') onSaved();
          });
        } else {
          window.GymApp.toast('Đăng ký gói tập thành công!', 'success');
          if (window.GymApp.fetchInitialData) await window.GymApp.fetchInitialData();
          self._applyMemberFilter();
          close();
          if (typeof onSaved === 'function') onSaved();
        }
      } catch (err) { window.GymApp.toast(err.message || 'Lỗi khi lưu gói tập', 'error'); }
    });
  },

  // ===== PAYOS QR MODAL (WEB ADMIN) =====
  _showPayosQrModal: function (payosData, member, onSuccess, onCancel, type = 'package') {
    const self = this;
    const { orderCode, qrCodeUrl, payosUrl, amount, den_ngay } = payosData;
    document.getElementById('gym-payos-modal')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'gym-payos-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);padding:16px;';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:24px;width:100%;max-width:420px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.25);font-family:'Inter', sans-serif;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1D9336,#2e7d32);padding:20px 24px;display:flex;align-items:center;justify-content:space-between;color:#fff;">
          <div>
            <h3 style="font-size:16px;font-weight:800;margin:0 0 4px;letter-spacing:-0.01em;color:#fff;">Thanh toán chuyển khoản</h3>
            <p style="font-size:12px;color:rgba(255,255,255,0.85);margin:0;font-weight:500;">Hội viên: <strong style="color:#fff;">${member.ho_ten || member.name}</strong></p>
          </div>
          <button id="payos-modal-close" style="background:rgba(255,255,255,0.2);border:none;cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
            <span class="material-symbols-outlined" style="color:#fff;font-size:18px;">close</span>
          </button>
        </div>
        <!-- Body -->
        <div style="padding:24px;display:flex;flex-direction:column;align-items:center;gap:20px;background:#fafafa;">
          <!-- Price Display -->
          <div style="text-align:center;width:100%;background:#fff;padding:12px;border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Số tiền cần thanh toán</div>
            <div style="font-size:26px;font-weight:800;color:#1d9336;letter-spacing:-0.02em;">${Number(amount).toLocaleString('vi-VN')} đ</div>
          </div>
          
          <!-- QR Frame -->
          <div style="background:#fff;border:2px solid #e2e8f0;border-radius:20px;padding:12px;width:220px;height:220px;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 15px -3px rgba(0,0,0,0.05);position:relative;">
            ${qrCodeUrl
              ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCodeUrl)}" alt="QR PayOS" style="width:196px;height:196px;border-radius:12px;" />`
              : `<span class="material-symbols-outlined" style="font-size:80px;color:#cbd5e1;">qr_code_2</span>`
            }
          </div>
          
          <!-- Bank transfer info -->
          <div style="background:#fff;border-radius:16px;padding:14px 18px;width:100%;box-sizing:border-box;font-size:13px;color:#1e293b;border:1px solid #e2e8f0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:#64748b;font-weight:500;">Mã đơn hàng</span>
              <strong style="color:#0f172a;font-weight:700;">#${orderCode}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:#64748b;font-weight:500;">Nội dung CK</span>
              <div style="display:flex;align-items:center;gap:6px;">
                <strong id="payos-memo-text" style="color:#0f172a;font-weight:700;">${orderCode}</strong>
                <button id="btn-copy-memo" style="background:none;border:none;color:#1d9336;cursor:pointer;padding:2px;display:flex;align-items:center;" title="Sao chép nội dung">
                  <span class="material-symbols-outlined" style="font-size:16px;">content_copy</span>
                </button>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:#64748b;font-weight:500;">Hạn sử dụng gói</span>
              <strong style="color:#0f172a;font-weight:700;">${den_ngay ? den_ngay.substring(0,10) : '—'}</strong>
            </div>
          </div>

          <!-- Spinner and Polling Status -->
          <div id="payos-poll-status" style="display:flex;align-items:center;justify-content:center;gap:10px;font-size:14px;color:#1d9336;font-weight:700;width:100%;padding:4px 0;">
            <span class="material-symbols-outlined" style="font-size:20px;animation:spin 1s linear infinite;color:#1d9336;">progress_activity</span>
            <span id="payos-countdown-text">Đang chờ thanh toán (05:00)...</span>
          </div>
          
          <!-- Actions -->
          <div style="display:flex;gap:10px;width:100%;margin-top:4px;">
            <button id="payos-cancel-action" style="flex:1;padding:11px;border-radius:12px;background:#f1f5f9;border:1px solid #cbd5e1;color:#475569;font-weight:700;font-size:13px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">
              Hủy & Quay lại
            </button>
            <a href="${payosUrl}" target="_blank" rel="noopener"
               style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:11px;border-radius:12px;background:#1D9336;color:#fff;text-decoration:none;font-size:13px;font-weight:700;box-shadow:0 4px 6px -1px rgba(29,147,54,0.25);transition:all 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
              <span class="material-symbols-outlined" style="font-size:16px;">open_in_new</span>
              Mở trang thanh toán
            </a>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#btn-copy-memo').addEventListener('click', () => {
      navigator.clipboard.writeText(String(orderCode));
      window.GymApp.toast('Đã sao chép nội dung chuyển khoản', 'success');
    });

    let isPaid = false;
    let timeLeft = 300; // 5 phút

    const updateCountdownText = () => {
      const min = String(Math.floor(timeLeft / 60)).padStart(2, '0');
      const sec = String(timeLeft % 60).padStart(2, '0');
      const textEl = document.getElementById('payos-countdown-text');
      if (textEl) {
        textEl.textContent = `Đang chờ thanh toán (${min}:${sec})...`;
      }
    };

    const close = async (isCancelByUser) => {
      clearInterval(pollInterval);
      clearInterval(countdownInterval);
      if (isCancelByUser && !isPaid) {
        try {
          if (type === 'pt') {
            await window.GymApp.api.delete(`/pt/registrations/payment/${orderCode}`);
            window.GymApp.toast('Đã hủy bỏ giao dịch đăng ký gói PT.', 'info');
          } else {
            await window.GymApp.api.delete(`/members/${member.id}/package-payment/${orderCode}`);
            window.GymApp.toast('Đã hủy bỏ giao dịch đăng ký gói tập.', 'info');
          }
          if (window.GymApp.fetchInitialData) await window.GymApp.fetchInitialData();
          self._applyMemberFilter();
          if (typeof onCancel === 'function') onCancel();
        } catch (e) {
          console.error('Lỗi khi hủy gói:', e);
        }
      }
      overlay.remove();
    };

    overlay.querySelector('#payos-modal-close').addEventListener('click', () => close(true));
    overlay.querySelector('#payos-cancel-action').addEventListener('click', () => close(true));

    let countdownInterval = setInterval(async () => {
      timeLeft--;
      updateCountdownText();
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        clearInterval(pollInterval);
        window.GymApp.toast('Hết thời gian thanh toán (5 phút). Giao dịch đã bị hủy tự động.', 'error');
        await close(true);
      }
    }, 1000);

    // Poll mỗi 3 giây
    let pollInterval = setInterval(async () => {
      try {
        const statusRes = await window.GymApp.api.get(`/members/me/payos-status/${orderCode}`);
        if (!statusRes?.data) return;
        const st = statusRes.data.status;
        const statusEl = document.getElementById('payos-poll-status');
        if (st === 'PAID') {
          isPaid = true;
          clearInterval(pollInterval);
          if (statusEl) {
            statusEl.style.color = '#16a34a';
            statusEl.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">check_circle</span> Thanh toán thành công!';
          }
          // Đổi nút Hủy thành nút Đóng
          const cancelBtn = overlay.querySelector('#payos-cancel-action');
          if (cancelBtn) {
            cancelBtn.textContent = 'Đóng';
            cancelBtn.style.background = '#e2e8f0';
          }
          setTimeout(async () => {
            close(false); // Đóng QR modal mà không hủy
            window.GymApp.toast('Thanh toán PayOS thành công!', 'success');
            if (typeof onSuccess === 'function') await onSuccess();
          }, 1200);
        } else if (st === 'CANCELLED') {
          clearInterval(pollInterval);
          if (statusEl) {
            statusEl.style.color = '#dc2626';
            statusEl.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">cancel</span> Thanh toán đã bị hủy';
          }
        }
      } catch (e) { /* bỏ qua lỗi mạng */ }
    }, 3000);
  },

  // ===== MODAL HỦY GÓI TẬP =====
  _showCancelPackageModal: function (m, pkg, onSaved) {
    document.getElementById('gym-sub-modal')?.remove();
    const iCls = `class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;"`;
    const overlay = document.createElement('div');
    overlay.id = 'gym-sub-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);padding:16px;';
    overlay.innerHTML = `
      <div class="modal-card bg-surface-container-lowest" style="border-radius:18px;width:100%;max-width:400px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.2);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#b91c1c,#dc2626);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <h3 style="font-size:15px;font-weight:800;color:#fff;margin:0 0 2px;">Hủy gói tập</h3>
            <p style="font-size:11px;color:rgba(255,255,255,0.75);margin:0;">Gói: <strong style="color:#fecaca;">${pkg.ten_goi}</strong></p>
          </div>
          <button id="cancel-pkg-close" style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.25);cursor:pointer;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.18)'"><span class="material-symbols-outlined" style="color:#fff;font-size:16px;">close</span></button>
        </div>
        <div class="p-loose" style="display:flex;flex-direction:column;gap:14px;">
          <div class="grid gap-standard">
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Lý do hủy</label>
              <input id="cancel-pkg-reason" type="text" placeholder="VD: Đăng ký nhầm, hội viên yêu cầu..." ${iCls} />
            </div>
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Hoàn tiền (VNĐ)</label>
              <input id="cancel-pkg-refund" type="text" inputmode="numeric" placeholder="VD: 500.000" ${iCls} />
            </div>
            <div class="rounded-xl border" style="padding:10px 12px;background:#fef2f2;border-color:#fecaca;">
              <p class="text-body-sm" style="color:#b91c1c;margin:0;">Sau khi hủy, hội viên nhận thông báo trên app. Thao tác không thể hoàn tác.</p>
            </div>
          </div>
          <div class="flex gap-standard">
            <button id="cancel-pkg-close2" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Đóng</button>
            <button id="cancel-pkg-confirm" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#dc2626;border:none;cursor:pointer;">Xác nhận hủy</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#cancel-pkg-close').addEventListener('click', close);
    overlay.querySelector('#cancel-pkg-close2').addEventListener('click', close);
    const _cParseVND = s => parseInt((s || '').replace(/\./g, '').replace(/,/g, '')) || 0;
    const _cFmtVND = n => n > 0 ? new Intl.NumberFormat('vi-VN').format(n) : '';
    const cancelRefundEl = overlay.querySelector('#cancel-pkg-refund');
    cancelRefundEl?.addEventListener('focus', function () { const v = _cParseVND(this.value); this.value = v > 0 ? String(v) : ''; });
    cancelRefundEl?.addEventListener('blur', function () { this.value = _cFmtVND(_cParseVND(this.value)); });
    overlay.querySelector('#cancel-pkg-confirm').addEventListener('click', async () => {
      const ly_do_huy = overlay.querySelector('#cancel-pkg-reason').value.trim();
      const refundInputVal = overlay.querySelector('#cancel-pkg-refund').value.trim();
      if (!refundInputVal) {
        return window.GymApp.toast('Vui lòng nhập số tiền hoàn (không được để trống)', 'error');
      }
      const so_tien_hoan = _cParseVND(refundInputVal);
      if (so_tien_hoan <= 0) {
        return window.GymApp.toast('Số tiền hoàn phải lớn hơn 0', 'error');
      }
      const maxHoan = pkg.gia_thuc_te || pkg.gia || 0;
      if (so_tien_hoan > maxHoan) {
        return window.GymApp.toast(`Số tiền hoàn không được vượt quá ${window.GymApp.formatCurrency(maxHoan)}`, 'error');
      }
      try {
        await window.GymApp.api.patch(`/members/${m.id}/package/${pkg.id}/cancel`, { ly_do_huy, so_tien_hoan });
        window.GymApp.toast('Đã hủy gói tập thành công!', 'success');
        close();
        if (typeof onSaved === 'function') onSaved();
      } catch (err) { window.GymApp.toast(err.message || 'Lỗi khi hủy gói tập', 'error'); }
    });
  },

  _showCancelPtContractModal: function (m, contract, onSaved) {
    document.getElementById('gym-sub-modal')?.remove();
    const iCls = `class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;"`;
    const overlay = document.createElement('div');
    overlay.id = 'gym-sub-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);padding:16px;';
    overlay.innerHTML = `
      <div class="modal-card bg-surface-container-lowest" style="border-radius:18px;width:100%;max-width:400px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.2);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#b91c1c,#dc2626);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <h3 style="font-size:15px;font-weight:800;color:#fff;margin:0 0 2px;">Hủy gói PT</h3>
            <p style="font-size:11px;color:rgba(255,255,255,0.75);margin:0;">PT: <strong style="color:#fecaca;">${contract.ten_pt || 'huấn luyện viên'}</strong></p>
          </div>
          <button id="cancel-pt-close" style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.25);cursor:pointer;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.18)'"><span class="material-symbols-outlined" style="color:#fff;font-size:16px;">close</span></button>
        </div>
        <div class="p-loose" style="display:flex;flex-direction:column;gap:14px;">
          <div class="grid gap-standard">
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Lý do hủy</label>
              <input id="cancel-pt-reason" type="text" placeholder="VD: Hội viên yêu cầu hủy..." ${iCls} />
            </div>
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Hoàn tiền (VNĐ)</label>
              <input id="cancel-pt-refund" type="text" inputmode="numeric" placeholder="VD: 500.000" value="${new Intl.NumberFormat('vi-VN').format(contract.gia_thuc_te || 0)}" ${iCls} />
            </div>
            <div class="rounded-xl border" style="padding:10px 12px;background:#fef2f2;border-color:#fecaca;">
              <p class="text-body-sm" style="color:#b91c1c;margin:0;">Sau khi hủy, hội viên nhận thông báo trên app. Thao tác không thể hoàn tác.</p>
            </div>
          </div>
          <div class="flex gap-standard">
            <button id="cancel-pt-close2" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Đóng</button>
            <button id="cancel-pt-confirm" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#dc2626;border:none;cursor:pointer;">Xác nhận hủy</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#cancel-pt-close').addEventListener('click', close);
    overlay.querySelector('#cancel-pt-close2').addEventListener('click', close);

    const _cParseVND = s => parseInt((s || '').replace(/\./g, '').replace(/,/g, '')) || 0;
    const _cFmtVND = n => n > 0 ? new Intl.NumberFormat('vi-VN').format(n) : '';
    const cancelRefundEl = overlay.querySelector('#cancel-pt-refund');
    cancelRefundEl?.addEventListener('focus', function () { const v = _cParseVND(this.value); this.value = v > 0 ? String(v) : ''; });
    cancelRefundEl?.addEventListener('blur', function () { this.value = _cFmtVND(_cParseVND(this.value)); });

    overlay.querySelector('#cancel-pt-confirm').addEventListener('click', async () => {
      const ly_do_huy = overlay.querySelector('#cancel-pt-reason').value.trim();
      const refundInputVal = overlay.querySelector('#cancel-pt-refund').value.trim();
      if (!ly_do_huy) {
        return window.GymApp.toast('Vui lòng nhập lý do hủy!', 'error');
      }
      if (!refundInputVal) {
        return window.GymApp.toast('Vui lòng nhập số tiền hoàn (không được để trống)', 'error');
      }
      const so_tien_hoan = _cParseVND(refundInputVal);
      if (so_tien_hoan < 0) {
        return window.GymApp.toast('Số tiền hoàn phải lớn hơn hoặc bằng 0', 'error');
      }
      const maxHoan = contract.gia_thuc_te || 0;
      if (so_tien_hoan > maxHoan) {
        return window.GymApp.toast(`Số tiền hoàn không được vượt quá ${window.GymApp.formatCurrency(maxHoan)}`, 'error');
      }
      try {
        const res = await window.GymApp.api.put(`/pt/registrations/${contract.id}/cancel`, {
          ly_do_huy,
          so_tien_hoan
        });
        if (res?.success) {
          window.GymApp.toast('Đã hủy hợp đồng PT thành công!', 'success');
          close();
          if (typeof onSaved === 'function') onSaved();
        } else {
          window.GymApp.toast(res?.message || 'Hủy hợp đồng thất bại!', 'error');
        }
      } catch (err) { window.GymApp.toast(err.message || 'Lỗi khi hủy hợp đồng PT', 'error'); }
    });
  },

  // ===== MODAL CHỈNH SỬA GÓI TẬP =====
  _showEditPackageModal: function (m, pkg, onSaved) {
    const todayStr = new Date().toLocaleDateString('sv-SE');
    document.getElementById('gym-sub-modal')?.remove();
    const d0 = s => s ? s.substring(0, 10) : '';
    const iCls = `class="w-full bg-surface-container/30 border border-outline-variant text-on-surface rounded-xl focus:border-brand-primary focus:bg-surface-container-lowest outline-none transition-all placeholder-outline-variant/60 font-body-md text-body-md shadow-inner focus:shadow-none"`;
    const PM = { tien_mat: 'Tiền mặt', chuyen_khoan: 'Chuyển khoản' };
    const overlay = document.createElement('div');
    overlay.id = 'gym-sub-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);padding:16px;';
    overlay.innerHTML = `
      <div class="modal-card bg-surface-container-lowest" style="border-radius:18px;width:100%;max-width:440px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.2);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#2d6a4f,#40916c);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <h3 style="font-size:15px;font-weight:800;color:#fff;margin:0 0 2px;">Chỉnh sửa gói tập</h3>
            <p style="font-size:11px;color:rgba(255,255,255,0.75);margin:0;display:flex;align-items:center;gap:5px;">
              <span style="background:rgba(255,255,255,0.18);padding:1px 7px;border-radius:20px;font-size:10px;">Gói tập</span>
              <strong style="color:#d8f3dc;">${pkg.ten_goi}</strong>
            </p>
          </div>
          <button id="edit-pkg-close" style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.25);cursor:pointer;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.18)'">
            <span class="material-symbols-outlined" style="color:#fff;font-size:16px;">close</span>
          </button>
        </div>
        <div class="p-loose" style="display:flex;flex-direction:column;gap:16px;">
          <div class="grid grid-cols-2 gap-standard">
            <div>
              <label class="block text-body-sm font-bold text-on-surface-variant mb-xs">Từ ngày</label>
              <div class="relative w-full">
                <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline text-sm">calendar_month</span>
                <input id="edit-pkg-from" type="date" min="${todayStr}" value="${d0(pkg.tu_ngay)}" ${iCls} style="padding:10px 12px 10px 36px; box-sizing:border-box; width:100%;" />
              </div>
            </div>
            <div>
              <label class="block text-body-sm font-bold text-on-surface-variant mb-xs">Đến ngày</label>
              <div class="relative w-full">
                <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline text-sm">calendar_month</span>
                <input id="edit-pkg-to" type="date" min="${todayStr}" value="${d0(pkg.den_ngay)}" ${iCls} style="padding:10px 12px 10px 36px; box-sizing:border-box; width:100%;" />
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-standard">
            <div>
              <label class="block text-body-sm font-bold text-on-surface-variant mb-xs">Giá thực tế (VNĐ)</label>
              <div class="relative w-full">
                <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline text-sm">payments</span>
                <input id="edit-pkg-price" type="text" value="${pkg.gia_thuc_te > 0 ? new Intl.NumberFormat('vi-VN').format(pkg.gia_thuc_te) : ''}" readonly class="w-full bg-surface-container/30 border border-outline-variant text-on-surface rounded-xl outline-none font-body-md text-body-md shadow-inner cursor-not-allowed opacity-70" style="padding:10px 12px 10px 36px; box-sizing:border-box; width:100%;" />
              </div>
            </div>
            <div>
              <label class="block text-body-sm font-bold text-on-surface-variant mb-xs">Phương thức TT</label>
              <div class="relative w-full">
                <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline text-sm">credit_card</span>
                <select id="edit-pkg-payment" ${iCls} style="padding:10px 32px 10px 36px; box-sizing:border-box; width:100%; appearance:none; background-image:none !important;">
                  ${Object.entries(PM).map(([v, l]) => `<option value="${v}" ${pkg.phuong_thuc_tt === v ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
                <span class="material-symbols-outlined absolute right-standard top-1/2 -translate-y-1/2 text-outline pointer-events-none text-sm">keyboard_arrow_down</span>
              </div>
            </div>
          </div>
          <div>
            <label class="block text-body-sm font-bold text-on-surface-variant mb-xs">Ghi chú thanh toán</label>
            <div class="relative w-full">
              <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline text-sm">description</span>
              <input id="edit-pkg-note" type="text" value="${pkg.ghi_chu_tt || ''}" placeholder="Ghi chú thêm..." ${iCls} style="padding:10px 12px 10px 36px; box-sizing:border-box; width:100%;" />
            </div>
          </div>
          <div class="flex gap-standard mt-xs">
            <button id="edit-pkg-close2" class="flex-1 py-standard rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-sm">Đóng</button>
            <button id="edit-pkg-save" class="flex-1 py-standard rounded-xl font-bold text-white text-body-sm transition-all hover:opacity-95 shadow-md shadow-brand-primary/10 hover:shadow-lg hover:scale-[1.01]" style="background:#1D9336; border:none; cursor:pointer;">Lưu thay đổi</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#edit-pkg-close').addEventListener('click', close);
    overlay.querySelector('#edit-pkg-close2').addEventListener('click', close);

    // Auto-tính lại den_ngay khi tu_ngay thay đổi (giữ nguyên khoảng thời gian gốc)
    const origTuNgay = d0(pkg.tu_ngay);
    const origDenNgay = d0(pkg.den_ngay);
    overlay.querySelector('#edit-pkg-from').addEventListener('change', function () {
      if (!origTuNgay || !origDenNgay || !this.value) return;
      const diffMs = new Date(origDenNgay) - new Date(origTuNgay);
      if (diffMs <= 0) return;
      const newEnd = new Date(new Date(this.value).getTime() + diffMs);
      const yyyy = newEnd.getFullYear();
      const mm = String(newEnd.getMonth() + 1).padStart(2, '0');
      const dd = String(newEnd.getDate()).padStart(2, '0');
      overlay.querySelector('#edit-pkg-to').value = `${yyyy}-${mm}-${dd}`;
    });

    const _parseVND = s => parseInt((s || '').replace(/\./g, '').replace(/,/g, '')) || 0;
    const _fmtVND = n => n > 0 ? new Intl.NumberFormat('vi-VN').format(n) : '';
    const editPriceEl = overlay.querySelector('#edit-pkg-price');
    editPriceEl?.addEventListener('focus', function () { const v = _parseVND(this.value); this.value = v > 0 ? String(v) : ''; });
    editPriceEl?.addEventListener('blur', function () { const v = _parseVND(this.value); this.value = _fmtVND(v); });
    overlay.querySelector('#edit-pkg-save').addEventListener('click', async () => {
      const tu_ngay = overlay.querySelector('#edit-pkg-from').value;
      const den_ngay = overlay.querySelector('#edit-pkg-to').value;
      if (tu_ngay && tu_ngay < todayStr)
        return window.GymApp.toast('Ngày bắt đầu chỉ được chọn từ hôm nay trở đi', 'error');
      if (den_ngay && den_ngay < todayStr)
        return window.GymApp.toast('Ngày kết thúc chỉ được chọn từ hôm nay trở đi', 'error');
      if (tu_ngay && den_ngay && den_ngay <= tu_ngay)
        return window.GymApp.toast('Ngày kết thúc phải sau ngày bắt đầu', 'error');
      try {
        await window.GymApp.api.patch(`/members/${m.id}/package/${pkg.id}`, {
          tu_ngay: tu_ngay || undefined,
          den_ngay: den_ngay || undefined,
          gia_thuc_te: _parseVND(overlay.querySelector('#edit-pkg-price').value) || undefined,
          phuong_thuc_tt: overlay.querySelector('#edit-pkg-payment').value || undefined,
          ghi_chu_tt: overlay.querySelector('#edit-pkg-note').value.trim() || undefined,
        });
        window.GymApp.toast('Cập nhật gói tập thành công!', 'success');
        close();
        if (typeof onSaved === 'function') onSaved();
      } catch (err) { window.GymApp.toast(err.message || 'Lỗi khi cập nhật gói tập', 'error'); }
    });
  },

  // ===== MODAL ĐỔI GÓI TẬP =====
  _showSwitchPackageModal: async function (m, pkg, onSaved) {
    document.getElementById('gym-sub-modal')?.remove();
    let goiTapList = [];
    try {
      const res = await window.GymApp.api.get('/packages');
      goiTapList = (res.data || []).filter(g => !g.is_deleted && g.id !== pkg.goi_tap_id);
    } catch (_) { }

    // Tính số ngày còn lại và tiền hoàn gợi ý
    const _calcRemainingCredit = () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tuNgay = pkg.tu_ngay ? new Date(pkg.tu_ngay) : null;
      const denNgay = pkg.den_ngay ? new Date(pkg.den_ngay) : null;
      if (!denNgay) return { remainingDays: 0, credit: 0, totalDays: 30 };
      denNgay.setHours(0, 0, 0, 0);
      const remainingDays = Math.max(0, Math.round((denNgay - today) / 86400000));

      let totalDays = 30; // fallback mặc định
      if (tuNgay) {
        tuNgay.setHours(0, 0, 0, 0);
        totalDays = Math.max(1, Math.round((denNgay - tuNgay) / 86400000));
      }

      const giaThucTe = pkg.gia_thuc_te || pkg.gia || 0;
      const credit = Math.round((giaThucTe * remainingDays) / totalDays);
      return { remainingDays, credit, totalDays };
    };
    const { remainingDays, credit, totalDays } = _calcRemainingCredit();

    const iCls = `class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;"`;
    const PM = { tien_mat: 'Tiền mặt', chuyen_khoan: 'Chuyển khoản' };
    const overlay = document.createElement('div');
    overlay.id = 'gym-sub-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);padding:16px;';
    overlay.innerHTML = `
      <div class="modal-card bg-surface-container-lowest" style="border-radius:18px;width:100%;max-width:460px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
        <div style="background:linear-gradient(135deg,#1e40af,#2563eb);padding:16px 20px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <h3 style="font-size:15px;font-weight:800;color:#fff;margin:0 0 2px;">Đổi gói tập</h3>
            <p style="font-size:11px;color:rgba(255,255,255,0.75);margin:0;">Đang hủy: <strong style="color:#bfdbfe;">${pkg.ten_goi}</strong></p>
          </div>
          <button id="switch-pkg-close" style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.25);cursor:pointer;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.18)'"><span class="material-symbols-outlined" style="color:#fff;font-size:16px;">close</span></button>
        </div>
        <div class="p-loose flex-grow overflow-y-auto" style="display:flex;flex-direction:column;gap:14px;">
          <!-- Thông tin gói cũ & tiền hoàn gợi ý -->
          <div class="rounded-xl" style="padding:10px 14px;background:#eff6ff;border:1px solid #bfdbfe;">
            <div style="font-size:12px;font-weight:700;color:#1d4ed8;margin-bottom:4px;">Thông tin gói hiện tại</div>
            <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:#1e40af;">
              <span>Giá đã đóng: <strong>${window.GymApp.formatCurrency(pkg.gia_thuc_te || pkg.gia || 0)}</strong></span>
              <span>Còn lại: <strong>${remainingDays} ngày</strong></span>
              <span>Tiền hoàn gợi ý: <strong id="switch-credit-hint">${window.GymApp.formatCurrency(credit)}</strong></span>
            </div>
            <div style="font-size:11px;color:#3b82f6;margin-top:3px;">Công thức: giá × ngày còn lại ÷ ${totalDays}</div>
          </div>
          <div>
            <label class="block text-body-sm font-bold text-on-surface mb-xs">Gói tập mới <span style="color:#ba1a1a;">*</span></label>
            <select id="switch-pkg-new" ${iCls}>
              <option value="">— Chọn gói tập —</option>
              ${goiTapList.map(g => `<option value="${g.id}" data-gia="${g.gia}">${g.ten_goi} — ${window.GymApp.formatCurrency(g.gia)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-body-sm font-bold text-on-surface mb-xs">Ngày bắt đầu <span style="color:#ba1a1a;">*</span></label>
            <input id="switch-pkg-from" type="date" value="${new Date().toISOString().substring(0, 10)}" min="${new Date().toISOString().split('T')[0]}" ${iCls} />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-standard">
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Giá thực tế gói mới (VNĐ)</label>
              <input id="switch-pkg-price" type="text" inputmode="numeric" placeholder="Mặc định = giá gói" ${iCls} />
            </div>
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Phương thức TT</label>
              <select id="switch-pkg-payment" ${iCls}>
                ${Object.entries(PM).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Khấu trừ gói cũ (VNĐ)</label>
              <input id="switch-pkg-refund" type="text" inputmode="numeric" placeholder="0" ${iCls} value="${credit > 0 ? credit : ''}" />
            </div>
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Lý do đổi</label>
              <input id="switch-pkg-reason" type="text" ${iCls} />
            </div>
            <div class="col-span-1 sm:col-span-2">
              <label id="switch-diff-label" class="block text-body-sm font-bold mb-xs" style="color:#166534;">Tiền thanh toán thêm (VNĐ)</label>
              <input id="switch-pkg-diff" type="text" readonly value="—" 
                class="w-full font-bold px-3 py-2 rounded-lg border outline-none cursor-not-allowed text-body-sm" 
                style="background:#dcfce7; border-color:#bbf7d0; color:#166534; box-sizing:border-box;" />
            </div>
          </div>
          <div class="rounded-xl" style="padding:10px 12px;background:#f0fdf4;border:1px solid #bbf7d0;">
            <p class="text-body-sm" style="color:#166534;margin:0;">Gói cũ bị hủy và gói mới kích hoạt ngay. Hội viên nhận thông báo.</p>
          </div>
          </div>
        <div class="border-t border-outline-variant px-loose py-standard bg-surface-container-lowest flex gap-standard flex-shrink-0">
            <button id="switch-pkg-close2" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Đóng</button>
            <button id="switch-pkg-confirm" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#1D9336;border:none;cursor:pointer;">Xác nhận đổi gói</button>
          </div>

      </div>`;
    document.body.appendChild(overlay);
    window.GymApp.initDatePickers(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#switch-pkg-close').addEventListener('click', close);
    overlay.querySelector('#switch-pkg-close2').addEventListener('click', close);
    const _pVND = s => parseInt((s || '').replace(/\./g, '').replace(/,/g, '')) || 0;
    const _fVND = n => n > 0 ? new Intl.NumberFormat('vi-VN').format(n) : '';
    const swPriceEl = overlay.querySelector('#switch-pkg-price');
    const swRefundEl = overlay.querySelector('#switch-pkg-refund');
    if (credit > 0) swRefundEl.value = _fVND(credit);

    const _updateExtraHint = () => {
      const newGia = _pVND(swPriceEl?.value);
      const hoan = _pVND(swRefundEl?.value);
      const oldGia = pkg.gia_thuc_te || pkg.gia || 0;
      const isUpgrade = newGia >= oldGia;

      const diffLabelEl = overlay.querySelector('#switch-diff-label');
      const diffInputEl = overlay.querySelector('#switch-pkg-diff');

      if (diffLabelEl && diffInputEl) {
        if (!swPriceEl?.value) {
          diffLabelEl.textContent = 'Tiền thanh toán thêm (VNĐ)';
          diffLabelEl.style.color = '';
          diffInputEl.style.background = '';
          diffInputEl.style.borderColor = '';
          diffInputEl.style.color = '';
          diffInputEl.value = '—';
          return;
        }
        if (isUpgrade) {
          const diff = Math.max(0, newGia - hoan);
          diffLabelEl.textContent = 'Tiền thanh toán thêm (VNĐ)';
          diffLabelEl.style.color = '#166534';
          diffInputEl.style.background = '#dcfce7';
          diffInputEl.style.borderColor = '#bbf7d0';
          diffInputEl.style.color = '#166534';
          diffInputEl.value = _fVND(diff) || '0';
        } else {
          const diff = Math.max(0, hoan - newGia);
          diffLabelEl.textContent = 'Tiền hoàn trả khách (VNĐ)';
          diffLabelEl.style.color = '#ba1a1a';
          diffInputEl.style.background = '#ffdad6';
          diffInputEl.style.borderColor = '#fecaca';
          diffInputEl.style.color = '#ba1a1a';
          diffInputEl.value = _fVND(diff) || '0';
        }
      }
    };

    swPriceEl?.addEventListener('focus', function () { const v = _pVND(this.value); this.value = v > 0 ? String(v) : ''; });
    swPriceEl?.addEventListener('blur', function () { this.value = _fVND(_pVND(this.value)); _updateExtraHint(); });
    swRefundEl?.addEventListener('focus', function () { const v = _pVND(this.value); this.value = v > 0 ? String(v) : ''; });
    swRefundEl?.addEventListener('blur', function () { this.value = _fVND(_pVND(this.value)); _updateExtraHint(); });
    swPriceEl?.addEventListener('input', _updateExtraHint);
    swRefundEl?.addEventListener('input', _updateExtraHint);


    overlay.querySelector('#switch-pkg-new')?.addEventListener('change', function () {
      const gia = parseFloat(this.options[this.selectedIndex]?.dataset?.gia) || 0;
      if (gia > 0 && swPriceEl) swPriceEl.value = _fVND(gia);
      _updateExtraHint();
    });
    swPriceEl?.addEventListener('blur', _updateExtraHint);
    swRefundEl?.addEventListener('blur', _updateExtraHint);
    overlay.querySelector('#switch-pkg-confirm').addEventListener('click', async () => {
      const goi_tap_id_moi = overlay.querySelector('#switch-pkg-new').value;
      const tu_ngay = overlay.querySelector('#switch-pkg-from').value;
      if (!goi_tap_id_moi) return window.GymApp.toast('Vui lòng chọn gói tập mới', 'error');
      if (!tu_ngay) return window.GymApp.toast('Vui lòng chọn ngày bắt đầu', 'error');
      const so_tien_hoan = _pVND(overlay.querySelector('#switch-pkg-refund').value) || 0;
      const maxHoan = pkg.gia_thuc_te || pkg.gia || 0;
      if (so_tien_hoan > maxHoan) {
        return window.GymApp.toast(`Số tiền hoàn không được vượt quá ${window.GymApp.formatCurrency(maxHoan)}`, 'error');
      }
      try {
        await window.GymApp.api.post(`/members/${m.id}/package/switch`, {
          pkg_id_cu: pkg.id,
          goi_tap_id_moi: parseInt(goi_tap_id_moi),
          tu_ngay,
          ly_do_huy: overlay.querySelector('#switch-pkg-reason').value.trim() || 'Đổi sang gói mới',
          so_tien_hoan: so_tien_hoan,
          gia_thuc_te: _pVND(overlay.querySelector('#switch-pkg-price').value) || undefined,
          phuong_thuc_tt: overlay.querySelector('#switch-pkg-payment').value,
        });
        window.GymApp.toast('Đổi gói tập thành công!', 'success');
        close();
        if (typeof onSaved === 'function') onSaved();
      } catch (err) { window.GymApp.toast(err.message || 'Lỗi khi đổi gói tập', 'error'); }
    });
  },

  // ===== MODAL ĐĂNG KÝ GÓI PT — giữ nguyên =====
  _showAddPtRegistrationModal: async function (m, onSaved) {
    const self = this;
    document.getElementById('gym-sub-modal')?.remove();
    const REQ = `<span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>`;
    const inputCls = `class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;"`;
    const selectedBranch = window.GymApp.selectedBranch || '';
    const allPts = (window.GymApp.data.pts || []);
    const pts = selectedBranch ? allPts.filter(p => p.chi_nhanh === selectedBranch) : allPts;
    let goiPtList = [];
    try { const res = await window.GymApp.api.get('/packages/pt'); goiPtList = Array.isArray(res.data) ? res.data : []; } catch (_) { }

    // Tìm hợp đồng PT đang hoạt động có den_ngay
    const activePtReg = Array.isArray(m.pt_hien_tai)
      ? (m.pt_hien_tai.find(p => p.trang_thai === 'dang_hoat_dong' && p.den_ngay) || null)
      : null;

    const getNextDayStr = (dateStr) => {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    };

    const defaultFromDate = activePtReg ? getNextDayStr(activePtReg.den_ngay) : new Date().toISOString().split('T')[0];

    const overlay = document.createElement('div');
    overlay.id = 'gym-sub-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);padding:16px;';
    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:24px;width:100%;max-width:560px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;position:relative;box-shadow:0 24px 70px rgba(0,0,0,0.25);background:#fff;font-family:'Inter', sans-serif;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1b4332,#2d6a4f);padding:20px 24px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.1);">
          <div>
            <h3 style="font-size:16px;font-weight:800;color:#fff;margin:0 0 4px;letter-spacing:-0.01em;">Đăng ký Gói PT</h3>
            <p style="font-size:12px;color:rgba(255,255,255,0.85);margin:0;font-weight:500;">Hội viên: <strong style="color:#d8f3dc;font-weight:700;">${m.ho_ten}</strong></p>
          </div>
          <button id="close-sub-modal" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
            <span class="material-symbols-outlined" style="color:#fff;font-size:18px;">close</span>
          </button>
        </div>
        
        <!-- Form Content -->
        <div class="p-loose flex-grow overflow-y-auto" style="padding:16px 20px;background:#fff;display:flex;flex-direction:column;gap:12px;">
          <!-- Chọn Huấn Luyện Viên -->
          <div>
            <label class="block text-body-sm font-bold text-on-surface mb-xs" style="font-size:13px;font-weight:700;color:#475569;margin-bottom:4px;">Huấn luyện viên phụ trách ${REQ}</label>
            <input type="hidden" id="ptreg-pt" value="" />
            <div id="ptreg-pt-selection-area" class="flex flex-col gap-2">
              <div style="position:relative;" class="group">
                <span class="material-symbols-outlined" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:16px;">search</span>
                <input id="ptreg-search-pt" type="text" placeholder="Tìm kiếm huấn luyện viên..." style="width:100%;padding:8px 12px 8px 32px;border-radius:8px;border:1px solid #cbd5e1;outline:none;font-size:13px;box-sizing:border-box;font-weight:600;color:#1e293b;background-color:#fff;" />
              </div>
              <div id="ptreg-pt-list" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(120px, 1fr));gap:8px;max-height:130px;overflow-y:auto;border:1px solid #f1f5f9;border-radius:8px;padding:6px;background:#f8fafc;">
                <p style="grid-column: 1 / -1; text-align:center; padding:8px; color:#64748b; font-size:12px; font-weight:600;">Đang tải danh sách PT...</p>
              </div>
            </div>
            
            <div id="ptreg-selected-pt-display" class="hidden p-compact bg-[#f0fdf4] dark:bg-[#152e1e] rounded-xl border border-[#bbf7d0] dark:border-[#1b5e20] items-center justify-between gap-compact mt-xs">
              <div id="ptreg-selected-pt-info" class="flex items-center gap-compact flex-1 text-body-sm font-bold text-[#166534] dark:text-[#4ade80]"></div>
              <button id="ptreg-clear-pt" type="button" class="material-symbols-outlined text-lg text-on-surface-variant hover:text-error transition-colors">close</button>
            </div>
          </div>

          <!-- Thông tin gói PT -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <div class="col-span-1 sm:col-span-2">
              <label class="block text-body-sm font-bold text-on-surface mb-xs" style="font-size:13px;font-weight:700;color:#475569;margin-bottom:4px;">Gói PT ${REQ}</label>
              <select id="ptreg-goi" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #cbd5e1;outline:none;font-size:13px;box-sizing:border-box;font-weight:600;color:#1e293b;background-color:#fff;"><option value="">— Chọn gói PT —</option>${goiPtList.map(g => `<option value="${g.id}" data-price="${g.gia || 0}" data-buoi="${g.so_buoi || ''}" data-thang="${g.so_thang || 0}">${g.ten_goi} — ${window.GymApp.formatCurrency(g.gia || 0)}${g.so_buoi ? ' / ' + g.so_buoi + ' buổi' : ''}</option>`).join('')}</select>
            </div>

            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs" style="font-size:13px;font-weight:700;color:#475569;margin-bottom:4px;">Số buổi đăng ký</label>
              <input id="ptreg-sessions" type="number" min="1" placeholder="—" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #cbd5e1;outline:none;font-size:13px;box-sizing:border-box;font-weight:600;" />
            </div>

            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs" style="font-size:13px;font-weight:700;color:#475569;margin-bottom:4px;">Giá thực tế (VNĐ) ${REQ}</label>
              <input id="ptreg-price" type="text" inputmode="numeric" placeholder="Tự điền từ gói..." style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #cbd5e1;outline:none;font-size:13px;box-sizing:border-box;font-weight:700;color:#1e293b;" />
            </div>

            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs" style="font-size:13px;font-weight:700;color:#475569;margin-bottom:4px;">Phương thức TT ${REQ}</label>
              <select id="ptreg-payment" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #cbd5e1;outline:none;font-size:13px;box-sizing:border-box;font-weight:600;color:#1e293b;background-color:#fff;"><option value="tien_mat">Tiền mặt</option><option value="chuyen_khoan">Chuyển khoản</option></select>
            </div>

            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs" style="font-size:13px;font-weight:700;color:#475569;margin-bottom:4px;">Từ ngày ${REQ}</label>
              <input id="ptreg-from" type="date" value="${defaultFromDate}" min="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #cbd5e1;outline:none;font-size:13px;box-sizing:border-box;font-weight:600;" />
              ${activePtReg ? `
                <div style="margin-top: 6px; display: flex; align-items: center; gap: 8px; background:#f0fdf4; padding: 4px 8px; border-radius: 6px; border: 1px dashed #bbf7d0;">
                  <input type="checkbox" id="ptreg-stack-mode" checked style="cursor: pointer; width: 14px; height: 14px; accent-color: #1D9336;" />
                  <label for="ptreg-stack-mode" style="font-size: 11px; font-weight: 700; color: #166534; cursor: pointer; user-select: none;">
                    Nối tiếp sau gói hiện tại (${window.GymApp.formatDate(activePtReg.den_ngay)})
                  </label>
                </div>
              ` : ''}
            </div>

            <div class="col-span-1 sm:col-span-2">
              <label class="block text-body-sm font-bold text-on-surface mb-xs" style="font-size:13px;font-weight:700;color:#475569;margin-bottom:4px;">Đến ngày</label>
              <input id="ptreg-to" type="date" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #cbd5e1;outline:none;font-size:13px;box-sizing:border-box;font-weight:600;background:#f8fafc;color:#64748b;" readonly />
            </div>

            <div class="col-span-1 sm:col-span-2">
              <label class="block text-body-sm font-bold text-on-surface mb-xs" style="font-size:13px;font-weight:700;color:#475569;margin-bottom:4px;">Ghi chú</label>
              <textarea id="ptreg-note" rows="2" placeholder="Ghi chú thêm..." style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #cbd5e1;outline:none;font-size:13px;box-sizing:border-box;resize:vertical;font-family:inherit;font-weight:500;color:#1e293b;"></textarea>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="border-top:1px solid #e2e8f0;padding:16px 24px;background:#fff;display:flex;gap:12px;flex-shrink:0;">
          <button id="ptreg-cancel-btn" style="flex:1;padding:12px;border-radius:12px;border:1px solid #cbd5e1;background:#fff;color:#475569;font-weight:700;font-size:14px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">Hủy</button>
          <button id="ptreg-save-btn" style="flex:1;padding:12px;border-radius:12px;border:none;background:#1D9336;color:#fff;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(29,147,54,0.2);transition:all 0.2s;" onmouseover="this.style.opacity='0.95';this.style.boxShadow='0 6px 16px rgba(29,147,54,0.3)'" onmouseout="this.style.opacity='1';this.style.boxShadow='0 4px 12px rgba(29,147,54,0.2)'">Đăng ký gói PT</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    window.GymApp.initDatePickers(overlay);

    const ptregListEl = document.getElementById('ptreg-pt-list');
    const ptregSearchInputEl = document.getElementById('ptreg-search-pt');
    const ptregSelectedDisplayEl = document.getElementById('ptreg-selected-pt-display');
    const ptregSelectedInfoEl = document.getElementById('ptreg-selected-pt-info');
    const ptregHiddenInputEl = document.getElementById('ptreg-pt');
    const ptregClearBtnEl = document.getElementById('ptreg-clear-pt');
    const ptregSelectionAreaEl = document.getElementById('ptreg-pt-selection-area');

    if (ptregListEl) {
      if (pts.length === 0) {
        ptregListEl.innerHTML = '<p class="text-center py-4 text-on-surface-variant text-body-sm font-semibold">Không có PT nào</p>';
      } else {
        ptregListEl.innerHTML = pts.map(pt => {
          const ptWorking = (pt.trang_thai_lam_viec || pt.trang_thai) === 'hoat_dong';
          return `
          <div class="pt-modal-card flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${ptWorking ? 'cursor-pointer hover:shadow-md hover:border-brand-primary/60 hover:-translate-y-0.5 bg-surface-container-lowest border-outline-variant/40' : 'cursor-not-allowed opacity-50 bg-surface-container border-outline-variant/20'}"
               data-pt-id="${pt.id}" data-pt-name="${pt.ho_ten || pt.name}" data-pt-specialty="${pt.chuyen_mon || ''}" data-avatar-url="${pt.avatar_url || ''}" data-disabled="${ptWorking ? '' : '1'}">
            ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten || pt.name, 'md')}
            <div class="text-center min-w-0 w-full">
              <p class="font-bold text-on-surface text-body-sm truncate">${pt.ho_ten || pt.name}</p>
              <p class="text-on-surface-variant text-[11px] font-semibold truncate">${pt.chuyen_mon || 'Huấn luyện viên'}</p>
              <p class="text-[10px] text-outline font-semibold mt-0.5">${pt.ma_ho_so || 'PT'} · ${pt.so_hoc_vien || 0} HV</p>
              <p class="text-[10px] font-bold text-amber-500 mt-0.5 flex items-center justify-center gap-0.5">
                ⭐ ${pt.rating ? `${pt.rating} (${pt.so_luot_danh_gia || 0})` : 'Chưa có ĐG'}
              </p>
              ${!ptWorking ? '<p class="text-[10px] font-bold text-[#94a3b8] mt-0.5">⏸ Đang tạm nghỉ</p>' : ''}
            </div>
          </div>
        `}).join('');

        ptregListEl.querySelectorAll('.pt-modal-card').forEach(card => {
          card.addEventListener('click', () => {
            if (card.dataset.disabled) return;
            const ptId = card.dataset.ptId;
            const ptName = card.dataset.ptName;
            const avatarUrl = card.dataset.avatarUrl || '';

            ptregHiddenInputEl.value = ptId;
            ptregSelectionAreaEl.classList.add('hidden');
            ptregSelectedDisplayEl.classList.remove('hidden');
            ptregSelectedDisplayEl.classList.add('flex');
            ptregSelectedInfoEl.innerHTML = `
              ${window.GymApp.avatarImg(avatarUrl, ptName, 'sm')}
              <span class="text-brand-primary font-bold text-body-sm">${ptName}</span>
            `;
            ptregHiddenInputEl.dispatchEvent(new Event('change'));
          });
        });
      }
    }

    ptregSearchInputEl?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      ptregListEl?.querySelectorAll('.pt-modal-card').forEach(card => {
        const name = card.dataset.ptName.toLowerCase();
        const spec = card.dataset.ptSpecialty.toLowerCase();
        card.style.display = name.includes(q) || spec.includes(q) ? '' : 'none';
      });
    });

    ptregClearBtnEl?.addEventListener('click', () => {
      ptregHiddenInputEl.value = '';
      ptregSelectedDisplayEl.classList.add('hidden');
      ptregSelectedDisplayEl.classList.remove('flex');
      ptregSelectionAreaEl.classList.remove('hidden');
      if (ptregSearchInputEl) ptregSearchInputEl.value = '';
      ptregListEl?.querySelectorAll('.pt-modal-card').forEach(card => {
        card.style.display = '';
      });
      ptregHiddenInputEl.dispatchEvent(new Event('change'));
    });

    const stackCheckbox = document.getElementById('ptreg-stack-mode');
    if (stackCheckbox && activePtReg) {
      stackCheckbox.addEventListener('change', function () {
        const fromEl = document.getElementById('ptreg-from');
        if (this.checked) {
          fromEl.value = getNextDayStr(activePtReg.den_ngay);
        } else {
          fromEl.value = new Date().toISOString().split('T')[0];
        }
        updatePtRegDuration();
      });
    }
    const _pVND = s => parseInt((s || '').replace(/\./g, '').replace(/,/g, '')) || 0;
    const _fVND = n => n > 0 ? new Intl.NumberFormat('vi-VN').format(n) : '';
    const ptregPriceEl = document.getElementById('ptreg-price');
    ptregPriceEl?.addEventListener('focus', function () { const v = _pVND(this.value); this.value = v > 0 ? String(v) : ''; });
    ptregPriceEl?.addEventListener('blur', function () { this.value = _fVND(_pVND(this.value)); });

    const updatePtRegDuration = (e) => {
      const goiSel = document.getElementById('ptreg-goi');
      if (!goiSel) return;
      const opt = goiSel.options[goiSel.selectedIndex];
      if (!opt || !goiSel.value) return;

      const price = parseFloat(opt.dataset.price) || 0;
      const buoi = opt.dataset.buoi;
      const soThang = parseInt(opt.dataset.thang) || 0;
      const fromVal = document.getElementById('ptreg-from').value;

      if (price > 0 && (!e || e.target.id === 'ptreg-goi')) {
        document.getElementById('ptreg-price').value = _fVND(price);
      }

      let sessionsVal = document.getElementById('ptreg-sessions').value;
      if (!e || e.target.id === 'ptreg-goi' || !sessionsVal) {
        sessionsVal = buoi || '';
        document.getElementById('ptreg-sessions').value = sessionsVal;
      }
      const numSessions = parseInt(sessionsVal) || 0;

      if (soThang > 0 && fromVal) {
        const from = new Date(fromVal);
        const to = new Date(fromVal);
        to.setMonth(to.getMonth() + soThang);
        document.getElementById('ptreg-to').value = to.toISOString().split('T')[0];

        if (!e || e.target.id !== 'ptreg-sessions') {
          const diffDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
          document.getElementById('ptreg-sessions').value = diffDays;
        }
      } else if (numSessions > 0 && fromVal) {
        const from = new Date(fromVal);
        const to = new Date(fromVal);
        to.setDate(to.getDate() + numSessions);
        document.getElementById('ptreg-to').value = to.toISOString().split('T')[0];

        // Tự động tính số buổi mặc định theo số ngày trong tháng/chu kỳ
        const diffDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
        document.getElementById('ptreg-sessions').value = diffDays;
      } else {
        document.getElementById('ptreg-to').value = '';
      }
    };

    document.getElementById('ptreg-goi').addEventListener('change', updatePtRegDuration);
    document.getElementById('ptreg-from').addEventListener('change', updatePtRegDuration);
    document.getElementById('ptreg-sessions').addEventListener('input', updatePtRegDuration);
    const close = () => overlay.remove();
    document.getElementById('close-sub-modal').addEventListener('click', close);
    document.getElementById('ptreg-cancel-btn').addEventListener('click', close);
    
    let ptPaymentPaid = false;

    document.getElementById('ptreg-payment')?.addEventListener('change', async function () {
      const val = this.value;
      if (val === 'chuyen_khoan') {
        const ptId = document.getElementById('ptreg-pt').value;
        const goiId = document.getElementById('ptreg-goi').value;
        const price = _pVND(document.getElementById('ptreg-price').value);
        const from = document.getElementById('ptreg-from').value;
        const to = document.getElementById('ptreg-to').value;
        const sessions = document.getElementById('ptreg-sessions').value;
        const note = document.getElementById('ptreg-note').value.trim();
        const _todayForReg = new Date().toLocaleDateString('sv-SE');

        if (!ptId || !goiId || price <= 0 || !from) {
          window.GymApp.toast('Vui lòng chọn PT, gói PT, giá và ngày bắt đầu trước', 'error');
          this.value = 'tien_mat';
          return;
        }

        if (from < _todayForReg) {
          window.GymApp.toast('Ngày bắt đầu không được là ngày trong quá khứ', 'error');
          this.value = 'tien_mat';
          return;
        }

        const saveBtn = document.getElementById('ptreg-save-btn');
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.style.opacity = '0.5';
          saveBtn.textContent = 'Đang chờ thanh toán chuyển khoản...';
        }

        try {
          const resData = await window.GymApp.api.post('/pt/registrations', {
            hoi_vien_id: m.id, pt_id: ptId, goi_pt_id: goiId,
            so_buoi_dang_ky: sessions ? parseInt(sessions) : undefined,
            tu_ngay: from, den_ngay: to || undefined, gia_thuc_te: price,
            phuong_thuc_tt: 'chuyen_khoan', ghi_chu_tt: note || undefined,
          });

          if (resData?.data?.orderCode) {
            self._showPayosQrModal(resData.data, m, async () => {
              ptPaymentPaid = true;
              const saveBtn2 = document.getElementById('ptreg-save-btn');
              if (saveBtn2) {
                saveBtn2.disabled = false;
                saveBtn2.style.opacity = '1';
                saveBtn2.textContent = 'Lưu đăng ký PT (Đã thanh toán)';
              }
            }, () => {
              this.value = 'tien_mat';
              const saveBtn2 = document.getElementById('ptreg-save-btn');
              if (saveBtn2) {
                saveBtn2.disabled = false;
                saveBtn2.style.opacity = '1';
                saveBtn2.textContent = 'Đăng ký gói PT';
              }
            }, 'pt');
          }
        } catch (err) {
          window.GymApp.toast(err.message || 'Lỗi khi kết nối cổng thanh toán', 'error');
          this.value = 'tien_mat';
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            saveBtn.textContent = 'Đăng ký gói PT';
          }
        }
      }
    });

    document.getElementById('ptreg-save-btn').addEventListener('click', async () => {
      const ptId = document.getElementById('ptreg-pt').value;
      const goiId = document.getElementById('ptreg-goi').value;
      const price = _pVND(document.getElementById('ptreg-price').value);
      const from = document.getElementById('ptreg-from').value;
      const to = document.getElementById('ptreg-to').value;
      const payment = document.getElementById('ptreg-payment').value;
      const sessions = document.getElementById('ptreg-sessions').value;
      const note = document.getElementById('ptreg-note').value.trim();

      if (payment === 'chuyen_khoan') {
        if (ptPaymentPaid) {
          window.GymApp.toast('Đăng ký gói PT thành công!', 'success');
          if (window.GymApp.fetchInitialData) await window.GymApp.fetchInitialData();
          self._applyMemberFilter();
          close();
          if (typeof onSaved === 'function') await onSaved();
          return;
        } else {
          window.GymApp.toast('Vui lòng hoàn tất thanh toán chuyển khoản trước khi lưu', 'error');
          return;
        }
      }

      if (!ptId || !goiId || price <= 0 || !from) { window.GymApp.toast('Vui lòng điền đầy đủ: PT, gói PT, giá và từ ngày (*)', 'error'); return; }
      const _todayForReg = new Date().toLocaleDateString('sv-SE');
      if (from < _todayForReg) { window.GymApp.toast('Ngày bắt đầu chỉ được chọn từ hôm nay trở đi', 'error'); return; }

      const ptStackCheckboxEl = document.getElementById('ptreg-stack-mode');
      if (activePtReg && ptStackCheckboxEl && !ptStackCheckboxEl.checked) {
        const confirmed = confirm(
          `Gói PT hiện tại sẽ kết thúc ngay hôm nay.\nBạn có chắc chắn muốn kích hoạt gói PT mới song song không?`
        );
        if (!confirmed) return;

        try {
          await window.GymApp.api.put(`/pt/registrations/${activePtReg.id}/cancel`, {
            ly_do: 'Kết thúc sớm để kích hoạt gói PT mới'
          });
        } catch (err) {
          window.GymApp.toast('Không thể kết thúc gói PT cũ: ' + (err.message || 'Lỗi không xác định'), 'error');
          return;
        }
      }

      try {
        await window.GymApp.api.post('/pt/registrations', {
          hoi_vien_id: m.id, pt_id: ptId, goi_pt_id: goiId,
          so_buoi_dang_ky: sessions ? parseInt(sessions) : undefined,
          tu_ngay: from, den_ngay: to || undefined, gia_thuc_te: price,
          phuong_thuc_tt: payment, ghi_chu_tt: note || undefined,
        });
        window.GymApp.toast('Đăng ký gói PT thành công!', 'success');
        close();
        if (typeof onSaved === 'function') await onSaved();
      } catch (err) { window.GymApp.toast(err.message || 'Đăng ký thất bại', 'error'); }
    });
  },

  _showEditPtRegistrationModal: async function (m, c, onSaved) {
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const self = this;
    document.getElementById('gym-sub-modal')?.remove();
    const REQ = `<span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>`;
    const inputCls = `class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;"`;
    const selectedBranch = window.GymApp.selectedBranch || '';
    const allPts = (window.GymApp.data.pts || []);
    const pts = selectedBranch ? allPts.filter(p => p.chi_nhanh === selectedBranch) : allPts;
    let goiPtList = [];
    try { const res = await window.GymApp.api.get('/packages/pt'); goiPtList = Array.isArray(res.data) ? res.data : []; } catch (_) { }
    const overlay = document.createElement('div');
    overlay.id = 'gym-sub-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);padding:16px;';

    const formatInputDate = (dStr) => {
      if (!dStr) return '';
      return dStr.split('T')[0];
    };

    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:18px;width:100%;max-width:540px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
        <div style="background:linear-gradient(135deg,#2d6a4f,#40916c);padding:16px 20px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <h3 style="font-size:15px;font-weight:800;color:#fff;margin:0 0 2px;">Chỉnh sửa gói PT</h3>
            <p style="font-size:11px;color:rgba(255,255,255,0.75);margin:0;">Hội viên: <strong style="color:#d8f3dc;">${m.ho_ten}</strong></p>
          </div>
          <button id="close-sub-modal" style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.25);cursor:pointer;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.18)'"><span class="material-symbols-outlined" style="color:#fff;font-size:16px;">close</span></button>
        </div>
        <div class="p-loose flex-grow overflow-y-auto bg-surface-container-lowest flex flex-col gap-standard">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-standard">
            <div class="col-span-1 sm:col-span-2">
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Huấn luyện viên ${REQ}</label>
              <input type="hidden" id="ptedit-pt" value="${c.pt_id || ''}" />
              <div id="ptedit-pt-selection-area" class="space-y-xs">
                <div class="relative mb-compact group">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[16px] group-focus-within:text-brand-primary transition-colors">search</span>
                  <input id="ptedit-search-pt" type="text" placeholder="Tìm kiếm huấn luyện viên..." class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-9 pr-4 py-2 rounded-xl focus:border-brand-primary outline-none text-body-md font-semibold transition-all" />
                </div>
                <div id="ptedit-pt-list" class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-xs border border-outline-variant rounded-xl p-3 bg-surface-container-low/10">
                  <p class="text-center py-4 text-on-surface-variant text-body-sm font-semibold">Đang tải danh sách PT...</p>
                </div>
              </div>
              <div id="ptedit-selected-pt-display" class="hidden p-compact bg-brand-primary/10 rounded-xl border border-brand-primary/30 items-center gap-compact mt-xs">
                <div id="ptedit-selected-pt-info" class="flex items-center gap-compact flex-1 text-body-sm"></div>
                <button id="ptedit-clear-pt" type="button" class="material-symbols-outlined text-lg text-on-surface-variant hover:text-error transition-colors">close</button>
              </div>
            </div>
            <div class="col-span-1 sm:col-span-2"><label class="block text-body-sm font-bold text-on-surface mb-xs">Gói PT ${REQ}</label><select id="ptedit-goi" ${inputCls}><option value="">— Chọn gói PT —</option>${goiPtList.map(g => `<option value="${g.id}" ${String(g.id) === String(c.goi_pt_id) ? 'selected' : ''} data-price="${g.gia || 0}" data-buoi="${g.so_buoi || ''}" data-thang="${g.so_thang || 0}">${g.ten_goi} — ${window.GymApp.formatCurrency(g.gia || 0)}${g.so_buoi ? ' / ' + g.so_buoi + ' buổi' : ''}</option>`).join('')}</select></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Số buổi</label><input id="ptedit-sessions" type="number" min="1" value="${c.so_buoi_dang_ky || c.buoi_dang_ky || ''}" ${inputCls} /></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Giá thực tế (VNĐ) ${REQ}</label><input id="ptedit-price" type="text" value="${new Intl.NumberFormat('vi-VN').format(c.gia_thuc_te || 0)}" readonly class="bg-surface-container/30 text-on-surface border border-outline-variant cursor-not-allowed opacity-70" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;" /></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Từ ngày ${REQ}</label><input id="ptedit-from" type="date" min="${todayStr}" value="${formatInputDate(c.tu_ngay)}" ${inputCls} /></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Đến ngày</label><input id="ptedit-to" type="date" min="${todayStr}" value="${formatInputDate(c.den_ngay)}" ${inputCls} /></div>
            <div class="col-span-1 sm:col-span-2"><label class="block text-body-sm font-bold text-on-surface mb-xs">Ghi chú</label><textarea id="ptedit-note" rows="2" placeholder="Ghi chú thêm..." class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;resize:vertical;font-family:inherit;">${c.ghi_chu_tt || c.ghi_chu || ''}</textarea></div>
          </div>
        </div>
        <div class="border-t border-outline-variant px-loose py-standard bg-surface-container-lowest flex gap-standard flex-shrink-0">
            <button id="ptedit-cancel-btn" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Hủy</button>
            <button id="ptedit-save-btn" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#1D9336;">Lưu thay đổi</button>
          </div>

      </div>`;
    document.body.appendChild(overlay);
    window.GymApp.initDatePickers(overlay);

    const pteditListEl = document.getElementById('ptedit-pt-list');
    const pteditSearchInputEl = document.getElementById('ptedit-search-pt');
    const pteditSelectedDisplayEl = document.getElementById('ptedit-selected-pt-display');
    const pteditSelectedInfoEl = document.getElementById('ptedit-selected-pt-info');
    const pteditHiddenInputEl = document.getElementById('ptedit-pt');
    const pteditClearBtnEl = document.getElementById('ptedit-clear-pt');
    const pteditSelectionAreaEl = document.getElementById('ptedit-pt-selection-area');

    const selectPTEdit = (ptId, ptName, avatarUrl) => {
      pteditHiddenInputEl.value = ptId;
      pteditSelectionAreaEl.classList.add('hidden');
      pteditSelectedDisplayEl.classList.remove('hidden');
      pteditSelectedDisplayEl.classList.add('flex');
      pteditSelectedInfoEl.innerHTML = `
        ${window.GymApp.avatarImg(avatarUrl, ptName, 'sm')}
        <span class="text-brand-primary font-bold text-body-sm">${ptName}</span>
      `;
      pteditHiddenInputEl.dispatchEvent(new Event('change'));
    };

    if (pteditListEl) {
      if (pts.length === 0) {
        pteditListEl.innerHTML = '<p class="text-center py-4 text-on-surface-variant text-body-sm font-semibold">Không có PT nào</p>';
      } else {
        pteditListEl.innerHTML = pts.map(pt => {
          const ptWorking = (pt.trang_thai_lam_viec || pt.trang_thai) === 'hoat_dong';
          return `
          <div class="pt-modal-card flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${ptWorking ? 'cursor-pointer hover:shadow-md hover:border-brand-primary/60 hover:-translate-y-0.5 bg-surface-container-lowest border-outline-variant/40' : 'cursor-not-allowed opacity-50 bg-surface-container border-outline-variant/20'}"
               data-pt-id="${pt.id}" data-pt-name="${pt.ho_ten || pt.name}" data-pt-specialty="${pt.chuyen_mon || ''}" data-avatar-url="${pt.avatar_url || ''}" data-disabled="${ptWorking ? '' : '1'}">
            ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten || pt.name, 'md')}
            <div class="text-center min-w-0 w-full">
              <p class="font-bold text-on-surface text-body-sm truncate">${pt.ho_ten || pt.name}</p>
              <p class="text-on-surface-variant text-[11px] font-semibold truncate">${pt.chuyen_mon || 'Huấn luyện viên'}</p>
              <p class="text-[10px] text-outline font-semibold mt-0.5">${pt.ma_ho_so || 'PT'} · ${pt.so_hoc_vien || 0} HV</p>
              <p class="text-[10px] font-bold text-amber-500 mt-0.5 flex items-center justify-center gap-0.5">
                ⭐ ${pt.rating ? `${pt.rating} (${pt.so_luot_danh_gia || 0})` : 'Chưa có ĐG'}
              </p>
              ${!ptWorking ? '<p class="text-[10px] font-bold text-[#94a3b8] mt-0.5">⏸ Đang tạm nghỉ</p>' : ''}
            </div>
          </div>
        `}).join('');

        pteditListEl.querySelectorAll('.pt-modal-card').forEach(card => {
          card.addEventListener('click', () => {
            if (card.dataset.disabled) return;
            const ptId = card.dataset.ptId;
            const ptName = card.dataset.ptName;
            const avatarUrl = card.dataset.avatarUrl || '';
            selectPTEdit(ptId, ptName, avatarUrl);
          });
        });
      }
    }

    pteditSearchInputEl?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      pteditListEl?.querySelectorAll('.pt-modal-card').forEach(card => {
        const name = card.dataset.ptName.toLowerCase();
        const spec = card.dataset.ptSpecialty.toLowerCase();
        card.style.display = name.includes(q) || spec.includes(q) ? '' : 'none';
      });
    });

    pteditClearBtnEl?.addEventListener('click', () => {
      pteditHiddenInputEl.value = '';
      pteditSelectedDisplayEl.classList.add('hidden');
      pteditSelectedDisplayEl.classList.remove('flex');
      pteditSelectionAreaEl.classList.remove('hidden');
      if (pteditSearchInputEl) pteditSearchInputEl.value = '';
      pteditListEl?.querySelectorAll('.pt-modal-card').forEach(card => {
        card.style.display = '';
      });
      pteditHiddenInputEl.dispatchEvent(new Event('change'));
    });

    if (c.pt_id) {
      const initialPt = pts.find(pt => String(pt.id) === String(c.pt_id));
      if (initialPt) {
        selectPTEdit(initialPt.id, initialPt.ho_ten || initialPt.name, initialPt.avatar_url);
      }
    }
    const _pVND = s => parseInt((s || '').replace(/\./g, '').replace(/,/g, '')) || 0;
    const _fVND = n => n > 0 ? new Intl.NumberFormat('vi-VN').format(n) : '';
    const pteditPriceEl = document.getElementById('ptedit-price');
    pteditPriceEl?.addEventListener('focus', function () { const v = _pVND(this.value); this.value = v > 0 ? String(v) : ''; });
    pteditPriceEl?.addEventListener('blur', function () { this.value = _fVND(_pVND(this.value)); });

    const updatePtEditDuration = (e) => {
      const goiSel = document.getElementById('ptedit-goi');
      if (!goiSel) return;
      const opt = goiSel.options[goiSel.selectedIndex];
      if (!opt || !goiSel.value) return;

      const price = parseFloat(opt.dataset.price) || 0;
      const buoi = opt.dataset.buoi;
      const soThang = parseInt(opt.dataset.thang) || 0;
      const fromVal = document.getElementById('ptedit-from').value;

      if (price > 0 && (!e || e.target.id === 'ptedit-goi')) {
        document.getElementById('ptedit-price').value = _fVND(price);
      }

      let sessionsVal = document.getElementById('ptedit-sessions').value;
      if (!e || e.target.id === 'ptedit-goi' || !sessionsVal) {
        sessionsVal = buoi || '';
        document.getElementById('ptedit-sessions').value = sessionsVal;
      }
      const numSessions = parseInt(sessionsVal) || 0;

      if (soThang > 0 && fromVal) {
        const from = new Date(fromVal);
        const to = new Date(fromVal);
        to.setMonth(to.getMonth() + soThang);
        document.getElementById('ptedit-to').value = to.toISOString().split('T')[0];

        if (!e || e.target.id !== 'ptedit-sessions') {
          const diffDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
          document.getElementById('ptedit-sessions').value = diffDays;
        }
      } else if (numSessions > 0 && fromVal) {
        const from = new Date(fromVal);
        const to = new Date(fromVal);
        to.setDate(to.getDate() + numSessions);
        document.getElementById('ptedit-to').value = to.toISOString().split('T')[0];

        const diffDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
        document.getElementById('ptedit-sessions').value = diffDays;
      } else {
        document.getElementById('ptedit-to').value = '';
      }
    };

    document.getElementById('ptedit-goi').addEventListener('change', updatePtEditDuration);
    document.getElementById('ptedit-from').addEventListener('change', updatePtEditDuration);
    document.getElementById('ptedit-sessions').addEventListener('input', updatePtEditDuration);
    const close = () => overlay.remove();
    document.getElementById('close-sub-modal').addEventListener('click', close);
    document.getElementById('ptedit-cancel-btn').addEventListener('click', close);
    document.getElementById('ptedit-save-btn').addEventListener('click', async () => {
      const ptId = document.getElementById('ptedit-pt').value;
      const goiId = document.getElementById('ptedit-goi').value;
      const price = _pVND(document.getElementById('ptedit-price').value);
      const from = document.getElementById('ptedit-from').value;
      const to = document.getElementById('ptedit-to').value;
      const sessions = document.getElementById('ptedit-sessions').value;
      const note = document.getElementById('ptedit-note').value.trim();
      if (!ptId || !goiId || price <= 0 || !from) { window.GymApp.toast('Vui lòng điền đầy đủ: PT, gói PT, giá và từ ngày (*)', 'error'); return; }
      if (from && from < todayStr)
        return window.GymApp.toast('Ngày bắt đầu chỉ được chọn từ hôm nay trở đi', 'error');
      if (to && to < todayStr)
        return window.GymApp.toast('Ngày kết thúc chỉ được chọn từ hôm nay trở đi', 'error');
      try {
        await window.GymApp.api.put(`/pt/registrations/${c.id}`, {
          pt_id: parseInt(ptId), goi_pt_id: parseInt(goiId),
          so_buoi_dang_ky: sessions ? parseInt(sessions) : undefined,
          tu_ngay: from, den_ngay: to || null, gia_thuc_te: price,
          ghi_chu: note || null,
        });
        window.GymApp.toast('Cập nhật gói PT thành công!', 'success');
        close();
        if (typeof onSaved === 'function') await onSaved();
      } catch (err) { window.GymApp.toast(err.message || 'Cập nhật thất bại', 'error'); }
    });
  },

  _showSwitchPtRegistrationModal: async function (m, c, onSaved) {
    const self = this;
    document.getElementById('gym-sub-modal')?.remove();
    const REQ = `<span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>`;
    const inputCls = `class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;"`;
    const pts = (window.GymApp.data.pts || []);
    let goiPtList = [];
    try { const res = await window.GymApp.api.get('/packages/pt'); goiPtList = Array.isArray(res.data) ? res.data : []; } catch (_) { }
    const overlay = document.createElement('div');
    overlay.id = 'gym-sub-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);padding:16px;';

    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:18px;width:100%;max-width:540px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
        <div style="background:linear-gradient(135deg,#2d6a4f,#40916c);padding:16px 20px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <h3 style="font-size:15px;font-weight:800;color:#fff;margin:0 0 2px;">Đổi gói PT mới</h3>
            <p style="font-size:11px;color:rgba(255,255,255,0.75);margin:0;">Hội viên: <strong style="color:#d8f3dc;">${m.ho_ten}</strong></p>
          </div>
          <button id="close-sub-modal" style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.25);cursor:pointer;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.18)'"><span class="material-symbols-outlined" style="color:#fff;font-size:16px;">close</span></button>
        </div>
        <div class="p-loose flex-grow overflow-y-auto bg-surface-container-lowest flex flex-col gap-standard">
          <div style="padding:10px 12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
            <p style="margin:0;font-size:12px;color:#1e4ed8;line-height:1.4;">
              Gói đang dùng: <b>${c.ten_goi_pt || 'Gói PT'}</b> (PT: ${c.ten_pt || '—'}) · Còn <b>${(c.buoi_dang_ky || 0) - (c.buoi_da_tap || 0)}</b> buổi tập.
            </p>
            ${(() => {
        const buoiCon = (c.buoi_dang_ky || 0) - (c.buoi_da_tap || 0);
        const tongBuoi = c.buoi_dang_ky || 0;
        const giaThucTe = c.gia_thuc_te || 0;
        const credit = tongBuoi > 0 ? Math.round(giaThucTe * buoiCon / tongBuoi) : 0;
        const giaBuoi = tongBuoi > 0 ? Math.round(giaThucTe / tongBuoi) : 0;
        const fmt = n => new Intl.NumberFormat('vi-VN').format(n);
        return `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #bfdbfe;display:flex;flex-wrap:wrap;gap:8px;">
                <span style="font-size:11px;color:#1e4ed8;">Giá gói cũ: <b>${fmt(giaThucTe)} ₫</b></span>
                <span style="font-size:11px;color:#1e4ed8;">Giá/buổi: <b>${fmt(giaBuoi)} ₫</b></span>
                <span style="font-size:11px;color:#166534;background:#dcfce7;padding:1px 6px;border-radius:4px;">Tiền hoàn gợi ý: <b>${fmt(credit)} ₫</b></span>
              </div>`;
      })()}
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-standard">
            <div class="col-span-1 sm:col-span-2"><label class="block text-body-sm font-bold text-on-surface mb-xs">Gói PT mới ${REQ}</label><select id="ptswitch-goi" ${inputCls}><option value="">— Chọn gói PT mới —</option>${goiPtList.map(g => `<option value="${g.id}" data-price="${g.gia || 0}" data-buoi="${g.so_buoi || ''}" data-thang="${g.so_thang || 0}">${g.ten_goi} — ${window.GymApp.formatCurrency(g.gia || 0)}${g.so_buoi ? ' / ' + g.so_buoi + ' buổi' : ''}</option>`).join('')}</select></div>
            <div class="col-span-1 sm:col-span-2">
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Chọn huấn luyện viên (PT) ${REQ}</label>
              <input type="hidden" id="ptswitch-pt" value="${c.pt_id || ''}" />
              <div id="ptswitch-pt-selection-area" class="space-y-xs">
                <div class="relative mb-compact group">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[16px] group-focus-within:text-brand-primary transition-colors">search</span>
                  <input id="ptswitch-search-pt" type="text" placeholder="Tìm kiếm huấn luyện viên..." class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-9 pr-4 py-2 rounded-xl focus:border-brand-primary outline-none text-body-md font-semibold transition-all" />
                </div>
                <div id="ptswitch-pt-list" class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-xs border border-outline-variant rounded-xl p-3 bg-surface-container-low/10">
                  <p class="text-center py-4 text-on-surface-variant text-body-sm font-semibold">Đang tải danh sách PT...</p>
                </div>
              </div>
              <div id="ptswitch-selected-pt-display" class="hidden p-compact bg-brand-primary/10 rounded-xl border border-brand-primary/30 flex items-center gap-compact mt-xs">
                <div id="ptswitch-selected-pt-info" class="flex items-center gap-compact flex-1 text-body-sm"></div>
                <button id="ptswitch-clear-pt" type="button" class="material-symbols-outlined text-lg text-on-surface-variant hover:text-error transition-colors">close</button>
              </div>
            </div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Số buổi tập</label><input id="ptswitch-sessions" type="number" min="1" ${inputCls} /></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Giá thực tế mới (VNĐ) ${REQ}</label><input id="ptswitch-price" type="text" inputmode="numeric" ${inputCls} /></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Từ ngày ${REQ}</label><input id="ptswitch-from" type="date" value="${new Date().toISOString().split('T')[0]}" ${inputCls} /></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Đến ngày</label><input id="ptswitch-to" type="date" ${inputCls} /></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Hoàn tiền gói cũ (VNĐ)</label><input id="ptswitch-refund" type="text" inputmode="numeric" placeholder="Tự động tính hoặc nhập tay" ${inputCls} /></div>
            <div><label id="ptswitch-additional-label" class="block text-body-sm font-bold text-on-surface mb-xs">Tiền đóng thêm (gợi ý)</label><input id="ptswitch-additional" type="text" readonly style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;background:#f0fdf4;color:#166534;font-weight:700;border:1px solid #bbf7d0;" /></div>
            <div class="col-span-1 sm:col-span-2"><label class="block text-body-sm font-bold text-on-surface mb-xs">Ghi chú đổi gói</label><textarea id="ptswitch-note" rows="2" placeholder="Nhập lý do đổi gói..." class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;resize:vertical;font-family:inherit;">Đổi sang gói PT mới</textarea></div>
          </div>
        </div>
        <div class="border-t border-outline-variant px-loose py-standard bg-surface-container-lowest flex gap-standard flex-shrink-0">
            <button id="ptswitch-cancel-btn" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Hủy</button>
            <button id="ptswitch-save-btn" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#1D9336;">Xác nhận đổi gói</button>
          </div>

      </div>`;
    document.body.appendChild(overlay);
    window.GymApp.initDatePickers(overlay);

    const ptswitchListEl = document.getElementById('ptswitch-pt-list');
    const ptswitchSearchInputEl = document.getElementById('ptswitch-search-pt');
    const ptswitchSelectedDisplayEl = document.getElementById('ptswitch-selected-pt-display');
    const ptswitchSelectedInfoEl = document.getElementById('ptswitch-selected-pt-info');
    const ptswitchHiddenInputEl = document.getElementById('ptswitch-pt');
    const ptswitchClearBtnEl = document.getElementById('ptswitch-clear-pt');
    const ptswitchSelectionAreaEl = document.getElementById('ptswitch-pt-selection-area');

    const selectPTSwitch = (ptId, ptName, avatarUrl) => {
      ptswitchHiddenInputEl.value = ptId;
      ptswitchSelectionAreaEl.classList.add('hidden');
      ptswitchSelectedDisplayEl.classList.remove('hidden');
      ptswitchSelectedInfoEl.innerHTML = `
        ${window.GymApp.avatarImg(avatarUrl, ptName, 'sm')}
        <span class="text-brand-primary font-bold text-body-sm">${ptName}</span>
      `;
      ptswitchHiddenInputEl.dispatchEvent(new Event('change'));
    };

    if (ptswitchListEl) {
      if (pts.length === 0) {
        ptswitchListEl.innerHTML = '<p class="text-center py-4 text-on-surface-variant text-body-sm font-semibold">Không có PT nào</p>';
      } else {
        ptswitchListEl.innerHTML = pts.map(pt => `
          <div class="pt-modal-card flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer hover:shadow-md transition-all duration-200 border-2 border-outline-variant/40 hover:border-brand-primary/60 hover:-translate-y-0.5 bg-surface-container-lowest"
               data-pt-id="${pt.id}" data-pt-name="${pt.ho_ten || pt.name}" data-pt-specialty="${pt.chuyen_mon || ''}" data-avatar-url="${pt.avatar_url || ''}">
            ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten || pt.name, 'md')}
            <div class="text-center min-w-0 w-full">
              <p class="font-bold text-on-surface text-body-sm truncate">${pt.ho_ten || pt.name}</p>
              <p class="text-on-surface-variant text-[11px] font-semibold truncate">${pt.chuyen_mon || 'Huấn luyện viên'}</p>
              <p class="text-[10px] text-outline font-semibold mt-0.5">${pt.ma_ho_so || 'PT'} · ${pt.so_hoc_vien || 0} HV</p>
              <p class="text-[10px] font-bold text-amber-500 mt-0.5 flex items-center justify-center gap-0.5">
                ⭐ ${pt.rating ? `${pt.rating} (${pt.so_luot_danh_gia || 0})` : 'Chưa có ĐG'}
              </p>
            </div>
          </div>
        `).join('');

        ptswitchListEl.querySelectorAll('.pt-modal-card').forEach(card => {
          card.addEventListener('click', () => {
            const ptId = card.dataset.ptId;
            const ptName = card.dataset.ptName;
            const avatarUrl = card.dataset.avatarUrl || '';
            selectPTSwitch(ptId, ptName, avatarUrl);
          });
        });
      }
    }

    ptswitchSearchInputEl?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      ptswitchListEl?.querySelectorAll('.pt-modal-card').forEach(card => {
        const name = card.dataset.ptName.toLowerCase();
        const spec = card.dataset.ptSpecialty.toLowerCase();
        card.style.display = name.includes(q) || spec.includes(q) ? '' : 'none';
      });
    });

    ptswitchClearBtnEl?.addEventListener('click', () => {
      ptswitchHiddenInputEl.value = '';
      ptswitchSelectedDisplayEl.classList.add('hidden');
      ptswitchSelectionAreaEl.classList.remove('hidden');
      if (ptswitchSearchInputEl) ptswitchSearchInputEl.value = '';
      ptswitchListEl?.querySelectorAll('.pt-modal-card').forEach(card => {
        card.style.display = '';
      });
      ptswitchHiddenInputEl.dispatchEvent(new Event('change'));
    });

    if (c.pt_id) {
      const initialPt = pts.find(pt => String(pt.id) === String(c.pt_id));
      if (initialPt) {
        selectPTSwitch(initialPt.id, initialPt.ho_ten || initialPt.name, initialPt.avatar_url);
      }
    }
    const _pVND = s => parseInt((s || '').replace(/\./g, '').replace(/,/g, '')) || 0;
    const _fVND = n => n > 0 ? new Intl.NumberFormat('vi-VN').format(n) : '';

    // Tính tiền hoàn gợi ý từ gói PT cũ
    const buoiCon = (c.buoi_dang_ky || 0) - (c.buoi_da_tap || 0);
    const tongBuoi = c.buoi_dang_ky || 0;
    const giaThucTeCu = c.gia_thuc_te || 0;
    const creditGoiCu = tongBuoi > 0 ? Math.round(giaThucTeCu * buoiCon / tongBuoi) : 0;

    // Điền sẵn tiền hoàn gợi ý
    const refundEl = document.getElementById('ptswitch-refund');
    if (refundEl && creditGoiCu > 0) refundEl.value = _fVND(creditGoiCu);

    const updateAdditionalHint = () => {
      const newPrice = _pVND(document.getElementById('ptswitch-price').value);
      const refund = _pVND(document.getElementById('ptswitch-refund').value);
      const oldPrice = c.gia_thuc_te || 0;
      const isUpgrade = newPrice >= oldPrice;
      const addEl = document.getElementById('ptswitch-additional');
      const labelEl = document.getElementById('ptswitch-additional-label');
      if (!addEl) return;
      if (newPrice <= 0) { addEl.value = ''; return; }
      if (isUpgrade) {
        // Khách phải đóng thêm
        const diff = Math.max(0, newPrice - refund);
        addEl.value = _fVND(diff) + ' ₫';
        addEl.style.background = '#f0fdf4'; addEl.style.color = '#166534'; addEl.style.borderColor = '#bbf7d0';
        if (labelEl) { labelEl.textContent = 'Tiền đóng thêm (gợi ý)'; labelEl.style.color = '#166534'; }
      } else {
        // Hoàn tiền cho khách
        const diff = Math.max(0, refund - newPrice);
        addEl.value = _fVND(diff) + ' ₫';
        addEl.style.background = '#fce4e4'; addEl.style.color = '#93000a'; addEl.style.borderColor = '#f5c2c7';
        if (labelEl) { labelEl.textContent = 'Tiền hoàn trả khách (gợi ý)'; labelEl.style.color = '#93000a'; }
      }
    };

    const ptswitchPriceEl = document.getElementById('ptswitch-price');
    ptswitchPriceEl?.addEventListener('focus', function () { const v = _pVND(this.value); this.value = v > 0 ? String(v) : ''; });
    ptswitchPriceEl?.addEventListener('blur', function () { this.value = _fVND(_pVND(this.value)); updateAdditionalHint(); });
    ptswitchPriceEl?.addEventListener('input', updateAdditionalHint);

    refundEl?.addEventListener('focus', function () { const v = _pVND(this.value); this.value = v > 0 ? String(v) : ''; });
    refundEl?.addEventListener('blur', function () { this.value = _fVND(_pVND(this.value)); updateAdditionalHint(); });
    refundEl?.addEventListener('input', updateAdditionalHint);

    const updatePtSwitchDuration = (e) => {
      const goiSel = document.getElementById('ptswitch-goi');
      if (!goiSel) return;
      const opt = goiSel.options[goiSel.selectedIndex];
      if (!opt || !goiSel.value) return;

      const price = parseFloat(opt.dataset.price) || 0;
      const buoi = opt.dataset.buoi;
      const soThang = parseInt(opt.dataset.thang) || 0;
      const fromVal = document.getElementById('ptswitch-from').value;

      if (price > 0 && (!e || e.target.id === 'ptswitch-goi')) {
        document.getElementById('ptswitch-price').value = _fVND(price);
      }

      let sessionsVal = document.getElementById('ptswitch-sessions').value;
      if (!e || e.target.id === 'ptswitch-goi' || !sessionsVal) {
        sessionsVal = buoi || '';
        document.getElementById('ptswitch-sessions').value = sessionsVal;
      }
      const numSessions = parseInt(sessionsVal) || 0;

      if (soThang > 0 && fromVal) {
        const from = new Date(fromVal);
        const to = new Date(fromVal);
        to.setMonth(to.getMonth() + soThang);
        document.getElementById('ptswitch-to').value = to.toISOString().split('T')[0];

        if (!e || e.target.id !== 'ptswitch-sessions') {
          const diffDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
          document.getElementById('ptswitch-sessions').value = diffDays;
        }
      } else if (numSessions > 0 && fromVal) {
        const from = new Date(fromVal);
        const to = new Date(fromVal);
        to.setDate(to.getDate() + numSessions);
        document.getElementById('ptswitch-to').value = to.toISOString().split('T')[0];

        const diffDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
        document.getElementById('ptswitch-sessions').value = diffDays;
      } else {
        document.getElementById('ptswitch-to').value = '';
      }
      // Cập nhật gợi ý tiền đóng thêm/hoàn trả sau khi chọn gói mới
      updateAdditionalHint();
    };

    document.getElementById('ptswitch-goi').addEventListener('change', updatePtSwitchDuration);
    document.getElementById('ptswitch-from').addEventListener('change', updatePtSwitchDuration);
    document.getElementById('ptswitch-sessions').addEventListener('input', updatePtSwitchDuration);
    const close = () => overlay.remove();
    document.getElementById('close-sub-modal').addEventListener('click', close);
    document.getElementById('ptswitch-cancel-btn').addEventListener('click', close);
    document.getElementById('ptswitch-save-btn').addEventListener('click', async () => {
      const ptId = document.getElementById('ptswitch-pt').value;
      const goiId = document.getElementById('ptswitch-goi').value;
      const price = _pVND(document.getElementById('ptswitch-price').value);
      const from = document.getElementById('ptswitch-from').value;
      const to = document.getElementById('ptswitch-to').value;
      const sessions = document.getElementById('ptswitch-sessions').value;
      const note = document.getElementById('ptswitch-note').value.trim();
      if (!ptId || !goiId || price <= 0 || !from) { window.GymApp.toast('Vui lòng chọn gói mới, PT, giá và ngày bắt đầu (*)', 'error'); return; }
      try {
        // Gắn gợi ý tiền đóng thêm/hoàn trả vào ghi chú để lưu vết
        const refundLocal = _pVND(document.getElementById('ptswitch-refund')?.value);
        const diffLocal = price - refundLocal;
        const noteWithHint = `Đổi từ gói: ${c.ten_goi_pt || 'Gói PT'} (ID: ${c.id}, Giá cũ: ${c.gia_thuc_te}, Hoàn tiền: ${refundLocal})${note ? ' | ' + note : ''}`;
        await window.GymApp.api.put(`/pt/registrations/${c.id}`, {
          pt_id: parseInt(ptId), goi_pt_id: parseInt(goiId),
          so_buoi_dang_ky: sessions ? parseInt(sessions) : undefined,
          tu_ngay: from, den_ngay: to || null, gia_thuc_te: price,
          ghi_chu: noteWithHint,
        });
        window.GymApp.toast('Đổi gói PT thành công!', 'success');
        close();
        if (typeof onSaved === 'function') await onSaved();
      } catch (err) { window.GymApp.toast(err.message || 'Đổi gói thất bại', 'error'); }
    });
  },

  // ===== MODAL ĐĂNG KÝ LỊCH TẬP PT — giữ nguyên =====
  _showAddScheduleModal: function (m, onSaved) {
    document.getElementById('gym-sub-modal')?.remove();
    const REQ = `<span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>`;
    const inputCls = `class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;"`;
    const ptContracts = Array.isArray(m.pt_hien_tai) ? m.pt_hien_tai : [];
    const timeSlots = [];
    for (let h = 0; h < 24; h++) { for (let mn = 0; mn < 60; mn += 15) { timeSlots.push(`${String(h).padStart(2, '0')}:${String(mn).padStart(2, '0')}`); } }
    const overlay = document.createElement('div');
    overlay.id = 'gym-sub-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);padding:16px;';
    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:18px;width:100%;max-width:560px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
        <div style="background:linear-gradient(135deg,#2d6a4f,#40916c);padding:16px 20px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <h3 style="font-size:15px;font-weight:800;color:#fff;margin:0 0 2px;">Đăng ký lịch tập PT</h3>
            <p style="font-size:11px;color:rgba(255,255,255,0.75);margin:0;">Hội viên: <strong style="color:#d8f3dc;">${m.ho_ten || m.name}</strong></p>
          </div>
          <button id="close-sub-modal" style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.25);cursor:pointer;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.18)'"><span class="material-symbols-outlined" style="color:#fff;font-size:16px;">close</span></button>
        </div>
        <div class="p-loose flex-grow overflow-y-auto bg-surface-container-lowest flex flex-col gap-standard">
          <div>
            <label class="block text-body-sm font-bold text-on-surface mb-xs">Huấn luyện viên ${REQ}</label>
            <input type="hidden" id="sch-pt" value="" />
            ${ptContracts.length === 0
        ? `<div style="padding:10px 14px;border-radius:8px;background:#ffdad6;color:#93000a;font-size:13px;font-weight:600;">Hội viên chưa có gói PT đang hoạt động.</div>`
        : `<div id="sch-pt-selection-area">
              <div id="sch-pt-list" class="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-outline-variant rounded-xl p-3 bg-surface-container-low/10">
                ${ptContracts.map(c => `
                  <div class="sch-pt-card flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer hover:shadow-md transition-all duration-200 border-2 border-outline-variant/40 hover:border-brand-primary/60 hover:-translate-y-0.5 bg-surface-container-lowest"
                       data-contract-id="${c.id}" data-pt-name="${c.ten_pt || ''}" data-avatar-url="${c.avatar_pt || ''}">
                    <div class="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/50 flex-shrink-0 flex items-center justify-center bg-brand-primary/15">
                      ${window.GymApp.avatarImg(c.avatar_pt, c.ten_pt, 'sm', 'width:100%;height:100%;')}
                    </div>
                    <div class="text-center min-w-0 w-full">
                      <p class="font-bold text-on-surface text-body-sm truncate">${c.ten_pt || 'PT'}</p>
                      <p class="text-on-surface-variant text-[11px] font-semibold truncate">${c.chuyen_mon || 'Huấn luyện viên'}</p>
                      <p class="text-[10px] text-outline font-semibold mt-0.5">Còn ${(c.buoi_dang_ky || 0) - (c.buoi_da_tap || 0)} buổi</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div id="sch-selected-pt-display" class="hidden p-3 bg-brand-primary/10 rounded-xl border-2 border-brand-primary/30 flex items-center gap-compact mt-xs">
              <div id="sch-selected-pt-avatar-container" class="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/50 flex-shrink-0 flex items-center justify-center bg-brand-primary/15">
              </div>
              <div id="sch-selected-pt-info" class="flex-1 min-w-0 text-body-sm"></div>
              <button id="sch-clear-pt" type="button" class="material-symbols-outlined text-lg text-on-surface-variant hover:text-error transition-colors flex-shrink-0">close</button>
            </div>`}
          </div>
          <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Chọn ngày ${REQ}</label><input id="sch-date" type="date" value="${new Date().toISOString().split('T')[0]}" min="${new Date().toISOString().split('T')[0]}" ${inputCls} /></div>
          <div>
            <label class="block text-body-sm font-bold text-on-surface mb-xs">Chọn giờ bắt đầu ${REQ}</label>
            <div id="sch-time-display" class="text-body-sm mb-compact" style="min-height:18px;color:#6e7a6b;">Chưa chọn giờ</div>
            <div style="border:1px solid #becab9;border-radius:10px;overflow:hidden;max-height:210px;overflow-y:auto;">
              <div class="time-slot-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(60px,1fr));gap:4px;padding:8px;">
                ${timeSlots.map(t => `<button class="time-slot-btn" data-time="${t}" style="padding:5px 1px;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.15s;text-align:center;">${t}</button>`).join('')}
              </div>
            </div>
          </div>
          <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Ghi chú</label><input id="sch-note" type="text" placeholder="Ghi chú thêm (không bắt buộc)..." ${inputCls} /></div>
        </div>
        <div class="border-t border-outline-variant px-loose py-standard bg-surface-container-lowest flex gap-standard flex-shrink-0">
            <button id="sch-cancel-btn" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Hủy</button>
            <button id="sch-save-btn" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#1D9336;">Đăng ký</button>
          </div>

      </div>`;
    document.body.appendChild(overlay);
    window.GymApp.initDatePickers(overlay);
    // --- Grid card chọn PT cho lịch tập ---
    if (ptContracts.length > 0) {
      const schSelectionArea = document.getElementById('sch-pt-selection-area');
      const schSelectedDisplay = document.getElementById('sch-selected-pt-display');
      const schSelectedInfo = document.getElementById('sch-selected-pt-info');
      const schHiddenInput = document.getElementById('sch-pt');
      const schClearBtn = document.getElementById('sch-clear-pt');

      const selectSchPt = (contractId, ptName, avatarUrl) => {
        schHiddenInput.value = contractId;
        if (schSelectionArea) schSelectionArea.classList.add('hidden');
        if (schSelectedDisplay) schSelectedDisplay.classList.remove('hidden');
        if (schSelectedInfo) schSelectedInfo.innerHTML = `<span class="text-brand-primary font-bold">${ptName}</span>`;
        const avatarContainer = document.getElementById('sch-selected-pt-avatar-container');
        if (avatarContainer) {
          avatarContainer.innerHTML = window.GymApp.avatarImg(avatarUrl, ptName, 'sm', 'width:100%;height:100%;');
        }
      };

      overlay.querySelectorAll('.sch-pt-card').forEach(card => {
        card.addEventListener('click', () => {
          selectSchPt(card.dataset.contractId, card.dataset.ptName, card.dataset.avatarUrl);
        });
      });

      schClearBtn?.addEventListener('click', () => {
        schHiddenInput.value = '';
        if (schSelectedDisplay) schSelectedDisplay.classList.add('hidden');
        if (schSelectionArea) schSelectionArea.classList.remove('hidden');
      });

      // Auto-select if only 1 PT contract
      if (ptContracts.length === 1) {
        selectSchPt(String(ptContracts[0].id), ptContracts[0].ten_pt || 'PT', ptContracts[0].avatar_pt || '');
      }
    }

    let selectedTime = '';
    const updateAvailableTimeSlots = () => {
      const selectedDate = document.getElementById('sch-date')?.value;
      if (!selectedDate) return;

      const now = new Date();
      const todayStr = now.toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];
      const isPastDay = selectedDate < todayStr;
      const isToday = selectedDate === todayStr;

      const currentHour = now.getHours();
      const currentMin = now.getMinutes();

      overlay.querySelectorAll('.time-slot-btn').forEach(btn => {
        const timeVal = btn.dataset.time;
        const [h, mn] = timeVal.split(':').map(Number);
        const isPast = isPastDay || (isToday && (h < currentHour || (h === currentHour && mn <= currentMin)));

        if (isPast) {
          btn.disabled = true;
          btn.style.background = '#f1f1f1';
          btn.style.color = '#c0c0c0';
          btn.style.cursor = 'not-allowed';
          btn.style.transform = 'scale(1)';
          if (selectedTime === timeVal) {
            selectedTime = '';
            const display = document.getElementById('sch-time-display');
            if (display) {
              display.textContent = 'Chưa chọn giờ';
              display.style.color = '';
              display.style.fontWeight = '';
            }
          }
        } else {
          btn.disabled = false;
          btn.style.cursor = 'pointer';
          if (timeVal === selectedTime) {
            btn.style.background = '#1D9336';
            btn.style.color = '#fff';
          } else {
            btn.style.background = '';
            btn.style.color = '';
          }
        }
      });
    };

    overlay.querySelectorAll('.time-slot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        selectedTime = btn.dataset.time;
        overlay.querySelectorAll('.time-slot-btn').forEach(b => {
          if (!b.disabled) {
            b.style.transform = 'scale(1)';
            b.style.background = b.dataset.time === selectedTime ? '#1D9336' : '';
            b.style.color = b.dataset.time === selectedTime ? '#fff' : '';
          }
        });
        btn.style.transform = 'scale(1.05)';
        const display = document.getElementById('sch-time-display');
        display.textContent = `Đã chọn: ${selectedTime}`; display.style.color = '#1D9336'; display.style.fontWeight = '700';
      });
    });

    document.getElementById('sch-date')?.addEventListener('change', updateAvailableTimeSlots);
    updateAvailableTimeSlots();
    const close = () => overlay.remove();
    document.getElementById('close-sub-modal').addEventListener('click', close);
    document.getElementById('sch-cancel-btn').addEventListener('click', close);
    document.getElementById('sch-save-btn').addEventListener('click', async () => {
      if (ptContracts.length === 0) { window.GymApp.toast('Hội viên chưa có gói PT. Vui lòng đăng ký gói PT trước!', 'error'); return; }
      const contractId = document.getElementById('sch-pt')?.value;
      const date = document.getElementById('sch-date').value;
      if (!contractId || !date || !selectedTime) { window.GymApp.toast('Vui lòng chọn đầy đủ PT, ngày và giờ (*)', 'error'); return; }
      const activeContract = ptContracts.find(c => String(c.id) === String(contractId));
      if (!activeContract) { window.GymApp.toast('Không tìm thấy hợp đồng PT!', 'error'); return; }
      try {
        const payload = {
          dang_ky_pt_id: activeContract.id, ngay_tap: date, gio_bat_dau: selectedTime,
          gio_ket_thuc: (function () { const [h, min] = selectedTime.split(':').map(Number); const d = new Date(); d.setHours(h, min + 60); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; })(),
          ghi_chu: document.getElementById('sch-note').value.trim()
        };
        await window.GymApp.api.post('/pt/schedules', payload);
        window.GymApp.toast('Đã đăng ký lịch tập thành công!', 'success');
        if (window.GymApp.fetchInitialData) await window.GymApp.fetchInitialData();
        close();
        if (typeof onSaved === 'function') onSaved();
      } catch (err) { window.GymApp.toast(err.message || 'Lỗi khi đặt lịch tập', 'error'); }
    });
  },

  // =====================================================================
  // TASK 3 — BỘ LỌC PT (sửa field mapping chuyen_mon + trang_thai)
  // =====================================================================
  _showPtFilterModal: function () {
    const self = this;
    document.getElementById('gym-pt-filter-modal')?.remove();

    // FIX: Dùng chuyen_mon thay vì specialty
    const specialties = [...new Set((window.GymApp.data.pts || [])
      .map(p => p.chuyen_mon || p.specialty)
      .filter(Boolean))];

    const radioGroup = (name, options, currentVal) =>
      options.map(([v, l]) => `
        <label class="flex items-center gap-compact cursor-pointer py-xs px-compact rounded-lg hover:bg-surface-container-low transition-colors">
          <input type="radio" name="${name}" value="${v}" style="accent-color:#1D9336;width:16px;height:16px;" ${currentVal === v ? 'checked' : ''} />
          <span class="text-body-md text-on-surface" style="font-size:13px;">${l}</span>
        </label>
      `).join('');

    const overlay = document.createElement('div');
    overlay.id = 'gym-pt-filter-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);padding:20px;';

    overlay.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl shadow-xl flex flex-col" style="width:380px;max-width:100%;max-height:88vh;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.35);">
        <div class="flex items-center justify-between px-loose py-standard border-b border-outline-variant flex-shrink-0" style="background:linear-gradient(135deg,#065f46,#10b981);">
          <div class="flex items-center gap-compact">
            <span class="material-symbols-outlined text-white text-lg">filter_alt</span>
            <h3 class="text-white font-bold" style="font-size:16px;">Bộ lọc — Huấn luyện viên</h3>
          </div>
          <button id="close-pt-filter-modal" style="background:rgba(255,255,255,0.15);border:none;cursor:pointer;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;">
            <span class="material-symbols-outlined text-white" style="font-size:18px;">close</span>
          </button>
        </div>
        <div class="overflow-y-auto flex-1 px-loose py-standard flex flex-col gap-standard">
          <div class="border-b border-outline-variant/60 pb-standard">
            <div class="flex items-center gap-xs mb-compact">
              <span class="material-symbols-outlined text-sm" style="color:#10b981;">sports_gymnastics</span>
              <h4 class="text-on-surface font-bold text-body-sm uppercase tracking-wider">Chuyên môn</h4>
            </div>
            <div class="grid grid-cols-2 gap-xs bg-surface-container-lowest p-compact rounded-xl border border-outline-variant/40 max-h-40 overflow-y-auto">
              ${radioGroup('pt-f-spec', [['', 'Tất cả'], ...specialties.map(s => [s, s])], self._ptFilterState.specialty)}
            </div>
          </div>
          <div>
            <div class="flex items-center gap-xs mb-compact">
              <span class="material-symbols-outlined text-sm" style="color:#10b981;">donut_large</span>
              <h4 class="text-on-surface font-bold text-body-sm uppercase tracking-wider">Trạng thái làm việc</h4>
            </div>
            <div class="grid grid-cols-2 gap-xs bg-surface-container-lowest p-compact rounded-xl border border-outline-variant/40">
              ${radioGroup('pt-f-status', [
      ['', 'Tất cả'],
      ['hoat_dong', 'Đang làm việc'],
      ['tam_nghi', 'Tạm nghỉ'],
    ], self._ptFilterState.status)}
            </div>
          </div>
        </div>
        <div class="flex gap-standard px-loose py-standard border-t border-outline-variant bg-surface-container-lowest flex-shrink-0">
          <button id="pt-filter-reset-btn" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Đặt lại</button>
          <button id="pt-filter-apply-btn" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#10b981;">Áp dụng</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('close-pt-filter-modal')?.addEventListener('click', close);
    document.getElementById('pt-filter-reset-btn')?.addEventListener('click', () => {
      overlay.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = r.value === ''; });
    });
    document.getElementById('pt-filter-apply-btn')?.addEventListener('click', () => {
      self._ptFilterState.specialty = overlay.querySelector('input[name="pt-f-spec"]:checked')?.value || '';
      self._ptFilterState.status = overlay.querySelector('input[name="pt-f-status"]:checked')?.value || '';
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
      ['', 'Mặc định'], ['name-asc', 'Tên A → Z'], ['name-desc', 'Tên Z → A'],
      ['rating-desc', 'Đánh giá cao nhất'], ['experience-desc', 'Kinh nghiệm nhiều nhất'],
      ['sessions-desc', 'Buổi đã dạy nhiều nhất'], ['joinDate-desc', 'Ngày gia nhập mới nhất'],
    ];
    const overlay = document.createElement('div');
    overlay.id = 'gym-pt-sort-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);padding:20px;';
    overlay.innerHTML = `
      <div class="bg-surface-container-lowest rounded-24px shadow-xl" style="width:360px;max-width:100%;max-height:88vh;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.2);border-radius:24px;">
        <div class="flex items-center justify-between px-loose py-standard border-b border-outline-variant flex-shrink-0" style="background:linear-gradient(135deg,#065f46,#10b981);">
          <div class="flex items-center gap-compact">
            <span class="material-symbols-outlined text-white text-lg">sort</span>
            <h3 class="text-white font-bold" style="font-size:16px;">Sắp xếp — Huấn luyện viên</h3>
          </div>
          <button id="close-pt-sort-modal" style="background:rgba(255,255,255,0.15);border:none;cursor:pointer;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;">
            <span class="material-symbols-outlined text-white" style="font-size:18px;">close</span>
          </button>
        </div>
        <div class="px-loose py-standard border-b border-outline-variant overflow-y-auto">
          <div class="flex flex-col gap-xs">
            ${options.map(([value, label]) => `
              <label class="flex items-center gap-compact cursor-pointer py-xs px-compact rounded-lg hover:bg-surface-container-low transition-colors">
                <input type="radio" name="pt-sort" value="${value}" style="accent-color:#10b981;width:16px;height:16px;" ${self._ptSortState === value ? 'checked' : ''} />
                <span class="text-body-md text-on-surface" style="font-size:13px;">${label}</span>
              </label>`).join('')}
          </div>
        </div>
        <div class="flex gap-standard px-loose py-standard flex-shrink-0">
          <button id="pt-sort-reset-btn" class="flex-1 py-2.5 rounded-xl border-2 border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-all active:scale-95 text-body-md">Đặt lại</button>
          <button id="pt-sort-apply-btn" class="flex-1 py-2.5 rounded-xl font-bold text-white text-body-md transition-all active:scale-95 shadow-md hover:shadow-lg hover:opacity-90" style="background:#10b981;">Áp dụng</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('close-pt-sort-modal')?.addEventListener('click', close);
    document.getElementById('pt-sort-reset-btn')?.addEventListener('click', () => {
      const d = overlay.querySelector('input[name="pt-sort"][value=""]'); if (d) d.checked = true;
    });
    document.getElementById('pt-sort-apply-btn')?.addEventListener('click', () => {
      self._ptSortState = overlay.querySelector('input[name="pt-sort"]:checked')?.value || '';
      self._ptPage = 1; self._applyPtFilter(); close();
    });
  },

  // ===== FILTER MODAL HỘI VIÊN =====
  _showFilterModal: function () {
    const self = this;
    document.getElementById('gym-filter-modal')?.remove();
    const packages = [...new Set(window.GymApp.data.members.map(m => m.ten_goi_tap).filter(Boolean))];
    const radioGroup = (name, options, currentVal) =>
      options.map(([v, l]) => `
        <label class="flex items-center gap-compact cursor-pointer py-xs px-compact rounded-lg hover:bg-surface-container-low transition-colors">
          <input type="radio" name="${name}" value="${v}" style="accent-color:#1D9336;width:16px;height:16px;" ${currentVal === v ? 'checked' : ''} />
          <span class="text-body-md text-on-surface font-medium" style="font-size:13px;">${l}</span>
        </label>
      `).join('');
    const overlay = document.createElement('div');
    overlay.id = 'gym-filter-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);padding:20px;';
    overlay.innerHTML = `
      <div class="modal-card bg-surface-container-lowest rounded-2xl shadow-xl flex flex-col" style="width:420px;max-width:100%;max-height:88vh;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.35);">
        <div class="flex items-center justify-between px-loose py-standard border-b border-outline-variant flex-shrink-0" style="background:linear-gradient(135deg,#1a5e2a,#1D9336);">
          <div class="flex items-center gap-compact">
            <span class="material-symbols-outlined text-white text-lg">filter_alt</span>
            <h3 class="text-white font-bold" style="font-size:16px;">Bộ lọc dữ liệu — Hội viên</h3>
          </div>
          <button id="close-filter-modal" style="background:rgba(255,255,255,0.15);border:none;cursor:pointer;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;">
            <span class="material-symbols-outlined text-white" style="font-size:18px;">close</span>
          </button>
        </div>
        <div class="overflow-y-auto flex-1 px-loose py-standard flex flex-col gap-standard">
          <div class="border-b border-outline-variant/60 pb-standard">
            <div class="flex items-center gap-xs mb-compact"><span class="material-symbols-outlined text-brand-primary text-base">store</span><h4 class="text-on-surface font-bold text-body-sm uppercase tracking-wider">Chi nhánh đăng ký</h4></div>
            <div class="grid grid-cols-2 gap-xs bg-surface-container-lowest p-compact rounded-xl border border-outline-variant/40 max-h-40 overflow-y-auto">
              ${radioGroup('f-branch', [['', 'Tất cả chi nhánh'], ...[...new Set(window.GymApp.data.members.map(m => m.chi_nhanh).filter(Boolean))].map(b => [b, b])], self._filterState.chi_nhanh)}
            </div>
          </div>
          <div class="border-b border-outline-variant/60 pb-standard">
            <div class="flex items-center gap-xs mb-compact"><span class="material-symbols-outlined text-brand-primary text-base">donut_large</span><h4 class="text-on-surface font-bold text-body-sm uppercase tracking-wider">Trạng thái hội viên</h4></div>
            <div class="grid grid-cols-2 gap-xs bg-surface-container-lowest p-compact rounded-xl border border-outline-variant/40">
              ${radioGroup('f-status', [['', 'Tất cả'], ['con_han', 'Còn hạn'], ['sap_het_han', 'Sắp hết hạn'], ['het_han', 'Đã hết hạn'], ['chua_dang_ky', 'Chưa đăng ký']], self._filterState.status)}
            </div>
          </div>
          <div class="border-b border-outline-variant/60 pb-standard">
            <div class="flex items-center gap-xs mb-compact"><span class="material-symbols-outlined text-brand-primary text-base">card_membership</span><h4 class="text-on-surface font-bold text-body-sm uppercase tracking-wider">Gói tập kích hoạt</h4></div>
            <div class="grid grid-cols-2 gap-xs bg-surface-container-lowest p-compact rounded-xl border border-outline-variant/40 max-h-40 overflow-y-auto">
              ${radioGroup('f-pkg', [['', 'Tất cả'], ...packages.map(p => [p, p])], self._filterState.pkg)}
            </div>
          </div>
          <div class="border-b border-outline-variant/60 pb-standard">
            <div class="flex items-center gap-xs mb-compact"><span class="material-symbols-outlined text-brand-primary text-base">sports_gymnastics</span><h4 class="text-on-surface font-bold text-body-sm uppercase tracking-wider">Dịch vụ Huấn luyện viên</h4></div>
            <div class="grid grid-cols-2 gap-xs bg-surface-container-lowest p-compact rounded-xl border border-outline-variant/40">
              ${radioGroup('f-hasPt', [['', 'Tất cả'], ['yes', 'Đang có PT'], ['no', 'Tự tập (Không PT)']], self._filterState.hasPt)}
            </div>
          </div>
          <div class="border-b border-outline-variant/60 pb-standard">
            <div class="flex items-center gap-xs mb-compact"><span class="material-symbols-outlined text-brand-primary text-base">how_to_reg</span><h4 class="text-on-surface font-bold text-body-sm uppercase tracking-wider">Check-in hôm nay</h4></div>
            <div class="grid grid-cols-2 gap-xs bg-surface-container-lowest p-compact rounded-xl border border-outline-variant/40">
              ${radioGroup('f-checkinToday', [['', 'Tất cả'], ['yes', 'Đã Check-in'], ['no', 'Chưa Check-in']], self._filterState.checkinToday)}
            </div>
          </div>
          <div>
            <div class="flex items-center gap-xs mb-compact"><span class="material-symbols-outlined text-brand-primary text-base">wc</span><h4 class="text-on-surface font-bold text-body-sm uppercase tracking-wider">Giới tính</h4></div>
            <div class="flex gap-standard bg-surface-container-lowest p-compact rounded-xl border border-outline-variant/40">
              ${radioGroup('f-gender', [['', 'Tất cả'], ['Nam', 'Nam'], ['Nữ', 'Nữ']], self._filterState.gender)}
            </div>
          </div>
        </div>
        <div class="flex gap-standard px-loose py-standard border-t border-outline-variant bg-surface-container-lowest flex-shrink-0">
          <button id="filter-reset-btn" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md cursor-pointer">Đặt lại</button>
          <button id="filter-apply-btn" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90 cursor-pointer shadow-md" style="background:#1D9336;">Áp dụng bộ lọc</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('close-filter-modal')?.addEventListener('click', close);
    document.getElementById('filter-reset-btn')?.addEventListener('click', () => {
      overlay.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = r.value === ''; });
    });
    document.getElementById('filter-apply-btn')?.addEventListener('click', () => {
      self._filterState.pkg = overlay.querySelector('input[name="f-pkg"]:checked')?.value || '';
      self._filterState.status = overlay.querySelector('input[name="f-status"]:checked')?.value || '';
      self._filterState.gender = overlay.querySelector('input[name="f-gender"]:checked')?.value || '';
      self._filterState.hasPt = overlay.querySelector('input[name="f-hasPt"]:checked')?.value || '';
      self._filterState.checkinToday = overlay.querySelector('input[name="f-checkinToday"]:checked')?.value || '';
      self._filterState.chi_nhanh = overlay.querySelector('input[name="f-branch"]:checked')?.value || '';
      self._memberPage = 1; self._applyMemberFilter(); close();
    });
  },

  // ===== SORT MODAL HỘI VIÊN =====
  _showMemberSortModal: function () {
    const self = this;
    document.getElementById('gym-member-sort-modal')?.remove();
    const options = [
      ['', 'Mặc định'], ['name-asc', 'Tên A → Z'], ['name-desc', 'Tên Z → A'],
      ['expiry-asc', 'Hết hạn sớm nhất'], ['expiry-desc', 'Hết hạn muộn nhất'],
      ['joinDate-desc', 'Ngày tham gia mới nhất'],
    ];
    const overlay = document.createElement('div');
    overlay.id = 'gym-member-sort-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);padding:20px;';
    overlay.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl shadow-xl" style="width:360px;max-width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,0.35);">
        <div class="flex items-center justify-between px-loose py-standard border-b border-outline-variant" style="background:linear-gradient(135deg,#1a5e2a,#1D9336);">
          <div class="flex items-center gap-compact">
            <span class="material-symbols-outlined text-white text-lg">sort</span>
            <h3 class="text-white font-bold" style="font-size:16px;">Sắp xếp — Hội viên</h3>
          </div>
          <button id="close-member-sort-modal" style="background:rgba(255,255,255,0.15);border:none;cursor:pointer;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;">
            <span class="material-symbols-outlined text-white" style="font-size:18px;">close</span>
          </button>
        </div>
        <div class="px-loose py-standard">
          <div class="flex flex-col gap-xs">
            ${options.map(([value, label]) => `
              <label class="flex items-center gap-compact cursor-pointer py-xs px-compact rounded-lg hover:bg-surface-container-low transition-colors">
                <input type="radio" name="member-sort" value="${value}" style="accent-color:#1D9336;width:16px;height:16px;" ${self._memberSortState === value ? 'checked' : ''} />
                <span class="text-body-md text-on-surface font-medium" style="font-size:13px;">${label}</span>
              </label>`).join('')}
          </div>
        </div>
        <div class="flex gap-standard px-loose py-standard border-t border-outline-variant">
          <button id="member-sort-reset-btn" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Đặt lại</button>
          <button id="member-sort-apply-btn" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90 shadow-md" style="background:#1D9336;">Áp dụng</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('close-member-sort-modal')?.addEventListener('click', close);
    document.getElementById('member-sort-reset-btn')?.addEventListener('click', () => {
      const d = overlay.querySelector('input[name="member-sort"][value=""]'); if (d) d.checked = true;
    });
    document.getElementById('member-sort-apply-btn')?.addEventListener('click', () => {
      self._memberSortState = overlay.querySelector('input[name="member-sort"]:checked')?.value || '';
      self._memberPage = 1; self._applyMemberFilter(); close();
    });
  },

  // ===== UI HELPERS =====
  _updateFilterUI: function () {
    const count = (this._filterState.status ? 1 : 0) + (this._filterState.pkg ? 1 : 0) +
      (this._filterState.gender ? 1 : 0) + (this._filterState.hasPt ? 1 : 0) +
      (this._filterState.checkinToday ? 1 : 0) + (this._filterState.chi_nhanh ? 1 : 0);
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

  _updateMemberSortUI: function () {
    const badge = document.getElementById('member-sort-badge');
    if (badge) badge.style.display = this._memberSortState ? 'flex' : 'none';
  },


  _showLoadingOverlay: function (text = 'Đang xử lý...') {
    this._hideLoadingOverlay();
    const overlay = document.createElement('div');
    overlay.id = 'gym-global-loading';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);';
    overlay.innerHTML = `
      <div style="background:#fff;padding:24px 40px;border-radius:20px;display:flex;flex-direction:column;align-items:center;gap:12px;box-shadow:0 20px 50px rgba(0,0,0,0.2);">
        <span class="material-symbols-outlined animate-spin" style="font-size:32px;color:#1D9336;">sync</span>
        <span style="font-size:14px;font-weight:700;color:#3f4a3c;">${text}</span>
      </div>`;
    document.body.appendChild(overlay);
  },

  _hideLoadingOverlay: function () {
    document.getElementById('gym-global-loading')?.remove();
  },

  // =====================================================================
  _applyMemberFilter: function () {
    this._memberPage = 1;
    this._fetchMembersData(1, false);
  },

  _sortMemberList: function (list) {
    const sorted = [...list];
    switch (this._memberSortState) {
      case 'name-asc': return sorted.sort((a, b) => (a.ho_ten || '').localeCompare(b.ho_ten || '', 'vi'));
      case 'name-desc': return sorted.sort((a, b) => (b.ho_ten || '').localeCompare(a.ho_ten || '', 'vi'));
      case 'expiry-asc': return sorted.sort((a, b) => new Date(a.ngay_het_han || '9999-12-31') - new Date(b.ngay_het_han || '9999-12-31'));
      case 'expiry-desc': return sorted.sort((a, b) => new Date(b.ngay_het_han || '0000-01-01') - new Date(a.ngay_het_han || '0000-01-01'));
      case 'joinDate-desc': return sorted.sort((a, b) => new Date(b.ngay_tao) - new Date(a.ngay_tao));
      default: return sorted;
    }
  },

  _sortPtList: function (list) {
    const sorted = [...list];
    switch (this._ptSortState) {
      case 'name-asc': return sorted.sort((a, b) => (a.ho_ten || '').localeCompare(b.ho_ten || '', 'vi'));
      case 'name-desc': return sorted.sort((a, b) => (b.ho_ten || '').localeCompare(a.ho_ten || '', 'vi'));
      case 'rating-desc': return sorted.sort((a, b) => (b.danh_gia || b.rating || 0) - (a.danh_gia || a.rating || 0));
      case 'experience-desc': return sorted.sort((a, b) => (b.kinh_nghiem || 0) - (a.kinh_nghiem || 0));
      case 'sessions-desc': return sorted.sort((a, b) => (b.tong_buoi_da_day || b.sessions || 0) - (a.tong_buoi_da_day || a.sessions || 0));
      case 'joinDate-desc': return sorted.sort((a, b) => new Date(b.ngay_tao) - new Date(a.ngay_tao));
      default: return sorted;
    }
  },

  _applyPtFilter: function () {
    const q = document.getElementById('pt-search')?.value.toLowerCase() || '';
    const { specialty, status } = this._ptFilterState;
    const branch = window.GymApp.selectedBranch || '';
    this._ptFiltered = this._sortPtList((window.GymApp.data.pts || []).filter(pt => {
      const name = (pt.ho_ten || '').toLowerCase();
      // FIX: Dùng chuyen_mon (field DB) thay vì specialty
      const spec = (pt.chuyen_mon || pt.specialty || '').toLowerCase();
      const matchQ = !q || name.includes(q) || spec.includes(q);
      // FIX: So sánh đúng với giá trị DB hoat_dong / tam_nghi
      const ptStatus = pt.trang_thai || pt.status || '';
      const matchS = !status || ptStatus === status;
      // FIX: So sánh chuyen_mon đúng (không phải specialty)
      const ptSpec = pt.chuyen_mon || pt.specialty || '';
      const matchSpec = !specialty || ptSpec === specialty;
      const matchBranch = !branch || pt.chi_nhanh === branch;
      return matchQ && matchSpec && matchS && matchBranch;
    }));
    this._ptPage = 1;
    this._refreshPtCards();
    this._updatePtFilterUI();
    this._updatePtSortUI();
  },

  // ===== REFRESH =====
  _refreshMemberTable: function (isAppend = false) {
    const c = document.getElementById('members-table-container');
    if (c) {
      if (isAppend) {
        c.innerHTML = this._renderMemberTable();
        this._bindMemberTableEvents();
      } else {
        c.style.transition = 'none';
        c.style.opacity = '0';
        c.style.transform = 'translateY(15px)';
        c.innerHTML = this._renderMemberTable();
        this._bindMemberTableEvents();
        setTimeout(() => {
          c.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
          c.style.opacity = '1';
          c.style.transform = 'translateY(0)';
        }, 30);
      }
    }
  },

  _refreshPtCards: function (isAppend = false) {
    const c = document.getElementById('pt-cards-container');
    if (c) {
      if (isAppend) {
        c.innerHTML = this._renderPtCards();
        this._bindPtCardEvents();
      } else {
        c.style.transition = 'none';
        c.style.opacity = '0';
        c.style.transform = 'translateY(15px)';
        c.innerHTML = this._renderPtCards();
        this._bindPtCardEvents();
        setTimeout(() => {
          c.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
          c.style.opacity = '1';
          c.style.transform = 'translateY(0)';
        }, 30);
      }
    }
  },

  _bindMemberTableEvents: function () {
    const self = this;
    document.querySelectorAll('.member-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        self._showMemberModal(row.dataset.id);
      });
    });
    document.querySelectorAll('.member-view-btn').forEach(el => {
      el.addEventListener('click', () => self._showMemberModal(el.dataset.id));
    });
    document.querySelectorAll('.member-edit-btn').forEach(el => {
      el.addEventListener('click', () => self._showEditModal(el.dataset.id));
    });
    document.querySelectorAll('.member-delete-btn').forEach(el => {
      el.addEventListener('click', () => self._confirmDeleteMember(el.dataset.id, el.dataset.name));
    });

    // Infinite Scroll Events
    const container = document.getElementById('members-scroll-container');
    if (container) {
      container.addEventListener('scroll', async function () {
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 20) {
          const currentTotal = self._memberFiltered.length;
          if (self._memberPage * self._perPage <= currentTotal) {
            self._memberPage++;
            const scrollPos = container.scrollTop;
            await self._fetchMembersData(self._memberPage, true);
            const newContainer = document.getElementById('members-scroll-container');
            if (newContainer) newContainer.scrollTop = scrollPos;
          }
        }
      });
    }
    const mobileContainer = document.getElementById('members-scroll-mobile-container');
    if (mobileContainer) {
      mobileContainer.addEventListener('scroll', async function () {
        if (mobileContainer.scrollTop + mobileContainer.clientHeight >= mobileContainer.scrollHeight - 20) {
          const currentTotal = self._memberFiltered.length;
          if (self._memberPage * self._perPage <= currentTotal) {
            self._memberPage++;
            const scrollPos = mobileContainer.scrollTop;
            await self._fetchMembersData(self._memberPage, true);
            const newMobileContainer = document.getElementById('members-scroll-mobile-container');
            if (newMobileContainer) newMobileContainer.scrollTop = scrollPos;
          }
        }
      });
    }
  },

  _bindPtCardEvents: function () {
    const self = this;
    document.querySelectorAll('.pt-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        self._showPtModal(parseInt(row.dataset.id));
      });
    });
    document.querySelectorAll('.pt-view-btn, .pt-name-link').forEach(el => {
      el.addEventListener('click', (e) => { e.stopPropagation(); self._showPtModal(parseInt(el.dataset.id)); });
    });
    document.querySelectorAll('.pt-edit-btn').forEach(el => {
      el.addEventListener('click', (e) => { e.stopPropagation(); self._showPtEditModal(parseInt(el.dataset.id)); });
    });
    document.querySelectorAll('.pt-delete-btn').forEach(el => {
      el.addEventListener('click', (e) => { e.stopPropagation(); self._confirmDeletePt(el.dataset.id, el.dataset.name); });
    });

    // Infinite Scroll Events
    const container = document.getElementById('pt-scroll-container');
    if (container) {
      container.addEventListener('scroll', function () {
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 20) {
          if (self._ptPage * self._perPage < self._ptFiltered.length) {
            self._ptPage++;
            const scrollPos = container.scrollTop;
            self._refreshPtCards(true);
            const newContainer = document.getElementById('pt-scroll-container');
            if (newContainer) newContainer.scrollTop = scrollPos;
          }
        }
      });
    }
    const mobileContainer = document.getElementById('pt-scroll-mobile-container');
    if (mobileContainer) {
      mobileContainer.addEventListener('scroll', function () {
        if (mobileContainer.scrollTop + mobileContainer.clientHeight >= mobileContainer.scrollHeight - 20) {
          if (self._ptPage * self._perPage < self._ptFiltered.length) {
            self._ptPage++;
            const scrollPos = mobileContainer.scrollTop;
            self._refreshPtCards(true);
            const newMobileContainer = document.getElementById('pt-scroll-mobile-container');
            if (newMobileContainer) newMobileContainer.scrollTop = scrollPos;
          }
        }
      });
    }
  },

  _confirmDeletePt: function (id, name) {
    const self = this;
    document.getElementById('gym-del-pt-modal')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'gym-del-pt-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);backdrop-filter:blur(6px);padding:16px;';
    overlay.innerHTML = `
      <div style="border-radius:24px;width:100%;max-width:440px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.2);" class="bg-surface-container-lowest">
        <div class="px-loose py-standard border-b border-outline-variant flex items-center gap-compact" style="background:linear-gradient(135deg,#991b1b,#dc2626);">
          <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-white text-xl">person_remove</span>
          </div>
          <h3 class="font-bold text-white" style="font-size:17px">Xác nhận xóa PT</h3>
        </div>
        <div class="p-loose flex flex-col gap-standard bg-surface-container-lowest">
          <p class="text-on-surface text-body-md">Bạn có chắc chắn muốn xóa huấn luyện viên <strong class="text-error">${name}</strong> không?</p>
          <div class="flex items-start gap-xs bg-error/10 p-compact rounded-xl border border-error/20">
            <span class="material-symbols-outlined text-error text-[18px]">warning</span>
            <p class="text-error text-body-sm font-medium m-0">Hành động này sẽ gỡ PT khỏi hệ thống quản lý và không thể hoàn tác.</p>
          </div>
          <div class="flex gap-standard justify-end pt-xs">
            <button id="cancel-del-pt" class="px-loose py-2.5 rounded-xl font-bold text-body-sm border-2 border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all active:scale-95">Hủy bỏ</button>
            <button id="confirm-del-pt" class="bg-error text-white px-loose py-2.5 rounded-xl font-bold text-body-sm transition-all flex items-center gap-xs active:scale-95 shadow-md hover:shadow-lg hover:opacity-90">
              <span class="material-symbols-outlined text-sm">delete</span> Xóa PT
            </button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('cancel-del-pt').addEventListener('click', close);
    document.getElementById('confirm-del-pt').addEventListener('click', async () => {
      const btn = document.getElementById('confirm-del-pt');
      btn.disabled = true; btn.classList.add('opacity-50');
      try {
        const res = await window.GymApp.api.delete(`/trainers/${id}`);
        if (res?.success) {
          window.GymApp.toast(`Đã xóa huấn luyện viên ${name}!`, 'success');
          close();
          if (window.GymApp.fetchInitialData) await window.GymApp.fetchInitialData();
          self._ptFiltered = [...(window.GymApp.data.pts || [])];
          self._applyPtFilter();
        } else {
          window.GymApp.toast(res?.message || 'Có lỗi xảy ra!', 'error');
          btn.disabled = false; btn.classList.remove('opacity-50');
        }
      } catch (err) {
        window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
        btn.disabled = false; btn.classList.remove('opacity-50');
      }
    });
  },

  _showEditModal: async function (id) {
    const self = this;
    let m = null;
    let branches = [];
    this._showLoadingOverlay('Tải thông tin...');
    try {
      const [res, branchesRes] = await Promise.all([
        window.GymApp.api.get(`/members/${id}`),
        window.GymApp.api.get('/branches').catch(() => ({ success: false, data: [] }))
      ]);
      m = res?.data || null;
      branches = (branchesRes && branchesRes.success) ? (branchesRes.data || []) : [];
    } catch (_) { }
    this._hideLoadingOverlay();
    if (!m) m = (window.GymApp.data.members || []).find(x => x.id == id);
    if (!m) { window.GymApp.toast('Không tìm thấy thông tin hội viên!', 'error'); return; }

    document.getElementById('gym-edit-member-modal')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'gym-edit-member-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);backdrop-filter:blur(6px);padding:16px;';

    const field = (icon, label, id, type, value, required = false, isFull = false) => `
      <div class="${isFull ? 'col-span-full' : ''}">
        <label class="text-on-surface-variant text-body-sm uppercase font-bold tracking-wider block mb-1 opacity-80">${label}${required ? ' <span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>' : ''}</label>
        <div class="relative group">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors text-[18px]">${icon}</span>
          <input id="em-${id}" type="${type}" value="${value || ''}" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-10 pr-4 py-2.5 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-body-md font-medium transition-all" />
        </div>
      </div>`;

    const selectField = (icon, label, id, options, selectedValue, isFull = false) => `
      <div class="${isFull ? 'col-span-full' : ''}">
        <label class="text-on-surface-variant text-body-sm uppercase font-bold tracking-wider block mb-1 opacity-80">${label}</label>
        <div class="relative group">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors text-[18px] z-10">${icon}</span>
          <select id="em-${id}" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-10 pr-10 py-2.5 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-body-md font-medium transition-all cursor-pointer relative z-0" style="appearance:none !important;-webkit-appearance:none !important;-moz-appearance:none !important;background-image:none !important;">
            ${options.map(o => `<option value="${o.v}" ${o.v === selectedValue ? 'selected' : ''}>${o.l}</option>`).join('')}
          </select>
          <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none z-10">expand_more</span>
        </div>
      </div>`;

    overlay.innerHTML = `
      <div style="border-radius:24px;width:100%;max-width:560px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.2);background:var(--bg-surface-lowest);">
        <div style="padding:24px 24px 16px;flex-shrink:0;position:relative;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--outline-variant);border-top-left-radius:24px;border-top-right-radius:24px;">
          <div>
            <h3 style="font-size:20px;font-weight:800;color:var(--text-on-surface);margin:0 0 4px;">Chỉnh sửa hồ sơ</h3>
            <p style="font-size:13px;color:var(--text-on-surface-variant);margin:0;opacity:0.8;">Mã HV: ${m.ma_ho_so || '—'}</p>
          </div>
          <button id="close-member-edit-modal" style="background:var(--bg-surface-variant);border:none;cursor:pointer;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;" class="hover:bg-outline-variant/30 transition-all">
            <span class="material-symbols-outlined" style="color:var(--text-on-surface);font-size:20px;">close</span>
          </button>
        </div>
        <div style="overflow-y:auto;flex:1;padding:24px;display:flex;flex-direction:column;gap:20px;">
          <!-- Avatar Preview Centered -->
          <div style="display:flex;justify-content:center;margin-bottom:8px;">
            <div id="me-avatar-container" class="relative group cursor-pointer" title="Nhấn để đổi ảnh đại diện">
              <div style="width:90px;height:90px;border-radius:50%;border:4px solid var(--brand-primary-container);overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);" id="me-avatar-preview">
                ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'lg', 'width:100%;height:100%;object-fit:cover;border-radius:50%;')}
              </div>
              <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="material-symbols-outlined text-white text-[22px]">photo_camera</span>
              </div>
              <input type="file" id="me-avatar-input" accept="image/*" style="display:none;" />
            </div>
          </div>

          <div class="border-b border-outline-variant/50 pb-1.5">
            <h4 class="text-brand-primary text-body-md font-bold uppercase tracking-wider">Thông tin cá nhân</h4>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            ${field('person', 'Họ và tên', 'ho_ten', 'text', m.ho_ten, true, true)}
            ${field('cake', 'Ngày sinh', 'ngay_sinh', 'date', m.ngay_sinh ? m.ngay_sinh.substring(0, 10) : '', false, false)}
            ${selectField('wc', 'Giới tính', 'gioi_tinh', [{ v: '', l: '— Chọn —' }, { v: 'nam', l: 'Nam' }, { v: 'nu', l: 'Nữ' }, { v: 'khac', l: 'Khác' }], m.gioi_tinh === 'male' ? 'nam' : (m.gioi_tinh === 'female' ? 'nu' : m.gioi_tinh), false)}
            ${field('badge', 'CCCD / CMND', 'cccd', 'text', m.cccd, false, false)}
            ${field('home_pin', 'Quê quán', 'que_quan', 'text', m.que_quan, false, false)}
            ${selectField('store', 'Chi nhánh', 'chi_nhanh', [{ v: '', l: '— Chọn chi nhánh —' }, ...branches.map(b => ({ v: b.ten, l: b.ten }))], m.chi_nhanh, false)}
          </div>
          <div class="border-b border-outline-variant/50 pb-1.5 mt-2">
            <h4 class="text-brand-primary text-body-md font-bold uppercase tracking-wider">Liên hệ</h4>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            ${field('call', 'Số điện thoại', 'so_dien_thoai', 'tel', m.so_dien_thoai)}
            ${field('mail', 'Email', 'email', 'email', m.email)}
            ${field('location_on', 'Địa chỉ', 'dia_chi_tam_tru', 'text', m.dia_chi_tam_tru, false, true)}
          </div>
          <div>
            <div class="relative group">
              <span class="material-symbols-outlined absolute left-3 top-3 text-outline group-focus-within:text-brand-primary transition-colors text-[18px]">edit_note</span>
              <textarea id="em-ghi_chu" rows="3" class="w-full bg-surface-container border border-outline-variant text-on-surface pl-10 pr-4 py-2.5 rounded-xl focus:border-brand-primary outline-none text-[14px] font-medium resize-none transition-all" placeholder="Ghi chú...">${m.ghi_chu || ''}</textarea>
            </div>
          </div>
        </div>
        <div style="padding:16px 24px;border-top:1px solid var(--outline-variant);display:flex;gap:12px;justify-content:flex-end;background:var(--bg-surface-low);flex-shrink:0;border-bottom-left-radius:24px;border-bottom-right-radius:24px;">
          <button id="cancel-edit-member" style="padding:10px 20px;border-radius:12px;font-weight:700;font-size:14px;border:1px solid var(--outline-variant);color:var(--text-on-surface-variant);background:transparent;cursor:pointer;">Hủy</button>
          <button id="save-edit-member" style="padding:10px 24px;border-radius:12px;font-weight:700;font-size:14px;border:none;color:#fff;background:linear-gradient(135deg,#1D9336,#22c55e);cursor:pointer;display:flex;align-items:center;gap:8px;">
            <span class="material-symbols-outlined" style="font-size:18px;">save</span>Lưu thay đổi
          </button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    let memberAvatarFile = null;

    document.getElementById('me-avatar-container').addEventListener('click', () => {
      document.getElementById('me-avatar-input').click();
    });

    document.getElementById('me-avatar-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        window.GymApp.toast('Ảnh vượt quá 5MB!', 'error');
        return;
      }
      memberAvatarFile = file;
      const reader = new FileReader();
      reader.onload = (re) => {
        document.getElementById('me-avatar-preview').innerHTML = `<img src="${re.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('close-edit-member').addEventListener('click', close);
    document.getElementById('cancel-edit-member').addEventListener('click', close);

    document.getElementById('save-edit-member').addEventListener('click', async () => {
      const hoTen = document.getElementById('em-ho_ten').value.trim();
      if (!hoTen) { window.GymApp.toast('Họ tên không được để trống!', 'error'); return; }
      const btn = document.getElementById('save-edit-member');
      btn.disabled = true; btn.classList.add('opacity-50');
      try {
        if (memberAvatarFile) {
          const fd = new FormData();
          fd.append('avatar', memberAvatarFile);
          await window.GymApp.api.upload(`/members/${id}/avatar`, fd);
        }

        const res = await window.GymApp.api.put(`/members/${id}`, {
          ho_ten: hoTen,
          so_dien_thoai: document.getElementById('em-so_dien_thoai').value.trim() || null,
          email: document.getElementById('em-email').value.trim() || null,
          ngay_sinh: document.getElementById('em-ngay_sinh').value || null,
          gioi_tinh: document.getElementById('em-gioi_tinh').value || null,
          dia_chi_tam_tru: document.getElementById('em-dia_chi_tam_tru').value.trim() || null,
          cccd: document.getElementById('em-cccd').value.trim() || null,
          que_quan: document.getElementById('em-que_quan').value.trim() || null,
          chi_nhanh: document.getElementById('em-chi_nhanh').value || null,
          ghi_chu: document.getElementById('em-ghi_chu').value.trim() || null,
        });
        if (res?.success) {
          window.GymApp.toast('Đã cập nhật thông tin hội viên!', 'success');
          close(); await self._refreshMembersFromApi();
        } else {
          window.GymApp.toast(res?.message || 'Có lỗi xảy ra!', 'error');
          btn.disabled = false; btn.classList.remove('opacity-50');
        }
      } catch (err) {
        window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
        btn.disabled = false; btn.classList.remove('opacity-50');
      }
    });
  },

  _confirmDeleteMember: function (id, name) {
    const self = this;
    document.getElementById('gym-del-member-modal')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'gym-del-member-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);backdrop-filter:blur(6px);padding:16px;';
    overlay.innerHTML = `
      <div style="border-radius:24px;width:100%;max-width:440px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.2);" class="bg-surface-container-lowest">
        <div class="px-loose py-standard border-b border-outline-variant flex items-center gap-compact" style="background:linear-gradient(135deg,#991b1b,#dc2626);">
          <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-white text-xl" style="font-variation-settings:'FILL' 1">person_remove</span>
          </div>
          <h3 class="font-bold text-white text-[17px]">Xác nhận xóa hội viên</h3>
        </div>
        <div class="p-loose flex flex-col gap-standard bg-surface-container-lowest">
          <p class="text-on-surface text-body-md">Bạn có chắc chắn muốn xóa hội viên <strong class="text-error">${name}</strong> không?</p>
          <div class="flex items-start gap-xs bg-error/10 p-compact rounded-xl border border-error/20">
            <span class="material-symbols-outlined text-error text-[18px]">warning</span>
            <p class="text-error text-body-sm font-medium m-0">Hành động này sẽ xóa hồ sơ vĩnh viễn và không thể hoàn tác.</p>
          </div>
          <div class="flex gap-standard justify-end pt-xs">
            <button id="cancel-del-member" class="px-loose py-2.5 rounded-xl font-bold text-body-sm border-2 border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all active:scale-95">Hủy bỏ</button>
            <button id="confirm-del-member" class="bg-error text-white px-loose py-2.5 rounded-xl font-bold text-body-sm transition-all flex items-center gap-xs active:scale-95 shadow-md hover:shadow-lg hover:opacity-90">
              <span class="material-symbols-outlined text-sm">delete</span> Xóa hội viên
            </button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('cancel-del-member').addEventListener('click', close);
    document.getElementById('confirm-del-member').addEventListener('click', async () => {
      const btn = document.getElementById('confirm-del-member');
      btn.disabled = true; btn.classList.add('opacity-50');
      try {
        const res = await window.GymApp.api.delete(`/members/${id}`);
        if (res?.success) {
          window.GymApp.toast(`Đã xóa hội viên ${name}!`, 'success');
          close(); await self._refreshMembersFromApi();
        } else {
          window.GymApp.toast(res?.message || 'Có lỗi xảy ra!', 'error');
          btn.disabled = false; btn.classList.remove('opacity-50');
        }
      } catch (err) {
        window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
        btn.disabled = false; btn.classList.remove('opacity-50');
      }
    });
  },

  _switchTab: function (tab) {
    this._tab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle('bg-brand-primary', isActive);
      btn.classList.toggle('text-white', isActive);
      btn.classList.toggle('shadow-md', isActive);
      btn.classList.toggle('text-on-surface-variant', !isActive);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('hidden', content.id !== `tab-content-${tab}`);
    });

    // Toggle the header action buttons
    const addMemberBtn = document.getElementById('btn-add-member-header');
    const addPtBtn = document.getElementById('btn-add-pt-header');
    const reloadMemberBtn = document.getElementById('btn-members-reload');
    const reloadPtBtn = document.getElementById('btn-pts-reload');
    const exportMemberBtn = document.getElementById('btn-export-members');
    const exportPtBtn = document.getElementById('btn-export-pts');
    if (addMemberBtn && addPtBtn && reloadMemberBtn && reloadPtBtn && exportMemberBtn && exportPtBtn) {
      if (tab === 'members') {
        addMemberBtn.classList.remove('hidden');
        addPtBtn.classList.add('hidden');
        reloadMemberBtn.classList.remove('hidden');
        reloadMemberBtn.classList.add('flex');
        reloadPtBtn.classList.add('hidden');
        reloadPtBtn.classList.remove('flex');
        exportMemberBtn.classList.remove('hidden');
        exportMemberBtn.classList.add('flex');
        exportPtBtn.classList.add('hidden');
        exportPtBtn.classList.remove('flex');
      } else {
        addMemberBtn.classList.add('hidden');
        addPtBtn.classList.remove('hidden');
        reloadMemberBtn.classList.add('hidden');
        reloadMemberBtn.classList.remove('flex');
        reloadPtBtn.classList.remove('hidden');
        reloadPtBtn.classList.add('flex');
        exportMemberBtn.classList.add('hidden');
        exportMemberBtn.classList.remove('flex');
        exportPtBtn.classList.remove('hidden');
        exportPtBtn.classList.add('flex');
      }
    }
  },

  _showImportModal: function () {
    const self = this;
    self._loadXlsxLibrary();

    document.getElementById('gym-import-modal')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'gym-import-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);backdrop-filter:blur(6px);padding:16px;';

    overlay.innerHTML = `
      <div style="border-radius:24px;width:100%;max-width:540px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.2);background:var(--bg-surface-lowest);">
        
        <!-- Header -->
        <div style="padding:24px 24px 16px;flex-shrink:0;position:relative;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--outline-variant);border-top-left-radius:24px;border-top-right-radius:24px;">
          <div>
            <h3 style="font-size:18px;font-weight:800;color:var(--text-on-surface);margin:0 0 4px;">Nhập danh sách hội viên từ Excel</h3>
            <p style="font-size:13px;color:var(--text-on-surface-variant);margin:0;opacity:0.8;">Hỗ trợ file định dạng .xlsx, .xls, .csv</p>
          </div>
          <button id="close-import-modal" style="background:var(--bg-surface-variant);border:none;cursor:pointer;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;" class="hover:bg-outline-variant/30 transition-all">
            <span class="material-symbols-outlined" style="color:var(--text-on-surface);font-size:20px;">close</span>
          </button>
        </div>

        <!-- Body -->
        <div style="overflow-y:auto;flex:1;padding:24px;display:flex;flex-direction:column;gap:20px;" class="bg-surface-container-lowest">
          
          <!-- Tải file mẫu -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(2, 132, 199, 0.08);border:1px solid rgba(2, 132, 199, 0.2);border-radius:12px;">
            <div style="flex:1;">
              <h4 style="font-size:13px;font-weight:800;color:#0284c7;margin:0 0 2px;">Tải file Excel mẫu</h4>
              <p style="font-size:11px;color:#0369a1;margin:0;">Vui lòng điền thông tin hội viên theo đúng định dạng cột mẫu.</p>
            </div>
            <button id="btn-download-template" style="background:#0284c7;color:#fff;border:none;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;" class="hover:bg-[#0369a1] active:scale-95 transition-all">
              <span class="material-symbols-outlined" style="font-size:16px;">download</span> Tải mẫu
            </button>
          </div>

          <!-- Khu vực upload file Excel -->
          <div id="excel-drop-zone" style="border:2px dashed var(--outline-variant);border-radius:16px;padding:24px 20px;text-align:center;cursor:pointer;transition:all 0.2s;" class="hover:bg-brand-primary/5 hover:border-brand-primary group">
            <input type="file" id="excel-file-input" accept=".xlsx, .xls, .csv" style="display:none;" />
            <span class="material-symbols-outlined text-[40px] text-outline group-hover:text-brand-primary transition-colors" style="margin-bottom:6px;">cloud_upload</span>
            <p style="font-size:13px;font-weight:700;color:var(--text-on-surface);margin:0 0 2px;">Chọn hoặc kéo thả file Excel vào đây *</p>
            <p style="font-size:11px;color:var(--text-on-surface-variant);margin:0;opacity:0.6;">Dung lượng tối đa 10MB</p>
          </div>

          <!-- File Excel selected status -->
          <div id="excel-file-status" style="display:none;align-items:center;gap:12px;padding:12px;border:1px solid var(--outline-variant);border-radius:12px;background:var(--bg-surface-low);">
            <span class="material-symbols-outlined text-[28px] text-[#1D9336]">description</span>
            <div style="flex:1;min-width:0;">
              <p id="excel-file-name" style="font-size:13px;font-weight:700;color:var(--text-on-surface);margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></p>
              <p id="excel-file-size" style="font-size:11px;color:var(--text-on-surface-variant);margin:0;opacity:0.7;"></p>
            </div>
            <button id="btn-remove-file" style="background:transparent;border:none;cursor:pointer;color:var(--text-on-surface-variant);" class="hover:text-error">
              <span class="material-symbols-outlined" style="font-size:18px;">close</span>
            </button>
          </div>

          <!-- Khu vực upload file ZIP ảnh đại diện -->
          <div id="zip-drop-zone" style="border:2px dashed var(--outline-variant);border-radius:16px;padding:20px 20px;text-align:center;cursor:pointer;transition:all 0.2s;" class="hover:bg-brand-primary/5 hover:border-brand-primary group">
            <input type="file" id="zip-file-input" accept=".zip" style="display:none;" />
            <span class="material-symbols-outlined text-[36px] text-outline group-hover:text-brand-primary transition-colors" style="margin-bottom:4px;">folder_zip</span>
            <p style="font-size:13px;font-weight:700;color:var(--text-on-surface);margin:0 0 2px;">Chọn hoặc kéo thả file ZIP ảnh đại diện</p>
            <p style="font-size:11px;color:var(--text-on-surface-variant);margin:0;opacity:0.6;">(Không bắt buộc) Dung lượng tối đa 50MB</p>
          </div>

          <!-- File ZIP selected status -->
          <div id="zip-file-status" style="display:none;align-items:center;gap:12px;padding:12px;border:1px solid var(--outline-variant);border-radius:12px;background:var(--bg-surface-low);">
            <span class="material-symbols-outlined text-[28px] text-[#b45309]">folder_zip</span>
            <div style="flex:1;min-width:0;">
              <p id="zip-file-name" style="font-size:13px;font-weight:700;color:var(--text-on-surface);margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></p>
              <p id="zip-file-size" style="font-size:11px;color:var(--text-on-surface-variant);margin:0;opacity:0.7;"></p>
            </div>
            <button id="btn-remove-zip" style="background:transparent;border:none;cursor:pointer;color:var(--text-on-surface-variant);" class="hover:text-error">
              <span class="material-symbols-outlined" style="font-size:18px;">close</span>
            </button>
          </div>

          <!-- Kết quả Import -->
          <div id="import-result-area" style="display:none;flex-direction:column;gap:12px;">
            <div id="import-result-alert" style="padding:12px;border-radius:12px;display:flex;align-items:start;gap:8px;">
              <span class="material-symbols-outlined text-lg" id="import-result-icon">check_circle</span>
              <p style="font-size:13px;font-weight:700;margin:0;" id="import-result-msg"></p>
            </div>
            <div id="import-errors-container" style="display:none;flex-direction:column;gap:6px;">
              <p style="font-size:12px;font-weight:800;color:#ba1a1a;margin:0 0 2px;">Chi tiết lỗi từng dòng:</p>
              <div style="max-height:160px;overflow-y:auto;border:1px solid #fecaca;border-radius:8px;background:#fff5f5;">
                <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;">
                  <thead>
                    <tr style="background:#fee2e2;border-bottom:1px solid #fecaca;">
                      <th style="padding:6px 10px;font-weight:700;color:#991b1b;width:60px;text-align:center;">Dòng</th>
                      <th style="padding:6px 10px;font-weight:700;color:#991b1b;">Mô tả lỗi</th>
                    </tr>
                  </thead>
                  <tbody id="import-errors-tbody"></tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div style="padding:16px 24px;border-top:1px solid var(--outline-variant);display:flex;gap:12px;justify-content:flex-end;background:var(--bg-surface-low);flex-shrink:0;border-bottom-left-radius:24px;border-bottom-right-radius:24px;">
          <button id="btn-import-cancel" style="padding:10px 20px;border-radius:12px;font-weight:700;font-size:14px;border:1px solid var(--outline-variant);color:var(--text-on-surface-variant);background:transparent;cursor:pointer;" class="hover:bg-outline-variant/10 active:scale-95 transition-all">Đóng</button>
          <button id="btn-import-submit" style="padding:10px 24px;border-radius:12px;font-weight:700;font-size:14px;border:none;color:#fff;background:#1D9336;cursor:pointer;display:flex;align-items:center;gap:6px;" class="hover:opacity-90 active:scale-95 transition-all" disabled>
            <span class="material-symbols-outlined" style="font-size:18px;">cloud_upload</span> Bắt đầu nhập
          </button>
        </div>

      </div>
    `;

    document.body.appendChild(overlay);
    const close = () => overlay.remove();

    const fileInput = overlay.querySelector('#excel-file-input');
    const dropZone = overlay.querySelector('#excel-drop-zone');
    const fileStatus = overlay.querySelector('#excel-file-status');
    const fileName = overlay.querySelector('#excel-file-name');
    const fileSize = overlay.querySelector('#excel-file-size');
    const removeBtn = overlay.querySelector('#btn-remove-file');

    const zipFileInput = overlay.querySelector('#zip-file-input');
    const zipDropZone = overlay.querySelector('#zip-drop-zone');
    const zipFileStatus = overlay.querySelector('#zip-file-status');
    const zipFileName = overlay.querySelector('#zip-file-name');
    const zipFileSize = overlay.querySelector('#zip-file-size');
    const removeZipBtn = overlay.querySelector('#btn-remove-zip');

    const submitBtn = overlay.querySelector('#btn-import-submit');
    const cancelBtn = overlay.querySelector('#btn-import-cancel');
    const closeBtn = overlay.querySelector('#close-import-modal');

    let selectedFile = null;
    let selectedZipFile = null;

    overlay.querySelector('#btn-download-template').addEventListener('click', async () => {
      await self._loadXlsxLibrary();
      if (!window.XLSX) {
        return window.GymApp.toast('Không thể tải thư viện xuất Excel mẫu, vui lòng thử lại.', 'error');
      }
      self._downloadTemplate();
    });

    const updateFileDisplay = (file) => {
      if (file) {
        selectedFile = file;
        fileName.textContent = file.name;
        fileSize.textContent = (file.size / 1024).toFixed(1) + ' KB';
        dropZone.style.display = 'none';
        fileStatus.style.display = 'flex';
        submitBtn.disabled = false;
      } else {
        selectedFile = null;
        fileInput.value = '';
        dropZone.style.display = 'block';
        fileStatus.style.display = 'none';
        submitBtn.disabled = true;
        overlay.querySelector('#import-result-area').style.display = 'none';
      }
    };

    const updateZipFileDisplay = (file) => {
      if (file) {
        selectedZipFile = file;
        zipFileName.textContent = file.name;
        zipFileSize.textContent = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
        zipDropZone.style.display = 'none';
        zipFileStatus.style.display = 'flex';
      } else {
        selectedZipFile = null;
        zipFileInput.value = '';
        zipDropZone.style.display = 'block';
        zipFileStatus.style.display = 'none';
      }
    };

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) updateFileDisplay(e.target.files[0]);
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '#1D9336';
      dropZone.style.background = 'rgba(29, 147, 54, 0.05)';
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.style.borderColor = '';
      dropZone.style.background = '';
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '';
      dropZone.style.background = '';
      if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        if (['.xlsx', '.xls', '.csv'].includes(ext)) {
          updateFileDisplay(file);
        } else {
          window.GymApp.toast('Chỉ chấp nhận file Excel (.xlsx, .xls, .csv)', 'error');
        }
      }
    });

    removeBtn.addEventListener('click', () => updateFileDisplay(null));

    // Event listeners cho ZIP file
    zipDropZone.addEventListener('click', () => zipFileInput.click());

    zipFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) updateZipFileDisplay(e.target.files[0]);
    });

    zipDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zipDropZone.style.borderColor = '#b45309';
      zipDropZone.style.background = 'rgba(180, 83, 9, 0.05)';
    });

    zipDropZone.addEventListener('dragleave', () => {
      zipDropZone.style.borderColor = '';
      zipDropZone.style.background = '';
    });

    zipDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      zipDropZone.style.borderColor = '';
      zipDropZone.style.background = '';
      if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        if (ext === '.zip') {
          updateZipFileDisplay(file);
        } else {
          window.GymApp.toast('Chỉ chấp nhận file ZIP (.zip)', 'error');
        }
      }
    });

    removeZipBtn.addEventListener('click', () => updateZipFileDisplay(null));

    submitBtn.addEventListener('click', async () => {
      if (!selectedFile) return;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="animate-spin material-symbols-outlined" style="font-size:18px;">sync</span> Đang xử lý...';
      cancelBtn.disabled = true;

      const fd = new FormData();
      fd.append('file', selectedFile);
      if (selectedZipFile) {
        fd.append('zip', selectedZipFile);
      }

      try {
        const token = localStorage.getItem('gym-token');
        const fetchRes = await fetch('http://localhost:3000/api/members/import', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: fd,
        });

        const res = await fetchRes.json();

        const resultArea = overlay.querySelector('#import-result-area');
        const alertDiv = overlay.querySelector('#import-result-alert');
        const alertIcon = overlay.querySelector('#import-result-icon');
        const alertMsg = overlay.querySelector('#import-result-msg');
        const errContainer = overlay.querySelector('#import-errors-container');
        const errTbody = overlay.querySelector('#import-errors-tbody');

        resultArea.style.display = 'flex';
        errTbody.innerHTML = '';

        if (res.success) {
          const { successCount, failCount, errors } = res.data;

          alertMsg.innerHTML = `Đã nhập thành công <strong>${successCount}</strong> hội viên.<br/>Thất bại <strong>${failCount}</strong> dòng.`;

          if (failCount === 0) {
            alertDiv.style.background = '#f0fdf4';
            alertDiv.style.border = '1px solid #bbf7d0';
            alertDiv.style.color = '#166534';
            alertIcon.textContent = 'check_circle';
            errContainer.style.display = 'none';
            window.GymApp.toast(`Đã import thành công ${successCount} hội viên!`, 'success');

            setTimeout(async () => {
              await self._refreshMembersFromApi();
              close();
            }, 1500);
          } else {
            alertDiv.style.background = '#fffbeb';
            alertDiv.style.border = '1px solid #fef3c7';
            alertDiv.style.color = '#b45309';
            alertIcon.textContent = 'warning';

            errContainer.style.display = 'flex';
            errTbody.innerHTML = errors.map(e => `
              <tr style="border-bottom:1px solid #fecaca; background:#fff;">
                <td style="padding:6px 10px; font-weight:700; color:#ba1a1a; text-align:center;">${e.row}</td>
                <td style="padding:6px 10px; color:#7f1d1d;">${e.error}</td>
              </tr>
            `).join('');

            window.GymApp.toast(`Import hoàn thành với ${failCount} dòng lỗi.`, 'warning');
            await self._refreshMembersFromApi();
          }
        } else {
          alertDiv.style.background = '#fef2f2';
          alertDiv.style.border = '1px solid #fecaca';
          alertDiv.style.color = '#991b1b';
          alertIcon.textContent = 'error';
          alertMsg.textContent = res.message || 'Lỗi khi nhập file Excel.';
          errContainer.style.display = 'none';
          window.GymApp.toast(res.message || 'Import thất bại!', 'error');
        }
      } catch (err) {
        window.GymApp.toast('Lỗi kết nối máy chủ.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">cloud_upload</span> Bắt đầu nhập';
        cancelBtn.disabled = false;
      }
    });

    closeBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
  },

  _loadXlsxLibrary: function () {
    return new Promise((resolve) => {
      if (window.XLSX) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  },

  _downloadTemplate: function () {
    if (!window.XLSX) return;
    const headers = [['Họ và tên', 'Số điện thoại', 'Giới tính', 'Ngày sinh', 'Email', 'Địa chỉ', 'Ghi chú', 'Tên file ảnh']];
    const data = [
      ['Nguyễn Văn A', '0912345678', 'Nam', '1995-05-15', 'anguyen@gmail.com', '123 Đường ABC, Hà Nội', 'Hội viên đăng ký mới', 'anh_nguyen_van_a.jpg'],
      ['Trần Thị B', '0987654321', 'Nữ', '1998-10-20', 'btran@gmail.com', '456 Đường XYZ, TP.HCM', 'Khách hàng chuyển từ chi nhánh khác', 'anh_tran_thi_b.png']
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([...headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Hội Viên");
    XLSX.writeFile(workbook, "template-import-hoi-vien.xlsx");
  },

  _setupPgHandler: function () {
    const self = this;
    window.GymApp._pgHandler = function (page) {
      if (self._tab === 'members') {
        self._memberPage = page;
        self._refreshMemberTable();
        document.getElementById('members-table-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (self._tab === 'pts') {
        self._ptPage = page;
        self._refreshPtCards();
        document.getElementById('pt-cards-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
  },

  _showCancelPtRegistrationModal: function (contractId, ptName, memberName) {
    const self = this;
    document.getElementById('gym-sub-modal')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'gym-sub-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;align-items:center;justify-content:center;background:rgba(15, 23, 42, 0.45);backdrop-filter:blur(8px);padding:16px;';

    overlay.innerHTML = `
      <div class="modal-card bg-surface-container-lowest border border-outline-variant animate-in zoom-in-95 duration-200" style="border-radius:24px;width:100%;max-width:500px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 80px rgba(15,23,42,0.3);">
        
        <!-- Header -->
        <div class="border-b border-outline-variant px-loose py-standard flex items-center justify-between flex-shrink-0" style="padding:20px 24px;">
          <div>
            <h3 class="font-bold text-on-surface" style="font-size:18px;margin:0;display:flex;align-items:center;gap:8px;">
              <span class="material-symbols-outlined" style="color:#ba1a1a;font-size:24px;">cancel</span>
              Xác nhận hủy hợp đồng PT
            </h3>
            <p class="text-on-surface-variant text-body-sm" style="margin:4px 0 0 0;font-size:13px;">
              Hội viên: <strong style="color:var(--text-on-surface);">${memberName}</strong>
            </p>
          </div>
          <button id="close-cancel-modal" style="background:transparent;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:4px;border-radius:50%;" class="hover:bg-surface-container transition-colors">
            <span class="material-symbols-outlined text-on-surface-variant" style="font-size:20px;">close</span>
          </button>
        </div>
        
        <!-- Body -->
        <div class="p-loose flex-grow" style="padding:24px;box-sizing:border-box;">
          
          <!-- Danger Banner -->
          <div style="background:#fef2f2;border:1px solid #fee2e2;border-radius:16px;padding:14px 18px;display:flex;gap:12px;align-items:flex-start;margin-bottom:20px;">
            <span class="material-symbols-outlined" style="color:#ef4444;font-size:24px;flex-shrink:0;margin-top:2px;">warning</span>
            <div>
              <h5 style="margin:0;font-weight:700;font-size:14px;color:#991b1b;">Thông tin cảnh báo</h5>
              <p style="margin:4px 0 0 0;font-size:13px;color:#b91c1c;line-height:1.5;">
                Bạn đang thực hiện hủy hợp đồng PT của HLV <strong style="font-weight:800;">${ptName || 'này'}</strong>. 
                Tất cả các lịch tập sắp tới ở trạng thái <strong>"Chờ tập"</strong> sẽ bị hủy tự động. Hành động này không thể hoàn tác.
              </p>
            </div>
          </div>
          
          <!-- Input Reason -->
          <div style="margin-bottom:8px;">
            <label for="cancel-pt-reason" class="block text-body-sm font-bold text-on-surface" style="margin-bottom:8px;font-size:13px;display:block;">
              Lý do hủy hợp đồng <span style="color:#ba1a1a;font-weight:700;">*</span>
            </label>
            <input id="cancel-pt-reason" type="text" value="Hội viên yêu cầu hủy" 
              class="bg-surface-container-lowest text-on-surface border border-outline-variant focus:border-primary" 
              style="width:100%;padding:12px 14px;border-radius:12px;outline:none;font-size:14px;box-sizing:border-box;border:1px solid var(--outline-variant);transition:border-color 0.2s;" 
              placeholder="Nhập lý do hủy hợp đồng..." />
          </div>
          
        </div>
        
        <!-- Footer -->
        <div class="border-t border-outline-variant px-loose py-standard bg-surface-container-lowest flex gap-standard flex-shrink-0" style="padding:16px 24px;display:flex;gap:12px;">
          <button id="btn-close-cancel-modal" class="flex-grow py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md" style="padding:10px 16px;border-radius:12px;border:1px solid var(--outline-variant);background:transparent;cursor:pointer;font-weight:700;flex:1;">
            Đóng
          </button>
          <button id="btn-submit-cancel-modal" class="flex-grow py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90 flex items-center justify-center gap-xs" style="padding:10px 16px;border-radius:12px;background:#ba1a1a;border:none;cursor:pointer;font-weight:700;flex:1;color:#fff;">
            Xác nhận hủy
          </button>
        </div>
        
      </div>
    `;

    document.body.appendChild(overlay);

    // Bind modal close events
    const close = () => overlay.remove();
    overlay.querySelector('#close-cancel-modal').addEventListener('click', close);
    overlay.querySelector('#btn-close-cancel-modal').addEventListener('click', close);

    // Auto-focus and select text for quick editing
    const reasonInput = overlay.querySelector('#cancel-pt-reason');
    setTimeout(() => {
      reasonInput.focus();
      reasonInput.select();
    }, 100);

    // Submit cancel event
    overlay.querySelector('#btn-submit-cancel-modal').addEventListener('click', async () => {
      const reason = reasonInput.value.trim();
      if (!reason) {
        window.GymApp.toast('Vui lòng nhập lý do hủy!', 'error');
        reasonInput.focus();
        return;
      }

      close();

      self._showLoadingOverlay('Đang hủy hợp đồng PT...');
      try {
        const res = await window.GymApp.api.put(`/pt/registrations/${contractId}/cancel`, { ly_do: reason });
        self._hideLoadingOverlay();
        if (res?.success) {
          window.GymApp.toast('Đã hủy hợp đồng PT thành công!', 'success');
          // Tự động tải lại tab Lịch PT để cập nhật giao diện
          const memberModal = document.getElementById('gym-member-modal');
          if (memberModal && typeof memberModal.refreshAndSetTab === 'function') {
            memberModal.refreshAndSetTab('schedule');
          } else {
            location.reload();
          }
        } else {
          window.GymApp.toast(res?.message || 'Hủy hợp đồng thất bại!', 'error');
        }
      } catch (err) {
        self._hideLoadingOverlay();
        window.GymApp.toast(err.message || 'Lỗi khi hủy hợp đồng PT.', 'error');
      }
    });
  },

  _setupGlobalClickHandlers: function () {
    // Đã loại bỏ để tránh chồng chéo với modal hủy ở tab-specific events
  },

  _showLoadingOverlay: function (msg = 'Đang xử lý...') {
    let overlay = document.getElementById('global-loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'global-loading-overlay';
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.zIndex = '99999';
      overlay.style.background = 'rgba(15, 23, 42, 0.4)';
      overlay.style.backdropFilter = 'blur(6px)';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.gap = '16px';
      overlay.style.color = '#fff';
      overlay.style.fontFamily = 'Inter, sans-serif';
      overlay.style.transition = 'opacity 0.25s ease';

      overlay.innerHTML = `
        <div style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); padding: 24px 40px; border-radius: 20px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3); display: flex; flex-direction: column; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border: 4px solid rgba(255, 255, 255, 0.1); border-top-color: #22c55e; border-radius: 50%; animation: spin-loading-overlay 0.8s linear infinite;"></div>
          <span id="global-loading-msg" style="font-weight: 700; font-size: 15px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${msg}</span>
        </div>
        <style>
          @keyframes spin-loading-overlay {
            to { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(overlay);
    } else {
      document.getElementById('global-loading-msg').innerText = msg;
      overlay.style.display = 'flex';
      overlay.style.opacity = '1';
    }
  },

  _hideLoadingOverlay: function () {
    const overlay = document.getElementById('global-loading-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  },

  init: async function () {
    const self = this;
    this._memberPage = 1;
    this._ptPage = 1;
    this._filterState.chi_nhanh = window.GymApp.selectedBranch || ''; // Gán chi nhánh chung khi khởi tạo

    // Đồng bộ lại dữ liệu từ API khi load trang
    try {
      if (window.GymApp.fetchInitialData) {
        await window.GymApp.fetchInitialData();
      }
    } catch (_) { }

    const branch = window.GymApp.selectedBranch || '';
    this._memberFiltered = [...(window.GymApp.data.members || [])];
    this._ptFiltered = (window.GymApp.data.pts || []).filter(pt => !branch || pt.chi_nhanh === branch);
    this._setupPgHandler();
    this._setupGlobalClickHandlers();
    this._bindMemberTableEvents();
    this._bindPtCardEvents();
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => self._switchTab(btn.dataset.tab));
    });
    this._fetchMembersData(1, false);
    this._refreshPtCards();
    self._switchTab(self._tab);

    let searchTimeout = null;
    document.getElementById('member-search')?.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        self._memberPage = 1;
        self._fetchMembersData(1, false);
      }, 300);
    });
    document.getElementById('pt-search')?.addEventListener('input', () => self._applyPtFilter());

    document.getElementById('btn-view-all-members')?.addEventListener('click', () => {
      self._filterState = { status: '', pkg: '', gender: '', hasPt: '', checkinToday: '', chi_nhanh: '' };
      const s = document.getElementById('member-search'); if (s) s.value = '';
      self._memberPage = 1;
      self._fetchMembersData(1, false);
      self._updateFilterUI();
      window.GymApp.toast(`Đã tải lại danh sách hội viên`, 'info');
    });

    document.getElementById('btn-show-all')?.addEventListener('click', () => {
      self._filterState = { status: '', pkg: '', gender: '', hasPt: '', checkinToday: '', chi_nhanh: '' };
      self._memberSortState = ''; // Reset sort
      const s = document.getElementById('member-search'); if (s) s.value = '';
      self._memberPage = 1;
      self._fetchMembersData(1, false);
      self._updateFilterUI();
      self._updateMemberSortUI();
    });

    document.getElementById('btn-sort-member')?.addEventListener('click', () => self._showMemberSortModal());

    document.getElementById('btn-filter')?.addEventListener('click', () => self._showFilterModal());

    document.getElementById('btn-view-all-pts')?.addEventListener('click', () => {
      self._ptFilterState = { specialty: '', status: '' };
      self._ptSortState = '';
      const s = document.getElementById('pt-search'); if (s) s.value = '';
      self._applyPtFilter();
      window.GymApp.toast(`Đã đặt lại bộ lọc huấn luyện viên`, 'info');
    });

    document.getElementById('btn-show-all-pt')?.addEventListener('click', () => {
      // FIX: Reset cả sort state khi xóa lọc
      self._ptFilterState = { specialty: '', status: '' };
      self._ptSortState = '';
      const s = document.getElementById('pt-search'); if (s) s.value = '';
      self._applyPtFilter();
    });

    document.getElementById('btn-filter-pt')?.addEventListener('click', () => self._showPtFilterModal());
    document.getElementById('btn-sort-pt')?.addEventListener('click', () => self._showPtSortModal());

    document.getElementById('btn-members-reload')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-members-reload');
      const icon = btn?.querySelector('.material-symbols-outlined');
      if (icon) icon.classList.add('animate-spin');
      if (btn) {
        btn.disabled = true;
        btn.classList.add('pointer-events-none', 'opacity-50');
      }
      try {
        await self._refreshMembersFromApi();
        window.GymApp.toast('Đã cập nhật danh sách hội viên!', 'success');
      } catch (e) {
        window.GymApp.toast('Không thể tải lại danh sách hội viên!', 'error');
      } finally {
        if (icon) icon.classList.remove('animate-spin');
        if (btn) {
          btn.disabled = false;
          btn.classList.remove('pointer-events-none', 'opacity-50');
        }
      }
    });

    document.getElementById('btn-pts-reload')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-pts-reload');
      const icon = btn?.querySelector('.material-symbols-outlined');
      if (icon) icon.classList.add('animate-spin');
      if (btn) {
        btn.disabled = true;
        btn.classList.add('pointer-events-none', 'opacity-50');
      }
      try {
        await self._refreshPtsFromApi();
        window.GymApp.toast('Đã cập nhật danh sách huấn luyện viên!', 'success');
      } catch (e) {
        window.GymApp.toast('Không thể tải lại danh sách huấn luyện viên!', 'error');
      } finally {
        if (icon) icon.classList.remove('animate-spin');
        if (btn) {
          btn.disabled = false;
          btn.classList.remove('pointer-events-none', 'opacity-50');
        }
      }
    });

    document.getElementById('btn-import-members')?.addEventListener('click', () => self._showImportModal());

    document.getElementById('btn-export-members')?.addEventListener('click', async () => {
      window.GymApp.toast('Đang xuất danh sách hội viên...', 'info');
      const q = document.getElementById('member-search')?.value || '';
      const branch = window.GymApp.selectedBranch || '';
      const ok = await window.GymApp.api.download('/export/members?loai_ho_so=hoi_vien&search=' + encodeURIComponent(q) + '&chi_nhanh=' + encodeURIComponent(branch), 'danh-sach-hoi-vien.xlsx');
      if (ok) window.GymApp.toast('Đã tải xuống file Excel hội viên!', 'success');
    });

    document.getElementById('btn-export-pts')?.addEventListener('click', async () => {
      window.GymApp.toast('Đang xuất danh sách huấn luyện viên...', 'info');
      const q = document.getElementById('pt-search')?.value || '';
      const branch = window.GymApp.selectedBranch || '';
      const ok = await window.GymApp.api.download('/export/members?loai_ho_so=pt&search=' + encodeURIComponent(q) + '&chi_nhanh=' + encodeURIComponent(branch), 'danh-sach-pt.xlsx');
      if (ok) window.GymApp.toast('Đã tải xuống file Excel PT!', 'success');
    });

    document.getElementById('btn-add-pt-header')?.addEventListener('click', () => {
      window.GymApp.navigate('member-add');
      setTimeout(() => {
        const typeSelect = document.getElementById('reg-loai-ho-so');
        if (typeSelect) {
          typeSelect.value = 'pt';
          typeSelect.dispatchEvent(new Event('change'));
        }
      }, 100);
    });

    self._updatePtSortUI();
    self._updateMemberSortUI();
  },

  guideHtml: `
    <div class="space-y-4 text-xs">
      <div class="flex items-start gap-2 bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/10">
        <span class="material-symbols-outlined text-brand-primary text-base flex-shrink-0 mt-0.5">info</span>
        <p class="text-on-surface-variant leading-relaxed">Trang <strong>Danh sách hội viên</strong> quản lý thông tin tài khoản, hồ sơ hội viên và huấn luyện viên (HLV/PT) của phòng tập.</p>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">Quản lý Hội viên:</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li><strong>Tìm kiếm & Lọc:</strong> Tìm hội viên theo tên, SĐT hoặc mã số. Lọc theo trạng thái gói (Còn hạn, Hết hạn...), giới tính, hoặc xem ai đã check-in hôm nay.</li>
          <li><strong>Nhập Excel & Tải ảnh (.zip):</strong> Bấm nút <strong>Nhập Excel</strong> để tải lên danh sách hội viên hàng loạt từ tệp Excel mẫu (hệ thống tự động sinh và cho tải template có dữ liệu mẫu). Bạn cũng có thể tải lên tệp zip chứa các hình ảnh avatar đặt tên theo Số điện thoại của hội viên để tự động khớp ảnh đại diện.</li>
          <li><strong>Xuất Excel:</strong> Tải xuống toàn bộ danh sách hội viên hoặc danh sách đã lọc tìm kiếm dưới dạng file CSV/Excel bằng nút <strong>Xuất Excel</strong>.</li>
          <li><strong>Xem chi tiết:</strong> Click vào nút Xem (mắt xanh) để xem thông tin cá nhân, lịch sử tập luyện, các gói tập đã mua và lịch đăng ký PT của hội viên.</li>
          <li><strong>Thao tác nhanh:</strong> Lập phiếu gia hạn gói, đổi gói, hủy gói tập hoặc gán PT trực tiếp trong màn hình chi tiết hội viên.</li>
        </ul>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">Quản lý Huấn luyện viên (PT):</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li>Chuyển sang tab <strong>Huấn luyện viên</strong> để quản lý danh sách PT.</li>
          <li>Xem thông tin chuyên môn, chi nhánh, số lượng hội viên đang phụ trách và tổng số buổi dạy thực tế của từng PT. Hỗ trợ <strong>Xuất Excel</strong> danh sách PT.</li>
          <li>Thêm mới HLV bằng nút <strong>Thêm HLV</strong> ở góc trên bên phải khi đang chọn tab HLV.</li>
        </ul>
      </div>
    </div>
  `
};
