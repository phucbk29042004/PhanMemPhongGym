window.GymApp.pages['revenue'] = {
  _chart: null,
  _days: 'today',

  render: function () {
    return `
      <div class="flex flex-col gap-lg">

        <!-- Bộ lọc khoảng thời gian -->
        <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-standard shadow-sm">
          <div class="flex flex-wrap items-center gap-standard">
            <span class="text-on-surface-variant font-bold text-body-sm">Khoảng thời gian:</span>
            <div class="flex gap-1.5 p-1 bg-surface-container-low/40 rounded-2xl border border-outline-variant/30">
              <button class="rev-range-btn px-4 py-1.5 rounded-xl text-body-sm font-bold transition-all duration-300" data-days="today">Hôm nay</button>
              <button class="rev-range-btn px-4 py-1.5 rounded-xl text-body-sm font-bold transition-all duration-300" data-days="yesterday">Hôm qua</button>
              <button class="rev-range-btn px-4 py-1.5 rounded-xl text-body-sm font-bold transition-all duration-300" data-days="7">7 ngày</button>
              <button class="rev-range-btn px-4 py-1.5 rounded-xl text-body-sm font-bold transition-all duration-300" data-days="30">30 ngày</button>
            </div>
            <button id="rev-reload" class="ml-auto flex items-center justify-center gap-xs px-4 py-2 rounded-xl border border-outline-variant bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer whitespace-nowrap">
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

        <!-- Bảng giao dịch -->
        <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-sm overflow-hidden">
          <div class="section-header px-standard py-compact border-b border-outline-variant/50 flex items-center gap-compact bg-surface-container-low/20">
            <div class="icon-bg icon-bg-green" style="width:32px;height:32px;border-radius:8px">
              <span class="material-symbols-outlined text-brand-primary text-base" style="font-variation-settings:'FILL' 1">receipt_long</span>
            </div>
            <h3 id="rev-table-title" class="font-bold text-on-surface text-body-lg">Giao dịch hôm nay</h3>
            <span id="rev-today-count" class="ml-auto bg-brand-primary text-white px-2.5 py-0.5 rounded-full text-body-sm font-bold">0</span>
          </div>
          <div id="rev-today-table" class="overflow-x-auto">
            <table class="w-full text-body-sm text-left">
              <thead>
                <tr class="border-b border-outline-variant/50 bg-surface-container-low/10">
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60">Khách hàng</th>
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60">Sản phẩm</th>
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60">Loại</th>
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60">Trạng thái</th>
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60">Phương thức</th>
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60 text-right">Số tiền</th>
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60 text-right">Chênh lệch</th>
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60">Thời gian</th>
                </tr>
              </thead>
              <tbody id="rev-today-tbody">
                <tr><td colspan="8" class="text-center py-margin text-on-surface-variant text-body-sm">Đang tải...</td></tr>
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
    if (amount == null || amount === '') return '0 đ';
    const cleaned = String(amount).replace(/[^\d-]/g, '');
    const numeric = Number(cleaned);
    if (Number.isNaN(numeric)) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(numeric) + ' đ';
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

  _renderStats: function (summary, dayData, monthComparison) {
    const grid = document.getElementById('rev-stats-grid');
    if (!grid) return;

    const monthSummary = monthComparison?.summary || {};
    const previousTotal = monthSummary.previous_total || 0;
    const currentTotal = monthSummary.current_total || 0;

    const totalTrendHtml = this._formatTrend(currentTotal, previousTotal);
    const dayTrendHtml = this._formatTrend(dayData?.tong_tien || 0, dayData?.hom_qua || 0);

    const isToday = this._days === 'today';
    const isYesterday = this._days === 'yesterday';
    const isSingleDay = isToday || isYesterday;

    let cards = [];
    if (isSingleDay) {
      cards = [
        {
          label: 'Tổng doanh thu',
          // FIX: dùng dayData.tong_tien (từ bảng doanh_thu qua API today/yesterday)
          // thay vì summary.tong_doanh_thu (API /revenue?days=1 tính lại từ giao dịch)
          value: this._formatMoney(dayData?.tong_tien),
          icon: 'payments',
          iconBg: 'icon-bg-green',
          color: 'text-brand-primary',
          trendHtml: totalTrendHtml,
          sub: `Tháng trước: ${this._formatMoney(previousTotal)}`,
        },
        {
          label: isYesterday ? 'Doanh thu hôm qua' : 'Doanh thu hôm nay',
          value: this._formatMoney(dayData?.tong_tien),
          icon: isYesterday ? 'history' : 'today',
          iconBg: 'icon-bg-green',
          color: 'text-brand-primary',
          trendHtml: dayTrendHtml,
          sub: isYesterday
            ? `Hôm kia: ${this._formatMoney(dayData?.hom_qua)} • ${dayData?.tong_don || 0} đơn`
            : `Hôm qua: ${this._formatMoney(dayData?.hom_qua)} • ${dayData?.tong_don || 0} đơn`,
        },
        {
          label: 'Gói tập',
          // FIX: đọc tien_goi_tap từ dayData (bảng doanh_thu) thay vì summary
          value: this._formatMoney(dayData?.tien_goi_tap),
          icon: 'card_membership',
          iconBg: 'icon-bg-orange',
          color: 'text-[#e65100]',
          trendHtml: '',
          sub: isYesterday ? 'Doanh thu gói tập hôm qua' : 'Doanh thu gói tập hôm nay',
        },
        {
          label: 'Gói PT',
          // FIX: đọc tien_goi_pt từ dayData (bảng doanh_thu) thay vì summary
          value: this._formatMoney(dayData?.tien_goi_pt),
          icon: 'sports_gymnastics',
          iconBg: 'icon-bg-blue',
          color: 'text-secondary',
          trendHtml: '',
          sub: isYesterday ? 'Doanh thu gói PT hôm qua' : 'Doanh thu gói PT hôm nay',
        },
      ];
    } else {
      cards = [
        {
          label: `Doanh thu ${this._days} ngày`,
          value: this._formatMoney(summary?.tong_doanh_thu),
          icon: 'payments',
          iconBg: 'icon-bg-green',
          color: 'text-brand-primary',
          trendHtml: totalTrendHtml,
          sub: `Tháng trước: ${this._formatMoney(previousTotal)}`,
        },
        {
          label: 'Trung bình ngày',
          value: this._formatMoney(summary?.trung_binh_ngay),
          icon: 'analytics',
          iconBg: 'icon-bg-green',
          color: 'text-brand-primary',
          trendHtml: '',
          sub: `Tổng số đơn: ${summary?.tong_don || 0} đơn`,
        },
        {
          label: 'Gói tập',
          value: this._formatMoney(summary?.tong_goi_tap),
          icon: 'card_membership',
          iconBg: 'icon-bg-orange',
          color: 'text-[#e65100]',
          trendHtml: '',
          sub: `Tổng doanh thu gói tập trong ${this._days} ngày`,
        },
        {
          label: 'Gói PT',
          value: this._formatMoney(summary?.tong_goi_pt),
          icon: 'sports_gymnastics',
          iconBg: 'icon-bg-blue',
          color: 'text-secondary',
          trendHtml: '',
          sub: `Tổng doanh thu gói PT trong ${this._days} ngày`,
        },
      ];
    }

    grid.innerHTML = cards.map(c => `
      <div class="bg-brand-primary/5 dark:bg-brand-primary/10 rounded-2xl p-4 hover:-translate-y-1 hover:shadow-md hover:bg-brand-primary/10 transition-all duration-300 border border-brand-primary/20 flex flex-col justify-between" style="min-height: 104px;">
        <div>
          <p class="text-on-surface-variant text-body-sm font-bold uppercase tracking-wider mb-2 truncate" title="${c.label}">${c.label}</p>
          <div class="flex items-baseline flex-wrap gap-x-2 gap-y-1">
            <h3 class="text-xl font-bold text-on-surface truncate max-w-full" title="${c.value}">${c.value}</h3>
            ${c.trendHtml || ''}
          </div>
        </div>
        ${c.sub ? `<span class="text-on-surface-variant text-body-sm font-medium mt-1 line-clamp-2" title="${c.sub}">${c.sub}</span>` : ''}
      </div>
    `).join('');
  },

  // FIX: tách _renderChart thành 2 mode: month-comparison (today/yesterday) và daily-range (7/30 ngày)
  _renderChart: function (daily, monthComparison) {
    const canvas = document.getElementById('rev-chart');
    if (!canvas) return;

    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
    const labelColor = isDark ? '#9aa0ab' : '#6e7a6b';

    const isToday = this._days === 'today';
    const isYesterday = this._days === 'yesterday';
    const isSingleDay = isToday || isYesterday;

    if (isSingleDay) {
      // Mode: so sánh tháng này vs tháng trước (giữ nguyên logic cũ)
      const monthData = monthComparison || {};
      const labels = (monthData.labels || []).map(day => `${day}`);
      const currentMonthLabel = monthData.current_month ? `Tháng ${parseInt(monthData.current_month.slice(5, 7), 10)}` : 'Tháng này';
      const previousMonthLabel = monthData.previous_month ? `Tháng ${parseInt(monthData.previous_month.slice(5, 7), 10)}` : 'Tháng trước';
      const currentData = (monthData.current || []).map(d => d.tong_tien);
      const previousData = (monthData.previous || []).map(d => d.tong_tien || 0);

      const title = document.getElementById('rev-chart-title');
      if (title) title.textContent = `So sánh doanh thu ${currentMonthLabel} / ${previousMonthLabel}`;

      this._chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: currentMonthLabel,
              type: 'bar',
              data: currentData,
              borderColor: '#1D9336',
              backgroundColor: '#1D9336cc',
              borderRadius: 4,
              borderSkipped: false,
            },
            {
              label: previousMonthLabel,
              type: 'line',
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
                label: ctx => ` ${new Intl.NumberFormat('vi-VN').format(ctx.raw ?? 0)} đ`,
              },
            },
          },
          scales: {
            x: {
              ticks: { color: labelColor, font: { size: 10 } },
              grid: { color: gridColor },
              title: { display: true, text: 'Ngày trong tháng', color: labelColor, font: { size: 10 } },
            },
            y: {
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
    } else {
      // FIX: Mode 7/30 ngày — hiển thị biểu đồ theo ngày thực tế từ `daily`
      const daysInt = parseInt(this._days) || 30;
      const title = document.getElementById('rev-chart-title');
      if (title) title.textContent = `Doanh thu ${daysInt} ngày qua (theo ngày)`;

      const dailyList = Array.isArray(daily) ? daily : [];

      // Format nhãn ngày: "27/5", "26/5" ...
      const labels = dailyList.map(d => {
        const parts = d.ngay.split('-');
        return `${parseInt(parts[2])}/${parseInt(parts[1])}`;
      });
      const goiTapData = dailyList.map(d => d.tien_goi_tap || 0);
      const goiPTData = dailyList.map(d => d.tien_goi_pt || 0);
      const tongData = dailyList.map(d => d.tong_tien || 0);

      this._chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Gói tập',
              data: goiTapData,
              backgroundColor: '#1D9336cc',
              borderColor: '#1D9336',
              borderRadius: 4,
              borderSkipped: false,
              stack: 'revenue',
            },
            {
              label: 'Gói PT',
              data: goiPTData,
              backgroundColor: '#6750a4cc',
              borderColor: '#6750a4',
              borderRadius: 4,
              borderSkipped: false,
              stack: 'revenue',
            },
            {
              label: 'Tổng',
              type: 'line',
              data: tongData,
              borderColor: '#e65100',
              backgroundColor: 'transparent',
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
                label: ctx => ` ${new Intl.NumberFormat('vi-VN').format(ctx.raw ?? 0)} đ`,
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              ticks: { color: labelColor, font: { size: 10 }, maxRotation: 45 },
              grid: { color: gridColor },
              title: { display: true, text: 'Ngày', color: labelColor, font: { size: 10 } },
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
    }
  },

  _renderPackageStats: function (packageStats) {
    const el = document.getElementById('rev-package-stats');
    if (!el) return;

    if (packageStats !== undefined) {
      this._packageStats = packageStats;
    }
    const list = Array.isArray(this._packageStats) ? this._packageStats : [];
    if (list.length === 0) {
      el.innerHTML = '<p class="text-center text-on-surface-variant text-body-sm py-margin">Chưa có dữ liệu</p>';
      return;
    }

    this._packagePage = this._packagePage || 1;
    const perPage = 3;
    const totalPages = Math.ceil(list.length / perPage);
    this._packagePage = Math.max(1, Math.min(this._packagePage, totalPages));
    const start = (this._packagePage - 1) * perPage;
    const paginated = list.slice(start, start + perPage);

    const max = Math.max(...list.map(p => p.tong_tien || 0)) || 1;
    const itemsHtml = paginated.map((p, i) => {
      const index = start + i + 1;
      const pct = Math.round(((p.tong_tien || 0) / max) * 100);
      return `
        <div class="flex flex-col gap-1 p-2 bg-surface-container-low/10 rounded-xl border border-outline-variant/30 hover:bg-surface-container-low/20 transition-all duration-300">
          <div class="flex items-center justify-between">
            <span class="font-bold text-on-surface text-body-md truncate flex-1 pr-xs">${index}. ${p.ten_goi}</span>
            <span class="text-brand-primary font-bold text-body-sm whitespace-nowrap">${p.so_dang_ky} đơn</span>
          </div>
          <div class="h-1.5 bg-surface-container rounded-full overflow-hidden my-0.5">
            <div class="h-full bg-brand-primary rounded-full transition-all" style="width:${pct}%"></div>
          </div>
          <span class="text-on-surface-variant text-body-sm font-medium">${this._formatMoney(p.tong_tien)}</span>
        </div>
      `;
    }).join('');

    const paginationHtml = totalPages > 1 ? `
      <div class="flex items-center justify-between pt-standard border-t border-outline-variant/30 mt-auto text-body-sm">
        <span class="text-on-surface-variant font-bold">Trang ${this._packagePage}/${totalPages}</span>
        <div class="flex gap-1">
          <button id="btn-pkg-prev" ${this._packagePage === 1 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : 'style="cursor:pointer;"'} class="w-7 h-7 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-brand-primary/5 hover:text-brand-primary transition-all active:scale-95">
            <span class="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button id="btn-pkg-next" ${this._packagePage === totalPages ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : 'style="cursor:pointer;"'} class="w-7 h-7 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-brand-primary/5 hover:text-brand-primary transition-all active:scale-95">
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    ` : '';

    el.innerHTML = `
      <div class="flex flex-col gap-standard flex-1 justify-between">
        <div class="flex flex-col gap-standard">
          ${itemsHtml}
        </div>
        ${paginationHtml}
      </div>
    `;

    const prevBtn = document.getElementById('btn-pkg-prev');
    const nextBtn = document.getElementById('btn-pkg-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this._packagePage > 1) {
          this._packagePage--;
          this._renderPackageStats();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this._packagePage < totalPages) {
          this._packagePage++;
          this._renderPackageStats();
        }
      });
    }
  },

  _renderTodayTable: function (transactions) {
    const tbody = document.getElementById('rev-today-tbody');
    const countEl = document.getElementById('rev-today-count');
    if (!tbody) return;

    const isToday = this._days === 'today';
    const isYesterday = this._days === 'yesterday';
    const titleEl = document.getElementById('rev-table-title');
    if (titleEl) {
      if (isToday) titleEl.textContent = 'Giao dịch hôm nay';
      else if (isYesterday) titleEl.textContent = 'Giao dịch hôm qua';
      else titleEl.textContent = `Giao dịch ${this._days} ngày qua`;
    }

    const list = Array.isArray(transactions) ? transactions : [];
    if (countEl) countEl.textContent = list.length;

    if (list.length === 0) {
      const msg = isYesterday ? 'Chưa có giao dịch nào hôm qua' : isToday ? 'Chưa có giao dịch nào hôm nay' : `Chưa có giao dịch nào trong ${this._days} ngày qua`;
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-margin text-on-surface-variant text-body-sm">${msg}</td></tr>`;
      return;
    }

    // FIX: Thêm pagination khi > 10 records
    const perPage = 10;
    const totalPages = Math.ceil(list.length / perPage);
    this._transactionPage = this._transactionPage || 1;
    this._transactionPage = Math.max(1, Math.min(this._transactionPage, totalPages));
    const start = (this._transactionPage - 1) * perPage;
    const paginated = list.slice(start, start + perPage);

    const rowsHtml = paginated.map(t => {
      const time = t.thoi_gian ? new Date(t.thoi_gian).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
      const timeDisplay = (isToday || isYesterday)
        ? time
        : (t.thoi_gian ? new Date(t.thoi_gian).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' + time : '—');

      const loaiLabel = t.loai === 'goi_tap'
        ? `<span class="bg-[#e7f5e9] dark:bg-[#0b2010] text-[#1D9336] dark:text-[#4cce5f] px-2 py-0.5 rounded-full text-label-xs font-bold border border-[#1D9336]/20 dark:border-[#4cce5f]/20">Gói tập</span>`
        : `<span class="bg-[#e8def8] dark:bg-[#201035] text-[#6750a4] dark:text-[#b89eff] px-2 py-0.5 rounded-full text-label-xs font-bold border border-[#6750a4]/20 dark:border-[#b89eff]/20">Gói PT</span>`;

      // Xác định trạng thái nghiệp vụ & chênh lệch giá
      let statusText = 'Đăng ký mới';
      let statusClass = 'bg-[#eef2ff] text-[#1e40af] border border-[#bfdbfe]'; // Blue badge for new
      let chenhLechHtml = '';

      if (t.trang_thai === 'huy') {
        const isSwitch = (t.ly_do_huy || '').includes('Đổi sang');
        if (isSwitch) {
          statusText = 'Đổi gói';
          statusClass = 'bg-[#fef3c7] text-[#d97706] border border-[#fde68a]'; // Yellow badge
          const refundAmount = t.so_tien_hoan || 0;
          chenhLechHtml = `<span class="text-red-500 font-bold">-${this._formatMoney(refundAmount)}</span>`;
        } else {
          statusText = 'Hủy gói';
          statusClass = 'bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca]'; // Red badge
          const refundAmount = t.so_tien_hoan || t.gia_thuc_te || 0;
          chenhLechHtml = `<span class="text-red-500 font-bold">-${this._formatMoney(refundAmount)}</span>`;
        }
      } else {
        // Gói hoạt động / tạm dừng / hết hạn
        const isSwitch = (t.ghi_chu_tt || '').includes('Đổi từ');
        if (isSwitch) {
          statusText = 'Đổi gói';
          statusClass = 'bg-[#fef3c7] text-[#d97706] border border-[#fde68a]';
          // Parse hoàn tiền
          const matchHoanTien = (t.ghi_chu_tt || '').match(/Hoàn tiền:\s*([0-9.]+)/);
          const hoanTien = matchHoanTien ? parseFloat(matchHoanTien[1]) : 0;
          const diff = t.gia_thuc_te - hoanTien;
          if (diff >= 0) {
            chenhLechHtml = `<span class="text-brand-primary font-bold">+${this._formatMoney(diff)}</span>`;
          } else {
            chenhLechHtml = `<span class="text-red-500 font-bold">-${this._formatMoney(Math.abs(diff))}</span>`;
          }
        } else if (t.trang_thai === 'tam_dung') {
          statusText = 'Tạm dừng';
          statusClass = 'bg-surface-container text-on-surface-variant border border-outline-variant';
          chenhLechHtml = `<span class="text-on-surface-variant">—</span>`;
        } else if (t.trang_thai === 'het_han') {
          statusText = 'Hết hạn';
          statusClass = 'bg-surface-container text-on-surface-variant border border-outline-variant';
          chenhLechHtml = `<span class="text-on-surface-variant">—</span>`;
        } else {
          statusText = 'Đăng ký mới';
          statusClass = 'bg-[#e7f5e9] text-[#1D9336] border border-[#c2e7c9]'; // Green badge
          chenhLechHtml = `<span class="text-brand-primary font-bold">+${this._formatMoney(t.gia_thuc_te)}</span>`;
        }
      }

      const statusLabel = `<span class="px-2 py-0.5 rounded-full text-label-xs font-bold ${statusClass}">${statusText}</span>`;

      const paymentLabel = t.phuong_thuc_tt
        ? t.phuong_thuc_tt === 'tien_mat' ? 'Tiền mặt'
          : t.phuong_thuc_tt === 'chuyen_khoan' ? 'Chuyển khoản'
          : t.phuong_thuc_tt === 'the' ? 'Thẻ'
          : t.phuong_thuc_tt === 'momo' ? 'MoMo'
          : t.phuong_thuc_tt === 'zalopay' ? 'ZaloPay'
          : 'Khác'
        : '—';

      return `
        <tr class="border-b border-outline-variant/30 hover:bg-brand-primary/5 transition-colors">
          <td class="px-standard py-3 font-bold text-on-surface text-body-md">${t.khach_hang || '—'}</td>
          <td class="px-standard py-3 text-on-surface-variant font-medium text-body-sm">${t.san_pham || '—'}</td>
          <td class="px-standard py-3">${loaiLabel}</td>
          <td class="px-standard py-3">${statusLabel}</td>
          <td class="px-standard py-3">${paymentLabel}</td>
          <td class="px-standard py-3 text-right font-bold text-brand-primary text-body-md">${this._formatMoney(t.gia_thuc_te)}</td>
          <td class="px-standard py-3 text-right font-bold">${chenhLechHtml}</td>
          <td class="px-standard py-3 text-on-surface-variant font-medium text-body-sm">${timeDisplay}</td>
        </tr>
      `;
    }).join('');

    // Thêm pagination controls nếu > 10 records
    let paginationHtml = '';
    if (totalPages > 1) {
      paginationHtml = `
        <tr class="bg-surface-container-low/20">
          <td colspan="8" class="px-standard py-3">
            <div class="flex items-center justify-between">
              <span class="text-on-surface-variant text-body-sm font-bold">Trang ${this._transactionPage}/${totalPages} • ${list.length} giao dịch</span>
              <div class="flex gap-1">
                <button class="rev-table-prev w-7 h-7 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-brand-primary/5 hover:text-brand-primary transition-all active:scale-95" ${this._transactionPage === 1 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : 'style="cursor:pointer;"'}>
                  <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button class="rev-table-next w-7 h-7 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-brand-primary/5 hover:text-brand-primary transition-all active:scale-95" ${this._transactionPage === totalPages ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : 'style="cursor:pointer;"'}>
                  <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </td>
        </tr>
      `;
    }

    tbody.innerHTML = rowsHtml + paginationHtml;

    // Gắn event listeners cho nút pagination
    const prevBtn = tbody.querySelector('.rev-table-prev');
    const nextBtn = tbody.querySelector('.rev-table-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this._transactionPage > 1) {
          this._transactionPage--;
          this._renderTodayTable(transactions);
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this._transactionPage < totalPages) {
          this._transactionPage++;
          this._renderTodayTable(transactions);
        }
      });
    }
  },

  _updateRangeButtons: function () {
    document.querySelectorAll('.rev-range-btn').forEach(btn => {
      const active = btn.dataset.days === String(this._days);
      btn.className = active
        ? 'rev-range-btn px-4 py-1.5 rounded-xl text-body-sm font-bold bg-brand-primary text-white shadow-sm transition-all duration-300 border border-brand-primary/20'
        : 'rev-range-btn px-4 py-1.5 rounded-xl text-body-sm font-bold text-on-surface-variant hover:text-brand-primary hover:bg-brand-primary/5 transition-all duration-300 border border-transparent';
    });
  },

  _fetchAndRender: async function () {
    try {
      let revData = {};
      let dayData = {};

      if (this._days === 'today') {
        const [revRes, todayRes] = await Promise.all([
          window.GymApp.api.get('/revenue?days=1'),
          window.GymApp.api.get('/revenue/today'),
        ]);
        revData = revRes?.data || {};
        dayData = todayRes?.data || { giao_dich: [] };
      } else if (this._days === 'yesterday') {
        const [revRes, yesterdayRes] = await Promise.all([
          window.GymApp.api.get('/revenue?days=1'),
          window.GymApp.api.get('/revenue/yesterday'),
        ]);
        revData = revRes?.data || {};
        dayData = yesterdayRes?.data || { giao_dich: [] };
      } else {
        const daysInt = parseInt(this._days) || 30;
        const revRes = await window.GymApp.api.get(`/revenue?days=${daysInt}`);
        revData = revRes?.data || {};
        dayData = {
          giao_dich: revData.transactions || [],
        };
      }

      this._renderStats(revData.summary, dayData, revData.monthComparison);
      // FIX: truyền daily vào _renderChart để mode 7/30 ngày vẽ đúng
      this._renderChart(revData.daily, revData.monthComparison);
      this._renderPackageStats(revData.packageStats);
      this._renderTodayTable(dayData.giao_dich || []);
    } catch (err) {
      console.error('Revenue fetch error', err);
      window.GymApp.toast('Lỗi tải dữ liệu doanh thu!', 'error');
    }
  },

  init: async function () {
    const self = this;
    this._packagePage = 1;
    this._packageStats = [];
    this._days = 'today';
    this._updateRangeButtons();
    await this._fetchAndRender();

    // Chọn khoảng thời gian
    document.querySelectorAll('.rev-range-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const val = btn.dataset.days;
        self._days = isNaN(val) ? val : parseInt(val);
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
      const daysParam = (self._days === 'today' || self._days === 'yesterday') ? 1 : self._days;
      const ok = await window.GymApp.api.download(`/export/revenue?days=${daysParam}`, `bao-cao-doanh-thu-${self._days}-ngay.csv`);
      if (ok) window.GymApp.toast('Đã tải xuống file Excel doanh thu!', 'success');
    });
  },

  destroy: function () {
    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }
  },

  guideHtml: `
    <div class="space-y-4 text-xs">
      <div class="flex items-start gap-2 bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/10">
        <span class="material-symbols-outlined text-brand-primary text-base flex-shrink-0 mt-0.5">info</span>
        <p class="text-on-surface-variant leading-relaxed">Trang <strong>Quản lý Doanh thu</strong> giúp theo dõi doanh thu thực tế, lịch sử giao dịch và phân tích cơ cấu doanh thu theo gói tập của phòng gym.</p>
      </div>
      
      <div>
        <h4 class="font-bold text-on-surface mb-1">📌 Các chỉ số tài chính:</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li><strong>Doanh thu:</strong> Tổng số tiền thu được từ việc đăng ký gói hội viên và gói PT trong khoảng thời gian đã chọn.</li>
          <li><strong>Số giao dịch:</strong> Tổng số hóa đơn/lịch sử đăng ký được ghi nhận thành công.</li>
          <li><strong>Trung bình/GD:</strong> Giá trị trung bình trên mỗi giao dịch được thực hiện.</li>
          <li><strong>So với tháng trước:</strong> Tỷ lệ tăng trưởng doanh thu so với cùng kỳ tháng trước.</li>
        </ul>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">⚙️ Hướng dẫn thao tác:</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li><strong>Bộ lọc thời gian:</strong> Lựa chọn xem dữ liệu theo Hôm nay, Hôm qua, 7 ngày qua hoặc 30 ngày qua bằng các nút ở góc trên bên phải.</li>
          <li><strong>Biểu đồ doanh thu:</strong> Thể hiện xu hướng biến động doanh thu theo từng ngày để có kế hoạch kinh doanh phù hợp.</li>
          <li><strong>Doanh thu theo gói:</strong> Bảng thống kê chi tiết số tiền đóng góp từ từng gói tập hội viên/gói PT riêng biệt, có hỗ trợ phân trang khi danh sách gói dài.</li>
          <li><strong>Danh sách giao dịch:</strong> Hiển thị danh sách hóa đơn chi tiết trong ngày hoặc khoảng thời gian lọc (bao gồm Tên hội viên, Gói tập, Giá tiền, Ngày thanh toán và Người duyệt).</li>
          <li><strong>Tải lại dữ liệu:</strong> Cập nhật dữ liệu tài chính mới nhất từ hệ thống bằng nút xoay tải lại.</li>
          <li><strong>Xuất Excel:</strong> Tải báo cáo doanh thu dưới dạng file CSV theo bộ lọc thời gian hiện tại để lưu trữ hoặc đối soát.</li>
        </ul>
      </div>
    </div>
  `
};