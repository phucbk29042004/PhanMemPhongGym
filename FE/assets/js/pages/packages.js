window.GymApp.pages['packages'] = {
  activeTab: 'gym',

  render: function () {
    const self = this;
    const gymPackages = window.GymApp.data.packages || [];
    const ptPackages = window.GymApp.data.ptPackages || [];

    // Calculate total gym registrations and pt registrations
    const totalGymReg = gymPackages.reduce((s, p) => s + (p.so_nguoi_dang_ky || 0), 0);
    const totalPtReg = ptPackages.reduce((s, p) => s + (p.so_nguoi_dang_ky || 0), 0);

    // Active items count
    const activeGymCount = gymPackages.filter(p => !p.is_deleted).length;
    const activePtCount = ptPackages.filter(p => !p.is_deleted).length;

    // Find most popular packages
    const getPopularPkgName = (list) => {
      if (!list || list.length === 0) return 'Chưa có';
      const sorted = [...list].sort((a, b) => (b.so_nguoi_dang_ky || 0) - (a.so_nguoi_dang_ky || 0));
      const top = sorted[0];
      if (!top || (top.so_nguoi_dang_ky || 0) === 0) return 'Chưa có';
      return `${top.ten_goi} (${top.so_nguoi_dang_ky} HV)`;
    };

    const popularGym = getPopularPkgName(gymPackages);
    const popularPt = getPopularPkgName(ptPackages);

    // Stats configuration based on active tab
    let stats = [];
    if (self.activeTab === 'gym') {
      stats = [
        { label: 'Tổng số gói Gym', value: gymPackages.length, icon: 'card_membership', iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20', color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Đang hoạt động', value: activeGymCount, icon: 'check_circle', iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20', color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Tổng hội viên tập Gym', value: totalGymReg, icon: 'groups', iconBg: 'bg-orange-500/10 dark:bg-orange-500/20', color: 'text-orange-600 dark:text-orange-400' },
        { label: 'Gói Gym phổ biến nhất', value: popularGym, icon: 'trending_up', iconBg: 'bg-blue-500/10 dark:bg-blue-500/20', color: 'text-blue-600 dark:text-blue-400', isText: true }
      ];
    } else {
      stats = [
        { label: 'Tổng số gói PT', value: ptPackages.length, icon: 'sports_gymnastics', iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20', color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Đang hoạt động', value: activePtCount, icon: 'check_circle', iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20', color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Tổng hội viên tập PT', value: totalPtReg, icon: 'groups', iconBg: 'bg-orange-500/10 dark:bg-orange-500/20', color: 'text-orange-600 dark:text-orange-400' },
        { label: 'Gói PT phổ biến nhất', value: popularPt, icon: 'trending_up', iconBg: 'bg-pink-500/10 dark:bg-pink-500/20', color: 'text-pink-600 dark:text-pink-400', isText: true }
      ];
    }

    const currentPackages = self.activeTab === 'gym' ? gymPackages : ptPackages;
    const currentTotalReg = self.activeTab === 'gym' ? totalGymReg : totalPtReg;

    return `
      <div class="flex flex-col gap-margin">
      <div class="flex flex-wrap items-center border-b border-outline-variant/30 pb-2 gap-3">
  <button id="tab-gym" class="relative pb-2 px-3 text-body-md font-bold transition-all focus:outline-none flex items-center gap-compact ${self.activeTab === 'gym' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-on-surface-variant hover:text-on-surface'}">
    <span class="material-symbols-outlined text-[18px]">fitness_center</span>
    <span class="hidden xs:inline">Gói tập Gym</span>
    <span class="xs:hidden">Gym</span>
    <span class="px-1.5 py-0.5 rounded-full text-xs font-bold ${self.activeTab === 'gym' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-surface-container-high text-on-surface-variant'}">${gymPackages.length}</span>
  </button>

  <button id="tab-pt" class="relative pb-2 px-3 text-body-md font-bold transition-all focus:outline-none flex items-center gap-compact ${self.activeTab === 'pt' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-on-surface-variant hover:text-on-surface'}">
    <span class="material-symbols-outlined text-[18px]">sports_gymnastics</span>
    <span class="hidden xs:inline">Gói dịch vụ PT</span>
    <span class="xs:hidden">PT</span>
    <span class="px-1.5 py-0.5 rounded-full text-xs font-bold ${self.activeTab === 'pt' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-surface-container-high text-on-surface-variant'}">${ptPackages.length}</span>
  </button>

  <div class="ml-auto">
    <button id="btn-add-pkg" class="btn-primary text-white px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95 text-sm">
      <span class="material-symbols-outlined text-sm">add</span>
      <span class="hidden sm:inline">Thêm gói mới</span>
      <span class="sm:hidden">Thêm</span>
    </button>
  </div>
</div>

        <!-- Stats Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-loose">
          ${stats.map(s => `
            <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-standard shadow-sm flex items-center gap-loose hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center ${s.iconBg} flex-shrink-0">
                <span class="material-symbols-outlined ${s.color} text-2xl" style="font-variation-settings:'FILL' 1">${s.icon}</span>
              </div>
              <div class="overflow-hidden w-full">
                <p class="text-on-surface-variant text-body-sm font-bold uppercase tracking-wider">${s.label}</p>
                <p class="${s.color} ${s.isText ? 'text-body-md truncate font-extrabold' : 'text-3xl font-extrabold tracking-tight'} mt-0.5" title="${s.value}">
                  ${s.value}
                </p>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Empty state or Package Grid (Horizontal scroll style) -->
        ${currentPackages.length === 0 ? `
          <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-12 text-center flex flex-col items-center justify-center">
            <div class="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-loose">
              <span class="material-symbols-outlined text-outline text-3xl">sentiment_dissatisfied</span>
            </div>
            <h3 class="text-on-surface text-body-lg font-bold">Chưa có gói tập nào</h3>
            <p class="text-on-surface-variant text-body-sm mt-xs">Hãy nhấn nút "Thêm gói mới" ở góc phải để tạo gói tập đầu tiên.</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            ${currentPackages.map(p => {
              const popularity = currentTotalReg > 0 ? Math.round(((p.so_nguoi_dang_ky || 0) / currentTotalReg) * 100) : 0;
              const isGym = self.activeTab === 'gym';
              
              const themeColor = isGym 
                ? (document.documentElement.classList.contains('dark') ? '#4ade80' : '#1D9336') 
                : (document.documentElement.classList.contains('dark') ? '#34d399' : '#047857');
              const badgeBgClass = isGym
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
              
              // Details string
              let detailsStr = '';
              if (isGym) {
                detailsStr = `${p.so_thang} tháng ${p.so_ngay_them ? `+ ${p.so_ngay_them} ngày` : ''}`;
              } else {
                if (p.loai_goi === 'theo_buoi') {
                  detailsStr = `${p.so_buoi} buổi`;
                } else {
                  detailsStr = `${p.so_thang} tháng`;
                }
              }

              return `
                <div class="group relative rounded-xl overflow-hidden flex flex-col gap-2 p-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 bg-white dark:bg-[#1e1e1e] border border-outline-variant/60 w-full">

                  <!-- Header Section: Title & Actions -->
                  <div class="flex items-center justify-between gap-2">
                    <h3 class="font-bold text-on-surface text-body-sm truncate max-w-[70%]" title="${p.ten_goi}">${p.ten_goi}</h3>
                    <div class="flex items-center gap-0.5">
                      <button class="material-symbols-outlined text-outline hover:text-brand-primary text-base p-1 rounded-lg hover:bg-brand-primary/10 transition-colors btn-edit-pkg" data-id="${p.id}" data-type="${isGym ? 'gym' : 'pt'}" title="Chỉnh sửa">edit</button>
                      ${window.GymApp.auth.user?.vai_tro === 'admin' ? `
                        <button class="material-symbols-outlined text-outline hover:text-error text-base p-1 rounded-lg hover:bg-error/10 transition-colors btn-del-pkg" data-id="${p.id}" data-type="${isGym ? 'gym' : 'pt'}" data-name="${p.ten_goi}" data-count="${p.so_nguoi_dang_ky || 0}" title="Xóa">delete</button>
                      ` : ''}
                    </div>
                  </div>

                  <!-- Price & Duration Row -->
                  <div class="flex items-baseline justify-between gap-2">
                    <span class="text-base font-extrabold" style="color: ${themeColor}">${window.GymApp.formatCurrency(p.gia)}</span>
                    <span class="text-[11px] font-bold text-on-surface-variant">${detailsStr}</span>
                  </div>

                  <!-- Badges (Type & Status) -->
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full ${badgeBgClass}">
                      ${isGym ? 'Gym' : (p.loai_goi === 'theo_buoi' ? 'PT Buổi' : 'PT Tháng')}
                    </span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Đang bán</span>
                  </div>

                  <!-- Description (Compact) -->
                  <div class="text-[11px] text-on-surface-variant/80 truncate" title="${p.mo_ta || 'Không có mô tả'}">
                    ${p.mo_ta || 'Không có mô tả chi tiết.'}
                  </div>

                  <!-- Stats Row (HV & Popularity) -->
                  <div class="flex items-center justify-between text-[11px] pt-1.5 border-t border-outline-variant/30 mt-auto">
                    <div class="flex items-center gap-xs font-bold text-on-surface-variant">
                      <span class="material-symbols-outlined text-[14px]">groups</span>
                      <span>${p.so_nguoi_dang_ky || 0} HV đang tập</span>
                    </div>
                    <div class="flex items-center gap-0.5 font-extrabold" style="color: ${themeColor}">
                      <span class="material-symbols-outlined text-[14px]">trending_up</span>
                      <span>${popularity}%</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}

        <!-- Comparison Table -->
        ${currentPackages.length === 0 ? '' : `
          <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-sm overflow-hidden mt-2">
            <div class="section-header px-loose py-3 border-b border-outline-variant/50 flex items-center gap-compact bg-surface-container-low/20">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center bg-brand-primary/10 text-brand-primary">
                <span class="material-symbols-outlined text-[18px]">compare_arrows</span>
              </div>
              <h3 class="font-extrabold text-on-surface text-body-md">So sánh bảng giá & hiệu quả</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="h-10 border-b border-outline-variant/50 bg-surface-container-low/10">
                    <th class="px-loose font-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">Tên gói</th>
                    <th class="px-loose font-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">Đơn giá</th>
                    <th class="px-loose font-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">Thời lượng / Số lượng</th>
                    <th class="px-loose font-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">Tính trung bình</th>
                    <th class="px-loose font-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs text-center">Hội viên đăng ký</th>
                    <th class="px-loose font-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  ${currentPackages.map(p => {
                    const isGym = self.activeTab === 'gym';
                    let rateStr = '';
                    let durationStr = '';
                    
                    if (isGym) {
                      durationStr = `${p.so_thang} tháng ${p.so_ngay_them ? `+ ${p.so_ngay_them} ngày` : ''}`;
                      const totalDays = (p.so_thang * 30) + (p.so_ngay_them || 0);
                      const dailyRate = totalDays > 0 ? Math.round(p.gia / totalDays) : 0;
                      rateStr = `${window.GymApp.formatCurrency(dailyRate)} / ngày`;
                    } else {
                      if (p.loai_goi === 'theo_buoi') {
                        durationStr = `${p.so_buoi} buổi tập`;
                        const rate = p.so_buoi > 0 ? Math.round(p.gia / p.so_buoi) : 0;
                        rateStr = `${window.GymApp.formatCurrency(rate)} / buổi`;
                      } else {
                        durationStr = `${p.so_thang} tháng`;
                        const rate = p.so_thang > 0 ? Math.round(p.gia / p.so_thang) : 0;
                        rateStr = `${window.GymApp.formatCurrency(rate)} / tháng`;
                      }
                    }

                    return `
                      <tr class="h-10 border-b border-outline-variant/30 hover:bg-surface-container-high/40 transition-colors">
                        <td class="px-loose font-bold text-on-surface text-body-md">${p.ten_goi}</td>
                        <td class="px-loose font-extrabold text-body-md" style="color: ${isGym ? '#1D9336' : '#047857'}">${window.GymApp.formatCurrency(p.gia)}</td>
                        <td class="px-loose text-on-surface-variant text-body-sm font-bold">${durationStr}</td>
                        <td class="px-loose text-on-surface-variant text-body-sm font-extrabold">${rateStr}</td>
                        <td class="px-loose text-body-md font-bold text-on-surface text-center">${p.so_nguoi_dang_ky || 0}</td>
                        <td class="px-loose">
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Đang hoạt động</span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `}
      </div>
    `;
  },

  init: function () {
    const self = this;

    // Tabs switcher
    document.getElementById('tab-gym')?.addEventListener('click', () => {
      self.activeTab = 'gym';
      self._refreshView();
    });
    document.getElementById('tab-pt')?.addEventListener('click', () => {
      self.activeTab = 'pt';
      self._refreshView();
    });

    // Add package button
    document.getElementById('btn-add-pkg')?.addEventListener('click', () => self._openModal(null));

    // Edit package buttons
    document.querySelectorAll('.btn-edit-pkg').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const type = btn.dataset.type;
        const list = type === 'pt' ? (window.GymApp.data.ptPackages || []) : (window.GymApp.data.packages || []);
        const pkg = list.find(p => p.id == id);
        if (pkg) self._openModal(pkg);
      });
    });

    // Delete package buttons
    document.querySelectorAll('.btn-del-pkg').forEach(btn => {
      btn.addEventListener('click', () => {
        self._confirmDelete(
          btn.dataset.id,
          btn.dataset.name,
          parseInt(btn.dataset.count || 0),
          btn.dataset.type
        );
      });
    });
  },

  _refreshView: function () {
    const content = document.getElementById('content-area');
    if (content) {
      content.innerHTML = this.render();
      this.init();
    }
  },

  _openModal: function (pkg) {
    const self = this;
    const isEdit = !!pkg;
    document.getElementById('gym-pkg-modal')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'gym-pkg-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);padding:16px;';

    // Check type of package
    let pkgType = pkg ? (pkg.loai_goi ? 'pt' : 'gym') : self.activeTab;

    const field = (icon, label, fid, type, value, placeholder, required = false, isFull = false) => `
      <div class="${isFull ? 'col-span-full' : ''}">
        <label class="text-on-surface-variant text-body-sm uppercase font-bold tracking-wider block mb-1 opacity-80">${label}${required ? ' <span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>' : ''}</label>
        <div class="relative group">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors text-[18px]">${icon}</span>
          <input id="${fid}" type="${type}" value="${value ?? ''}" placeholder="${placeholder}" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-10 pr-4 py-2.5 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-body-md font-medium transition-all" />
        </div>
      </div>
    `;

    const textareaField = (icon, label, fid, value, placeholder) => `
      <div class="col-span-full">
        <label class="text-on-surface-variant text-body-sm uppercase font-bold tracking-wider block mb-1 opacity-80">${label}</label>
        <div class="relative group">
          <span class="material-symbols-outlined absolute left-3 top-3 text-outline group-focus-within:text-brand-primary transition-colors text-[18px]">${icon}</span>
          <textarea id="${fid}" rows="2" placeholder="${placeholder}" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-10 pr-4 py-2.5 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-body-md font-medium transition-all resize-none">${value || ''}</textarea>
        </div>
      </div>
    `;

    // Dynamic initial title/gradient based on pkgType
    const headerGradient = pkgType === 'gym' 
      ? 'linear-gradient(135deg,#15803d 0%,#1D9336 60%,#22c55e 100%)' 
      : 'linear-gradient(135deg,#047857 0%,#10b981 60%,#34d399 100%)';
    
    const titleText = isEdit 
      ? (pkgType === 'gym' ? 'Chỉnh sửa gói tập Gym' : 'Chỉnh sửa gói PT')
      : (pkgType === 'gym' ? 'Thêm gói tập Gym mới' : 'Thêm gói PT mới');

    overlay.innerHTML = `
      <div style="border-radius:24px;width:100%;max-width:560px;display:flex;flex-direction:column;box-shadow:0 30px 80px rgba(0,0,0,0.4);background:var(--bg-surface-lowest);">
        
        <!-- Modal Header -->
        <div id="modal-header-bg" style="background:${headerGradient};padding:24px 24px 20px;flex-shrink:0;position:relative;overflow:hidden;border-top-left-radius:24px;border-top-right-radius:24px;transition:background 0.3s ease;">
          <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.07);"></div>
          <button id="close-pkg-modal" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.15);border:none;cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:50;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
            <span class="material-symbols-outlined" style="color:#fff;font-size:18px;">close</span>
          </button>
          <div style="display:flex;align-items:center;gap:16px;position:relative;z-index:1;">
            <div id="modal-header-icon" class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style="background:rgba(255,255,255,0.15);backdrop-filter:blur(4px);border:2px solid rgba(255,255,255,0.4);">
              <span class="material-symbols-outlined text-white text-[28px]">${isEdit ? 'edit_document' : 'add_box'}</span>
            </div>
            <div>
              <span style="font-size:11px;font-weight:800;color:rgba(255,255,255,0.8);text-transform:uppercase;background:rgba(0,0,0,0.2);padding:3px 8px;border-radius:999px;">Cấu hình Dịch vụ</span>
              <h3 id="modal-title-text" style="font-size:22px;font-weight:800;color:#fff;margin:6px 0 2px;">${titleText}</h3>
            </div>
          </div>
        </div>

        <!-- Modal Content -->
        <div class="bg-surface-container-lowest overflow-y-auto p-loose max-h-[70vh]">
          <div class="grid grid-cols-2 gap-x-standard gap-y-4">
            
            <!-- Type Selector (Only editable on Create) -->
            <div class="col-span-full">
              <label class="text-on-surface-variant text-body-sm uppercase font-bold tracking-wider block mb-1 opacity-80">Loại gói dịch vụ <span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span></label>
              <div class="relative group">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors text-[18px]">category</span>
                <select id="modal-pkg-type" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-10 pr-4 py-2.5 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-body-md font-bold transition-all" ${isEdit ? 'disabled style="opacity: 0.6; cursor: not-allowed;"' : ''}>
                  <option value="gym" ${pkgType === 'gym' ? 'selected' : ''}>Gói tập Gym thường</option>
                  <option value="pt" ${pkgType === 'pt' ? 'selected' : ''}>Gói dịch vụ Personal Trainer (PT)</option>
                </select>
              </div>
            </div>

            <!-- Common Name -->
            ${field('inventory_2', 'Tên gói dịch vụ', 'pkg-ten', 'text', pkg?.ten_goi || '', 'VD: Gói Gym 3 Tháng, PT 20 Buổi...', true, true)}

            <!-- Container for GYM Package fields -->
            <div id="gym-fields-container" class="col-span-full grid grid-cols-2 gap-x-standard gap-y-4" style="display:none;">
              ${field('calendar_month', 'Số tháng', 'pkg-thang', 'number', pkg?.so_thang ?? '', 'VD: 1, 3, 12...', true, false)}
              ${field('event_note', 'Ngày thêm (Khuyến mãi)', 'pkg-ngay', 'number', pkg?.so_ngay_them ?? 0, '0', false, false)}
            </div>

            <!-- Container for PT Package fields -->
            <div id="pt-fields-container" class="col-span-full grid grid-cols-2 gap-x-standard gap-y-4" style="display:none;">
              <div class="col-span-full">
                <label class="text-on-surface-variant text-body-sm uppercase font-bold tracking-wider block mb-1 opacity-80">Phân loại gói PT <span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span></label>
                <div class="relative group">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors text-[18px]">rule</span>
                  <select id="pt-loai-goi" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-10 pr-4 py-2.5 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-body-md font-bold transition-all">
                    <option value="theo_buoi" ${pkg?.loai_goi === 'theo_buoi' ? 'selected' : ''}>Tính theo số buổi tập</option>
                    <option value="theo_thang" ${pkg?.loai_goi === 'theo_thang' ? 'selected' : ''}>Tính theo số tháng đăng ký</option>
                  </select>
                </div>
              </div>
              
              <div id="pt-buoi-field" class="col-span-full">
                ${field('fitness_center', 'Số buổi tập', 'pt-buoi', 'number', pkg?.so_buoi ?? '', 'VD: 10, 20, 50...', true, true)}
              </div>
              <div id="pt-thang-field" class="col-span-full" style="display:none;">
                ${field('calendar_month', 'Số tháng PT', 'pt-thang', 'number', pkg?.so_thang ?? '', 'VD: 1, 3, 6...', true, true)}
              </div>
            </div>

            <!-- Common Price & Description -->
            ${field('payments', 'Đơn giá (VNĐ)', 'pkg-gia', 'text', pkg?.gia ? pkg.gia.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '', 'VD: 500.000', true, true)}
            ${textareaField('description', 'Mô tả chi tiết', 'pkg-mota', pkg?.mo_ta || '', 'Mô tả ngắn gọn về quyền lợi của gói tập...')}
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="bg-surface-container-lowest px-loose py-standard border-t border-outline-variant flex gap-standard justify-end flex-shrink-0" style="border-bottom-left-radius:24px;border-bottom-right-radius:24px;">
          <button id="cancel-pkg-modal" class="px-loose py-2.5 rounded-xl border-2 border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-all active:scale-95">Hủy</button>
          <button id="save-pkg-modal" class="px-loose py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-xs active:scale-95 shadow-md hover:shadow-lg hover:opacity-90" style="background:#10b981;">
            <span class="material-symbols-outlined text-sm">save</span>${isEdit ? 'Lưu thay đổi' : 'Tạo gói mới'}
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('close-pkg-modal').addEventListener('click', close);
    document.getElementById('cancel-pkg-modal').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    // Format currency input dynamically
    const priceInput = document.getElementById('pkg-gia');
    if (priceInput) {
      priceInput.addEventListener('input', function () {
        let value = this.value.replace(/\D/g, '');
        this.value = value ? value.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
      });
    }

    // Dynamic field visibility toggling
    const typeSelect = document.getElementById('modal-pkg-type');
    const ptLoaiSelect = document.getElementById('pt-loai-goi');
    
    const gymFieldsContainer = document.getElementById('gym-fields-container');
    const ptFieldsContainer = document.getElementById('pt-fields-container');
    const ptBuoiField = document.getElementById('pt-buoi-field');
    const ptThangField = document.getElementById('pt-thang-field');
    
    const headerBg = document.getElementById('modal-header-bg');
    const titleTextEl = document.getElementById('modal-title-text');
    const saveBtn = document.getElementById('save-pkg-modal');

    const updateVisibility = () => {
      const type = typeSelect.value;
      if (type === 'gym') {
        gymFieldsContainer.style.display = 'contents';
        ptFieldsContainer.style.display = 'none';
        headerBg.style.background = 'linear-gradient(135deg, #15803d 0%, #1D9336 60%, #22c55e 100%)';
        titleTextEl.textContent = isEdit ? 'Chỉnh sửa gói tập Gym' : 'Thêm gói tập Gym mới';
        saveBtn.style.background = '#1D9336';
      } else {
        gymFieldsContainer.style.display = 'none';
        ptFieldsContainer.style.display = 'contents';
        headerBg.style.background = 'linear-gradient(135deg, #047857 0%, #10b981 60%, #34d399 100%)';
        titleTextEl.textContent = isEdit ? 'Chỉnh sửa gói PT' : 'Thêm gói PT mới';
        saveBtn.style.background = '#10b981';

        const ptLoai = ptLoaiSelect.value;
        if (ptLoai === 'theo_buoi') {
          ptBuoiField.style.display = 'block';
          ptThangField.style.display = 'none';
        } else {
          ptBuoiField.style.display = 'none';
          ptThangField.style.display = 'block';
        }
      }
    };

    typeSelect.addEventListener('change', updateVisibility);
    ptLoaiSelect.addEventListener('change', updateVisibility);
    
    // Initial run
    updateVisibility();

    // Save Event
    saveBtn.addEventListener('click', async () => {
      const type = typeSelect.value;
      const ten = document.getElementById('pkg-ten').value.trim();
      const gia = document.getElementById('pkg-gia').value;
      const mota = document.getElementById('pkg-mota').value.trim();
      const rawGia = gia.replace(/\./g, '');

      if (!ten || rawGia === '') {
        window.GymApp.toast('Vui lòng nhập tên gói và giá tiền!', 'error');
        return;
      }

      let payload = { ten_goi: ten, gia: parseInt(rawGia), mo_ta: mota };

      if (type === 'gym') {
        const thang = document.getElementById('pkg-thang').value;
        const ngay = document.getElementById('pkg-ngay').value || '0';
        if (thang === '') {
          window.GymApp.toast('Vui lòng nhập số tháng!', 'error');
          return;
        }
        payload.so_thang = parseInt(thang);
        payload.so_ngay_them = parseInt(ngay);
      } else {
        const ptLoai = ptLoaiSelect.value;
        payload.loai_goi = ptLoai;
        if (ptLoai === 'theo_buoi') {
          const buoi = document.getElementById('pt-buoi').value;
          if (buoi === '') {
            window.GymApp.toast('Vui lòng nhập số buổi tập!', 'error');
            return;
          }
          payload.so_buoi = parseInt(buoi);
          payload.so_thang = null;
        } else {
          const ptThang = document.getElementById('pt-thang').value;
          if (ptThang === '') {
            window.GymApp.toast('Vui lòng nhập số tháng PT!', 'error');
            return;
          }
          payload.so_thang = parseInt(ptThang);
          payload.so_buoi = null;
        }
      }

      saveBtn.disabled = true;
      saveBtn.classList.add('opacity-50');

      try {
        let res;
        const endpoint = type === 'gym' ? '/packages' : '/packages/pt';
        if (isEdit) {
          res = await window.GymApp.api.put(`${endpoint}/${pkg.id}`, payload);
        } else {
          res = await window.GymApp.api.post(endpoint, payload);
        }

        if (res?.success) {
          window.GymApp.toast(isEdit ? 'Cập nhật thành công!' : 'Tạo gói tập mới thành công!', 'success');
          close();
          
          // Reload both lists
          const [gymRes, ptRes] = await Promise.all([
            window.GymApp.api.get('/packages'),
            window.GymApp.api.get('/packages/pt')
          ]);
          
          if (gymRes?.success) window.GymApp.data.packages = gymRes.data || [];
          if (ptRes?.success) window.GymApp.data.ptPackages = ptRes.data || [];
          
          self._refreshView();
        } else {
          window.GymApp.toast(res?.message || 'Có lỗi xảy ra!', 'error');
        }
      } catch (err) {
        window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.classList.remove('opacity-50');
      }
    });
  },

  _confirmDelete: function (id, name, count, type) {
    const self = this;
    document.getElementById('gym-pkg-del-modal')?.remove();

    const isGym = type === 'gym';

    const overlay = document.createElement('div');
    overlay.id = 'gym-pkg-del-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);padding:16px;';
    overlay.innerHTML = `
      <div style="border-radius:24px;width:100%;max-width:440px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,0.4);" class="bg-surface-container-lowest">
        <div class="px-loose py-standard border-b border-outline-variant flex items-center gap-compact" style="background:linear-gradient(135deg,#991b1b,#dc2626);">
          <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-white text-xl">delete_forever</span>
          </div>
          <h3 class="font-bold text-white text-[17px]">Xác nhận xóa gói ${isGym ? 'Gym' : 'PT'}</h3>
        </div>
        <div class="p-loose bg-surface-container-lowest">
          <p class="text-on-surface text-body-md">Bạn có chắc chắn muốn xóa gói <strong class="text-error">${name}</strong> không?</p>
          ${count > 0 ? `<div class="mt-standard flex items-start gap-xs bg-error/10 p-compact rounded-xl border border-error/20"><span class="material-symbols-outlined text-error text-[18px]">info</span><p class="text-error text-body-sm font-medium m-0">Gói này đang có ${count} hội viên đăng ký tập. Gói sẽ chỉ bị ẩn (soft delete) để đảm bảo lịch sử hội viên, không xóa vĩnh viễn khỏi DB.</p></div>` : ''}
          <div class="flex gap-standard justify-end mt-loose">
            <button id="cancel-pkg-del" class="px-loose py-2.5 rounded-xl border-2 border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-all active:scale-95">Hủy</button>
            <button id="confirm-pkg-del" class="bg-error text-white px-loose py-2.5 rounded-xl font-bold transition-all flex items-center gap-xs active:scale-95 shadow-md hover:shadow-lg hover:opacity-90">
              <span class="material-symbols-outlined text-sm">delete</span> Xóa gói
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('cancel-pkg-del').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('confirm-pkg-del').addEventListener('click', async () => {
      const btn = document.getElementById('confirm-pkg-del');
      btn.disabled = true;
      btn.classList.add('opacity-50');
      
      try {
        const endpoint = isGym ? `/packages/${id}` : `/packages/pt/${id}`;
        const res = await window.GymApp.api.delete(endpoint);
        
        if (res?.success) {
          window.GymApp.toast('Đã xóa gói tập thành công!', 'success');
          close();
          
          // Reload the lists
          const [gymRes, ptRes] = await Promise.all([
            window.GymApp.api.get('/packages'),
            window.GymApp.api.get('/packages/pt')
          ]);
          
          if (gymRes?.success) window.GymApp.data.packages = gymRes.data || [];
          if (ptRes?.success) window.GymApp.data.ptPackages = ptRes.data || [];
          
          self._refreshView();
        } else {
          window.GymApp.toast(res?.message || 'Có lỗi xảy ra!', 'error');
        }
      } catch (err) {
        window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
      } finally {
        btn.disabled = false;
        btn.classList.remove('opacity-50');
      }
    });
  }
};
