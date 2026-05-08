window.GymApp.pages['pt-training'] = {
  _keyword: '',
  _filterStatus: '',

  render: function () {
    return `
      <div class="flex flex-col gap-margin">

        <!-- Page Title -->
        <div>
          <h2 class="font-display-2xl text-display-2xl text-on-surface font-bold">Lịch đào tạo PT</h2>
          <p class="text-on-surface-variant font-body-sm text-body-sm">Quản lý lịch tập của các huấn luyện viên cá nhân</p>
        </div>

        <!-- Stats PT -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-loose">
          ${
            (function() {
              const pts = window.GymApp.data.pts || [];
              const schedules = window.GymApp.data.ptSchedules || [];
              const today = new Date().toISOString().split('T')[0];
              return [
                { label: 'Tổng PT', value: pts.length, icon: 'sports_gymnastics', color: 'text-brand-primary' },
                { label: 'Lịch hôm nay', value: schedules.filter(s => s.ngay_tap === today).length, icon: 'event_available', color: 'text-[#006b20]' },
                { label: 'Đã tập', value: schedules.filter(s=>s.trang_thai==='da_tap').length, icon: 'check_circle', color: 'text-brand-primary' },
                { label: 'Chờ tập', value: (schedules.filter(s=>s.trang_thai==='cho_tap' || s.trang_thai==='pending').length), icon: 'pending', color: 'text-[#e65100]' },
              ].map(s => `
                <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-loose shadow-sm flex flex-col gap-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-on-surface-variant font-body-sm text-body-sm uppercase tracking-wider font-bold">${s.label}</span>
                    <span class="material-symbols-outlined ${s.color} text-xl">${s.icon}</span>
                  </div>
                  <span class="${s.color} font-display-2xl text-display-2xl font-bold">${s.value}</span>
                </div>
              `).join('');
            })()
          }
        </div>

        <!-- Header: Tìm kiếm + Bộ lọc + Tải lại -->
        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-standard shadow-sm">
          <div class="flex flex-col md:flex-row items-start md:items-center gap-standard">
            <!-- Tìm kiếm -->
            <div class="relative flex-1">
              <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
              <input
                id="pt-search"
                class="w-full bg-surface-container-low border border-outline-variant text-on-surface pl-8 pr-standard py-compact rounded-lg focus:border-brand-primary outline-none font-body-md text-body-md"
                placeholder="Tìm theo tên PT, hội viên..."
                type="text"
              />
            </div>

            <!-- Bộ lọc trạng thái -->
            <select id="pt-filter-status" class="bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-lg focus:border-brand-primary outline-none font-body-md text-body-md">
              <option value="">Tất cả trạng thái</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="pending">Chờ xác nhận</option>
            </select>

            <!-- Bộ lọc PT -->
            <select id="pt-filter-pt" class="bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-lg focus:border-brand-primary outline-none font-body-md text-body-md">
              <option value="">Tất cả PT</option>
              ${window.GymApp.data.pts.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
            </select>

            <!-- Nút tải lại -->
            <button id="pt-reload" class="flex items-center gap-xs px-loose py-compact rounded-lg border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-colors font-body-md">
              <span class="material-symbols-outlined text-sm">refresh</span>
              Tải lại
            </button>
          </div>
        </div>

        <!-- Container: Cards lịch đào tạo -->
        <div id="pt-schedule-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-loose">
          ${window.GymApp.pages['pt-training']._renderCards(window.GymApp.data.ptSchedules || [])}
        </div>

        <!-- Danh sách PT -->
        <div>
          <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface mb-standard">Huấn luyện viên</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-loose">
            ${(window.GymApp.data.pts || []).map(pt => `
              <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-loose shadow-sm flex flex-col items-center gap-standard hover:shadow-md transition-shadow">
                ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten, 'lg')}
                <div class="text-center">
                  <p class="font-bold text-on-surface text-body-md">${pt.ho_ten}</p>
                  <p class="text-on-surface-variant text-body-sm">${pt.ma_ho_so}</p>
                </div>
                <div class="flex items-center gap-xs">
                  <span class="material-symbols-outlined text-sm text-[#f59e0b]">star</span>
                  <span class="font-bold text-on-surface text-body-sm">4.8</span>
                  <span class="text-on-surface-variant text-body-sm">(${pt.so_hoc_vien || 0} học viên)</span>
                </div>
                <div class="flex items-center gap-xs text-on-surface-variant text-body-sm">
                  <span class="material-symbols-outlined text-sm">work</span>
                  ${pt.tong_buoi_da_day || 0} buổi đã dạy
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;
  },

  _renderCards: function (schedules) {
    const list = Array.isArray(schedules) ? schedules : [];
    if (list.length === 0) {
      return `<div class="md:col-span-3 bg-surface-container-lowest rounded-xl border border-outline-variant p-margin text-center text-on-surface-variant">
        <span class="material-symbols-outlined text-4xl text-outline">event_busy</span>
        <p class="mt-standard">Không tìm thấy lịch đào tạo</p>
      </div>`;
    }
    return list.map(s => `
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <!-- Card header -->
        <div class="px-loose py-standard border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <span class="text-on-surface-variant text-body-sm font-bold">#${s.id}</span>
          ${window.GymApp.statusBadge(s.trang_thai || s.status)}
        </div>

        <!-- Card body -->
        <div class="p-loose flex flex-col gap-standard">
          <!-- PT -->
          <div class="flex items-center gap-compact">
            <div class="w-8 h-8 bg-[#e7f5e9] rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-brand-primary text-sm">sports_gymnastics</span>
            </div>
            <div>
              <p class="text-on-surface-variant text-body-sm">Huấn luyện viên</p>
              <p class="font-bold text-on-surface text-body-md">${s.ten_pt || s.ptName}</p>
            </div>
          </div>

          <!-- Hội viên -->
          <div class="flex items-center gap-compact">
            <div class="w-8 h-8 bg-[#e7f5e9] rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-brand-primary text-sm">person</span>
            </div>
            <div>
              <p class="text-on-surface-variant text-body-sm">Hội viên</p>
              <p class="font-bold text-on-surface text-body-md">${s.ten_hoi_vien || s.memberName}</p>
            </div>
          </div>

          <!-- Thời gian -->
          <div class="flex items-center gap-compact">
            <div class="w-8 h-8 bg-[#e7f5e9] rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-brand-primary text-sm">schedule</span>
            </div>
            <div>
              <p class="text-on-surface-variant text-body-sm">${window.GymApp.formatDate(s.ngay_tap || s.date)}</p>
              <p class="font-bold text-on-surface text-body-md">${s.gio_bat_dau || s.startTime} — ${s.gio_ket_thuc || s.endTime}</p>
            </div>
          </div>

          <!-- Loại & ghi chú -->
          <div class="flex items-center gap-standard">
            <span class="bg-surface-container px-compact py-xs rounded-full text-body-sm text-on-surface-variant font-bold">${s.loai_buoi || s.type || 'Cá nhân'}</span>
            ${s.ghi_chu || s.notes ? `<span class="text-on-surface-variant text-body-sm truncate">${s.ghi_chu || s.notes}</span>` : ''}
          </div>
        </div>

        <!-- Card footer -->
        <div class="px-loose py-compact border-t border-outline-variant flex items-center justify-end gap-atom">
          <button class="material-symbols-outlined text-outline hover:text-brand-primary text-xl p-atom rounded hover:bg-surface-container transition-colors" title="Xem">visibility</button>
          <button class="material-symbols-outlined text-outline hover:text-brand-primary text-xl p-atom rounded hover:bg-surface-container transition-colors" title="Sửa">edit</button>
          <button class="material-symbols-outlined text-outline hover:text-error text-xl p-atom rounded hover:bg-error-container transition-colors" title="Hủy lịch">event_busy</button>
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

  init: function () {
    const self = this;
    document.getElementById('pt-search')?.addEventListener('input', () => self._applyFilter());
    document.getElementById('pt-filter-status')?.addEventListener('change', () => self._applyFilter());
    document.getElementById('pt-filter-pt')?.addEventListener('change', () => self._applyFilter());
    document.getElementById('pt-reload')?.addEventListener('click', () => {
      document.getElementById('pt-search').value = '';
      document.getElementById('pt-filter-status').value = '';
      document.getElementById('pt-filter-pt').value = '';
      self._applyFilter();
      window.GymApp.toast('Đã tải lại danh sách!', 'success');
    });
  }
};
