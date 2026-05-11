window.GymApp.pages['checkin'] = {
  _page: 1,
  _perPage: 10,
  _autoRefreshTimer: null,
  _stats: null,

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

  _buildStats: function (checkins) {
    const s = this._stats || {};
    const hourCounts = this._buildHourCounts(checkins);
    const peakEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

    // So sánh hôm nay vs hôm qua
    const luotVaoHomNay = s.luot_vao ?? checkins.length;
    const luotVaoHomQua = s.luot_vao_hom_qua ?? null;
    let soSanh = '—';
    if (luotVaoHomQua !== null && luotVaoHomQua > 0) {
      const pct = Math.round(((luotVaoHomNay - luotVaoHomQua) / luotVaoHomQua) * 100);
      soSanh = (pct >= 0 ? '+' : '') + pct + '%';
    } else if (luotVaoHomQua === 0 && luotVaoHomNay > 0) {
      soSanh = '+100%';
    }

    const dangTrong = s.dang_trong_phong ?? '—';

    return [
      { icon: 'how_to_reg',  label: 'Check-in hôm nay',      value: luotVaoHomNay, iconBg: 'icon-bg-green', color: 'text-brand-primary' },
      { icon: 'groups',      label: 'Đang trong phòng',       value: dangTrong,     iconBg: 'icon-bg-blue',  color: 'text-secondary' },
      { icon: 'schedule',    label: 'Giờ cao điểm',           value: peakEntry[0] + ':00', iconBg: 'icon-bg-orange', color: 'text-[#e65100]' },
      { icon: 'trending_up', label: 'So với hôm qua',         value: soSanh,        iconBg: 'icon-bg-green', color: 'text-brand-primary' },
    ];
  },

  render: function () {
    const checkins = window.GymApp.data.checkins || [];
    const stats = this._buildStats(checkins);

    return `
      <div class="flex flex-col gap-margin">

        <!-- Page Title -->
        <div class="page-title-bar">
          <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Check-in / Ra</h2>
          <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs">Theo dõi lượt vào ra và mật độ check-in theo giờ</p>
        </div>

        <!-- Stats -->
        <div id="checkin-stats-grid" class="grid grid-cols-2 md:grid-cols-4 gap-loose">
          ${stats.map(s => `
            <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm flex flex-col gap-standard">
              <div class="flex items-center justify-between">
                <span class="text-on-surface-variant font-body-sm text-body-sm font-bold uppercase tracking-wider leading-tight" style="max-width:calc(100% - 52px)">${s.label}</span>
                <div class="icon-bg ${s.iconBg}">
                  <span class="material-symbols-outlined ${s.color} text-xl" style="font-variation-settings:'FILL' 1">${s.icon}</span>
                </div>
              </div>
              <span class="${s.color} font-display-lg text-display-lg font-bold">${s.value}</span>
            </div>
          `).join('')}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-loose">

          <!-- Biểu đồ check-in theo giờ -->
          <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <div class="section-header px-loose py-standard border-b border-outline-variant flex items-center gap-compact">
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
                <span class="text-on-surface-variant text-body-sm">${new Date().toLocaleDateString('vi-VN', { weekday:'long', day:'numeric', month:'numeric' })}</span>
                <button id="btn-checkin-reload" class="flex items-center gap-xs px-compact py-xs rounded-lg border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-all text-body-sm font-bold">
                  <span class="material-symbols-outlined text-sm">refresh</span>Tải lại
                </button>
              </div>
            </div>
            <div id="checkin-cards-grid" class="grid grid-cols-2 md:grid-cols-3 gap-standard max-h-80 overflow-y-auto pr-xs">
              ${checkins.length === 0
                ? `<div class="col-span-3 flex flex-col items-center justify-center py-margin text-center">
                     <span class="material-symbols-outlined text-4xl text-outline">person_off</span>
                     <p class="text-on-surface-variant text-body-sm mt-standard">Chưa có check-in hôm nay</p>
                   </div>`
                : checkins.map(c => `
                    <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-standard shadow-sm flex flex-col items-center gap-sm">
                      ${window.GymApp.avatarImg(c.avatar_url, c.ho_ten, 'lg')}
                      <div class="text-center">
                        <p class="font-bold text-on-surface text-body-md truncate w-full">${c.ho_ten}</p>
                        <p class="text-on-surface-variant text-body-sm">${c.ma_ho_so}</p>
                      </div>
                      <div class="flex items-center gap-xs bg-brand-primary/10 rounded-full px-compact py-xs">
                        <span class="material-symbols-outlined text-brand-primary" style="font-size:12px">schedule</span>
                        <span class="text-brand-primary text-body-sm font-bold">${c.gio_hien_thi || c.thoi_diem.substring(11, 16)}</span>
                      </div>
                    </div>
                  `).join('')
              }
            </div>
          </div>
        </div>

        <!-- Bảng chi tiết -->
        <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
          <div class="section-header px-loose py-standard border-b border-outline-variant flex items-center gap-compact">
            <div class="icon-bg icon-bg-blue">
              <span class="material-symbols-outlined text-secondary text-lg" style="font-variation-settings:'FILL' 1">table_rows</span>
            </div>
            <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Chi tiết lượt vào</h3>
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

    const rows = paginated.map(c => `
      <tr class="h-11 border-b border-outline-variant hover:bg-surface-container-low transition-colors">
        <td class="px-loose">
          <div class="flex items-center gap-compact">
            ${window.GymApp.avatarImg(c.avatar_url, c.ho_ten, 'sm')}
            <div>
              <span class="font-bold text-on-surface text-body-md">${c.ho_ten}</span>
              <p class="text-on-surface-variant text-body-sm">${c.ma_ho_so}</p>
            </div>
          </div>
        </td>
        <td class="px-loose">
          <div class="flex items-center gap-xs text-on-surface text-body-md">
            <span class="material-symbols-outlined text-brand-primary" style="font-size:14px">schedule</span>
            ${c.gio_hien_thi || c.thoi_diem.substring(11, 16)}
          </div>
        </td>
        <td class="px-loose">${window.GymApp.statusBadge(c.loai === 'vao' ? 'active' : 'inactive')}</td>
      </tr>
    `).join('');

    return `
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse gym-table">
          <thead>
            <tr class="h-10">
              <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Hội viên</th>
              <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Giờ vào</th>
              <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Trạng thái</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="3" class="px-loose py-margin text-center text-on-surface-variant">Không có dữ liệu</td></tr>`}</tbody>
        </table>
      </div>
      ${window.GymApp.renderPagination(this._page, checkins.length, this._perPage)}
    `;
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
        <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm flex flex-col gap-standard">
          <div class="flex items-center justify-between">
            <span class="text-on-surface-variant font-body-sm text-body-sm font-bold uppercase tracking-wider leading-tight" style="max-width:calc(100% - 52px)">${s.label}</span>
            <div class="icon-bg ${s.iconBg}">
              <span class="material-symbols-outlined ${s.color} text-xl" style="font-variation-settings:'FILL' 1">${s.icon}</span>
            </div>
          </div>
          <span class="${s.color} font-display-lg text-display-lg font-bold">${s.value}</span>
        </div>
      `).join('');
    }

    // Cập nhật badge số lượng
    const badge = document.getElementById('checkin-count-badge');
    if (badge) badge.textContent = checkins.length;

    // Cập nhật grid cards
    const grid = document.getElementById('checkin-cards-grid');
    if (grid) {
      grid.innerHTML = checkins.length === 0
        ? `<div class="col-span-3 flex flex-col items-center justify-center py-margin text-center">
             <span class="material-symbols-outlined text-4xl text-outline">person_off</span>
             <p class="text-on-surface-variant text-body-sm mt-standard">Chưa có check-in hôm nay</p>
           </div>`
        : checkins.map(c => `
            <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-standard shadow-sm flex flex-col items-center gap-sm">
              ${window.GymApp.avatarImg(c.avatar_url, c.ho_ten, 'lg')}
              <div class="text-center">
                <p class="font-bold text-on-surface text-body-md truncate w-full">${c.ho_ten || 'Khách vãng lai'}</p>
                <p class="text-on-surface-variant text-body-sm">${c.ma_ho_so || '—'}</p>
              </div>
              <div class="flex items-center gap-xs bg-brand-primary/10 rounded-full px-compact py-xs">
                <span class="material-symbols-outlined text-brand-primary" style="font-size:12px">schedule</span>
                <span class="text-brand-primary text-body-sm font-bold">${c.gio_hien_thi || c.thoi_diem.substring(11, 16)}</span>
              </div>
            </div>
          `).join('');
    }

    // Cập nhật bảng chi tiết
    const table = document.getElementById('checkin-table-container');
    if (table) table.innerHTML = this._renderDetailTable();

    // Cập nhật biểu đồ
    this._updateChart(checkins);
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
      if (table) table.innerHTML = self._renderDetailTable();
    };

    // Luôn fetch mới khi vào trang
    await this._fetchAndRefresh();

    // Nút tải lại thủ công
    document.getElementById('btn-checkin-reload')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-checkin-reload');
      if (btn) btn.classList.add('opacity-50', 'pointer-events-none');
      await self._fetchAndRefresh();
      if (btn) btn.classList.remove('opacity-50', 'pointer-events-none');
      window.GymApp.toast('Đã cập nhật dữ liệu check-in!', 'success');
    });

    // Auto-refresh mỗi 30 giây
    this._autoRefreshTimer = setInterval(() => self._fetchAndRefresh(), 30000);
  },

  destroy: function () {
    clearInterval(this._autoRefreshTimer);
    this._autoRefreshTimer = null;
  }
};
