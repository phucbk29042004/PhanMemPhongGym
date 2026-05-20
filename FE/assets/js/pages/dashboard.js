window.GymApp.pages['dashboard'] = {
  render: function () {
    const d = window.GymApp.data;
    const dbData = d.stats || {
      hoi_vien: { tong: 0, con_han: 0, sap_het_han: 0, het_han: 0, chua_dang_ky: 0 },
      tong_pt: 0,
      doanh_thu_hom_nay: { tong_tien: 0, tong_don: 0 },
      luot_vao_ra_hom_nay: { tong_luot: 0, luot_vao: 0 },
      lich_tap_hom_nay: { tong: 0, cho_tap: 0, da_tap: 0 },
      recent_checkins: [],
      top_hoi_vien: [],
      percent_changes: { hoi_vien: "0.00", luot_vao: "0.00", doanh_thu: "0.00", sap_het_han: "0.00" }
    };

    if (!dbData.hoi_vien) dbData.hoi_vien = { tong: 0, con_han: 0, sap_het_han: 0, het_han: 0, chua_dang_ky: 0 };
    if (!dbData.doanh_thu_hom_nay) dbData.doanh_thu_hom_nay = { tong_tien: 0, tong_don: 0 };
    if (!dbData.luot_vao_ra_hom_nay) dbData.luot_vao_ra_hom_nay = { tong_luot: 0, luot_vao: 0 };
    if (!dbData.lich_tap_hom_nay) dbData.lich_tap_hom_nay = { tong: 0, cho_tap: 0, da_tap: 0 };
    if (!dbData.percent_changes) dbData.percent_changes = { hoi_vien: "0.00", luot_vao: "0.00", doanh_thu: "0.00", sap_het_han: "0.00" };

    const recentCheckins = (dbData.recent_checkins || []).map(c => ({
      id: c.id, memberId: c.ma_ho_so, name: c.ho_ten, time: c.gio_hien_thi || c.thoi_diem.substring(11, 16), avatar: c.avatar_url
    }));
    
    const topMembers = dbData.top_hoi_vien || [];

    const formatPercent = (val) => {
      const num = parseFloat(val);
      if (num === 0) return `<span class="text-on-surface-variant font-medium text-body-sm ml-2">0.00%</span>`;
      if (num > 0) return `<span class="text-brand-primary font-bold text-body-sm ml-2 flex items-center gap-0.5"><span class="material-symbols-outlined text-[14px]">trending_up</span>+${num.toFixed(2)}%</span>`;
      return `<span class="text-red-500 font-bold text-body-sm ml-2 flex items-center gap-0.5"><span class="material-symbols-outlined text-[14px]">trending_down</span>${num.toFixed(2)}%</span>`;
    };

    const stats = [
      { label: 'Tổng hội viên', value: dbData.hoi_vien?.tong || 0, percent: formatPercent(dbData.percent_changes.hoi_vien) },
      { label: 'Check-in hôm nay', value: dbData.luot_vao_ra_hom_nay?.luot_vao || 0, percent: formatPercent(dbData.percent_changes.luot_vao) },
      { label: 'Doanh thu hôm nay', value: window.GymApp.formatCurrency(dbData.doanh_thu_hom_nay?.tong_tien || 0), percent: formatPercent(dbData.percent_changes.doanh_thu) },
      { label: 'Sắp hết hạn', value: dbData.hoi_vien?.sap_het_han || 0, percent: formatPercent(dbData.percent_changes.sap_het_han) },
    ];

    const cardClass = "bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border-2 border-outline-variant/50 hover:-translate-y-1 hover:shadow-md transition-all duration-300";

    return `
      <div class="flex flex-col gap-4 animate-in fade-in duration-500 pb-6">

        <!-- Header -->
        <div class="flex items-center justify-between gap-3 px-1 mb-2">
          <div class="flex items-center gap-2 text-sm text-on-surface-variant font-medium">
             <span class="material-symbols-outlined text-[18px]">calendar_today</span>
             ${new Date().toLocaleDateString('vi-VN', { year:'numeric', month:'long', day:'numeric' })}
          </div>
          <button id="btn-dashboard-refresh" class="flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-full font-bold text-sm hover:bg-brand-primary/20 transition-all">
             <span id="dashboard-refresh-icon" class="material-symbols-outlined text-[18px]" style="transition:transform 0.6s ease">refresh</span>
             <span id="dashboard-refresh-text">Làm mới dữ liệu</span>
          </button>
        </div>

        <!-- Layout Grid -->
        <div class="grid grid-cols-1 xl:grid-cols-4 gap-4">
          
          <!-- LEFT / MAIN CONTENT (Spans 3 cols) -->
          <div class="xl:col-span-3 flex flex-col gap-4">
            
            <!-- 4 Stat Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              ${stats.map(c => `
                <div class="bg-brand-primary/5 dark:bg-brand-primary/10 rounded-2xl p-4 hover:-translate-y-1 hover:shadow-md hover:bg-brand-primary/10 transition-all duration-300 border border-brand-primary/20">
                  <p class="text-on-surface-variant text-body-sm font-bold uppercase tracking-wider mb-2">${c.label}</p>
                  <div class="flex items-baseline flex-wrap gap-x-2 gap-y-1">
                    <h3 class="text-xl font-bold text-on-surface truncate max-w-full" title="${c.value}">${c.value}</h3>
                    ${c.percent}
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Middle Row (Revenue Chart + Top Members) -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              <!-- Revenue Chart -->
              <div class="lg:col-span-2 ${cardClass} p-4">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex gap-4">
                    <button class="font-bold text-on-surface border-b-2 border-brand-primary pb-1">Doanh thu 12 tháng</button>
                  </div>
                  <div class="flex gap-4 text-xs font-medium text-on-surface-variant">
                     <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-brand-primary"></span> Thực tế</div>
                  </div>
                </div>
                <div style="height: 250px; width: 100%;">
                  <canvas id="chart-revenue"></canvas>
                </div>
              </div>

              <!-- Traffic by Website -> Top Hội viên chăm chỉ -->
              <div class="${cardClass} p-4 flex flex-col">
                <h3 class="text-sm font-bold text-on-surface mb-4">Hội viên chăm chỉ nhất</h3>
                <div class="flex-1 flex flex-col justify-between gap-3">
                  ${topMembers.length === 0 ? 
                    `<p class="text-center text-on-surface-variant text-sm mt-10">Chưa có dữ liệu tháng này</p>` :
                    topMembers.map((m, i) => {
                      const maxVal = topMembers[0].so_buoi_tap || 1;
                      const wPercent = Math.max(10, (m.so_buoi_tap / maxVal) * 100);
                      return `
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-on-surface font-medium truncate w-32" title="${m.ho_ten}">${m.ho_ten}</span>
                        <div class="flex-1 mx-3 flex items-center">
                          <div class="h-1.5 rounded-full bg-brand-primary/20" style="width: 100%;">
                            <div class="h-full rounded-full bg-brand-primary" style="width: ${wPercent}%"></div>
                          </div>
                        </div>
                        <span class="text-on-surface-variant w-5 text-right">${m.so_buoi_tap}</span>
                      </div>
                    `}).join('')
                  }
                </div>
              </div>
            </div>

            <!-- Bottom Row (Bar Chart + Doughnut) -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              <!-- Bar Chart: Revenue by Package -->
              <div class="${cardClass} p-4">
                <h3 class="text-sm font-bold text-on-surface mb-4">Doanh thu theo gói tập</h3>
                <div style="height: 220px; width: 100%;">
                  <canvas id="chart-packages-bar"></canvas>
                </div>
              </div>

              <!-- Doughnut: Member Status -->
              <div class="${cardClass} p-4 flex flex-col">
                <h3 class="text-sm font-bold text-on-surface mb-4">Tình trạng hội viên</h3>
                <div class="flex-1 flex items-center">
                  <div style="height: 180px; width: 50%;">
                    <canvas id="chart-packages-pie"></canvas>
                  </div>
                  <div class="flex-1 flex flex-col justify-center gap-3 pl-4 text-xs">
                    ${[
                      { label: 'Còn hạn', value: dbData.hoi_vien.con_han, color: 'bg-brand-primary', textColor: 'text-on-surface' },
                      { label: 'Sắp hết hạn', value: dbData.hoi_vien.sap_het_han, color: 'bg-[#f59e0b]', textColor: 'text-on-surface-variant' },
                      { label: 'Hết hạn', value: dbData.hoi_vien.het_han, color: 'bg-error', textColor: 'text-on-surface-variant' },
                      { label: 'Chưa đ.ký', value: dbData.hoi_vien.chua_dang_ky, color: 'bg-outline', textColor: 'text-on-surface-variant' },
                    ].map(r => {
                      const total = dbData.hoi_vien.tong || 1;
                      const pct = ((r.value / total) * 100).toFixed(1);
                      return `
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="w-2 h-2 rounded-full ${r.color}"></span>
                          <span class="${r.textColor}">${r.label}</span>
                        </div>
                        <span class="font-medium text-on-surface">${pct}%</span>
                      </div>
                    `}).join('')}
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- RIGHT SIDEBAR (Spans 1 col) -->
          <div class="xl:col-span-1 flex flex-col gap-4">
            
            <!-- Check-in gần nhất (Activities) -->
            <div class="${cardClass} p-4 flex-1">
              <h3 class="text-sm font-bold text-on-surface mb-4">Check-in gần nhất</h3>
              <div class="relative pl-3 border-l border-outline-variant/50 flex flex-col gap-4">
                ${recentCheckins.length === 0 ? 
                  `<p class="text-body-sm text-on-surface-variant ml-2">Chưa có lượt vào</p>` :
                  recentCheckins.slice(0, 6).map(c => `
                  <div class="relative">
                    <div class="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-brand-primary ring-4 ring-surface"></div>
                    <div class="flex flex-col ml-3">
                      <span class="text-body-md font-semibold text-on-surface">
                        <a href="javascript:void(0)" onclick="window.GymApp.navigate('checkin')" class="hover:text-brand-primary transition-colors">${c.name}</a> đã vào tập.
                      </span>
                      <span class="text-label-xs text-on-surface-variant mt-1">${c.time} hôm nay</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Contacts / Lịch PT & Tổng PT -->
            <div class="${cardClass} p-4">
              <h3 class="text-sm font-bold text-on-surface mb-4">Thông tin Huấn luyện viên</h3>
              <div class="flex flex-col gap-4">
                
                <div class="flex items-center gap-3 cursor-pointer group" onclick="window.GymApp.navigate('members-list'); setTimeout(() => document.getElementById('tab-pts')?.click(), 100);">
                  <div class="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                    <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">sports_gymnastics</span>
                  </div>
                  <div class="flex-1">
                    <p class="text-body-md font-bold text-on-surface group-hover:text-brand-primary transition-colors">Tổng Huấn luyện viên</p>
                    <p class="text-body-sm font-semibold text-on-surface-variant mt-0.5">${dbData.tong_pt} nhân sự</p>
                  </div>
                </div>

                <div class="flex items-center gap-3 cursor-pointer group" onclick="window.GymApp.navigate('pt-training')">
                  <div class="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                    <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">calendar_month</span>
                  </div>
                  <div class="flex-1">
                    <p class="text-body-md font-bold text-on-surface group-hover:text-brand-primary transition-colors">Lịch PT hôm nay</p>
                    <p class="text-body-sm font-semibold text-on-surface-variant mt-0.5">${dbData.lich_tap_hom_nay?.tong || 0} buổi (${dbData.lich_tap_hom_nay?.da_tap || 0} đã hoàn thành)</p>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    `;
  },

  init: async function () {
    const self = this;
    await self._fetchAndRender();

    document.getElementById('btn-dashboard-refresh')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-dashboard-refresh');
      const icon = document.getElementById('dashboard-refresh-icon');
      if (!btn || btn.disabled) return;

      btn.disabled = true;
      let angle = 0;
      const spin = setInterval(() => {
        angle += 30;
        if (icon) icon.style.transform = `rotate(${angle}deg)`;
      }, 50);

      await self._fetchAndRender();

      clearInterval(spin);
      if (icon) icon.style.transform = 'rotate(0deg)';
      btn.disabled = false;
      window.GymApp.toast('Đã cập nhật dữ liệu!', 'success');
    });
  },

  _fetchAndRender: async function () {
    try {
      const [statsRes, revRes] = await Promise.all([
        window.GymApp.api.get('/revenue/dashboard'),
        window.GymApp.api.get('/revenue?days=365'),
      ]);
      if (statsRes && statsRes.success) window.GymApp.data.stats = statsRes.data;
      if (revRes && revRes.success) {
        window.GymApp.data.revenueDaily = revRes.data.daily || [];
        window.GymApp.data.packageStats = revRes.data.packageStats || [];
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    }
    const contentArea = document.getElementById('content-area');
    if (contentArea && window.GymApp.currentPage === 'dashboard') {
      contentArea.innerHTML = this.render();
    }
    this._initCharts();
  },

  _initCharts: function () {
    const dbData = window.GymApp.data.stats;
    const pkgStats = window.GymApp.data.packageStats || [];
    if (!dbData) return;

    const isDark = document.documentElement.classList.contains('dark');
    const colorLine = '#1D9336';
    const colorBarBase = isDark ? '#1D933680' : '#1D933680';
    const colorBarHover = '#1D9336';
    const textColor = isDark ? '#9ca3af' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

    // --- Line Chart (Revenue) ---
    const ctxRev = document.getElementById('chart-revenue');
    if (ctxRev) {
      const monthlyMap = {};
      for (let m = 1; m <= 12; m++) monthlyMap[m] = 0;
      (window.GymApp.data.revenueDaily || []).forEach(d => {
        const month = parseInt(d.ngay.split('-')[1]);
        monthlyMap[month] = (monthlyMap[month] || 0) + (d.tong_tien || 0);
      });
      const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const monthData = Object.values(monthlyMap).map(v => Math.round(v / 1_000_000));

      window.GymApp._activeChart1 = new Chart(ctxRev, {
        type: 'line',
        data: {
          labels: monthLabels,
          datasets: [{
            label: 'Doanh thu',
            data: monthData,
            borderColor: colorLine,
            borderWidth: 2,
            pointBackgroundColor: '#fff',
            pointBorderColor: colorLine,
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            fill: false,
            tension: 0.4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: { 
            legend: { display: false },
            tooltip: {
              callbacks: { label: function(c) { return c.parsed.y + ' Tr'; } }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
            y: { 
              beginAtZero: true, 
              grid: { color: gridColor }, 
              ticks: { color: textColor, font: { size: 11 }, callback: function(v) { return v > 0 ? v + 'k' : '0'; } } 
            }
          }
        }
      });
    }

    // --- Bar Chart (Package Revenue) ---
    const ctxPkgBar = document.getElementById('chart-packages-bar');
    if (ctxPkgBar) {
      // Get top 5 packages
      const topPkgs = pkgStats.slice(0, 5);
      const labels = topPkgs.map(p => p.ten_goi.substring(0, 10));
      const data = topPkgs.map(p => p.tong_tien / 1_000_000);

      window.GymApp._activeChart2 = new Chart(ctxPkgBar, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colorBarBase,
            hoverBackgroundColor: colorBarHover,
            borderRadius: 6,
            barThickness: 24
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 } } },
            y: { grid: { display: false }, ticks: { display: false }, border: {display: false} }
          }
        }
      });
    }

    // --- Pie/Doughnut Chart (Member Status) ---
    const ctxPkgPie = document.getElementById('chart-packages-pie');
    if (ctxPkgPie && dbData.hoi_vien) {
      window.GymApp._activeChart3 = new Chart(ctxPkgPie, {
        type: 'doughnut',
        data: {
          labels: ['Còn hạn', 'Sắp hết hạn', 'Hết hạn', 'Chưa đăng ký'],
          datasets: [{
            data: [dbData.hoi_vien.con_han, dbData.hoi_vien.sap_het_han, dbData.hoi_vien.het_han, dbData.hoi_vien.chua_dang_ky],
            backgroundColor: ['#1D9336', '#f59e0b', '#ba1a1a', '#9ca3af'],
            borderWidth: 0, 
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          cutout: '70%',
        }
      });
    }
  }
};
