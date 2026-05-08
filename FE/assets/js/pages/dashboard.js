window.GymApp.pages['dashboard'] = {
  render: function () {
    const d = window.GymApp.data;
    const totalMembers = d.members.length;
    const activeMembers = d.members.filter(m => m.status === 'active').length;
    const expiredMembers = d.members.filter(m => m.status === 'expired').length;
    const todayCheckins = d.checkins.length;
    const totalRevenue = d.packages.reduce((s, p) => s + p.price * p.members, 0);

    const recentCheckins = d.checkins.slice(0, 5);
    const expiringSoon = d.members.filter(m => {
      const exp = new Date(m.expireDate);
      const now = new Date();
      const diff = (exp - now) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30 && m.status === 'active';
    });

    return `
      <div class="flex flex-col gap-margin">

        <!-- Stat Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-loose">
          ${[
            { icon: 'people', label: 'Tổng hội viên', value: totalMembers, sub: `${activeMembers} đang hoạt động`, color: 'text-brand-primary' },
            { icon: 'login', label: 'Check-in hôm nay', value: todayCheckins, sub: 'Lượt vào tập', color: 'text-[#006b20]' },
            { icon: 'warning', label: 'Sắp hết hạn', value: expiringSoon.length, sub: 'Trong 30 ngày tới', color: 'text-[#e65100]' },
            { icon: 'cancel', label: 'Hết hạn', value: expiredMembers, sub: 'Cần gia hạn', color: 'text-error' },
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

          <!-- Sắp hết hạn -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div class="px-loose py-standard border-b border-outline-variant flex items-center justify-between">
              <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Sắp hết hạn (30 ngày)</h3>
              <button class="text-brand-primary font-body-sm text-body-sm hover:underline" data-page="expired">Xem tất cả</button>
            </div>
            <div class="divide-y divide-outline-variant">
              ${expiringSoon.length === 0
                ? `<div class="px-loose py-margin text-center text-on-surface-variant text-body-sm">Không có hội viên sắp hết hạn</div>`
                : expiringSoon.slice(0, 5).map(m => {
                    const daysLeft = Math.ceil((new Date(m.expireDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return `
                      <div class="flex items-center gap-compact px-loose py-compact">
                        ${window.GymApp.avatarImg(m.avatar, m.name, 'sm')}
                        <div class="flex-1 min-w-0">
                          <p class="font-bold text-on-surface text-body-md truncate">${m.name}</p>
                          <p class="text-on-surface-variant text-body-sm">${m.package}</p>
                        </div>
                        <span class="text-[#e65100] text-body-sm font-bold flex-shrink-0">${daysLeft} ngày</span>
                      </div>
                    `;
                  }).join('')
              }
            </div>
          </div>
        </div>

        <!-- Gói tập thống kê -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-loose">
          ${window.GymApp.data.packages.filter(p => p.status === 'active').map(p => `
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-loose shadow-sm">
              <div class="flex items-start justify-between gap-compact">
                <div>
                  <p class="font-bold text-on-surface text-body-md">${p.name}</p>
                  <p class="text-brand-primary font-display-2xl text-display-2xl font-bold mt-xs">${window.GymApp.formatCurrency(p.price)}</p>
                </div>
                <span class="material-symbols-outlined text-brand-primary">card_membership</span>
              </div>
              <div class="flex items-center gap-xs mt-standard">
                <span class="material-symbols-outlined text-sm text-on-surface-variant">people</span>
                <span class="text-on-surface-variant text-body-sm">${p.members} hội viên</span>
              </div>
            </div>
          `).join('')}
        </div>

      </div>
    `;
  },

  init: function () {
    const revData = window.GymApp.data.revenue;

    // Chart doanh thu
    const ctxRev = document.getElementById('chart-revenue');
    if (ctxRev) {
      window.GymApp._activeChart = new Chart(ctxRev, {
        type: 'bar',
        data: {
          labels: ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'],
          datasets: [{
            label: 'Doanh thu (tr.)',
            data: revData.monthly,
            backgroundColor: '#1D933620',
            borderColor: '#1D9336',
            borderWidth: 2,
            borderRadius: 4,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#becab940' }, ticks: { font: { size: 11 } } },
            x: { grid: { display: false }, ticks: { font: { size: 11 } } }
          }
        }
      });
    }

    // Chart gói tập
    const ctxPkg = document.getElementById('chart-packages');
    if (ctxPkg) {
      const pkg = revData.packageStats;
      new Chart(ctxPkg, {
        type: 'doughnut',
        data: {
          labels: pkg.map(p => p.name),
          datasets: [{
            data: pkg.map(p => p.count),
            backgroundColor: ['#1D9336','#03872c','#006b20','#a52d59','#575f67'],
            borderWidth: 2,
            borderColor: '#f7f9ff',
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { font: { size: 11 }, padding: 12 } }
          }
        }
      });
    }
  }
};
