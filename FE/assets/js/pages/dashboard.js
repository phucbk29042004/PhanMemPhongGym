window.GymApp.pages['dashboard'] = {
  render: function () {
    const d = window.GymApp.data;
    const dbData = d.stats || {
      hoi_vien: { tong: 0, con_han: 0, sap_het_han: 0, het_han: 0, chua_dang_ky: 0 },
      tong_pt: 0,
      doanh_thu_hom_nay: { tong_tien: 0, tong_don: 0 },
      luot_vao_ra_hom_nay: { tong_luot: 0, luot_vao: 0 },
      lich_tap_hom_nay: { tong: 0, cho_tap: 0, da_tap: 0 },
      recent_checkins: []
    };

    // Đảm bảo các thuộc tính con luôn tồn tại nếu d.stats có giá trị nhưng thiếu thuộc tính
    if (!dbData.hoi_vien) dbData.hoi_vien = { tong: 0, con_han: 0, sap_het_han: 0, het_han: 0, chua_dang_ky: 0 };
    if (!dbData.doanh_thu_hom_nay) dbData.doanh_thu_hom_nay = { tong_tien: 0, tong_don: 0 };
    if (!dbData.luot_vao_ra_hom_nay) dbData.luot_vao_ra_hom_nay = { tong_luot: 0, luot_vao: 0 };
    if (!dbData.lich_tap_hom_nay) dbData.lich_tap_hom_nay = { tong: 0, cho_tap: 0, da_tap: 0 };

    const recentCheckins = (dbData.recent_checkins || []).map(c => ({
      id: c.id,
      memberId: c.ma_ho_so,
      name: c.ho_ten,
      time: c.gio_hien_thi || c.thoi_diem.substring(11, 16),
      avatar: c.avatar_url
    }));

    const stats = [
      { icon: 'people', label: 'Tổng hội viên', value: dbData.hoi_vien?.tong || 0, sub: `${dbData.hoi_vien?.con_han || 0} đang hoạt động`, iconBg: 'icon-bg-green', color: 'text-brand-primary' },
      { icon: 'how_to_reg', label: 'Check-in hôm nay', value: dbData.luot_vao_ra_hom_nay?.luot_vao || 0, sub: 'Lượt vào tập', iconBg: 'icon-bg-green', color: 'text-brand-primary' },
      { icon: 'warning_amber', label: 'Sắp hết hạn', value: dbData.hoi_vien?.sap_het_han || 0, sub: 'Cần gia hạn sớm', iconBg: 'icon-bg-orange', color: 'text-[#e65100]' },
      { icon: 'payments', label: 'Doanh thu hôm nay', value: window.GymApp.formatCurrency(dbData.doanh_thu_hom_nay?.tong_tien || 0), sub: `${dbData.doanh_thu_hom_nay?.tong_don || 0} giao dịch`, iconBg: 'icon-bg-green', color: 'text-brand-primary' },
    ];

    return `
      <div class="flex flex-col gap-margin animate-in fade-in duration-500">

        <!-- Page Title -->
        <div class="page-title-bar flex flex-col md:flex-row md:items-center justify-between gap-compact">
          <div>
            <h2 class="font-display-lg text-display-lg text-on-surface font-bold tracking-tight">Tổng quan hệ thống</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">calendar_today</span>
              ${new Date().toLocaleDateString('vi-VN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>
          <div class="flex items-center gap-compact">
             <button id="btn-dashboard-refresh" class="bg-brand-primary/10 text-brand-primary px-loose py-compact rounded-full font-bold text-body-sm hover:bg-brand-primary/20 transition-all flex items-center gap-xs">
                <span id="dashboard-refresh-icon" class="material-symbols-outlined text-lg" style="transition:transform 0.6s ease">refresh</span>
                <span id="dashboard-refresh-text">Làm mới</span>
             </button>
          </div>
        </div>

        <!-- Stat Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-loose">
          ${stats.map(c => `
            <div class="gym-card bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border border-outline-variant p-loose shadow-sm flex flex-col gap-standard transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-brand-primary/40 group relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="flex items-center justify-between relative z-10">
                <span class="text-on-surface-variant font-body-sm text-body-sm font-bold uppercase tracking-wider leading-tight" style="max-width:calc(100% - 52px)">${c.label}</span>
                <div class="w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <span class="material-symbols-outlined ${c.color} text-xl" style="font-variation-settings:'FILL' 1">${c.icon}</span>
                </div>
              </div>
              <div class="relative z-10 flex flex-col">
                <span class="${c.color} font-display-lg text-display-lg font-bold tracking-tight">${c.value}</span>
                <span class="text-on-surface-variant font-body-sm text-body-sm flex items-center gap-xs mt-xs">
                  <span class="w-1.5 h-1.5 rounded-full ${c.color.replace('text-', 'bg-')} animate-pulse"></span>
                  ${c.sub}
                </span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-loose">

          <!-- Biểu đồ doanh thu -->
          <div class="lg:col-span-2 gym-card bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border border-outline-variant shadow-sm overflow-hidden transition-all hover:shadow-lg">
            <div class="section-header px-loose py-standard border-b border-outline-variant flex items-center gap-compact bg-surface-container-lowest/40">
              <div class="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-brand-primary text-lg" style="font-variation-settings:'FILL' 1">bar_chart</span>
              </div>
              <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface flex-1">Doanh thu 12 tháng</h3>
              <span class="text-on-surface-variant text-body-sm italic">triệu VNĐ</span>
            </div>
            <div class="p-loose" style="height:280px">
              <canvas id="chart-revenue"></canvas>
            </div>
          </div>

          <!-- Biểu đồ gói tập -->
          <div class="gym-card bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border border-outline-variant shadow-sm overflow-hidden transition-all hover:shadow-lg">
            <div class="section-header px-loose py-standard border-b border-outline-variant flex items-center gap-compact bg-surface-container-lowest/40">
              <div class="icon-bg icon-bg-blue">
                <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg" style="font-variation-settings:'FILL' 1">donut_large</span>
              </div>
              <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Phân bố hội viên</h3>
            </div>
            <div class="p-loose flex flex-col items-center justify-center" style="height:280px">
              <canvas id="chart-packages"></canvas>
            </div>
          </div>
        </div>

        <!-- Bottom Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-loose">

          <!-- Check-in gần nhất -->
          <div class="bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border border-outline-variant shadow-sm overflow-hidden transition-all hover:shadow-lg">
            <div class="section-header px-loose py-standard border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest/40">
              <div class="flex items-center gap-compact">
                <div class="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                  <span class="material-symbols-outlined text-brand-primary text-lg" style="font-variation-settings:'FILL' 1">how_to_reg</span>
                </div>
                <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Check-in gần nhất</h3>
              </div>
              <button class="text-brand-primary font-bold text-body-sm hover:underline flex items-center gap-xs transition-all" onclick="window.GymApp.loadPage('checkin')">
                Xem tất cả <span class="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
            <div class="divide-y divide-outline-variant">
              ${recentCheckins.length === 0
                ? `<div class="flex flex-col items-center justify-center py-loose text-center opacity-60">
                     <span class="material-symbols-outlined text-4xl mb-xs">person_off</span>
                     <p class="text-on-surface-variant text-body-sm font-medium">Chưa có check-in hôm nay</p>
                   </div>`
                : recentCheckins.map(c => `
                    <div class="flex items-center gap-compact px-loose py-compact hover:bg-brand-primary/5 transition-all group cursor-default">
                      <div class="relative">
                        ${window.GymApp.avatarImg(c.avatar, c.name, 'sm')}
                        <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-bold text-on-surface text-body-md truncate group-hover:text-brand-primary transition-colors">${c.name}</p>
                        <p class="text-on-surface-variant text-body-sm font-medium">${c.memberId}</p>
                      </div>
                      <div class="flex items-center gap-xs bg-brand-primary/10 px-compact py-xs rounded-full flex-shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-all">
                        <span class="material-symbols-outlined text-brand-primary group-hover:text-white transition-colors" style="font-size:12px">schedule</span>
                        <span class="text-brand-primary font-bold text-body-sm group-hover:text-white transition-colors">${c.time}</span>
                      </div>
                    </div>
                  `).join('')
              }
            </div>
          </div>

          <!-- Tình trạng hội viên -->
          <div class="bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border border-outline-variant shadow-sm overflow-hidden transition-all hover:shadow-lg">
            <div class="section-header px-loose py-standard border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest/40">
              <div class="flex items-center gap-compact">
                <div class="icon-bg icon-bg-pink">
                  <span class="material-symbols-outlined text-tertiary text-lg" style="font-variation-settings:'FILL' 1">analytics</span>
                </div>
                <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Tình trạng hội viên</h3>
              </div>
              <button class="text-brand-primary font-bold text-body-sm hover:underline flex items-center gap-xs transition-all" onclick="window.GymApp.loadPage('members-list')">
                Chi tiết <span class="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
            <div class="divide-y divide-outline-variant">
              ${[
                { label: 'Còn hạn', value: dbData.hoi_vien.con_han, color: 'text-brand-primary', dot: 'bg-brand-primary', glow: 'shadow-[0_0_8px_rgba(29,147,54,0.4)]' },
                { label: 'Sắp hết hạn (7 ngày)', value: dbData.hoi_vien.sap_het_han, color: 'text-[#e65100]', dot: 'bg-[#e65100]', glow: 'shadow-[0_0_8px_rgba(230,81,0,0.4)]' },
                { label: 'Đã hết hạn', value: dbData.hoi_vien.het_han, color: 'text-error', dot: 'bg-error', glow: 'shadow-[0_0_8px_rgba(186,26,26,0.4)]' },
                { label: 'Chưa đăng ký gói', value: dbData.hoi_vien.chua_dang_ky, color: 'text-on-surface-variant', dot: 'bg-outline', glow: '' },
              ].map(r => `
                <div class="flex items-center justify-between px-loose py-compact hover:bg-surface-container-low transition-all group cursor-default">
                  <div class="flex items-center gap-compact">
                    <span class="w-2 h-2 rounded-full ${r.dot} ${r.glow} group-hover:scale-150 transition-transform"></span>
                    <span class="text-on-surface text-body-md font-medium">${r.label}</span>
                  </div>
                  <span class="font-display-2xl text-display-2xl font-bold ${r.color} group-hover:scale-110 transition-transform">${r.value}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Footer Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-loose">
          <div class="gym-card bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border border-outline-variant p-loose shadow-sm flex items-center gap-loose transition-all hover:shadow-lg hover:border-brand-primary/30 group">
            <div class="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-white text-3xl" style="font-variation-settings:'FILL' 1">sports_gymnastics</span>
            </div>
            <div>
              <p class="text-on-surface-variant text-body-sm font-bold uppercase tracking-wider leading-tight">Tổng huấn luyện viên (PT)</p>
              <p class="text-3xl font-bold text-on-surface tracking-tight mt-xs">${dbData.tong_pt}</p>
            </div>
            <div class="ml-auto opacity-20 group-hover:opacity-40 transition-opacity">
               <span class="material-symbols-outlined text-5xl">diversity_3</span>
            </div>
          </div>
          <div class="gym-card bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border border-outline-variant p-loose shadow-sm flex items-center gap-loose transition-all hover:shadow-lg hover:border-secondary/30 group">
            <div class="w-14 h-14 bg-secondary-container rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-secondary text-3xl" style="font-variation-settings:'FILL' 1">calendar_today</span>
            </div>
            <div>
              <p class="text-on-surface-variant text-body-sm font-bold uppercase tracking-wider leading-tight">Lịch tập hôm nay</p>
              <div class="flex items-baseline gap-xs mt-xs">
                <p class="text-3xl font-bold text-on-surface tracking-tight">${dbData.lich_tap_hom_nay?.tong || 0}</p>
                <p class="text-on-surface-variant text-body-sm font-medium">buổi <span class="text-brand-primary">(${dbData.lich_tap_hom_nay?.da_tap || 0} hoàn thành)</span></p>
              </div>
            </div>
            <div class="ml-auto opacity-20 group-hover:opacity-40 transition-opacity">
               <span class="material-symbols-outlined text-5xl">event_available</span>
            </div>
          </div>
        </div>

      </div>
    `;
  },

  init: async function () {
    const self = this;
    await self._fetchAndRender();

    // Bind nút Làm mới với hiệu ứng xoay icon
    document.getElementById('btn-dashboard-refresh')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-dashboard-refresh');
      const icon = document.getElementById('dashboard-refresh-icon');
      const text = document.getElementById('dashboard-refresh-text');
      if (!btn || btn.disabled) return;

      // Bắt đầu loading
      btn.disabled = true;
      btn.classList.add('opacity-70', 'cursor-not-allowed');
      if (text) text.textContent = 'Đang tải...';
      let angle = 0;
      const spin = setInterval(() => {
        angle += 30;
        if (icon) icon.style.transform = `rotate(${angle}deg)`;
      }, 50);

      await self._fetchAndRender();

      // Dừng loading
      clearInterval(spin);
      if (icon) icon.style.transform = 'rotate(0deg)';
      if (text) text.textContent = 'Làm mới';
      btn.disabled = false;
      btn.classList.remove('opacity-70', 'cursor-not-allowed');
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
      if (revRes && revRes.success) window.GymApp.data.revenueDaily = revRes.data.daily || [];
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
    if (!dbData) return;

    const ctxRev = document.getElementById('chart-revenue');
    if (ctxRev) {
      // Gộp doanh thu theo tháng từ daily data (365 ngày)
      const monthlyMap = {};
      for (let m = 1; m <= 12; m++) monthlyMap[m] = 0;
      (window.GymApp.data.revenueDaily || []).forEach(d => {
        const month = parseInt(d.ngay.split('-')[1]);
        monthlyMap[month] = (monthlyMap[month] || 0) + (d.tong_tien || 0);
      });
      const monthLabels = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
      const monthData = Object.values(monthlyMap).map(v => Math.round(v / 1_000_000));

      window.GymApp._activeChart = new Chart(ctxRev, {
        type: 'bar',
        data: {
          labels: monthLabels,
          datasets: [{
            label: 'Doanh thu',
            data: monthData,
            backgroundColor: 'rgba(29,147,54,0.15)',
            borderColor: '#1D9336',
            borderWidth: 2,
            borderRadius: 6,
            hoverBackgroundColor: 'rgba(29,147,54,0.3)',
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { 
              grid: { display: false }, 
              ticks: { color: document.documentElement.classList.contains('dark') ? '#a8b5a5' : '#3f4a3c', font: { size: 10 } } 
            },
            y: { 
              beginAtZero: true, 
              grid: { color: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.05)' : 'rgba(190,202,185,0.3)' }, 
              ticks: { color: document.documentElement.classList.contains('dark') ? '#a8b5a5' : '#3f4a3c', font: { size: 10 } } 
            }
          }
        }
      });
    }

    const ctxPkg = document.getElementById('chart-packages');
    if (ctxPkg && dbData.hoi_vien) {
      new Chart(ctxPkg, {
        type: 'doughnut',
        data: {
          labels: ['Còn hạn', 'Sắp hết hạn', 'Hết hạn', 'Chưa đăng ký'],
          datasets: [{
            data: [dbData.hoi_vien.con_han, dbData.hoi_vien.sap_het_han, dbData.hoi_vien.het_han, dbData.hoi_vien.chua_dang_ky],
            backgroundColor: ['#1D9336', '#f59e0b', '#ba1a1a', '#9ca3af'],
            borderWidth: 2, 
            borderColor: document.documentElement.classList.contains('dark') ? '#1c2028' : '#ffffff',
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { 
            legend: { 
              position: 'bottom', 
              labels: { 
                color: document.documentElement.classList.contains('dark') ? '#dde1e7' : '#181c20',
                font: { size: 11 }, 
                padding: 12 
              } 
            } 
          },
          cutout: '65%',
        }
      });
    }
  }
};
