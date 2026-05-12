window.GymApp.pages['pt-training'] = {
  _keyword: '',
  _filterStatus: '',

  render: function () {
    const pts = window.GymApp.data.pts || [];
    const schedules = window.GymApp.data.ptSchedules || [];
    const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];
    const todaySchedules = schedules.filter(s => s.ngay_tap === today);

    const stats = [
      { label: 'Tổng PT', value: pts.length, icon: 'sports_gymnastics', iconBg: 'icon-bg-green', color: 'text-brand-primary' },
      { label: 'Lịch hôm nay', value: todaySchedules.length, icon: 'event_available', iconBg: 'icon-bg-green', color: 'text-brand-primary' },
      { label: 'Đã tập', value: todaySchedules.filter(s => s.trang_thai === 'da_tap').length, icon: 'check_circle', iconBg: 'icon-bg-green', color: 'text-brand-primary' },
      { label: 'Chờ tập', value: todaySchedules.filter(s => s.trang_thai === 'cho_tap' || s.trang_thai === 'pending').length, icon: 'pending', iconBg: 'icon-bg-orange', color: 'text-[#e65100]' },
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

      <!-- Modal Sửa lịch -->
      <div id="modal-edit-schedule" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl w-full max-w-md mx-loose p-loose flex flex-col gap-margin">
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
            <div class="grid grid-cols-2 gap-standard">
              <div>
                <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Giờ bắt đầu</label>
                <input id="edit-schedule-start" type="time" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md transition-colors" />
              </div>
              <div>
                <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Giờ kết thúc</label>
                <input id="edit-schedule-end" type="time" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md transition-colors" />
              </div>
            </div>
            <div>
              <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Ghi chú</label>
              <textarea id="edit-schedule-note" rows="2" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md resize-none transition-colors"></textarea>
            </div>
          </div>
          <div class="flex gap-standard justify-end pt-xs border-t border-outline-variant">
            <button id="cancel-edit-schedule" class="px-loose py-compact rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all font-bold text-body-md">Hủy bỏ</button>
            <button id="save-edit-schedule" class="px-loose py-compact rounded-xl btn-primary text-white font-bold text-body-md flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">save</span>Lưu thay đổi
            </button>
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
            <span class="bg-surface-container px-compact py-xs rounded-full text-body-sm text-on-surface-variant font-bold">${window.GymApp.formatEnumLabel(s.loai_buoi || s.type || 'ca_nhan')}</span>
            ${s.ghi_chu || s.notes ? `<span class="text-on-surface-variant text-body-sm truncate">${s.ghi_chu || s.notes}</span>` : ''}
          </div>
        </div>

        <!-- Card footer -->
        <div class="px-loose py-compact border-t border-outline-variant flex items-center justify-end gap-atom bg-surface-container-low">
          ${s.trang_thai === 'cho_tap' ? `
            <button class="btn-edit-schedule material-symbols-outlined text-outline hover:text-brand-primary text-xl p-atom rounded-lg hover:bg-surface-container transition-colors"
              data-id="${s.id}" data-ngay="${s.ngay_tap || ''}" data-start="${s.gio_bat_dau || ''}" data-end="${s.gio_ket_thuc || ''}" data-ghi-chu="${(s.ghi_chu || '').replace(/"/g, '&quot;')}"
              title="Sửa lịch">edit</button>
            <button class="btn-cancel-schedule material-symbols-outlined text-outline hover:text-error text-xl p-atom rounded-lg hover:bg-error-container transition-colors"
              data-id="${s.id}" title="Hủy lịch">event_busy</button>
          ` : ''}
          ${s.trang_thai === 'da_tap' && s.ghi_chu === 'auto_cron'
            ? `<button class="btn-hoan-tac flex items-center gap-xs px-compact py-xs rounded-lg bg-orange-50 border border-orange-200 text-[#e65100] hover:bg-orange-100 transition-all text-body-sm font-bold" data-id="${s.id}" title="Hoàn tác xác nhận (buổi do hệ thống tự xác nhận)">
                 <span class="material-symbols-outlined text-sm">undo</span>Hoàn tác
               </button>`
            : ''
          }
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

  init: async function (skipFetch = false) {
    const self = this;

    if (!skipFetch) {
      // Tải dữ liệu PT nếu chưa có
      if (!window.GymApp.data.pts || window.GymApp.data.pts.length === 0) {
        try {
          const res = await window.GymApp.api.get('/members?loai=pt');
          if (res?.success) window.GymApp.data.pts = res.data;
        } catch (err) { console.error('Failed to fetch PTs', err); }
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
    }

    // Gán sự kiện (chỉ chạy khi skipFetch = true hoặc nếu fetch thất bại)
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

    // Sửa lịch tập (event delegation)
    document.getElementById('pt-schedule-container')?.addEventListener('click', function (e) {
      const btn = e.target.closest('.btn-edit-schedule');
      if (!btn) return;
      document.getElementById('edit-schedule-id').value = btn.dataset.id;
      document.getElementById('edit-schedule-date').value = btn.dataset.ngay || '';
      document.getElementById('edit-schedule-start').value = btn.dataset.start || '';
      document.getElementById('edit-schedule-end').value = btn.dataset.end || '';
      document.getElementById('edit-schedule-note').value = btn.dataset.ghiChu || '';
      document.getElementById('modal-edit-schedule').classList.remove('hidden');
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
        window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
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
        window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
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
        window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">undo</span>Hoàn tác';
      }
    });
  }
};
