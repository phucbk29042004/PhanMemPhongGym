window.GymApp.pages['revenue'] = {
  _chart: null,
  _days: 30,

  render: function () {
    return `
      <div class="flex flex-col gap-lg">

        <!-- Bộ lọc khoảng thời gian -->
        <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-standard shadow-sm">
          <div class="flex flex-wrap items-center gap-standard">
            <span class="text-on-surface-variant font-bold text-body-sm">Khoảng thời gian:</span>
            <div class="flex gap-1.5 p-1 bg-surface-container-low/40 rounded-2xl border border-outline-variant/30">
              <button class="rev-range-btn px-4 py-1.5 rounded-xl text-body-sm font-bold transition-all duration-300" data-days="1">Hôm nay</button>
              <button class="rev-range-btn px-4 py-1.5 rounded-xl text-body-sm font-bold transition-all duration-300" data-days="7">7 ngày</button>
              <button class="rev-range-btn px-4 py-1.5 rounded-xl text-body-sm font-bold transition-all duration-300" data-days="30">30 ngày</button>
            </div>
            <button id="rev-reload" class="ml-auto flex items-center justify-center gap-xs px-4 py-2 rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer whitespace-nowrap">
              <span class="material-symbols-outlined text-base">refresh</span>
              Tải lại
            </button>
            <button id="btn-export-revenue" class="flex items-center justify-center gap-xs px-4 py-2 rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer whitespace-nowrap">
              <span class="material-symbols-outlined text-base text-[#1D9336]">download</span>
              Xuất Excel
            </button>
          </div>
        </div>

        <!-- 4 Stat Cards -->
        <div id="rev-stats-grid" class="grid grid-cols-2 md:grid-cols-4 gap-standard">
          ${this._renderStatsSkeleton()}
        </div>

        <!-- Biểu đồ + Gói tập bán chạy -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-standard">

          <!-- Biểu đồ cột doanh thu theo ngày/tháng -->
          <div class="lg:col-span-2 bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-sm overflow-hidden">
            <div class="section-header px-standard py-compact border-b border-outline-variant/50 flex items-center gap-compact bg-surface-container-low/20">
              <div class="icon-bg icon-bg-green" style="width:32px;height:32px;border-radius:8px">
                <span class="material-symbols-outlined text-brand-primary text-base" style="font-variation-settings:'FILL' 1">bar_chart</span>
              </div>
              <h3 id="rev-chart-title" class="font-bold text-on-surface text-body-lg">So sánh doanh thu tháng này / tháng trước</h3>
            </div>
            <div class="p-standard" style="height:280px">
              <canvas id="rev-chart"></canvas>
            </div>
          </div>

          <!-- Gói tập bán chạy -->
          <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-sm overflow-hidden">
            <div class="section-header px-standard py-compact border-b border-outline-variant/50 flex items-center gap-compact bg-surface-container-low/20">
              <div class="icon-bg icon-bg-green" style="width:32px;height:32px;border-radius:8px">
                <span class="material-symbols-outlined text-brand-primary text-base" style="font-variation-settings:'FILL' 1">card_membership</span>
              </div>
              <h3 class="font-bold text-on-surface text-body-lg">Gói tập bán chạy</h3>
            </div>
            <div id="rev-package-stats" class="p-standard flex flex-col gap-standard">
              <p class="text-center text-on-surface-variant text-body-sm py-margin">Đang tải...</p>
            </div>
          </div>
        </div>

        <!-- Bảng giao dịch hôm nay -->
        <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-sm overflow-hidden">
          <div class="section-header px-standard py-compact border-b border-outline-variant/50 flex items-center gap-compact bg-surface-container-low/20">
            <div class="icon-bg icon-bg-green" style="width:32px;height:32px;border-radius:8px">
              <span class="material-symbols-outlined text-brand-primary text-base" style="font-variation-settings:'FILL' 1">receipt_long</span>
            </div>
            <h3 class="font-bold text-on-surface text-body-lg">Giao dịch hôm nay</h3>
            <span id="rev-today-count" class="ml-auto bg-brand-primary text-white px-2.5 py-0.5 rounded-full text-body-sm font-bold">0</span>
          </div>
          <div id="rev-today-table" class="overflow-x-auto">
            <table class="w-full text-body-sm text-left">
              <thead>
                <tr class="border-b border-outline-variant/50 bg-surface-container-low/10">
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60">Khách hàng</th>
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60">Sản phẩm</th>
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60">Loại</th>
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60 text-right">Số tiền</th>
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60">Thời gian</th>
                </tr>
              </thead>
              <tbody id="rev-today-tbody">
                <tr><td colspan="5" class="text-center py-margin text-on-surface-variant text-body-sm">Đang tải...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },

  _renderStatsSkeleton: function () {
    return Array(4).fill(0).map(() => `
      <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-standard shadow-sm animate-pulse">
        <div class="h-4 bg-outline-variant rounded w-2/3 mb-standard"></div>
        <div class="h-8 bg-outline-variant rounded w-1/2"></div>
      </div>
    `).join('');
  },

  _formatMoney: function (amount) {
    if (!amount || isNaN(amount)) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
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

  _renderStats: function (summary, todayData, monthComparison) {
    const grid = document.getElementById('rev-stats-grid');
    if (!grid) return;

    const monthSummary = monthComparison?.summary || {};
    const previousTotal = monthSummary.previous_total || 0;
    const currentTotal = monthSummary.current_total || 0;

    const totalTrendHtml = this._formatTrend(currentTotal, previousTotal);
    const todayTrendHtml = this._formatTrend(todayData?.tong_tien || 0, todayData?.hom_qua || 0);

    const cards = [
      {
        label: 'Tổng doanh thu',
        value: this._formatMoney(summary?.tong_doanh_thu),
        icon: 'payments',
        iconBg: 'icon-bg-green',
        color: 'text-brand-primary',
        trendHtml: totalTrendHtml,
        sub: `Tháng trước: ${this._formatMoney(previousTotal)}`,
      },
      {
        label: 'Doanh thu hôm nay',
        value: this._formatMoney(todayData?.tong_tien),
        icon: 'today',
        iconBg: 'icon-bg-green',
        color: 'text-brand-primary',
        trendHtml: todayTrendHtml,
        sub: `Hôm qua: ${this._formatMoney(todayData?.hom_qua)} • ${todayData?.tong_don || 0} đơn`,
      },
      {
        label: 'Gói tập',
        value: this._formatMoney(summary?.tong_goi_tap),
        icon: 'card_membership',
        iconBg: 'icon-bg-orange',
        color: 'text-[#e65100]',
        trendHtml: '',
        sub: 'Doanh thu từ đăng ký gói tập',
      },
      {
        label: 'Gói PT',
        value: this._formatMoney(summary?.tong_goi_pt),
        icon: 'sports_gymnastics',
        iconBg: 'icon-bg-blue',
        color: 'text-secondary',
        trendHtml: '',
        sub: 'Doanh thu từ đăng ký huấn luyện viên',
      },
    ];

    grid.innerHTML = cards.map(c => `
      <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-standard shadow-sm flex flex-col gap-standard hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <div class="flex items-center justify-between">
          <span class="text-on-surface-variant text-body-sm font-bold uppercase tracking-wider leading-tight" style="max-width:calc(100% - 48px)">${c.label}</span>
          <div class="icon-bg ${c.iconBg}">
            <span class="material-symbols-outlined ${c.color} text-xl" style="font-variation-settings:'FILL' 1">${c.icon}</span>
          </div>
        </div>
        <div class="flex items-baseline flex-wrap gap-x-2 gap-y-1">
          <span class="text-on-surface text-3xl font-bold tracking-tight truncate max-w-full" title="${c.value}">${c.value}</span>
          ${c.trendHtml}
        </div>
        <span class="text-on-surface-variant text-body-sm font-medium">${c.sub}</span>
      </div>
    `).join('');
  },

  _renderChart: function (daily, monthComparison) {
    const canvas = document.getElementById('rev-chart');
    if (!canvas) return;

    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }

    const monthData = monthComparison || {};
    const labels = (monthData.labels || []).map(day => `${day}`);
    const currentMonthLabel = monthData.current_month ? `Tháng ${parseInt(monthData.current_month.slice(5, 7), 10)}` : 'Tháng này';
    const previousMonthLabel = monthData.previous_month ? `Tháng ${parseInt(monthData.previous_month.slice(5, 7), 10)}` : 'Tháng trước';
    const currentData = (monthData.current || []).map(d => d.tong_tien);
    const previousData = (monthData.previous || []).map(d => d.tong_tien || 0);

    const title = document.getElementById('rev-chart-title');
    if (title) title.textContent = `So sánh doanh thu ${currentMonthLabel} / ${previousMonthLabel}`;

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
            type: 'bar',
            label: currentMonthLabel,
            data: currentData,
            borderColor: '#1D9336',
            backgroundColor: '#1D9336cc',
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: 'Gói PT',
            type: 'line',
            label: previousMonthLabel,
            data: previousData,
            borderColor: '#575f67',
            backgroundColor: '#575f6722',
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 4,
            tension: 0.35,
            fill: false,
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
            stacked: false,
            ticks: { color: labelColor, font: { size: 10 } },
            grid: { color: gridColor },
            title: { display: true, text: 'Ngày trong tháng', color: labelColor, font: { size: 10 } },
          },
          y: {
            stacked: false,
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
        <div class="flex flex-col gap-1 p-2 bg-surface-container-low/10 rounded-xl border border-outline-variant/30 hover:bg-surface-container-low/20 transition-all duration-300">
          <div class="flex items-center justify-between">
            <span class="font-bold text-on-surface text-body-md truncate flex-1 pr-xs">${i + 1}. ${p.ten_goi}</span>
            <span class="text-brand-primary font-bold text-body-sm whitespace-nowrap">${p.so_dang_ky} đơn</span>
          </div>
          <div class="h-1.5 bg-surface-container rounded-full overflow-hidden my-0.5">
            <div class="h-full bg-brand-primary rounded-full transition-all" style="width:${pct}%"></div>
          </div>
          <span class="text-on-surface-variant text-body-sm font-medium">${this._formatMoney(p.tong_tien)}</span>
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
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-margin text-on-surface-variant text-body-sm">Chưa có giao dịch hôm nay</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(t => {
      const time = t.thoi_gian ? new Date(t.thoi_gian).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
      const loaiLabel = t.loai === 'goi_tap' 
        ? `<span class="bg-[#e7f5e9] text-[#1D9336] px-2 py-0.5 rounded-full text-label-xs font-bold border border-[#1D9336]/20">Gói tập</span>` 
        : `<span class="bg-[#e8def8] text-[#6750a4] px-2 py-0.5 rounded-full text-label-xs font-bold border border-[#6750a4]/20">Gói PT</span>`;
      return `
        <tr class="border-b border-outline-variant/30 hover:bg-brand-primary/5 transition-colors">
          <td class="px-standard py-3 font-bold text-on-surface text-body-md">${t.khach_hang || '—'}</td>
          <td class="px-standard py-3 text-on-surface-variant font-medium text-body-sm">${t.san_pham || '—'}</td>
          <td class="px-standard py-3">${loaiLabel}</td>
          <td class="px-standard py-3 text-right font-bold text-brand-primary text-body-md">${this._formatMoney(t.gia_thuc_te)}</td>
          <td class="px-standard py-3 text-on-surface-variant font-medium text-body-sm">${time}</td>
        </tr>
      `;
    }).join('');
  },

  _updateRangeButtons: function () {
    document.querySelectorAll('.rev-range-btn').forEach(btn => {
      const active = parseInt(btn.dataset.days) === this._days;
      btn.className = active
        ? 'rev-range-btn px-4 py-1.5 rounded-xl text-body-sm font-bold bg-brand-primary text-white shadow-sm transition-all duration-300 border border-brand-primary/20'
        : 'rev-range-btn px-4 py-1.5 rounded-xl text-body-sm font-bold text-on-surface-variant hover:text-brand-primary hover:bg-brand-primary/5 transition-all duration-300 border border-transparent';
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

      this._renderStats(revData.summary, todayData, revData.monthComparison);
      this._renderChart(revData.daily, revData.monthComparison);
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
      const btn = document.getElementById('rev-reload');
      const icon = btn?.querySelector('.material-symbols-outlined');
      if (icon) icon.classList.add('animate-spin');
      if (btn) btn.classList.add('pointer-events-none', 'opacity-50');
      await self._fetchAndRender();
      if (icon) icon.classList.remove('animate-spin');
      if (btn) btn.classList.remove('pointer-events-none', 'opacity-50');
      window.GymApp.toast('Đã tải lại dữ liệu!', 'success');
    });

    // Nút xuất Excel
    document.getElementById('btn-export-revenue')?.addEventListener('click', async () => {
      window.GymApp.toast('Đang xuất báo cáo doanh thu...', 'info');
      const ok = await window.GymApp.api.download(`/export/revenue?days=${self._days}`, `bao-cao-doanh-thu-${self._days}-ngay.csv`);
      if (ok) window.GymApp.toast('Đã tải xuống file Excel doanh thu!', 'success');
    });
  },

  destroy: function () {
    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }
  },
};
