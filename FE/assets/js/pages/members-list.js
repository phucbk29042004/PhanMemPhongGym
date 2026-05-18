window.GymApp.pages['members-list'] = {
  _tab: 'members',
  _memberPage: 1, _memberFiltered: [],
  _ptPage: 1, _ptFiltered: [],
  _perPage: 10,
  _filterState: { status: '', pkg: '', gender: '', hasPt: '', checkinToday: '' },
  _ptFilterState: { specialty: '', status: '' },
  _ptSortState: '',
  _memberSortState: '',
  _memberPackageHistory: {},

  render: function () {
    const rawMembers = window.GymApp.data.members;
    const rawPts = window.GymApp.data.pts;
    this._memberFiltered = Array.isArray(rawMembers) ? [...rawMembers] : [];
    this._ptFiltered = Array.isArray(rawPts) ? [...rawPts] : [];
    this._ptSortState = '';
    return `
        <div class="flex flex-col gap-standard animate-in fade-in duration-500">

        <!-- Top Header: Tabs & Add Action -->
        <div class="flex flex-wrap items-center justify-between gap-standard">
          <!-- Tab Bar -->
          <div class="flex p-1 bg-surface-container-low/50 backdrop-blur-sm rounded-2xl border border-outline-variant w-fit shadow-sm group">
            <button id="tab-members" class="tab-btn flex items-center gap-compact px-loose py-standard rounded-xl font-bold text-body-md transition-all duration-300 relative overflow-hidden" data-tab="members">
              <span class="material-symbols-outlined text-lg">groups</span>
              <span>Hội viên</span>
            </button>
            <button id="tab-pts" class="tab-btn flex items-center gap-compact px-loose py-standard rounded-xl font-bold text-body-md transition-all duration-300 relative overflow-hidden" data-tab="pts">
              <span class="material-symbols-outlined text-lg">sports_gymnastics</span>
              <span>Huấn luyện viên</span>
            </button>
          </div>

          <!-- Add Action -->
          <button class="bg-brand-primary text-white px-loose py-standard rounded-2xl font-bold hover:bg-[#187a2d] transition-all flex items-center gap-compact shadow-lg hover:shadow-brand-primary/20 hover:-translate-y-1 active:translate-y-0 active:shadow-sm" data-page="member-add">
            <span class="material-symbols-outlined text-xl">person_add</span>
            <span>Thêm hội viên mới</span>
          </button>
        </div>

        <!-- Main Content Area -->
        <div class="relative min-h-[500px]">
          
          <!-- Tab: Hội viên -->
          <div id="tab-content-members" class="tab-content animate-in slide-in-from-left-4 duration-500">
            <!-- Filter Bar -->
            <div class="flex flex-wrap items-center gap-standard bg-surface-container-lowest/90 backdrop-blur-xl p-standard rounded-2xl border border-outline-variant shadow-sm mb-standard transition-all hover:shadow-md">
              <!-- Search Box -->
              <div class="relative flex-1 group" style="min-width:300px;">
                <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors">search</span>
                <input id="member-search" class="w-full bg-surface-container/30 border border-outline-variant text-on-surface pl-11 pr-standard py-standard rounded-xl focus:border-brand-primary focus:bg-surface-container-lowest outline-none placeholder-outline-variant/60 font-body-md text-body-md transition-all shadow-inner focus:shadow-none" placeholder="Tìm theo tên, mã HV, số điện thoại..." type="text" />
              </div>
              
              <!-- Filter Actions -->
              <div class="flex items-center gap-compact">
                <button id="btn-view-all-members" class="group flex items-center gap-xs px-standard py-standard rounded-xl border border-outline-variant text-on-surface-variant text-body-sm font-bold hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all">
                  <span class="material-symbols-outlined text-sm transition-transform group-hover:rotate-12">format_list_bulleted</span>
                  <span>Xem tất cả</span>
                </button>
                
                <button id="btn-show-all" class="hidden items-center gap-xs px-standard py-standard rounded-xl border border-error/30 text-error text-body-sm font-bold hover:bg-error/5 transition-all">
                  <span class="material-symbols-outlined text-sm">filter_alt_off</span>
                  <span>Xóa lọc</span>
                </button>
                
                <button id="btn-filter" class="relative flex items-center gap-xs px-standard py-standard rounded-xl border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all group">
                  <span class="material-symbols-outlined text-sm transition-transform group-hover:scale-110">filter_alt</span>
                  <span class="text-body-sm font-bold">Lọc dữ liệu</span>
                  <span id="filter-badge" style="display:none;position:absolute;top:-8px;right:-8px;width:22px;height:22px;background:#1D9336;color:#fff;border-radius:50%;font-size:11px;align-items:center;justify-content:center;font-weight:800;box-shadow:0 2px 8px rgba(29,147,54,0.4);border:2px solid #fff;"></span>
                </button>
                
                <button id="btn-sort-member" class="relative flex items-center gap-xs px-standard py-standard rounded-xl border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all group">
                  <span class="material-symbols-outlined text-sm transition-transform group-hover:rotate-180 duration-500">sort</span>
                  <span class="text-body-sm font-bold">Sắp xếp</span>
                  <span id="member-sort-badge" style="display:none;position:absolute;top:-8px;right:-8px;width:22px;height:22px;background:#1D9336;color:#fff;border-radius:50%;font-size:11px;align-items:center;justify-content:center;font-weight:800;box-shadow:0 2px 8px rgba(29,147,54,0.4);border:2px solid #fff;">1</span>
                </button>
              </div>
            </div>

            <div id="members-table-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-standard">
              ${this._renderMemberTable()}
            </div>
          </div>

          <!-- Tab: PT / HLV -->
          <div id="tab-content-pts" class="tab-content hidden animate-in slide-in-from-right-4 duration-500">
            <div class="flex flex-wrap items-center gap-standard bg-surface-container-lowest/90 backdrop-blur-xl p-standard rounded-2xl border border-outline-variant shadow-sm mb-standard transition-all hover:shadow-md">
              <div class="relative flex-1 group" style="min-width:300px;">
                <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors">search</span>
                <input id="pt-search" class="w-full bg-surface-container/30 border border-outline-variant text-on-surface pl-11 pr-standard py-standard rounded-xl focus:border-brand-primary focus:bg-surface-container-lowest outline-none placeholder-outline-variant/60 font-body-md text-body-md transition-all shadow-inner focus:shadow-none" placeholder="Tìm theo tên, chuyên môn..." type="text" />
              </div>
              
              <div class="flex items-center gap-compact">
                <button id="btn-view-all-pts" class="group flex items-center gap-xs px-standard py-standard rounded-xl border border-outline-variant text-on-surface-variant text-body-sm font-bold hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all">
                  <span class="material-symbols-outlined text-sm transition-transform group-hover:rotate-12">format_list_bulleted</span>
                  <span>Xem tất cả</span>
                </button>
                
                <button id="btn-show-all-pt" class="hidden items-center gap-xs px-standard py-standard rounded-xl border border-error/30 text-error text-body-sm font-bold hover:bg-error/5 transition-all">
                  <span class="material-symbols-outlined text-sm">filter_alt_off</span>
                  <span>Xóa lọc</span>
                </button>
                
                <button id="btn-filter-pt" class="relative flex items-center gap-xs px-standard py-standard rounded-xl border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all group">
                  <span class="material-symbols-outlined text-sm transition-transform group-hover:scale-110">filter_alt</span>
                  <span class="text-body-sm font-bold">Lọc</span>
                  <span id="pt-filter-badge" style="display:none;position:absolute;top:-8px;right:-8px;width:22px;height:22px;background:#1D9336;color:#fff;border-radius:50%;font-size:11px;align-items:center;justify-content:center;font-weight:800;box-shadow:0 2px 8px rgba(29,147,54,0.4);border:2px solid #fff;"></span>
                </button>
                
                <button id="btn-sort-pt" class="relative flex items-center gap-xs px-standard py-standard rounded-xl border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all group">
                  <span class="material-symbols-outlined text-sm transition-transform group-hover:rotate-180 duration-500">sort</span>
                  <span class="text-body-sm font-bold">Sắp xếp</span>
                  <span id="pt-sort-badge" style="display:none;position:absolute;top:-8px;right:-8px;width:22px;height:22px;background:#1D9336;color:#fff;border-radius:50%;font-size:11px;align-items:center;justify-content:center;font-weight:800;box-shadow:0 2px 8px rgba(29,147,54,0.4);border:2px solid #fff;">1</span>
                </button>
              </div>
            </div>
            <div id="pt-cards-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-standard">
              ${this._renderPtCards()}
            </div>
          </div>

          </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-standard mt-standard">
          ${(function () {
        const stats = window.GymApp.data.stats?.hoi_vien || { tong: 0, con_han: 0, het_han: 0 };
        return [
          { label: 'Tổng số hội viên', value: stats.tong, color: 'text-on-surface', icon: 'groups', bg: 'bg-surface-container-low', border: 'border-outline-variant/50' },
          { label: 'Đang hoạt động', value: stats.con_han, color: 'text-brand-primary', icon: 'check_circle', bg: 'bg-brand-primary/10', border: 'border-brand-primary/20' },
          { label: 'Đã hết hạn', value: stats.het_han, color: 'text-error', icon: 'error', bg: 'bg-error/10', border: 'border-error/20' },
        ].map(s => `
              <div class="bg-surface-container-lowest/90 backdrop-blur-md p-standard rounded-3xl border ${s.border} shadow-sm flex items-center gap-standard transition-all hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
                <div class="w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-500 z-10">
                  <span class="material-symbols-outlined ${s.color} text-3xl">${s.icon}</span>
                </div>
                <div class="flex flex-col z-10">
                  <span class="text-on-surface-variant text-[11px] uppercase tracking-[0.1em] font-bold opacity-70">${s.label}</span>
                  <span class="${s.color} text-display-md font-black tracking-tight">${s.value}</span>
                </div>
              </div>
            `).join('');
      })()}
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
      const isCheckedIn = m.da_check_in_hom_nay == 1;
      const packageName = m.ten_goi_tap || 'Chưa đăng ký';
      const isExpired = m.trang_thai === 'het_han';
      
      return `
        <div class="group relative rounded-3xl overflow-hidden flex flex-col gap-standard
          shadow-sm hover:shadow-xl hover:shadow-[#1D9336]/15 hover:-translate-y-1.5 transition-all duration-500"
          style="background:linear-gradient(135deg,#f0fdf4 0%,#f7fef9 60%,#ffffff 100%);border:1.5px solid #bbf7d0;">
          <!-- Accent bar top -->
          <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#1D9336,#4ade80);border-radius:3px 3px 0 0;"></div>

          <!-- Card Header: Avatar & Quick Info -->
          <div class="flex items-start gap-standard pt-standard px-standard">
            <div class="relative flex-shrink-0">
              <div class="p-1 rounded-2xl border-2 transition-colors duration-500"
                style="background:#dcfce7;border-color:#86efac;">
                ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'lg')}
              </div>
              <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full shadow-sm"
                style="border:3px solid #f0fdf4;background:${isCheckedIn ? '#22c55e' : '#94a3b8'};${isCheckedIn ? 'animation:pulse 2s infinite;' : ''}"></span>
            </div>

            <div class="flex flex-col min-w-0 pt-1 flex-1">
              <div class="flex items-start justify-between gap-xs">
                <button class="member-name-link text-left font-bold text-body-lg truncate cursor-pointer block leading-tight transition-colors"
                  style="color:#14532d;" data-id="${m.id}" title="${m.ho_ten || 'Không rõ'}">
                  ${m.ho_ten || 'Không rõ'}
                </button>
                ${m.co_yeu_cau_gia_han ? `
                  <span class="flex items-center gap-[2px] text-[9px] px-1 rounded font-bold animate-pulse flex-shrink-0"
                    style="background:#fef9c3;color:#a16207;" title="Có yêu cầu gia hạn từ App">
                    <span class="material-symbols-outlined" style="font-size:11px">app_registration</span>APP
                  </span>
                ` : ''}
              </div>
              <span class="text-[11px] font-medium mt-0.5" style="color:#4ade80;letter-spacing:0.03em">${m.ma_ho_so || ''}</span>
            </div>
          </div>

          <!-- Info Grid -->
          <div class="grid grid-cols-2 gap-2 px-standard">
            <div class="flex flex-col p-2.5 rounded-2xl transition-colors duration-300"
              style="background:rgba(187,247,208,0.35);border:1px solid #bbf7d0;">
              <span class="text-[9px] uppercase font-bold tracking-widest mb-1" style="color:#166534;opacity:0.6">Gói tập</span>
              <span class="font-bold text-body-sm truncate" style="color:#14532d;" title="${packageName}">${packageName}</span>
            </div>
            <div class="flex flex-col p-2.5 rounded-2xl transition-colors duration-300"
              style="background:rgba(187,247,208,0.35);border:1px solid #bbf7d0;">
              <span class="text-[9px] uppercase font-bold tracking-widest mb-1" style="color:#166534;opacity:0.6">Trạng thái</span>
              <div class="flex">${window.GymApp.statusBadge(m.trang_thai)}</div>
            </div>
          </div>

          <!-- Actions Footer -->
          <div class="mt-auto px-standard pb-standard pt-compact flex items-center justify-end"
            style="border-top:1px solid #bbf7d0;">
            <div class="flex gap-1">
              <button class="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 member-view-btn shadow-sm"
                style="background:#dcfce7;color:#166534;" data-id="${m.id}" title="Xem chi tiết"
                onmouseover="this.style.background='#1D9336';this.style.color='#fff'"
                onmouseout="this.style.background='#dcfce7';this.style.color='#166534'">
                <span class="material-symbols-outlined text-lg">visibility</span>
              </button>
              <button class="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 member-edit-btn shadow-sm"
                style="background:#dcfce7;color:#166534;" data-id="${m.id}" title="Chỉnh sửa"
                onmouseover="this.style.background='#1D9336';this.style.color='#fff'"
                onmouseout="this.style.background='#dcfce7';this.style.color='#166534'">
                <span class="material-symbols-outlined text-lg">edit</span>
              </button>
              <button class="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 member-delete-btn shadow-sm"
                style="background:#fee2e2;color:#991b1b;" data-id="${m.id}" data-name="${m.ho_ten || 'hội viên này'}" title="Xóa"
                onmouseover="this.style.background='#dc2626';this.style.color='#fff'"
                onmouseout="this.style.background='#fee2e2';this.style.color='#991b1b'">
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

    const cards = paginated.map(pt => {
      const rating = pt.danh_gia || pt.rating || 0;
      const ratingDisplay = rating ? rating.toFixed(1) : '—';
      const isActive = pt.trang_thai === 'hoat_dong' || pt.trang_thai === 'active';
      
      return `
        <div class="group bg-surface-container-lowest/90 backdrop-blur-md rounded-3xl border border-outline-variant p-standard shadow-sm hover:shadow-2xl hover:shadow-brand-primary/10 hover:-translate-y-1.5 transition-all duration-500 flex flex-col gap-standard relative overflow-hidden">
          <!-- Card Header: Avatar & Quick Info -->
          <div class="flex items-start gap-standard">
            <div class="relative flex-shrink-0">
              <div class="p-1 rounded-2xl bg-surface-container-low border border-outline-variant/50 group-hover:border-brand-primary/30 transition-colors duration-500">
                ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten, 'lg')}
              </div>
              <span class="absolute -bottom-1 -right-1 w-5 h-5 border-4 border-white rounded-full ${isActive ? 'bg-green-500 shadow-sm shadow-green-200' : 'bg-outline'} shadow-sm"></span>
            </div>
            
            <div class="flex flex-col min-w-0 pt-1">
              <button class="pt-name-link text-left font-bold text-on-surface text-body-lg truncate group-hover:text-brand-primary transition-colors cursor-pointer block leading-tight" data-id="${pt.id}" title="${pt.ho_ten}">
                ${pt.ho_ten}
              </button>
            </div>
          </div>

          <!-- Info Grid -->
          <div class="grid grid-cols-2 gap-2">
            <div class="flex flex-col bg-surface-container-low/40 p-2.5 rounded-2xl border border-outline-variant/20 group-hover:bg-brand-primary/5 transition-colors duration-500">
              <span class="text-[9px] uppercase font-bold tracking-widest text-on-surface-variant opacity-50 mb-1">Chuyên môn</span>
              <span class="text-on-surface font-bold text-body-sm truncate">${pt.chuyen_mon || pt.specialty || 'Huấn luyện viên'}</span>
            </div>
            <div class="flex flex-col bg-surface-container-low/40 p-2.5 rounded-2xl border border-outline-variant/20 group-hover:bg-brand-primary/5 transition-colors duration-500">
              <span class="text-[9px] uppercase font-bold tracking-widest text-on-surface-variant opacity-50 mb-1">Kinh nghiệm</span>
              <span class="text-on-surface font-bold text-body-sm">${pt.kinh_nghiem || 0} năm</span>
            </div>
          </div>

          <div class="flex items-center px-1">
            <div class="flex items-center gap-2 bg-brand-primary/10 px-3 py-1.5 rounded-xl border border-brand-primary/20">
              <span class="material-symbols-outlined text-sm text-brand-primary" style="font-variation-settings:'FILL' 1">star</span>
              <span class="font-bold text-body-sm text-brand-primary">${ratingDisplay}</span>
            </div>
          </div>

          <!-- Actions Footer -->
          <div class="mt-auto pt-standard border-t border-outline-variant/30 flex items-center justify-end">
            <div class="flex gap-1">
              <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-brand-primary hover:text-white transition-all duration-300 pt-view-btn shadow-sm" data-id="${pt.id}" title="Xem chi tiết">
                <span class="material-symbols-outlined text-lg">visibility</span>
              </button>
              <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-brand-primary hover:text-white transition-all duration-300 pt-edit-btn shadow-sm" data-id="${pt.id}" title="Chỉnh sửa">
                <span class="material-symbols-outlined text-lg">edit</span>
              </button>
              <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-error hover:text-white transition-all duration-300 pt-delete-btn shadow-sm" data-id="${pt.id}" data-name="${pt.ho_ten}" title="Xóa">
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
        ${window.GymApp.renderPagination(self._ptPage, self._ptFiltered.length, self._perPage)}
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
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);padding:16px;';

    const rating = pt.danh_gia || pt.rating || 0;
    const isActive = pt.trang_thai === 'hoat_dong' || pt.trang_thai === 'active';
    const statusText = isActive ? '● Đang làm việc' : '○ Tạm nghỉ';
    const stars = Array.from({ length: 5 }, (_, i) =>
      `<span class="material-symbols-outlined" style="font-size:16px;color:${i < Math.round(rating) ? '#fbbf24' : 'rgba(255,255,255,0.3)'};font-variation-settings:'FILL' 1;">star</span>`
    ).join('');

    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:20px;width:100%;max-width:780px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;position:relative;box-shadow:0 32px 80px rgba(0,0,0,0.35);">

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
                <span style="font-size:12px;color:rgba(255,255,255,0.8);font-weight:600;">${pt.ma_ho_so || '—'}</span>
                <span style="width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.5);"></span>
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
        <div style="display:flex;background:var(--md-sys-color-surface-container-lowest,#f8faf8);border-bottom:1px solid var(--md-sys-color-outline-variant,#cdd8cb);flex-shrink:0;padding:0 16px;">
          ${[['info', 'Thông tin', 'info'], ['members', 'Học viên', 'people'], ['schedule', 'Lịch dạy', 'event_note']].map(([t, l, ic]) => `
            <button class="pt-detail-tab" data-ptab="${t}" style="display:flex;align-items:center;gap:6px;padding:12px 16px;font-size:13px;font-weight:700;border:none;background:transparent;cursor:pointer;border-bottom:2.5px solid transparent;transition:all 0.2s;color:var(--md-sys-color-on-surface-variant,#3f4a3c);white-space:nowrap;">
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
        btn.style.color = active ? '#10b981' : 'var(--md-sys-color-on-surface-variant,#3f4a3c)';
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
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
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
      <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#fff;">
        <div style="width:32px;height:32px;border-radius:8px;background:#eff8ff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span class="material-symbols-outlined" style="font-size:16px;color:#0ea5e9;font-variation-settings:'FILL' 1;">${icon}</span>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--md-sys-color-on-surface-variant,#3f4a3c);opacity:0.6;margin-bottom:2px;">${label}</div>
          <div style="font-size:13px;font-weight:700;color:var(--md-sys-color-on-surface,#1a2018);line-height:1.4;${wrap ? '' : 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'}" title="${value || '—'}">${value || '—'}</div>
        </div>
      </div>`;

    if (tab === 'info') {
      const hasAccount = !!pt.tai_khoan_id;
      return `
        ${sectionTitle('badge', 'Thông tin cá nhân')}
        <div style="border-radius:12px;border:1px solid var(--md-sys-color-outline-variant,#e0e5de);overflow:hidden;display:grid;grid-template-columns:1fr 1fr;gap:1px;background-color:var(--md-sys-color-outline-variant,#e0e5de);">
          ${infoRow('call', 'Số điện thoại', pt.so_dien_thoai || pt.phone)}
          ${infoRow('mail', 'Email', pt.email)}
          ${infoRow('sports_gymnastics', 'Chuyên môn', pt.chuyen_mon || pt.specialty)}
          ${infoRow('military_tech', 'Kinh nghiệm', `${pt.kinh_nghiem || 0} năm`)}
          ${infoRow('calendar_today', 'Ngày gia nhập', window.GymApp.formatDate(pt.ngay_tao || pt.joinDate))}
          ${infoRow('how_to_reg', 'Tổng buổi đã dạy', `${pt.tong_buoi_da_day || pt.sessions || 0} buổi`)}
          <div style="grid-column:1/-1;">${infoRow('edit_note', 'Ghi chú', pt.ghi_chu || '—', true)}</div>
        </div>

        ${sectionTitle('bar_chart', 'Thống kê')}
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
          ${[
          { icon: 'people', label: 'Học viên hiện tại', value: pt.so_hoc_vien || 0, color: '#0ea5e9', bg: '#eff8ff' },
          { icon: 'star', label: 'Đánh giá trung bình', value: (pt.danh_gia || pt.rating || 0).toFixed(1) + ' ★', color: '#f59e0b', bg: '#fffbeb' },
          { icon: 'play_lesson', label: 'Tổng buổi dạy', value: pt.tong_buoi_da_day || pt.sessions || 0, color: '#10b981', bg: '#f0fdf4' },
        ].map(s => `
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px;text-align:center;">
              <div style="width:40px;height:40px;border-radius:10px;background:${s.bg};display:flex;align-items:center;justify-content:center;margin:0 auto 8px;">
                <span class="material-symbols-outlined" style="color:${s.color};font-size:22px;font-variation-settings:'FILL' 1;">${s.icon}</span>
              </div>
              <div style="font-size:18px;font-weight:800;color:var(--md-sys-color-on-surface,#1a2018);">${s.value}</div>
              <div style="font-size:11px;color:#64748b;font-weight:600;margin-top:2px;">${s.label}</div>
            </div>
          `).join('')}
        </div>

        <div style="margin-top:16px;border:1px solid var(--md-sys-color-outline-variant,#e0e5de);border-radius:12px;overflow:hidden;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--md-sys-color-surface-container,#eff2ef);">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="material-symbols-outlined" style="font-size:16px;color:#0ea5e9;font-variation-settings:'FILL' 1;">manage_accounts</span>
              <span style="font-size:13px;font-weight:700;color:var(--md-sys-color-on-surface,#1a2018);">Tài khoản đăng nhập</span>
            </div>
            ${hasAccount
          ? `<span style="padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:#e7f5e9;color:#1D9336;">✓ Đã có tài khoản</span>`
          : `<span style="padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:#fff3e0;color:#e65100;">Chưa có tài khoản</span>`}
          </div>
          <div style="padding:12px 16px;background:var(--md-sys-color-surface-container-lowest,#fff);">
            ${hasAccount
          ? `<p style="font-size:13px;color:var(--md-sys-color-on-surface-variant,#3f4a3c);">PT này đã được liên kết với tài khoản đăng nhập.</p>`
          : `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;" id="pt-modal-account-form">
                  <div>
                    <label style="display:block;font-size:11px;font-weight:700;color:var(--md-sys-color-on-surface-variant);margin-bottom:4px;">Tên đăng nhập *</label>
                    <input id="pt-modal-username" type="text" value="${pt.so_dien_thoai || ''}" placeholder="Số điện thoại hoặc tên đăng nhập"
                      style="width:100%;padding:8px 12px;border:1px solid var(--md-sys-color-outline-variant);border-radius:8px;outline:none;font-size:13px;box-sizing:border-box;" />
                  </div>
                  <div>
                    <label style="display:block;font-size:11px;font-weight:700;color:var(--md-sys-color-on-surface-variant);margin-bottom:4px;">Mật khẩu *</label>
                    <input id="pt-modal-password" type="password" placeholder="Ít nhất 6 ký tự"
                      style="width:100%;padding:8px 12px;border:1px solid var(--md-sys-color-outline-variant);border-radius:8px;outline:none;font-size:13px;box-sizing:border-box;" />
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
          <div style="text-align:center;padding:60px 20px;color:var(--md-sys-color-on-surface-variant);background:#f8fafc;border-radius:16px;border:1px dashed #cbd5e1;">
            <span class="material-symbols-outlined" style="font-size:48px;opacity:0.3;display:block;margin-bottom:12px;">person_search</span>
            <p style="font-size:14px;font-weight:600;margin:0;">PT chưa có học viên nào</p>
          </div>`;
      }
      return `
        <div style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">
          <h4 style="font-size:14px;font-weight:800;color:var(--md-sys-color-on-surface);margin:0;">Danh sách học viên (${ptMembers.length})</h4>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
          ${ptMembers.map(m => {
        const isActive = m.trang_thai === 'con_han' || m.trang_thai === 'active' || m.trang_thai === 'dang_tap';
        const isCheckedIn = m.da_check_in_hom_nay == 1;
        return `
              <div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,0.03);transition:transform 0.2s,box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.03)'">
                <div style="position:relative;flex-shrink:0;">
                  ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'sm')}
                  <span style="position:absolute;bottom:0;right:0;width:10px;height:10px;border-radius:50%;background:${isCheckedIn ? '#4ade80' : '#94a3b8'};border:2px solid #fff;"></span>
                </div>
                <div style="flex:1;min-width:0;">
                  <button class="pt-member-link text-left" data-mid="${m.id}" style="font-size:13px;font-weight:700;color:var(--md-sys-color-on-surface);background:transparent;border:none;padding:0;cursor:pointer;display:block;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" onmouseover="this.style.color='#0ea5e9'" onmouseout="this.style.color='var(--md-sys-color-on-surface)'">
                    ${m.ho_ten || '—'}
                  </button>
                  <div style="font-size:11px;color:#64748b;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.ten_goi_tap || 'Chưa ĐK gói'}</div>
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
          <div style="text-align:center;padding:60px 20px;color:var(--md-sys-color-on-surface-variant);background:#f8fafc;border-radius:16px;border:1px dashed #cbd5e1;">
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
          <h4 style="font-size:14px;font-weight:800;color:var(--md-sys-color-on-surface);margin:0 0 4px;">Lịch dạy gần đây (${ptSchedules.length} buổi)</h4>
        </div>
        ${sortedDates.map(dateKey => {
        const dateObj = new Date(dateKey);
        const isPast = dateObj < today;
        const dateLabel = dateObj.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
        return `
            <div style="margin-bottom:20px;">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                <div style="padding:4px 12px;border-radius:999px;background:${isPast ? '#f1f5f9' : '#f0fdf4'};border:1px solid ${isPast ? '#e2e8f0' : '#bbf7d0'};">
                  <span style="font-size:12px;font-weight:700;color:${isPast ? '#64748b' : '#166534'};text-transform:capitalize;">${dateLabel}</span>
                </div>
                <div style="flex:1;height:1px;background:#e2e8f0;"></div>
              </div>
              ${grouped[dateKey].map(s => {
          const statusStr = s.trang_thai || s.status || 'cho_tap';
          return `
                  <div style="display:flex;align-items:stretch;gap:14px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:8px;box-shadow:0 2px 6px rgba(0,0,0,0.02);">
                    <div style="background:${isPast ? '#f1f5f9' : '#f0fdf4'};width:72px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 6px;border-right:1px dashed #e2e8f0;flex-shrink:0;">
                      <span style="font-size:22px;font-weight:800;color:${isPast ? '#475569' : '#166534'};line-height:1;">${String(dateObj.getDate()).padStart(2, '0')}</span>
                      <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:${isPast ? '#94a3b8' : '#16a34a'};margin-top:2px;">Tháng ${dateObj.getMonth() + 1}</span>
                    </div>
                    <div style="flex:1;padding:12px;display:flex;flex-direction:column;justify-content:center;">
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                        <div style="display:flex;align-items:center;gap:6px;">
                          <span class="material-symbols-outlined" style="font-size:15px;color:#64748b;">schedule</span>
                          <span style="font-size:13px;font-weight:800;color:#1e293b;">${s.gio_bat_dau || s.startTime || '—'} — ${s.gio_ket_thuc || s.endTime || '—'}</span>
                        </div>
                        ${window.GymApp.statusBadge(statusStr)}
                      </div>
                      <div style="display:flex;align-items:center;gap:14px;font-size:12px;color:#475569;flex-wrap:wrap;">
                        <span style="display:flex;align-items:center;gap:4px;"><span class="material-symbols-outlined" style="font-size:13px;opacity:0.7;">person</span>HV: <b>${s.ten_hoi_vien || s.memberName || '—'}</b></span>
                      </div>
                      ${s.ghi_chu ? `<div style="margin-top:5px;font-size:12px;color:#64748b;font-style:italic;">📝 ${s.ghi_chu}</div>` : ''}
                    </div>
                  </div>
                `;
        }).join('')}
            </div>
          `;
      }).join('')}
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

    document.getElementById('gym-pt-edit-modal')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'gym-pt-edit-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);padding:16px;';

    const field = (label, fid, type, value, readonly = false) => `
      <div>
        <label class="text-on-surface-variant text-body-sm font-bold block mb-xs">${label}</label>
        <input id="pte-${fid}" type="${type}" value="${value || ''}" ${readonly
        ? 'readonly class="w-full bg-surface-container border border-outline-variant text-on-surface-variant px-standard py-compact rounded-xl outline-none cursor-not-allowed text-body-md"'
        : 'class="w-full bg-surface-container border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none text-body-md transition-colors"'} />
      </div>
    `;

    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:16px;width:100%;max-width:520px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 25px 60px rgba(0,0,0,0.3);">
        <div style="background:linear-gradient(135deg,#065f46 0%,#10b981 60%,#34d399 100%);padding:16px 24px;flex-shrink:0;position:relative;overflow:hidden;" class="flex items-center justify-between">
          <div class="flex items-center gap-compact relative z-10">
            <div id="pte-avatar-container" class="relative group cursor-pointer" title="Nhấn để đổi ảnh đại diện">
              <div style="width:48px;height:48px;border-radius:50%;border:2px solid rgba(255,255,255,0.5);overflow:hidden;" id="pte-avatar-preview">
                ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten, 'lg', 'width:100%;height:100%;')}
              </div>
              <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="material-symbols-outlined text-white text-[16px]">photo_camera</span>
              </div>
              <input type="file" id="pte-avatar-input" accept="image/*" style="display:none;" />
            </div>
            <div>
              <h3 class="font-bold text-white" style="font-size:16px">Chỉnh sửa PT</h3>
              <p class="text-white/80 text-[11px] font-medium tracking-wide uppercase">${pt.ma_ho_so || ''}</p>
            </div>
          </div>
          <button id="close-pt-edit-modal" style="background:rgba(255,255,255,0.15);border:none;cursor:pointer;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative;z-index:10;">
            <span class="material-symbols-outlined text-white text-lg">close</span>
          </button>
        </div>
        <div class="bg-surface-container-lowest overflow-y-auto flex-1 p-loose flex flex-col gap-standard">
          ${field('Họ và tên *', 'ho_ten', 'text', pt.ho_ten)}
          ${field('Số điện thoại', 'so_dien_thoai', 'tel', pt.so_dien_thoai)}
          ${field('Email', 'email', 'email', pt.email)}
          ${field('Chuyên môn', 'chuyen_mon', 'text', pt.chuyen_mon || pt.specialty)}
          ${field('Kinh nghiệm (năm)', 'kinh_nghiem', 'number', pt.kinh_nghiem || 0)}
          <div>
            <label class="text-on-surface-variant text-body-sm font-bold block mb-xs">Trạng thái</label>
            <select id="pte-trang_thai" class="w-full bg-surface-container border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none text-body-md transition-colors">
              <option value="hoat_dong" ${(pt.trang_thai === 'hoat_dong' || pt.trang_thai === 'active') ? 'selected' : ''}>Đang làm việc</option>
              <option value="tam_nghi" ${(pt.trang_thai === 'tam_nghi' || pt.trang_thai === 'inactive') ? 'selected' : ''}>Tạm nghỉ</option>
            </select>
          </div>
          <div>
            <label class="text-on-surface-variant text-body-sm font-bold block mb-xs">Ghi chú</label>
            <textarea id="pte-ghi_chu" rows="2" class="w-full bg-surface-container border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none text-body-md resize-none transition-colors">${pt.ghi_chu || ''}</textarea>
          </div>
        </div>
        <div class="bg-surface-container-lowest px-loose py-standard border-t border-outline-variant flex gap-standard justify-end flex-shrink-0">
          <button id="cancel-pt-edit" class="px-loose py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors">Hủy</button>
          <button id="save-pt-edit" class="px-loose py-compact rounded-xl font-bold text-white hover:opacity-90 transition-all" style="background:#10b981;">
            <span class="material-symbols-outlined text-sm align-middle">save</span> Lưu thay đổi
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
        document.getElementById('pte-avatar-preview').innerHTML = `<img src="${re.target.result}" style="width:100%;height:100%;object-fit:cover;" />`;
      };
      reader.readAsDataURL(file);
    });

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
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);padding:16px;';

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
        <div style="background:linear-gradient(135deg,#1a5e2a 0%,#1D9336 60%,#22c55e 100%);padding:20px 24px 0;flex-shrink:0;position:relative;overflow:hidden;">
          <div style="position:absolute;top:-30px;right:-30px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.07);"></div>
          <div style="position:absolute;top:20px;right:60px;width:70px;height:70px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>
          <button id="close-member-modal" style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,0.15);border:none;cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'" title="Đóng">
            <span class="material-symbols-outlined" style="color:#fff;font-size:18px;">close</span>
          </button>
          <div style="display:flex;align-items:flex-end;gap:16px;margin-bottom:16px;">
            <div style="position:relative;flex-shrink:0;">
              <div style="width:72px;height:72px;border-radius:50%;border:3px solid rgba(255,255,255,0.6);overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.25);">
                ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'lg', 'width:100%;height:100%;')}
              </div>
              <span style="position:absolute;bottom:2px;right:2px;width:14px;height:14px;border-radius:50%;background:${isCheckedIn ? '#4ade80' : '#94a3b8'};border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></span>
            </div>
            <div style="flex:1;min-width:0;padding-bottom:4px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <h3 style="font-size:20px;font-weight:800;color:#fff;line-height:1.2;margin:0 0 4px;text-shadow:0 1px 4px rgba(0,0,0,0.2);">${m.ho_ten || '—'}</h3>
                ${m.co_yeu_cau_gia_han ? `
                  <span style="display:flex;align-items:center;gap:2px;background:rgba(255,193,7,0.3);color:#ffc107;font-size:10px;padding:2px 6px;border-radius:6px;font-weight:800;backdrop-filter:blur(4px);border:1px solid rgba(255,193,7,0.5);margin-bottom:4px;" class="animate-pulse">
                    <span class="material-symbols-outlined" style="font-size:12px;">app_registration</span>APP
                  </span>
                ` : ''}
              </div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span style="font-size:12px;color:rgba(255,255,255,0.8);font-weight:600;">${m.ma_ho_so || '—'}</span>
                <span style="width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.5);"></span>
                <span style="font-size:12px;color:rgba(255,255,255,0.8);">${window.GymApp.formatEnumLabel(m.loai_ho_so || 'hoi_vien')}</span>
                <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:${isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};color:#fff;border:1px solid rgba(255,255,255,0.3);">${statusText}</span>
              </div>
            </div>
          </div>
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
        <div style="display:flex;background:var(--md-sys-color-surface-container-lowest,#f8faf8);border-bottom:1px solid var(--md-sys-color-outline-variant,#cdd8cb);flex-shrink:0;padding:0 16px;">
          ${[['info', 'Thông tin', 'info'], ['package', 'Gói tập', 'fitness_center'], ['schedule', 'Lịch PT', 'event_note']].map(([t, l, ic]) => `
            <button class="member-detail-tab" data-mtab="${t}" style="display:flex;align-items:center;gap:6px;padding:12px 16px;font-size:13px;font-weight:700;border:none;background:transparent;cursor:pointer;border-bottom:2.5px solid transparent;transition:all 0.2s;color:var(--md-sys-color-on-surface-variant,#3f4a3c);white-space:nowrap;">
              <span class="material-symbols-outlined" style="font-size:16px;">${ic}</span>${l}
            </button>
          `).join('')}
        </div>
        <div id="member-modal-body" style="overflow-y:auto;flex:1;padding:20px 24px;" class="bg-surface-container-lowest"></div>
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
      self._bindMemberTabEvents(t, m, () => refreshAndSetTab(t), pkgHistory);
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

  _packageStatusBadge: function (status) {
    const dbMap = {
      'dang_hoat_dong': 'Đang hoạt động', 'het_han': 'Hết hạn', 'da_huy': 'Đã hủy',
      'da_ket_thuc': 'Đã kết thúc', 'dang_cho': 'Đang chờ', 'cho_duyet': 'Đang chờ',
      'cho_kich_hoat': 'Chờ kích hoạt', 'paid': 'Đã thanh toán', 'debt': 'Còn nợ', 'free': 'Miễn phí',
    };
    status = dbMap[status] || window.GymApp.formatEnumLabel(status);
    const palette = {
      'Đang hoạt động': ['#e7f5e9', '#1D9336'], 'Đã thanh toán': ['#e7f5e9', '#1D9336'],
      'Còn nợ': ['#fff2cc', '#7a5b00'], 'Miễn phí': ['#e0f2fe', '#0369a1'],
      'Sắp tới': ['#e8def8', '#6750a4'], 'Hết hạn': ['#ffdad6', '#ba1a1a'],
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
        <div style="margin-top:16px;border:1px solid var(--md-sys-color-outline-variant,#e0e5de);border-radius:12px;overflow:hidden;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--md-sys-color-surface-container,#eff2ef);">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="material-symbols-outlined" style="font-size:16px;color:#1D9336;font-variation-settings:'FILL' 1;">manage_accounts</span>
              <span style="font-size:13px;font-weight:700;color:var(--md-sys-color-on-surface,#1a2018);">Tài khoản đăng nhập</span>
            </div>
            ${hasAccount
          ? `<span style="padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:#e7f5e9;color:#1D9336;">✓ Đã có tài khoản</span>`
          : `<span style="padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:#fff3e0;color:#e65100;">Chưa có tài khoản</span>`}
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
                      <span class="material-symbols-outlined text-sm">person_add</span>Tạo tài khoản
                    </button>
                  </div>
                </div>`}
          </div>
        </div>
      `;
    }

    if (tab === 'package') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const activePkg = Array.isArray(m.goi_tap_hien_tai) && m.goi_tap_hien_tai.length > 0 ? m.goi_tap_hien_tai[0] : null;
      const upcomingPackages = pkgHistory.filter(p => new Date(p.tu_ngay || p.from) > today && p.trang_thai !== 'huy');
      const pastPackages = pkgHistory.filter(p => new Date(p.tu_ngay || p.from) <= today || p.trang_thai === 'huy');

      const _actionBtns = (p, dark = false) => {
        if (p.trang_thai === 'huy' || p.trang_thai === 'het_han') return '';
        const base = dark
          ? 'background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:#fff;'
          : 'background:var(--md-sys-color-surface-container,#f1f5f9);border:1px solid var(--md-sys-color-outline-variant,#e2e8f0);color:var(--md-sys-color-on-surface-variant,#475569);';
        const danger = dark
          ? 'background:rgba(220,38,38,0.25);border:1px solid rgba(255,100,100,0.3);color:#fca5a5;'
          : 'background:#fef2f2;border:1px solid #fecaca;color:#dc2626;';
        const blue = dark
          ? 'background:rgba(99,179,237,0.2);border:1px solid rgba(147,210,255,0.3);color:#bfdbfe;'
          : 'background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;';
        const btn = (cls, icon, label, style) =>
          `<button class="${cls}" data-pkg-id="${p.id}" data-member-id="${m.id}"
            style="display:inline-flex;align-items:center;gap:3px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;${style}">
            <span class="material-symbols-outlined" style="font-size:13px;">${icon}</span>${label}
          </button>`;
        return `<div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap;">
          ${btn('btn-edit-pkg',   'edit',       'Sửa',     base)}
          ${btn('btn-switch-pkg', 'swap_horiz', 'Đổi gói', blue)}
          ${btn('btn-cancel-pkg', 'cancel',     'Hủy gói', danger)}
        </div>`;
      };

      const renderPkgCard = (p, type) => {
        const isUpcoming = type === 'upcoming';
        const isCanceled = p.trang_thai === 'huy';
        const accentColor = isCanceled ? '#dc2626' : (isUpcoming ? '#d97706' : '#94a3b8');
        const accentBg    = isCanceled ? '#fef2f2' : (isUpcoming ? '#fef9ec' : '#f8fafc');
        const borderColor = isCanceled ? '#fecaca' : (isUpcoming ? '#fde68a' : '#e2e8f0');
        const icon        = isCanceled ? 'cancel'  : (isUpcoming ? 'schedule' : 'history');
        return `
          <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:#fff;border:1px solid ${borderColor};border-left:3px solid ${accentColor};border-radius:10px;margin-bottom:8px;">
            <span class="material-symbols-outlined" style="font-size:18px;color:${accentColor};margin-top:1px;flex-shrink:0;">${icon}</span>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <span style="font-size:13px;font-weight:800;color:var(--md-sys-color-on-surface,#1a2018);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.ten_goi || '—'}</span>
                ${this._packageStatusBadge(p.trang_thai || (isUpcoming ? 'Sắp tới' : 'Lịch sử'))}
              </div>
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:3px;font-size:11px;color:var(--md-sys-color-on-surface-variant,#64748b);">
                <span style="font-weight:600;">${window.GymApp.formatCurrency(p.gia_thuc_te || p.gia || 0)}</span>
                <span>${window.GymApp.formatDate(p.tu_ngay)} – ${window.GymApp.formatDate(p.den_ngay)}</span>
              </div>
              ${p.ly_do_huy ? `<div style="margin-top:3px;font-size:11px;color:#dc2626;font-style:italic;">${p.ly_do_huy}${p.so_tien_hoan > 0 ? ` · Hoàn: ${window.GymApp.formatCurrency(p.so_tien_hoan)}` : ''}</div>` : ''}
              ${p.ghi_chu_tt ? `<div style="margin-top:2px;font-size:11px;color:#94a3b8;font-style:italic;">${p.ghi_chu_tt}</div>` : ''}
              ${_actionBtns(p, false)}
            </div>
          </div>`;
      };

      const sectionLabel = (label) =>
        `<p class="text-body-sm font-bold text-on-surface-variant" style="text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">${label}</p>`;
      const emptyState = (msg) =>
        `<div style="text-align:center;padding:16px;background:var(--md-sys-color-surface-container,#f8fafc);border-radius:10px;border:1px dashed var(--md-sys-color-outline-variant,#cbd5e1);font-size:12px;color:var(--md-sys-color-on-surface-variant);">${msg}</div>`;

      return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <span class="text-body-md font-bold text-on-surface">Gói tập</span>
          <button id="btn-add-package" class="flex items-center gap-xs px-standard py-compact rounded-lg font-bold text-body-sm text-white transition-all hover:opacity-90" style="background:#1D9336;border:none;cursor:pointer;">
            <span class="material-symbols-outlined text-sm">add_circle</span>Đăng ký gói
          </button>
        </div>

        ${activePkg ? `
          <div style="background:linear-gradient(135deg,#14532d 0%,#1D9336 100%);border-radius:12px;padding:14px 16px;color:#fff;position:relative;overflow:hidden;margin-bottom:16px;">
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
          <div style="padding:16px;background:var(--md-sys-color-surface-container,#f8fafc);border:1px dashed var(--md-sys-color-outline-variant,#cbd5e1);border-radius:12px;text-align:center;margin-bottom:16px;">
            <span class="material-symbols-outlined text-on-surface-variant" style="font-size:28px;opacity:0.4;">fitness_center</span>
            <p style="font-size:13px;font-weight:700;color:var(--md-sys-color-on-surface-variant);margin:4px 0 0;">Chưa có gói tập đang hoạt động</p>
          </div>`}

        <div style="margin-bottom:16px;">
          ${sectionLabel('Sắp kích hoạt')}
          ${upcomingPackages.length === 0 ? emptyState('Không có gói sắp tới') : upcomingPackages.map(p => renderPkgCard(p, 'upcoming')).join('')}
        </div>
        <div>
          ${sectionLabel('Lịch sử')}
          ${pastPackages.length === 0 ? emptyState('Chưa có lịch sử gói tập') : pastPackages.map(p => renderPkgCard(p, 'history')).join('')}
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
        ? `<div style="text-align:center;padding:24px;background:#f8fafc;border-radius:12px;border:1px dashed #cbd5e1;font-size:13px;color:var(--md-sys-color-on-surface-variant);margin-bottom:16px;">Hội viên chưa đăng ký gói PT nào.</div>`
        : ptContracts.map(c => {
          const buoiConLai = (c.buoi_dang_ky || 0) - (c.buoi_da_tap || 0);
          const conHan = !c.den_ngay || new Date(c.den_ngay) >= today;
          const statusLabel = (!conHan) ? 'Hết hạn' : (buoiConLai <= 0 ? 'Hết buổi' : 'Đang hoạt động');
          const statusColor = statusLabel === 'Đang hoạt động' ? '#1D9336' : (statusLabel === 'Hết buổi' ? '#f59e0b' : '#ba1a1a');
          const bgStatus = statusLabel === 'Đang hoạt động' ? '#f0fdf4' : (statusLabel === 'Hết buổi' ? '#fffbeb' : '#fef2f2');
          return `
              <div style="display:flex;flex-direction:column;background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:16px;overflow:hidden;">
                <div style="padding:16px;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #e2e8f0;background:${bgStatus};">
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:40px;height:40px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;border:1px solid ${statusColor}30;">
                      <span class="material-symbols-outlined" style="color:${statusColor};">sports_gymnastics</span>
                    </div>
                    <div>
                      <h5 style="font-size:15px;font-weight:800;color:var(--md-sys-color-on-surface);margin:0 0 2px;">PT: ${c.ten_pt || '—'}</h5>
                      <div style="font-size:12px;color:var(--md-sys-color-on-surface-variant);">${c.chuyen_mon || 'Huấn luyện viên cá nhân'}</div>
                    </div>
                  </div>
                  <span style="padding:4px 10px;border-radius:999px;font-size:11px;font-weight:800;background:${statusColor}20;color:${statusColor};border:1px solid ${statusColor}40;">${statusLabel}</span>
                </div>
                <div style="padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:32px;height:32px;border-radius:8px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;">
                      <span class="material-symbols-outlined" style="font-size:16px;color:#64748b;">event</span>
                    </div>
                    <div>
                      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:2px;">Thời hạn</div>
                      <div style="font-size:13px;font-weight:700;color:#1e293b;">${c.den_ngay ? window.GymApp.formatDate(c.den_ngay) : 'Không giới hạn'}</div>
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:32px;height:32px;border-radius:8px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;">
                      <span class="material-symbols-outlined" style="font-size:16px;color:#64748b;">play_lesson</span>
                    </div>
                    <div>
                      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:2px;">Số buổi tập</div>
                      <div style="font-size:13px;font-weight:800;color:#1e293b;">
                        <span style="color:${buoiConLai > 0 ? '#1D9336' : '#ba1a1a'};font-size:15px;">${buoiConLai}</span> / ${c.buoi_dang_ky || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>`;
        }).join('');

      const scheduleRows = memberSchedules.length === 0
        ? `<div style="text-align:center;padding:24px;background:#f8fafc;border-radius:12px;border:1px dashed #cbd5e1;font-size:13px;color:var(--md-sys-color-on-surface-variant);">Chưa có lịch tập nào được đặt</div>`
        : memberSchedules.map(s => {
          const dateObj = new Date(s.ngay_tap || s.date);
          const isPast = dateObj < today;
          const statusStr = s.trang_thai || s.status || 'Chờ tập';
          return `
              <div style="display:flex;align-items:stretch;gap:16px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:12px;">
                <div style="background:${isPast ? '#f1f5f9' : '#f0fdf4'};width:80px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 8px;border-right:1px dashed #cbd5e1;flex-shrink:0;">
                  <span style="font-size:11px;font-weight:800;text-transform:uppercase;color:${isPast ? '#64748b' : '#166534'};margin-bottom:4px;">Tháng ${dateObj.getMonth() + 1}</span>
                  <span style="font-size:24px;font-weight:800;color:${isPast ? '#475569' : '#1D9336'};line-height:1;">${dateObj.getDate()}</span>
                </div>
                <div style="flex:1;padding:12px;display:flex;flex-direction:column;justify-content:center;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span class="material-symbols-outlined" style="font-size:16px;color:#64748b;">schedule</span>
                      <span style="font-size:13px;font-weight:800;color:#1e293b;">${s.gio_bat_dau || s.startTime} — ${s.gio_ket_thuc || s.endTime}</span>
                    </div>
                    ${window.GymApp.statusBadge(statusStr)}
                  </div>
                  <div style="font-size:12px;color:#475569;">PT: <b>${s.ten_pt || '—'}</b></div>
                  ${s.ghi_chu ? `<div style="margin-top:5px;font-size:12px;color:#64748b;font-style:italic;">📝 ${s.ghi_chu}</div>` : ''}
                </div>
              </div>`;
        }).join('');

      return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h4 style="font-size:16px;font-weight:800;color:var(--md-sys-color-on-surface);">Thông Tin Gói PT</h4>
          <button id="btn-add-pt-reg" style="display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;background:linear-gradient(135deg,#1D9336,#22c55e);color:#fff;font-weight:700;font-size:13px;border:none;cursor:pointer;">
            <span class="material-symbols-outlined" style="font-size:18px;">add_circle</span>Đăng ký PT
          </button>
        </div>
        ${ptContractsHTML}
        <div style="margin-top:32px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
          <h4 style="font-size:16px;font-weight:800;color:var(--md-sys-color-on-surface);">Lịch Tập Gần Đây</h4>
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
    }
  },

  // ===== MODAL THÊM GÓI TẬP — giữ nguyên =====
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
          <div><h3 class="font-bold text-on-surface" style="font-size:16px;">Thêm gói tập</h3><p class="text-on-surface-variant text-body-sm">Hội viên: <strong>${m.ho_ten || m.name}</strong></p></div>
          <button id="close-sub-modal" style="background:transparent;border:none;cursor:pointer;"><span class="material-symbols-outlined text-on-surface-variant text-xl">close</span></button>
        </div>
        <div class="p-loose bg-surface-container-lowest">
          <div class="grid grid-cols-2 gap-standard">
            <div style="grid-column:1/-1;">
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Tên gói tập ${REQ}</label>
              <select id="pkg-name" ${inputCls}><option value="">— Chọn gói tập —</option>${pkgNames.map(p => `<option value="${p.name}" data-price="${p.price}">${p.name}${p.price ? ' — ' + window.GymApp.formatCurrency(p.price) : ''}</option>`).join('')}</select>
            </div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Giá gói tập (VNĐ) ${REQ}</label><input id="pkg-price" type="text" inputmode="numeric" placeholder="VD: 1.500.000" ${inputCls} /></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Mã giảm giá</label><input id="pkg-discount-code" type="text" placeholder="Nhập mã (nếu có)..." ${inputCls} /></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Từ ngày ${REQ}</label><input id="pkg-from" type="date" value="${new Date().toISOString().split('T')[0]}" ${inputCls} /></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Đến ngày ${REQ}</label><input id="pkg-to" type="date" ${inputCls} /></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Trạng thái đăng ký ${REQ}</label><select id="pkg-reg-status" ${inputCls}><option value="paid">Đã thanh toán</option><option value="debt">Còn nợ</option><option value="free">Miễn phí</option></select></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Phương thức TT ${REQ}</label><select id="pkg-payment-method" ${inputCls}><option value="tien_mat">Tiền mặt</option><option value="chuyen_khoan">Chuyển khoản</option><option value="the">Thẻ</option><option value="momo">MoMo</option><option value="zalopay">ZaloPay</option><option value="khac">Khác</option></select></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Ngày thanh toán</label><input id="pkg-payment-date" type="date" value="${new Date().toISOString().split('T')[0]}" ${inputCls} /></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Cần thanh toán (VNĐ)</label><input id="pkg-need-pay" type="text" readonly class="bg-surface-container text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;cursor:not-allowed;" /></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Tiền khách đưa (VNĐ) ${REQ}</label><input id="pkg-paid" type="text" inputmode="numeric" placeholder="VD: 1.500.000" ${inputCls} /><p id="err-pkg-paid-modal" class="hidden" style="color:#ba1a1a;font-size:11px;margin-top:4px;font-weight:600;"></p></div>
            <div style="grid-column:1/-1;"><label class="block text-body-sm font-bold mb-xs" style="color:#93000a;">Khách nợ (VNĐ)</label><input id="pkg-debt" type="text" value="0" readonly style="width:100%;background:#ffdad6;border:1px solid #f2b8b5;color:#93000a;font-weight:700;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;cursor:not-allowed;" /></div>
            <div style="grid-column:1/-1;"><label class="block text-body-sm font-bold text-on-surface mb-xs">Ghi chú</label><textarea id="pkg-note" rows="3" placeholder="Ghi chú thêm..." class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;resize:vertical;font-family:inherit;"></textarea></div>
          </div>
          <div class="flex gap-standard mt-standard">
            <button id="pkg-cancel-btn" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Hủy</button>
            <button id="pkg-save-btn" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#1D9336;">Lưu gói tập</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('close-sub-modal').addEventListener('click', close);
    document.getElementById('pkg-cancel-btn').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.getElementById('pkg-name').addEventListener('change', function () {
      const name = this.value;
      const pkg = (window.GymApp.data.packages || []).find(p => (p.ten_goi || p.name) === name);
      if (!pkg) return;
      if (pkg.gia > 0) { document.getElementById('pkg-price').value = fmtVND(pkg.gia); calcDebt(); }
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
    });
    const fmtVND = n => n > 0 ? new Intl.NumberFormat('vi-VN').format(n) : '';
    const parseVND = s => parseInt((s || '').replace(/\./g, '').replace(/,/g, '')) || 0;

    function calcDebt() {
      const price = parseVND(document.getElementById('pkg-price').value);
      const discountCode = document.getElementById('pkg-discount-code').value.trim().toUpperCase();
      const discount = discountCode ? Math.round(price * 0.1) : 0;
      const need = Math.max(0, price - discount);
      const paid = parseVND(document.getElementById('pkg-paid').value);
      document.getElementById('pkg-need-pay').value = fmtVND(need);
      document.getElementById('pkg-debt').value = fmtVND(Math.max(0, need - paid));
    }

    const pkgPriceEl = document.getElementById('pkg-price');
    const pkgPaidEl = document.getElementById('pkg-paid');

    pkgPriceEl.addEventListener('focus', function () { const v = parseVND(this.value); this.value = v > 0 ? String(v) : ''; });
    pkgPriceEl.addEventListener('blur', function () { const v = parseVND(this.value); this.value = fmtVND(v); calcDebt(); });
    pkgPriceEl.addEventListener('input', calcDebt);

    pkgPaidEl.addEventListener('focus', function () { const v = parseVND(this.value); this.value = v > 0 ? String(v) : ''; });
    pkgPaidEl.addEventListener('blur', function () { const v = parseVND(this.value); this.value = fmtVND(v); calcDebt(); });
    pkgPaidEl.addEventListener('input', function () {
      calcDebt();
      const errEl = document.getElementById('err-pkg-paid-modal');
      if (errEl) errEl.classList.add('hidden');
      this.style.borderColor = '';
    });

    document.getElementById('pkg-discount-code').addEventListener('input', calcDebt);
    document.getElementById('pkg-save-btn').addEventListener('click', async () => {
      const name = document.getElementById('pkg-name').value;
      const price = parseVND(document.getElementById('pkg-price').value);
      const from = document.getElementById('pkg-from').value;
      const to = document.getElementById('pkg-to').value;
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
      hlField('pkg-price', !price);
      hlField('pkg-from', !from);
      hlField('pkg-to', !to);
      hlField('pkg-reg-status', !regStatus);
      const paidMissing = !paidVal;
      if (paidMissing) {
        if (paidErrEl) { paidErrEl.textContent = 'Vui lòng nhập số tiền khách đưa'; paidErrEl.classList.remove('hidden'); }
        if (paidInput) paidInput.style.borderColor = '#ba1a1a';
      } else {
        if (paidErrEl) paidErrEl.classList.add('hidden');
        if (paidInput) paidInput.style.borderColor = '';
      }

      if (!name || !price || !from || !to || !regStatus || paidMissing) { window.GymApp.toast('Vui lòng điền đầy đủ các trường bắt buộc (*)', 'error'); return; }
      const pkg = (window.GymApp.data.packages || []).find(p => (p.ten_goi || p.name) === name);
      if (!pkg) { window.GymApp.toast('Gói tập không hợp lệ', 'error'); return; }
      try {
        await window.GymApp.api.post(`/members/${m.id}/package`, {
          goi_tap_id: pkg.id, tu_ngay: from, gia_thuc_te: price,
          phuong_thuc_tt: document.getElementById('pkg-payment-method').value,
          ghi_chu_tt: document.getElementById('pkg-note').value.trim(),
          ma_giao_dich: document.getElementById('pkg-discount-code').value.trim()
        });
        window.GymApp.toast('Đăng ký gói tập thành công!', 'success');
        if (window.GymApp.fetchInitialData) await window.GymApp.fetchInitialData();
        self._applyMemberFilter();
        close();
        if (typeof onSaved === 'function') onSaved();
      } catch (err) { window.GymApp.toast(err.message || 'Lỗi khi lưu gói tập', 'error'); }
    });
  },

  // ===== MODAL HỦY GÓI TẬP =====
  _showCancelPackageModal: function (m, pkg, onSaved) {
    document.getElementById('gym-sub-modal')?.remove();
    const iCls = `class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;"`;
    const overlay = document.createElement('div');
    overlay.id = 'gym-sub-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);padding:16px;';
    overlay.innerHTML = `
      <div class="modal-card bg-surface-container-lowest" style="border-radius:16px;width:100%;max-width:400px;position:relative;box-shadow:0 30px 80px rgba(0,0,0,0.4);">
        <div class="border-b border-outline-variant px-loose py-standard flex items-center justify-between">
          <div>
            <h3 class="font-bold text-on-surface" style="font-size:16px;margin:0;">Hủy gói tập</h3>
            <p class="text-on-surface-variant text-body-sm" style="margin:2px 0 0;">Gói: <strong>${pkg.ten_goi}</strong></p>
          </div>
          <button id="cancel-pkg-close" style="background:transparent;border:none;cursor:pointer;"><span class="material-symbols-outlined text-on-surface-variant text-xl">close</span></button>
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
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    const _cParseVND = s => parseInt((s || '').replace(/\./g, '').replace(/,/g, '')) || 0;
    const _cFmtVND = n => n > 0 ? new Intl.NumberFormat('vi-VN').format(n) : '';
    const cancelRefundEl = overlay.querySelector('#cancel-pkg-refund');
    cancelRefundEl?.addEventListener('focus', function () { const v = _cParseVND(this.value); this.value = v > 0 ? String(v) : ''; });
    cancelRefundEl?.addEventListener('blur', function () { this.value = _cFmtVND(_cParseVND(this.value)); });
    overlay.querySelector('#cancel-pkg-confirm').addEventListener('click', async () => {
      const ly_do_huy = overlay.querySelector('#cancel-pkg-reason').value.trim();
      const so_tien_hoan = _cParseVND(overlay.querySelector('#cancel-pkg-refund').value);
      try {
        await window.GymApp.api.patch(`/members/${m.id}/package/${pkg.id}/cancel`, { ly_do_huy, so_tien_hoan });
        window.GymApp.toast('Đã hủy gói tập thành công!', 'success');
        close();
        if (typeof onSaved === 'function') onSaved();
      } catch (err) { window.GymApp.toast(err.message || 'Lỗi khi hủy gói tập', 'error'); }
    });
  },

  // ===== MODAL CHỈNH SỬA GÓI TẬP =====
  _showEditPackageModal: function (m, pkg, onSaved) {
    document.getElementById('gym-sub-modal')?.remove();
    const d0 = s => s ? s.substring(0, 10) : '';
    const iCls = `class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;"`;
    const PM = {tien_mat:'Tiền mặt',chuyen_khoan:'Chuyển khoản',the:'Thẻ',momo:'MoMo',zalopay:'ZaloPay',khac:'Khác'};
    const overlay = document.createElement('div');
    overlay.id = 'gym-sub-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);padding:16px;';
    overlay.innerHTML = `
      <div class="modal-card bg-surface-container-lowest" style="border-radius:16px;width:100%;max-width:420px;position:relative;box-shadow:0 30px 80px rgba(0,0,0,0.4);">
        <div class="border-b border-outline-variant px-loose py-standard flex items-center justify-between">
          <div>
            <h3 class="font-bold text-on-surface" style="font-size:16px;margin:0;">Chỉnh sửa gói tập</h3>
            <p class="text-on-surface-variant text-body-sm" style="margin:2px 0 0;">Gói: <strong>${pkg.ten_goi}</strong></p>
          </div>
          <button id="edit-pkg-close" style="background:transparent;border:none;cursor:pointer;"><span class="material-symbols-outlined text-on-surface-variant text-xl">close</span></button>
        </div>
        <div class="p-loose" style="display:flex;flex-direction:column;gap:14px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Từ ngày</label>
              <input id="edit-pkg-from" type="date" value="${d0(pkg.tu_ngay)}" ${iCls} />
            </div>
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Đến ngày</label>
              <input id="edit-pkg-to" type="date" value="${d0(pkg.den_ngay)}" ${iCls} />
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Giá thực tế (VNĐ)</label>
              <input id="edit-pkg-price" type="text" inputmode="numeric" value="${pkg.gia_thuc_te > 0 ? new Intl.NumberFormat('vi-VN').format(pkg.gia_thuc_te) : ''}" placeholder="Không đổi" ${iCls} />
            </div>
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Phương thức TT</label>
              <select id="edit-pkg-payment" ${iCls}>
                ${Object.entries(PM).map(([v,l]) => `<option value="${v}" ${pkg.phuong_thuc_tt === v ? 'selected' : ''}>${l}</option>`).join('')}
              </select>
            </div>
          </div>
          <div>
            <label class="block text-body-sm font-bold text-on-surface mb-xs">Ghi chú thanh toán</label>
            <input id="edit-pkg-note" type="text" value="${pkg.ghi_chu_tt || ''}" placeholder="Ghi chú thêm..." ${iCls} />
          </div>
          <div class="flex gap-standard">
            <button id="edit-pkg-close2" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Đóng</button>
            <button id="edit-pkg-save" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#1d4ed8;border:none;cursor:pointer;">Lưu thay đổi</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#edit-pkg-close').addEventListener('click', close);
    overlay.querySelector('#edit-pkg-close2').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    const _parseVND = s => parseInt((s || '').replace(/\./g, '').replace(/,/g, '')) || 0;
    const _fmtVND = n => n > 0 ? new Intl.NumberFormat('vi-VN').format(n) : '';
    const editPriceEl = overlay.querySelector('#edit-pkg-price');
    editPriceEl?.addEventListener('focus', function () { const v = _parseVND(this.value); this.value = v > 0 ? String(v) : ''; });
    editPriceEl?.addEventListener('blur', function () { const v = _parseVND(this.value); this.value = _fmtVND(v); });
    overlay.querySelector('#edit-pkg-save').addEventListener('click', async () => {
      const tu_ngay = overlay.querySelector('#edit-pkg-from').value;
      const den_ngay = overlay.querySelector('#edit-pkg-to').value;
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
    } catch (_) {}
    const iCls = `class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;"`;
    const PM = {tien_mat:'Tiền mặt',chuyen_khoan:'Chuyển khoản',the:'Thẻ',momo:'MoMo',zalopay:'ZaloPay',khac:'Khác'};
    const overlay = document.createElement('div');
    overlay.id = 'gym-sub-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);padding:16px;';
    overlay.innerHTML = `
      <div class="modal-card bg-surface-container-lowest" style="border-radius:16px;width:100%;max-width:440px;position:relative;box-shadow:0 30px 80px rgba(0,0,0,0.4);">
        <div class="border-b border-outline-variant px-loose py-standard flex items-center justify-between">
          <div>
            <h3 class="font-bold text-on-surface" style="font-size:16px;margin:0;">Đổi gói tập</h3>
            <p class="text-on-surface-variant text-body-sm" style="margin:2px 0 0;">Đang hủy: <strong>${pkg.ten_goi}</strong></p>
          </div>
          <button id="switch-pkg-close" style="background:transparent;border:none;cursor:pointer;"><span class="material-symbols-outlined text-on-surface-variant text-xl">close</span></button>
        </div>
        <div class="p-loose" style="display:flex;flex-direction:column;gap:14px;">
          <div>
            <label class="block text-body-sm font-bold text-on-surface mb-xs">Gói tập mới <span style="color:#ba1a1a;">*</span></label>
            <select id="switch-pkg-new" ${iCls}>
              <option value="">— Chọn gói tập —</option>
              ${goiTapList.map(g => `<option value="${g.id}" data-gia="${g.gia}">${g.ten_goi} — ${window.GymApp.formatCurrency(g.gia)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-body-sm font-bold text-on-surface mb-xs">Ngày bắt đầu <span style="color:#ba1a1a;">*</span></label>
            <input id="switch-pkg-from" type="date" value="${new Date().toISOString().substring(0,10)}" ${iCls} />
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Giá thực tế (VNĐ)</label>
              <input id="switch-pkg-price" type="text" inputmode="numeric" placeholder="Mặc định = giá gói" ${iCls} />
            </div>
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Phương thức TT</label>
              <select id="switch-pkg-payment" ${iCls}>
                ${Object.entries(PM).map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Hoàn tiền gói cũ (VNĐ)</label>
              <input id="switch-pkg-refund" type="text" inputmode="numeric" placeholder="0" ${iCls} />
            </div>
            <div>
              <label class="block text-body-sm font-bold text-on-surface mb-xs">Lý do đổi</label>
              <input id="switch-pkg-reason" type="text" placeholder="Nâng cấp, sai gói..." ${iCls} />
            </div>
          </div>
          <div class="rounded-xl" style="padding:10px 12px;background:#f0fdf4;border:1px solid #bbf7d0;">
            <p class="text-body-sm" style="color:#166534;margin:0;">Gói cũ bị hủy và gói mới kích hoạt ngay. Hội viên nhận thông báo.</p>
          </div>
          </div>
          <div class="flex gap-standard mt-standard">
            <button id="switch-pkg-close2" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Đóng</button>
            <button id="switch-pkg-confirm" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#1D9336;border:none;cursor:pointer;">Xác nhận đổi gói</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#switch-pkg-close').addEventListener('click', close);
    overlay.querySelector('#switch-pkg-close2').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    const _pVND = s => parseInt((s || '').replace(/\./g, '').replace(/,/g, '')) || 0;
    const _fVND = n => n > 0 ? new Intl.NumberFormat('vi-VN').format(n) : '';
    const swPriceEl = overlay.querySelector('#switch-pkg-price');
    const swRefundEl = overlay.querySelector('#switch-pkg-refund');
    swPriceEl?.addEventListener('focus', function () { const v = _pVND(this.value); this.value = v > 0 ? String(v) : ''; });
    swPriceEl?.addEventListener('blur', function () { this.value = _fVND(_pVND(this.value)); });
    swRefundEl?.addEventListener('focus', function () { const v = _pVND(this.value); this.value = v > 0 ? String(v) : ''; });
    swRefundEl?.addEventListener('blur', function () { this.value = _fVND(_pVND(this.value)); });
    overlay.querySelector('#switch-pkg-new')?.addEventListener('change', function () {
      const gia = parseFloat(this.options[this.selectedIndex]?.dataset?.gia) || 0;
      if (gia > 0 && swPriceEl) swPriceEl.value = _fVND(gia);
    });
    overlay.querySelector('#switch-pkg-confirm').addEventListener('click', async () => {
      const goi_tap_id_moi = overlay.querySelector('#switch-pkg-new').value;
      const tu_ngay = overlay.querySelector('#switch-pkg-from').value;
      if (!goi_tap_id_moi) return window.GymApp.toast('Vui lòng chọn gói tập mới', 'error');
      if (!tu_ngay) return window.GymApp.toast('Vui lòng chọn ngày bắt đầu', 'error');
      try {
        await window.GymApp.api.post(`/members/${m.id}/package/switch`, {
          pkg_id_cu: pkg.id,
          goi_tap_id_moi: parseInt(goi_tap_id_moi),
          tu_ngay,
          ly_do_huy: overlay.querySelector('#switch-pkg-reason').value.trim() || 'Đổi sang gói mới',
          so_tien_hoan: _pVND(overlay.querySelector('#switch-pkg-refund').value) || 0,
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
    const pts = (window.GymApp.data.pts || []);
    let goiPtList = [];
    try { const res = await window.GymApp.api.get('/packages/pt'); goiPtList = Array.isArray(res.data) ? res.data : []; } catch (_) { }
    const overlay = document.createElement('div');
    overlay.id = 'gym-sub-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);padding:16px;';
    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:16px;width:100%;max-width:540px;max-height:92vh;overflow-y:auto;position:relative;box-shadow:0 30px 80px rgba(0,0,0,0.4);">
        <div class="bg-surface-container-lowest border-b border-outline-variant px-loose py-standard flex items-center justify-between" style="position:sticky;top:0;z-index:1;">
          <div><h3 class="font-bold text-on-surface" style="font-size:16px;">Đăng ký gói PT</h3><p class="text-on-surface-variant text-body-sm">Hội viên: <strong>${m.ho_ten}</strong></p></div>
          <button id="close-sub-modal" style="background:transparent;border:none;cursor:pointer;"><span class="material-symbols-outlined text-on-surface-variant text-xl">close</span></button>
        </div>
        <div class="p-loose flex flex-col gap-standard bg-surface-container-lowest">
          <div class="grid grid-cols-2 gap-standard">
            <div style="grid-column:1/-1;"><label class="block text-body-sm font-bold text-on-surface mb-xs">Huấn luyện viên ${REQ}</label><select id="ptreg-pt" ${inputCls}><option value="">— Chọn huấn luyện viên —</option>${pts.map(pt => `<option value="${pt.id}">${pt.ho_ten || pt.name}${pt.chuyen_mon ? ' — ' + pt.chuyen_mon : ''}</option>`).join('')}</select></div>
            <div style="grid-column:1/-1;"><label class="block text-body-sm font-bold text-on-surface mb-xs">Gói PT ${REQ}</label><select id="ptreg-goi" ${inputCls}><option value="">— Chọn gói PT —</option>${goiPtList.map(g => `<option value="${g.id}" data-price="${g.gia || 0}" data-buoi="${g.so_buoi || ''}" data-thang="${g.so_thang || 0}">${g.ten_goi} — ${window.GymApp.formatCurrency(g.gia || 0)}${g.so_buoi ? ' / ' + g.so_buoi + ' buổi' : ''}</option>`).join('')}</select></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Số buổi</label><input id="ptreg-sessions" type="number" min="1" placeholder="—" ${inputCls} /></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Giá thực tế (VNĐ) ${REQ}</label><input id="ptreg-price" type="number" min="0" placeholder="Tự điền từ gói..." ${inputCls} /></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Phương thức TT ${REQ}</label><select id="ptreg-payment" ${inputCls}><option value="tien_mat">Tiền mặt</option><option value="chuyen_khoan">Chuyển khoản</option><option value="the">Thẻ</option><option value="momo">MoMo</option><option value="zalopay">ZaloPay</option><option value="khac">Khác</option></select></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Từ ngày ${REQ}</label><input id="ptreg-from" type="date" value="${new Date().toISOString().split('T')[0]}" ${inputCls} /></div>
            <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Đến ngày</label><input id="ptreg-to" type="date" ${inputCls} /></div>
            <div style="grid-column:1/-1;"><label class="block text-body-sm font-bold text-on-surface mb-xs">Ghi chú</label><textarea id="ptreg-note" rows="2" placeholder="Ghi chú thêm..." class="bg-surface-container-lowest text-on-surface border border-outline-variant" style="width:100%;padding:8px 12px;border-radius:8px;outline:none;font-size:14px;box-sizing:border-box;resize:vertical;font-family:inherit;"></textarea></div>
          </div>
          <div class="flex gap-standard">
            <button id="ptreg-cancel-btn" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Hủy</button>
            <button id="ptreg-save-btn" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#1D9336;">Đăng ký gói PT</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('ptreg-goi').addEventListener('change', function () {
      const opt = this.options[this.selectedIndex];
      const price = parseFloat(opt.dataset.price) || 0;
      const buoi = opt.dataset.buoi;
      const soThang = parseInt(opt.dataset.thang) || 0;
      if (price > 0) document.getElementById('ptreg-price').value = price;
      if (buoi) document.getElementById('ptreg-sessions').value = buoi;
      if (soThang > 0) {
        const fromVal = document.getElementById('ptreg-from').value;
        if (fromVal) { const from = new Date(fromVal); from.setMonth(from.getMonth() + soThang); document.getElementById('ptreg-to').value = from.toISOString().split('T')[0]; }
      }
    });
    document.getElementById('ptreg-from').addEventListener('change', function () {
      const goiSel = document.getElementById('ptreg-goi');
      const opt = goiSel.options[goiSel.selectedIndex];
      const soThang = parseInt(opt?.dataset?.thang) || 0;
      if (soThang > 0 && this.value) { const from = new Date(this.value); from.setMonth(from.getMonth() + soThang); document.getElementById('ptreg-to').value = from.toISOString().split('T')[0]; }
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
      if (!ptId || !goiId || isNaN(price) || !from) { window.GymApp.toast('Vui lòng điền đầy đủ: PT, gói PT, giá và từ ngày (*)', 'error'); return; }
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
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);padding:16px;';
    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:16px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;position:relative;box-shadow:0 30px 80px rgba(0,0,0,0.4);">
        <div class="bg-surface-container-lowest border-b border-outline-variant px-loose py-standard flex items-center justify-between" style="position:sticky;top:0;z-index:1;">
          <div><h3 class="font-bold text-on-surface" style="font-size:16px;">Đăng ký lịch tập PT</h3><p class="text-on-surface-variant text-body-sm">Hội viên: <strong>${m.ho_ten || m.name}</strong></p></div>
          <button id="close-sub-modal" style="background:transparent;border:none;cursor:pointer;"><span class="material-symbols-outlined text-on-surface-variant text-xl">close</span></button>
        </div>
        <div class="p-loose flex flex-col gap-standard bg-surface-container-lowest">
          <div>
            <label class="block text-body-sm font-bold text-on-surface mb-xs">Huấn luyện viên ${REQ}</label>
            ${ptContracts.length === 0
        ? `<div style="padding:10px 14px;border-radius:8px;background:#ffdad6;color:#93000a;font-size:13px;font-weight:600;">Hội viên chưa có gói PT đang hoạt động.</div>`
        : `<select id="sch-pt" ${inputCls}><option value="">— Chọn huấn luyện viên —</option>${ptContracts.map(c => `<option value="${c.id}">${c.ten_pt} — ${c.chuyen_mon || 'PT'} (còn ${(c.buoi_dang_ky || 0) - (c.buoi_da_tap || 0)} buổi)</option>`).join('')}</select>`}
          </div>
          <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Chọn ngày ${REQ}</label><input id="sch-date" type="date" value="${new Date().toISOString().split('T')[0]}" min="${new Date().toISOString().split('T')[0]}" ${inputCls} /></div>
          <div>
            <label class="block text-body-sm font-bold text-on-surface mb-xs">Chọn giờ bắt đầu ${REQ}</label>
            <div id="sch-time-display" class="text-body-sm mb-compact" style="min-height:18px;color:#6e7a6b;">Chưa chọn giờ</div>
            <div style="border:1px solid #becab9;border-radius:10px;overflow:hidden;max-height:210px;overflow-y:auto;">
              <div class="time-slot-grid" style="display:grid;grid-template-columns:repeat(8,1fr);gap:3px;padding:8px;">
                ${timeSlots.map(t => `<button class="time-slot-btn" data-time="${t}" style="padding:5px 1px;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.15s;text-align:center;">${t}</button>`).join('')}
              </div>
            </div>
          </div>
          <div><label class="block text-body-sm font-bold text-on-surface mb-xs">Ghi chú</label><input id="sch-note" type="text" placeholder="Ghi chú thêm (không bắt buộc)..." ${inputCls} /></div>
          <div class="flex gap-standard">
            <button id="sch-cancel-btn" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Hủy</button>
            <button id="sch-save-btn" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#1D9336;">Đăng ký</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    let selectedTime = '';
    overlay.querySelectorAll('.time-slot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.time-slot-btn').forEach(b => { b.style.transform = 'scale(1)'; b.style.background = ''; b.style.color = ''; });
        btn.style.transform = 'scale(1.05)'; btn.style.background = '#1D9336'; btn.style.color = '#fff';
        selectedTime = btn.dataset.time;
        const display = document.getElementById('sch-time-display');
        display.textContent = `Đã chọn: ${selectedTime}`; display.style.color = '#1D9336'; display.style.fontWeight = '700';
      });
    });
    const close = () => overlay.remove();
    document.getElementById('close-sub-modal').addEventListener('click', close);
    document.getElementById('sch-cancel-btn').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
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
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
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
      <div class="bg-surface-container-lowest rounded-2xl shadow-xl" style="width:360px;max-width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,0.35);">
        <div class="flex items-center justify-between px-loose py-standard border-b border-outline-variant">
          <h3 class="text-on-surface font-bold" style="font-size:16px;">Sắp xếp — Huấn luyện viên</h3>
          <button id="close-pt-sort-modal" class="material-symbols-outlined text-on-surface-variant text-xl p-atom rounded" style="background:transparent;border:none;cursor:pointer;">close</button>
        </div>
        <div class="px-loose py-standard border-b border-outline-variant">
          <div class="flex flex-col gap-xs">
            ${options.map(([value, label]) => `
              <label class="flex items-center gap-compact cursor-pointer py-xs px-compact rounded-lg hover:bg-surface-container-low transition-colors">
                <input type="radio" name="pt-sort" value="${value}" style="accent-color:#1D9336;width:16px;height:16px;" ${self._ptSortState === value ? 'checked' : ''} />
                <span class="text-body-md text-on-surface" style="font-size:13px;">${label}</span>
              </label>`).join('')}
          </div>
        </div>
        <div class="flex gap-standard px-loose py-standard">
          <button id="pt-sort-reset-btn" class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-md">Đặt lại</button>
          <button id="pt-sort-apply-btn" class="flex-1 py-compact rounded-xl font-bold text-white text-body-md transition-all hover:opacity-90" style="background:#1D9336;">Áp dụng</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('close-pt-sort-modal')?.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
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
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
    document.getElementById('filter-reset-btn')?.addEventListener('click', () => {
      overlay.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = r.value === ''; });
    });
    document.getElementById('filter-apply-btn')?.addEventListener('click', () => {
      self._filterState.pkg = overlay.querySelector('input[name="f-pkg"]:checked')?.value || '';
      self._filterState.status = overlay.querySelector('input[name="f-status"]:checked')?.value || '';
      self._filterState.gender = overlay.querySelector('input[name="f-gender"]:checked')?.value || '';
      self._filterState.hasPt = overlay.querySelector('input[name="f-hasPt"]:checked')?.value || '';
      self._filterState.checkinToday = overlay.querySelector('input[name="f-checkinToday"]:checked')?.value || '';
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
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
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
      (this._filterState.gender ? 1 : 0) + (this._filterState.hasPt ? 1 : 0) + (this._filterState.checkinToday ? 1 : 0);
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
    const q = document.getElementById('member-search')?.value.toLowerCase() || '';
    const { status, pkg, gender, hasPt, checkinToday } = this._filterState;
    const members = Array.isArray(window.GymApp.data.members) ? window.GymApp.data.members : [];

    // Áp dụng lọc và sắp xếp
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
      return matchQ && matchStatus && matchPkg && matchGender && matchHasPt && matchCheckinToday;
    });

    this._memberFiltered = this._sortMemberList(filtered);
    this._memberPage = 1;
    this._refreshMemberTable();
    this._updateFilterUI();
    this._updateMemberSortUI();
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
    document.querySelectorAll('.pt-view-btn, .pt-name-link').forEach(el => {
      el.addEventListener('click', (e) => { e.stopPropagation(); self._showPtModal(parseInt(el.dataset.id)); });
    });
    document.querySelectorAll('.pt-edit-btn').forEach(el => {
      el.addEventListener('click', (e) => { e.stopPropagation(); self._showPtEditModal(parseInt(el.dataset.id)); });
    });
    document.querySelectorAll('.pt-delete-btn').forEach(el => {
      el.addEventListener('click', (e) => { e.stopPropagation(); self._confirmDeletePt(el.dataset.id, el.dataset.name); });
    });
  },

  _confirmDeletePt: function (id, name) {
    const self = this;
    document.getElementById('gym-del-pt-modal')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'gym-del-pt-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);padding:16px;';
    overlay.innerHTML = `
      <div style="border-radius:16px;width:100%;max-width:400px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.3);" class="bg-surface-container-lowest">
        <div class="px-loose py-standard border-b border-outline-variant flex items-center gap-compact" style="background:linear-gradient(135deg,#065f46,#10b981);">
          <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-white text-xl">person_remove</span>
          </div>
          <h3 class="font-bold text-white" style="font-size:17px">Xác nhận xóa PT</h3>
        </div>
        <div class="p-loose flex flex-col gap-standard">
          <p class="text-on-surface text-body-md">Bạn có chắc chắn muốn xóa huấn luyện viên <strong class="text-error">${name}</strong> không?</p>
          <p class="text-on-surface-variant text-body-sm bg-surface-container rounded-xl px-standard py-compact border border-outline-variant">
            <span class="material-symbols-outlined text-sm align-middle text-[#e65100]">warning</span>
            Hành động này sẽ gỡ PT khỏi hệ thống quản lý.
          </p>
          <div class="flex gap-standard justify-end pt-xs">
            <button id="cancel-del-pt" class="px-loose py-compact rounded-xl font-bold text-body-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all">Hủy bỏ</button>
            <button id="confirm-del-pt" class="bg-error text-white px-loose py-compact rounded-xl font-bold text-body-sm hover:opacity-80 transition-all flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">delete</span>Xóa PT
            </button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('cancel-del-pt').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
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
    this._showLoadingOverlay('Tải thông tin...');
    try { const res = await window.GymApp.api.get(`/members/${id}`); m = res?.data || null; } catch (_) { }
    this._hideLoadingOverlay();
    if (!m) m = (window.GymApp.data.members || []).find(x => x.id == id);
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
      </div>`;

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
      </div>`;

    overlay.innerHTML = `
      <div style="border-radius:24px;width:100%;max-width:560px;max-height:90vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 80px rgba(0,0,0,0.4);background:var(--md-sys-color-surface-container-lowest,#fff);">
        <div style="background:linear-gradient(135deg,#1a5e2a 0%,#1D9336 60%,#22c55e 100%);padding:24px 24px 20px;flex-shrink:0;position:relative;overflow:hidden;">
          <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.07);"></div>
          <button id="close-edit-member" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.15);border:none;cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
            <span class="material-symbols-outlined" style="color:#fff;font-size:18px;">close</span>
          </button>
          <div style="display:flex;align-items:center;gap:16px;position:relative;z-index:1;">
            <div id="me-avatar-container" class="relative group cursor-pointer" title="Nhấn để đổi ảnh đại diện">
              <div style="width:64px;height:64px;border-radius:50%;border:3px solid rgba(255,255,255,0.5);overflow:hidden;" id="me-avatar-preview">
                ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'lg', 'width:100%;height:100%;')}
              </div>
              <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="material-symbols-outlined text-white text-[18px]">photo_camera</span>
              </div>
              <input type="file" id="me-avatar-input" accept="image/*" style="display:none;" />
            </div>
            <div>
              <span style="font-size:11px;font-weight:800;color:rgba(255,255,255,0.8);text-transform:uppercase;background:rgba(0,0,0,0.2);padding:3px 8px;border-radius:999px;">Chỉnh sửa hồ sơ</span>
              <h3 style="font-size:22px;font-weight:800;color:#fff;margin:6px 0 2px;">${m.ho_ten || '—'}</h3>
              <p style="font-size:13px;color:rgba(255,255,255,0.9);font-weight:600;margin:0;">${m.ma_ho_so || ''}</p>
            </div>
          </div>
        </div>
        <div style="overflow-y:auto;flex:1;padding:24px;display:flex;flex-direction:column;gap:20px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="material-symbols-outlined" style="color:#1D9336;font-size:18px;">person</span>
            <h4 style="font-size:14px;font-weight:800;color:var(--md-sys-color-on-surface);text-transform:uppercase;letter-spacing:0.05em;margin:0;">Thông tin cá nhân</h4>
            <div style="flex:1;height:1px;background:linear-gradient(to right,#1D933640,transparent);"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            ${field('badge', 'Họ và tên', 'ho_ten', 'text', m.ho_ten, true, true)}
            ${field('cake', 'Ngày sinh', 'ngay_sinh', 'date', m.ngay_sinh, false, false)}
            ${selectField('wc', 'Giới tính', 'gioi_tinh', [{ v: '', l: '— Chọn —' }, { v: 'nam', l: 'Nam' }, { v: 'nu', l: 'Nữ' }, { v: 'khac', l: 'Khác' }], m.gioi_tinh === 'male' ? 'nam' : (m.gioi_tinh === 'female' ? 'nu' : m.gioi_tinh), false)}
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
            <span class="material-symbols-outlined" style="color:#1D9336;font-size:18px;">contact_page</span>
            <h4 style="font-size:14px;font-weight:800;color:var(--md-sys-color-on-surface);text-transform:uppercase;letter-spacing:0.05em;margin:0;">Liên hệ</h4>
            <div style="flex:1;height:1px;background:linear-gradient(to right,#1D933640,transparent);"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            ${field('call', 'Số điện thoại', 'so_dien_thoai', 'tel', m.so_dien_thoai)}
            ${field('mail', 'Email', 'email', 'email', m.email)}
            ${field('location_on', 'Địa chỉ', 'dia_chi_tam_tru', 'text', m.dia_chi_tam_tru, false, true)}
          </div>
          <div>
            <div class="relative group">
              <span class="material-symbols-outlined absolute left-3 top-3 text-outline group-focus-within:text-brand-primary transition-colors text-[18px]">edit_note</span>
              <textarea id="em-ghi_chu" rows="3" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-10 pr-4 py-2.5 rounded-xl focus:border-brand-primary outline-none text-[14px] font-medium resize-none transition-all" placeholder="Ghi chú...">${m.ghi_chu || ''}</textarea>
            </div>
          </div>
        </div>
        <div style="padding:16px 24px;border-top:1px solid var(--md-sys-color-outline-variant);display:flex;gap:12px;justify-content:flex-end;background:var(--md-sys-color-surface-container-lowest,#fff);flex-shrink:0;">
          <button id="cancel-edit-member" style="padding:10px 20px;border-radius:12px;font-weight:700;font-size:14px;border:1px solid var(--md-sys-color-outline-variant);color:var(--md-sys-color-on-surface-variant);background:transparent;cursor:pointer;">Hủy</button>
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
        document.getElementById('me-avatar-preview').innerHTML = `<img src="${re.target.result}" style="width:100%;height:100%;object-fit:cover;" />`;
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('close-edit-member').addEventListener('click', close);
    document.getElementById('cancel-edit-member').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

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
            Hành động này không thể hoàn tác.
          </p>
          <div class="flex gap-standard justify-end pt-xs">
            <button id="cancel-del-member" class="px-loose py-compact rounded-xl font-bold text-body-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all">Hủy bỏ</button>
            <button id="confirm-del-member" class="bg-error text-white px-loose py-compact rounded-xl font-bold text-body-sm hover:opacity-80 transition-all flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">delete</span>Xóa hội viên
            </button>
          </div>
        </div>
      </div>`;
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
  },

  _setupPgHandler: function () {
    const self = this;
    // Use event delegation for pagination buttons to ensure they work after re-renders
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.pagination-btn');
      if (!btn) return;
      
      const page = parseInt(btn.dataset.page);
      if (isNaN(page)) return;

      // Identify which section we are paginating
      const membersContainer = btn.closest('#members-table-container');
      const ptsContainer = btn.closest('#pt-cards-container');

      if (membersContainer) {
        self._memberPage = page;
        self._refreshMemberTable();
        membersContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (ptsContainer) {
        self._ptPage = page;
        self._refreshPtCards();
        ptsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  },


  init: function () {
    const self = this;
    this._memberPage = 1;
    this._ptPage = 1;
    this._memberFiltered = [...(window.GymApp.data.members || [])];
    this._ptFiltered = [...(window.GymApp.data.pts || [])];
    this._setupPgHandler();
    this._bindMemberTableEvents();
    this._bindPtCardEvents();
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => self._switchTab(btn.dataset.tab));
    });
    this._refreshMemberTable();
    this._refreshPtCards();
    self._switchTab(self._tab);

    document.getElementById('member-search')?.addEventListener('input', () => self._applyMemberFilter());
    document.getElementById('pt-search')?.addEventListener('input', () => self._applyPtFilter());

    document.getElementById('btn-view-all-members')?.addEventListener('click', () => {
      self._filterState = { status: '', pkg: '', gender: '', hasPt: '', checkinToday: '' };
      const s = document.getElementById('member-search'); if (s) s.value = '';
      self._memberFiltered = [...window.GymApp.data.members];
      self._memberPage = 1; self._refreshMemberTable(); self._updateFilterUI();
      window.GymApp.toast(`Hiển thị tất cả ${window.GymApp.data.members.length} hội viên`, 'info');
    });

    document.getElementById('btn-show-all')?.addEventListener('click', () => {
      self._filterState = { status: '', pkg: '', gender: '', hasPt: '', checkinToday: '' };
      self._memberSortState = ''; // Reset sort
      const s = document.getElementById('member-search'); if (s) s.value = '';
      self._memberFiltered = [...window.GymApp.data.members];
      self._memberPage = 1; self._refreshMemberTable(); self._updateFilterUI(); self._updateMemberSortUI();
    });

    document.getElementById('btn-sort-member')?.addEventListener('click', () => self._showMemberSortModal());

    document.getElementById('btn-filter')?.addEventListener('click', () => self._showFilterModal());

    document.getElementById('btn-view-all-pts')?.addEventListener('click', () => {
      self._ptFilterState = { specialty: '', status: '' };
      self._ptSortState = '';
      const s = document.getElementById('pt-search'); if (s) s.value = '';
      self._ptFiltered = [...window.GymApp.data.pts];
      self._ptPage = 1; self._refreshPtCards(); self._updatePtFilterUI(); self._updatePtSortUI();
      window.GymApp.toast(`Hiển thị tất cả ${window.GymApp.data.pts.length} huấn luyện viên`, 'info');
    });

    document.getElementById('btn-show-all-pt')?.addEventListener('click', () => {
      // FIX: Reset cả sort state khi xóa lọc
      self._ptFilterState = { specialty: '', status: '' };
      self._ptSortState = '';
      const s = document.getElementById('pt-search'); if (s) s.value = '';
      self._ptFiltered = [...window.GymApp.data.pts];
      self._ptPage = 1; self._refreshPtCards(); self._updatePtFilterUI(); self._updatePtSortUI();
    });

    document.getElementById('btn-filter-pt')?.addEventListener('click', () => self._showPtFilterModal());
    document.getElementById('btn-sort-pt')?.addEventListener('click', () => self._showPtSortModal());
    self._updatePtSortUI();
    self._updateMemberSortUI();
  }
};