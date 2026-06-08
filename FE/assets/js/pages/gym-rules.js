window.GymApp.pages['gym-rules'] = {
  // Bộ lọc hiện tại
  currentFilter: 'all',
  
  // Danh sách nội quy đang lưu trong component
  rules: [],

  render: function () {
    const self = this;
    const rules = self.rules || [];
    
    // Phân loại đếm số lượng cho stats cards
    const totalCount = rules.length;
    const activeCount = rules.filter(r => r.is_active === 1).length;
    const memberCount = rules.filter(r => r.ap_dung_cho === 'hoi_vien').length;
    const ptCount = rules.filter(r => r.ap_dung_cho === 'pt').length;

    // Lọc danh sách theo tab được chọn
    const filteredRules = rules.filter(r => {
      if (self.currentFilter === 'all') return true;
      return r.ap_dung_cho === self.currentFilter;
    });

    const audienceLabels = {
      tat_ca: { label: 'Tất cả đối tượng', class: 'bg-surface-container-highest text-on-surface' },
      hoi_vien: { label: 'Hội viên', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
      pt: { label: 'HLV / PT', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
      nhan_vien: { label: 'Nhân viên', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' }
    };

    const isStaff = window.GymApp.auth.user?.vai_tro === 'admin' || window.GymApp.auth.user?.vai_tro === 'nhan_vien';

    return `
      <div class="flex flex-col gap-lg animate-fadeIn">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-standard">
          <div class="page-title-bar">
            <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Nội quy phòng tập</h2>
            <p class="text-on-surface-variant text-body-sm mt-xs">Quản lý và điều chỉnh các quy định phòng tập dành cho Hội viên, PT và Nhân viên</p>
          </div>
          ${isStaff ? `
          <button id="btn-add-rule" class="flex items-center gap-xs px-5 py-2.5 rounded-xl bg-brand-primary text-white font-bold text-body-md hover:shadow-lg hover:shadow-brand-primary/20 active:scale-95 transition-all">
            <span class="material-symbols-outlined text-[16px]">add</span>
            Thêm quy tắc mới
          </button>
          ` : ''}
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-standard">
          ${[
            { label: 'Tổng số quy tắc', value: totalCount, icon: 'gavel', color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
            { label: 'Đang áp dụng', value: activeCount, icon: 'verified', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' },
            { label: 'Dành cho Hội viên', value: memberCount, icon: 'person', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
            { label: 'Dành cho PT / HLV', value: ptCount, icon: 'sports_gymnastics', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' }
          ].map(s => `
            <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-standard shadow-sm flex flex-col gap-standard hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div class="flex items-center justify-between">
                <span class="text-on-surface-variant text-body-sm font-bold uppercase tracking-wider leading-tight" style="max-width:calc(100% - 48px)">${s.label}</span>
                <div class="w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0">
                  <span class="material-symbols-outlined ${s.color} text-lg" style="font-variation-settings:'FILL' 1">${s.icon}</span>
                </div>
              </div>
              <span class="text-on-surface text-3xl font-bold tracking-tight">${s.value}</span>
            </div>
          `).join('')}
        </div>

        <!-- Filter Tabs -->
        <div class="flex flex-wrap gap-xs border-b border-outline-variant/50 pb-standard">
          ${[
            { id: 'all', label: 'Tất cả', icon: 'list' },
            { id: 'tat_ca', label: 'Quy định chung', icon: 'public' },
            { id: 'hoi_vien', label: 'Hội viên', icon: 'group' },
            { id: 'pt', label: 'HLV / PT', icon: 'sports_gymnastics' },
            { id: 'nhan_vien', label: 'Nhân viên', icon: 'badge' }
          ].map(tab => {
            const active = self.currentFilter === tab.id;
            const activeClass = active 
              ? 'bg-brand-primary text-white font-bold border-2 border-brand-primary shadow-sm' 
              : 'bg-white dark:bg-[#1e1e1e] border-2 border-outline-variant/50 hover:bg-surface-container-low text-on-surface-variant hover:-translate-y-0.5';
            return `
              <button class="tab-filter-rule flex items-center gap-xs px-4 py-2 rounded-xl text-body-sm font-bold transition-all duration-200 ${activeClass}" data-filter="${tab.id}">
                <span class="material-symbols-outlined text-[16px]">${tab.icon}</span>
                ${tab.label}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Rules Grid -->
        ${filteredRules.length === 0 ? `
          <div class="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1e1e1e] border-2 border-outline-variant/50 rounded-2xl shadow-sm text-center">
            <span class="material-symbols-outlined text-outline text-5xl mb-standard">gavel</span>
            <h4 class="font-bold text-on-surface text-body-md">Không có quy định nào được tìm thấy</h4>
            <p class="text-on-surface-variant text-body-sm mt-xs">Nhấp vào "Thêm quy tắc mới" để bắt đầu soạn thảo nội quy phòng tập.</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-standard">
            ${filteredRules.map(r => {
              const aud = audienceLabels[r.ap_dung_cho] || { label: r.ap_dung_cho, class: 'bg-surface-container' };
              const cardBorder = r.is_active ? 'border-outline-variant/50 hover:border-brand-primary' : 'border-outline-variant/30 opacity-65';
              const cardBg = 'bg-white dark:bg-[#1e1e1e]';
              
              return `
                <div class="gym-card ${cardBg} border-2 ${cardBorder} rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                  
                  <!-- Top Details -->
                  <div class="p-standard flex flex-col gap-standard">
                    
                    <!-- Title & Badges -->
                    <div class="flex items-start justify-between gap-compact">
                      <div class="flex items-center gap-compact">
                        <span class="w-7 h-7 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-body-sm">
                          ${r.thu_tu}
                        </span>
                        <h3 class="font-bold text-on-surface text-body-md leading-tight">${r.tieu_de}</h3>
                      </div>
                      
                      <!-- Active toggle switch -->
                      ${isStaff ? `
                      <label class="relative inline-flex items-center cursor-pointer select-none">
                        <input type="checkbox" class="sr-only peer toggle-active-rule" data-id="${r.id}" ${r.is_active ? 'checked' : ''} />
                        <div class="w-10 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                      ` : `
                      <span class="text-xs font-bold ${r.is_active ? 'text-brand-primary' : 'text-outline-variant'}">${r.is_active ? 'Đang bật' : 'Đang tắt'}</span>
                      `}
                    </div>

                    <!-- Rule description -->
                    <p class="text-on-surface-variant text-body-sm font-semibold leading-relaxed whitespace-pre-line">${r.noi_dung}</p>
                  </div>

                  <!-- Footer Actions -->
                  <div class="px-standard py-compact border-t border-outline-variant/50 flex items-center justify-between bg-surface-container-low/20">
                    <span class="text-label-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${aud.class}">
                      ${aud.label}
                    </span>

                    <div class="flex items-center gap-xs">
                      ${isStaff ? `<button class="material-symbols-outlined text-outline hover:text-brand-primary text-lg p-1.5 rounded-lg hover:bg-surface-container-low transition-colors btn-edit-rule" data-id="${r.id}" title="Chỉnh sửa">edit</button>` : ''}
                      ${window.GymApp.auth.user?.vai_tro === 'admin' ? `
                        <button class="material-symbols-outlined text-outline hover:text-error text-lg p-1.5 rounded-lg hover:bg-error/10 transition-colors btn-del-rule" data-id="${r.id}" data-title="${r.tieu_de}" title="Xóa">delete</button>
                      ` : ''}
                    </div>
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        `}

      </div>
    `;
  },

  init: function () {
    const self = this;
    
    // Nếu chưa load rules lần đầu, thực hiện tải
    if (self.rules.length === 0) {
      self._loadRules();
      return;
    }

    // 1. Thêm nội quy mới
    document.getElementById('btn-add-rule')?.addEventListener('click', () => self._openModal(null));

    // 2. Click lọc tab
    document.querySelectorAll('.tab-filter-rule').forEach(btn => {
      btn.addEventListener('click', () => {
        self.currentFilter = btn.dataset.filter;
        self._refreshView();
      });
    });

    // 3. Chỉnh sửa
    document.querySelectorAll('.btn-edit-rule').forEach(btn => {
      btn.addEventListener('click', () => {
        const rule = self.rules.find(r => r.id == btn.dataset.id);
        if (rule) self._openModal(rule);
      });
    });

    // 4. Xóa
    document.querySelectorAll('.btn-del-rule').forEach(btn => {
      btn.addEventListener('click', () => {
        self._confirmDelete(btn.dataset.id, btn.dataset.title);
      });
    });

    // 5. Bật/Tắt trạng thái hoạt động nhanh
    document.querySelectorAll('.toggle-active-rule').forEach(toggle => {
      toggle.addEventListener('change', async (e) => {
        const id = toggle.dataset.id;
        const checked = e.target.checked;
        try {
          const res = await window.GymApp.api.put(`/config/rules/${id}`, { is_active: checked });
          if (res?.success) {
            window.GymApp.toast('Cập nhật trạng thái thành công!', 'success');
            // Cập nhật mảng local và làm mới view để cập nhật stats/styles
            const rule = self.rules.find(r => r.id == id);
            if (rule) rule.is_active = checked ? 1 : 0;
            self._refreshView();
          } else {
            window.GymApp.toast(res?.message || 'Không thể cập nhật trạng thái', 'error');
            e.target.checked = !checked; // revert
          }
        } catch (err) {
          window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
          e.target.checked = !checked; // revert
        }
      });
    });
  },

  // ===== PRIVATE HELPERS =====
  _loadRules: async function () {
    const self = this;
    const content = document.getElementById('content-area');
    try {
      if (content) {
        content.innerHTML = `
          <div class="flex flex-col items-center justify-center py-20 text-center">
            <span class="material-symbols-outlined animate-spin text-brand-primary text-4xl mb-compact">autorenew</span>
            <p class="text-on-surface-variant text-body-md">Đang tải danh sách nội quy...</p>
          </div>
        `;
      }

      // Nếu là admin hoặc nhan_vien, dùng /config/rules/all để xem tất cả kể cả quy tắc chưa kích hoạt.
      // Ngược lại (ví dụ PT), chỉ xem các quy tắc đang hoạt động qua /config/rules.
      const isStaff = window.GymApp.auth.user?.vai_tro === 'admin' || window.GymApp.auth.user?.vai_tro === 'nhan_vien';
      const endpoint = isStaff ? '/config/rules/all' : '/config/rules';
      
      const res = await window.GymApp.api.get(endpoint);
      if (res?.success) {
        self.rules = res.data || [];
      } else {
        window.GymApp.toast(res?.message || 'Lỗi tải nội quy!', 'error');
      }
    } catch (err) {
      window.GymApp.toast('Không thể đồng bộ dữ liệu với Backend!', 'error');
    } finally {
      self._refreshView();
    }
  },

  _refreshView: function () {
    const self = this;
    const content = document.getElementById('content-area');
    if (content) {
      content.innerHTML = self.render();
      self.init();
    }
  },

  _openModal: function (rule) {
    const self = this;
    const isEdit = !!rule;
    document.getElementById('gym-rules-modal')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'gym-rules-modal';
    overlay.className = 'fixed inset-0 z-[9100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';
    
    overlay.innerHTML = `
      <div class="bg-white dark:bg-[#1e1e1e] border-2 border-outline-variant/50 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-outline-variant/50 flex items-center justify-between bg-surface-container-low/20">
          <h3 class="font-bold text-on-surface text-body-lg">
            ${isEdit ? 'Chỉnh sửa quy tắc' : 'Thêm quy tắc nội quy mới'}
          </h3>
          <button id="close-rule-modal" class="text-on-surface-variant hover:text-error transition-colors p-1 rounded-lg">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Body Form -->
        <div class="p-6 flex flex-col gap-4">
          <!-- Tiêu đề -->
          <div>
            <label class="text-body-sm font-bold text-on-surface-variant mb-1.5 block">Tiêu đề quy tắc <span class="text-error">*</span></label>
            <input id="rule-title" type="text" value="${rule?.tieu_de || ''}" placeholder="VD: Trang phục tập luyện" class="w-full border border-outline-variant/50 bg-surface-container-low/30 text-on-surface rounded-xl px-4 py-2 text-body-md outline-none focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] transition-all" />
          </div>

          <!-- Áp dụng cho & Thứ tự -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-body-sm font-bold text-on-surface-variant mb-1.5 block">Đối tượng áp dụng <span class="text-error">*</span></label>
              <select id="rule-target" class="w-full border border-outline-variant/50 bg-surface-container-low/30 text-on-surface rounded-xl px-3 py-1.5 text-body-md outline-none focus:border-brand-primary transition-all">
                <option value="tat_ca" ${rule?.ap_dung_cho === 'tat_ca' ? 'selected' : ''}>Quy định chung (Tất cả)</option>
                <option value="hoi_vien" ${rule?.ap_dung_cho === 'hoi_vien' ? 'selected' : ''}>Hội viên</option>
                <option value="pt" ${rule?.ap_dung_cho === 'pt' ? 'selected' : ''}>PT / Huấn luyện viên</option>
                <option value="nhan_vien" ${rule?.ap_dung_cho === 'nhan_vien' ? 'selected' : ''}>Nhân viên</option>
              </select>
            </div>
            <div>
              <label class="text-body-sm font-bold text-on-surface-variant mb-1.5 block">Thứ tự hiển thị <span class="text-error">*</span></label>
              <input id="rule-order" type="number" min="0" value="${rule?.thu_tu ?? 0}" placeholder="VD: 1" class="w-full border border-outline-variant/50 bg-surface-container-low/30 text-on-surface rounded-xl px-4 py-2 text-body-md outline-none focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] transition-all" />
            </div>
          </div>

          <!-- Nội dung -->
          <div>
            <label class="text-body-sm font-bold text-on-surface-variant mb-1.5 block">Nội dung chi tiết <span class="text-error">*</span></label>
            <textarea id="rule-content" rows="5" placeholder="Soạn thảo nội quy chi tiết tại đây..." class="w-full border border-outline-variant/50 bg-surface-container-low/30 text-on-surface rounded-xl px-4 py-2 text-body-md outline-none focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] resize-none leading-relaxed transition-all">${rule?.noi_dung || ''}</textarea>
          </div>

          <!-- Footer Actions -->
          <div class="flex gap-3 mt-2">
            <button id="cancel-rule-modal" class="flex-1 py-2.5 rounded-xl bg-surface-container-low text-on-surface-variant font-bold text-body-md hover:bg-surface-container transition-all active:scale-95">Hủy</button>
            <button id="save-rule-modal" class="flex-1 py-2.5 rounded-xl bg-brand-primary text-white font-bold text-body-md hover:shadow-lg hover:shadow-brand-primary/20 transition-all active:scale-95 flex items-center justify-center gap-xs">
              <span class="material-symbols-outlined text-[16px]">save</span>${isEdit ? 'Lưu thay đổi' : 'Tạo quy tắc'}
            </button>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('close-rule-modal').addEventListener('click', close);
    document.getElementById('cancel-rule-modal').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('save-rule-modal').addEventListener('click', async () => {
      const tieu_de = document.getElementById('rule-title').value.trim();
      const ap_dung_cho = document.getElementById('rule-target').value;
      const thu_tu = document.getElementById('rule-order').value;
      const noi_dung = document.getElementById('rule-content').value.trim();

      if (!tieu_de || !noi_dung || thu_tu === '') {
        window.GymApp.toast('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
        return;
      }

      const btn = document.getElementById('save-rule-modal');
      btn.disabled = true; btn.classList.add('opacity-50');

      try {
        const body = { tieu_de, ap_dung_cho, thu_tu: parseInt(thu_tu), noi_dung };
        let res;
        
        if (isEdit) {
          res = await window.GymApp.api.put(`/config/rules/${rule.id}`, body);
        } else {
          res = await window.GymApp.api.post('/config/rules', body);
        }

        if (res?.success) {
          window.GymApp.toast(isEdit ? 'Đã cập nhật quy tắc thành công!' : 'Đã tạo quy tắc mới thành công!', 'success');
          close();
          // Xoá cache, load lại từ server, đồng bộ màn hình
          self.rules = [];
          await self._loadRules();
        } else {
          window.GymApp.toast(res?.message || 'Có lỗi xảy ra!', 'error');
          btn.disabled = false; btn.classList.remove('opacity-50');
        }
      } catch (err) {
        window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
        btn.disabled = false; btn.classList.remove('opacity-50');
      }
    });
  },

  _confirmDelete: function (id, title) {
    const self = this;
    document.getElementById('gym-rule-del-modal')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'gym-rule-del-modal';
    overlay.className = 'fixed inset-0 z-[9100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';
    
    overlay.innerHTML = `
      <div class="bg-white dark:bg-[#1e1e1e] border-2 border-outline-variant/50 rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b border-outline-variant/50 flex items-center gap-compact bg-surface-container-low/20">
          <span class="material-symbols-outlined text-error text-2xl">warning</span>
          <h3 class="font-bold text-on-surface text-body-lg">Xác nhận xóa quy tắc</h3>
        </div>
        <div class="p-6">
          <p class="text-on-surface text-body-md font-semibold">Bạn có chắc chắn muốn xóa quy tắc: <strong>${title}</strong>?</p>
          <p class="text-on-surface-variant text-body-sm mt-xs">Hành động này sẽ xóa vĩnh viễn quy tắc khỏi cơ sở dữ liệu và không thể hoàn tác.</p>
          
          <div class="flex gap-3 mt-6">
            <button id="cancel-rule-del" class="flex-1 py-2.5 rounded-xl bg-surface-container-low text-on-surface-variant font-bold text-body-md hover:bg-surface-container transition-all active:scale-95">Hủy</button>
            <button id="confirm-rule-del" class="flex-1 py-2.5 rounded-xl bg-error text-white font-bold text-body-md hover:shadow-lg hover:shadow-error/20 transition-all active:scale-95 flex items-center justify-center gap-xs">
              <span class="material-symbols-outlined text-[16px]">delete</span>Xóa
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('cancel-rule-del').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('confirm-rule-del').addEventListener('click', async () => {
      const btn = document.getElementById('confirm-rule-del');
      btn.disabled = true; btn.classList.add('opacity-50');
      
      try {
        const res = await window.GymApp.api.delete(`/config/rules/${id}`);
        if (res?.success) {
          window.GymApp.toast('Đã xóa quy tắc thành công!', 'success');
          close();
          self._loadRules();
        } else {
          window.GymApp.toast(res?.message || 'Có lỗi xảy ra khi xóa!', 'error');
        }
      } catch (err) {
        window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
      } finally {
        btn.disabled = false; btn.classList.remove('opacity-50');
      }
    });
  },

  guideHtml: `
    <div class="space-y-4 text-xs">
      <div class="flex items-start gap-2 bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/10">
        <span class="material-symbols-outlined text-brand-primary text-base flex-shrink-0 mt-0.5">info</span>
        <p class="text-on-surface-variant leading-relaxed">Trang <strong>Nội quy phòng tập</strong> quản lý các quy định, điều khoản hoạt động của phòng tập hiển thị công khai trên ứng dụng điện thoại (App) cho hội viên.</p>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">Soạn thảo quy tắc:</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li>Bấm nút **Thêm nội quy** để mở Form tạo quy tắc mới.</li>
          <li>Cấu hình: Tiêu đề quy tắc, Đối tượng áp dụng (Hội viên, PT, Nhân viên hoặc Quy định chung), Thứ tự hiển thị (số nhỏ hiển thị trước), và Nội dung chi tiết quy tắc.</li>
        </ul>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">Bật/Tắt & Quản lý:</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li><strong>Bật/Tắt hiển thị:</strong> Sử dụng công tắc gạt (switch) ở mỗi quy tắc để bật/tắt hiển thị quy tắc đó trên App di động của hội viên ngay lập tức.</li>
          <li><strong>Sửa/Xóa:</strong> Click vào biểu tượng tương ứng trên từng thẻ nội quy để thay đổi nội dung hoặc xóa vĩnh viễn quy tắc đó.</li>
        </ul>
      </div>
    </div>
  `
};
