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
    const hasBranchData = !window.GymApp.selectedBranch
      || (dbData.hoi_vien?.tong || 0) > 0
      || (dbData.doanh_thu_hom_nay?.tong_tien || 0) > 0
      || (dbData.luot_vao_ra_hom_nay?.tong_luot || 0) > 0
      || (dbData.lich_tap_hom_nay?.tong || 0) > 0
      || (dbData.recent_checkins || []).length > 0
      || (dbData.top_hoi_vien || []).length > 0
      || (dbData.peak_hours || []).length > 0
      || (window.GymApp.data.revenueDaily || []).some(r => (r.tong_tien || 0) > 0 || (r.tong_don || 0) > 0)
      || (window.GymApp.data.packageStats || []).length > 0
      || (window.GymApp.data.ptPackageStats || []).length > 0;

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
      { label: 'Tổng hội viên', value: dbData.hoi_vien?.tong || 0, percent: formatPercent(dbData.percent_changes.hoi_vien), page: 'members-list' },
      { label: 'Check-in hôm nay', value: dbData.luot_vao_ra_hom_nay?.luot_vao || 0, percent: formatPercent(dbData.percent_changes.luot_vao), page: 'checkin' },
      { label: 'Doanh thu hôm nay', value: window.GymApp.formatCurrency(dbData.doanh_thu_hom_nay?.tong_tien || 0), percent: formatPercent(dbData.percent_changes.doanh_thu), page: 'revenue' },
      { label: 'Sắp hết hạn', value: dbData.hoi_vien?.sap_het_han || 0, percent: formatPercent(dbData.percent_changes.sap_het_han), page: 'expired' },
      { label: 'Buổi PT đã dạy', value: `${dbData.lich_tap_hom_nay?.da_tap || 0}/${dbData.lich_tap_hom_nay?.tong || 0}`, percent: `<span class="text-on-surface-variant font-medium text-body-sm ml-2">lượt hôm nay</span>`, page: 'pt-training' },
    ];

    const cardClass = "bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border-2 border-outline-variant/50 hover:-translate-y-1 hover:shadow-md transition-all duration-300";

    const branches = this._branches || [];
    const branchOptions = branches.map(b => `<option value="${b.ten}" ${this._selectedBranch === b.ten ? 'selected' : ''}>${b.ten}</option>`).join('');

    return `
      <div class="flex flex-col gap-3 animate-in fade-in duration-500 pb-6">

        <!-- Header -->
        <div class="flex items-center justify-between gap-3 px-1 flex-wrap">
          <div class="flex items-center gap-2 text-sm text-on-surface-variant font-medium">
             <span class="material-symbols-outlined text-[18px]">calendar_today</span>
             ${new Date().toLocaleDateString('vi-VN', { year:'numeric', month:'long', day:'numeric' })}
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <select id="dash-branch-filter" class="bg-white dark:bg-[#1e1e1e] text-on-surface border border-outline-variant text-body-sm font-bold rounded-xl px-4 py-2 outline-none cursor-pointer">
              <option value="">— Tất cả chi nhánh —</option>
              ${branchOptions}
            </select>
            <button id="btn-dashboard-refresh" class="flex items-center justify-center gap-xs px-4 py-2 rounded-xl border border-outline-variant bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-body-md font-bold shadow-sm active:scale-95 duration-200 cursor-pointer whitespace-nowrap">
               <span id="dashboard-refresh-icon" class="material-symbols-outlined text-base" style="transition:transform 0.6s ease">refresh</span>
               <span id="dashboard-refresh-text">Tải lại dữ liệu</span>
            </button>
          </div>
        </div>

        ${!hasBranchData ? `
          <div class="rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-3 flex items-center gap-3 text-on-surface-variant">
            <span class="material-symbols-outlined text-[20px] text-brand-primary">database_off</span>
            <p class="text-body-sm font-bold">Chi nhánh này chưa có dữ liệu.</p>
          </div>
        ` : ''}

        <!-- Layout Grid -->
        <div class="flex flex-col gap-3">

          <!-- 5 Stat Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            ${stats.map(c => `
              <div data-page="${c.page}" class="bg-brand-primary/5 dark:bg-brand-primary/10 rounded-2xl p-4 hover:scale-[1.02] active:scale-98 hover:shadow-md hover:bg-brand-primary/10 transition-all duration-300 border border-brand-primary/20 cursor-pointer">
                <p class="text-on-surface-variant text-body-sm font-bold uppercase tracking-wider mb-2">${c.label}</p>
                <div class="flex items-baseline flex-wrap gap-x-2 gap-y-1">
                  <h3 class="text-xl font-bold text-on-surface truncate max-w-full" title="${c.value}">${c.value}</h3>
                  ${c.percent}
                </div>
              </div>
            `).join('')}
          </div>
            
          <!-- Row 1: Doanh thu 12 tháng + Tình trạng hội viên -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
            
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

            <!-- Doughnut: Member Status -->
            <div class="${cardClass} p-4 flex flex-col justify-between" style="min-height: 310px;">
              <h3 class="text-sm font-bold text-on-surface mb-2">Tình trạng hội viên</h3>
              <div class="flex-1 flex items-center justify-center">
                <div style="height: 160px; width: 50%;">
                  <canvas id="chart-packages-pie"></canvas>
                </div>
                <div class="flex-1 flex flex-col justify-center gap-2 pl-4 text-xs">
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
                      <div class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full ${r.color}"></span>
                        <span class="${r.textColor} truncate w-14 sm:w-16">${r.label}</span>
                      </div>
                      <span class="font-bold text-on-surface">${pct}%</span>
                    </div>
                  `}).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- Row 2: Hội viên chăm chỉ + Check-in gần nhất + Tần suất Peak Hours -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
            
            <!-- Hội viên chăm chỉ nhất -->
            <div class="${cardClass} p-4 flex flex-col justify-between" style="min-height: 250px;">
              <h3 class="text-sm font-bold text-on-surface mb-3">Hội viên chăm chỉ nhất</h3>
              <div id="dash-top-members-container" class="flex-grow flex flex-col justify-between">
                 <p class="text-center text-on-surface-variant text-body-sm mt-10">Đang tải...</p>
              </div>
            </div>

            <!-- Check-in gần nhất -->
            <div class="${cardClass} p-4 flex flex-col justify-between" style="min-height: 250px;">
              <h3 class="text-sm font-bold text-on-surface mb-3">Check-in gần nhất</h3>
              <div id="dash-recent-checkins-container" class="flex-grow flex flex-col justify-between">
                <p class="text-center text-on-surface-variant text-body-sm mt-10">Đang tải...</p>
              </div>
            </div>

            <!-- Peak Hours Check-in -->
            <div class="${cardClass} p-4 flex flex-col justify-between" style="min-height: 250px;">
              <h3 class="text-sm font-bold text-on-surface mb-2">Giờ check-in cao điểm</h3>
              <div class="flex-1 flex items-center justify-center">
                <div style="height: 170px; width: 100%;">
                  <canvas id="chart-peak-hours"></canvas>
                </div>
              </div>
            </div>

          </div>

          <!-- Row 3: Doanh thu gói tập + Doanh thu gói PT + Hoạt động gần đây -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">

            <!-- Bar Chart: Revenue by Package -->
            <div class="${cardClass} p-4 flex flex-col justify-between" style="min-height: 350px;">
              <h3 class="text-sm font-bold text-on-surface mb-2">Doanh thu gói tập</h3>
              <div class="w-full" style="height: 130px;">
                <canvas id="chart-packages-bar"></canvas>
              </div>
              <div class="w-full overflow-y-auto pr-1 flex flex-col gap-1.5 mt-2 text-xs" style="max-height: 130px; scrollbar-width: thin; scrollbar-color: var(--outline-variant) transparent;">
                ${(function() {
                  const packageStats = d.packageStats || [];
                  return packageStats.map((p, idx) => {
                    const totalMoney = window.GymApp.formatCurrency(p.tong_tien);
                    const colors = ['bg-[#1D9336]', 'bg-[#34d399]', 'bg-[#60a5fa]', 'bg-[#f59e0b]', 'bg-[#ec4899]'];
                    const color = colors[idx] || 'bg-outline';
                    return `
                    <div class="flex flex-col gap-0.5 border-b border-outline-variant/10 pb-1 last:border-0 last:pb-0">
                      <div class="flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full ${color} flex-shrink-0"></span>
                        <span class="text-on-surface font-bold truncate w-24 sm:w-32 md:w-28 lg:w-32 xl:w-40" title="${p.ten_goi}">${p.ten_goi}</span>
                      </div>
                      <div class="flex justify-between items-center pl-2.5 text-on-surface-variant font-medium">
                        <span>${p.so_dang_ky} lượt</span>
                        <span class="font-bold text-brand-primary">${totalMoney}</span>
                      </div>
                    </div>
                    `;
                  }).join('') || '<p class="text-center text-on-surface-variant w-full">Chưa có dữ liệu</p>';
                })()}
              </div>
            </div>

            <!-- Bar Chart: Revenue by PT Package -->
            <div class="${cardClass} p-4 flex flex-col justify-between" style="min-height: 350px;">
              <h3 class="text-sm font-bold text-on-surface mb-2">Doanh thu gói PT</h3>
              <div class="w-full" style="height: 130px;">
                <canvas id="chart-packages-pt-bar"></canvas>
              </div>
              <div class="w-full overflow-y-auto pr-1 flex flex-col gap-1.5 mt-2 text-xs" style="max-height: 130px; scrollbar-width: thin; scrollbar-color: var(--outline-variant) transparent;">
                ${(function() {
                  const ptPackageStats = d.ptPackageStats || [];
                  return ptPackageStats.map((p, idx) => {
                    const totalMoney = window.GymApp.formatCurrency(p.tong_tien);
                    const colors = ['bg-[#8b5cf6]', 'bg-[#a78bfa]', 'bg-[#c4b5fd]', 'bg-[#ddd6fe]', 'bg-[#ede9fe]'];
                    const color = colors[idx] || 'bg-outline';
                    return `
                    <div class="flex flex-col gap-0.5 border-b border-outline-variant/10 pb-1 last:border-0 last:pb-0">
                      <div class="flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full ${color} flex-shrink-0"></span>
                        <span class="text-on-surface font-bold truncate w-24 sm:w-32 md:w-28 lg:w-32 xl:w-40" title="${p.ten_goi}">${p.ten_goi}</span>
                      </div>
                      <div class="flex justify-between items-center pl-2.5 text-on-surface-variant font-medium">
                        <span>${p.so_dang_ky} lượt</span>
                        <span class="font-bold text-brand-primary">${totalMoney}</span>
                      </div>
                    </div>
                    `;
                  }).join('') || '<p class="text-center text-on-surface-variant w-full">Chưa có dữ liệu</p>';
                })()}
              </div>
            </div>

            <!-- Hoạt động gần đây (Có phân trang) -->
            <div class="${cardClass} p-4 flex flex-col justify-between" style="min-height: 350px;">
              <h3 class="text-sm font-bold text-on-surface mb-3">Hoạt động gần đây</h3>
              <div id="dash-audit-logs-container" class="flex-grow flex flex-col justify-between">
                <p class="text-center text-on-surface-variant text-body-sm mt-10">Đang tải...</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    `;
  },

  _renderTopMembers: function () {
    const el = document.getElementById('dash-top-members-container');
    if (!el) return;

    const dbData = window.GymApp.data.stats || {};
    const list = dbData.top_hoi_vien || [];
    if (list.length === 0) {
      el.innerHTML = '<p class="text-center text-on-surface-variant text-body-sm mt-10">Chưa có dữ liệu tháng này</p>';
      return;
    }

    this._topMembersPage = this._topMembersPage || 1;
    const perPage = 5;
    const totalPages = Math.ceil(list.length / perPage);
    this._topMembersPage = Math.max(1, Math.min(this._topMembersPage, totalPages));
    const start = (this._topMembersPage - 1) * perPage;
    const paginated = list.slice(start, start + perPage);

    const maxVal = list[0]?.so_buoi_tap || 1;
    const itemsHtml = paginated.map((m, i) => {
      const wPercent = Math.max(10, (m.so_buoi_tap / maxVal) * 100);
      return `
        <div class="flex items-center justify-between text-body-sm py-1">
          <span class="text-on-surface font-medium truncate w-32" title="${m.ho_ten}">${m.ho_ten}</span>
          <div class="flex-1 mx-3 flex items-center">
            <div class="h-1.5 rounded-full bg-brand-primary/20 w-full">
              <div class="h-full rounded-full bg-brand-primary" style="width: ${wPercent}%"></div>
            </div>
          </div>
          <span class="text-on-surface-variant w-5 text-right font-bold">${m.so_buoi_tap}</span>
        </div>
      `;
    }).join('');

    const paginationHtml = totalPages > 1 ? `
      <div class="flex items-center justify-between pt-standard border-t border-outline-variant/30 mt-auto text-body-sm">
        <span class="text-on-surface-variant font-bold">Trang ${this._topMembersPage}/${totalPages}</span>
        <div class="flex gap-1">
          <button id="btn-topmembers-prev" ${this._topMembersPage === 1 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : 'style="cursor:pointer;"'} class="w-7 h-7 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-brand-primary/5 hover:text-brand-primary transition-all active:scale-95">
            <span class="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button id="btn-topmembers-next" ${this._topMembersPage === totalPages ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : 'style="cursor:pointer;"'} class="w-7 h-7 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-brand-primary/5 hover:text-brand-primary transition-all active:scale-95">
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    ` : '';

    el.innerHTML = `
      <div class="flex flex-col gap-compact flex-grow justify-between">
        <div class="flex flex-col gap-2">
          ${itemsHtml}
        </div>
        ${paginationHtml}
      </div>
    `;

    const prevBtn = document.getElementById('btn-topmembers-prev');
    const nextBtn = document.getElementById('btn-topmembers-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this._topMembersPage > 1) {
          this._topMembersPage--;
          this._renderTopMembers();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this._topMembersPage < totalPages) {
          this._topMembersPage++;
          this._renderTopMembers();
        }
      });
    }
  },

  _renderRecentCheckins: function () {
    const el = document.getElementById('dash-recent-checkins-container');
    if (!el) return;

    const dbData = window.GymApp.data.stats || {};
    const checkins = (dbData.recent_checkins || []).map(c => ({
      id: c.id,
      memberId: c.ma_ho_so,
      name: c.ho_ten,
      time: c.gio_hien_thi || c.thoi_diem.substring(11, 16),
      avatar: c.avatar_url
    }));

    if (checkins.length === 0) {
      el.innerHTML = '<p class="text-body-sm text-on-surface-variant text-center mt-10">Chưa có lượt vào</p>';
      return;
    }

    this._recentCheckinsPage = this._recentCheckinsPage || 1;
    const perPage = 5;
    const totalPages = Math.ceil(checkins.length / perPage);
    this._recentCheckinsPage = Math.max(1, Math.min(this._recentCheckinsPage, totalPages));
    const start = (this._recentCheckinsPage - 1) * perPage;
    const paginated = checkins.slice(start, start + perPage);

    const itemsHtml = paginated.map(c => `
      <div class="py-2 border-b border-outline-variant/10 last:border-b-0 flex flex-col items-center justify-center text-center">
        <span class="text-body-md font-bold text-on-surface">
          <a href="javascript:void(0)" onclick="window.GymApp.navigate('checkin')" class="hover:text-brand-primary transition-colors">${c.name}</a> đã vào tập
        </span>
        <span class="text-label-xs text-on-surface-variant mt-1">${c.time} hôm nay</span>
      </div>
    `).join('');

    const paginationHtml = totalPages > 1 ? `
      <div class="flex items-center justify-between pt-standard border-t border-outline-variant/30 mt-auto text-body-sm">
        <span class="text-on-surface-variant font-bold">Trang ${this._recentCheckinsPage}/${totalPages}</span>
        <div class="flex gap-1">
          <button id="btn-recent-prev" ${this._recentCheckinsPage === 1 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : 'style="cursor:pointer;"'} class="w-7 h-7 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-brand-primary/5 hover:text-brand-primary transition-all active:scale-95">
            <span class="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button id="btn-recent-next" ${this._recentCheckinsPage === totalPages ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : 'style="cursor:pointer;"'} class="w-7 h-7 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-brand-primary/5 hover:text-brand-primary transition-all active:scale-95">
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    ` : '';

    el.innerHTML = `
      <div class="flex flex-col justify-between flex-grow">
        <div class="flex flex-col gap-2 flex-grow my-1">
          ${itemsHtml}
        </div>
        ${paginationHtml}
      </div>
    `;

    const prevBtn = document.getElementById('btn-recent-prev');
    const nextBtn = document.getElementById('btn-recent-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this._recentCheckinsPage > 1) {
          this._recentCheckinsPage--;
          this._renderRecentCheckins();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this._recentCheckinsPage < totalPages) {
          this._recentCheckinsPage++;
          this._renderRecentCheckins();
        }
      });
    }
  },

  init: async function () {
    const self = this;
    this._topMembersPage = 1;
    this._recentCheckinsPage = 1;
    this._auditLogsPage = 1;
    this._controlsReady = false;
    this._selectedBranch = window.GymApp.selectedBranch || '';

    // Tải danh sách chi nhánh
    try {
      const bRes = await fetch('assets/data/branches.json').then(r => r.json());
      this._branches = bRes || [];
    } catch (e) {
      this._branches = [];
    }

    await self._fetchAndRender();

    // Lắng nghe sự kiện đổi chi nhánh
    document.getElementById('dash-branch-filter')?.addEventListener('change', async function() {
      self._selectedBranch = this.value;
      window.GymApp.selectedBranch = this.value;
      sessionStorage.setItem('selected_branch', this.value);
      await self._fetchAndRender();
      window.GymApp.toast('Đã lọc theo chi nhánh!', 'success');
    });

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

  _bindDashboardControls: function () {
    const self = this;
    document.getElementById('dash-branch-filter')?.addEventListener('change', async function() {
      self._selectedBranch = this.value;
      window.GymApp.selectedBranch = this.value;
      sessionStorage.setItem('selected_branch', this.value);
      await self._fetchAndRender();
      window.GymApp.toast('Đã lọc theo chi nhánh!', 'success');
    });

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

  _renderAuditLogs: function () {
    const el = document.getElementById('dash-audit-logs-container');
    if (!el) return;
    const logs = window.GymApp.data.auditLogs || [];
    if (logs.length === 0) {
      el.innerHTML = '<p class="text-center text-on-surface-variant text-body-sm mt-4">Không có hoạt động nào</p>';
      return;
    }

    // Lọc bỏ log system login, chỉ giữ hoạt động thật của người dùng
    const filteredLogs = logs.filter(log => !(log.ten_dang_nhap === 'system' && (log.hanh_dong || '').toUpperCase() === 'LOGIN'));

    if (filteredLogs.length === 0) {
      el.innerHTML = '<p class="text-center text-on-surface-variant text-body-sm mt-4">Không có hoạt động nào</p>';
      return;
    }

    this._auditLogsPage = this._auditLogsPage || 1;
    const perPage = 4;
    const totalPages = Math.ceil(filteredLogs.length / perPage);
    this._auditLogsPage = Math.max(1, Math.min(this._auditLogsPage, totalPages));
    const start = (this._auditLogsPage - 1) * perPage;
    const paginated = filteredLogs.slice(start, start + perPage);

    const itemsHtml = paginated.map(log => {
      let icon = 'history';
      let colorClass = 'text-brand-primary bg-brand-primary/10';
      const action = (log.hanh_dong || '').toLowerCase();
      
      if (action.includes('create') || action.includes('them')) { icon = 'add_circle'; colorClass = 'text-[#10b981] bg-[#10b981]/10'; }
      else if (action.includes('update') || action.includes('sua')) { icon = 'edit'; colorClass = 'text-[#3b82f6] bg-[#3b82f6]/10'; }
      else if (action.includes('delete') || action.includes('xoa')) { icon = 'delete'; colorClass = 'text-error bg-error/10'; }
      else if (action.includes('login')) { icon = 'login'; colorClass = 'text-[#8b5cf6] bg-[#8b5cf6]/10'; }

      const timeStr = window.GymApp.formatDate(log.thoi_diem) + ' ' + new Date(log.thoi_diem).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      
      // Ưu tiên ho_ten, fallback ten_dang_nhap, chỉ "Hệ thống" khi thực sự là system không có tên
      let userDisplay;
      if (log.ten_dang_nhap === 'system' && !log.ho_ten) {
        userDisplay = 'Hệ thống';
      } else {
        userDisplay = log.ho_ten || log.ten_dang_nhap || 'Hệ thống';
      }
      
      const doiTuongMap = {
        'tai_khoan': 'tài khoản',
        'ho_so': 'hồ sơ hội viên',
        'goi_tap': 'gói tập',
        'goi_pt': 'gói PT',
        'pt': 'huấn luyện viên',
        'lich_tap': 'lịch tập',
        'checkin': 'lượt ra vào',
        'cau_hinh': 'cấu hình',
        'thong_bao': 'thông báo',
        'doanh_thu': 'doanh thu',
        'system': 'hệ thống',
        'he_thong': 'hệ thống'
      };
      
      let objDisplay = doiTuongMap[(log.doi_tuong || '').toLowerCase()] || log.doi_tuong || 'dữ liệu';
      if (action === 'login') {
         objDisplay = 'hệ thống';
      }

      let actionText = log.hanh_dong;
      if (action === 'create') actionText = 'vừa thêm mới';
      if (action === 'update') actionText = 'vừa cập nhật';
      if (action === 'delete') actionText = 'vừa xóa';
      if (action === 'login') actionText = 'vừa đăng nhập vào';

      return `
        <div class="flex items-start gap-2.5 border-b border-outline-variant/30 pb-2.5 last:border-0 last:pb-0">
          <div class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}">
            <span class="material-symbols-outlined text-[15px]">${icon}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-body-sm text-on-surface truncate">
              <span class="font-bold">${userDisplay}</span> ${actionText} <span class="font-semibold">${objDisplay}</span>
            </p>
            <p class="text-label-sm text-on-surface-variant truncate mt-0.5" title="${log.ghi_chu || ''}">${log.ghi_chu || ''}</p>
            <p class="text-[10px] text-outline-variant font-medium mt-1">${timeStr}</p>
          </div>
        </div>
      `;
    }).join('');

    const paginationHtml = totalPages > 1 ? `
      <div class="flex items-center justify-between pt-standard border-t border-outline-variant/30 mt-auto text-body-sm">
        <span class="text-on-surface-variant font-bold">Trang ${this._auditLogsPage}/${totalPages}</span>
        <div class="flex gap-1">
          <button id="btn-audit-prev" ${this._auditLogsPage === 1 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : 'style="cursor:pointer;"'} class="w-7 h-7 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-brand-primary/5 hover:text-brand-primary transition-all active:scale-95">
            <span class="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button id="btn-audit-next" ${this._auditLogsPage === totalPages ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : 'style="cursor:pointer;"'} class="w-7 h-7 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-brand-primary/5 hover:text-brand-primary transition-all active:scale-95">
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    ` : '';

    el.innerHTML = `
      <div class="flex flex-col justify-between flex-grow">
        <div class="flex flex-col gap-2 flex-grow my-1">
          ${itemsHtml}
        </div>
        ${paginationHtml}
      </div>
    `;

    const prevBtn = document.getElementById('btn-audit-prev');
    const nextBtn = document.getElementById('btn-audit-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this._auditLogsPage > 1) {
          this._auditLogsPage--;
          this._renderAuditLogs();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this._auditLogsPage < totalPages) {
          this._auditLogsPage++;
          this._renderAuditLogs();
        }
      });
    }
  },

  _fetchAndRender: async function () {
    window.GymApp.data.stats = null;
    window.GymApp.data.revenueDaily = [];
    window.GymApp.data.packageStats = [];
    window.GymApp.data.ptPackageStats = [];
    window.GymApp.data.auditLogs = [];

    try {
      const q = this._selectedBranch ? `?chi_nhanh=${encodeURIComponent(this._selectedBranch)}` : '';
      const revQ = this._selectedBranch ? `&chi_nhanh=${encodeURIComponent(this._selectedBranch)}` : '';
      const auditQ = this._selectedBranch ? `&chi_nhanh=${encodeURIComponent(this._selectedBranch)}` : '';
      const [statsRes, revRes, auditRes] = await Promise.all([
        window.GymApp.api.get(`/revenue/dashboard${q}`),
        window.GymApp.api.get(`/revenue?days=365${revQ}`),
        window.GymApp.api.get(`/audit?limit=10${auditQ}`)
      ]);
      if (statsRes && statsRes.success) window.GymApp.data.stats = statsRes.data;
      if (revRes && revRes.success) {
        window.GymApp.data.revenueDaily = revRes.data.daily || [];
        window.GymApp.data.packageStats = revRes.data.packageStats || [];
        window.GymApp.data.ptPackageStats = revRes.data.ptPackageStats || [];
      }
      if (auditRes && auditRes.success) {
        window.GymApp.data.auditLogs = auditRes.data.logs || [];
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    }
    const contentArea = document.getElementById('content-area');
    if (contentArea && window.GymApp.currentPage === 'dashboard') {
      contentArea.innerHTML = this.render();
      this._renderTopMembers();
      this._renderRecentCheckins();
      this._renderAuditLogs();
      if (this._controlsReady) {
        this._bindDashboardControls();
      } else {
        this._controlsReady = true;
      }
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
      const monthLabels = ['Thg 1','Thg 2','Thg 3','Thg 4','Thg 5','Thg 6','Thg 7','Thg 8','Thg 9','Thg 10','Thg 11','Thg 12'];
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
              callbacks: { label: function(c) { return 'Doanh thu: ' + c.parsed.y + ' triệu'; } }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
            y: { 
              beginAtZero: true, 
              grid: { color: gridColor }, 
              ticks: { color: textColor, font: { size: 11 }, callback: function(v) { return v > 0 ? v + ' tr' : '0'; } } 
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
      const labels = topPkgs.map((p, idx) => 'Gói ' + (idx + 1));
      const data = topPkgs.map(p => p.tong_tien / 1_000_000);

      window.GymApp._activeChart2 = new Chart(ctxPkgBar, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: ['#1D9336', '#34d399', '#60a5fa', '#f59e0b', '#ec4899'],
            hoverBackgroundColor: ['#146a27', '#059669', '#2563eb', '#d97706', '#db2777'],
            borderRadius: 6,
            barThickness: 16
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

    // --- Bar Chart (PT Package Revenue) ---
    const ctxPtPkgBar = document.getElementById('chart-packages-pt-bar');
    if (ctxPtPkgBar) {
      const ptPkgStats = window.GymApp.data.ptPackageStats || [];
      const topPkgs = ptPkgStats.slice(0, 5);
      const labels = topPkgs.map((p, idx) => 'Gói PT ' + (idx + 1));
      const data = topPkgs.map(p => p.tong_tien / 1_000_000);

      window.GymApp._activeChart4 = new Chart(ctxPtPkgBar, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
            hoverBackgroundColor: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'],
            borderRadius: 6,
            barThickness: 16
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

    // --- Bar Chart (Peak Hours Check-in) ---
    const ctxPeak = document.getElementById('chart-peak-hours');
    if (ctxPeak) {
      const peakHoursData = dbData.peak_hours || [];
      const peakLabels = [];
      const peakCounts = [];
      for (let h = 6; h <= 21; h++) {
        const hStr = h.toString().padStart(2, '0');
        peakLabels.push(hStr + 'h');
        const found = peakHoursData.find(item => item.gio === hStr);
        peakCounts.push(found ? found.so_luot : 0);
      }

      window.GymApp._activeChart5 = new Chart(ctxPeak, {
        type: 'bar',
        data: {
          labels: peakLabels,
          datasets: [{
            label: 'Lượt check-in (30 ngày)',
            data: peakCounts,
            backgroundColor: '#1D9336b0',
            hoverBackgroundColor: '#1D9336',
            borderRadius: 4,
            barThickness: 8
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { 
            legend: { display: false },
            tooltip: {
              callbacks: { label: function(c) { return c.parsed.y + ' lượt vào'; } }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { size: 9 }, maxRotation: 0 } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 9 } } }
          }
        }
      });
    }
  },

  guideHtml: `
    <div class="space-y-4 text-xs">
      <div class="flex items-start gap-2 bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/10">
        <span class="material-symbols-outlined text-brand-primary text-base flex-shrink-0 mt-0.5">info</span>
        <p class="text-on-surface-variant leading-relaxed">Trang <strong>Tổng quan (Dashboard)</strong> cung cấp cái nhìn tổng thể về tình hình kinh doanh, số lượng hội viên và hoạt động vào-ra trong ngày của phòng tập.</p>
      </div>
      
      <div>
        <h4 class="font-bold text-on-surface mb-1">4 Chỉ số KPI hàng đầu:</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li><strong>Tổng hội viên:</strong> Toàn bộ số lượng hội viên đã đăng ký trong cơ sở dữ liệu.</li>
          <li><strong>Check-in hôm nay:</strong> Lượt quét mã QR/nhập thẻ vào tập thực tế ghi nhận trong ngày.</li>
          <li><strong>Doanh thu hôm nay:</strong> Doanh thu thực tế (đã thu tiền) phát sinh trong hôm nay.</li>
          <li><strong>Sắp hết hạn:</strong> Số lượng gói tập sẽ hết hạn trong vòng 7 ngày tới (cần chú ý gia hạn).</li>
        </ul>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">Phân tích biểu đồ & Tiện ích:</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li><strong>Doanh thu 12 tháng:</strong> Biểu đồ so sánh trực quan doanh thu tháng này so với tháng trước để theo dõi tốc độ tăng trưởng.</li>
          <li><strong>Hội viên chăm chỉ:</strong> Liệt kê danh sách top 5 hội viên có số buổi quét mã check-in đi tập nhiều nhất trong tháng hiện tại.</li>
          <li><strong>Doanh thu theo gói tập:</strong> Xếp hạng 5 gói tập đem lại doanh thu cao nhất cho phòng tập kèm biểu đồ tương ứng.</li>
          <li><strong>Tình trạng hội viên:</strong> Biểu đồ tròn thể hiện tỷ lệ hội viên còn hạn, sắp hết hạn, hết hạn và chưa mua gói.</li>
          <li><strong>Check-in gần nhất:</strong> Danh sách cập nhật thời gian thực các hội viên vừa vào tập.</li>
          <li><strong>Hoạt động gần đây:</strong> Nhật ký hoạt động của các nhân viên/admin hệ thống (tạo, sửa, xóa, đăng nhập).</li>
        </ul>
      </div>
    </div>
  `
};
