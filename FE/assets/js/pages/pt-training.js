window.GymApp.pages['pt-training'] = {
  _keyword: '',
  _filterStatus: '',

  render: function () {
    const pts = window.GymApp.data.pts || [];
    const schedules = window.GymApp.data.ptSchedules || [];
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
            <div class="relative flex-1 min-w-[200px] group">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors text-[18px]">search</span>
              <input
                id="pt-search"
                class="w-full bg-surface-container-low/30 border-2 border-outline-variant/50 text-on-surface pl-10 pr-4 py-2 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none placeholder-outline-variant/60 font-body-md text-body-md transition-all shadow-sm focus:shadow-none"
                placeholder="Tìm theo tên PT, hội viên..."
                type="text"
              />
            </div>

            <select id="pt-filter-pt" class="bg-surface-container-low/30 border-2 border-outline-variant/50 text-on-surface px-4 py-2 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none transition-all text-body-md font-semibold min-w-[150px] cursor-pointer shadow-sm">
              <option value="">Tất cả PT</option>
              ${pts.map(p => `<option value="${p.id}">${p.ho_ten || p.name}</option>`).join('')}
            </select>

            <button id="pt-reload" class="flex items-center justify-center gap-xs px-4 py-2 rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer whitespace-nowrap">
              <span class="material-symbols-outlined text-base">refresh</span>
              Tải lại
            </button>

            <button id="btn-export-schedules" class="flex items-center justify-center gap-xs px-4 py-2 rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer whitespace-nowrap">
              <span class="material-symbols-outlined text-base text-[#1D9336]">download</span>
              Xuất Excel
            </button>
          </div>
        </div>

        <!-- Cards lịch đào tạo -->
        <div id="pt-schedule-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-standard">
          ${this._renderCards(schedules)}
        </div>

        <!-- Danh sách PT -->
        <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-sm overflow-hidden">
          <div class="section-header px-standard py-compact border-b border-outline-variant/50 flex items-center gap-compact bg-surface-container-low/20">
            <div class="icon-bg icon-bg-green" style="width:32px;height:32px;border-radius:8px">
              <span class="material-symbols-outlined text-brand-primary text-base" style="font-variation-settings:'FILL' 1">sports_gymnastics</span>
            </div>
            <h3 class="font-bold text-on-surface text-body-lg">Huấn luyện viên</h3>
            <span class="ml-auto bg-brand-primary text-white px-2.5 py-0.5 rounded-full text-body-sm font-bold">${pts.length} PT</span>
          </div>
          <div class="p-standard grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-standard">
            ${pts.length === 0
        ? `<div class="col-span-5 py-margin text-center text-on-surface-variant">
                   <span class="material-symbols-outlined text-4xl text-outline block mb-standard">person_off</span>
                   Chưa có huấn luyện viên nào
                 </div>`
        : pts.map(pt => `
                <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-standard shadow-sm flex flex-col items-center gap-standard hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                  ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten, 'lg')}
                  <div class="text-center">
                    <p class="font-bold text-on-surface text-body-md">${pt.ho_ten}</p>
                    <p class="text-on-surface-variant text-body-sm font-semibold">${pt.ma_ho_so}</p>
                  </div>
                  <div class="flex items-center gap-xs">
                    <span class="material-symbols-outlined text-sm text-[#f59e0b]" style="font-variation-settings:'FILL' 1">star</span>
                    <span class="font-bold text-on-surface text-body-sm">4.8</span>
                    <span class="text-on-surface-variant text-body-sm font-semibold">(${pt.so_hoc_vien || 0})</span>
                  </div>
                  <div class="flex items-center gap-xs text-on-surface-variant text-body-sm font-semibold">
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
        <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-xl w-full max-w-md mx-loose p-standard flex flex-col gap-lg">
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
              <div style="border:1px solid #becab9;border-radius:12px;overflow:hidden;max-height:180px;overflow-y:auto;" class="bg-surface-container-low">
                <div class="time-slot-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(60px,1fr));gap:4px;padding:8px;">
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

  _renderCards: function (schedules) {
    const list = Array.isArray(schedules) ? schedules : [];
    if (list.length === 0) {
      return `
        <div class="md:col-span-3 bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-standard text-center">
          <div class="icon-bg icon-bg-orange mx-auto mb-standard" style="width:56px;height:56px;border-radius:16px">
            <span class="material-symbols-outlined text-[#e65100] text-2xl">event_busy</span>
          </div>
          <p class="text-on-surface font-bold text-body-md">Không tìm thấy lịch đào tạo</p>
          <p class="text-on-surface-variant text-body-sm mt-xs">Thử thay đổi bộ lọc hoặc tải lại dữ liệu</p>
        </div>
      `;
    }
    return list.map(s => `
      <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-sm overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <!-- Card header -->
        <div class="px-standard py-compact border-b border-outline-variant/50 flex items-center justify-between bg-surface-container-low/20">
          <span class="text-on-surface-variant text-body-sm font-bold">#${s.id}</span>
          ${window.GymApp.statusBadge(s.trang_thai || s.status)}
        </div>

        <!-- Card body -->
        <div class="p-standard flex flex-col gap-standard flex-1">
          <div class="flex items-center gap-compact">
            <div class="icon-bg icon-bg-green" style="width:32px;height:32px;border-radius:8px">
              <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">sports_gymnastics</span>
            </div>
            <div>
              <p class="text-on-surface-variant text-body-sm font-semibold">Huấn luyện viên</p>
              <p class="font-bold text-on-surface text-body-md">${s.ten_pt || s.ptName || '—'}</p>
            </div>
          </div>

          <div class="flex items-center gap-compact">
            <div class="icon-bg icon-bg-blue" style="width:32px;height:32px;border-radius:8px">
              <span class="material-symbols-outlined text-secondary text-sm" style="font-variation-settings:'FILL' 1">person</span>
            </div>
            <div>
              <p class="text-on-surface-variant text-body-sm font-semibold">Hội viên</p>
              <p class="font-bold text-on-surface text-body-md">${s.ten_hoi_vien || s.memberName || '—'}</p>
            </div>
          </div>

          <div class="flex items-center gap-compact">
            <div class="icon-bg icon-bg-orange" style="width:32px;height:32px;border-radius:8px">
              <span class="material-symbols-outlined text-[#e65100] text-sm" style="font-variation-settings:'FILL' 1">schedule</span>
            </div>
            <div>
              <p class="text-on-surface-variant text-body-sm font-semibold">${window.GymApp.formatDate(s.ngay_tap || s.date)}</p>
              <p class="font-bold text-on-surface text-body-md">${s.gio_bat_dau || s.startTime || '—'} — ${s.gio_ket_thuc || s.endTime || '—'}</p>
            </div>
          </div>

          <div class="flex items-center gap-standard">
            <span class="bg-surface-container-low px-2 py-0.5 rounded-full text-body-sm text-on-surface-variant font-bold border border-outline-variant/30">${window.GymApp.formatEnumLabel(s.loai_buoi || s.type || 'ca_nhan')}</span>
            ${s.ghi_chu || s.notes ? `<span class="text-on-surface-variant text-body-sm truncate max-w-[150px]">${s.ghi_chu || s.notes}</span>` : ''}
          </div>
        </div>

        <!-- Card footer -->
        <div class="px-standard py-2 border-t border-outline-variant/50 flex items-center justify-end gap-1 bg-surface-container-low/10">
          ${s.trang_thai === 'cho_tap' ? `
            <button class="btn-edit-schedule material-symbols-outlined text-outline hover:text-brand-primary text-lg p-1.5 rounded-lg hover:bg-brand-primary/10 transition-colors"
              data-id="${s.id}" data-ngay="${s.ngay_tap || ''}" data-start="${s.gio_bat_dau || ''}" data-end="${s.gio_ket_thuc || ''}" data-ghi-chu="${(s.ghi_chu || '').replace(/"/g, '&quot;')}"
              title="Sửa lịch">edit</button>
            <button class="btn-cancel-schedule material-symbols-outlined text-outline hover:text-error text-lg p-1.5 rounded-lg hover:bg-error/10 transition-colors"
              data-id="${s.id}" title="Hủy lịch">event_busy</button>
          ` : ''}
          ${s.trang_thai === 'da_tap' && s.ghi_chu === 'auto_cron'
        ? `<button class="btn-hoan-tac flex items-center gap-xs px-compact py-xs rounded-lg bg-orange-50 border border-orange-200 text-[#e65100] hover:bg-orange-100 transition-all text-xs font-bold" data-id="${s.id}" title="Hoàn tác xác nhận (buổi do hệ thống tự xác nhận)">
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
    const status = '';
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
    document.getElementById('pt-filter-pt')?.addEventListener('change', () => self._applyFilter());
    document.getElementById('pt-reload')?.addEventListener('click', async () => {
      const btn = document.getElementById('pt-reload');
      const icon = btn?.querySelector('.material-symbols-outlined');
      if (icon) icon.classList.add('animate-spin');
      if (btn) btn.classList.add('pointer-events-none', 'opacity-50');
      try {
        const res = await window.GymApp.api.get('/pt/schedules');
        if (res?.success) window.GymApp.data.ptSchedules = Array.isArray(res.data) ? res.data : [];
      } catch (err) { console.error(err); }
      if (document.getElementById('pt-search')) document.getElementById('pt-search').value = '';
      if (document.getElementById('pt-filter-pt')) document.getElementById('pt-filter-pt').value = '';
      self._applyFilter();
      if (icon) icon.classList.remove('animate-spin');
      if (btn) btn.classList.remove('pointer-events-none', 'opacity-50');
      window.GymApp.toast('Đã tải lại danh sách!', 'success');
    });

    document.getElementById('btn-export-schedules')?.addEventListener('click', async () => {
      window.GymApp.toast('Đang xuất lịch tập PT...', 'info');
      const ptId = document.getElementById('pt-filter-pt')?.value || '';
      let url = '/export/pt-schedules';
      if (ptId) url += '?pt_id=' + ptId;
      const ok = await window.GymApp.api.download(url, 'lich-pt.csv');
      if (ok) window.GymApp.toast('Đã tải xuống file Excel lịch tập PT!', 'success');
    });

    // Sửa lịch tập (event delegation)
    document.getElementById('pt-schedule-container')?.addEventListener('click', function (e) {
      const btn = e.target.closest('.btn-edit-schedule');
      if (!btn) return;
      document.getElementById('edit-schedule-id').value = btn.dataset.id;
      document.getElementById('edit-schedule-date').value = btn.dataset.ngay || '';
      const startVal = btn.dataset.start || '';
      const endVal = btn.dataset.end || '';
      document.getElementById('edit-schedule-start').value = startVal;
      document.getElementById('edit-schedule-end').value = endVal;
      document.getElementById('edit-schedule-note').value = btn.dataset.ghiChu || '';

      const currStart = startVal.substring(0, 5);
      const timeDisplay = document.getElementById('edit-schedule-time-display');
      const modalEl = document.getElementById('modal-edit-schedule');
      
      // Reset button styles
      modalEl.querySelectorAll('.edit-time-slot-btn').forEach(b => {
        b.style.transform = 'scale(1)';
        b.style.background = '';
        b.style.color = '';
      });

      let matchedBtn = null;
      if (currStart) {
        matchedBtn = modalEl.querySelector(`.edit-time-slot-btn[data-time="${currStart}"]`);
      }

      if (matchedBtn) {
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

    // Custom time slot buttons interaction
    const calculateEndTime = (startStr) => {
      const [h, min] = startStr.split(':').map(Number);
      const d = new Date();
      d.setHours(h, min + 60);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    document.querySelectorAll('.edit-time-slot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.time;
        const startEl = document.getElementById('edit-schedule-start');
        const endEl = document.getElementById('edit-schedule-end');
        const timeDisplay = document.getElementById('edit-schedule-time-display');

        // Reset all buttons style
        document.querySelectorAll('.edit-time-slot-btn').forEach(b => {
          b.style.transform = 'scale(1)';
          b.style.background = '';
          b.style.color = '';
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
