window.GymApp.pages['packages'] = {
  render: function () {
    const packages = window.GymApp.data.packages || [];
    const total = packages.reduce((s, p) => s + (p.so_nguoi_dang_ky || 0), 0);

    return `
      <div class="flex flex-col gap-margin">

        <!-- Action Bar -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-standard">
          <div>
            <h2 class="font-display-2xl text-display-2xl text-on-surface font-bold">Danh sách gói tập</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm">Quản lý các gói tập của phòng gym</p>
          </div>
          <button id="btn-add-pkg" class="bg-brand-primary text-white px-loose py-compact rounded-lg font-bold hover:bg-[#187a2d] flex items-center gap-compact shadow-sm">
            <span class="material-symbols-outlined text-sm">add</span>
            Thêm gói tập mới
          </button>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-loose">
          ${[
            { label: 'Tổng gói tập', value: packages.length, color: 'text-brand-primary' },
            { label: 'Đang hoạt động', value: packages.filter(p => p.trang_thai === 'dang_ban' || p.trang_thai === 'active').length, color: 'text-brand-primary' },
            { label: 'Tổng hội viên đăng ký', value: total, color: 'text-brand-primary' },
          ].map(s => `
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-loose shadow-sm flex flex-col gap-atom">
              <span class="text-on-surface-variant font-body-sm text-body-sm uppercase tracking-wider font-bold">${s.label}</span>
              <span class="${s.color} font-display-2xl text-display-2xl font-bold">${s.value}</span>
            </div>
          `).join('')}
        </div>

        <!-- Cards gói tập -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-loose">
          ${packages.map(p => {
            const popularity = total > 0 ? Math.round(((p.so_nguoi_dang_ky || 0) / total) * 100) : 0;
            return `
              <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <!-- Header card -->
                <div class="bg-brand-primary p-loose text-white">
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="font-bold text-body-md opacity-80">Gói tập</p>
                      <h3 class="font-display-2xl text-display-2xl font-bold">${p.ten_goi}</h3>
                    </div>
                    <span class="material-symbols-outlined text-2xl opacity-80">card_membership</span>
                  </div>
                  <p class="text-2xl font-bold mt-standard">${window.GymApp.formatCurrency(p.gia)}</p>
                  <p class="text-body-sm opacity-75 mt-xs">${p.so_thang} tháng ${p.so_ngay_them ? '+ ' + p.so_ngay_them + ' ngày' : ''}</p>
                </div>

                <!-- Body card -->
                <div class="p-loose flex flex-col gap-standard">
                  <p class="text-on-surface-variant text-body-sm">${p.mo_ta || 'Không có mô tả'}</p>

                  <!-- Popularity bar -->
                  <div>
                    <div class="flex items-center justify-between mb-xs">
                      <span class="text-on-surface-variant text-body-sm">Mức độ phổ biến</span>
                      <span class="text-brand-primary font-bold text-body-sm">${popularity}%</span>
                    </div>
                    <div class="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div class="h-full bg-brand-primary rounded-full transition-all" style="width:${popularity}%"></div>
                    </div>
                  </div>

                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-xs text-on-surface-variant">
                      <span class="material-symbols-outlined text-sm">people</span>
                      <span class="text-body-sm">${p.so_nguoi_dang_ky || 0} hội viên</span>
                    </div>
                    ${window.GymApp.statusBadge('active')}
                  </div>
                </div>

                <!-- Footer card -->
                <div class="px-loose py-compact border-t border-outline-variant flex items-center justify-end gap-atom">
                  <button class="material-symbols-outlined text-outline hover:text-brand-primary text-xl p-atom rounded hover:bg-surface-container transition-colors" title="Xem chi tiết">visibility</button>
                  <button class="material-symbols-outlined text-outline hover:text-brand-primary text-xl p-atom rounded hover:bg-surface-container transition-colors" title="Chỉnh sửa">edit</button>
                  <button class="material-symbols-outlined text-outline hover:text-error text-xl p-atom rounded hover:bg-error-container transition-colors" title="Xóa">delete</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Bảng so sánh gói tập -->
        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div class="px-loose py-standard border-b border-outline-variant">
            <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">So sánh gói tập</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead class="bg-surface-container-high">
                <tr class="h-10">
                  <th class="px-loose font-bold text-body-md">Tên gói</th>
                  <th class="px-loose font-bold text-body-md">Giá</th>
                  <th class="px-loose font-bold text-body-md">Thời hạn</th>
                  <th class="px-loose font-bold text-body-md">Giá/ngày</th>
                  <th class="px-loose font-bold text-body-md">Hội viên</th>
                  <th class="px-loose font-bold text-body-md">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                ${packages.map(p => `
                  <tr class="h-11 border-b border-outline-variant hover:bg-surface-container-low">
                    <td class="px-loose font-bold text-on-surface text-body-md">${p.ten_goi}</td>
                    <td class="px-loose text-brand-primary font-bold text-body-md">${window.GymApp.formatCurrency(p.gia)}</td>
                    <td class="px-loose text-on-surface-variant text-body-sm">${p.so_thang} tháng</td>
                    <td class="px-loose text-on-surface-variant text-body-sm">${window.GymApp.formatCurrency(Math.round(p.gia / (p.so_thang * 30)))}</td>
                    <td class="px-loose text-body-md">${p.so_nguoi_dang_ky || 0}</td>
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
