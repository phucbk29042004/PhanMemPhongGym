window.GymApp.pages['checkin'] = {
  _page: 1,
  _perPage: 10,
  _autoRefreshTimer: null,
  _stats: null,

  _getGroupedVisits: function(checkins) {
    const groupedVisits = [];
    const processedIds = new Set();
    
    for (const c of checkins) {
      if (!c.ho_so_id) {
        if (c.loai === 'vao') groupedVisits.push(c);
        continue;
      }
      
      if (c.loai === 'vao' && !processedIds.has(c.ho_so_id)) {
        processedIds.add(c.ho_so_id);
        groupedVisits.push(c);
      } else if (c.loai === 'ra' && !processedIds.has(c.ho_so_id)) {
        processedIds.add(c.ho_so_id);
        const correspondingVao = checkins.find(v => v.ho_so_id === c.ho_so_id && v.loai === 'vao' && v.thoi_diem < c.thoi_diem);
        if (correspondingVao) {
          groupedVisits.push({ ...correspondingVao, raRecord: c });
        }
      }
    }
    return groupedVisits;
  },

  _buildHourCounts: function (checkins) {
    const hourCounts = {};
    for (let h = 5; h <= 22; h++) hourCounts[h] = 0;
    checkins.filter(c => c.loai === 'vao').forEach(c => {
      // gio_hien_thi = "HH:MM" do backend trả về qua strftime — dùng thay vì parse thoi_diem
      const hour = c.gio_hien_thi
        ? parseInt(c.gio_hien_thi.split(':')[0])
        : parseInt(c.thoi_diem.substring(11, 13));
      if (hourCounts[hour] !== undefined) hourCounts[hour]++;
    });
    return hourCounts;
  },

  _formatTrend: function (current, previous) {
    if (previous === null || previous === undefined) return '';
    const prevVal = parseFloat(previous);
    const currVal = parseFloat(current);
    if (isNaN(prevVal) || isNaN(currVal)) return '';
    
    let pct = 0;
    if (prevVal === 0) {
      if (currVal > 0) pct = 100;
      else pct = 0;
    } else {
      pct = ((currVal - prevVal) / prevVal) * 100;
    }

    if (pct === 0) {
      return `<span class="text-on-surface-variant font-bold text-body-sm flex items-center gap-0.5 ml-2">0.00%</span>`;
    }
    if (pct > 0) {
      return `<span class="text-brand-primary font-bold text-body-sm flex items-center gap-0.5 ml-2"><span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'FILL' 1">trending_up</span>+${pct.toFixed(2)}%</span>`;
    }
    return `<span class="text-red-500 font-bold text-body-sm flex items-center gap-0.5 ml-2"><span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'FILL' 1">trending_down</span>${pct.toFixed(2)}%</span>`;
  },

  _buildStats: function (checkins) {
    const s = this._stats || {};
    const hourCounts = this._buildHourCounts(checkins);
    const sortedHours = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]);
    const peakHour = sortedHours.length > 0 ? sortedHours[0][0] + ':00' : '—';

    const luotVaoHomNay = s.luot_vao ?? checkins.filter(c => c.loai === 'vao').length;
    const luotVaoHomQua = s.luot_vao_hom_qua ?? null;
    const luotRaHomNay = s.luot_ra ?? checkins.filter(c => c.loai === 'ra').length;

    const vaoTrendHtml = this._formatTrend(luotVaoHomNay, luotVaoHomQua);
    const dangTrong = s.dang_trong_phong ?? '—';

    return [
      {
        icon: 'how_to_reg',
        label: 'Check-in hôm nay',
        value: luotVaoHomNay,
        iconBg: 'icon-bg-green',
        color: 'text-brand-primary',
        trendHtml: vaoTrendHtml,
        sub: luotVaoHomQua !== null ? `Hôm qua: ${luotVaoHomQua} lượt` : 'Hôm qua: 0 lượt',
      },
      {
        icon: 'logout',
        label: 'Check-out hôm nay',
        value: luotRaHomNay,
        iconBg: 'icon-bg-orange',
        color: 'text-[#e65100]',
        trendHtml: '',
        sub: 'Hội viên đã ra về',
      },
      {
        icon: 'groups',
        label: 'Đang trong phòng',
        value: dangTrong,
        iconBg: 'icon-bg-blue',
        color: 'text-secondary',
        trendHtml: '',
        sub: 'Hội viên đang tập luyện',
      },
      {
        icon: 'schedule',
        label: 'Giờ cao điểm',
        value: peakHour,
        iconBg: 'icon-bg-orange',
        color: 'text-[#e65100]',
        trendHtml: '',
        sub: 'Lượng khách tập trung nhất',
      },
    ];
  },

  render: function () {
    const checkins = window.GymApp.data.checkins || [];
    const stats = this._buildStats(checkins);

    return `
      <div class="flex flex-col gap-lg">

        <!-- Stats -->
        <div id="checkin-stats-grid" class="grid grid-cols-2 md:grid-cols-4 gap-standard">
          ${stats.map(s => `
            <div class="bg-brand-primary/5 dark:bg-brand-primary/10 rounded-2xl p-4 hover:-translate-y-1 hover:shadow-md hover:bg-brand-primary/10 transition-all duration-300 border border-brand-primary/20 flex flex-col justify-between" style="min-height: 104px;">
              <div>
                <p class="text-on-surface-variant text-body-sm font-bold uppercase tracking-wider mb-2 truncate" title="${s.label}">${s.label}</p>
                <div class="flex items-baseline flex-wrap gap-x-2 gap-y-1">
                  <h3 class="text-xl font-bold text-on-surface truncate max-w-full" title="${s.value}">${s.value}</h3>
                  ${s.trendHtml || ''}
                </div>
              </div>
              ${s.sub ? `<span class="text-on-surface-variant text-body-sm font-medium mt-1 truncate" title="${s.sub}">${s.sub}</span>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-standard">

          <!-- Biểu đồ check-in theo giờ -->
          <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
            <div class="section-header px-standard py-compact border-b border-outline-variant flex items-center gap-compact">
              <div class="icon-bg icon-bg-green">
                <span class="material-symbols-outlined text-brand-primary text-lg" style="font-variation-settings:'FILL' 1">bar_chart_4_bars</span>
              </div>
              <div>
                <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Lượt check-in theo giờ</h3>
                <p class="text-on-surface-variant text-body-sm" style="font-size:11px">Trục Y: Giờ &nbsp;|&nbsp; Trục X: Số lượt</p>
              </div>
            </div>
            <div class="p-standard" style="height:340px">
              <canvas id="chart-checkin-hourly"></canvas>
            </div>
          </div>

          <!-- Grid cards check-in -->
          <div class="md:col-span-2 flex flex-col gap-standard">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-compact">
                <div class="icon-bg icon-bg-green">
                  <span class="material-symbols-outlined text-brand-primary text-lg" style="font-variation-settings:'FILL' 1">calendar_today</span>
                </div>
                <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Check-in hôm nay</h3>
                <span id="checkin-count-badge" class="bg-brand-primary text-white px-compact py-xs rounded-full text-label-xs font-bold ml-xs">${checkins.length}</span>
              </div>
              <div class="flex items-center gap-standard">
                <span class="text-on-surface-variant text-body-sm">${new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}</span>
                <button id="btn-checkin-reload" class="flex items-center justify-center gap-xs px-4 py-2 rounded-xl border border-outline-variant bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer">
                  <span class="material-symbols-outlined text-base">refresh</span>Tải lại
                </button>
              </div>
            </div>
            <div id="checkin-cards-grid" class="grid grid-cols-2 md:grid-cols-3 gap-standard max-h-80 overflow-y-auto pr-xs">
              ${(function() {
                const grouped = window.GymApp.pages['checkin']._getGroupedVisits(checkins);
                if (grouped.length === 0) return `<div class="col-span-3 flex flex-col items-center justify-center py-standard text-center">
                     <span class="material-symbols-outlined text-4xl text-outline">person_off</span>
                     <p class="text-on-surface-variant text-body-sm mt-standard">Chưa có check-in hôm nay</p>
                   </div>`;
                return grouped.map(c => `
                    <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-standard shadow-sm flex flex-col items-center gap-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                      ${window.GymApp.avatarImg(c.avatar_url, c.ho_ten, 'lg')}
                      <div class="text-center">
                        <p class="font-bold text-on-surface text-body-md truncate w-full">${c.ho_ten}</p>
                        <p class="text-on-surface-variant text-body-sm flex items-center justify-center gap-1">
                          ${c.loai_ho_so === 'pt' ? '<span class="px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary text-[10px] font-bold">HLV</span>' : ''}
                          ${c.loai_ho_so === 'hoi_vien' ? '<span class="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold">HV</span>' : ''}
                          ${c.loai_ho_so === 'le_tan' ? '<span class="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 text-[10px] font-bold">Lễ tân</span>' : ''}
                          ${c.loai_ho_so === 'nhan_vien' ? '<span class="px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-500 text-[10px] font-bold">NV</span>' : ''}
                          <span>${c.ma_ho_so}</span>
                        </p>
                      </div>
                      ${c.raRecord 
                        ? `<div class="flex items-center gap-xs bg-surface-container rounded-full px-compact py-xs border border-outline-variant w-full justify-center">
                             <span class="material-symbols-outlined text-on-surface-variant" style="font-size:12px">logout</span>
                             <span class="text-on-surface-variant text-body-sm font-bold">Đã ra: ${c.raRecord.gio_hien_thi || c.raRecord.thoi_diem.substring(11, 16)}</span>
                           </div>`
                        : `<div class="flex items-center gap-xs bg-brand-primary/10 rounded-full px-compact py-xs mb-1 w-full justify-center">
                             <span class="material-symbols-outlined text-brand-primary" style="font-size:12px">login</span>
                             <span class="text-brand-primary text-body-sm font-bold">Vào: ${c.gio_hien_thi || c.thoi_diem.substring(11, 16)}</span>
                           </div>
                           <button class="btn-checkout flex items-center justify-center gap-xs bg-surface-container-high hover:bg-[#fee2e2] text-on-surface hover:text-[#dc2626] rounded-lg px-standard py-xs transition-colors border border-outline-variant w-full font-bold text-body-sm" data-id="${c.ho_so_id}">
                             <span class="material-symbols-outlined" style="font-size:16px">logout</span> Check-out
                           </button>`
                      }
                    </div>
                  `).join('');
              })()}
            </div>
          </div>
        </div>

        <!-- Bảng chi tiết -->
        <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-sm overflow-hidden">
          <div class="section-header px-standard py-compact border-b border-outline-variant flex items-center gap-compact">
            <div class="icon-bg icon-bg-blue" style="width:32px;height:32px;border-radius:8px">
              <span class="material-symbols-outlined text-secondary text-base" style="font-variation-settings:'FILL' 1">table_rows</span>
            </div>
            <h3 class="font-display-xl text-display-xl font-bold text-on-surface">Chi tiết lượt vào</h3>
          </div>
          <div id="checkin-table-container">
            ${this._renderDetailTable()}
          </div>
        </div>

      </div>
    `;
  },

  _renderDetailTable: function () {
    const checkins = window.GymApp.data.checkins || [];
    const start = (this._page - 1) * this._perPage;
    const paginated = checkins.slice(start, start + this._perPage);

    const rows = paginated.map((c, idx) => {
      const globalIdx = start + idx;
      const isLatestVao = c.loai === 'vao' && c.ho_so_id && checkins.findIndex(x => x.ho_so_id === c.ho_so_id) === globalIdx;
      return `
      <tr class="h-11 border-b border-outline-variant/30 hover:bg-brand-primary/5 transition-colors">
        <td class="px-standard">
          <div class="flex items-center gap-compact">
            ${window.GymApp.avatarImg(c.avatar_url, c.ho_ten, 'sm')}
            <div>
              <span class="font-bold text-on-surface text-body-md">${c.ho_ten}</span>
              <p class="text-on-surface-variant text-body-sm flex items-center gap-1">
                ${c.loai_ho_so === 'pt' ? '<span class="px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary text-[10px] font-bold">HLV</span>' : ''}
                ${c.loai_ho_so === 'hoi_vien' ? '<span class="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold">HV</span>' : ''}
                ${c.loai_ho_so === 'le_tan' ? '<span class="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 text-[10px] font-bold">Lễ tân</span>' : ''}
                ${c.loai_ho_so === 'nhan_vien' ? '<span class="px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-500 text-[10px] font-bold">NV</span>' : ''}
                <span>${c.ma_ho_so}</span>
              </p>
            </div>
          </div>
        </td>
        <td class="px-standard">
          <div class="flex items-center gap-xs text-on-surface text-body-md">
            <span class="material-symbols-outlined text-brand-primary" style="font-size:14px">schedule</span>
            ${c.gio_hien_thi || c.thoi_diem.substring(11, 16)}
          </div>
        </td>
        <td class="px-standard">${window.GymApp.statusBadge(c.loai === 'vao' ? 'active' : 'inactive')}</td>
        <td class="px-standard">
          ${isLatestVao 
            ? `<button class="btn-checkout text-[#dc2626] hover:bg-[#fee2e2] px-compact py-3xs rounded-md transition-colors text-body-sm font-bold flex items-center gap-xs" data-id="${c.ho_so_id}">
                 <span class="material-symbols-outlined" style="font-size:14px">logout</span> Check-out
               </button>` 
            : ''}
        </td>
      </tr>
      `;
    }).join('');

    return `
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse gym-table">
          <thead>
            <tr class="h-10">
              <th class="px-standard font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Hội viên</th>
              <th class="px-standard font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Giờ</th>
              <th class="px-standard font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Trạng thái</th>
              <th class="px-standard font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="4" class="px-standard py-standard text-center text-on-surface-variant">Không có dữ liệu</td></tr>`}</tbody>
        </table>
      </div>
      ${window.GymApp.renderPagination(this._page, checkins.length, this._perPage)}
    `;
  },

  _bindCheckoutEvents: function () {
    const self = this;
    document.querySelectorAll('.btn-checkout').forEach(btn => {
      // Prevent multiple bindings
      if (btn.dataset.bound) return;
      btn.dataset.bound = "true";
      
      btn.addEventListener('click', async function () {
        const id = this.dataset.id;
        if (!id) return;
        this.disabled = true;
        const oldHtml = this.innerHTML;
        this.innerHTML = '<span class="material-symbols-outlined animate-spin" style="font-size:16px">sync</span> Đang xử lý...';
        try {
          await window.GymApp.api.post('/checkins', { ho_so_id: id, loai: 'ra', phuong_thuc: 'thu_cong' });
          window.GymApp.toast('Đã check-out thành công!', 'success');
          self._fetchAndRefresh();
        } catch (err) {
          window.GymApp.toast('Lỗi: ' + (err.message || 'Không thể check-out'), 'error');
          this.disabled = false;
          this.innerHTML = oldHtml;
        }
      });
    });
  },

  _fetchAndRefresh: async function () {
    try {
      // Lấy ngày hôm qua để so sánh
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yyyymmdd = yesterday.toISOString().split('T')[0];

      const [checkinsRes, statsRes, statsYesterdayRes] = await Promise.all([
        window.GymApp.api.get('/checkins'),
        window.GymApp.api.get('/checkins/stats'),
        window.GymApp.api.get(`/checkins/stats?date=${yyyymmdd}`),
      ]);

      if (checkinsRes?.success) window.GymApp.data.checkins = checkinsRes.data || [];
      if (statsRes?.success) {
        this._stats = statsRes.data || {};
        this._stats.luot_vao_hom_qua = statsYesterdayRes?.data?.luot_vao ?? null;
      }
    } catch (err) { console.error('Failed to fetch checkins', err); }

    const checkins = window.GymApp.data.checkins || [];

    // Cập nhật stat cards
    const statsGrid = document.getElementById('checkin-stats-grid');
    if (statsGrid) {
      const stats = this._buildStats(checkins);
      statsGrid.innerHTML = stats.map(s => `
        <div class="bg-brand-primary/5 dark:bg-brand-primary/10 rounded-2xl p-4 hover:-translate-y-1 hover:shadow-md hover:bg-brand-primary/10 transition-all duration-300 border border-brand-primary/20 flex flex-col justify-between" style="min-height: 104px;">
          <div>
            <p class="text-on-surface-variant text-body-sm font-bold uppercase tracking-wider mb-2 truncate" title="${s.label}">${s.label}</p>
            <div class="flex items-baseline flex-wrap gap-x-2 gap-y-1">
              <h3 class="text-xl font-bold text-on-surface truncate max-w-full" title="${s.value}">${s.value}</h3>
              ${s.trendHtml || ''}
            </div>
          </div>
          ${s.sub ? `<span class="text-on-surface-variant text-body-sm font-medium mt-1 truncate" title="${s.sub}">${s.sub}</span>` : ''}
        </div>
      `).join('');
    }

    // Cập nhật badge số lượng
    const badge = document.getElementById('checkin-count-badge');
    if (badge) badge.textContent = checkins.length;

    // Cập nhật grid cards
    const grid = document.getElementById('checkin-cards-grid');
    if (grid) {
      const grouped = this._getGroupedVisits(checkins);
      grid.innerHTML = grouped.length === 0
        ? `<div class="col-span-3 flex flex-col items-center justify-center py-standard text-center">
             <span class="material-symbols-outlined text-4xl text-outline">person_off</span>
             <p class="text-on-surface-variant text-body-sm mt-standard">Chưa có check-in hôm nay</p>
           </div>`
        : grouped.map(c => `
            <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-standard shadow-sm flex flex-col items-center gap-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              ${window.GymApp.avatarImg(c.avatar_url, c.ho_ten, 'lg')}
              <div class="text-center">
                <p class="font-bold text-on-surface text-body-md truncate w-full">${c.ho_ten || 'Khách vãng lai'}</p>
                <p class="text-on-surface-variant text-body-sm flex items-center justify-center gap-1">
                  ${c.loai_ho_so === 'pt' ? '<span class="px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary text-[10px] font-bold">HLV</span>' : ''}
                  ${c.loai_ho_so === 'hoi_vien' ? '<span class="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold">HV</span>' : ''}
                  ${c.loai_ho_so === 'le_tan' ? '<span class="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 text-[10px] font-bold">Lễ tân</span>' : ''}
                  ${c.loai_ho_so === 'nhan_vien' ? '<span class="px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-500 text-[10px] font-bold">NV</span>' : ''}
                  <span>${c.ma_ho_so || '—'}</span>
                </p>
              </div>
              ${c.raRecord 
                ? `<div class="flex items-center gap-xs bg-surface-container rounded-full px-compact py-xs border border-outline-variant w-full justify-center">
                     <span class="material-symbols-outlined text-on-surface-variant" style="font-size:12px">logout</span>
                     <span class="text-on-surface-variant text-body-sm font-bold">Đã ra: ${c.raRecord.gio_hien_thi || c.raRecord.thoi_diem.substring(11, 16)}</span>
                   </div>`
                : `<div class="flex items-center gap-xs bg-brand-primary/10 rounded-full px-compact py-xs mb-1 w-full justify-center">
                     <span class="material-symbols-outlined text-brand-primary" style="font-size:12px">login</span>
                     <span class="text-brand-primary text-body-sm font-bold">Vào: ${c.gio_hien_thi || c.thoi_diem.substring(11, 16)}</span>
                   </div>
                   <button class="btn-checkout flex items-center justify-center gap-xs bg-surface-container-high hover:bg-[#fee2e2] text-on-surface hover:text-[#dc2626] rounded-lg px-standard py-xs transition-colors border border-outline-variant w-full font-bold text-body-sm" data-id="${c.ho_so_id}">
                     <span class="material-symbols-outlined" style="font-size:16px">logout</span> Check-out
                   </button>`
              }
            </div>
          `).join('');
    }

    // Cập nhật bảng chi tiết
    const table = document.getElementById('checkin-table-container');
    if (table) {
        table.innerHTML = this._renderDetailTable();
    }

    // Cập nhật biểu đồ
    this._updateChart(checkins);
    
    // Bind events for dynamically added buttons
    this._bindCheckoutEvents();
  },

  _updateChart: function (checkins) {
    const chartCanvas = document.getElementById('chart-checkin-hourly');
    if (!chartCanvas) return;

    const hourCounts = this._buildHourCounts(checkins);
    const maxVal = Math.max(...Object.values(hourCounts), 1);

    if (window.GymApp._activeChart) {
      // Cập nhật chart đã có thay vì tạo mới
      window.GymApp._activeChart.data.datasets[0].data = Object.values(hourCounts);
      window.GymApp._activeChart.data.datasets[0].backgroundColor = Object.values(hourCounts).map(v => v === maxVal && v > 0 ? '#1D9336' : 'rgba(29,147,54,0.25)');
      window.GymApp._activeChart.update();
    } else {
      window.GymApp._activeChart = new Chart(chartCanvas, {
        type: 'bar',
        data: {
          labels: Object.keys(hourCounts).map(h => h + ':00'),
          datasets: [{
            label: 'Lượt check-in',
            data: Object.values(hourCounts),
            backgroundColor: Object.values(hourCounts).map(v => v === maxVal && v > 0 ? '#1D9336' : 'rgba(29,147,54,0.25)'),
            borderColor: '#1D9336',
            borderWidth: 1,
            borderRadius: 4,
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: 'rgba(190,202,185,0.3)' }, ticks: { font: { size: 10 }, stepSize: 1 } },
            y: { grid: { display: false }, ticks: { font: { size: 10 } } }
          }
        }
      });
    }
  },

  init: async function () {
    const self = this;
    this._page = 1;

    window.GymApp._pgHandler = function (pg) {
      self._page = pg;
      const table = document.getElementById('checkin-table-container');
      if (table) {
          table.innerHTML = self._renderDetailTable();
          self._bindCheckoutEvents();
      }
    };

    // Luôn fetch mới khi vào trang
    await this._fetchAndRefresh();

    // Nút tải lại thủ công
    document.getElementById('btn-checkin-reload')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-checkin-reload');
      const icon = btn?.querySelector('.material-symbols-outlined');
      if (icon) icon.classList.add('animate-spin');
      if (btn) btn.classList.add('opacity-50', 'pointer-events-none');
      await self._fetchAndRefresh();
      if (icon) icon.classList.remove('animate-spin');
      if (btn) btn.classList.remove('opacity-50', 'pointer-events-none');
      window.GymApp.toast('Đã cập nhật dữ liệu check-in!', 'success');
    });

    // Auto-refresh mỗi 30 giây
    this._autoRefreshTimer = setInterval(() => self._fetchAndRefresh(), 30000);
  },

  destroy: function () {
    clearInterval(this._autoRefreshTimer);
    this._autoRefreshTimer = null;
  },

  guideHtml: `
    <div class="space-y-4 text-xs">
      <div class="flex items-start gap-2 bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/10">
        <span class="material-symbols-outlined text-brand-primary text-base flex-shrink-0 mt-0.5">info</span>
        <p class="text-on-surface-variant leading-relaxed">Trang <strong>Vào - Ra (Check-in)</strong> quản lý lượt ra vào phòng tập và theo dõi mật độ tập luyện của hội viên theo thời gian thực.</p>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">Cách Check-in (Vào tập):</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li><strong>Cách 1: Quét mã QR:</strong> Lễ tân bấm nút <strong>Quét QR</strong> trên thanh Header → hướng camera vào mã QR hiển thị trên App Hội viên.</li>
          <li><strong>Cách 2: Nhập mã thủ công:</strong> Nếu camera lỗi, trong Modal Quét QR có phần nhập token thủ công để kích hoạt vào phòng.</li>
        </ul>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">Cách Check-out (Ra về):</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li>Tại danh sách **Lượt check-in hôm nay** ở phần dưới, tìm tên hội viên ra về.</li>
          <li>Bấm nút **Ra về** (màu đỏ) ở cột thao tác để ghi nhận thời điểm kết thúc tập luyện.</li>
        </ul>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">Biểu đồ & Thống kê:</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li><strong>Lượt check-in theo giờ:</strong> Biểu đồ cột ngang thống kê khung giờ đông khách nhất trong ngày, giúp sắp xếp nhân sự/PT phù hợp.</li>
        </ul>
      </div>
    </div>
  `
};
