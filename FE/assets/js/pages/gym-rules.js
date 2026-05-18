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

    return `
      <div class="flex flex-col gap-margin animate-fadeIn">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-standard">
          <div class="page-title-bar">
            <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Nội quy phòng tập</h2>
            <p class="text-on-surface-variant text-body-sm mt-xs">Quản lý và điều chỉnh các quy định phòng tập dành cho Hội viên, PT và Nhân viên</p>
          </div>
          <button id="btn-add-rule" class="btn-primary text-white px-loose py-compact rounded-xl font-bold flex items-center gap-compact shadow-md hover:scale-[1.02] transition-all">
            <span class="material-symbols-outlined text-sm">add</span>
            Thêm quy tắc mới
          </button>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-loose">
          ${[
            { label: 'Tổng số quy tắc', value: totalCount, icon: 'gavel', color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
            { label: 'Đang áp dụng', value: activeCount, icon: 'verified', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' },
            { label: 'Dành cho Hội viên', value: memberCount, icon: 'person', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
            { label: 'Dành cho PT / HLV', value: ptCount, icon: 'sports_gymnastics', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' }
          ].map(s => `
            <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm flex items-center gap-compact">
              <div class="w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0">
                <span class="material-symbols-outlined ${s.color} text-2xl" style="font-variation-settings:'FILL' 1">${s.icon}</span>
              </div>
              <div class="min-w-0">
                <p class="text-on-surface-variant text-body-sm font-bold truncate">${s.label}</p>
                <p class="text-on-surface font-display-lg text-display-lg font-bold">${s.value}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Filter Tabs -->
        <div class="flex flex-wrap gap-compact border-b border-outline-variant pb-standard">
          ${[
            { id: 'all', label: 'Tất cả', icon: 'list' },
            { id: 'tat_ca', label: 'Quy định chung', icon: 'public' },
            { id: 'hoi_vien', label: 'Hội viên', icon: 'group' },
            { id: 'pt', label: 'HLV / PT', icon: 'sports_gymnastics' },
            { id: 'nhan_vien', label: 'Nhân viên', icon: 'badge' }
          ].map(tab => {
            const active = self.currentFilter === tab.id;
            const activeClass = active 
              ? 'bg-brand-primary text-white font-bold shadow-sm' 
              : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant';
            return `
              <button class="tab-filter-rule flex items-center gap-compact px-loose py-compact rounded-xl text-body-sm transition-all duration-200 ${activeClass}" data-filter="${tab.id}">
                <span class="material-symbols-outlined text-sm">${tab.icon}</span>
                ${tab.label}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Rules Grid -->
        ${filteredRules.length === 0 ? `
          <div class="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm text-center">
            <span class="material-symbols-outlined text-outline text-5xl mb-standard">gavel</span>
            <h4 class="font-bold text-on-surface text-body-lg">Không có quy định nào được tìm thấy</h4>
            <p class="text-on-surface-variant text-body-sm mt-xs">Nhấp vào "Thêm quy tắc mới" để bắt đầu soạn thảo nội quy phòng tập.</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-loose">
            ${filteredRules.map(r => {
              const aud = audienceLabels[r.ap_dung_cho] || { label: r.ap_dung_cho, class: 'bg-surface-container' };
              const cardBorder = r.is_active ? 'border-outline-variant hover:border-brand-primary' : 'border-outline-variant/60 opacity-60';
              const cardBg = r.is_active ? 'bg-surface-container-lowest' : 'bg-surface-container-low';
              
              return `
                <div class="gym-card ${cardBg} border ${cardBorder} rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden">
                  
                  <!-- Top Details -->
                  <div class="p-loose flex flex-col gap-standard">
                    
                    <!-- Title & Badges -->
                    <div class="flex items-start justify-between gap-compact">
                      <div class="flex items-center gap-compact">
                        <span class="w-7 h-7 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-body-sm">
                          ${r.thu_tu}
                        </span>
                        <h3 class="font-bold text-on-surface text-body-lg leading-tight">${r.tieu_de}</h3>
                      </div>
                      
                      <!-- Active toggle switch -->
                      <label class="relative inline-flex items-center cursor-pointer select-none">
                        <input type="checkbox" class="sr-only peer toggle-active-rule" data-id="${r.id}" ${r.is_active ? 'checked' : ''} />
                        <div class="w-10 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                    </div>

                    <!-- Rule description -->
                    <p class="text-on-surface-variant text-body-md leading-relaxed whitespace-pre-line">${r.noi_dung}</p>
                  </div>

                  <!-- Footer Actions -->
                  <div class="px-loose py-compact border-t border-outline-variant flex items-center justify-between bg-surface-container-low/50">
                    <span class="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${aud.class}">
                      ${aud.label}
                    </span>

                    <div class="flex items-center gap-atom">
                      <button class="material-symbols-outlined text-outline hover:text-brand-primary text-xl p-atom rounded-lg hover:bg-surface-container transition-colors btn-edit-rule" data-id="${r.id}" title="Chỉnh sửa">edit</button>
                      <button class="material-symbols-outlined text-outline hover:text-error text-xl p-atom rounded-lg hover:bg-error-container transition-colors btn-del-rule" data-id="${r.id}" data-title="${r.tieu_de}" title="Xóa">delete</button>
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

      // Chỉ admin mới gọi được /config/rules/all để xem tất cả
      const res = await window.GymApp.api.get('/config/rules/all');
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
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);padding:16px;';
    
    overlay.innerHTML = `
      <div style="border-radius:20px;width:100%;max-width:520px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.3);position:relative;" class="bg-surface-container-lowest">
        
        <!-- Header -->
        <div class="px-loose py-standard border-b border-outline-variant flex items-center justify-between bg-surface-container-low/40">
          <h3 class="font-bold text-on-surface" style="font-size:18px">
            ${isEdit ? 'Chỉnh sửa quy tắc' : 'Thêm quy tắc nội quy mới'}
          </h3>
          <button id="close-rule-modal" style="background:transparent;border:none;cursor:pointer;" class="p-atom hover:bg-surface-container rounded-lg transition-colors">
            <span class="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <!-- Body Form -->
        <div class="p-loose flex flex-col gap-standard">
          
          <!-- Tiêu đề -->
          <div>
            <label class="text-on-surface-variant text-body-sm font-bold block mb-xs">Tiêu đề quy tắc <span class="text-error">*</span></label>
            <input id="rule-title" type="text" value="${rule?.tieu_de || ''}" placeholder="VD: Trang phục tập luyện" class="w-full bg-surface-container border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none text-body-md" />
          </div>

          <!-- Áp dụng cho & Thứ tự -->
          <div class="grid grid-cols-2 gap-standard">
            <div>
              <label class="text-on-surface-variant text-body-sm font-bold block mb-xs">Đối tượng áp dụng <span class="text-error">*</span></label>
              <select id="rule-target" class="w-full bg-surface-container border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none text-body-md cursor-pointer">
                <option value="tat_ca" ${rule?.ap_dung_cho === 'tat_ca' ? 'selected' : ''}>Quy định chung (Tất cả)</option>
                <option value="hoi_vien" ${rule?.ap_dung_cho === 'hoi_vien' ? 'selected' : ''}>Hội viên</option>
                <option value="pt" ${rule?.ap_dung_cho === 'pt' ? 'selected' : ''}>PT / Huấn luyện viên</option>
                <option value="nhan_vien" ${rule?.ap_dung_cho === 'nhan_vien' ? 'selected' : ''}>Nhân viên</option>
              </select>
            </div>
            <div>
              <label class="text-on-surface-variant text-body-sm font-bold block mb-xs">Thứ tự hiển thị <span class="text-error">*</span></label>
              <input id="rule-order" type="number" min="0" value="${rule?.thu_tu ?? 0}" placeholder="VD: 1" class="w-full bg-surface-container border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none text-body-md" />
            </div>
          </div>

          <!-- Nội dung -->
          <div>
            <label class="text-on-surface-variant text-body-sm font-bold block mb-xs">Nội dung chi tiết <span class="text-error">*</span></label>
            <textarea id="rule-content" rows="5" placeholder="Soạn thảo nội quy chi tiết tại đây..." class="w-full bg-surface-container border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none text-body-md resize-none leading-relaxed">${rule?.noi_dung || ''}</textarea>
          </div>

          <!-- Footer Actions -->
          <div class="flex gap-standard justify-end pt-standard border-t border-outline-variant mt-xs">
            <button id="cancel-rule-modal" class="px-loose py-compact rounded-xl font-bold text-body-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all">Hủy</button>
            <button id="save-rule-modal" class="bg-brand-primary text-white px-loose py-compact rounded-xl font-bold text-body-sm hover:bg-primary-container transition-all flex items-center gap-xs shadow-md">
              <span class="material-symbols-outlined text-sm">save</span>${isEdit ? 'Lưu thay đổi' : 'Tạo quy tắc'}
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
          // Reload từ server để có dữ liệu chính xác nhất
          self._loadRules();
        } else {
          window.GymApp.toast(res?.message || 'Có lỗi xảy ra!', 'error');
        }
      } catch (err) {
        window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
      } finally {
        btn.disabled = false; btn.classList.remove('opacity-50');
      }
    });
  },

  _confirmDelete: function (id, title) {
    const self = this;
    document.getElementById('gym-rule-del-modal')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'gym-rule-del-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);padding:16px;';
    
    overlay.innerHTML = `
      <div style="border-radius:16px;width:100%;max-width:400px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.3);" class="bg-surface-container-lowest">
        <div class="px-loose py-standard border-b border-outline-variant flex items-center gap-compact">
          <span class="material-symbols-outlined text-error text-2xl">warning</span>
          <h3 class="font-bold text-on-surface">Xác nhận xóa quy tắc</h3>
        </div>
        <div class="p-loose">
          <p class="text-on-surface text-body-md">Bạn có chắc chắn muốn xóa quy tắc: <strong>${title}</strong>?</p>
          <p class="text-on-surface-variant text-body-sm mt-xs">Hành động này sẽ xóa vĩnh viễn quy tắc khỏi cơ sở dữ liệu và không thể hoàn tác.</p>
          
          <div class="flex gap-standard justify-end mt-loose">
            <button id="cancel-rule-del" class="px-loose py-compact rounded-xl font-bold text-body-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all">Hủy</button>
            <button id="confirm-rule-del" class="bg-error text-white px-loose py-compact rounded-xl font-bold text-body-sm hover:opacity-80 transition-all flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">delete</span>Xóa vĩnh viễn
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
  }
};
