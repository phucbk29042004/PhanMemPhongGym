window.GymApp.pages['revenue'] = {
  _chart: null,
  _days: 30,

  render: function () {
    return `
      <div class="flex flex-col gap-margin">

        <!-- Page Title -->
        <div class="page-title-bar">
          <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Doanh thu</h2>
          <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs">Thống kê doanh thu và giao dịch của phòng tập</p>
        </div>

        <!-- Bộ lọc khoảng thời gian -->
        <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-standard shadow-sm">
          <div class="flex flex-wrap items-center gap-standard">
            <span class="text-on-surface-variant font-bold text-body-sm">Khoảng thời gian:</span>
            <div class="flex gap-xs">
              <button class="rev-range-btn px-loose py-xs rounded-xl border border-outline-variant text-body-sm font-bold text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-all" data-days="7">7 ngày</button>
              <button class="rev-range-btn px-loose py-xs rounded-xl border border-outline-variant text-body-sm font-bold text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-all active-range" data-days="30">30 ngày</button>
              <button class="rev-range-btn px-loose py-xs rounded-xl border border-outline-variant text-body-sm font-bold text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-all" data-days="90">3 tháng</button>
              <button class="rev-range-btn px-loose py-xs rounded-xl border border-outline-variant text-body-sm font-bold text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-all" data-days="365">1 năm</button>
            </div>
            <button id="rev-reload" class="ml-auto flex items-center gap-xs px-loose py-compact rounded-xl border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-all font-body-md whitespace-nowrap">
              <span class="material-symbols-outlined text-sm">refresh</span>
              Tải lại
            </button>
          </div>
        </div>

        <!-- 4 Stat Cards -->
        <div id="rev-stats-grid" class="grid grid-cols-2 md:grid-cols-4 gap-loose">
          ${this._renderStatsSkeleton()}
        </div>

        <!-- Biểu đồ + Gói tập bán chạy -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-loose">

          <!-- Biểu đồ cột doanh thu theo ngày/tháng -->
          <div class="lg:col-span-2 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <div class="section-header px-loose py-standard border-b border-outline-variant flex items-center gap-compact">
              <div class="icon-bg icon-bg-green">
                <span class="material-symbols-outlined text-brand-primary text-lg" style="font-variation-settings:'FILL' 1">bar_chart</span>
              </div>
              <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Doanh thu theo ngày</h3>
            </div>
            <div class="p-loose" style="height:280px">
              <canvas id="rev-chart"></canvas>
            </div>
          </div>

          <!-- Gói tập bán chạy -->
          <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <div class="section-header px-loose py-standard border-b border-outline-variant flex items-center gap-compact">
              <div class="icon-bg icon-bg-green">
                <span class="material-symbols-outlined text-brand-primary text-lg" style="font-variation-settings:'FILL' 1">card_membership</span>
              </div>
              <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Gói tập bán chạy</h3>
            </div>
            <div id="rev-package-stats" class="p-loose flex flex-col gap-standard">
              <p class="text-center text-on-surface-variant text-body-sm py-margin">Đang tải...</p>
            </div>
          </div>
        </div>

        <!-- Bảng giao dịch hôm nay -->
        <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
          <div class="section-header px-loose py-standard border-b border-outline-variant flex items-center gap-compact">
            <div class="icon-bg icon-bg-green">
              <span class="material-symbols-outlined text-brand-primary text-lg" style="font-variation-settings:'FILL' 1">receipt_long</span>
            </div>
            <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Giao dịch hôm nay</h3>
            <span id="rev-today-count" class="ml-auto bg-brand-primary text-white px-compact py-xs rounded-full text-label-xs font-bold">0</span>
          </div>
          <div id="rev-today-table" class="overflow-x-auto">
            <table class="w-full text-body-sm">
              <thead>
                <tr class="border-b border-outline-variant bg-surface-container-low">
                  <th class="text-left px-loose py-compact text-on-surface-variant font-bold">Khách hàng</th>
                  <th class="text-left px-loose py-compact text-on-surface-variant font-bold">Sản phẩm</th>
                  <th class="text-left px-loose py-compact text-on-surface-variant font-bold">Loại</th>
                  <th class="text-right px-loose py-compact text-on-surface-variant font-bold">Số tiền</th>
                  <th class="text-left px-loose py-compact text-on-surface-variant font-bold">Thời gian</th>
                </tr>
              </thead>
              <tbody id="rev-today-tbody">
                <tr><td colspan="5" class="text-center py-margin text-on-surface-variant">Đang tải...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },

  _renderStatsSkeleton: function () {
    return Array(4).fill(0).map(() => `
      <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm animate-pulse">
        <div class="h-4 bg-outline-variant rounded w-2/3 mb-standard"></div>
        <div class="h-8 bg-outline-variant rounded w-1/2"></div>
      </div>
    `).join('');
  },

  _formatMoney: function (amount) {
    if (!amount || isNaN(amount)) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  },

  _renderStats: function (summary, todayData) {
    const grid = document.getElementById('rev-stats-grid');
    if (!grid) return;

    const cards = [
      {
        label: 'Tổng doanh thu',
        value: this._formatMoney(summary?.tong_doanh_thu),
        icon: 'payments',
        iconBg: 'icon-bg-green',
        color: 'text-brand-primary',
        sub: `${summary?.tong_don || 0} giao dịch`,
      },
      {
        label: 'Doanh thu hôm nay',
        value: this._formatMoney(todayData?.tong_tien),
        icon: 'today',
        iconBg: 'icon-bg-green',
        color: 'text-brand-primary',
        sub: `${todayData?.tong_don || 0} đơn`,
      },
      {
        label: 'Gói tập',
        value: this._formatMoney(summary?.tong_goi_tap),
        icon: 'card_membership',
        iconBg: 'icon-bg-orange',
        color: 'text-[#e65100]',
        sub: 'Doanh thu gói tập',
      },
      {
        label: 'Gói PT',
        value: this._formatMoney(summary?.tong_goi_pt),
        icon: 'sports_gymnastics',
        iconBg: 'icon-bg-blue',
        color: 'text-secondary',
        sub: 'Doanh thu gói PT',
      },
    ];

    grid.innerHTML = cards.map(c => `
      <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm flex flex-col gap-standard">
        <div class="flex items-center justify-between">
          <span class="text-on-surface-variant font-body-sm text-body-sm font-bold uppercase tracking-wider leading-tight" style="max-width:calc(100% - 48px)">${c.label}</span>
          <div class="icon-bg ${c.iconBg}">
            <span class="material-symbols-outlined ${c.color} text-xl" style="font-variation-settings:'FILL' 1">${c.icon}</span>
          </div>
        </div>
        <span class="${c.color} font-display-2xl text-display-2xl font-bold">${c.value}</span>
        <span class="text-on-surface-variant text-body-sm">${c.sub}</span>
      </div>
    `).join('');
  },

  _renderChart: function (daily) {
    const canvas = document.getElementById('rev-chart');
    if (!canvas) return;

    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }

    const labels = (daily || []).map(d => {
      const dt = new Date(d.ngay);
      return `${dt.getDate()}/${dt.getMonth() + 1}`;
    });
    const dataGoi = (daily || []).map(d => d.tien_goi_tap || 0);
    const dataPT  = (daily || []).map(d => d.tien_goi_pt || 0);

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
    const labelColor = isDark ? '#9aa0ab' : '#6e7a6b';

    this._chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Gói tập',
            data: dataGoi,
            backgroundColor: '#1D9336cc',
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: 'Gói PT',
            data: dataPT,
            backgroundColor: '#575f67cc',
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: labelColor, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => ` ${new Intl.NumberFormat('vi-VN').format(ctx.raw)} đ`,
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: labelColor, font: { size: 10 } },
            grid: { color: gridColor },
          },
          y: {
            stacked: true,
            ticks: {
              color: labelColor,
              font: { size: 10 },
              callback: v => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(v),
            },
            grid: { color: gridColor },
          },
        },
      },
    });
  },

  _renderPackageStats: function (packageStats) {
    const el = document.getElementById('rev-package-stats');
    if (!el) return;

    const list = Array.isArray(packageStats) ? packageStats : [];
    if (list.length === 0) {
      el.innerHTML = '<p class="text-center text-on-surface-variant text-body-sm py-margin">Chưa có dữ liệu</p>';
      return;
    }

    const max = Math.max(...list.map(p => p.tong_tien || 0)) || 1;
    el.innerHTML = list.slice(0, 6).map((p, i) => {
      const pct = Math.round(((p.tong_tien || 0) / max) * 100);
      return `
        <div class="flex flex-col gap-xs">
          <div class="flex items-center justify-between">
            <span class="font-bold text-on-surface text-body-sm truncate flex-1 pr-xs">${i + 1}. ${p.ten_goi}</span>
            <span class="text-brand-primary font-bold text-body-sm whitespace-nowrap">${p.so_dang_ky} đơn</span>
          </div>
          <div class="h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div class="h-full bg-brand-primary rounded-full transition-all" style="width:${pct}%"></div>
          </div>
          <span class="text-on-surface-variant text-body-sm">${this._formatMoney(p.tong_tien)}</span>
        </div>
      `;
    }).join('');
  },

  _renderTodayTable: function (transactions) {
    const tbody = document.getElementById('rev-today-tbody');
    const countEl = document.getElementById('rev-today-count');
    if (!tbody) return;

    const list = Array.isArray(transactions) ? transactions : [];
    if (countEl) countEl.textContent = list.length;

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-margin text-on-surface-variant">Chưa có giao dịch hôm nay</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(t => {
      const time = t.thoi_gian ? new Date(t.thoi_gian).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
      const loaiLabel = t.loai === 'goi_tap' ? `<span class="bg-[#e7f5e9] text-[#1D9336] px-compact py-xs rounded-full text-label-xs font-bold">Gói tập</span>` : `<span class="bg-[#e8def8] text-[#6750a4] px-compact py-xs rounded-full text-label-xs font-bold">Gói PT</span>`;
      return `
        <tr class="border-b border-outline-variant hover:bg-surface-container transition-colors">
          <td class="px-loose py-compact font-bold text-on-surface">${t.khach_hang || '—'}</td>
          <td class="px-loose py-compact text-on-surface-variant">${t.san_pham || '—'}</td>
          <td class="px-loose py-compact">${loaiLabel}</td>
          <td class="px-loose py-compact text-right font-bold text-brand-primary">${this._formatMoney(t.gia_thuc_te)}</td>
          <td class="px-loose py-compact text-on-surface-variant">${time}</td>
        </tr>
      `;
    }).join('');
  },

  _updateRangeButtons: function () {
    document.querySelectorAll('.rev-range-btn').forEach(btn => {
      const active = parseInt(btn.dataset.days) === this._days;
      btn.classList.toggle('active-range', active);
      btn.classList.toggle('bg-brand-primary', active);
      btn.classList.toggle('text-white', active);
      btn.classList.toggle('border-brand-primary', active);
      btn.classList.toggle('text-on-surface-variant', !active);
    });
  },

  _fetchAndRender: async function () {
    try {
      const [revRes, todayRes] = await Promise.all([
        window.GymApp.api.get(`/revenue?days=${this._days}`),
        window.GymApp.api.get('/revenue/today'),
      ]);

      const revData = revRes?.data || {};
      const todayData = todayRes?.data || {};

      this._renderStats(revData.summary, todayData);
      this._renderChart(revData.daily);
      this._renderPackageStats(revData.packageStats);
      this._renderTodayTable(todayData.giao_dich);
    } catch (err) {
      console.error('Revenue fetch error', err);
      window.GymApp.toast('Lỗi tải dữ liệu doanh thu!', 'error');
    }
  },

  init: async function () {
    const self = this;
    this._days = 30;
    this._updateRangeButtons();
    await this._fetchAndRender();

    // Chọn khoảng thời gian
    document.querySelectorAll('.rev-range-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        self._days = parseInt(btn.dataset.days);
        self._updateRangeButtons();
        await self._fetchAndRender();
      });
    });

    // Nút tải lại
    document.getElementById('rev-reload')?.addEventListener('click', async () => {
      await self._fetchAndRender();
      window.GymApp.toast('Đã tải lại dữ liệu!', 'success');
    });
  },

  destroy: function () {
    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }
  },
};
