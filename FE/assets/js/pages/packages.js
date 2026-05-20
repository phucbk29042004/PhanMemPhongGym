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
            <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-standard shadow-sm flex items-center gap-loose hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div class="icon-bg ${s.iconBg}" style="width:48px;height:48px;border-radius:14px">
                <span class="material-symbols-outlined ${s.color} text-2xl" style="font-variation-settings:'FILL' 1">${s.icon}</span>
              </div>
              <div>
                <p class="text-on-surface-variant text-body-sm font-bold uppercase tracking-wider">${s.label}</p>
                <p class="${s.color} text-3xl font-bold tracking-tight">${s.value}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Cards gói tập -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-loose">
          ${packages.map(p => {
        const popularity = total > 0 ? Math.round(((p.so_nguoi_dang_ky || 0) / total) * 100) : 0;
        return `
              <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-sm overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <!-- Header card -->
                <div class="p-loose text-white relative overflow-hidden bg-brand-primary">
                  <div class="absolute top-0 right-0 w-24 h-24 opacity-10" style="background: radial-gradient(circle, white 0%, transparent 70%); transform: translate(20%, -20%)"></div>
                  <div class="flex items-start justify-between relative">
                    <div>
                      <p class="font-bold text-label-xs opacity-80 uppercase tracking-wider">Gói tập</p>
                      <h3 class="text-2xl font-bold mt-xs">${p.ten_goi}</h3>
                    </div>
                    <div class="icon-bg" style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.15)">
                      <span class="material-symbols-outlined text-white text-lg" style="font-variation-settings:'FILL' 1">card_membership</span>
                    </div>
                  </div>
                  <p class="text-3xl font-bold tracking-tight mt-standard">${window.GymApp.formatCurrency(p.gia)}</p>
                  <p class="text-body-sm font-medium opacity-75 mt-xs">${p.so_thang} tháng ${p.so_ngay_them ? '+ ' + p.so_ngay_them + ' ngày' : ''}</p>
                </div>

                <!-- Body card -->
                <div class="p-loose flex flex-col gap-standard flex-1">
                  <p class="text-on-surface-variant text-body-sm font-semibold">${p.mo_ta || 'Không có mô tả'}</p>

                  <!-- Popularity bar -->
                  <div>
                    <div class="flex items-center justify-between mb-xs">
                      <span class="text-on-surface-variant text-body-sm font-semibold">Mức độ phổ biến</span>
                      <span class="text-brand-primary font-bold text-body-sm">${popularity}%</span>
                    </div>
                    <div class="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all" style="width:${popularity}%;background:linear-gradient(90deg,#1D9336,#6fde76)"></div>
                    </div>
                  </div>

                  <div class="flex items-center justify-between mt-auto pt-standard border-t border-outline-variant/50">
                    <div class="flex items-center gap-xs text-on-surface-variant text-body-sm font-semibold">
                      <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">people</span>
                      <span class="font-bold">${p.so_nguoi_dang_ky || 0} hội viên</span>
                    </div>
                    ${window.GymApp.statusBadge('active')}
                  </div>
                </div>

                <!-- Footer card -->
                <div class="px-loose py-2 border-t border-outline-variant/50 flex items-center justify-end gap-1 bg-surface-container-low/10">
                  <button class="material-symbols-outlined text-outline hover:text-brand-primary text-lg p-1.5 rounded-lg hover:bg-brand-primary/10 transition-colors btn-edit-pkg" data-id="${p.id}" title="Chỉnh sửa">edit</button>
                  <button class="material-symbols-outlined text-outline hover:text-error text-lg p-1.5 rounded-lg hover:bg-error/10 transition-colors btn-del-pkg" data-id="${p.id}" data-name="${p.ten_goi}" data-count="${p.so_nguoi_dang_ky || 0}" title="Xóa">delete</button>
                </div>
              </div>
            `;
      }).join('')}
        </div>

        <!-- Bảng so sánh gói tập -->
        <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-sm overflow-hidden">
          <div class="section-header px-loose py-4 border-b border-outline-variant/50 flex items-center gap-compact bg-surface-container-low/20">
            <div class="icon-bg icon-bg-green">
              <span class="material-symbols-outlined text-brand-primary text-lg" style="font-variation-settings:'FILL' 1">compare_arrows</span>
            </div>
            <h3 class="font-bold text-on-surface text-body-lg">So sánh gói tập</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="h-10 border-b border-outline-variant/50 bg-surface-container-low/10">
                  <th class="px-loose font-bold text-label-bold text-on-surface-variant uppercase tracking-wider">Tên gói</th>
                  <th class="px-loose font-bold text-label-bold text-on-surface-variant uppercase tracking-wider">Giá</th>
                  <th class="px-loose font-bold text-label-bold text-on-surface-variant uppercase tracking-wider">Thời hạn</th>
                  <th class="px-loose font-bold text-label-bold text-on-surface-variant uppercase tracking-wider">Giá/ngày</th>
                  <th class="px-loose font-bold text-label-bold text-on-surface-variant uppercase tracking-wider">Hội viên</th>
                  <th class="px-loose font-bold text-label-bold text-on-surface-variant uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                ${packages.map(p => `
                  <tr class="h-11 border-b border-outline-variant/30 hover:bg-brand-primary/5 transition-colors">
                    <td class="px-loose font-bold text-on-surface text-body-md">${p.ten_goi}</td>
                    <td class="px-loose text-brand-primary font-bold text-body-md">${window.GymApp.formatCurrency(p.gia)}</td>
                    <td class="px-loose text-on-surface-variant text-body-sm font-semibold">${p.so_thang} tháng</td>
                    <td class="px-loose text-on-surface-variant text-body-sm font-semibold">${window.GymApp.formatCurrency(Math.round(p.gia / (p.so_thang * 30)))}</td>
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
    const self = this;
    document.getElementById('btn-add-pkg')?.addEventListener('click', () => self._openModal(null));

    document.querySelectorAll('.btn-edit-pkg').forEach(btn => {
      btn.addEventListener('click', () => {
        const pkg = (window.GymApp.data.packages || []).find(p => p.id == btn.dataset.id);
        if (pkg) self._openModal(pkg);
      });
    });

    document.querySelectorAll('.btn-del-pkg').forEach(btn => {
      btn.addEventListener('click', () => self._confirmDelete(btn.dataset.id, btn.dataset.name, parseInt(btn.dataset.count)));
    });
  },

  _openModal: function (pkg) {
    const self = this;
    const isEdit = !!pkg;
    document.getElementById('gym-pkg-modal')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'gym-pkg-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);padding:16px;';

    const field = (icon, label, fid, type, value, placeholder, required = false, isFull = false) => `
      <div class="${isFull ? 'col-span-full' : ''}">
        <label class="text-on-surface-variant text-body-sm uppercase font-bold tracking-wider block mb-1 opacity-80">${label}${required ? ' <span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>' : ''}</label>
        <div class="relative group">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-brand-primary transition-colors text-[18px]">${icon}</span>
          <input id="${fid}" type="${type}" value="${value || ''}" placeholder="${placeholder}" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface pl-10 pr-4 py-2.5 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-body-md font-medium transition-all" />
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

    overlay.innerHTML = `
      <div style="border-radius:24px;width:100%;max-width:560px;display:flex;flex-direction:column;box-shadow:0 30px 80px rgba(0,0,0,0.4);background:var(--bg-surface-lowest);">
        <div style="background:linear-gradient(135deg,#312e81 0%,#4338ca 60%,#6366f1 100%);padding:24px 24px 20px;flex-shrink:0;position:relative;overflow:hidden;border-top-left-radius:24px;border-top-right-radius:24px;">
          <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.07);"></div>
          <button id="close-pkg-modal" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.15);border:none;cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:50;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
            <span class="material-symbols-outlined" style="color:#fff;font-size:18px;">close</span>
          </button>
          <div style="display:flex;align-items:center;gap:16px;position:relative;z-index:1;">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style="background:rgba(255,255,255,0.15);backdrop-filter:blur(4px);border:2px solid rgba(255,255,255,0.4);">
              <span class="material-symbols-outlined text-white text-[28px]">${isEdit ? 'edit_document' : 'add_box'}</span>
            </div>
            <div>
              <span style="font-size:11px;font-weight:800;color:rgba(255,255,255,0.8);text-transform:uppercase;background:rgba(0,0,0,0.2);padding:3px 8px;border-radius:999px;">Quản lý Gói tập</span>
              <h3 style="font-size:22px;font-weight:800;color:#fff;margin:6px 0 2px;">${isEdit ? 'Chỉnh sửa gói tập' : 'Thêm gói tập mới'}</h3>
            </div>
          </div>
        </div>
        <div class="bg-surface-container-lowest overflow-y-auto p-loose">
          <div class="grid grid-cols-2 gap-x-standard gap-y-4">
            ${field('inventory_2', 'Tên gói', 'pkg-ten', 'text', pkg?.ten_goi || '', 'VD: Gói 1 tháng', true, true)}
            ${field('calendar_month', 'Số tháng', 'pkg-thang', 'number', pkg?.so_thang ?? '', 'VD: 1', true, false)}
            ${field('event_note', 'Ngày thêm', 'pkg-ngay', 'number', pkg?.so_ngay_them ?? 0, '0', false, false)}
            ${field('payments', 'Giá (VNĐ)', 'pkg-gia', 'text', pkg?.gia ? pkg.gia.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.') : '', 'VD: 300.000', true, true)}
            ${textareaField('description', 'Mô tả', 'pkg-mota', pkg?.mo_ta || '', 'Mô tả ngắn về gói tập...')}
          </div>
        </div>
        <div class="bg-surface-container-lowest px-loose py-standard border-t border-outline-variant flex gap-standard justify-end flex-shrink-0" style="border-bottom-left-radius:24px;border-bottom-right-radius:24px;">
          <button id="cancel-pkg-modal" class="px-loose py-2.5 rounded-xl border-2 border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-all active:scale-95">Hủy</button>
          <button id="save-pkg-modal" class="px-loose py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-xs active:scale-95 shadow-md hover:shadow-lg hover:opacity-90" style="background:#4338ca;">
            <span class="material-symbols-outlined text-sm">save</span>${isEdit ? 'Lưu thay đổi' : 'Tạo gói tập'}
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('close-pkg-modal').addEventListener('click', close);
    document.getElementById('cancel-pkg-modal').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    // Format giá tiền liên tục khi gõ theo định dạng VNĐ (300.000)
    const priceInput = document.getElementById('pkg-gia');
    if (priceInput) {
      priceInput.addEventListener('input', function () {
        let value = this.value.replace(/\D/g, '');
        this.value = value ? value.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
      });
    }

    document.getElementById('save-pkg-modal').addEventListener('click', async () => {
      const ten = document.getElementById('pkg-ten').value.trim();
      const thang = document.getElementById('pkg-thang').value;
      const ngay = document.getElementById('pkg-ngay').value || '0';
      const gia = document.getElementById('pkg-gia').value;
      const mota = document.getElementById('pkg-mota').value.trim();

      const rawGia = gia.replace(/\./g, '');

      if (!ten || thang === '' || rawGia === '') {
        window.GymApp.toast('Vui lòng điền đầy đủ tên gói, số tháng và giá!', 'error');
        return;
      }

      const btn = document.getElementById('save-pkg-modal');
      btn.disabled = true; btn.classList.add('opacity-50');

      try {
        const body = { ten_goi: ten, so_thang: parseInt(thang), so_ngay_them: parseInt(ngay), gia: parseInt(rawGia), mo_ta: mota };
        let res;
        if (isEdit) {
          res = await window.GymApp.api.put(`/packages/${pkg.id}`, body);
        } else {
          res = await window.GymApp.api.post('/packages', body);
        }
        if (res?.success) {
          window.GymApp.toast(isEdit ? 'Đã cập nhật gói tập!' : 'Đã tạo gói tập mới!', 'success');
          close();
          // Reload trang
          const pkgRes = await window.GymApp.api.get('/packages');
          if (pkgRes?.success) window.GymApp.data.packages = pkgRes.data || [];
          const content = document.getElementById('content-area');
          if (content) { content.innerHTML = self.render(); self.init(); }
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

  _confirmDelete: function (id, name, count) {
    const self = this;
    document.getElementById('gym-pkg-del-modal')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'gym-pkg-del-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);padding:16px;';
    overlay.innerHTML = `
      <div style="border-radius:24px;width:100%;max-width:440px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,0.4);" class="bg-surface-container-lowest">
        <div class="px-loose py-standard border-b border-outline-variant flex items-center gap-compact" style="background:linear-gradient(135deg,#991b1b,#dc2626);">
          <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-white text-xl">delete_forever</span>
          </div>
          <h3 class="font-bold text-white text-[17px]">Xác nhận xóa gói tập</h3>
        </div>
        <div class="p-loose bg-surface-container-lowest">
          <p class="text-on-surface text-body-md">Bạn có chắc chắn muốn xóa gói tập <strong class="text-error">${name}</strong> không?</p>
          ${count > 0 ? `<div class="mt-standard flex items-start gap-xs bg-error/10 p-compact rounded-xl border border-error/20"><span class="material-symbols-outlined text-error text-[18px]">info</span><p class="text-error text-body-sm font-medium m-0">Gói này có ${count} hội viên đang đăng ký. Gói sẽ chỉ bị ẩn (soft delete) để đảm bảo lịch sử hội viên, không xóa vĩnh viễn.</p></div>` : ''}
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
      btn.disabled = true; btn.classList.add('opacity-50');
      try {
        const res = await window.GymApp.api.delete(`/packages/${id}`);
        if (res?.success) {
          window.GymApp.toast('Đã xóa gói tập!', 'success');
          close();
          const pkgRes = await window.GymApp.api.get('/packages');
          if (pkgRes?.success) window.GymApp.data.packages = pkgRes.data || [];
          const content = document.getElementById('content-area');
          if (content) { content.innerHTML = self.render(); self.init(); }
        } else {
          window.GymApp.toast(res?.message || 'Có lỗi xảy ra!', 'error');
        }
      } catch (err) {
        window.GymApp.toast('Lỗi kết nối máy chủ!', 'error');
      } finally {
        btn.disabled = false; btn.classList.remove('opacity-50');
      }
    });
  }
};
