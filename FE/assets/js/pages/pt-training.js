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
        <div id="pt-schedule-container" class="w-full">
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
          <div class="p-standard grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-standard">
            ${pts.length === 0
        ? `<div class="col-span-5 py-margin text-center text-on-surface-variant">
                   <span class="material-symbols-outlined text-4xl text-outline block mb-standard">person_off</span>
                   Chưa có huấn luyện viên nào
                 </div>`
        : pts.map(pt => {
          const rating = Number(pt.danh_gia || pt.rating || pt.pt_rating || 0);
          const ratingCount = Number(pt.so_luot_danh_gia || pt.pt_rating_count || 0);
          return `
                <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-standard shadow-sm flex flex-col items-center gap-standard hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                  ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten, 'lg')}
                  <div class="text-center">
                    <p class="font-bold text-on-surface text-body-md">${pt.ho_ten}</p>
                    <p class="text-on-surface-variant text-body-sm font-semibold">${pt.ma_ho_so}</p>
                  </div>
                  <div class="flex items-center gap-xs">
                    <span class="material-symbols-outlined text-sm text-[#f59e0b]" style="font-variation-settings:'FILL' 1">star</span>
                    <span class="font-bold text-on-surface text-body-sm">${rating ? rating.toFixed(1) : '—'}</span>
                    <span class="text-on-surface-variant text-body-sm font-semibold">(${ratingCount})</span>
                  </div>
                  <div class="flex items-center gap-xs text-on-surface-variant text-body-sm font-semibold">
                    <span class="material-symbols-outlined text-sm">work</span>
                    ${pt.tong_buoi_da_day || 0} buổi
                  </div>
                </div>
              `;
        }).join('')
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

  _renderCards: function (schedules) {
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

    const groupsHtml = Object.entries(grouped).map(([dateStr, items]) => {
      const dayObj = dateStr !== 'Chưa xác định' ? new Date(dateStr) : null;
      const weekday = dayObj ? dayObj.toLocaleDateString('vi-VN', { weekday: 'long' }) : '';
      const formattedDate = dayObj ? dayObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : dateStr;

      return `
      <div class="mb-5">
        <div class="flex items-center gap-2 mb-2 pl-1">
          <span class="material-symbols-outlined text-brand-primary text-xl" style="font-variation-settings: 'FILL' 1;">calendar_month</span>
          <h3 class="font-display-sm text-on-surface font-bold capitalize tracking-tight">${weekday}, ${formattedDate}</h3>
          <span class="bg-brand-primary/10 text-brand-primary text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">${items.length} buổi</span>
        </div>

        <div class="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory custom-scroll" style="scroll-behavior: smooth; margin: 0 -4px; padding: 4px; padding-bottom: 12px;">
          ${items.map(s => {
            const hasActions = (s.trang_thai === 'cho_tap' || s.status === 'cho_tap') || ((s.trang_thai === 'da_tap' || s.status === 'da_tap') && (s.ghi_chu === 'auto_cron' || s.notes === 'auto_cron'));
            return `
            <div class="snap-start shrink-0 group relative rounded-2xl overflow-hidden flex flex-col gap-3 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 bg-surface-container-lowest border border-outline-variant" style="width: calc(33.333% - 16px); min-width: 280px;">
              <!-- Accent bar top -->
              <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#1D9336,#4ade80);border-radius:3px 3px 0 0;"></div>

              <!-- Card Header: Time & Status -->
              <div class="flex items-start justify-between gap-2 pt-4 px-4">
                <div class="flex flex-col min-w-0">
                  <span class="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-0.5">Khung giờ</span>
                  <div class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-brand-primary text-[18px] shrink-0">schedule</span>
                    <span class="font-bold text-on-surface text-body-md truncate whitespace-nowrap">${s.gio_bat_dau || '—'} - ${s.gio_ket_thuc || '—'}</span>
                  </div>
                </div>
                <div class="shrink-0 ml-1">${window.GymApp.statusBadge(s.trang_thai || s.status)}</div>
              </div>

              <!-- Info (Hội viên & PT xếp chồng) -->
              <div class="flex flex-col gap-2.5 px-4">
                <!-- Hội viên -->
                <div class="flex items-center gap-3">
                  <div class="relative flex-shrink-0">
                    ${window.GymApp.avatarImg(s.avatar_hoi_vien, s.ten_hoi_vien || s.memberName, 'sm')}
                  </div>
                  <div class="flex flex-col min-w-0 justify-center">
                    <span class="text-[10px] uppercase font-bold text-on-surface-variant leading-none mb-1">Hội viên</span>
                    <span class="font-bold text-on-surface text-body-sm truncate leading-none">${s.ten_hoi_vien || s.memberName || 'Không rõ'}</span>
                  </div>
                </div>

                <!-- PT -->
                <div class="flex items-center gap-3">
                  <div class="relative flex-shrink-0">
                    ${window.GymApp.avatarImg(s.avatar_pt, s.ten_pt || s.ptName, 'sm')}
                  </div>
                  <div class="flex flex-col min-w-0 justify-center">
                    <span class="text-[10px] uppercase font-bold text-on-surface-variant leading-none mb-1">Huấn luyện viên</span>
                    <span class="font-bold text-on-surface text-body-sm truncate leading-none">${s.ten_pt || s.ptName || '—'}</span>
                  </div>
                </div>
              </div>

              <!-- Notes Area -->
              <div class="px-4 mt-1 mb-3 flex items-center justify-between gap-2">
                <span class="bg-surface-container-low px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border border-outline-variant/30 text-brand-primary shrink-0">${window.GymApp.formatEnumLabel(s.loai_buoi || s.type || 'ca_nhan')}</span>
                ${s.ghi_chu || s.notes ? `<span class="text-on-surface-variant text-body-sm truncate" title="${s.ghi_chu || s.notes}">${s.ghi_chu || s.notes}</span>` : ''}
              </div>

              <!-- Actions Footer -->
              ${hasActions ? `
              <div class="mt-auto px-4 pb-3 flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant/30 pt-3 bg-surface-container-low/10">
                ${s.trang_thai === 'cho_tap' || s.status === 'cho_tap' ? `
                  <button class="btn-edit-schedule flex items-center justify-center text-outline hover:text-brand-primary p-1.5 rounded-md hover:bg-brand-primary/10 transition-colors"
                    data-id="${s.id}" data-ngay="${s.ngay_tap || ''}" data-start="${s.gio_bat_dau || ''}" data-end="${s.gio_ket_thuc || ''}" data-ghi-chu="${(s.ghi_chu || '').replace(/"/g, '&quot;')}"
                    title="Sửa lịch"><span class="material-symbols-outlined text-[18px]">edit</span></button>
                  <button class="btn-cancel-schedule flex items-center justify-center text-outline hover:text-error p-1.5 rounded-md hover:bg-error/10 transition-colors"
                    data-id="${s.id}" title="Hủy lịch"><span class="material-symbols-outlined text-[18px]">event_busy</span></button>
                ` : ''}
                ${(s.trang_thai === 'da_tap' || s.status === 'da_tap') && (s.ghi_chu === 'auto_cron' || s.notes === 'auto_cron')
              ? `<button class="btn-hoan-tac flex items-center gap-1 px-2 py-1 rounded-md bg-orange-50 border border-orange-200 text-[#e65100] hover:bg-orange-100 transition-all text-xs font-bold" data-id="${s.id}" title="Hoàn tác xác nhận">
                       <span class="material-symbols-outlined text-[16px]">undo</span>Hoàn tác
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

    return groupsHtml;
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
