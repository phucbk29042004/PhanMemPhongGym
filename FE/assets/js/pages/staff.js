window.GymApp.pages['staff'] = {
  _page: 1,
  _limit: 20,
  _total: 0,
  _totalPages: 1,
  _search: '',
  _chi_nhanh: '',
  _gioi_tinh: '',
  _trang_thai: '',
  _staffFiltered: [],
  _hasMore: true,
  _isLoading: false,
  _observer: null,

  // Helper: tạo avatar fallback bằng chữ cái đầu (không dùng file local)
  _avatarHtml: function (avatarUrl, hoTen, size) {
    const fontSize = size === 'lg' ? '22px' : '15px';
    const initial = (hoTen || '?').charAt(0).toUpperCase();

    if (avatarUrl) {
      return `
      <img src="${avatarUrl}"
        style="width:100%;height:100%;object-fit:cover;"
        onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='flex';" />
      <div style="width:100%;height:100%;display:none;align-items:center;justify-content:center;background:#e8f5e9;font-size:${fontSize};font-weight:800;color:#1D9336;">${initial}</div>
    `;
    }
    return `
    <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#e8f5e9;font-size:${fontSize};font-weight:800;color:#1D9336;">${initial}</div>
  `;
  },

  render: function () {
    const self = this;
    const isBoss = ['admin', 'chu_phong_gym'].includes(window.GymApp.auth.user?.vai_tro);

    return `
      <div class="flex flex-col gap-standard animate-in fade-in duration-500">
        <!-- Top Header -->
        <div class="flex flex-wrap items-center justify-end gap-standard">
          <div class="flex items-center gap-compact">
            <button id="btn-add-staff" class="flex items-center justify-center gap-xs px-4 py-atom rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 hover:shadow-lg transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer group">
              <span class="material-symbols-outlined text-base transition-transform group-hover:scale-110">person_add</span>
              <span>Thêm nhân viên</span>
            </button>
            <button id="btn-staff-reload" class="flex items-center justify-center gap-xs px-4 py-atom rounded-xl border border-outline-variant bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer whitespace-nowrap">
              <span class="material-symbols-outlined text-base">refresh</span>
              <span>Tải lại</span>
            </button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="flex flex-wrap items-center justify-between gap-standard bg-white dark:bg-[#1e1e1e] p-standard rounded-2xl border-2 border-outline-variant/50 shadow-sm mb-standard transition-all duration-300 hover:shadow-md">
          <!-- Search Box -->
          <div class="relative flex-1 group" style="min-width:min(280px,100%); max-width:450px;">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors text-[18px]">search</span>
            <input id="staff-search" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface pl-10 pr-4 py-2.5 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none placeholder-outline-variant/60 font-body-md text-body-md transition-all shadow-sm focus:shadow-none" placeholder="Tìm theo tên, mã NV, số điện thoại..." type="text" value="${self._search}" />
          </div>

          <!-- Filter Actions -->
          <div class="flex flex-wrap items-center gap-compact">
            <!-- Filter Giới tính -->
            <div class="relative w-[140px]">
              <select id="staff-gender-filter" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-3 py-2 rounded-xl focus:border-brand-primary outline-none text-body-sm font-bold transition-all">
                <option value="">Tất cả giới tính</option>
                <option value="Nam" ${self._gioi_tinh === 'Nam' ? 'selected' : ''}>Nam</option>
                <option value="Nu" ${self._gioi_tinh === 'Nu' ? 'selected' : ''}>Nữ</option>
                <option value="Khac" ${self._gioi_tinh === 'Khac' ? 'selected' : ''}>Khác</option>
              </select>
            </div>

            <!-- Filter Trạng thái tài khoản -->
            <div class="relative w-[160px]">
              <select id="staff-status-filter" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-3 py-2 rounded-xl focus:border-brand-primary outline-none text-body-sm font-bold transition-all">
                <option value="">Tất cả trạng thái</option>
                <option value="hoat_dong" ${self._trang_thai === 'hoat_dong' ? 'selected' : ''}>Hoạt động</option>
                <option value="khoa" ${self._trang_thai === 'khoa' ? 'selected' : ''}>Bị khóa</option>
              </select>
            </div>

            ${isBoss ? `
              <div class="relative w-[180px]">
                <select id="staff-branch-filter" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-3 py-2.5 rounded-xl focus:border-brand-primary outline-none text-body-sm font-bold transition-all">
                  <option value="">Tất cả chi nhánh</option>
                </select>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Staff List Container -->
        <div id="staff-table-container" class="w-full">
          ${self._renderStaffTable()}
        </div>
      </div>
    `;
  },

  init: function () {
    const self = this;
    self._chi_nhanh = window.GymApp.selectedBranch || '';

    const searchInput = document.getElementById('staff-search');
    let searchTimeout = null;
    searchInput?.addEventListener('input', function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        self._search = this.value.trim();
        self._resetAndReload();
      }, 400);
    });

    document.getElementById('staff-gender-filter')?.addEventListener('change', function () {
      self._gioi_tinh = this.value;
      self._resetAndReload();
    });

    document.getElementById('staff-status-filter')?.addEventListener('change', function () {
      self._trang_thai = this.value;
      self._resetAndReload();
    });

    const branchFilter = document.getElementById('staff-branch-filter');
    if (branchFilter) {
      self._fillBranchOptions(branchFilter);
      branchFilter.addEventListener('change', function () {
        self._chi_nhanh = this.value;
        self._resetAndReload();
      });
    }

    document.getElementById('btn-staff-reload')?.addEventListener('click', () => {
      self._resetAndReload();
    });

    document.getElementById('btn-add-staff')?.addEventListener('click', () => {
      window.GymApp.navigate('member-add');
      setTimeout(() => {
        const typeSelect = document.getElementById('reg-loai-ho-so');
        if (typeSelect) {
          typeSelect.value = 'le_tan';
          typeSelect.dispatchEvent(new Event('change'));
        }
      }, 100);
    });

    // Event Delegation: lắng nghe mọi click trên container cha thay vì từng phần tử
    // Giải quyết: click chập chờn & khựng khi dữ liệu được append (infinite scroll)
    const container = document.getElementById('staff-table-container');
    if (container) {
      container.addEventListener('click', async function (e) {
        // Nút Xem chi tiết
        const viewBtn = e.target.closest('.staff-view-btn');
        if (viewBtn) {
          e.stopPropagation();
          self._showStaffModal(viewBtn.dataset.id);
          return;
        }

        // Nút Chỉnh sửa
        const editBtn = e.target.closest('.staff-edit-btn');
        if (editBtn) {
          e.stopPropagation();
          self._showEditStaffModal(editBtn.dataset.id);
          return;
        }

        // Nút Khóa/Mở khóa tài khoản
        const lockBtn = e.target.closest('.staff-lock-btn');
        if (lockBtn) {
          e.stopPropagation();
          const id = lockBtn.dataset.id;
          const isLocked = lockBtn.dataset.locked === 'true';
          const actionText = isLocked ? 'mở khóa' : 'khóa';
          const confirmed = await window.GymApp.confirm(
            `Bạn có chắc muốn ${actionText} tài khoản của nhân viên này không?`,
            'Thay đổi trạng thái tài khoản'
          );
          if (!confirmed) return;
          try {
            const res = await window.GymApp.api.put(`/staff/${id}`, {
              trang_thai: isLocked ? 'hoat_dong' : 'khoa'
            });
            if (res.success) {
              window.GymApp.toast(`Đã ${actionText} tài khoản thành công!`, 'success');
              self._resetAndReload();
            } else {
              window.GymApp.toast(res.message || 'Lỗi thao tác', 'error');
            }
          } catch (err) {
            window.GymApp.toast('Lỗi kết nối máy chủ', 'error');
          }
          return;
        }

        // Nút Xóa hồ sơ
        const deleteBtn = e.target.closest('.staff-delete-btn');
        if (deleteBtn) {
          e.stopPropagation();
          const id = deleteBtn.dataset.id;
          const name = deleteBtn.dataset.name;
          const confirmed = await window.GymApp.confirm(
            `Bạn có chắc muốn xóa hồ sơ nhân viên "${name}" không? Thao tác này sẽ khóa tài khoản đi kèm nếu có.`,
            'Xóa hồ sơ nhân viên'
          );
          if (!confirmed) return;
          try {
            const res = await window.GymApp.api.delete(`/staff/${id}`);
            if (res.success) {
              window.GymApp.toast('Xóa hồ sơ nhân viên thành công!', 'success');
              self._resetAndReload();
            } else {
              window.GymApp.toast(res.message || 'Lỗi khi xóa', 'error');
            }
          } catch (err) {
            window.GymApp.toast('Lỗi kết nối máy chủ', 'error');
          }
          return;
        }

        // Click vào hàng (không phải button): xem chi tiết
        const row = e.target.closest('.staff-row');
        if (row && !e.target.closest('button')) {
          self._showStaffModal(row.dataset.id);
        }
      });
    }

    self._loadData();
  },

  // Reset toàn bộ state khi search/filter thay đổi rồi tải lại từ đầu
  _resetAndReload: function () {
    const self = this;
    self._page = 1;
    self._hasMore = true;
    self._isLoading = false;
    self._staffFiltered = [];
    // Xóa sạch tbody và card list trước khi vẽ lại
    const tbody = document.querySelector('#staff-scroll-container tbody');
    if (tbody) tbody.innerHTML = '';
    const mobileList = document.getElementById('staff-scroll-mobile-container');
    if (mobileList) mobileList.innerHTML = '';
    // Hủy observer cũ để thiết lập lại sau khi render
    if (self._observer) { self._observer.disconnect(); self._observer = null; }
    self._loadData();
  },

  _fillBranchOptions: async function (selectEl) {
    const self = this;
    try {
      const branches = await fetch('assets/data/branches.json').then(r => r.json());
      let html = `<option value="">Tất cả chi nhánh</option>`;
      branches.forEach(b => {
        html += `<option value="${b.ten}" ${self._chi_nhanh === b.ten ? 'selected' : ''}>${b.ten}</option>`;
      });
      selectEl.innerHTML = html;
    } catch (e) {
      console.error('Failed to load branches in staff list', e);
    }
  },

  _loadData: async function () {
    const self = this;
    // Chặn tải trùng lặp và tải khi đã hết data
    if (self._isLoading || !self._hasMore) return;
    self._isLoading = true;
    self._showSpinner(true);

    let url = `/staff?page=${self._page}&limit=${self._limit}`;
    if (self._search) url += `&search=${encodeURIComponent(self._search)}`;
    if (self._chi_nhanh) url += `&chi_nhanh=${encodeURIComponent(self._chi_nhanh)}`;
    if (self._gioi_tinh) url += `&gioi_tinh=${self._gioi_tinh}`;
    if (self._trang_thai) url += `&trang_thai=${self._trang_thai}`;

    try {
      const res = await window.GymApp.api.get(url);
      if (!res.success) throw new Error(res.message);

      const newItems = res.data.data || [];
      self._total = res.data.pagination?.total || 0;
      self._totalPages = res.data.pagination?.totalPages || 1;
      self._hasMore = self._page < self._totalPages;

      if (self._page === 1) {
        // Tải lần đầu: vẽ toàn bộ khung bảng
        self._staffFiltered = newItems;
        const container = document.getElementById('staff-table-container');
        if (container) {
          container.innerHTML = self._renderStaffTable();
          self._initObserver();
        }
      } else {
        // Tải thêm: chỉ append rows mới vào cuối bảng/card-list hiện có
        self._staffFiltered = self._staffFiltered.concat(newItems);
        self._appendRows(newItems);
      }

      // Nếu đã hết data → ẩn spinner vĩnh viễn và ngắt observer
      if (!self._hasMore) {
        self._showSpinner(false);
        if (self._observer) { self._observer.disconnect(); self._observer = null; }
      }
    } catch (e) {
      console.error('Fetch staff error:', e);
      if (self._page === 1) {
        const container = document.getElementById('staff-table-container');
        if (container) {
          container.innerHTML = `<div class="p-loose text-center text-error font-bold">Lỗi khi tải dữ liệu nhân viên.</div>`;
        }
      }
    } finally {
      self._isLoading = false;
      if (self._hasMore) self._showSpinner(false);
    }
  },

  // Khởi tạo IntersectionObserver đúng root = scroll container
  _initObserver: function () {
    const self = this;
    if (self._observer) self._observer.disconnect();

    const desktopContainer = document.getElementById('staff-scroll-container');
    const mobileContainer = document.getElementById('staff-scroll-mobile-container');

    const createObserver = (root) => {
      if (!root) return null;
      const sentinel = root.querySelector('.staff-sentinel');
      if (!sentinel) return null;
      const obs = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !self._isLoading && self._hasMore) {
          self._page++;
          self._loadData();
        }
      }, { root, rootMargin: '80px', threshold: 0 });
      obs.observe(sentinel);
      return obs;
    };

    // Quan sát cả 2 container (desktop + mobile web)
    const obs1 = createObserver(desktopContainer);
    const obs2 = createObserver(mobileContainer);
    // Lưu observer đầu tiên khả dụng để có thể disconnect khi cần
    self._observer = obs1 || obs2;
  },

  // Hiện/ẩn spinner tải thêm
  _showSpinner: function (show) {
    document.querySelectorAll('.staff-load-spinner').forEach(el => {
      el.style.display = show ? 'flex' : 'none';
    });
  },

  // Append thêm rows mới vào DOM mà không vẽ lại toàn bộ bảng
  _appendRows: function (newItems) {
    const self = this;
    // Desktop: append vào <tbody>
    const tbody = document.querySelector('#staff-scroll-container tbody');
    if (tbody) {
      const fragment = document.createDocumentFragment();
      newItems.forEach(nv => {
        const tr = document.createElement('tr');
        tr.className = 'staff-row transition-colors hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10 border-b border-outline-variant/30 cursor-pointer bg-white dark:bg-[#1e1e1e] odd:bg-[#fafafa] odd:dark:bg-[#15171e]';
        tr.dataset.id = nv.id;
        tr.innerHTML = self._buildRowHtml(nv);
        fragment.appendChild(tr);
      });
      tbody.appendChild(fragment);
    }
    // Mobile: append vào card list
    const mobileList = document.getElementById('staff-scroll-mobile-container');
    if (mobileList) {
      // Chèn trước sentinel để sentinel luôn ở cuối cùng
      const sentinel = mobileList.querySelector('.staff-sentinel');
      const fragment = document.createDocumentFragment();
      newItems.forEach(nv => {
        const div = document.createElement('div');
        div.innerHTML = self._buildCardHtml(nv);
        fragment.appendChild(div.firstElementChild);
      });
      if (sentinel) mobileList.insertBefore(fragment, sentinel);
      else mobileList.appendChild(fragment);
    }
    // Không cần gọi _bindRowEvents() nữa vì đã dùng Event Delegation trên container cha
  },

  // Tách logic build HTML của một row bảng desktop ra riêng để _appendRows dùng lại
  _buildRowHtml: function (nv) {
    const self = this;
    const roleLabel = nv.loai_ho_so === 'le_tan' ? 'Lễ tân' : 'Nhân viên';
    const roleClass = nv.loai_ho_so === 'le_tan'
      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
      : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
    const isLocked = nv.tk_trang_thai === 'khoa';
    const lockIcon = isLocked ? 'lock' : 'lock_open';
    const lockTitle = isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản';
    const statusBadge = isLocked
      ? `<span style="padding:2px 8px;border-radius:999px;font-size:9.6px;font-weight:700;background:#ffdad6;color:#ba1a1a;">Bị khóa</span>`
      : `<span style="padding:2px 8px;border-radius:999px;font-size:9.6px;font-weight:700;background:#e7f5e9;color:#1D9336;">Hoạt động</span>`;
    return `
      <td class="border-r border-outline-variant/30 sticky-col-left" style="padding:8px 14px;white-space:nowrap;text-align:left;">
        <div style="display:flex;align-items:center;justify-content:left;gap:12px;margin:0 auto;max-width:240px;">
          <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid #e2e8f0;box-shadow:0 2px 4px rgba(0,0,0,0.05);">
            ${self._avatarHtml(nv.avatar_url, nv.ho_ten, 'sm')}
          </div>
          <div style="min-width:0;text-align:left;">
            <div style="font-size:15px;font-weight:700;color:var(--text-on-surface);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${nv.ho_ten || '—'}</div>
          </div>
        </div>
      </td>
      <td class="border-r border-outline-variant/30 text-center font-bold text-on-surface-variant text-body-sm" style="padding:8px 14px;">${nv.ma_ho_so || '—'}</td>
      <td class="border-r border-outline-variant/30 text-center" style="padding:8px 14px;">
        <span class="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${roleClass}">${roleLabel}</span>
      </td>
      <td class="border-r border-outline-variant/30 text-center text-body-sm font-medium text-on-surface-variant" style="padding:8px 14px;">
        <div>${nv.so_dien_thoai || '—'}</div>
        <div class="text-[11px] opacity-80">${nv.email || ''}</div>
      </td>
      <td class="border-r border-outline-variant/30 text-center" style="padding:8px 14px;">${statusBadge}</td>
      <td class="border-r border-outline-variant/30 text-center font-bold text-on-surface-variant text-body-sm" style="padding:8px 14px;">${nv.chi_nhanh || '—'}</td>
      <td class="sticky-col-right text-center" style="padding:8px 14px;white-space:nowrap;">
        <div style="display:inline-flex;gap:4px;align-items:center;justify-content:center;width:100%;">
          <button class="staff-view-btn w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all bg-[#f0fdf4] dark:bg-[#0b2010] text-[#1D9336] dark:text-[#4cce5f] hover:bg-[#1D9336] dark:hover:bg-[#4cce5f] hover:text-white dark:hover:text-[#111318]" data-id="${nv.id}" title="Xem chi tiết"><span class="material-symbols-outlined" style="font-size:15px;">visibility</span></button>
          <button class="staff-edit-btn w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all bg-[#eff6ff] dark:bg-[#0b1a30] text-[#3b82f6] dark:text-[#60a5fa] hover:bg-[#3b82f6] dark:hover:bg-[#60a5fa] hover:text-white dark:hover:text-[#111318]" data-id="${nv.id}" title="Chỉnh sửa"><span class="material-symbols-outlined" style="font-size:15px;">edit</span></button>
          ${nv.ten_dang_nhap ? `<button class="staff-lock-btn w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all bg-[#ffdad6] dark:bg-[#3d080c] text-[#ba1a1a] dark:text-[#ff8a93] hover:bg-[#ba1a1a] dark:hover:bg-[#ff8a93] hover:text-white dark:hover:text-[#111318]" data-id="${nv.id}" data-locked="${isLocked}" title="${lockTitle}"><span class="material-symbols-outlined" style="font-size:15px;">${lockIcon}</span></button>` : ''}
          <button class="staff-delete-btn w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all bg-[#fff1f2] dark:bg-[#2e0b10] text-[#f43f5e] dark:text-[#f87171] hover:bg-[#f43f5e] dark:hover:bg-[#f87171] hover:text-white dark:hover:text-[#111318]" data-id="${nv.id}" data-name="${nv.ho_ten}" title="Xóa"><span class="material-symbols-outlined" style="font-size:15px;">delete</span></button>
        </div>
      </td>`;
  },

  // Tách logic build HTML card mobile ra riêng để _appendRows dùng lại
  _buildCardHtml: function (nv) {
    const self = this;
    const isLocked = nv.tk_trang_thai === 'khoa';
    const roleLabel = nv.loai_ho_so === 'le_tan' ? 'Lễ tân' : 'Nhân viên';
    const roleClass = nv.loai_ho_so === 'le_tan'
      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
      : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
    const statusBadge = isLocked
      ? `<span style="padding:2px 8px;border-radius:999px;font-size:9.6px;font-weight:700;background:#ffdad6;color:#ba1a1a;">Bị khóa</span>`
      : `<span style="padding:2px 8px;border-radius:999px;font-size:9.6px;font-weight:700;background:#e7f5e9;color:#1D9336;">Hoạt động</span>`;
    return `
      <div class="staff-row" data-id="${nv.id}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--outline-variant,#e2e8f0);cursor:pointer;transition:background 0.12s;background:var(--bg-surface-lowest,#fff);" onmouseover="this.style.background='rgba(29,147,54,0.04)'" onmouseout="this.style.background='var(--bg-surface-lowest,#fff)'">
        <div style="flex-shrink:0;">
          <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;border:2px solid #e2e8f0;">${self._avatarHtml(nv.avatar_url, nv.ho_ten, 'sm')}</div>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:14px;font-weight:700;color:var(--text-on-surface);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${nv.ho_ten || '—'}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:2px;flex-wrap:wrap;">
            <span style="font-size:11px;font-weight:600;color:var(--text-on-surface-variant);">${nv.ma_ho_so || '—'}</span>
            ${nv.so_dien_thoai ? `<span style="font-size:11px;color:var(--text-on-surface-variant);">· ${nv.so_dien_thoai}</span>` : ''}
            ${nv.chi_nhanh ? `<span style="font-size:11px;color:#1D9336;font-weight:600;">· ${nv.chi_nhanh}</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:5px;margin-top:3px;flex-wrap:wrap;">
            ${statusBadge}
            <span class="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${roleClass}">${roleLabel}</span>
          </div>
        </div>
        <div style="display:flex;gap:4px;align-items:center;flex-shrink:0;">
          <button class="staff-view-btn" data-id="${nv.id}" title="Xem" style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#f0fdf4;color:#1D9336;border:none;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='#1D9336';this.style.color='#fff'" onmouseout="this.style.background='#f0fdf4';this.style.color='#1D9336'"><span class="material-symbols-outlined" style="font-size:15px;">visibility</span></button>
          <button class="staff-edit-btn" data-id="${nv.id}" title="Sửa" style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#eff6ff;color:#3b82f6;border:none;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='#3b82f6';this.style.color='#fff'" onmouseout="this.style.background='#eff6ff';this.style.color='#3b82f6'"><span class="material-symbols-outlined" style="font-size:15px;">edit</span></button>
        </div>
      </div>`;
  },

  _renderStaffTable: function () {
    const self = this;
    const paginated = self._staffFiltered;

    let rowsHtml = '';
    if (paginated.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="7" style="padding:60px 20px;text-align:center;color:var(--text-on-surface-variant);">
            <div style="display:flex;flex-direction:column;align-items:center;opacity:0.4;">
              <span class="material-symbols-outlined" style="font-size:48px;margin-bottom:8px;">person_search</span>
              <p style="font-weight:600;margin:0;">Không tìm thấy nhân viên nào</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      rowsHtml = paginated.map((nv) => {
        const roleLabel = nv.loai_ho_so === 'le_tan' ? 'Lễ tân' : 'Nhân viên';
        const roleClass = nv.loai_ho_so === 'le_tan'
          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
          : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';

        const isLocked = nv.tk_trang_thai === 'khoa';
        const lockIcon = isLocked ? 'lock' : 'lock_open';
        const lockTitle = isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản';
        const statusBadge = isLocked
          ? `<span style="padding:2px 8px;border-radius:999px;font-size:9.6px;font-weight:700;background:#ffdad6;color:#ba1a1a;">Bị khóa</span>`
          : `<span style="padding:2px 8px;border-radius:999px;font-size:9.6px;font-weight:700;background:#e7f5e9;color:#1D9336;">Hoạt động</span>`;

        return `
          <tr class="staff-row transition-colors hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10 border-b border-outline-variant/30 cursor-pointer bg-white dark:bg-[#1e1e1e] odd:bg-[#fafafa] odd:dark:bg-[#15171e]" data-id="${nv.id}">
            <td class="border-r border-outline-variant/30 sticky-col-left" style="padding:8px 14px;white-space:nowrap;text-align:left;">
              <div style="display:flex;align-items:center;justify-content:left;gap:12px;margin:0 auto;max-width:240px;">
                <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid #e2e8f0;box-shadow:0 2px 4px rgba(0,0,0,0.05);">
                  ${self._avatarHtml(nv.avatar_url, nv.ho_ten, 'sm')}
                </div>
                <div style="min-width:0;text-align:left;">
                  <div style="font-size:15px;font-weight:700;color:var(--text-on-surface);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">
                    ${nv.ho_ten || '—'}
                  </div>
                </div>
              </div>
            </td>
            <td class="border-r border-outline-variant/30 text-center font-bold text-on-surface-variant text-body-sm" style="padding:8px 14px;">
              ${nv.ma_ho_so || '—'}
            </td>
            <td class="border-r border-outline-variant/30 text-center" style="padding:8px 14px;">
              <span class="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${roleClass}">
                ${roleLabel}
              </span>
            </td>
            <td class="border-r border-outline-variant/30 text-center text-body-sm font-medium text-on-surface-variant" style="padding:8px 14px;">
              <div>${nv.so_dien_thoai || '—'}</div>
              <div class="text-[11px] opacity-80">${nv.email || ''}</div>
            </td>
            <td class="border-r border-outline-variant/30 text-center" style="padding:8px 14px;">
              ${statusBadge}
            </td>
            <td class="border-r border-outline-variant/30 text-center font-bold text-on-surface-variant text-body-sm" style="padding:8px 14px;">
              ${nv.chi_nhanh || '—'}
            </td>
            <td class="sticky-col-right text-center" style="padding:8px 14px;white-space:nowrap;">
              <div style="display:inline-flex;gap:4px;align-items:center;justify-content:center;width:100%;">
                <button class="staff-view-btn w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all bg-[#f0fdf4] dark:bg-[#0b2010] text-[#1D9336] dark:text-[#4cce5f] hover:bg-[#1D9336] dark:hover:bg-[#4cce5f] hover:text-white dark:hover:text-[#111318]" data-id="${nv.id}" title="Xem chi tiết">
                  <span class="material-symbols-outlined" style="font-size:15px;">visibility</span>
                </button>
                <button class="staff-edit-btn w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all bg-[#eff6ff] dark:bg-[#0b1a30] text-[#3b82f6] dark:text-[#60a5fa] hover:bg-[#3b82f6] dark:hover:bg-[#60a5fa] hover:text-white dark:hover:text-[#111318]" data-id="${nv.id}" title="Chỉnh sửa">
                  <span class="material-symbols-outlined" style="font-size:15px;">edit</span>
                </button>
                ${nv.ten_dang_nhap ? `
                  <button class="staff-lock-btn w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all bg-[#ffdad6] dark:bg-[#3d080c] text-[#ba1a1a] dark:text-[#ff8a93] hover:bg-[#ba1a1a] dark:hover:bg-[#ff8a93] hover:text-white dark:hover:text-[#111318]" data-id="${nv.id}" data-locked="${isLocked}" title="${lockTitle}">
                    <span class="material-symbols-outlined" style="font-size:15px;">${lockIcon}</span>
                  </button>
                ` : ''}
                <button class="staff-delete-btn w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all bg-[#fff1f2] dark:bg-[#2e0b10] text-[#f43f5e] dark:text-[#f87171] hover:bg-[#f43f5e] dark:hover:bg-[#f87171] hover:text-white dark:hover:text-[#111318]" data-id="${nv.id}" data-name="${nv.ho_ten}" title="Xóa">
                  <span class="material-symbols-outlined" style="font-size:15px;">delete</span>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Card Layout cho Mobile
    const cardRowsHtml = paginated.length === 0 ? `
      <div style="padding:40px 16px;text-align:center;color:var(--text-on-surface-variant);">
        <div style="display:flex;flex-direction:column;align-items:center;opacity:0.4;">
          <span class="material-symbols-outlined" style="font-size:40px;margin-bottom:8px;">person_search</span>
          <p style="font-weight:600;margin:0;">Không tìm thấy nhân viên nào</p>
        </div>
      </div>
    ` : paginated.map(nv => {
      const isLocked = nv.tk_trang_thai === 'khoa';
      const roleLabel = nv.loai_ho_so === 'le_tan' ? 'Lễ tân' : 'Nhân viên';
      const roleClass = nv.loai_ho_so === 'le_tan'
        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
        : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
      const statusBadge = isLocked
        ? `<span style="padding:2px 8px;border-radius:999px;font-size:9.6px;font-weight:700;background:#ffdad6;color:#ba1a1a;">Bị khóa</span>`
        : `<span style="padding:2px 8px;border-radius:999px;font-size:9.6px;font-weight:700;background:#e7f5e9;color:#1D9336;">Hoạt động</span>`;

      return `
        <div class="staff-row" data-id="${nv.id}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--outline-variant,#e2e8f0);cursor:pointer;transition:background 0.12s;background:var(--bg-surface-lowest,#fff);" onmouseover="this.style.background='rgba(29,147,54,0.04)'" onmouseout="this.style.background='var(--bg-surface-lowest,#fff)'">
          <div style="flex-shrink:0;">
            <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;border:2px solid #e2e8f0;">
              ${self._avatarHtml(nv.avatar_url, nv.ho_ten, 'sm')}
            </div>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:700;color:var(--text-on-surface);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${nv.ho_ten || '—'}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:2px;flex-wrap:wrap;">
              <span style="font-size:11px;font-weight:600;color:var(--text-on-surface-variant);">${nv.ma_ho_so || '—'}</span>
              ${nv.so_dien_thoai ? `<span style="font-size:11px;color:var(--text-on-surface-variant);">· ${nv.so_dien_thoai}</span>` : ''}
              ${nv.chi_nhanh ? `<span style="font-size:11px;color:#1D9336;font-weight:600;">· ${nv.chi_nhanh}</span>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px;flex-wrap:wrap;">
              ${statusBadge}
              <span class="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${roleClass}">${roleLabel}</span>
            </div>
          </div>
          <div style="display:flex;gap:4px;align-items:center;flex-shrink:0;">
            <button class="staff-view-btn" data-id="${nv.id}" title="Xem" style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#f0fdf4;color:#1D9336;border:none;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='#1D9336';this.style.color='#fff'" onmouseout="this.style.background='#f0fdf4';this.style.color='#1D9336'">
              <span class="material-symbols-outlined" style="font-size:15px;">visibility</span>
            </button>
            <button class="staff-edit-btn" data-id="${nv.id}" title="Sửa" style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#eff6ff;color:#3b82f6;border:none;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='#3b82f6';this.style.color='#fff'" onmouseout="this.style.background='#eff6ff';this.style.color='#3b82f6'">
              <span class="material-symbols-outlined" style="font-size:15px;">edit</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Spinner tải thêm — dùng chung HTML cho cả desktop và mobile
    const spinnerHtml = `
      <div class="staff-load-spinner" style="display:none;justify-content:center;align-items:center;padding:14px 0;gap:8px;">
        <span class="animate-spin rounded-full border-2 border-brand-primary border-t-transparent" style="width:18px;height:18px;display:inline-block;"></span>
        <span style="font-size:12px;color:var(--text-on-surface-variant);font-weight:600;">Đang tải thêm...</span>
      </div>`;

    return `
      <style>
        .staff-table-desktop { display: block; }
        .staff-table-mobile  { display: none; }

        #staff-scroll-container::-webkit-scrollbar { width:8px;height:8px; }
        #staff-scroll-container::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.15);border-radius:4px; }
        .dark #staff-scroll-container::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.15); }

        .sticky-col-left  { position:sticky!important;left:0;z-index:2;box-shadow:2px 0 5px -2px rgba(0,0,0,0.1);transition:background-color 0.15s ease-in-out; }
        .sticky-col-right { position:sticky!important;right:0;z-index:2;box-shadow:-2px 0 5px -2px rgba(0,0,0,0.1);transition:background-color 0.15s ease-in-out; }
        th.sticky-col-left, th.sticky-col-right { z-index:12!important;background:#1D9336!important; }

        tr.staff-row td.sticky-col-left, tr.staff-row td.sticky-col-right { background:#fff!important; }
        tr.staff-row:nth-child(odd) td.sticky-col-left, tr.staff-row:nth-child(odd) td.sticky-col-right { background:#fafafa!important; }
        .dark tr.staff-row td.sticky-col-left, .dark tr.staff-row td.sticky-col-right { background:#1e1e1e!important; }
        .dark tr.staff-row:nth-child(odd) td.sticky-col-left, .dark tr.staff-row:nth-child(odd) td.sticky-col-right { background:#15171e!important; }
        tr.staff-row:hover td.sticky-col-left, tr.staff-row:hover td.sticky-col-right { background:#f4faf5!important; }
        tr.staff-row:nth-child(odd):hover td.sticky-col-left, tr.staff-row:nth-child(odd):hover td.sticky-col-right { background:#eff5f0!important; }
        .dark tr.staff-row:hover td.sticky-col-left, .dark tr.staff-row:hover td.sticky-col-right { background:#1e2a20!important; }
        .dark tr.staff-row:nth-child(odd):hover td.sticky-col-left, .dark tr.staff-row:nth-child(odd):hover td.sticky-col-right { background:#162320!important; }

        @media (max-width:640px) {
          .staff-table-desktop { display:none; }
          .staff-table-mobile  { display:block; }
        }
      </style>

      <div class="col-span-full w-full rounded-2xl overflow-hidden border border-outline-variant shadow-sm">
        <!-- TABLE desktop -->
        <div id="staff-scroll-container" class="staff-table-desktop" style="max-height:500px;overflow-y:auto;overflow-x:auto;position:relative;">
          <table style="width:100%;border-collapse:collapse;min-width:480px;position:relative;">
            <thead>
              <tr>
                <th class="sticky-col-left" style="position:sticky;top:0;z-index:10;background:#1D9336;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Họ và tên</th>
                <th style="position:sticky;top:0;z-index:10;background:#1D9336;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Mã NV</th>
                <th style="position:sticky;top:0;z-index:10;background:#1D9336;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Vai trò</th>
                <th style="position:sticky;top:0;z-index:10;background:#1D9336;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Liên hệ</th>
                <th style="position:sticky;top:0;z-index:10;background:#1D9336;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Trạng thái</th>
                <th style="position:sticky;top:0;z-index:10;background:#1D9336;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Chi nhánh</th>
                <th class="sticky-col-right" style="position:sticky;top:0;z-index:10;background:#1D9336;padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.85);text-align:center;white-space:nowrap;border:none;">Thao tác</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <!-- Sentinel + Spinner cho desktop -->
          <div class="staff-sentinel" style="height:2px;opacity:0;pointer-events:none;"></div>
          ${spinnerHtml}
        </div>

        <!-- CARD LIST mobile -->
        <div id="staff-scroll-mobile-container" class="staff-table-mobile" style="max-height:500px;overflow-y:auto;">
          ${cardRowsHtml}
          <!-- Sentinel + Spinner cho mobile web -->
          <div class="staff-sentinel" style="height:2px;opacity:0;pointer-events:none;"></div>
          ${spinnerHtml}
        </div>
      </div>
    `;
  },

  // Hàm _bindRowEvents() đã được thay thế bằng Event Delegation trong init().
  // Xem phần container.addEventListener('click', ...) trong hàm init() ở trên.

  _showStaffModal: async function (id) {
    const self = this;
    let nv = null;

    try {
      const res = await window.GymApp.api.get(`/staff/${id}`);
      if (res?.success) nv = res.data;
    } catch (err) {
      console.error('Failed to fetch staff details:', err);
    }

    if (!nv) return;

    document.getElementById('gym-staff-detail-modal')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'gym-staff-detail-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);backdrop-filter:blur(6px);padding:16px;';

    const isActive = nv.tk_trang_thai !== 'khoa';
    const statusText = isActive ? '● Hoạt động' : '○ Bị khóa';
    const genderLabel = nv.gioi_tinh === 'nam' || nv.gioi_tinh === 'Nam' ? 'Nam'
      : nv.gioi_tinh === 'nu' || nv.gioi_tinh === 'Nu' ? 'Nữ'
        : (nv.gioi_tinh || '—');
    const roleLabel = nv.loai_ho_so === 'le_tan' ? 'Lễ tân' : 'Nhân viên';

    const infoRow = (icon, label, value) => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg-surface-lowest,#fff);">
        <div style="width:32px;height:32px;border-radius:8px;background:var(--bg-surface-low,#f0f7f1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span class="material-symbols-outlined" style="font-size:16px;color:#1D9336;font-variation-settings:'FILL' 1;">${icon}</span>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-on-surface-variant,#3f4a3c);opacity:0.6;margin-bottom:2px;">${label}</div>
          <div style="font-size:13px;font-weight:700;color:var(--text-on-surface,#1a2018);line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${value || '—'}">${value || '—'}</div>
        </div>
      </div>`;

    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:20px;width:100%;max-width:550px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;position:relative;box-shadow:0 32px 80px rgba(0,0,0,0.35);">
        <div style="background:linear-gradient(160deg,#2d6a4f 0%,#40916c 55%,#52b788 100%);padding:20px 24px;flex-shrink:0;position:relative;overflow:hidden;">
          <button id="close-staff-modal" style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.25);cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.18)'" title="Đóng">
            <span class="material-symbols-outlined" style="color:#fff;font-size:17px;">close</span>
          </button>
          <div style="display:flex;align-items:center;gap:16px;">
            <div style="position:relative;flex-shrink:0;">
              <div style="width:68px;height:68px;border-radius:50%;border:2.5px solid rgba(255,255,255,0.55);overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,0.18);">
                ${self._avatarHtml(nv.avatar_url, nv.ho_ten, 'lg')}
              </div>
            </div>
            <div style="flex:1;min-width:0;">
              <h3 style="font-size:19px;font-weight:800;color:#fff;margin:0 0 5px;letter-spacing:-0.01em;">${nv.ho_ten || '—'}</h3>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <span style="font-size:11px;color:rgba(255,255,255,0.75);font-weight:500;">${roleLabel}</span>
                <span style="width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,0.4);"></span>
                <span style="font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:${isActive ? 'rgba(116,198,157,0.3)' : 'rgba(255,255,255,0.12)'};color:${isActive ? '#d8f3dc' : 'rgba(255,255,255,0.75)'};border:1px solid ${isActive ? 'rgba(116,198,157,0.4)' : 'rgba(255,255,255,0.2)'};">${statusText}</span>
              </div>
            </div>
          </div>
        </div>

        <div style="overflow-y:auto;flex:1;padding:20px 24px;" class="bg-surface-container-lowest flex flex-col gap-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-[1px] bg-outline-variant rounded-xl overflow-hidden border border-outline-variant">
            ${infoRow('badge', 'Mã Nhân viên', nv.ma_ho_so)}
            ${infoRow('wc', 'Giới tính', genderLabel)}
            ${infoRow('cake', 'Ngày sinh', window.GymApp.formatDate(nv.ngay_sinh))}
            ${infoRow('store', 'Chi nhánh', nv.chi_nhanh || '—')}
            ${infoRow('call', 'Số điện thoại', nv.so_dien_thoai || '—')}
            ${infoRow('mail', 'Email', nv.email || '—')}
            <div class="col-span-1 sm:col-span-2">${infoRow('location_on', 'Địa chỉ tạm trú', nv.dia_chi_tam_tru || '—')}</div>
          <div class="col-span-1 sm:col-span-2">${infoRow('account_circle', 'Tên đăng nhập', nv.ten_dang_nhap || 'Chưa tạo tài khoản')}
            </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('close-staff-modal').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    const escH = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escH); } };
    document.addEventListener('keydown', escH);
  },

  _showEditStaffModal: async function (id) {
    const self = this;
    let nv = null;

    try {
      const res = await window.GymApp.api.get(`/staff/${id}`);
      if (res?.success) nv = res.data;
    } catch (err) {
      console.error('Failed to fetch staff details for edit:', err);
    }

    if (!nv) return;

    document.getElementById('gym-staff-modal')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'gym-staff-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);backdrop-filter:blur(6px);padding:16px;';

    const isLocked = nv.tk_trang_thai === 'khoa';
    const initial = (nv.ho_ten || '?').charAt(0).toUpperCase();

    overlay.innerHTML = `
      <div class="modal-card" style="border-radius:20px;width:100%;max-width:650px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;position:relative;box-shadow:0 32px 80px rgba(0,0,0,0.35);">
        <div style="background:linear-gradient(160deg,#1D9336 0%,#2d6a4f 100%);padding:20px 24px;flex-shrink:0;position:relative;">
          <h3 style="font-size:18px;font-weight:800;color:#fff;margin:0;">Chỉnh sửa thông tin nhân viên</h3>
          <button id="close-staff-modal" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.15);border:none;cursor:pointer;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
            <span class="material-symbols-outlined" style="color:#fff;font-size:16px;">close</span>
          </button>
        </div>

        <form id="staff-form" style="overflow-y:auto;flex:1;padding:24px;" class="bg-surface-container-lowest flex flex-col gap-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <!-- Avatar Upload -->
            <div class="col-span-1 sm:col-span-2 flex items-center gap-4 p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/30">
              <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;border:2px solid #e2e8f0;position:relative;flex-shrink:0;">
                <!-- Ảnh Cloudinary nếu có -->
                <img id="staff-avatar-preview"
                    src="${nv.avatar_url || ''}"
                    style="width:100%;height:100%;object-fit:cover;${nv.avatar_url ? '' : 'display:none;'}"
                    onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='flex';" />
                <div id="staff-avatar-placeholder"
                    style="width:100%;height:100%;display:${nv.avatar_url ? 'none' : 'flex'};align-items:center;justify-content:center;background:#e8f5e9;font-size:22px;font-weight:800;color:#1D9336;">
                    ${initial}
                </div>
              </div>
              <div class="flex-1">
                <div class="font-bold text-body-sm text-on-surface">Ảnh đại diện</div>
                <div class="text-[11px] text-on-surface-variant mb-2">Hỗ trợ JPG, PNG. Tối đa 2MB</div>
                <input type="file" id="staff-avatar-file" accept="image/*" class="hidden" />
                <button type="button" id="btn-staff-upload-avatar" class="px-3 py-1.5 rounded-lg border border-outline-variant bg-white dark:bg-[#1e1e1e] text-on-surface hover:bg-brand-primary/5 hover:text-brand-primary text-body-xs font-bold transition-all active:scale-95 cursor-pointer">
                  Chọn ảnh
                </button>
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-body-sm font-bold text-on-surface">Họ và tên <span class="text-error">*</span></label>
              <input type="text" name="ho_ten" required value="${nv.ho_ten || ''}" class="w-full bg-surface-container-low/50 border border-outline-variant/50 text-on-surface px-3 py-2 rounded-xl focus:border-brand-primary outline-none text-body-sm font-medium transition-all" />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-body-sm font-bold text-on-surface">Số điện thoại <span class="text-error">*</span></label>
              <input type="tel" name="so_dien_thoai" required value="${nv.so_dien_thoai || ''}" class="w-full bg-surface-container-low/50 border border-outline-variant/50 text-on-surface px-3 py-2 rounded-xl focus:border-brand-primary outline-none text-body-sm font-medium transition-all" />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-body-sm font-bold text-on-surface">Email</label>
              <input type="email" name="email" value="${nv.email || ''}" class="w-full bg-surface-container-low/50 border border-outline-variant/50 text-on-surface px-3 py-2 rounded-xl focus:border-brand-primary outline-none text-body-sm font-medium transition-all" />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-body-sm font-bold text-on-surface">Giới tính</label>
              <select name="gioi_tinh" class="w-full bg-surface-container-low/50 border border-outline-variant/50 text-on-surface px-3 py-2 rounded-xl focus:border-brand-primary outline-none text-body-sm font-bold transition-all">
                <option value="Nam" ${nv.gioi_tinh === 'Nam' ? 'selected' : ''}>Nam</option>
                <option value="Nu" ${nv.gioi_tinh === 'Nu' || nv.gioi_tinh === 'nu' ? 'selected' : ''}>Nữ</option>
                <option value="Khac" ${nv.gioi_tinh === 'Khac' ? 'selected' : ''}>Khác</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-body-sm font-bold text-on-surface">Ngày sinh</label>
              <input type="date" name="ngay_sinh" value="${nv.ngay_sinh ? nv.ngay_sinh.split('T')[0] : ''}" class="w-full bg-surface-container-low/50 border border-outline-variant/50 text-on-surface px-3 py-2 rounded-xl focus:border-brand-primary outline-none text-body-sm font-medium transition-all" />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-body-sm font-bold text-on-surface">Chi nhánh <span class="text-error">*</span></label>
              <select name="chi_nhanh" required id="staff-branch-select" class="w-full bg-surface-container-low/50 border border-outline-variant/50 text-on-surface px-3 py-2 rounded-xl focus:border-brand-primary outline-none text-body-sm font-bold transition-all">
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-body-sm font-bold text-on-surface">Vai trò <span class="text-error">*</span></label>
              <select name="loai_ho_so" required class="w-full bg-surface-container-low/50 border border-outline-variant/50 text-on-surface px-3 py-2 rounded-xl focus:border-brand-primary outline-none text-body-sm font-bold transition-all">
                <option value="nhan_vien" selected>Nhân viên</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-body-sm font-bold text-on-surface">Trạng thái tài khoản</label>
              <select name="trang_thai" class="w-full bg-surface-container-low/50 border border-outline-variant/50 text-on-surface px-3 py-2 rounded-xl focus:border-brand-primary outline-none text-body-sm font-bold transition-all">
                <option value="hoat_dong" ${!isLocked ? 'selected' : ''}>Kích hoạt</option>
                <option value="khoa" ${isLocked ? 'selected' : ''}>Khóa tài khoản</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
              <label class="text-body-sm font-bold text-on-surface">Địa chỉ tạm trú</label>
              <input type="text" name="dia_chi_tam_tru" value="${nv.dia_chi_tam_tru || ''}" class="w-full bg-surface-container-low/50 border border-outline-variant/50 text-on-surface px-3 py-2 rounded-xl focus:border-brand-primary outline-none text-body-sm font-medium transition-all" />
            </div>

            <!-- Thông tin tài khoản -->
            <div class="col-span-1 sm:col-span-2 border border-outline-variant/40 p-3 rounded-xl bg-surface-container-low/30 flex flex-col gap-3">
              <div class="font-bold text-body-sm text-brand-primary flex items-center gap-xs">
                <span class="material-symbols-outlined text-base">manage_accounts</span>
                Tài khoản đăng nhập
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                  <label class="text-body-sm font-bold text-on-surface">Tên đăng nhập</label>
                  <input type="text" name="ten_dang_nhap" value="${nv.ten_dang_nhap || ''}" ${nv.ten_dang_nhap ? 'readonly class="w-full bg-surface-container text-on-surface-variant cursor-not-allowed opacity-75 px-3 py-2 rounded-xl border border-outline-variant/50 outline-none text-body-sm font-medium"' : 'class="w-full bg-surface-container-low/50 border border-outline-variant/50 text-on-surface px-3 py-2 rounded-xl focus:border-brand-primary outline-none text-body-sm font-medium transition-all"'} placeholder="Tên đăng nhập" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-body-sm font-bold text-on-surface">${nv.ten_dang_nhap ? 'Đổi mật khẩu mới' : 'Mật khẩu'}</label>
                  <input type="password" name="mat_khau" class="w-full bg-surface-container-low/50 border border-outline-variant/50 text-on-surface px-3 py-2 rounded-xl focus:border-brand-primary outline-none text-body-sm font-medium transition-all" placeholder="${nv.ten_dang_nhap ? 'Để trống nếu không muốn đổi' : 'Ít nhất 6 ký tự'}" />
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
              <label class="text-body-sm font-bold text-on-surface">Ghi chú</label>
              <textarea name="ghi_chu" rows="2" class="w-full bg-surface-container-low/50 border border-outline-variant/50 text-on-surface px-3 py-2 rounded-xl focus:border-brand-primary outline-none text-body-sm font-medium transition-all">${nv.ghi_chu || ''}</textarea>
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex items-center justify-end gap-compact pt-4 border-t border-outline-variant/50 flex-shrink-0">
            <button type="button" id="btn-cancel-staff" class="px-4 py-2 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container-low transition-all text-body-sm font-bold active:scale-95 duration-200 cursor-pointer">
              Hủy
            </button>
            <button type="submit" class="px-4 py-2 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 hover:shadow-lg transition-all text-body-sm font-bold active:scale-95 duration-200 cursor-pointer">
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    `;

    // Populate branches
    const branchSelect = overlay.querySelector('#staff-branch-select');
    if (branchSelect) {
      try {
        const branches = await fetch('assets/data/branches.json').then(r => r.json());
        branchSelect.innerHTML = branches.map(b =>
          `<option value="${b.ten}" ${nv.chi_nhanh === b.ten ? 'selected' : ''}>${b.ten}</option>`
        ).join('');
      } catch (e) {
        console.error('Load branches error in staff modal', e);
      }
    }

    document.body.appendChild(overlay);

    // Avatar upload
    const btnUpload = overlay.querySelector('#btn-staff-upload-avatar');
    const fileInput = overlay.querySelector('#staff-avatar-file');
    const imgPreview = overlay.querySelector('#staff-avatar-preview');
    const placeholder = overlay.querySelector('#staff-avatar-placeholder');
    let avatarFileObj = null;

    btnUpload?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', function () {
      const file = this.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        window.GymApp.toast('Ảnh không được vượt quá 2MB', 'error');
        return;
      }
      avatarFileObj = file;
      const reader = new FileReader();
      reader.onload = e => {
        if (imgPreview) {
          imgPreview.src = e.target.result;
          imgPreview.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
      };
      reader.readAsDataURL(file);
    });

    const close = () => overlay.remove();
    overlay.querySelector('#btn-cancel-staff')?.addEventListener('click', close);
    overlay.querySelector('#close-staff-modal')?.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    const escH = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escH); } };
    document.addEventListener('keydown', escH);

    // Form submit
    const form = overlay.querySelector('#staff-form');
    form?.addEventListener('submit', async function (e) {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      const loadingOverlay = document.createElement('div');
      loadingOverlay.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.2);backdrop-filter:blur(2px);';
      loadingOverlay.innerHTML = `<div class="animate-spin rounded-full h-8 w-8 border-4 border-brand-primary border-t-transparent"></div>`;
      document.body.appendChild(loadingOverlay);

      try {
        // Gửi FormData trực tiếp — bao gồm file avatar nếu có
        const fd = new FormData();
        fd.append('ho_ten', data.ho_ten);
        fd.append('so_dien_thoai', data.so_dien_thoai);
        fd.append('email', data.email || '');
        fd.append('gioi_tinh', data.gioi_tinh);
        fd.append('ngay_sinh', data.ngay_sinh || '');
        fd.append('chi_nhanh', data.chi_nhanh);
        fd.append('loai_ho_so', data.loai_ho_so);
        fd.append('trang_thai', data.trang_thai);
        fd.append('dia_chi_tam_tru', data.dia_chi_tam_tru || '');
        fd.append('ghi_chu', data.ghi_chu || '');
        if (data.ten_dang_nhap) fd.append('ten_dang_nhap', data.ten_dang_nhap);
        if (data.mat_khau) fd.append('mat_khau', data.mat_khau);

        // Đính kèm file ảnh mới nếu user có chọn
        if (avatarFileObj) {
          fd.append('avatar', avatarFileObj);
        }

        const token = localStorage.getItem('gym-token');
        const response = await fetch(`http://localhost:3000/api/staff/${id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }, // KHÔNG set Content-Type
          body: fd
        });

        const res = await response.json();
        if (res.success) {
          window.GymApp.toast('Cập nhật hồ sơ nhân viên thành công!', 'success');
          close();
          self._loadData();
        } else {
          window.GymApp.toast(res.message || 'Lỗi cập nhật', 'error');
        }
      } catch (err) {
        window.GymApp.toast(err.message || 'Lỗi kết nối máy chủ', 'error');
      } finally {
        loadingOverlay.remove();
      }
    });
  }
};