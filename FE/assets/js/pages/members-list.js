window.GymApp.pages['members-list'] = {
  _tab: 'members',
  _memberPage: 1, _memberFiltered: [],
  _ptPage: 1, _ptFiltered: [],
  _perPage: 10,
  _filterState: { status: '', pkg: '', gender: '', hasPt: '', checkinToday: '' },
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
      <div class="flex flex-col gap-margin animate-in fade-in duration-500">

        <!-- Action Bar -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-standard">
          <div>
            <h2 class="font-display-lg text-display-lg text-on-surface font-bold tracking-tight">Danh sách hội viên</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs">Quản lý toàn bộ hội viên và huấn luyện viên trong hệ thống</p>
          </div>
          <button class="bg-brand-primary text-white px-loose py-compact rounded-2xl font-bold hover:bg-[#187a2d] transition-all flex items-center gap-compact shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0" data-page="member-add">
            <span class="material-symbols-outlined text-lg">person_add</span>
            Thêm hội viên mới
          </button>
        </div>

        <!-- Tab Bar -->
        <div class="flex gap-atom bg-surface-container-low/60 backdrop-blur-sm p-1 rounded-2xl border border-outline-variant w-fit shadow-sm">
          <button id="tab-members" class="tab-btn px-loose py-compact rounded-xl font-bold text-body-md transition-all duration-300" data-tab="members">
            <span class="flex items-center gap-compact">
              <span class="material-symbols-outlined text-lg">people</span>Hội viên
            </span>
          </button>
          <button id="tab-pts" class="tab-btn px-loose py-compact rounded-xl font-bold text-body-md transition-all duration-300" data-tab="pts">
            <span class="flex items-center gap-compact">
              <span class="material-symbols-outlined text-lg">sports_gymnastics</span>Huấn luyện viên (PT)
            </span>
          </button>
        </div>

        <!-- Tab Content Wrapper -->
        <div class="relative min-h-[400px]">
          
          <!-- Tab: Hội viên -->
          <div id="tab-content-members" class="tab-content animate-in slide-in-from-left-4 duration-300">
            <div class="flex flex-wrap items-center gap-standard bg-surface-container-lowest/80 backdrop-blur-md p-standard rounded-2xl border border-outline-variant shadow-sm mb-standard transition-all hover:shadow-md">
              <div class="relative flex-1 group" style="min-width:240px;">
                <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors">search</span>
                <input id="member-search" class="w-full bg-surface-container/40 border border-outline-variant text-on-surface pl-10 pr-standard py-compact rounded-xl focus:border-brand-primary focus:bg-surface-container-lowest outline-none placeholder-outline-variant font-body-md text-body-md transition-all" placeholder="Tìm theo tên, mã HV, số điện thoại..." type="text" />
              </div>
              <div class="flex items-center gap-compact">
                <button id="btn-view-all-members" class="flex items-center gap-xs px-standard py-compact rounded-xl border border-outline-variant text-on-surface-variant text-body-sm font-bold flex-shrink-0 hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all">
                  <span class="material-symbols-outlined text-sm">format_list_bulleted</span>Xem tất cả
                </button>
                <button id="btn-show-all" class="hidden items-center gap-xs px-standard py-compact rounded-xl border border-error/30 text-error text-body-sm font-bold flex-shrink-0 hover:bg-error/5 transition-all">
                  <span class="material-symbols-outlined text-sm">filter_alt_off</span>Xóa lọc
                </button>
                <button id="btn-filter" class="relative flex items-center gap-xs px-standard py-compact rounded-xl border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all flex-shrink-0">
                  <span class="material-symbols-outlined text-sm">filter_alt</span>
                  <span class="text-body-sm font-bold">Lọc dữ liệu</span>
                  <span id="filter-badge" style="display:none;position:absolute;top:-6px;right:-6px;width:20px;height:20px;background:#1D9336;color:#fff;border-radius:50%;font-size:10px;align-items:center;justify-content:center;font-weight:700;box-shadow:0 2px 4px rgba(29,147,54,0.3)"></span>
                </button>
              </div>
            </div>
            <div id="members-table-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-loose">
              ${this._renderMemberTable()}
            </div>
          </div>

          <!-- Tab: PT / HLV -->
          <div id="tab-content-pts" class="tab-content hidden animate-in slide-in-from-right-4 duration-300">
            <div class="flex flex-wrap items-center gap-standard bg-surface-container-lowest/80 backdrop-blur-md p-standard rounded-2xl border border-outline-variant shadow-sm mb-standard transition-all hover:shadow-md">
              <div class="relative flex-1 group" style="min-width:240px;">
                <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors">search</span>
                <input id="pt-search" class="w-full bg-surface-container/40 border border-outline-variant text-on-surface pl-10 pr-standard py-compact rounded-xl focus:border-brand-primary focus:bg-surface-container-lowest outline-none placeholder-outline-variant font-body-md text-body-md transition-all" placeholder="Tìm theo tên, chuyên môn..." type="text" />
              </div>
              <div class="flex items-center gap-compact">
                <button id="btn-view-all-pts" class="flex items-center gap-xs px-standard py-compact rounded-xl border border-outline-variant text-on-surface-variant text-body-sm font-bold flex-shrink-0 hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all">
                  <span class="material-symbols-outlined text-sm">format_list_bulleted</span>Xem tất cả
                </button>
                <button id="btn-show-all-pt" class="hidden items-center gap-xs px-standard py-compact rounded-xl border border-error/30 text-error text-body-sm font-bold flex-shrink-0 hover:bg-error/5 transition-all">
                  <span class="material-symbols-outlined text-sm">filter_alt_off</span>Xóa lọc
                </button>
                <button id="btn-filter-pt" class="relative flex items-center gap-xs px-standard py-compact rounded-xl border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all flex-shrink-0">
                  <span class="material-symbols-outlined text-sm">filter_alt</span>
                  <span class="text-body-sm font-bold">Lọc</span>
                  <span id="pt-filter-badge" style="display:none;position:absolute;top:-6px;right:-6px;width:20px;height:20px;background:#1D9336;color:#fff;border-radius:50%;font-size:10px;align-items:center;justify-content:center;font-weight:700;box-shadow:0 2px 4px rgba(29,147,54,0.3)"></span>
                </button>
                <button id="btn-sort-pt" class="relative flex items-center gap-xs px-standard py-compact rounded-xl border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all flex-shrink-0">
                  <span class="material-symbols-outlined text-sm">sort</span>
                  <span class="text-body-sm font-bold">Sắp xếp</span>
                  <span id="pt-sort-badge" style="display:none;position:absolute;top:-6px;right:-6px;width:20px;height:20px;background:#1D9336;color:#fff;border-radius:50%;font-size:10px;align-items:center;justify-content:center;font-weight:700;box-shadow:0 2px 4px rgba(29,147,54,0.3)">1</span>
                </button>
              </div>
            </div>
            <div id="pt-cards-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-loose">
              ${this._renderPtCards()}
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-loose mt-standard">
          ${(function () {
        const stats = window.GymApp.data.stats?.hoi_vien || { tong: 0, con_han: 0, het_han: 0 };
        return [
          { label: 'Tổng số hội viên', value: stats.tong, color: 'text-on-surface', icon: 'groups', bg: 'bg-surface-container' },
          { label: 'Đang hoạt động', value: stats.con_han, color: 'text-brand-primary', icon: 'check_circle', bg: 'bg-brand-primary/10' },
          { label: 'Đã hết hạn', value: stats.het_han, color: 'text-error', icon: 'error', bg: 'bg-error/10' },
        ].map(s => `
                <div class="bg-surface-container-lowest/80 backdrop-blur-md p-loose rounded-2xl border border-outline-variant shadow-sm flex items-center gap-loose transition-all hover:-translate-y-1 hover:shadow-md group">
                  <div class="w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined ${s.color} text-2xl">${s.icon}</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-on-surface-variant font-body-sm text-body-sm uppercase tracking-wider font-bold">${s.label}</span>
                    <span class="${s.color} font-display-2xl text-display-2xl font-bold tracking-tight">${s.value}</span>
                  </div>
                </div>
              `).join('');
      })()
      }
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

  _refreshMembersFromApi: async function () {
    const membersRes = await window.GymApp.api.get('/members?limit=100');
    window.GymApp.data.members = this._normalizeListResponse(membersRes);
    this._memberFiltered = [...window.GymApp.data.members];
    this._refreshMemberTable();
  },

  _renderMemberTable: function () {
    const self = this;
    const start = (self._memberPage - 1) * self._perPage;
    const paginated = self._memberFiltered.slice(start, start + self._perPage);

    if (paginated.length === 0) {
      return `
        <div class="col-span-full py-20 text-center text-on-surface-variant bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border border-outline-variant shadow-sm">
           <div class="flex flex-col items-center opacity-40">
             <span class="material-symbols-outlined text-6xl mb-xs">person_search</span>
             <p class="font-medium">Không tìm thấy hội viên nào</p>
           </div>
        </div>`;
    }

    const cards = paginated.map(m => {
      const isActive = m.trang_thai === 'active' || m.trang_thai === 'dang_tap';
      const isCheckedIn = m.da_check_in_hom_nay == 1;
      const packageName = m.ten_goi_tap || 'Chưa ĐK';
      return `
        <div class="gym-card bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border border-outline-variant p-loose shadow-sm flex flex-col gap-standard transition-all hover:-translate-y-1 hover:shadow-xl hover:border-brand-primary/50 group min-w-0">
          <div class="flex items-center gap-loose min-w-0">
            <div class="relative group-hover:scale-110 transition-transform duration-500 flex-shrink-0">
              ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'lg')}
              <span class="absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${isCheckedIn ? 'bg-green-500 shadow-sm shadow-green-200' : 'bg-outline'}"></span>
            </div>
            <div class="flex flex-col min-w-0">
              <button class="member-name-link text-left font-bold text-on-surface text-body-md truncate group-hover:text-brand-primary transition-colors cursor-pointer" data-id="${m.id}" title="${m.ho_ten || 'Không rõ'}" style="background:transparent;border:none;padding:0;">
                ${m.ho_ten || 'Không rõ'}
              </button>
              <p class="text-on-surface-variant text-body-sm font-medium flex items-center gap-xs min-w-0">
                <span class="material-symbols-outlined text-xs flex-shrink-0">call</span>
                <span class="truncate">${m.so_dien_thoai || '—'}</span>
              </p>
            </div>
          </div>

          <div class="h-px bg-outline-variant/30 w-full my-xs"></div>

          <div class="grid grid-cols-2 gap-compact min-w-0">
            <div class="flex flex-col bg-surface-container-low/50 p-compact rounded-xl border border-outline-variant/20 min-w-0">
              <span class="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest opacity-60">Mã HV</span>
              <span class="text-on-surface font-bold text-body-sm truncate" title="${m.ma_ho_so || '—'}">${m.ma_ho_so || '—'}</span>
            </div>
            <div class="flex flex-col bg-surface-container-low/50 p-compact rounded-xl border border-outline-variant/20 min-w-0">
              <span class="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest opacity-60">Trạng thái</span>
              <span class="mt-xs">${window.GymApp.statusBadge(m.trang_thai)}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-compact min-w-0">
            <div class="flex flex-col bg-surface-container-low/50 p-compact rounded-xl border border-outline-variant/20 min-w-0">
              <span class="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest opacity-60">Gói tập</span>
              <span class="text-on-surface font-bold text-body-sm truncate" title="${packageName}">${packageName}</span>
            </div>
            <div class="flex flex-col bg-surface-container-low/50 p-compact rounded-xl border border-outline-variant/20 min-w-0">
              <span class="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest opacity-60">Hết hạn</span>
              <span class="text-on-surface font-bold text-body-sm truncate">${window.GymApp.formatDate(m.ngay_het_han)}</span>
            </div>
          </div>

          <div class="flex items-center justify-between gap-compact mt-auto pt-xs min-w-0">
            <div class="flex items-center gap-xs text-on-surface-variant text-body-sm font-medium min-w-0">
              <span class="material-symbols-outlined text-sm flex-shrink-0">location_on</span>
              <span class="truncate">Paradise Gym</span>
            </div>
            <div class="flex gap-xs flex-shrink-0">
              <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container text-on-surface-variant hover:bg-brand-primary hover:text-white transition-all member-view-btn" data-id="${m.id}" title="Xem chi tiết">
                <span class="material-symbols-outlined text-lg">visibility</span>
              </button>
              <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container text-on-surface-variant hover:bg-brand-primary hover:text-white transition-all member-edit-btn" data-id="${m.id}" title="Chỉnh sửa">
                <span class="material-symbols-outlined text-lg">edit</span>
              </button>
              <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container text-on-surface-variant hover:bg-error hover:text-white transition-all member-delete-btn" data-id="${m.id}" data-name="${m.ho_ten || 'hội viên này'}" title="Xóa">
                <span class="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      ${cards}
      <div class="col-span-full mt-loose">
        ${window.GymApp.renderPagination(self._memberPage, self._memberFiltered.length, self._perPage)}
      </div>
    `;
  },

  _renderPtCards: function () {
    const self = this;
    const start = (self._ptPage - 1) * self._perPage;
    const paginated = self._ptFiltered.slice(start, start + self._perPage);

    if (paginated.length === 0) {
      return `
        <div class="col-span-full py-20 text-center text-on-surface-variant bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border border-outline-variant shadow-sm">
           <div class="flex flex-col items-center opacity-40">
             <span class="material-symbols-outlined text-6xl mb-xs">sports_gymnastics</span>
             <p class="font-medium">Không tìm thấy huấn luyện viên nào</p>
           </div>
        </div>`;
    }

    const cards = paginated.map(pt => `
      <div class="gym-card bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border border-outline-variant p-loose shadow-sm flex flex-col gap-standard transition-all hover:-translate-y-1 hover:shadow-xl hover:border-brand-primary/50 group pt-view-btn cursor-pointer" data-id="${pt.id}">
        <div class="flex items-center gap-loose">
          <div class="relative group-hover:scale-110 transition-transform duration-500">
            ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten, 'lg')}
            <span class="absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full bg-green-500 shadow-sm shadow-green-200"></span>
          </div>
          <div class="flex flex-col min-w-0">
            <h4 class="font-bold text-on-surface text-body-md truncate group-hover:text-brand-primary transition-colors">${pt.ho_ten}</h4>
            <p class="text-on-surface-variant text-body-sm font-medium tracking-tight">${pt.ma_ho_so}</p>
          </div>
        </div>

        <div class="h-px bg-outline-variant/30 w-full my-xs"></div>

        <div class="grid grid-cols-2 gap-compact">
          <div class="flex flex-col bg-surface-container-low/50 p-compact rounded-xl border border-outline-variant/20">
            <span class="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest opacity-60">Chuyên môn</span>
            <span class="text-on-surface font-bold text-body-sm truncate">${pt.chuyen_mon || pt.specialty || 'HLV'}</span>
          </div>
          <div class="flex flex-col bg-surface-container-low/50 p-compact rounded-xl border border-outline-variant/20">
            <span class="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest opacity-60">Kinh nghiệm</span>
            <span class="text-on-surface font-bold text-body-sm">${pt.kinh_nghiem || 0} năm</span>
          </div>
        </div>

        <div class="flex items-center justify-between mt-xs">
          <div class="flex items-center gap-xs bg-brand-primary/10 px-compact py-xs rounded-lg border border-brand-primary/20">
            <span class="material-symbols-outlined text-sm text-brand-primary" style="font-variation-settings:'FILL' 1">star</span>
            <span class="font-bold text-body-sm text-brand-primary">4.8</span>
          </div>
          <div class="flex gap-xs">
            <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container text-on-surface-variant hover:bg-brand-primary hover:text-white transition-all pt-view-btn" data-id="${pt.id}">
              <span class="material-symbols-outlined text-lg">visibility</span>
            </button>
            <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container text-on-surface-variant hover:bg-brand-primary hover:text-white transition-all pt-edit-btn" data-id="${pt.id}">
              <span class="material-symbols-outlined text-lg">edit</span>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    return `
      ${cards}
      <div class="col-span-full mt-loose">
        ${window.GymApp.renderPagination(self._ptPage, self._ptFiltered.length, self._perPage)}
      </div>
    `;
  },

  // ===== MODAL CHI TIẾT HỘI VIÊN (3 TAB) =====
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
      pkgHistory = Array.isArray(historyRes.data) ? historyRes.data : [];
      memberSchedules = Array.isArray(schedRes.data) ? schedRes.data : [];
    };

    try {
      await _fetchModalData();
    } catch (err) {
      console.error('Failed to fetch member details:', err);
      m = (window.GymApp.data.members || []).find(x => (x.id || x.ho_so_id) == id);
    }
    if (!m) return;
    document.getElementById('gym-member-modal')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'gym-member-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);padding:16px;';

    // Tính toán thông tin quick stats
    const isActive = m.trang_thai === 'con_han' || m.trang_thai === 'sap_het_han' || m.trang_thai === 'active' || m.trang_thai === 'dang_tap';
    const isCheckedIn = m.da_check_in_hom_nay == 1;
    const activePkg = m.goi_tap_hien_tai && m.goi_tap_hien_tai.length > 0 ? m.goi_tap_hien_tai[0] : null;
    const pkgName = activePkg ? (activePkg.ten_goi || activePkg.ten_goi_tap) : (m.ten_goi_tap || 'Chưa đăng ký');
    const hetHanVal = activePkg ? activePkg.den_ngay : m.ngay_het_han;
    const expDate = hetHanVal ? window.GymApp.formatDate(hetHanVal) : '—';
    const genderLabel = m.gioi_tinh === 'nam' || m.gioi_tinh === 'male' ? 'Nam' : m.gioi_tinh === 'nu' || m.gioi_tinh === 'female' ? 'Nữ' : (m.gioi_tinh || '—');

    let statusText = '○ Hết hạn';
    if (isActive) statusText = '● Đang hoạt động';
    else if (m.trang_thai === 'chua_dang_ky') statusText = '○ Chưa đăng ký';

    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:20px;width:100%;max-width:780px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;position:relative;box-shadow:0 32px 80px rgba(0,0,0,0.35);">

        <!-- Banner Header với gradient -->
        <div style="background:linear-gradient(135deg,#1a5e2a 0%,#1D9336 60%,#22c55e 100%);padding:20px 24px 0;flex-shrink:0;position:relative;overflow:hidden;">
          <!-- Decorative circles -->
          <div style="position:absolute;top:-30px;right:-30px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.07);"></div>
          <div style="position:absolute;top:20px;right:60px;width:70px;height:70px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>

          <!-- Nút đóng -->
          <button id="close-member-modal" style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,0.15);border:none;cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'" title="Đóng">
            <span class="material-symbols-outlined" style="color:#fff;font-size:18px;">close</span>
          </button>

          <!-- Avatar + Thông tin chính -->
          <div style="display:flex;align-items:flex-end;gap:16px;margin-bottom:16px;">
            <!-- Avatar với ring -->
            <div style="position:relative;flex-shrink:0;">
              <div style="width:72px;height:72px;border-radius:50%;border:3px solid rgba(255,255,255,0.6);overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.25);">
                ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'lg')}
              </div>
              <span style="position:absolute;bottom:2px;right:2px;width:14px;height:14px;border-radius:50%;background:${isCheckedIn ? '#4ade80' : '#94a3b8'};border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></span>
            </div>

            <!-- Tên + Mã + Badge -->
            <div style="flex:1;min-width:0;padding-bottom:4px;">
              <h3 style="font-size:20px;font-weight:800;color:#fff;line-height:1.2;margin:0 0 4px;text-shadow:0 1px 4px rgba(0,0,0,0.2);">${m.ho_ten || '—'}</h3>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span style="font-size:12px;color:rgba(255,255,255,0.8);font-weight:600;">${m.ma_ho_so || '—'}</span>
                <span style="width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.5);"></span>
                <span style="font-size:12px;color:rgba(255,255,255,0.8);">${window.GymApp.formatEnumLabel(m.loai_ho_so || 'hoi_vien')}</span>
                <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:${isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};color:#fff;border:1px solid rgba(255,255,255,0.3);">${statusText}</span>
              </div>
            </div>
          </div>

          <!-- Quick Stats Bar -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,0.15);border-radius:12px 12px 0 0;overflow:hidden;">
            <div style="background:rgba(0,0,0,0.15);padding:10px 14px;backdrop-filter:blur(4px);">
              <div style="font-size:10px;color:rgba(255,255,255,0.65);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">Gói tập</div>
              <div style="font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${pkgName}">${pkgName}</div>
            </div>
            <div style="background:rgba(0,0,0,0.15);padding:10px 14px;backdrop-filter:blur(4px);">
              <div style="font-size:10px;color:rgba(255,255,255,0.65);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">Hết hạn</div>
              <div style="font-size:13px;font-weight:800;color:#fff;">${expDate}</div>
            </div>
            <div style="background:rgba(0,0,0,0.15);padding:10px 14px;backdrop-filter:blur(4px);">
              <div style="font-size:10px;color:rgba(255,255,255,0.65);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">Giới tính</div>
              <div style="font-size:13px;font-weight:800;color:#fff;">${genderLabel}</div>
            </div>
          </div>
        </div>

        <!-- Tab Bar -->
        <div style="display:flex;background:var(--md-sys-color-surface-container-lowest,#f8faf8);border-bottom:1px solid var(--md-sys-color-outline-variant,#cdd8cb);flex-shrink:0;padding:0 16px;">
          ${[['info', 'Thông tin', 'info'], ['package', 'Gói tập', 'fitness_center'], ['schedule', 'Lịch PT', 'event_note']].map(([t, l, ic]) => `
            <button class="member-detail-tab" data-mtab="${t}" style="display:flex;align-items:center;gap:6px;padding:12px 16px;font-size:13px;font-weight:700;border:none;background:transparent;cursor:pointer;border-bottom:2.5px solid transparent;transition:all 0.2s;color:var(--md-sys-color-on-surface-variant,#3f4a3c);white-space:nowrap;">
              <span class="material-symbols-outlined" style="font-size:16px;">${ic}</span>${l}
            </button>
          `).join('')}
        </div>

        <!-- Body -->
        <div id="member-modal-body" style="overflow-y:auto;flex:1;padding:20px 24px;" class="bg-surface-container-lowest">
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const refreshAndSetTab = async (t) => {
      try {
        const [memberRes, historyRes, schedRes] = await Promise.all([
          window.GymApp.api.get(`/members/${id}`),
          window.GymApp.api.get(`/members/${id}/history`),
          window.GymApp.api.get(`/pt/schedules?hoi_vien_id=${id}`),
        ]);
        m = memberRes.data;
        pkgHistory = Array.isArray(historyRes.data) ? historyRes.data : [];
        memberSchedules = Array.isArray(schedRes.data) ? schedRes.data : [];
      } catch (_) { }
      setTab(t);
    };

    const setTab = (t) => {
      const tabs = overlay.querySelectorAll('.member-detail-tab');
      tabs.forEach(btn => {
        const active = btn.dataset.mtab === t;
        btn.style.color = active ? '#1D9336' : 'var(--md-sys-color-on-surface-variant,#3f4a3c)';
        btn.style.borderBottomColor = active ? '#1D9336' : 'transparent';
        btn.style.fontWeight = active ? '800' : '700';
      });
      document.getElementById('member-modal-body').innerHTML = self._renderMemberTab(t, m, pkgHistory, memberSchedules);
      self._bindMemberTabEvents(t, m, () => refreshAndSetTab(t));
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

  _getUpcomingPackages: function (m) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (this._memberPackageHistory[m.id] || [])
      .filter(p => new Date(p.from) > today)
      .sort((a, b) => new Date(a.from) - new Date(b.from));
  },

  _getMemberSchedules: function (m) {
    return (window.GymApp.data.ptSchedules || [])
      .filter(s => s.ho_so_id === m.id || s.memberId === m.id || s.ten_hoi_vien === m.ho_ten || s.memberName === m.ho_ten)
      .sort((a, b) => `${a.ngay_tap || a.date} ${a.gio_bat_dau || a.startTime}`.localeCompare(`${b.ngay_tap || b.date} ${b.gio_bat_dau || b.startTime}`));
  },

  _packageStatusBadge: function (status) {
    const dbMap = {
      'dang_hoat_dong': 'Đang hoạt động',
      'het_han': 'Hết hạn',
      'da_huy': 'Đã hủy',
      'da_ket_thuc': 'Đã kết thúc',
      'dang_cho': 'Đang chờ',
      'cho_duyet': 'Đang chờ',
      'cho_kich_hoat': 'Chờ kích hoạt',
      'paid': 'Đã thanh toán',
      'debt': 'Còn nợ',
      'free': 'Miễn phí',
    };
    status = dbMap[status] || window.GymApp.formatEnumLabel(status);
    const palette = {
      'Đang hoạt động': ['#e7f5e9', '#1D9336'],
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
      const hasAccount = !!m.tai_khoan_id;
      const genderLabel = m.gioi_tinh === 'nam' || m.gioi_tinh === 'male' ? 'Nam' : m.gioi_tinh === 'nu' || m.gioi_tinh === 'female' ? 'Nữ' : (m.gioi_tinh || '—');
      const diaChiFull = [m.dia_chi_tam_tru, m.phuong_xa, m.quan_huyen, m.tinh_thanh].filter(Boolean).join(', ') || '—';

      const activePkg = m.goi_tap_hien_tai && m.goi_tap_hien_tai.length > 0 ? m.goi_tap_hien_tai[0] : null;
      const pkgName = activePkg ? (activePkg.ten_goi || activePkg.ten_goi_tap) : (m.ten_goi_tap || 'Chưa đăng ký');
      const hetHanVal = activePkg ? activePkg.den_ngay : m.ngay_het_han;
      const expDate = hetHanVal ? window.GymApp.formatDate(hetHanVal) : '—';

      const infoRow = (icon, label, value, accent, wrap = false) => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#fff;">
          <div style="width:32px;height:32px;border-radius:8px;background:${accent || '#f0f7f1'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <span class="material-symbols-outlined" style="font-size:16px;color:${accent ? '#fff' : '#1D9336'};font-variation-settings:'FILL' 1;">${icon}</span>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--md-sys-color-on-surface-variant,#3f4a3c);opacity:0.6;margin-bottom:2px;">${label}</div>
            <div style="font-size:13px;font-weight:700;color:var(--md-sys-color-on-surface,#1a2018);line-height:1.4;${wrap ? '' : 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'}" title="${value || '—'}">${value || '—'}</div>
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
        <div style="border-radius:12px;border:1px solid var(--md-sys-color-outline-variant,#e0e5de);overflow:hidden;display:grid;grid-template-columns:1fr 1fr;gap:1px;background-color:var(--md-sys-color-outline-variant,#e0e5de);">
          ${infoRow('cake', 'Ngày sinh', window.GymApp.formatDate(m.ngay_sinh))}
          ${infoRow('wc', 'Giới tính', genderLabel)}
          ${infoRow('badge', 'CCCD / CMND', m.cccd || '—')}
          ${infoRow('home_pin', 'Quê quán', m.que_quan || '—')}
          <div style="grid-column:1/-1;">${infoRow('location_on', 'Địa chỉ', diaChiFull, null, true)}</div>
        </div>

        ${sectionTitle('contact_page', 'Liên hệ & Tài khoản')}
        <div style="border-radius:12px;border:1px solid var(--md-sys-color-outline-variant,#e0e5de);overflow:hidden;display:grid;grid-template-columns:1fr 1fr;gap:1px;background-color:var(--md-sys-color-outline-variant,#e0e5de);">
          ${infoRow('call', 'Số điện thoại', m.so_dien_thoai)}
          ${infoRow('mail', 'Email', m.email)}
        </div>

        ${sectionTitle('fitness_center', 'Thông tin tập luyện')}
        <div style="border-radius:12px;border:1px solid var(--md-sys-color-outline-variant,#e0e5de);overflow:hidden;display:grid;grid-template-columns:1fr 1fr;gap:1px;background-color:var(--md-sys-color-outline-variant,#e0e5de);">
          <div style="grid-column:1/-1;">${infoRow('card_membership', 'Gói tập hiện tại', pkgName, null, true)}</div>
          ${infoRow('calendar_today', 'Tham gia', window.GymApp.formatDate(m.ngay_tao))}
          ${infoRow('event_busy', 'Hết hạn', expDate)}
        </div>

        <!-- Tài khoản đăng nhập -->
        <div style="margin-top:16px;border:1px solid var(--md-sys-color-outline-variant,#e0e5de);border-radius:12px;overflow:hidden;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--md-sys-color-surface-container,#eff2ef);">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="material-symbols-outlined" style="font-size:16px;color:#1D9336;font-variation-settings:'FILL' 1;">manage_accounts</span>
              <span style="font-size:13px;font-weight:700;color:var(--md-sys-color-on-surface,#1a2018);">Tài khoản đăng nhập</span>
            </div>
            ${hasAccount
          ? `<span style="padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:#e7f5e9;color:#1D9336;">✓ Đã có tài khoản</span>`
          : `<span style="padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:#fff3e0;color:#e65100;">Chưa có tài khoản</span>`
        }
          </div>
          <div style="padding:12px 16px;background:var(--md-sys-color-surface-container-lowest,#fff);">
          ${hasAccount
          ? `<p style="font-size:13px;color:var(--md-sys-color-on-surface-variant,#3f4a3c);">Hồ sơ này đã được liên kết với tài khoản đăng nhập.</p>`
          : `<div class="grid grid-cols-2 gap-compact" id="modal-account-form">
                <div>
                  <label class="block text-body-sm font-bold text-on-surface-variant mb-xs">Tên đăng nhập *</label>
                  <input id="modal-username" type="text" value="${m.so_dien_thoai || ''}" placeholder="Số điện thoại hoặc tên đăng nhập"
                    class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none transition-colors text-body-md" />
                </div>
                <div>
                  <label class="block text-body-sm font-bold text-on-surface-variant mb-xs">Mật khẩu *</label>
                  <input id="modal-password" type="password" placeholder="Ít nhất 6 ký tự"
                    class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none transition-colors text-body-md" />
                </div>
                <div class="col-span-2 flex justify-end">
                  <button id="btn-create-account" data-id="${m.id}"
                    class="flex items-center gap-xs px-loose py-compact rounded-xl font-bold text-white text-body-sm transition-all hover:opacity-90"
                    style="background:#1D9336;">
                    <span class="material-symbols-outlined text-sm">person_add</span>
                    Tạo tài khoản
                  </button>
                </div>
              </div>`
        }
          </div>
        </div>
      `;
    }

    if (tab === 'package') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const upcomingPackages = pkgHistory.filter(p => {
        const from = new Date(p.tu_ngay || p.from);
        return from > today;
      });
      const pastPackages = pkgHistory.filter(p => {
        const from = new Date(p.tu_ngay || p.from);
        return from <= today;
      });

      const renderPkgCard = (p, type) => {
        const isUpcoming = type === 'upcoming';
        const icon = isUpcoming ? 'schedule' : 'history';
        const color = isUpcoming ? '#d97706' : '#64748b';
        const bg = isUpcoming ? '#fef3c7' : '#f1f5f9';
        const border = isUpcoming ? '#fde68a' : '#e2e8f0';

        return `
          <div style="display:flex; align-items:center; gap:16px; padding:16px; background:#fff; border:1px solid ${border}; border-radius:12px; margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
            <div style="width:44px; height:44px; border-radius:12px; background:${bg}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              <span class="material-symbols-outlined" style="color:${color}; font-size:24px;">${icon}</span>
            </div>
            <div style="flex:1; min-width:0;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                <h5 style="font-size:15px; font-weight:800; color:var(--md-sys-color-on-surface,#1a2018); margin:0;">${p.ten_goi || p.name || '—'}</h5>
                ${this._packageStatusBadge(p.trang_thai || p.status || (isUpcoming ? 'Sắp tới' : 'Lịch sử'))}
              </div>
              <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap; font-size:12px; color:var(--md-sys-color-on-surface-variant,#3f4a3c);">
                <span style="display:flex; align-items:center; gap:4px; font-weight:600;"><span class="material-symbols-outlined" style="font-size:14px; opacity:0.7;">payments</span>${window.GymApp.formatCurrency(p.gia_thuc_te || p.gia || p.price || 0)}</span>
                <span style="display:flex; align-items:center; gap:4px;"><span class="material-symbols-outlined" style="font-size:14px; opacity:0.7;">event</span>${window.GymApp.formatDate(p.tu_ngay || p.from)} ➔ ${window.GymApp.formatDate(p.den_ngay || p.to)}</span>
              </div>
              ${p.ghi_chu_tt || p.ghi_chu || p.note ? `<div style="margin-top:6px; font-size:12px; color:#64748b; font-style:italic;">📝 ${p.ghi_chu_tt || p.ghi_chu || p.note}</div>` : ''}
            </div>
          </div>
        `;
      };

      const upcomingHTML = upcomingPackages.length === 0
        ? `<div style="text-align:center; padding:24px; color:var(--md-sys-color-on-surface-variant); font-size:13px; background:#f8fafc; border-radius:12px; border:1px dashed #cbd5e1; margin-bottom:16px;">Không có gói tập sắp tới</div>`
        : upcomingPackages.map(p => renderPkgCard(p, 'upcoming')).join('');

      const pastHTML = pastPackages.length === 0
        ? `<div style="text-align:center; padding:24px; color:var(--md-sys-color-on-surface-variant); font-size:13px; background:#f8fafc; border-radius:12px; border:1px dashed #cbd5e1;">Chưa có lịch sử gói tập</div>`
        : pastPackages.map(p => renderPkgCard(p, 'history')).join('');

      const activePkg = Array.isArray(m.goi_tap_hien_tai) && m.goi_tap_hien_tai.length > 0 ? m.goi_tap_hien_tai[0] : null;

      return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h4 style="font-size:16px; font-weight:800; color:var(--md-sys-color-on-surface);">Gói Tập Của Hội Viên</h4>
          <button id="btn-add-package" style="display:flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; background:linear-gradient(135deg, #1D9336, #22c55e); color:#fff; font-weight:700; font-size:13px; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(29,147,54,0.2); transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 16px rgba(29,147,54,0.3)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 12px rgba(29,147,54,0.2)';">
            <span class="material-symbols-outlined" style="font-size:18px;">add_circle</span> Đăng ký gói
          </button>
        </div>

        ${activePkg ? `
        <div style="background:linear-gradient(135deg, #1a5e2a 0%, #1D9336 60%, #22c55e 100%); border-radius:16px; padding:20px; color:#fff; position:relative; overflow:hidden; box-shadow:0 10px 25px rgba(29,147,54,0.3); margin-bottom:24px;">
          <div style="position:absolute; top:-20px; right:-20px; width:120px; height:120px; border-radius:50%; background:rgba(255,255,255,0.1);"></div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; position:relative; z-index:1;">
            <div>
              <span style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.1em; background:rgba(255,255,255,0.2); padding:4px 10px; border-radius:999px; backdrop-filter:blur(4px); box-shadow:0 2px 4px rgba(0,0,0,0.1);">ĐANG SỬ DỤNG</span>
              <h4 style="font-size:24px; font-weight:800; margin:10px 0 0; text-shadow:0 2px 4px rgba(0,0,0,0.2);">${activePkg.ten_goi || '—'}</h4>
            </div>
            <span class="material-symbols-outlined" style="font-size:48px; opacity:0.9; text-shadow:0 4px 12px rgba(0,0,0,0.2);">card_membership</span>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; position:relative; z-index:1; background:rgba(0,0,0,0.15); padding:16px; border-radius:12px; backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.1);">
            <div>
              <div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; opacity:0.8; margin-bottom:4px;">Thời hạn</div>
              <div style="font-size:14px; font-weight:700; display:flex; align-items:center; gap:6px;">
                <span class="material-symbols-outlined" style="font-size:16px;">calendar_month</span>
                ${window.GymApp.formatDate(activePkg.tu_ngay)} ➔ ${window.GymApp.formatDate(activePkg.den_ngay)}
              </div>
            </div>
            <div>
              <div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; opacity:0.8; margin-bottom:4px;">Giá trị gói</div>
              <div style="font-size:14px; font-weight:700; display:flex; align-items:center; gap:6px;">
                <span class="material-symbols-outlined" style="font-size:16px;">payments</span>
                ${window.GymApp.formatCurrency(activePkg.gia_thuc_te)}
              </div>
            </div>
          </div>
        </div>
        ` : `
        <div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:16px; padding:32px 20px; text-align:center; margin-bottom:24px;">
          <div style="width:48px; height:48px; background:#f1f5f9; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 12px;">
            <span class="material-symbols-outlined" style="font-size:24px; color:#94a3b8;">card_membership</span>
          </div>
          <p style="font-size:14px; font-weight:700; color:#475569; margin:0 0 4px;">Chưa đăng ký gói tập</p>
          <p style="font-size:12px; color:#64748b; margin:0;">Hội viên hiện không có gói tập nào đang hoạt động.</p>
        </div>
        `}

        <div style="margin-bottom:24px;">
          <h5 style="font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--md-sys-color-on-surface-variant); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
            <span class="material-symbols-outlined" style="font-size:18px; color:#d97706;">event_upcoming</span> Gói sắp kích hoạt
          </h5>
          ${upcomingHTML}
        </div>

        <div>
          <h5 style="font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--md-sys-color-on-surface-variant); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
            <span class="material-symbols-outlined" style="font-size:18px; color:#64748b;">history</span> Lịch sử gói tập
          </h5>
          ${pastHTML}
        </div>
      `;
    }

    if (tab === 'schedule') {
      const ptContracts = Array.isArray(m.pt_hien_tai) ? m.pt_hien_tai : [];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const canSchedule = ptContracts.some(c => {
        const buoiConLai = (c.buoi_dang_ky || 0) - (c.buoi_da_tap || 0);
        const conHan = !c.den_ngay || new Date(c.den_ngay) >= today;
        return buoiConLai > 0 && conHan;
      });

      const ptContractsHTML = ptContracts.length === 0
        ? `<div style="text-align:center; padding:24px; color:var(--md-sys-color-on-surface-variant); font-size:13px; background:#f8fafc; border-radius:12px; border:1px dashed #cbd5e1; margin-bottom:16px;">Hội viên chưa đăng ký gói PT nào.</div>`
        : ptContracts.map(c => {
          const buoiConLai = (c.buoi_dang_ky || 0) - (c.buoi_da_tap || 0);
          const conHan = !c.den_ngay || new Date(c.den_ngay) >= today;
          const statusLabel = (!conHan) ? 'Hết hạn' : (buoiConLai <= 0 ? 'Hết buổi' : 'Đang hoạt động');
          const statusColor = statusLabel === 'Đang hoạt động' ? '#1D9336' : (statusLabel === 'Hết buổi' ? '#f59e0b' : '#ba1a1a');
          const bgStatus = statusLabel === 'Đang hoạt động' ? '#f0fdf4' : (statusLabel === 'Hết buổi' ? '#fffbeb' : '#fef2f2');

          return `
            <div style="display:flex; flex-direction:column; background:#fff; border:1px solid #e2e8f0; border-radius:12px; margin-bottom:16px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
              <div style="padding:16px; display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #e2e8f0; background:${bgStatus};">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div style="width:40px; height:40px; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.05); border:1px solid ${statusColor}30;">
                    <span class="material-symbols-outlined" style="color:${statusColor};">sports_gymnastics</span>
                  </div>
                  <div>
                    <h5 style="font-size:15px; font-weight:800; color:var(--md-sys-color-on-surface); margin:0 0 2px;">PT: ${c.ten_pt || '—'}</h5>
                    <div style="font-size:12px; color:var(--md-sys-color-on-surface-variant);">${c.chuyen_mon || 'Huấn luyện viên cá nhân'}</div>
                  </div>
                </div>
                <span style="padding:4px 10px; border-radius:999px; font-size:11px; font-weight:800; background:${statusColor}20; color:${statusColor}; border:1px solid ${statusColor}40;">${statusLabel}</span>
              </div>
              <div style="padding:16px; display:grid; grid-template-columns:1fr 1fr; gap:16px; background:#fff;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:32px; height:32px; border-radius:8px; background:#f1f5f9; display:flex; align-items:center; justify-content:center;">
                    <span class="material-symbols-outlined" style="font-size:16px; color:#64748b;">event</span>
                  </div>
                  <div>
                    <div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#64748b; margin-bottom:2px;">Thời hạn</div>
                    <div style="font-size:13px; font-weight:700; color:#1e293b;">${c.den_ngay ? window.GymApp.formatDate(c.den_ngay) : 'Không giới hạn'}</div>
                  </div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:32px; height:32px; border-radius:8px; background:#f1f5f9; display:flex; align-items:center; justify-content:center;">
                    <span class="material-symbols-outlined" style="font-size:16px; color:#64748b;">play_lesson</span>
                  </div>
                  <div>
                    <div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#64748b; margin-bottom:2px;">Số buổi</div>
                    <div style="font-size:13px; font-weight:800; color:#1e293b;">
                      <span style="color:${buoiConLai > 0 ? '#1D9336' : '#ba1a1a'}; font-size:15px;">${buoiConLai}</span> / ${c.buoi_dang_ky || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('');

      const renderScheduleItem = (s) => {
        const dateObj = new Date(s.ngay_tap || s.date);
        const isPast = dateObj < today;
        const statusStr = s.trang_thai || s.status || 'Chờ tập';
        const isDone = statusStr === 'Hoàn thành' || statusStr === 'hoan_thanh';
        const isCancel = statusStr === 'Hủy' || statusStr === 'huy';

        return `
          <div style="display:flex; align-items:stretch; gap:16px; background:#fff; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
            <div style="background:${isPast ? '#f1f5f9' : '#f0fdf4'}; width:80px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:12px 8px; border-right:1px dashed #cbd5e1;">
              <span style="font-size:11px; font-weight:800; text-transform:uppercase; color:${isPast ? '#64748b' : '#166534'}; margin-bottom:4px;">Tháng ${dateObj.getMonth() + 1}</span>
              <span style="font-size:24px; font-weight:800; color:${isPast ? '#475569' : '#1D9336'}; line-height:1;">${dateObj.getDate()}</span>
            </div>
            <div style="flex:1; padding:12px; display:flex; flex-direction:column; justify-content:center;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="material-symbols-outlined" style="font-size:16px; color:#64748b;">schedule</span>
                  <span style="font-size:13px; font-weight:800; color:#1e293b;">${s.gio_bat_dau || s.startTime} — ${s.gio_ket_thuc || s.endTime}</span>
                </div>
                ${window.GymApp.statusBadge(statusStr)}
              </div>
              <div style="display:flex; align-items:center; gap:12px; font-size:12px; color:#475569;">
                <span style="display:flex; align-items:center; gap:4px;"><span class="material-symbols-outlined" style="font-size:14px; opacity:0.7;">person</span> PT: <b>${s.ten_pt || '—'}</b></span>
              </div>
              ${s.ghi_chu ? `<div style="margin-top:6px; font-size:12px; color:#64748b; font-style:italic;">📝 ${s.ghi_chu}</div>` : ''}
            </div>
          </div>
        `;
      };

      const scheduleRows = memberSchedules.length === 0
        ? `<div style="text-align:center; padding:24px; color:var(--md-sys-color-on-surface-variant); font-size:13px; background:#f8fafc; border-radius:12px; border:1px dashed #cbd5e1;">Chưa có lịch tập nào được đặt</div>`
        : memberSchedules.map(renderScheduleItem).join('');

      const scheduleWarning = !canSchedule && ptContracts.length > 0
        ? `<div style="padding:12px 16px; border-radius:8px; background:#fff3cd; border:1px solid #ffc107; color:#856404; font-size:13px; font-weight:700; display:flex; align-items:center; gap:8px; margin-bottom:16px;">
             <span class="material-symbols-outlined" style="font-size:20px; color:#d97706;">warning</span>
             Không thể đặt lịch — tất cả gói PT đã hết buổi hoặc hết hạn.
           </div>` : '';

      return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h4 style="font-size:16px; font-weight:800; color:var(--md-sys-color-on-surface);">Thông Tin Gói PT</h4>
          <button id="btn-add-pt-reg" style="display:flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; background:linear-gradient(135deg, #1D9336, #22c55e); color:#fff; font-weight:700; font-size:13px; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(29,147,54,0.2); transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 16px rgba(29,147,54,0.3)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 12px rgba(29,147,54,0.2)';">
            <span class="material-symbols-outlined" style="font-size:18px;">add_circle</span> Đăng ký PT
          </button>
        </div>

        ${ptContractsHTML}

        <div style="margin-top:32px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
          <h4 style="font-size:16px; font-weight:800; color:var(--md-sys-color-on-surface);">Lịch Tập Gần Đây</h4>
          <button id="btn-add-schedule" ${(!canSchedule) ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : 'style="cursor:pointer;"'} class="flex items-center gap-xs px-standard py-compact rounded-lg font-bold text-body-sm bg-surface-container hover:bg-surface-container-high transition-all border border-outline-variant text-on-surface">
            <span class="material-symbols-outlined text-sm">calendar_add_on</span> Đặt lịch mới
          </button>
        </div>
        
        ${scheduleWarning}
        ${scheduleRows}
      `;
    }
    return '';
  },

  _bindMemberTabEvents: function (tab, m, refreshTab) {
    const self = this;
    if (tab === 'info') {
      document.getElementById('btn-create-account')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-create-account');
        const username = document.getElementById('modal-username')?.value.trim();
        const password = document.getElementById('modal-password')?.value;
        if (!username || !password) return window.GymApp.toast('Vui lòng nhập đủ tên đăng nhập và mật khẩu.', 'error');
        btn.disabled = true;
        btn.innerHTML = '<span class="animate-spin material-symbols-outlined text-sm">sync</span> Đang tạo...';
        try {
          const res = await window.GymApp.api.post(`/members/${m.id}/create-account`, { ten_dang_nhap: username, mat_khau: password });
          if (res.success) {
            window.GymApp.toast(`Đã tạo tài khoản "${username}" thành công!`, 'success');
            refreshTab();
          } else {
            window.GymApp.toast(res.message || 'Không thể tạo tài khoản.', 'error');
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined text-sm">person_add</span> Tạo tài khoản';
          }
        } catch (e) {
          window.GymApp.toast('Lỗi kết nối máy chủ.', 'error');
          btn.disabled = false;
          btn.innerHTML = '<span class="material-symbols-outlined text-sm">person_add</span> Tạo tài khoản';
        }
      });
    }
    if (tab === 'package') {
      document.getElementById('btn-add-package')?.addEventListener('click', () => self._showAddPackageModal(m, refreshTab));
    }
    if (tab === 'schedule') {
      document.getElementById('btn-add-pt-reg')?.addEventListener('click', () => self._showAddPtRegistrationModal(m, refreshTab));
      document.getElementById('btn-add-schedule')?.addEventListener('click', () => self._showAddScheduleModal(m, refreshTab));
    }
  },

  // ===== MODAL THÊM GÓI TẬP =====
  _showAddPackageModal: function (m, onSaved) {
    const self = this;
    document.getElementById('gym-sub-modal')?.remove();

    const pkgs = window.GymApp.data.packages || [];
    const pkgNames = pkgs.length
      ? pkgs.map(p => ({ name: p.ten_goi || p.name, price: p.gia || p.price || 0 }))
      : [...new Set(window.GymApp.data.members.map(x => x.ten_goi_tap || x.package))].map(n => ({ name: n, price: 0 }));

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
            <p class="text-on-surface-variant text-body-sm">Hội viên: <strong>${m.ho_ten || m.name}</strong></p>
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

            <!-- Phương thức thanh toán -->
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Phương thức TT ${REQ}</label>
              <select id="pkg-payment-method" ${inputCls}>
                <option value="tien_mat">Tiền mặt</option>
                <option value="chuyen_khoan">Chuyển khoản</option>
                <option value="the">Thẻ</option>
                <option value="momo">MoMo</option>
                <option value="zalopay">ZaloPay</option>
                <option value="khac">Khác</option>
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

    // Auto-fill price + den_ngay khi chọn gói tập
    document.getElementById('pkg-name').addEventListener('change', function () {
      const name = this.value;
      const pkg = (window.GymApp.data.packages || []).find(p => (p.ten_goi || p.name) === name);
      if (!pkg) return;
      if (pkg.gia > 0) {
        document.getElementById('pkg-price').value = pkg.gia;
        calcDebt();
      }
      // Tự tính ngày kết thúc = từ ngày + so_thang tháng + so_ngay_them ngày
      const fromVal = document.getElementById('pkg-from').value;
      if (fromVal && (pkg.so_thang || pkg.so_ngay_them)) {
        const from = new Date(fromVal);
        from.setMonth(from.getMonth() + (pkg.so_thang || 0));
        from.setDate(from.getDate() + (pkg.so_ngay_them || 0));
        document.getElementById('pkg-to').value = from.toISOString().split('T')[0];
      }
    });

    // Khi thay đổi từ ngày → cập nhật lại đến ngày nếu đã chọn gói
    document.getElementById('pkg-from').addEventListener('change', function () {
      const name = document.getElementById('pkg-name').value;
      const pkg = (window.GymApp.data.packages || []).find(p => (p.ten_goi || p.name) === name);
      if (!pkg || !this.value) return;
      const from = new Date(this.value);
      from.setMonth(from.getMonth() + (pkg.so_thang || 0));
      from.setDate(from.getDate() + (pkg.so_ngay_them || 0));
      document.getElementById('pkg-to').value = from.toISOString().split('T')[0];
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

    document.getElementById('pkg-save-btn').addEventListener('click', async () => {
      const name = document.getElementById('pkg-name').value;
      const price = parseFloat(document.getElementById('pkg-price').value) || 0;
      const from = document.getElementById('pkg-from').value;
      const to = document.getElementById('pkg-to').value;
      const regStatus = document.getElementById('pkg-reg-status').value;

      if (!name || !price || !from || !to || !regStatus) {
        window.GymApp.toast('Vui lòng điền đầy đủ các trường bắt buộc (*)', 'error');
        return;
      }

      const pkg = (window.GymApp.data.packages || []).find(p => (p.ten_goi || p.name) === name);
      if (!pkg) {
        window.GymApp.toast('Gói tập không hợp lệ', 'error');
        return;
      }

      try {
        const payload = {
          goi_tap_id: pkg.id,
          tu_ngay: from,
          gia_thuc_te: price,
          phuong_thuc_tt: document.getElementById('pkg-payment-method').value,
          ghi_chu_tt: document.getElementById('pkg-note').value.trim(),
          ma_giao_dich: document.getElementById('pkg-discount-code').value.trim()
        };

        await window.GymApp.api.post(`/members/${m.id}/package`, payload);
        window.GymApp.toast('Đăng ký gói tập thành công!', 'success');

        // Refresh data
        if (window.GymApp.fetchInitialData) await window.GymApp.fetchInitialData();
        self._applyMemberFilter();
        close();
        if (typeof onSaved === 'function') onSaved();
      } catch (err) {
        console.error('Package registration error:', err);
        window.GymApp.toast(err.message || 'Lỗi khi lưu gói tập', 'error');
      }
    });
  },

  // ===== MODAL ĐĂNG KÝ GÓI PT =====
  _showAddPtRegistrationModal: async function (m, onSaved) {
    const self = this;
    document.getElementById('gym-sub-modal')?.remove();

    const REQ = `<span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>`;
    const inputCls = `class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;"`;
    const pts = (window.GymApp.data.pts || []);

    // Fetch danh sách gói PT từ API
    let goiPtList = [];
    try {
      const res = await window.GymApp.api.get('/packages/pt');
      goiPtList = Array.isArray(res.data) ? res.data : [];
    } catch (_) { }

    const overlay = document.createElement('div');
    overlay.id = 'gym-sub-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);padding:16px;';

    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:16px;width:100%;max-width:540px;max-height:92vh;overflow-y:auto;position:relative;box-shadow:0 30px 80px rgba(0,0,0,0.4);">
        <div class="bg-surface-container-lowest border-b border-outline-variant px-loose py-standard flex items-center justify-between" style="position:sticky;top:0;z-index:1;">
          <div>
            <h3 class="font-bold text-on-surface" style="font-size:16px;">Đăng ký gói PT</h3>
            <p class="text-on-surface-variant text-body-sm">Hội viên: <strong>${m.ho_ten}</strong></p>
          </div>
          <button id="close-sub-modal" style="background:transparent;border:none;cursor:pointer;">
            <span class="material-symbols-outlined text-on-surface-variant text-xl">close</span>
          </button>
        </div>
        <div class="p-loose flex flex-col gap-standard bg-surface-container-lowest">
          <div class="grid grid-cols-2 gap-standard">

            <!-- Chọn PT -->
            <div style="grid-column:1/-1;">
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Huấn luyện viên ${REQ}</label>
              <select id="ptreg-pt" ${inputCls}>
                <option value="">— Chọn huấn luyện viên —</option>
                ${pts.map(pt => `<option value="${pt.id}">${pt.ho_ten || pt.name}${pt.chuyen_mon ? ' — ' + pt.chuyen_mon : ''}</option>`).join('')}
              </select>
            </div>

            <!-- Chọn gói PT -->
            <div style="grid-column:1/-1;">
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Gói PT ${REQ}</label>
              <select id="ptreg-goi" ${inputCls}>
                <option value="">— Chọn gói PT —</option>
                ${goiPtList.map(g => `<option value="${g.id}" data-price="${g.gia || 0}" data-buoi="${g.so_buoi || ''}" data-thang="${g.so_thang || 0}">${g.ten_goi} — ${window.GymApp.formatCurrency(g.gia || 0)}${g.so_buoi ? ' / ' + g.so_buoi + ' buổi' : ''}</option>`).join('')}
              </select>
            </div>

            <!-- Số buổi (auto-fill từ gói, có thể sửa) -->
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Số buổi <span style="font-size:11px;color:#6e7a6b;">(tự điền từ gói)</span></label>
              <input id="ptreg-sessions" type="number" min="1" placeholder="—" ${inputCls} />
            </div>

            <!-- Giá thực tế -->
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Giá thực tế (VNĐ) ${REQ}</label>
              <input id="ptreg-price" type="number" min="0" placeholder="Tự điền từ gói..." ${inputCls} />
            </div>

            <!-- Phương thức thanh toán -->
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Phương thức TT ${REQ}</label>
              <select id="ptreg-payment" ${inputCls}>
                <option value="tien_mat">Tiền mặt</option>
                <option value="chuyen_khoan">Chuyển khoản</option>
                <option value="the">Thẻ</option>
                <option value="momo">MoMo</option>
                <option value="zalopay">ZaloPay</option>
                <option value="khac">Khác</option>
              </select>
            </div>

            <!-- Từ ngày -->
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Từ ngày ${REQ}</label>
              <input id="ptreg-from" type="date" value="${new Date().toISOString().split('T')[0]}" ${inputCls} />
            </div>

            <!-- Đến ngày -->
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Đến ngày <span style="font-size:11px;color:#6e7a6b;">(gói theo tháng)</span></label>
              <input id="ptreg-to" type="date" ${inputCls} />
            </div>

            <!-- Ghi chú thanh toán -->
            <div style="grid-column:1/-1;">
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Ghi chú</label>
              <textarea id="ptreg-note" rows="2" placeholder="Ghi chú thêm..." class="bg-surface-container-lowest text-on-surface border border-outline-variant"
                style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;resize:vertical;font-family:inherit;"></textarea>
            </div>

          </div>
          <p style="font-size:11px;" class="text-on-surface-variant">Các trường có dấu <span style="color:#ba1a1a;font-weight:700;">*</span> là bắt buộc</p>
          <div class="flex gap-standard">
            <button id="ptreg-cancel-btn" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Hủy</button>
            <button id="ptreg-save-btn" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#1D9336;">Đăng ký gói PT</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Auto-fill số buổi, giá, và đến ngày khi chọn gói PT
    document.getElementById('ptreg-goi').addEventListener('change', function () {
      const opt = this.options[this.selectedIndex];
      const price = parseFloat(opt.dataset.price) || 0;
      const buoi = opt.dataset.buoi;
      const soThang = parseInt(opt.dataset.thang) || 0;
      if (price > 0) document.getElementById('ptreg-price').value = price;
      if (buoi) document.getElementById('ptreg-sessions').value = buoi;
      // Tự tính ngày kết thúc nếu gói theo tháng
      if (soThang > 0) {
        const fromVal = document.getElementById('ptreg-from').value;
        if (fromVal) {
          const from = new Date(fromVal);
          from.setMonth(from.getMonth() + soThang);
          document.getElementById('ptreg-to').value = from.toISOString().split('T')[0];
        }
      }
    });

    // Khi thay đổi từ ngày → cập nhật lại đến ngày nếu đã chọn gói
    document.getElementById('ptreg-from').addEventListener('change', function () {
      const goiSel = document.getElementById('ptreg-goi');
      const opt = goiSel.options[goiSel.selectedIndex];
      const soThang = parseInt(opt?.dataset?.thang) || 0;
      if (soThang > 0 && this.value) {
        const from = new Date(this.value);
        from.setMonth(from.getMonth() + soThang);
        document.getElementById('ptreg-to').value = from.toISOString().split('T')[0];
      }
    });

    const close = () => overlay.remove();
    document.getElementById('close-sub-modal').addEventListener('click', close);
    document.getElementById('ptreg-cancel-btn').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('ptreg-save-btn').addEventListener('click', async () => {
      const ptId = document.getElementById('ptreg-pt').value;
      const goiId = document.getElementById('ptreg-goi').value;
      const price = parseFloat(document.getElementById('ptreg-price').value);
      const from = document.getElementById('ptreg-from').value;
      const to = document.getElementById('ptreg-to').value;
      const payment = document.getElementById('ptreg-payment').value;
      const sessions = document.getElementById('ptreg-sessions').value;
      const note = document.getElementById('ptreg-note').value.trim();

      if (!ptId || !goiId || isNaN(price) || !from) {
        window.GymApp.toast('Vui lòng điền đầy đủ: PT, gói PT, giá và từ ngày (*)', 'error');
        return;
      }

      try {
        await window.GymApp.api.post('/pt/registrations', {
          hoi_vien_id: m.id,
          pt_id: ptId,
          goi_pt_id: goiId,
          so_buoi_dang_ky: sessions ? parseInt(sessions) : undefined,
          tu_ngay: from,
          den_ngay: to || undefined,
          gia_thuc_te: price,
          phuong_thuc_tt: payment,
          ghi_chu_tt: note || undefined,
        });
        window.GymApp.toast('Đăng ký gói PT thành công!', 'success');
        close();
        if (typeof onSaved === 'function') await onSaved();
      } catch (err) {
        window.GymApp.toast(err.message || 'Đăng ký thất bại', 'error');
      }
    });
  },

  // ===== MODAL ĐĂNG KÝ LỊCH TẬP PT =====
  _showAddScheduleModal: function (m, onSaved) {
    document.getElementById('gym-sub-modal')?.remove();

    const REQ = `<span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>`;
    const inputCls = `class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;"`;
    const ptContracts = Array.isArray(m.pt_hien_tai) ? m.pt_hien_tai : [];

    // Generate time slots 00:00 → 23:45 per 15 min
    const timeSlots = [];
    for (let h = 0; h < 24; h++) {
      for (let mn = 0; mn < 60; mn += 15) {
        timeSlots.push(`${String(h).padStart(2, '0')}:${String(mn).padStart(2, '0')}`);
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
            <p class="text-on-surface-variant text-body-sm">Hội viên: <strong>${m.ho_ten || m.name}</strong></p>
          </div>
          <button id="close-sub-modal" style="background:transparent;border:none;cursor:pointer;">
            <span class="material-symbols-outlined text-on-surface-variant text-xl">close</span>
          </button>
        </div>
        <div class="p-loose flex flex-col gap-standard bg-surface-container-lowest">

          <!-- Chọn PT (từ hợp đồng đang active) -->
          <div>
            <label class="block text-body-sm font-bold text-on-surface mb-xs">Huấn luyện viên ${REQ}</label>
            ${ptContracts.length === 0
        ? `<div style="padding:10px 14px;border-radius:8px;background:#ffdad6;color:#93000a;font-size:13px;font-weight:600;">
                   Hội viên chưa có gói PT đang hoạt động. Vui lòng đăng ký gói PT trước.
                 </div>`
        : `<select id="sch-pt" ${inputCls}>
                   <option value="">— Chọn huấn luyện viên —</option>
                   ${ptContracts.map(c => `<option value="${c.id}">${c.ten_pt} — ${c.chuyen_mon || 'PT'} (còn ${(c.buoi_dang_ky || 0) - (c.buoi_da_tap || 0)} buổi)</option>`).join('')}
                 </select>`
      }
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

    document.getElementById('sch-save-btn').addEventListener('click', async () => {
      if (ptContracts.length === 0) {
        window.GymApp.toast('Hội viên chưa có gói PT. Vui lòng đăng ký gói PT trước!', 'error');
        return;
      }
      const contractId = document.getElementById('sch-pt')?.value;
      const date = document.getElementById('sch-date').value;
      if (!contractId || !date || !selectedTime) {
        window.GymApp.toast('Vui lòng chọn đầy đủ PT, ngày và giờ (*)', 'error');
        return;
      }

      // contractId là id của dang_ky_pt (không phải pt_id)
      const activeContract = ptContracts.find(c => String(c.id) === String(contractId));
      if (!activeContract) {
        window.GymApp.toast('Không tìm thấy hợp đồng PT!', 'error');
        return;
      }

      try {
        const payload = {
          dang_ky_pt_id: activeContract.id,
          ngay_tap: date,
          gio_bat_dau: selectedTime,
          gio_ket_thuc: (function () {
            const [h, min] = selectedTime.split(':').map(Number);
            const d = new Date();
            d.setHours(h, min + 60);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          })(),
          ghi_chu: document.getElementById('sch-note').value.trim()
        };

        await window.GymApp.api.post('/pt/schedules', payload);
        window.GymApp.toast('Đã đăng ký lịch tập thành công!', 'success');

        // Refresh data
        if (window.GymApp.fetchInitialData) await window.GymApp.fetchInitialData();
        close();
        if (typeof onSaved === 'function') onSaved();
      } catch (err) {
        console.error('Schedule registration error:', err);
        window.GymApp.toast(err.message || 'Lỗi khi đặt lịch tập', 'error');
      }
    });
  },

  // ===== MODAL CHI TIẾT PT =====
  _showPtModal: function (id) {
    const pt = window.GymApp.data.pts.find(x => x.id === id);
    if (!pt) return;
    const stars = Array.from({ length: 5 }, (_, i) =>
      `<span class="material-symbols-outlined text-sm" style="color:${i < Math.round(pt.rating) ? '#f59e0b' : '#becab9'};font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">star</span>`
    ).join('');
    const hasAccount = !!pt.tai_khoan_id;
    window.GymApp.showModal(`
      <div class="p-loose">
        <div class="flex items-center gap-loose mb-loose pb-loose border-b border-outline-variant">
          ${window.GymApp.avatarImg(pt.avatar_url || pt.avatar, pt.ho_ten || pt.name, 'lg')}
          <div>
            <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">${pt.ho_ten || pt.name}</h3>
            <p class="text-on-surface-variant text-body-sm">${pt.ma_ho_so || pt.id} · Huấn luyện viên</p>
            <div class="flex items-center gap-atom mt-atom">${stars}<span class="ml-atom font-bold text-body-md text-on-surface">${pt.rating || 0}/5</span></div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-standard mb-standard">
          ${[
        ['Chuyên môn', pt.chuyen_mon || pt.specialty],
        ['Số điện thoại', pt.so_dien_thoai || pt.phone],
        ['Email', pt.email],
        ['Số học viên', `${pt.so_hoc_vien || 0} học viên`],
        ['Buổi đã dạy', `${pt.tong_buoi_da_day || pt.sessions || 0} buổi`],
        ['Ngày gia nhập', window.GymApp.formatDate(pt.ngay_tao || pt.joinDate)],
      ].map(([label, val]) => `
            <div class="bg-surface-container p-standard rounded-lg">
              <p class="text-on-surface-variant text-body-sm font-bold uppercase tracking-wider mb-atom">${label}</p>
              <p class="text-on-surface text-body-md font-bold">${val || '—'}</p>
            </div>
          `).join('')}
        </div>
        <!-- Tài khoản đăng nhập PT -->
        <div class="border border-outline-variant rounded-xl p-standard bg-surface-container">
          <div class="flex items-center justify-between mb-standard">
            <div class="flex items-center gap-compact">
              <span class="material-symbols-outlined text-brand-primary text-base" style="font-variation-settings:'FILL' 1">manage_accounts</span>
              <span class="font-bold text-on-surface text-body-md">Tài khoản đăng nhập</span>
            </div>
            ${hasAccount
        ? `<span style="padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:#e7f5e9;color:#1D9336;">Đã có tài khoản</span>`
        : `<span style="padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:#fff3e0;color:#e65100;">Chưa có tài khoản</span>`
      }
          </div>
          ${hasAccount
        ? `<p class="text-on-surface-variant text-body-sm">PT này đã được liên kết với tài khoản đăng nhập.</p>`
        : `<div class="grid grid-cols-2 gap-compact">
                <div>
                  <label class="block text-body-sm font-bold text-on-surface-variant mb-xs">Tên đăng nhập *</label>
                  <input id="pt-modal-username" type="text" value="${pt.so_dien_thoai || ''}" placeholder="Số điện thoại hoặc tên đăng nhập"
                    class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none transition-colors text-body-md" />
                </div>
                <div>
                  <label class="block text-body-sm font-bold text-on-surface-variant mb-xs">Mật khẩu *</label>
                  <input id="pt-modal-password" type="password" placeholder="Ít nhất 6 ký tự"
                    class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none transition-colors text-body-md" />
                </div>
                <div class="col-span-2 flex justify-end">
                  <button id="btn-pt-create-account" data-id="${pt.id}"
                    class="flex items-center gap-xs px-loose py-compact rounded-xl font-bold text-white text-body-sm transition-all hover:opacity-90"
                    style="background:#1D9336;">
                    <span class="material-symbols-outlined text-sm">person_add</span>
                    Tạo tài khoản
                  </button>
                </div>
              </div>`
      }
        </div>
      </div>
    `);

    // Bind event tạo tài khoản cho PT
    document.getElementById('btn-pt-create-account')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-pt-create-account');
      const username = document.getElementById('pt-modal-username')?.value.trim();
      const password = document.getElementById('pt-modal-password')?.value;
      if (!username || !password) return window.GymApp.toast('Vui lòng nhập đủ tên đăng nhập và mật khẩu.', 'error');
      btn.disabled = true;
      btn.innerHTML = '<span class="animate-spin material-symbols-outlined text-sm">sync</span> Đang tạo...';
      try {
        const res = await window.GymApp.api.post(`/members/${pt.id}/create-account`, { ten_dang_nhap: username, mat_khau: password });
        if (res.success) {
          window.GymApp.toast(`Đã tạo tài khoản "${username}" cho PT thành công!`, 'success');
          // Cập nhật cache và đóng modal
          pt.tai_khoan_id = res.data.tai_khoan_id;
          document.getElementById('gym-modal')?.remove();
        } else {
          window.GymApp.toast(res.message || 'Không thể tạo tài khoản.', 'error');
          btn.disabled = false;
          btn.innerHTML = '<span class="material-symbols-outlined text-sm">person_add</span> Tạo tài khoản';
        }
      } catch (e) {
        window.GymApp.toast('Lỗi kết nối máy chủ.', 'error');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">person_add</span> Tạo tài khoản';
      }
    });
  },

  // ===== MODAL CHỈNH SỬA PT =====
  _showPtEditModal: async function (id) {
    const self = this;
    let pt = null;
    try {
      const res = await window.GymApp.api.get(`/trainers/${id}`);
      pt = res?.data || null;
    } catch (_) { }
    if (!pt) {
      pt = (window.GymApp.data.pts || []).find(x => x.id === id);
    }
    if (!pt) { window.GymApp.toast('Không tìm thấy thông tin PT!', 'error'); return; }

    document.getElementById('gym-pt-edit-modal')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'gym-pt-edit-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);padding:16px;';

    const field = (label, fid, type, value, readonly = false) => `
      <div>
        <label class="text-on-surface-variant text-body-sm font-bold block mb-xs">${label}</label>
        <input id="pte-${fid}" type="${type}" value="${value || ''}" ${readonly ? 'readonly class="w-full bg-surface-container border border-outline-variant text-on-surface-variant px-standard py-compact rounded-xl outline-none cursor-not-allowed text-body-md"' : 'class="w-full bg-surface-container border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none text-body-md transition-colors"'} />
      </div>
    `;

    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:16px;width:100%;max-width:520px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 25px 60px rgba(0,0,0,0.3);">
        <div class="bg-surface-container-lowest px-loose py-standard border-b border-outline-variant flex items-center justify-between flex-shrink-0">
          <div class="flex items-center gap-compact">
            ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten, 'sm')}
            <div>
              <h3 class="font-bold text-on-surface" style="font-size:17px">Chỉnh sửa PT</h3>
              <p class="text-on-surface-variant text-body-sm">${pt.ma_ho_so || ''}</p>
            </div>
          </div>
          <button id="close-pt-edit-modal" style="background:transparent;border:none;cursor:pointer;">
            <span class="material-symbols-outlined text-on-surface-variant text-xl">close</span>
          </button>
        </div>
        <div class="bg-surface-container-lowest overflow-y-auto flex-1 p-loose flex flex-col gap-standard">
          ${field('Họ và tên *', 'ho_ten', 'text', pt.ho_ten)}
          ${field('Số điện thoại', 'so_dien_thoai', 'tel', pt.so_dien_thoai)}
          ${field('Email', 'email', 'email', pt.email)}
          ${field('Chuyên môn', 'chuyen_mon', 'text', pt.chuyen_mon || pt.specialty)}
          ${field('Kinh nghiệm (năm)', 'kinh_nghiem', 'number', pt.kinh_nghiem || 0)}
          <div>
            <label class="text-on-surface-variant text-body-sm font-bold block mb-xs">Ghi chú</label>
            <textarea id="pte-ghi_chu" rows="2" class="w-full bg-surface-container border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none text-body-md resize-none transition-colors">${pt.ghi_chu || ''}</textarea>
          </div>
        </div>
        <div class="bg-surface-container-lowest px-loose py-standard border-t border-outline-variant flex gap-standard justify-end flex-shrink-0">
          <button id="cancel-pt-edit" class="px-loose py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors">Hủy</button>
          <button id="save-pt-edit" class="px-loose py-compact rounded-xl font-bold text-white hover:opacity-90 transition-all" style="background:#1D9336;">
            <span class="material-symbols-outlined text-sm align-middle">save</span> Lưu thay đổi
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('close-pt-edit-modal').addEventListener('click', close);
    document.getElementById('cancel-pt-edit').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('save-pt-edit').addEventListener('click', async () => {
      const btn = document.getElementById('save-pt-edit');
      const ho_ten = document.getElementById('pte-ho_ten').value.trim();
      if (!ho_ten) { window.GymApp.toast('Họ tên không được để trống!', 'error'); return; }

      btn.disabled = true;
      btn.innerHTML = '<span class="animate-spin material-symbols-outlined text-sm">sync</span> Đang lưu...';
      try {
        await window.GymApp.api.put(`/trainers/${id}`, {
          ho_ten,
          so_dien_thoai: document.getElementById('pte-so_dien_thoai').value.trim(),
          email: document.getElementById('pte-email').value.trim(),
          chuyen_mon: document.getElementById('pte-chuyen_mon').value.trim(),
          kinh_nghiem: parseInt(document.getElementById('pte-kinh_nghiem').value) || 0,
          ghi_chu: document.getElementById('pte-ghi_chu').value.trim(),
        });
        window.GymApp.toast('Đã cập nhật thông tin PT thành công!', 'success');
        if (window.GymApp.fetchInitialData) await window.GymApp.fetchInitialData();
        const c = document.getElementById('pt-cards-container');
        if (c) { c.innerHTML = self._renderPtCards(); self._bindPtCardEvents(); }
        close();
      } catch (err) {
        window.GymApp.toast(err.message || 'Lỗi khi lưu thông tin PT', 'error');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm align-middle">save</span> Lưu thay đổi';
      }
    });
  },

  // ===== FILTER MODAL HỘI VIÊN =====
  _showFilterModal: function () {
    const self = this;
    document.getElementById('gym-filter-modal')?.remove();

    // Lấy danh sách gói tập thực tế đang kích hoạt từ danh sách hội viên
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
        <!-- Header -->
        <div class="flex items-center justify-between px-loose py-standard border-b border-outline-variant flex-shrink-0" style="background:linear-gradient(135deg, #1a5e2a, #1D9336);">
          <div class="flex items-center gap-compact">
            <span class="material-symbols-outlined text-white text-lg">filter_alt</span>
            <h3 class="text-white font-bold" style="font-size:16px;">Bộ lọc dữ liệu — Hội viên</h3>
          </div>
          <button id="close-filter-modal" class="material-symbols-outlined text-white/80 hover:text-white text-xl p-atom rounded hover:bg-white/10 transition-colors" style="background:transparent;border:none;cursor:pointer;">close</button>
        </div>

        <!-- Body -->
        <div class="overflow-y-auto flex-1 px-loose py-standard flex flex-col gap-standard">
          
          <!-- Trạng thái -->
          <div class="border-b border-outline-variant/60 pb-standard">
            <div class="flex items-center gap-xs mb-compact">
              <span class="material-symbols-outlined text-brand-primary text-base">donut_large</span>
              <h4 class="text-on-surface font-bold text-body-sm uppercase tracking-wider">Trạng thái hội viên</h4>
            </div>
            <div class="grid grid-cols-2 gap-xs bg-surface-container-lowest p-compact rounded-xl border border-outline-variant/40">
              ${radioGroup('f-status', [
                ['', 'Tất cả'],
                ['con_han', 'Còn hạn'],
                ['sap_het_han', 'Sắp hết hạn'],
                ['het_han', 'Đã hết hạn'],
                ['chua_dang_ky', 'Chưa đăng ký']
              ], self._filterState.status)}
            </div>
          </div>

          <!-- Gói tập -->
          <div class="border-b border-outline-variant/60 pb-standard">
            <div class="flex items-center gap-xs mb-compact">
              <span class="material-symbols-outlined text-brand-primary text-base">card_membership</span>
              <h4 class="text-on-surface font-bold text-body-sm uppercase tracking-wider">Gói tập kích hoạt</h4>
            </div>
            <div class="grid grid-cols-2 gap-xs bg-surface-container-lowest p-compact rounded-xl border border-outline-variant/40 max-h-40 overflow-y-auto">
              ${radioGroup('f-pkg', [['', 'Tất cả'], ...packages.map(p => [p, p])], self._filterState.pkg)}
            </div>
          </div>

          <!-- Dịch vụ PT -->
          <div class="border-b border-outline-variant/60 pb-standard">
            <div class="flex items-center gap-xs mb-compact">
              <span class="material-symbols-outlined text-brand-primary text-base">sports_gymnastics</span>
              <h4 class="text-on-surface font-bold text-body-sm uppercase tracking-wider">Dịch vụ Huấn luyện viên</h4>
            </div>
            <div class="grid grid-cols-2 gap-xs bg-surface-container-lowest p-compact rounded-xl border border-outline-variant/40">
              ${radioGroup('f-hasPt', [
                ['', 'Tất cả'],
                ['yes', 'Đang có PT'],
                ['no', 'Tự tập (Không PT)']
              ], self._filterState.hasPt)}
            </div>
          </div>

          <!-- Check-in hôm nay -->
          <div class="border-b border-outline-variant/60 pb-standard">
            <div class="flex items-center gap-xs mb-compact">
              <span class="material-symbols-outlined text-brand-primary text-base">how_to_reg</span>
              <h4 class="text-on-surface font-bold text-body-sm uppercase tracking-wider">Check-in hôm nay</h4>
            </div>
            <div class="grid grid-cols-2 gap-xs bg-surface-container-lowest p-compact rounded-xl border border-outline-variant/40">
              ${radioGroup('f-checkinToday', [
                ['', 'Tất cả'],
                ['yes', 'Đã Check-in'],
                ['no', 'Chưa Check-in']
              ], self._filterState.checkinToday)}
            </div>
          </div>

          <!-- Giới tính -->
          <div>
            <div class="flex items-center gap-xs mb-compact">
              <span class="material-symbols-outlined text-brand-primary text-base">wc</span>
              <h4 class="text-on-surface font-bold text-body-sm uppercase tracking-wider">Giới tính</h4>
            </div>
            <div class="flex gap-standard bg-surface-container-lowest p-compact rounded-xl border border-outline-variant/40">
              ${radioGroup('f-gender', [['', 'Tất cả'], ['Nam', 'Nam'], ['Nữ', 'Nữ']], self._filterState.gender)}
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="flex gap-standard px-loose py-standard border-t border-outline-variant bg-surface-container-lowest flex-shrink-0">
          <button id="filter-reset-btn" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md cursor-pointer">Đặt lại</button>
          <button id="filter-apply-btn" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90 cursor-pointer shadow-md" style="background:#1D9336;">Áp dụng bộ lọc</button>
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
      self._filterState.pkg = overlay.querySelector('input[name="f-pkg"]:checked')?.value || '';
      self._filterState.status = overlay.querySelector('input[name="f-status"]:checked')?.value || '';
      self._filterState.gender = overlay.querySelector('input[name="f-gender"]:checked')?.value || '';
      self._filterState.hasPt = overlay.querySelector('input[name="f-hasPt"]:checked')?.value || '';
      self._filterState.checkinToday = overlay.querySelector('input[name="f-checkinToday"]:checked')?.value || '';
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
            ${radioGroup('pt-f-status', [['', 'Tất cả'], ['active', 'Đang làm việc'], ['inactive', 'Nghỉ']], self._ptFilterState.status)}
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
    const count = (this._filterState.status ? 1 : 0) +
                  (this._filterState.pkg ? 1 : 0) +
                  (this._filterState.gender ? 1 : 0) +
                  (this._filterState.hasPt ? 1 : 0) +
                  (this._filterState.checkinToday ? 1 : 0);
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
    const { status, pkg, gender, hasPt, checkinToday } = this._filterState;
    const rawMembers = window.GymApp.data.members;
    const members = Array.isArray(rawMembers) ? rawMembers : [];
    this._memberFiltered = members.filter(m => {
      const matchQ = !q || (m.ho_ten || '').toLowerCase().includes(q) || (m.ma_ho_so || '').toLowerCase().includes(q) || (m.so_dien_thoai || '').includes(q);
      const matchStatus = !status || m.trang_thai === status;
      const matchPkg = !pkg || m.ten_goi_tap === pkg;
      
      // Giới tính ánh xạ linh hoạt hỗ trợ cả DB tiếng Anh và Việt
      let mGender = m.gioi_tinh;
      if (mGender === 'male' || mGender === 'nam') mGender = 'Nam';
      if (mGender === 'female' || mGender === 'nu') mGender = 'Nữ';
      const matchGender = !gender || mGender === gender;

      // Đang có PT
      const matchHasPt = !hasPt || (hasPt === 'yes' ? (m.co_pt > 0) : (m.co_pt == 0));

      // Check-in hôm nay
      const matchCheckinToday = !checkinToday || (checkinToday === 'yes' ? (m.da_check_in_hom_nay == 1) : (!m.da_check_in_hom_nay));

      return matchQ && matchStatus && matchPkg && matchGender && matchHasPt && matchCheckinToday;
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
    this._refreshPtCards();
    this._updatePtFilterUI();
    this._updatePtSortUI();
  },

  // ===== REFRESH =====
  _refreshMemberTable: function () {
    const c = document.getElementById('members-table-container');
    if (c) { c.innerHTML = this._renderMemberTable(); this._bindMemberTableEvents(); }
  },

  _refreshPtCards: function () {
    const c = document.getElementById('pt-cards-container');
    if (c) { c.innerHTML = this._renderPtCards(); this._bindPtCardEvents(); }
  },

  _bindMemberTableEvents: function () {
    const self = this;
    document.querySelectorAll('.member-name-link, .member-view-btn').forEach(el => {
      el.addEventListener('click', () => self._showMemberModal(el.dataset.id));
    });
    document.querySelectorAll('.member-edit-btn').forEach(el => {
      el.addEventListener('click', () => self._showEditModal(el.dataset.id));
    });
    document.querySelectorAll('.member-delete-btn').forEach(el => {
      el.addEventListener('click', () => self._confirmDeleteMember(el.dataset.id, el.dataset.name));
    });
  },

  _bindPtCardEvents: function () {
    const self = this;
    document.querySelectorAll('.pt-view-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        self._showPtModal(parseInt(el.dataset.id));
      });
    });
    document.querySelectorAll('.pt-edit-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        self._showPtEditModal(parseInt(el.dataset.id));
      });
    });
  },

  _showEditModal: async function (id) {
    const self = this;
    // Lấy thông tin mới nhất từ API
    let m = null;
    try {
      const res = await window.GymApp.api.get(`/members/${id}`);
      m = res?.data || null;
    } catch (_) { }
    if (!m) {
      m = (window.GymApp.data.members || []).find(x => x.id == id);
    }
    if (!m) { window.GymApp.toast('Không tìm thấy thông tin hội viên!', 'error'); return; }

    document.getElementById('gym-edit-member-modal')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'gym-edit-member-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);padding:16px;';

    const field = (icon, label, id, type, value, required = false, isFull = false) => `
      <div class="${isFull ? 'col-span-full' : ''}">
        <label class="text-on-surface-variant text-[11px] uppercase font-bold tracking-wider block mb-1 opacity-80">${label}${required ? ' <span class="text-error">*</span>' : ''}</label>
        <div class="relative group">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors text-[18px]">${icon}</span>
          <input id="em-${id}" type="${type}" value="${value || ''}" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-10 pr-4 py-2.5 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-[14px] font-medium transition-all" />
        </div>
      </div>
    `;

    const selectField = (icon, label, id, options, selectedValue, isFull = false) => `
      <div class="${isFull ? 'col-span-full' : ''}">
        <label class="text-on-surface-variant text-[11px] uppercase font-bold tracking-wider block mb-1 opacity-80">${label}</label>
        <div class="relative group">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors text-[18px] z-10">${icon}</span>
          <select id="em-${id}" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-10 pr-10 py-2.5 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-[14px] font-medium transition-all appearance-none cursor-pointer relative z-0">
            ${options.map(o => `<option value="${o.v}" ${o.v === selectedValue ? 'selected' : ''}>${o.l}</option>`).join('')}
          </select>
          <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none z-10">expand_more</span>
        </div>
      </div>
    `;

    overlay.innerHTML = `
      <div style="border-radius:24px;width:100%;max-width:560px;max-height:90vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 80px rgba(0,0,0,0.4);background:var(--md-sys-color-surface-container-lowest,#fff);position:relative;">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg, #1a5e2a 0%, #1D9336 60%, #22c55e 100%); padding:24px 24px 20px; flex-shrink:0; position:relative; overflow:hidden;">
          <div style="position:absolute; top:-30px; right:-30px; width:120px; height:120px; border-radius:50%; background:rgba(255,255,255,0.07);"></div>
          <div style="position:absolute; top:20px; right:60px; width:60px; height:60px; border-radius:50%; background:rgba(255,255,255,0.05);"></div>
          
          <button id="close-edit-member" style="position:absolute; top:16px; right:16px; background:rgba(255,255,255,0.15); border:none; cursor:pointer; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
            <span class="material-symbols-outlined" style="color:#fff;font-size:18px;">close</span>
          </button>

          <div style="display:flex; align-items:center; gap:16px; position:relative; z-index:1;">
            <div style="width:64px; height:64px; border-radius:50%; border:3px solid rgba(255,255,255,0.5); overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
              ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'lg')}
            </div>
            <div>
              <span style="font-size:11px; font-weight:800; color:rgba(255,255,255,0.8); text-transform:uppercase; letter-spacing:0.1em; background:rgba(0,0,0,0.2); padding:3px 8px; border-radius:999px;">Chỉnh sửa hồ sơ</span>
              <h3 style="font-size:22px; font-weight:800; color:#fff; margin:6px 0 2px; text-shadow:0 1px 3px rgba(0,0,0,0.2); line-height:1.2;">${m.ho_ten || '—'}</h3>
              <p style="font-size:13px; color:rgba(255,255,255,0.9); font-weight:600; margin:0;">${m.ma_ho_so || ''}</p>
            </div>
          </div>
        </div>

        <!-- Form Body -->
        <div style="overflow-y:auto; flex-1; padding:24px; display:flex; flex-direction:column; gap:20px; background:var(--md-sys-color-surface-container-lowest,#fff);">
          
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="material-symbols-outlined" style="color:#1D9336; font-size:18px;">person</span>
            <h4 style="font-size:14px; font-weight:800; color:var(--md-sys-color-on-surface); text-transform:uppercase; letter-spacing:0.05em; margin:0;">Thông tin cá nhân</h4>
            <div style="flex:1; height:1px; background:linear-gradient(to right, #1D933640, transparent);"></div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            ${field('badge', 'Họ và tên', 'ho_ten', 'text', m.ho_ten, true, true)}
            ${field('cake', 'Ngày sinh', 'ngay_sinh', 'date', m.ngay_sinh, false, false)}
            ${selectField('wc', 'Giới tính', 'gioi_tinh', [
      { v: '', l: '— Chọn giới tính —' },
      { v: 'nam', l: 'Nam' },
      { v: 'nu', l: 'Nữ' },
      { v: 'khac', l: 'Khác' }
    ], m.gioi_tinh === 'male' ? 'nam' : (m.gioi_tinh === 'female' ? 'nu' : m.gioi_tinh), false)}
          </div>

          <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
            <span class="material-symbols-outlined" style="color:#1D9336; font-size:18px;">contact_page</span>
            <h4 style="font-size:14px; font-weight:800; color:var(--md-sys-color-on-surface); text-transform:uppercase; letter-spacing:0.05em; margin:0;">Liên hệ</h4>
            <div style="flex:1; height:1px; background:linear-gradient(to right, #1D933640, transparent);"></div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            ${field('call', 'Số điện thoại', 'so_dien_thoai', 'tel', m.so_dien_thoai, false, false)}
            ${field('mail', 'Email', 'email', 'email', m.email, false, false)}
            ${field('location_on', 'Địa chỉ', 'dia_chi_tam_tru', 'text', m.dia_chi_tam_tru, false, true)}
          </div>

          <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
            <span class="material-symbols-outlined" style="color:#1D9336; font-size:18px;">note</span>
            <h4 style="font-size:14px; font-weight:800; color:var(--md-sys-color-on-surface); text-transform:uppercase; letter-spacing:0.05em; margin:0;">Ghi chú</h4>
            <div style="flex:1; height:1px; background:linear-gradient(to right, #1D933640, transparent);"></div>
          </div>

          <div>
            <div class="relative group">
              <span class="material-symbols-outlined absolute left-3 top-3 text-outline group-focus-within:text-brand-primary transition-colors text-[18px]">edit_note</span>
              <textarea id="em-ghi_chu" rows="3" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-10 pr-4 py-2.5 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-[14px] font-medium resize-none transition-all" placeholder="Ghi chú thêm về hội viên này...">${m.ghi_chu || ''}</textarea>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:16px 24px; border-top:1px solid var(--md-sys-color-outline-variant,#e2e8f0); display:flex; gap:12px; justify-content:flex-end; background:var(--md-sys-color-surface-container-lowest,#fff); flex-shrink:0;">
          <button id="cancel-edit-member" style="padding:10px 20px; border-radius:12px; font-weight:700; font-size:14px; border:1px solid var(--md-sys-color-outline-variant); color:var(--md-sys-color-on-surface-variant); background:transparent; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background='var(--md-sys-color-surface-container)'" onmouseout="this.style.background='transparent'">Hủy</button>
          <button id="save-edit-member" style="padding:10px 24px; border-radius:12px; font-weight:700; font-size:14px; border:none; color:#fff; background:linear-gradient(135deg, #1D9336, #22c55e); cursor:pointer; display:flex; align-items:center; gap:8px; box-shadow:0 4px 12px rgba(29,147,54,0.3); transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 16px rgba(29,147,54,0.4)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 12px rgba(29,147,54,0.3)';">
            <span class="material-symbols-outlined" style="font-size:18px;">save</span>Lưu thay đổi
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('close-edit-member').addEventListener('click', close);
    document.getElementById('cancel-edit-member').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('save-edit-member').addEventListener('click', async () => {
      const hoTen = document.getElementById('em-ho_ten').value.trim();
      if (!hoTen) { window.GymApp.toast('Họ tên không được để trống!', 'error'); return; }

      const btn = document.getElementById('save-edit-member');
      btn.disabled = true; btn.classList.add('opacity-50');

      try {
        const body = {
          ho_ten: hoTen,
          so_dien_thoai: document.getElementById('em-so_dien_thoai').value.trim() || null,
          email: document.getElementById('em-email').value.trim() || null,
          ngay_sinh: document.getElementById('em-ngay_sinh').value || null,
          gioi_tinh: document.getElementById('em-gioi_tinh').value || null,
          dia_chi_tam_tru: document.getElementById('em-dia_chi_tam_tru').value.trim() || null,
          ghi_chu: document.getElementById('em-ghi_chu').value.trim() || null,
        };
        const res = await window.GymApp.api.put(`/members/${id}`, body);
        if (res?.success) {
          window.GymApp.toast('Đã cập nhật thông tin hội viên!', 'success');
          close();
          await self._refreshMembersFromApi();
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
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);padding:16px;';
    overlay.innerHTML = `
      <div style="border-radius:16px;width:100%;max-width:400px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.3);" class="bg-surface-container-lowest">
        <div class="px-loose py-standard border-b border-outline-variant flex items-center gap-compact">
          <div class="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-error text-xl" style="font-variation-settings:'FILL' 1">person_remove</span>
          </div>
          <h3 class="font-bold text-on-surface" style="font-size:17px">Xác nhận xóa hội viên</h3>
        </div>
        <div class="p-loose flex flex-col gap-standard">
          <p class="text-on-surface text-body-md">Bạn có chắc chắn muốn xóa hội viên <strong class="text-error">${name}</strong> không?</p>
          <p class="text-on-surface-variant text-body-sm bg-surface-container rounded-xl px-standard py-compact border border-outline-variant">
            <span class="material-symbols-outlined text-sm align-middle text-[#e65100]">warning</span>
            Hành động này không thể hoàn tác. Toàn bộ dữ liệu liên quan đến hội viên sẽ bị ẩn khỏi hệ thống.
          </p>
          <div class="flex gap-standard justify-end pt-xs">
            <button id="cancel-del-member" class="px-loose py-compact rounded-xl font-bold text-body-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all">Hủy bỏ</button>
            <button id="confirm-del-member" class="bg-error text-white px-loose py-compact rounded-xl font-bold text-body-sm hover:opacity-80 transition-all flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">delete</span>Xóa hội viên
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('cancel-del-member').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('confirm-del-member').addEventListener('click', async () => {
      const btn = document.getElementById('confirm-del-member');
      btn.disabled = true; btn.classList.add('opacity-50');
      try {
        const res = await window.GymApp.api.delete(`/members/${id}`);
        if (res?.success) {
          window.GymApp.toast(`Đã xóa hội viên ${name}!`, 'success');
          close();
          await self._refreshMembersFromApi();
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

  _setupPgHandler: function () {
    const self = this;
    window.GymApp._pgHandler = function (pg) {
      if (self._tab === 'members') {
        self._memberPage = pg;
        self._refreshMemberTable();
      } else {
        self._ptPage = pg;
        self._refreshPtCards();
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
    this._bindPtCardEvents();

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => self._switchTab(btn.dataset.tab));
    });

    // Re-render tables with new data
    this._refreshMemberTable();
    this._refreshPtCards();

    self._switchTab(self._tab);

    // Search
    document.getElementById('member-search')?.addEventListener('input', () => self._applyMemberFilter());
    document.getElementById('pt-search')?.addEventListener('input', () => self._applyPtFilter());

    // --- Hội viên buttons ---
    document.getElementById('btn-view-all-members')?.addEventListener('click', () => {
      self._filterState = { status: '', pkg: '', gender: '', hasPt: '', checkinToday: '' };
      const s = document.getElementById('member-search');
      if (s) s.value = '';
      self._memberFiltered = [...window.GymApp.data.members];
      self._memberPage = 1;
      self._refreshMemberTable();
      self._updateFilterUI();
      window.GymApp.toast(`Hiển thị tất cả ${window.GymApp.data.members.length} hội viên`, 'info');
    });

    document.getElementById('btn-show-all')?.addEventListener('click', () => {
      self._filterState = { status: '', pkg: '', gender: '', hasPt: '', checkinToday: '' };
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
      self._refreshPtCards();
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
      self._refreshPtCards();
      self._updatePtFilterUI();
    });

    document.getElementById('btn-filter-pt')?.addEventListener('click', () => self._showPtFilterModal());
    document.getElementById('btn-sort-pt')?.addEventListener('click', () => self._showPtSortModal());
    self._updatePtSortUI();
  }
};
