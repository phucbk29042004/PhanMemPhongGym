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

    const recentCheckins = (dbData.recent_checkins || []).map(c => ({
      id: c.id,
      memberId: c.ma_ho_so,
      name: c.ho_ten,
      time: new Date(c.thoi_diem).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      avatar: c.avatar_url
    }));

    return `
      <div class="flex flex-col gap-margin">

        <!-- Stat Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-loose">
          ${[
            { icon: 'people', label: 'Tổng hội viên', value: dbData.hoi_vien.tong, sub: `${dbData.hoi_vien.con_han} đang hoạt động`, color: 'text-brand-primary' },
            { icon: 'login', label: 'Check-in hôm nay', value: dbData.luot_vao_ra_hom_nay.luot_vao, sub: 'Lượt vào tập', color: 'text-[#006b20]' },
            { icon: 'warning', label: 'Sắp hết hạn', value: dbData.hoi_vien.sap_het_han, sub: 'Cần gia hạn sớm', color: 'text-[#e65100]' },
            { icon: 'payments', label: 'Doanh thu hôm nay', value: window.GymApp.formatCurrency(dbData.doanh_thu_hom_nay?.tong_tien || 0), sub: 'Tiền thu thực tế', color: 'text-brand-primary' },
          ].map(c => `
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-loose flex flex-col gap-sm shadow-sm">
              <div class="flex items-center justify-between">
                <span class="text-on-surface-variant font-body-sm text-body-sm uppercase tracking-wider font-bold">${c.label}</span>
                <span class="material-symbols-outlined ${c.color} text-xl">${c.icon}</span>
              </div>
              <span class="${c.color} font-display-lg text-display-lg font-bold">${c.value}</span>
              <span class="text-on-surface-variant font-body-sm text-body-sm">${c.sub}</span>
            </div>
          `).join('')}
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-loose">

          <!-- Biểu đồ doanh thu theo tháng -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-loose shadow-sm">
            <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface mb-standard">Doanh thu theo tháng (triệu VNĐ)</h3>
            <div style="height:220px">
              <canvas id="chart-revenue"></canvas>
            </div>
          </div>

          <!-- Biểu đồ gói tập -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-loose shadow-sm">
            <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface mb-standard">Phân bố gói tập</h3>
            <div style="height:220px">
              <canvas id="chart-packages"></canvas>
            </div>
          </div>
        </div>

        <!-- Bottom Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-loose">

          <!-- Check-in gần nhất -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div class="px-loose py-standard border-b border-outline-variant flex items-center justify-between">
              <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Check-in gần nhất</h3>
              <button class="text-brand-primary font-body-sm text-body-sm hover:underline" data-page="checkin">Xem tất cả</button>
            </div>
            <div class="divide-y divide-outline-variant">
              ${recentCheckins.map(c => `
                <div class="flex items-center gap-compact px-loose py-compact">
                  ${window.GymApp.avatarImg(c.avatar, c.name, 'sm')}
                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-on-surface text-body-md truncate">${c.name}</p>
                    <p class="text-on-surface-variant text-body-sm">${c.memberId}</p>
                  </div>
                  <span class="text-on-surface-variant text-body-sm flex-shrink-0">${c.time}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Phân bổ trạng thái -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div class="px-loose py-standard border-b border-outline-variant flex items-center justify-between">
              <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Tình trạng hội viên</h3>
              <button class="text-brand-primary font-body-sm text-body-sm hover:underline" data-page="members-list">Chi tiết</button>
            </div>
            <div class="divide-y divide-outline-variant">
              <div class="flex items-center justify-between px-loose py-compact">
                 <span class="text-on-surface text-body-md">Đang hoạt động (Còn hạn)</span>
                 <span class="font-bold text-brand-primary">${dbData.hoi_vien.con_han}</span>
              </div>
              <div class="flex items-center justify-between px-loose py-compact">
                 <span class="text-on-surface text-body-md">Sắp hết hạn (7 ngày)</span>
                 <span class="font-bold text-[#e65100]">${dbData.hoi_vien.sap_het_han}</span>
              </div>
              <div class="flex items-center justify-between px-loose py-compact">
                 <span class="text-on-surface text-body-md">Đã hết hạn tập</span>
                 <span class="font-bold text-error">${dbData.hoi_vien.het_han}</span>
              </div>
              <div class="flex items-center justify-between px-loose py-compact">
                 <span class="text-on-surface text-body-md">Chưa đăng ký gói</span>
                 <span class="font-bold text-on-surface-variant">${dbData.hoi_vien.chua_dang_ky}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-loose">
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-loose shadow-sm flex items-center gap-loose">
                <div class="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center">
                    <span class="material-symbols-outlined text-white">sports_gymnastics</span>
                </div>
                <div>
                    <p class="text-on-surface-variant text-body-sm">Tổng số huấn luyện viên (PT)</p>
                    <p class="text-2xl font-bold text-on-surface">${dbData.tong_pt}</p>
                </div>
            </div>
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-loose shadow-sm flex items-center gap-loose">
                <div class="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center">
                    <span class="material-symbols-outlined text-secondary">calendar_today</span>
                </div>
                <div>
                    <p class="text-on-surface-variant text-body-sm">Lịch tập hôm nay</p>
                    <p class="text-2xl font-bold text-on-surface">${dbData.lich_tap_hom_nay.tong} <span class="text-sm font-normal text-on-surface-variant">(${dbData.lich_tap_hom_nay.da_tap} đã hoàn thành)</span></p>
                </div>
            </div>
        </div>

      </div>
    `;
  },

  init: async function () {
    try {
      const res = await window.GymApp.api.get('/revenue/dashboard');
      if (res && res.success) {
        window.GymApp.data.stats = res.data;
        // Re-render to update stats
        const contentArea = document.getElementById('content-area');
        if (contentArea && window.GymApp.currentPage === 'dashboard') {
            contentArea.innerHTML = this.render();
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    }

    const dbData = window.GymApp.data.stats;
    if (!dbData) return;

    // Chart doanh thu
    const ctxRev = document.getElementById('chart-revenue');
    if (ctxRev) {
      window.GymApp._activeChart = new Chart(ctxRev, {
        type: 'bar',
        data: {
          labels: ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'],
          datasets: [{
            label: 'Doanh thu',
            data: [12, 18, 21, 17, 23, 26, 19, 28, 31, 27, 32, 29],
            backgroundColor: '#1D933620', borderColor: '#1D9336', borderWidth: 2, borderRadius: 4,
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
    }

    // Chart gói tập (Dùng dữ liệu revenue để vẽ nếu cần, tạm thời ẩn hoặc vẽ từ packageStats)
    const ctxPkg = document.getElementById('chart-packages');
    if (ctxPkg && dbData.hoi_vien) {
      new Chart(ctxPkg, {
        type: 'doughnut',
        data: {
          labels: ['Còn hạn', 'Sắp hết hạn', 'Hết hạn', 'Chưa gói'],
          datasets: [{
            data: [dbData.hoi_vien.con_han, dbData.hoi_vien.sap_het_han, dbData.hoi_vien.het_han, dbData.hoi_vien.chua_dang_ky],
            backgroundColor: ['#1D9336', '#f59e0b', '#ba1a1a', '#575f67'],
            borderWidth: 2, borderColor: '#f7f9ff',
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }
};
