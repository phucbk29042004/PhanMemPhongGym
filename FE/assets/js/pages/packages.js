window.GymApp.pages['packages'] = {
  render: function () {
    const packages = window.GymApp.data.packages || [];
    const total = packages.reduce((s, p) => s + (p.so_nguoi_dang_ky || 0), 0);

    return `
      <div class="flex flex-col gap-margin">

        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-standard">
          <div class="page-title-bar">
            <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Gói tập</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs">Quản lý các gói tập của phòng gym</p>
          </div>
          <button id="btn-add-pkg" class="btn-primary text-white px-loose py-compact rounded-xl font-bold flex items-center gap-compact">
            <span class="material-symbols-outlined text-sm">add</span>
            Thêm gói tập mới
          </button>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-loose">
          ${[
            { label: 'Tổng gói tập', value: packages.length, icon: 'card_membership', iconBg: 'icon-bg-green', color: 'text-brand-primary' },
            { label: 'Đang hoạt động', value: packages.filter(p => p.trang_thai === 'dang_ban' || p.trang_thai === 'active').length, icon: 'check_circle', iconBg: 'icon-bg-green', color: 'text-brand-primary' },
            { label: 'Tổng hội viên đăng ký', value: total, icon: 'groups', iconBg: 'icon-bg-orange', color: 'text-[#e65100]' },
          ].map(s => `
            <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm flex items-center gap-loose">
              <div class="icon-bg ${s.iconBg}" style="width:48px;height:48px;border-radius:14px">
                <span class="material-symbols-outlined ${s.color} text-2xl" style="font-variation-settings:'FILL' 1">${s.icon}</span>
              </div>
              <div>
                <p class="text-on-surface-variant text-body-sm font-bold">${s.label}</p>
                <p class="${s.color} font-display-lg text-display-lg font-bold">${s.value}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Cards gói tập -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-loose">
          ${packages.map(p => {
            const popularity = total > 0 ? Math.round(((p.so_nguoi_dang_ky || 0) / total) * 100) : 0;
            return `
              <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
                <!-- Header card -->
                <div class="p-loose text-white relative overflow-hidden" style="background: linear-gradient(135deg, #1D9336 0%, #157a2a 100%)">
                  <div class="absolute top-0 right-0 w-24 h-24 opacity-10" style="background: radial-gradient(circle, white 0%, transparent 70%); transform: translate(20%, -20%)"></div>
                  <div class="flex items-start justify-between relative">
                    <div>
                      <p class="font-bold text-body-sm opacity-80 uppercase tracking-wider">Gói tập</p>
                      <h3 class="font-display-2xl text-display-2xl font-bold mt-xs">${p.ten_goi}</h3>
                    </div>
                    <div class="icon-bg" style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.15)">
                      <span class="material-symbols-outlined text-white text-lg" style="font-variation-settings:'FILL' 1">card_membership</span>
                    </div>
                  </div>
                  <p class="font-display-lg text-display-lg font-bold mt-standard">${window.GymApp.formatCurrency(p.gia)}</p>
                  <p class="text-body-sm opacity-75 mt-xs">${p.so_thang} tháng ${p.so_ngay_them ? '+ ' + p.so_ngay_them + ' ngày' : ''}</p>
                </div>

                <!-- Body card -->
                <div class="p-loose flex flex-col gap-standard flex-1">
                  <p class="text-on-surface-variant text-body-sm">${p.mo_ta || 'Không có mô tả'}</p>

                  <!-- Popularity bar -->
                  <div>
                    <div class="flex items-center justify-between mb-xs">
                      <span class="text-on-surface-variant text-body-sm">Mức độ phổ biến</span>
                      <span class="text-brand-primary font-bold text-body-sm">${popularity}%</span>
                    </div>
                    <div class="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all" style="width:${popularity}%;background:linear-gradient(90deg,#1D9336,#6fde76)"></div>
                    </div>
                  </div>

                  <div class="flex items-center justify-between mt-auto pt-standard border-t border-outline-variant">
                    <div class="flex items-center gap-xs text-on-surface-variant">
                      <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">people</span>
                      <span class="text-body-sm font-bold">${p.so_nguoi_dang_ky || 0} hội viên</span>
                    </div>
                    ${window.GymApp.statusBadge('active')}
                  </div>
                </div>

                <!-- Footer card -->
                <div class="px-loose py-compact border-t border-outline-variant flex items-center justify-end gap-atom bg-surface-container-low">
                  <button class="material-symbols-outlined text-outline hover:text-brand-primary text-xl p-atom rounded-lg hover:bg-surface-container transition-colors" title="Xem chi tiết">visibility</button>
                  <button class="material-symbols-outlined text-outline hover:text-brand-primary text-xl p-atom rounded-lg hover:bg-surface-container transition-colors" title="Chỉnh sửa">edit</button>
                  <button class="material-symbols-outlined text-outline hover:text-error text-xl p-atom rounded-lg hover:bg-error-container transition-colors" title="Xóa">delete</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Bảng so sánh gói tập -->
        <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
          <div class="section-header px-loose py-standard border-b border-outline-variant flex items-center gap-compact">
            <div class="icon-bg icon-bg-green">
              <span class="material-symbols-outlined text-brand-primary text-lg" style="font-variation-settings:'FILL' 1">compare_arrows</span>
            </div>
            <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">So sánh gói tập</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse gym-table">
              <thead>
                <tr class="h-10">
                  <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Tên gói</th>
                  <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Giá</th>
                  <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Thời hạn</th>
                  <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Giá/ngày</th>
                  <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Hội viên</th>
                  <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                ${packages.map(p => `
                  <tr class="h-11 border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                    <td class="px-loose font-bold text-on-surface text-body-md">${p.ten_goi}</td>
                    <td class="px-loose text-brand-primary font-bold text-body-md">${window.GymApp.formatCurrency(p.gia)}</td>
                    <td class="px-loose text-on-surface-variant text-body-sm">${p.so_thang} tháng</td>
                    <td class="px-loose text-on-surface-variant text-body-sm">${window.GymApp.formatCurrency(Math.round(p.gia / (p.so_thang * 30)))}</td>
                    <td class="px-loose text-body-md font-bold text-on-surface">${p.so_nguoi_dang_ky || 0}</td>
                    <td class="px-loose">${window.GymApp.statusBadge('active')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },

  init: function () {
    document.getElementById('btn-add-pkg')?.addEventListener('click', () => {
      window.GymApp.toast('Tính năng thêm gói tập đang phát triển!', 'info');
    });
  }
};
