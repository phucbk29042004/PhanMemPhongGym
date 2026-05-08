window.GymApp.pages['pt-training'] = {
  _keyword: '',
  _filterStatus: '',

  render: function () {
    const pts = window.GymApp.data.pts || [];
    const schedules = window.GymApp.data.ptSchedules || [];
    const today = new Date().toISOString().split('T')[0];

    const stats = [
      { label: 'Tổng PT', value: pts.length, icon: 'sports_gymnastics', iconBg: 'icon-bg-green', color: 'text-brand-primary' },
      { label: 'Lịch hôm nay', value: schedules.filter(s => s.ngay_tap === today).length, icon: 'event_available', iconBg: 'icon-bg-green', color: 'text-brand-primary' },
      { label: 'Đã tập', value: schedules.filter(s => s.trang_thai === 'da_tap').length, icon: 'check_circle', iconBg: 'icon-bg-green', color: 'text-brand-primary' },
      { label: 'Chờ tập', value: schedules.filter(s => s.trang_thai === 'cho_tap' || s.trang_thai === 'pending').length, icon: 'pending', iconBg: 'icon-bg-orange', color: 'text-[#e65100]' },
    ];

    return `
      <div class="flex flex-col gap-margin">

        <!-- Page Title -->
        <div class="page-title-bar">
          <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Lịch đào tạo PT</h2>
          <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs">Quản lý lịch tập của các huấn luyện viên cá nhân</p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-loose">
          ${stats.map(s => `
            <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm flex flex-col gap-standard">
              <div class="flex items-center justify-between">
                <span class="text-on-surface-variant font-body-sm text-body-sm font-bold uppercase tracking-wider leading-tight" style="max-width:calc(100% - 48px)">${s.label}</span>
                <div class="icon-bg ${s.iconBg}">
                  <span class="material-symbols-outlined ${s.color} text-xl" style="font-variation-settings:'FILL' 1">${s.icon}</span>
                </div>
              </div>
              <span class="${s.color} font-display-lg text-display-lg font-bold">${s.value}</span>
            </div>
          `).join('')}
        </div>

        <!-- Filter Bar -->
        <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-standard shadow-sm">
          <div class="flex flex-wrap items-center gap-standard">
            <div class="relative flex-1 min-w-[200px]">
              <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
              <input
                id="pt-search"
                class="w-full bg-surface-container-low border border-outline-variant text-on-surface pl-8 pr-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md transition-colors"
                placeholder="Tìm theo tên PT, hội viên..."
                type="text"
              />
            </div>

            <select id="pt-filter-status" class="bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md min-w-[150px] transition-colors">
              <option value="">Tất cả trạng thái</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="pending">Chờ xác nhận</option>
            </select>

            <select id="pt-filter-pt" class="bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md min-w-[150px] transition-colors">
              <option value="">Tất cả PT</option>
              ${pts.map(p => `<option value="${p.id}">${p.ho_ten || p.name}</option>`).join('')}
            </select>

            <button id="pt-reload" class="flex items-center gap-xs px-loose py-compact rounded-xl border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-all font-body-md whitespace-nowrap">
              <span class="material-symbols-outlined text-sm">refresh</span>
              Tải lại
            </button>
          </div>
        </div>

        <!-- Cards lịch đào tạo -->
        <div id="pt-schedule-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-loose">
          ${this._renderCards(schedules)}
        </div>

        <!-- Danh sách PT -->
        <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
          <div class="section-header px-loose py-standard border-b border-outline-variant flex items-center gap-compact">
            <div class="icon-bg icon-bg-green">
              <span class="material-symbols-outlined text-brand-primary text-lg" style="font-variation-settings:'FILL' 1">sports_gymnastics</span>
            </div>
            <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Huấn luyện viên</h3>
            <span class="ml-auto bg-brand-primary text-white px-compact py-xs rounded-full text-label-xs font-bold">${pts.length} PT</span>
          </div>
          <div class="p-loose grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-loose">
            ${pts.length === 0
              ? `<div class="col-span-5 py-margin text-center text-on-surface-variant">
                   <span class="material-symbols-outlined text-4xl text-outline block mb-standard">person_off</span>
                   Chưa có huấn luyện viên nào
                 </div>`
              : pts.map(pt => `
                <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm flex flex-col items-center gap-standard">
                  ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten, 'lg')}
                  <div class="text-center">
                    <p class="font-bold text-on-surface text-body-md">${pt.ho_ten}</p>
                    <p class="text-on-surface-variant text-body-sm">${pt.ma_ho_so}</p>
                  </div>
                  <div class="flex items-center gap-xs">
                    <span class="material-symbols-outlined text-sm text-[#f59e0b]" style="font-variation-settings:'FILL' 1">star</span>
                    <span class="font-bold text-on-surface text-body-sm">4.8</span>
                    <span class="text-on-surface-variant text-body-sm">(${pt.so_hoc_vien || 0})</span>
                  </div>
                  <div class="flex items-center gap-xs text-on-surface-variant text-body-sm">
                    <span class="material-symbols-outlined text-sm">work</span>
                    ${pt.tong_buoi_da_day || 0} buổi
                  </div>
                </div>
              `).join('')
            }
          </div>
        </div>

      </div>
    `;
  },

  _renderCards: function (schedules) {
    const list = Array.isArray(schedules) ? schedules : [];
    if (list.length === 0) {
      return `
        <div class="md:col-span-3 bg-surface-container-lowest rounded-2xl border border-outline-variant p-margin text-center">
          <div class="icon-bg icon-bg-orange mx-auto mb-standard" style="width:56px;height:56px;border-radius:16px">
            <span class="material-symbols-outlined text-[#e65100] text-2xl">event_busy</span>
          </div>
          <p class="text-on-surface font-bold text-body-md">Không tìm thấy lịch đào tạo</p>
          <p class="text-on-surface-variant text-body-sm mt-xs">Thử thay đổi bộ lọc hoặc tải lại dữ liệu</p>
        </div>
      `;
    }
    return list.map(s => `
      <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
        <!-- Card header -->
        <div class="px-loose py-standard border-b border-outline-variant flex items-center justify-between section-header">
          <span class="text-on-surface-variant text-body-sm font-bold">#${s.id}</span>
          ${window.GymApp.statusBadge(s.trang_thai || s.status)}
        </div>

        <!-- Card body -->
        <div class="p-loose flex flex-col gap-standard flex-1">
          <div class="flex items-center gap-compact">
            <div class="icon-bg icon-bg-green" style="width:32px;height:32px;border-radius:8px">
              <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">sports_gymnastics</span>
            </div>
            <div>
              <p class="text-on-surface-variant text-body-sm">Huấn luyện viên</p>
              <p class="font-bold text-on-surface text-body-md">${s.ten_pt || s.ptName || '—'}</p>
            </div>
          </div>

          <div class="flex items-center gap-compact">
            <div class="icon-bg icon-bg-blue" style="width:32px;height:32px;border-radius:8px">
              <span class="material-symbols-outlined text-secondary text-sm" style="font-variation-settings:'FILL' 1">person</span>
            </div>
            <div>
              <p class="text-on-surface-variant text-body-sm">Hội viên</p>
              <p class="font-bold text-on-surface text-body-md">${s.ten_hoi_vien || s.memberName || '—'}</p>
            </div>
          </div>

          <div class="flex items-center gap-compact">
            <div class="icon-bg icon-bg-orange" style="width:32px;height:32px;border-radius:8px">
              <span class="material-symbols-outlined text-[#e65100] text-sm" style="font-variation-settings:'FILL' 1">schedule</span>
            </div>
            <div>
              <p class="text-on-surface-variant text-body-sm">${window.GymApp.formatDate(s.ngay_tap || s.date)}</p>
              <p class="font-bold text-on-surface text-body-md">${s.gio_bat_dau || s.startTime || '—'} — ${s.gio_ket_thuc || s.endTime || '—'}</p>
            </div>
          </div>

          <div class="flex items-center gap-standard">
            <span class="bg-surface-container px-compact py-xs rounded-full text-body-sm text-on-surface-variant font-bold">${s.loai_buoi || s.type || 'Cá nhân'}</span>
            ${s.ghi_chu || s.notes ? `<span class="text-on-surface-variant text-body-sm truncate">${s.ghi_chu || s.notes}</span>` : ''}
          </div>
        </div>

        <!-- Card footer -->
        <div class="px-loose py-compact border-t border-outline-variant flex items-center justify-end gap-atom bg-surface-container-low">
          <button class="material-symbols-outlined text-outline hover:text-brand-primary text-xl p-atom rounded-lg hover:bg-surface-container transition-colors" title="Xem">visibility</button>
          <button class="material-symbols-outlined text-outline hover:text-brand-primary text-xl p-atom rounded-lg hover:bg-surface-container transition-colors" title="Sửa">edit</button>
          <button class="material-symbols-outlined text-outline hover:text-error text-xl p-atom rounded-lg hover:bg-error-container transition-colors" title="Hủy lịch">event_busy</button>
        </div>
      </div>
    `).join('');
  },

  _applyFilter: function () {
    const q = document.getElementById('pt-search')?.value.toLowerCase() || '';
    const status = document.getElementById('pt-filter-status')?.value || '';
    const ptId = document.getElementById('pt-filter-pt')?.value || '';
    const filtered = (window.GymApp.data.ptSchedules || []).filter(s => {
      const ptName = (s.ten_pt || s.ptName || '').toLowerCase();
      const hvName = (s.ten_hoi_vien || s.memberName || '').toLowerCase();
      const matchQ = !q || ptName.includes(q) || hvName.includes(q);
      const matchS = !status || s.trang_thai === status || s.status === status;
      const matchPt = !ptId || s.pt_id == ptId || s.ptId == ptId;
      return matchQ && matchS && matchPt;
    });
    document.getElementById('pt-schedule-container').innerHTML = this._renderCards(filtered);
  },

  init: async function () {
    const self = this;

    // Fix bug: fetch ptSchedules nếu chưa có (tránh trang hiển thị rỗng khi vào thẳng)
    if (!window.GymApp.data.ptSchedules || window.GymApp.data.ptSchedules.length === 0) {
      try {
        const res = await window.GymApp.api.get('/pt/schedules');
        if (res?.success) {
          window.GymApp.data.ptSchedules = Array.isArray(res.data) ? res.data : [];
          document.getElementById('pt-schedule-container').innerHTML = self._renderCards(window.GymApp.data.ptSchedules);
        }
      } catch (err) {
        console.error('Failed to fetch pt schedules', err);
      }
    }

    document.getElementById('pt-search')?.addEventListener('input', () => self._applyFilter());
    document.getElementById('pt-filter-status')?.addEventListener('change', () => self._applyFilter());
    document.getElementById('pt-filter-pt')?.addEventListener('change', () => self._applyFilter());
    document.getElementById('pt-reload')?.addEventListener('click', async () => {
      try {
        const res = await window.GymApp.api.get('/pt/schedules');
        if (res?.success) window.GymApp.data.ptSchedules = Array.isArray(res.data) ? res.data : [];
      } catch (err) { console.error(err); }
      document.getElementById('pt-search').value = '';
      document.getElementById('pt-filter-status').value = '';
      document.getElementById('pt-filter-pt').value = '';
      self._applyFilter();
      window.GymApp.toast('Đã tải lại danh sách!', 'success');
    });
  }
};
