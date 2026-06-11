window.GymApp.pages['revenue'] = {
  _chart: null,
  _days: 'today',

  // Định nghĩa các option dropdown biểu đồ theo từng bộ lọc thời gian
  _chartTypeOptions: {
    today: [{ value: 'default', label: 'Mặc định' }, { value: 'hourly', label: 'Theo giờ' }, { value: 'payment_method', label: 'Phương thức TT' }],
    yesterday: [{ value: 'default', label: 'Mặc định' }, { value: 'hourly', label: 'Theo giờ' }, { value: 'payment_method', label: 'Phương thức TT' }],
    7: [{ value: 'default', label: 'Mặc định' }, { value: 'weekday', label: 'Theo thứ' }, { value: 'payment_method', label: 'Phương thức TT' }],
    30: [{ value: 'default', label: 'Mặc định' }, { value: 'weekly', label: 'Theo tuần lịch' }, { value: 'payment_method', label: 'Phương thức TT' }],
  },

  render: function () {
    return `
      <div class="flex flex-col gap-lg">

        <!-- Bộ lọc khoảng thời gian -->
        <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-standard shadow-sm">
          <div class="flex flex-wrap items-center gap-standard">
            <div class="flex gap-1.5 p-1 bg-surface-container-low/40 rounded-2xl border border-outline-variant/30">
              <button class="rev-range-btn px-4 py-1.5 rounded-xl text-body-sm font-bold transition-all duration-300" data-days="today">Hôm nay</button>
              <button class="rev-range-btn px-4 py-1.5 rounded-xl text-body-sm font-bold transition-all duration-300" data-days="yesterday">Hôm qua</button>
              <button class="rev-range-btn px-4 py-1.5 rounded-xl text-body-sm font-bold transition-all duration-300" data-days="7">7 ngày</button>
              <button class="rev-range-btn px-4 py-1.5 rounded-xl text-body-sm font-bold transition-all duration-300" data-days="30">30 ngày</button>
              <button class="rev-range-btn px-4 py-1.5 rounded-xl text-body-sm font-bold transition-all duration-300" data-days="compare">Theo tháng</button>
            </div>
            
            <!-- Chọn tháng so sánh -->
            <div id="compare-months-inputs" class="hidden flex items-center gap-compact bg-surface-container-low/40 p-1.5 rounded-xl border border-outline-variant/30 flex-wrap">
              <span class="text-on-surface-variant text-body-sm font-bold">Tháng:</span>
              <input type="text" id="compare-month-1" readonly class="bg-white dark:bg-[#1e1e1e] border border-outline-variant text-body-sm rounded-lg px-3 py-1 outline-none text-on-surface font-semibold focus:border-brand-primary w-20 cursor-pointer text-center" placeholder="Chọn tháng" />

              <span class="text-on-surface-variant text-body-sm font-bold ml-2">Tháng:</span>
              <input type="text" id="compare-month-2" readonly class="bg-white dark:bg-[#1e1e1e] border border-outline-variant text-body-sm rounded-lg px-3 py-1 outline-none text-on-surface font-semibold focus:border-brand-primary w-20 cursor-pointer text-center" placeholder="Chọn tháng" />

              <button id="btn-compare-action" class="bg-brand-primary hover:bg-brand-primary/95 text-white text-body-sm font-bold px-4 py-1.5 rounded-lg active:scale-95 transition-all ml-2">So sánh</button>
            </div>

            <div class="ml-auto flex items-center gap-2 flex-wrap">
              <button id="rev-reload" class="flex items-center justify-center gap-xs px-4 py-2 rounded-xl border border-outline-variant bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer whitespace-nowrap">
                <span class="material-symbols-outlined text-base">refresh</span>
                Tải lại
              </button>
              <button id="btn-export-revenue" class="flex items-center justify-center gap-xs px-4 py-2 rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer whitespace-nowrap">
                <span class="material-symbols-outlined text-base text-[#1D9336]">download</span>
                Xuất Excel
              </button>
            </div>
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
            <div class="section-header px-standard py-compact border-b border-outline-variant/50 flex items-center justify-between bg-surface-container-low/20">
              <div class="flex items-center gap-compact">
                <div class="icon-bg icon-bg-green" style="width:32px;height:32px;border-radius:8px">
                  <span class="material-symbols-outlined text-brand-primary text-base" style="font-variation-settings:'FILL' 1">bar_chart</span>
                </div>
                <h3 id="rev-chart-title" class="font-bold text-on-surface text-body-lg">So sánh doanh thu tháng này / tháng trước</h3>
              </div>
              <select id="rev-chart-type" class="bg-surface-container-low text-on-surface border border-outline-variant text-body-sm font-bold rounded-lg px-2 py-1 outline-none cursor-pointer">
                <option value="default">Mặc định</option>
              </select>
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
          <div id="rev-today-table" class="overflow-x-auto" style="max-height: 400px; overflow-y: auto; position: relative;">
            <table class="w-full text-body-sm text-left">
              <thead>
                <tr class="border-b border-outline-variant/50 bg-surface-container-low/10">
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60">Khách hàng</th>
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60">Sản phẩm</th>
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60">Loại</th>
                  <th id="rev-th-chinhanh" class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60">Chi nhánh</th>
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60">Trạng thái</th>
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60">Phương thức</th>
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60 text-right">Số tiền</th>
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60 text-right">Chênh lệch</th>
                  <th class="px-standard py-3 text-on-surface-variant text-label-bold uppercase tracking-wider opacity-60">Thời gian</th>
                </tr>
              </thead>
              <tbody id="rev-today-tbody">
                <tr><td colspan="9" class="text-center py-margin text-on-surface-variant text-body-sm">Đang tải...</td></tr>
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
    const numeric = Math.round(Number(amount));
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
    if (this._days === 'compare') {
      const compData = this._compareData || {};
      const sum1 = compData.summary1 || { total: 0, orders: 0, goi_tap: 0, goi_pt: 0 };
      const sum2 = compData.summary2 || { total: 0, orders: 0, goi_tap: 0, goi_pt: 0 };
      const m1 = compData.month1 || '';
      const m2 = compData.month2 || '';
      const label1 = m1 ? `Tháng ${parseInt(m1.slice(5, 7), 10)}/${m1.slice(0, 4)}` : 'Tháng A';
      const label2 = m2 ? `Tháng ${parseInt(m2.slice(5, 7), 10)}/${m2.slice(0, 4)}` : 'Tháng B';

      const compareTrendHtml = this._formatTrend(sum1.total, sum2.total); // So sánh tổng tháng A vs tháng B

      cards = [
        {
          label: `Tổng doanh thu ${label1}`,
          value: this._formatMoney(sum1.total),
          icon: 'payments',
          iconBg: 'icon-bg-green',
          color: 'text-brand-primary',
          trendHtml: compareTrendHtml,
          sub: `${label2}: ${this._formatMoney(sum2.total)}`,
        },
        {
          label: `Tổng đơn hàng`,
          value: `${sum1.orders} đơn`,
          icon: 'receipt_long',
          iconBg: 'icon-bg-green',
          color: 'text-brand-primary',
          trendHtml: '',
          sub: `${label2}: ${sum2.orders} đơn`,
        },
        {
          label: 'Doanh thu Gói tập',
          value: this._formatMoney(sum1.goi_tap),
          icon: 'card_membership',
          iconBg: 'icon-bg-orange',
          color: 'text-[#e65100]',
          trendHtml: '',
          sub: `${label2}: ${this._formatMoney(sum2.goi_tap)}`,
        },
        {
          label: 'Doanh thu Gói PT',
          value: this._formatMoney(sum1.goi_pt),
          icon: 'sports_gymnastics',
          iconBg: 'icon-bg-blue',
          color: 'text-secondary',
          trendHtml: '',
          sub: `${label2}: ${this._formatMoney(sum2.goi_pt)}`,
        },
      ];
    } else if (isSingleDay) {
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

    // Sync select dropdown value
    const selectEl = document.getElementById('rev-chart-type');
    if (selectEl) {
      selectEl.value = this._chartType || 'default';
    }

    // Helper: tính tiền nhận vào thực tế (chỉ inflow, không tính refund/hủy)
    const calcInflow = (t) => {
      if (t.trang_thai === 'huy') return 0; // Hủy gói => không tính
      if (t.trang_thai === 'tam_dung') return 0; // Tạm dừng => không tính
      // 'het_han' vẫn tính vì tiền đã được thu tại thời điểm đăng ký
      const isSwitch = (t.ghi_chu_tt || '').includes('Đổi từ');
      if (isSwitch) {
        const matchHoanTien = (t.ghi_chu_tt || '').match(/Hoàn tiền:\s*([0-9.]+)/);
        const hoanTien = matchHoanTien ? parseFloat(matchHoanTien[1]) : 0;
        const net = (t.gia_thuc_te || 0) - hoanTien;
        return net > 0 ? net : 0;
      }
      return t.gia_thuc_te || 0;
    };


    const commonLineOptions = (extraPlugins = {}) => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: isDark ? '#2a2a2a' : '#fff',
          titleColor: isDark ? '#e0e0e0' : '#333',
          bodyColor: isDark ? '#bbb' : '#555',
          borderColor: isDark ? '#444' : '#ddd',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: ctx => ` ${new Intl.NumberFormat('vi-VN').format(ctx.raw ?? 0)} đ`,
          },
          ...extraPlugins,
        },
      },
    });

    if (this._chartType === 'weekly') {
      // Mode: Doanh thu theo tuần lịch (dành cho bộ lọc 30 ngày)
      const title = document.getElementById('rev-chart-title');
      if (title) title.textContent = `Doanh thu theo tuần lịch (30 ngày qua)`;

      // Khởi tạo 4 tuần (tuần 1–4 trong tháng)
      const weeklyRaw = { 1: 0, 2: 0, 3: 0, 4: 0 };
      const transactions = this._transactionsData || [];

      transactions.forEach(t => {
        const inflow = calcInflow(t);
        if (inflow <= 0) return;
        if (t.thoi_gian) {
          const day = parseInt(t.thoi_gian.substring(8, 10), 10);
          if (!isNaN(day) && day >= 1) {
            const weekNum = Math.min(4, Math.ceil(day / 7)); // Tuần 1,2,3,4
            weeklyRaw[weekNum] += inflow;
          }
        }
      });

      // Hiển thị đủ 4 tuần theo thứ tự (Tuần 1 → Tuần 4), tuần không có giao dịch = 0
      const labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
      const data = [weeklyRaw[1], weeklyRaw[2], weeklyRaw[3], weeklyRaw[4]];

      this._chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Doanh thu',
            data,
            borderColor: '#e65100',
            backgroundColor: 'rgba(230,81,0,0.10)',
            borderWidth: 2.5,
            pointRadius: 8,
            pointHoverRadius: 12,
            pointBackgroundColor: '#e65100',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            tension: 0.3,
            fill: true,
          }]
        },
        options: {
          ...commonLineOptions(),
          scales: {
            x: {
              ticks: { color: labelColor, font: { size: 11, weight: 'bold' } },
              grid: { color: gridColor },
              title: { display: true, text: 'Tuần lịch (sắp xếp tăng dần)', color: labelColor, font: { size: 10 } }
            },
            y: {
              min: 0,
              ticks: {
                color: labelColor,
                font: { size: 9 },
                callback: v => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(v),
              },
              grid: { color: gridColor }
            }
          }
        }
      });
    } else if (this._chartType === 'hourly') {
      const title = document.getElementById('rev-chart-title');
      if (title) title.textContent = `Doanh thu theo giờ `;

      const hourlyRaw = Array(24).fill(0);
      const transactions = this._transactionsData || [];

      transactions.forEach(t => {
        const inflow = calcInflow(t);
        if (inflow <= 0) return;
        if (t.thoi_gian) {
          const hour = parseInt(t.thoi_gian.substring(11, 13), 10);
          if (!isNaN(hour) && hour >= 0 && hour < 24) {
            hourlyRaw[hour] += inflow;
          }
        }
      });

      // Hiển thị đủ 24 giờ theo thứ tự thời gian (00h → 23h), giờ không có giao dịch = 0
      const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}h`);
      const data = hourlyRaw;

      this._chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Doanh thu',
            data,
            borderColor: '#1D9336',
            backgroundColor: 'rgba(29,147,54,0.12)',
            borderWidth: 2.5,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: '#1D9336',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            tension: 0.35,
            fill: true,
          }]
        },
        options: {
          ...commonLineOptions(),
          scales: {
            x: {
              ticks: { color: labelColor, font: { size: 9 } },
              grid: { color: gridColor },
              title: { display: true, text: 'Khung giờ (sắp xếp tăng dần)', color: labelColor, font: { size: 10 } }
            },
            y: {
              min: 0,
              ticks: {
                color: labelColor,
                font: { size: 9 },
                callback: v => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(v),
              },
              grid: { color: gridColor }
            }
          }
        }
      });
    } else if (this._chartType === 'weekday') {
      const title = document.getElementById('rev-chart-title');
      if (title) title.textContent = `Doanh thu theo thứ trong tuần`;

      const weekdayRaw = Array(7).fill(0);
      const transactions = this._transactionsData || [];

      transactions.forEach(t => {
        const inflow = calcInflow(t);
        if (inflow <= 0) return;
        if (t.thoi_gian) {
          const datePart = t.thoi_gian.substring(0, 10);
          const d = new Date(datePart);
          if (!isNaN(d)) {
            weekdayRaw[d.getDay()] += inflow;
          }
        }
      });

      // Hiển thị đủ 7 thứ theo thứ tự Tuần (Thứ 2 → Chủ nhật), thứ không có giao dịch = 0
      const labels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
      const data = [
        weekdayRaw[1], weekdayRaw[2], weekdayRaw[3], weekdayRaw[4],
        weekdayRaw[5], weekdayRaw[6], weekdayRaw[0],
      ];

      this._chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Doanh thu',
            data,
            borderColor: '#6750a4',
            backgroundColor: 'rgba(103,80,164,0.12)',
            borderWidth: 2.5,
            pointRadius: 6,
            pointHoverRadius: 9,
            pointBackgroundColor: '#6750a4',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            tension: 0.35,
            fill: true,
          }]
        },
        options: {
          ...commonLineOptions(),
          scales: {
            x: {
              ticks: { color: labelColor, font: { size: 10 } },
              grid: { color: gridColor },
              title: { display: true, text: 'Thứ (sắp xếp tăng dần)', color: labelColor, font: { size: 10 } }
            },
            y: {
              min: 0,
              ticks: {
                color: labelColor,
                font: { size: 9 },
                callback: v => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(v),
              },
              grid: { color: gridColor }
            }
          }
        }
      });
    } else if (this._chartType === 'payment_method') {
      // Tính đúng số ngày và offset theo từng chế độ lọc
      const isToday = this._days === 'today';
      const isYesterday = this._days === 'yesterday';
      const daysInt = isToday || isYesterday ? 1 : (parseInt(this._days) || 7);
      // yesterday: offset = 1 (bắt đầu từ hôm qua)
      // today: offset = 0 (chỉ hôm nay)
      // 7/30: offset = 0 (kết thúc hôm nay)
      const endOffset = isYesterday ? 1 : 0;

      const periodLabel = isToday ? 'hôm nay' : isYesterday ? 'hôm qua' : `${daysInt} ngày`;
      const title = document.getElementById('rev-chart-title');
      if (title) title.textContent = `Doanh thu theo phương thức thanh toán (${periodLabel})`;

      const transactions = this._transactionsData || [];

      // Tạo danh sách đủ N ngày
      const today = new Date();
      const labels = [];
      const cashByDay = {};
      const bankByDay = {};

      for (let i = daysInt - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i - endOffset);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        labels.push({ key, label });
        cashByDay[key] = 0;
        bankByDay[key] = 0;
      }

      transactions.forEach(t => {
        const inflow = calcInflow(t);
        if (inflow <= 0) return;
        const dateKey = t.thoi_gian ? t.thoi_gian.substring(0, 10) : null;
        if (!dateKey || !(dateKey in cashByDay)) return;
        if (t.phuong_thuc_tt === 'tien_mat') {
          cashByDay[dateKey] += inflow;
        } else {
          bankByDay[dateKey] += inflow;
        }
      });

      // Luôn vẽ biểu đồ kể cả khi không có dữ liệu (data = 0)
      // KHÔNG dùng innerHTML để xóa canvas vì sẽ phá hỏng các bộ lọc khác

      const xLabels = labels.map(l => l.label);
      const cashData = labels.map(l => cashByDay[l.key]);
      const bankData = labels.map(l => bankByDay[l.key]);

      // Plugin inline: hiển thị "Chưa có giao dịch" lên canvas khi data toàn 0
      const noDataPlugin = {
        id: 'noData',
        afterDraw(chart) {
          const hasData = chart.data.datasets.some(ds => ds.data.some(v => v > 0));
          if (hasData) return;
          const { ctx, chartArea } = chart;
          if (!chartArea) return;
          ctx.save();
          ctx.fillStyle = labelColor;
          ctx.font = '13px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            'Chưa có giao dịch trong khoảng thời gian này',
            (chartArea.left + chartArea.right) / 2,
            (chartArea.top + chartArea.bottom) / 2
          );
          ctx.restore();
        }
      };

      if (isToday || isYesterday) {
        const cashSum = cashData.reduce((a, b) => a + b, 0);
        const bankSum = bankData.reduce((a, b) => a + b, 0);

        this._chart = new Chart(canvas, {
          type: 'doughnut',
          plugins: [noDataPlugin],
          data: {
            labels: ['Tiền mặt', 'Chuyển khoản'],
            datasets: [
              {
                data: [cashSum, bankSum],
                backgroundColor: [
                  'rgba(230,81,0,0.85)',
                  'rgba(29,147,54,0.85)'
                ],
                borderColor: isDark ? '#2c2c2c' : '#ffffff',
                borderWidth: 2,
                hoverOffset: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'bottom',
                labels: {
                  color: labelColor,
                  font: { size: 11, weight: 'bold' },
                  usePointStyle: true,
                  pointStyle: 'circle',
                  padding: 15
                }
              },
              tooltip: {
                enabled: true,
                backgroundColor: isDark ? '#2a2a2a' : '#fff',
                titleColor: isDark ? '#e0e0e0' : '#333',
                bodyColor: isDark ? '#bbb' : '#555',
                borderColor: isDark ? '#444' : '#ddd',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                  label: ctx => ` ${ctx.label}: ${new Intl.NumberFormat('vi-VN').format(ctx.raw ?? 0)} đ`,
                  afterLabel: ctx => {
                    const total = cashSum + bankSum;
                    if (total === 0) return ' Tỷ lệ: 0%';
                    const pct = ((ctx.raw / total) * 100).toFixed(1);
                    return ` Tỷ lệ: ${pct}%`;
                  }
                }
              }
            },
            cutout: '65%'
          }
        });
      } else {
        this._chart = new Chart(canvas, {
          type: 'bar',
          plugins: [noDataPlugin],
          data: {
            labels: xLabels,
            datasets: [
              {
                label: 'Tiền mặt',
                data: cashData,
                backgroundColor: 'rgba(230,81,0,0.82)',
                borderColor: '#e65100',
                borderWidth: 0,
                borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 4, bottomRight: 4 },
                borderSkipped: false,
                stack: 'payment',
              },
              {
                label: 'Chuyển khoản',
                data: bankData,
                backgroundColor: 'rgba(29,147,54,0.82)',
                borderColor: '#1D9336',
                borderWidth: 0,
                borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
                borderSkipped: false,
                stack: 'payment',
              },
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: {
                display: true,
                labels: {
                  color: labelColor,
                  font: { size: 11, weight: 'bold' },
                  usePointStyle: true,
                  pointStyle: 'rect',
                }
              },
              tooltip: {
                enabled: true,
                backgroundColor: isDark ? '#2a2a2a' : '#fff',
                titleColor: isDark ? '#e0e0e0' : '#333',
                bodyColor: isDark ? '#bbb' : '#555',
                borderColor: isDark ? '#444' : '#ddd',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                  label: ctx => ` ${ctx.dataset.label}: ${new Intl.NumberFormat('vi-VN').format(ctx.raw ?? 0)} đ`,
                  footer: (items) => {
                    const total = items.reduce((s, i) => s + (i.raw ?? 0), 0);
                    return total > 0 ? `Tổng: ${new Intl.NumberFormat('vi-VN').format(total)} đ` : '';
                  }
                },
              },
            },
            scales: {
              x: {
                stacked: true,
                ticks: {
                  color: labelColor,
                  font: { size: daysInt > 14 ? 8 : 10, weight: 'bold' },
                  maxRotation: daysInt > 14 ? 45 : 0,
                  callback: function (val, index) {
                    if (daysInt > 14 && index % 5 !== 0) return '';
                    return this.getLabelForValue(val);
                  }
                },
                grid: { display: false }
              },
              y: {
                stacked: true,
                min: 0,
                ticks: {
                  color: labelColor,
                  font: { size: 9 },
                  callback: v => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(v),
                },
                grid: { color: gridColor }
              }
            }
          }
        });
      }



    } else {
      if (this._days === 'compare') {
        const compData = this._compareData || {};
        const labels = (compData.labels || []).map(day => `${day}`);
        const m1 = compData.month1 || '';
        const m2 = compData.month2 || '';
        const label1 = m1 ? `Tháng ${parseInt(m1.slice(5, 7), 10)}/${m1.slice(0, 4)}` : 'Tháng A';
        const label2 = m2 ? `Tháng ${parseInt(m2.slice(5, 7), 10)}/${m2.slice(0, 4)}` : 'Tháng B';

        const data1 = (compData.data1 || []).map(d => Math.max(0, d.tong_tien || 0));
        const data2 = (compData.data2 || []).map(d => Math.max(0, d.tong_tien || 0));

        const title = document.getElementById('rev-chart-title');
        if (title) title.textContent = `So sánh doanh thu ${label1} / ${label2}`;

        this._chart = new Chart(canvas, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: label1,
                data: data1,
                borderColor: '#1D9336',
                backgroundColor: 'rgba(29,147,54,0.10)',
                borderWidth: 2.5,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: '#1D9336',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.35,
                fill: false,
              },
              {
                label: label2,
                data: data2,
                borderColor: '#6750a4',
                backgroundColor: 'rgba(103,80,164,0.10)',
                borderWidth: 2.5,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: '#6750a4',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.35,
                fill: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { labels: { color: labelColor, font: { size: 11 } } },
              tooltip: {
                enabled: true,
                backgroundColor: isDark ? '#2a2a2a' : '#fff',
                titleColor: isDark ? '#e0e0e0' : '#333',
                bodyColor: isDark ? '#bbb' : '#555',
                borderColor: isDark ? '#444' : '#ddd',
                borderWidth: 1,
                padding: 10,
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
                min: 0,
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
      } else if (isSingleDay) {
        // Mode: so sánh tháng này vs tháng trước — chỉ dùng tong_tien dương (inflow)
        const monthData = monthComparison || {};
        const labels = (monthData.labels || []).map(day => `${day}`);
        const currentMonthLabel = monthData.current_month ? `Tháng ${parseInt(monthData.current_month.slice(5, 7), 10)}` : 'Tháng này';
        const previousMonthLabel = monthData.previous_month ? `Tháng ${parseInt(monthData.previous_month.slice(5, 7), 10)}` : 'Tháng trước';
        // Chỉ hiện tiền nhận vào (>= 0)
        const currentData = (monthData.current || []).map(d => Math.max(0, d.tong_tien || 0));
        const previousData = (monthData.previous || []).map(d => Math.max(0, d.tong_tien || 0));

        // FIX: kiểm tra nếu không có dữ liệu, hiển thị thông báo thay vì biểu đồ rỗng
        const hasData = currentData.length > 0 && (currentData.some(v => v > 0) || previousData.some(v => v > 0));
        if (!hasData) {
          const wrap = canvas.parentElement;
          if (wrap) wrap.innerHTML = '<p class="flex items-center justify-center h-full text-on-surface-variant text-body-sm">Chưa có dữ liệu biểu đồ</p>';
          return;
        }

        const title = document.getElementById('rev-chart-title');
        if (title) title.textContent = `So sánh doanh thu ${currentMonthLabel} / ${previousMonthLabel}`;

        this._chart = new Chart(canvas, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: currentMonthLabel,
                data: currentData,
                borderColor: '#1D9336',
                backgroundColor: 'rgba(29,147,54,0.10)',
                borderWidth: 2.5,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: '#1D9336',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.35,
                fill: false,
              },
              {
                label: previousMonthLabel,
                data: previousData,
                borderColor: '#9aa0ab',
                backgroundColor: 'rgba(90,95,103,0.07)',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: '#9aa0ab',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.35,
                fill: false,
                borderDash: [5, 3],
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { labels: { color: labelColor, font: { size: 11 } } },
              tooltip: {
                enabled: true,
                backgroundColor: isDark ? '#2a2a2a' : '#fff',
                titleColor: isDark ? '#e0e0e0' : '#333',
                bodyColor: isDark ? '#bbb' : '#555',
                borderColor: isDark ? '#444' : '#ddd',
                borderWidth: 1,
                padding: 10,
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
                min: 0,
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
        // Mode 7/30 ngày — line chart cho Gói tập, Gói PT và Tổng
        const daysInt = parseInt(this._days) || 30;
        const title = document.getElementById('rev-chart-title');
        if (title) title.textContent = `Doanh thu ${daysInt} ngày qua (tiền nhận vào)`;

        const dailyList = Array.isArray(daily) ? daily : [];

        const labels = dailyList.map(d => {
          const parts = d.ngay.split('-');
          return `${parseInt(parts[2])}/${parseInt(parts[1])}`;
        });
        // Chỉ lấy giá trị dương
        const goiTapData = dailyList.map(d => Math.max(0, d.tien_goi_tap || 0));
        const goiPTData = dailyList.map(d => Math.max(0, d.tien_goi_pt || 0));
        const tongData = dailyList.map(d => Math.max(0, d.tong_tien || 0));

        this._chart = new Chart(canvas, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Gói tập',
                data: goiTapData,
                borderColor: '#1D9336',
                backgroundColor: 'rgba(29,147,54,0.08)',
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: '#1D9336',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.35,
                fill: false,
              },
              {
                label: 'Gói PT',
                data: goiPTData,
                borderColor: '#6750a4',
                backgroundColor: 'rgba(103,80,164,0.08)',
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: '#6750a4',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.35,
                fill: false,
              },
              {
                label: 'Tổng',
                data: tongData,
                borderColor: '#e65100',
                backgroundColor: 'rgba(230,81,0,0.08)',
                borderWidth: 2.5,
                pointRadius: 5,
                pointHoverRadius: 9,
                pointBackgroundColor: '#e65100',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.35,
                fill: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { labels: { color: labelColor, font: { size: 11 } } },
              tooltip: {
                enabled: true,
                backgroundColor: isDark ? '#2a2a2a' : '#fff',
                titleColor: isDark ? '#e0e0e0' : '#333',
                bodyColor: isDark ? '#bbb' : '#555',
                borderColor: isDark ? '#444' : '#ddd',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                  label: ctx => ` ${new Intl.NumberFormat('vi-VN').format(ctx.raw ?? 0)} đ`,
                },
              },
            },
            scales: {
              x: {
                ticks: { color: labelColor, font: { size: 10 }, maxRotation: 45 },
                grid: { color: gridColor },
                title: { display: true, text: 'Ngày', color: labelColor, font: { size: 10 } },
              },
              y: {
                min: 0,
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
        <div class="flex flex-col gap-standard" style="min-height:230px;">
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
      else if (this._days === 'compare') {
        const m1 = this._compareData?.month1 || '';
        const m2 = this._compareData?.month2 || '';
        const label1 = m1 ? `tháng ${parseInt(m1.slice(5, 7), 10)}/${m1.slice(0, 4)}` : 'tháng A';
        const label2 = m2 ? `tháng ${parseInt(m2.slice(5, 7), 10)}/${m2.slice(0, 4)}` : 'tháng B';
        titleEl.textContent = `Giao dịch của ${label1} và ${label2}`;
      }
      else titleEl.textContent = `Giao dịch ${this._days} ngày qua`;
    }

    const list = Array.isArray(transactions) ? transactions : [];
    if (countEl) countEl.textContent = list.length;

    // Hiện/ẩn cột chi nhánh dựa trên bộ lọc
    const showBranchCol = !this._selectedBranch;
    const thBranch = document.getElementById('rev-th-chinhanh');
    if (thBranch) thBranch.style.display = showBranchCol ? '' : 'none';
    const totalCols = showBranchCol ? 9 : 8;

    if (list.length === 0) {
      const msg = isYesterday ? 'Chưa có giao dịch nào hôm qua' : isToday ? 'Chưa có giao dịch nào hôm nay' : `Chưa có giao dịch nào trong ${this._days} ngày qua`;
      tbody.innerHTML = `<tr><td colspan="${totalCols}" class="text-center py-margin text-on-surface-variant text-body-sm">${msg}</td></tr>`;
      return;
    }

    // Infinite Scroll: hiển thị từ 0 tới page * perPage
    const perPage = 20;
    const totalPages = Math.ceil(list.length / perPage);
    this._transactionPage = this._transactionPage || 1;
    this._transactionPage = Math.max(1, Math.min(this._transactionPage, totalPages));
    const paginated = list.slice(0, this._transactionPage * perPage);

    const rowsHtml = paginated.map(t => {
      const time = t.thoi_gian ? new Date(t.thoi_gian).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
      const timeDisplay = (isToday || isYesterday)
        ? time
        : (t.thoi_gian ? new Date(t.thoi_gian).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + time : '—');

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
        ? t.phuong_thuc_tt === 'tien_mat' ? 'Tiền mặt' : 'Chuyển khoản'
        : '—';

      const branchLabel = t.chi_nhanh || '—';
      const branchCell = showBranchCol
        ? `<td class="px-standard py-3 text-on-surface-variant font-medium text-body-sm">${branchLabel}</td>`
        : '';

      return `
        <tr class="border-b border-outline-variant/30 hover:bg-brand-primary/5 transition-colors">
          <td class="px-standard py-3 font-bold text-on-surface text-body-md">${t.khach_hang || '—'}</td>
          <td class="px-standard py-3 text-on-surface-variant font-medium text-body-sm">${t.san_pham || '—'}</td>
          <td class="px-standard py-3">${loaiLabel}</td>
          ${branchCell}
          <td class="px-standard py-3">${statusLabel}</td>
          <td class="px-standard py-3">${paymentLabel}</td>
          <td class="px-standard py-3 text-right font-bold text-brand-primary text-body-md">${this._formatMoney(t.gia_thuc_te)}</td>
          <td class="px-standard py-3 text-right font-bold">${chenhLechHtml}</td>
          <td class="px-standard py-3 text-on-surface-variant font-medium text-body-sm">${timeDisplay}</td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = rowsHtml;
  },

  _updateRangeButtons: function () {
    document.querySelectorAll('.rev-range-btn').forEach(btn => {
      const active = btn.dataset.days === String(this._days);
      btn.className = active
        ? 'rev-range-btn px-4 py-1.5 rounded-xl text-body-sm font-bold bg-brand-primary text-white shadow-sm transition-all duration-300 border border-brand-primary/20'
        : 'rev-range-btn px-4 py-1.5 rounded-xl text-body-sm font-bold text-on-surface-variant hover:text-brand-primary hover:bg-brand-primary/5 transition-all duration-300 border border-transparent';
    });
  },

  // Cập nhật dropdown biểu đồ theo bộ lọc thời gian đang chọn
  _updateChartTypeSelect: function () {
    const sel = document.getElementById('rev-chart-type');
    if (!sel) return;
    const key = this._days; // 'today', 'yesterday', 7, 30, 'compare'
    if (key === 'compare') {
      sel.innerHTML = `<option value="default">Mặc định</option>`;
      sel.value = 'default';
      this._chartType = 'default';
      return;
    }
    const options = this._chartTypeOptions[key] || this._chartTypeOptions['today'];
    sel.innerHTML = options.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
    sel.value = 'default';
    this._chartType = 'default';
  },

  _fetchAndRender: async function () {
    try {
      this._transactionPage = 1;
      this._selectedBranch = window.GymApp.selectedBranch || '';
      let revData = {};
      let dayData = {};
      const branchQ = this._selectedBranch ? `&chi_nhanh=${encodeURIComponent(this._selectedBranch)}` : '';
      const branchOnlyQ = this._selectedBranch ? `?chi_nhanh=${encodeURIComponent(this._selectedBranch)}` : '';

      if (this._days === 'today') {
        const todayUrl = '/revenue/today' + (this._selectedBranch ? `?chi_nhanh=${encodeURIComponent(this._selectedBranch)}` : '');
        const [revRes, todayRes] = await Promise.all([
          window.GymApp.api.get(`/revenue?days=1${branchQ}`),
          window.GymApp.api.get(todayUrl),
        ]);
        revData = revRes?.data || {};
        dayData = todayRes?.data || { giao_dich: [] };
      } else if (this._days === 'yesterday') {
        const yesterdayUrl = '/revenue/yesterday' + (this._selectedBranch ? `?chi_nhanh=${encodeURIComponent(this._selectedBranch)}` : '');
        const [revRes, yesterdayRes] = await Promise.all([
          window.GymApp.api.get(`/revenue?days=1${branchQ}`),
          window.GymApp.api.get(yesterdayUrl),
        ]);
        revData = revRes?.data || {};
        dayData = yesterdayRes?.data || { giao_dich: [] };
      } else if (this._days === 'compare') {
        const m1 = this._compareMonth1 || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const d2 = new Date();
        d2.setMonth(d2.getMonth() - 1);
        const m2 = this._compareMonth2 || `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}`;

        const compareUrl = `/revenue/compare-months?month1=${m1}&month2=${m2}` + (this._selectedBranch ? `&chi_nhanh=${encodeURIComponent(this._selectedBranch)}` : '');
        const res = await window.GymApp.api.get(compareUrl);
        const compareData = res?.data || {};
        this._compareData = compareData;

        // Tổng hợp stats từ 2 tháng so sánh
        this._renderStats(null, null, null);
        this._renderChart(null, null);

        // Render dữ liệu packageStats và transactions từ kết quả so sánh (gộp cả Gym và PT)
        const allComparePackageStats = [
          ...(compareData.packageStats || []).map(p => ({ ...p, ten_goi: `${p.ten_goi} (Gym)` })),
          ...(compareData.ptPackageStats || []).map(p => ({ ...p, ten_goi: `${p.ten_goi} (PT)` }))
        ].sort((a, b) => b.so_dang_ky - a.so_dang_ky);

        this._renderPackageStats(allComparePackageStats);
        this._renderTodayTable(compareData.transactions || []);
        return;
      } else {
        const daysInt = parseInt(this._days) || 30;
        const revRes = await window.GymApp.api.get(`/revenue?days=${daysInt}${branchQ}`);
        revData = revRes?.data || {};
        dayData = {
          giao_dich: revData.transactions || [],
        };
      }

      this._dailyData = revData.daily || [];
      this._monthComparisonData = revData.monthComparison || {};
      this._transactionsData = dayData.giao_dich || [];

      // Gộp packageStats và ptPackageStats hiển thị ở phần gói tập bán chạy
      const allPackageStats = [
        ...(revData.packageStats || []).map(p => ({ ...p, ten_goi: `${p.ten_goi} (Gym)` })),
        ...(revData.ptPackageStats || []).map(p => ({ ...p, ten_goi: `${p.ten_goi} (PT)` }))
      ].sort((a, b) => b.so_dang_ky - a.so_dang_ky);

      this._renderStats(revData.summary, dayData, revData.monthComparison);
      // FIX: truyền daily vào _renderChart để mode 7/30 ngày vẽ đúng
      this._renderChart(this._dailyData, this._monthComparisonData);
      this._renderPackageStats(allPackageStats);
      this._renderTodayTable(dayData.giao_dich || []);
    } catch (err) {
      console.error('Revenue fetch error', err);
      window.GymApp.toast('Lỗi tải dữ liệu doanh thu!', 'error');
    }
  },

  init: async function () {
    const self = this;
    this._packagePage = 1;
    this._transactionPage = 1;
    this._packageStats = [];
    this._days = 'today';
    this._chartType = 'default';
    this._selectedBranch = window.GymApp.selectedBranch || '';

    this._updateRangeButtons();
    this._updateChartTypeSelect(); // Khởi tạo dropdown đúng theo bộ lọc mặc định

    // Set default value cho Select Month Input
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    self._compareMonth1 = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    self._compareMonth2 = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    if (typeof AirDatepicker !== 'undefined') {
      self._dp1 = new AirDatepicker('#compare-month-1', {
        locale: window.GymApp.localeVi,
        view: 'months',
        minView: 'months',
        dateFormat: 'MM/yyyy',
        autoClose: true,
        selectedDates: [today],
        onSelect({ date }) {
          if (date) {
            self._compareMonth1 = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          }
        }
      });

      self._dp2 = new AirDatepicker('#compare-month-2', {
        locale: window.GymApp.localeVi,
        view: 'months',
        minView: 'months',
        dateFormat: 'MM/yyyy',
        autoClose: true,
        selectedDates: [lastMonth],
        onSelect({ date }) {
          if (date) {
            self._compareMonth2 = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          }
        }
      });
    }

    await this._fetchAndRender();

    // Infinite Scroll cho bảng giao dịch
    const txContainer = document.getElementById('rev-today-table');
    if (txContainer) {
      txContainer.addEventListener('scroll', function () {
        if (txContainer.scrollTop + txContainer.clientHeight >= txContainer.scrollHeight - 20) {
          const list = self._transactionsData || [];
          const perPage = 20;
          const totalPages = Math.ceil(list.length / perPage);
          if (self._transactionPage < totalPages) {
            self._transactionPage++;
            const scrollPos = txContainer.scrollTop;
            self._renderTodayTable(list);
            const newContainer = document.getElementById('rev-today-table');
            if (newContainer) newContainer.scrollTop = scrollPos;
          }
        }
      });
    }


    // Lắng nghe đổi loại biểu đồ
    document.getElementById('rev-chart-type')?.addEventListener('change', function () {
      self._chartType = this.value;
      self._renderChart(self._dailyData, self._monthComparisonData);
    });

    // Chọn khoảng thời gian
    document.querySelectorAll('.rev-range-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const val = btn.dataset.days;
        self._days = isNaN(val) ? val : parseInt(val);
        self._updateRangeButtons();
        self._updateChartTypeSelect(); // Reset dropdown về Mặc định và cập nhật options

        const compareInputs = document.getElementById('compare-months-inputs');
        if (self._days === 'compare') {
          if (compareInputs) compareInputs.classList.remove('hidden');
        } else {
          if (compareInputs) compareInputs.classList.add('hidden');
        }
        await self._fetchAndRender();
      });
    });

    // Nút thực hiện so sánh
    document.getElementById('btn-compare-action')?.addEventListener('click', async () => {
      await self._fetchAndRender();
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
    if (this._dp1) {
      this._dp1.destroy();
      this._dp1 = null;
    }
    if (this._dp2) {
      this._dp2.destroy();
      this._dp2 = null;
    }
  },

  guideHtml: `
    <div class="space-y-4 text-xs">
      <div class="flex items-start gap-2 bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/10">
        <span class="material-symbols-outlined text-brand-primary text-base flex-shrink-0 mt-0.5">info</span>
        <p class="text-on-surface-variant leading-relaxed">Trang <strong>Quản lý Doanh thu</strong> giúp theo dõi doanh thu thực tế, lịch sử giao dịch và phân tích cơ cấu doanh thu theo gói tập của phòng gym.</p>
      </div>
      
      <div>
        <h4 class="font-bold text-on-surface mb-1">Các chỉ số tài chính:</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li><strong>Doanh thu:</strong> Tổng số tiền thu được từ việc đăng ký gói hội viên và gói PT trong khoảng thời gian đã chọn.</li>
          <li><strong>Số giao dịch:</strong> Tổng số hóa đơn/lịch sử đăng ký được ghi nhận thành công.</li>
          <li><strong>Trung bình/GD:</strong> Giá trị trung bình trên mỗi giao dịch được thực hiện.</li>
          <li><strong>So với tháng trước:</strong> Tỷ lệ tăng trưởng doanh thu so với cùng kỳ tháng trước.</li>
        </ul>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">Hướng dẫn thao tác:</h4>
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