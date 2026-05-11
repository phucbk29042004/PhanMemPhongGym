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
                  <button class="material-symbols-outlined text-outline hover:text-brand-primary text-xl p-atom rounded-lg hover:bg-surface-container transition-colors btn-edit-pkg" data-id="${p.id}" title="Chỉnh sửa">edit</button>
                  <button class="material-symbols-outlined text-outline hover:text-error text-xl p-atom rounded-lg hover:bg-error-container transition-colors btn-del-pkg" data-id="${p.id}" data-name="${p.ten_goi}" data-count="${p.so_nguoi_dang_ky || 0}" title="Xóa">delete</button>
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
    overlay.innerHTML = `
      <div style="border-radius:16px;width:100%;max-width:480px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.3);position:relative;">
        <div class="bg-surface-container-lowest px-loose py-standard border-b border-outline-variant flex items-center justify-between">
          <h3 class="font-bold text-on-surface" style="font-size:18px">${isEdit ? 'Chỉnh sửa gói tập' : 'Thêm gói tập mới'}</h3>
          <button id="close-pkg-modal" style="background:transparent;border:none;cursor:pointer;">
            <span class="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div class="bg-surface-container-lowest p-loose flex flex-col gap-standard">
          <div>
            <label class="text-on-surface-variant text-body-sm font-bold block mb-xs">Tên gói <span class="text-error">*</span></label>
            <input id="pkg-ten" type="text" value="${pkg?.ten_goi || ''}" placeholder="VD: Gói 1 tháng" class="w-full bg-surface-container border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none text-body-md" />
          </div>
          <div class="grid grid-cols-2 gap-standard">
            <div>
              <label class="text-on-surface-variant text-body-sm font-bold block mb-xs">Số tháng <span class="text-error">*</span></label>
              <input id="pkg-thang" type="number" min="0" value="${pkg?.so_thang ?? ''}" placeholder="VD: 1" class="w-full bg-surface-container border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none text-body-md" />
            </div>
            <div>
              <label class="text-on-surface-variant text-body-sm font-bold block mb-xs">Ngày thêm</label>
              <input id="pkg-ngay" type="number" min="0" value="${pkg?.so_ngay_them ?? 0}" placeholder="0" class="w-full bg-surface-container border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none text-body-md" />
            </div>
          </div>
          <div>
            <label class="text-on-surface-variant text-body-sm font-bold block mb-xs">Giá (VNĐ) <span class="text-error">*</span></label>
            <input id="pkg-gia" type="number" min="0" value="${pkg?.gia ?? ''}" placeholder="VD: 300000" class="w-full bg-surface-container border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none text-body-md" />
          </div>
          <div>
            <label class="text-on-surface-variant text-body-sm font-bold block mb-xs">Mô tả</label>
            <textarea id="pkg-mota" rows="2" placeholder="Mô tả ngắn về gói tập..." class="w-full bg-surface-container border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none text-body-md resize-none">${pkg?.mo_ta || ''}</textarea>
          </div>
          <div class="flex gap-standard justify-end pt-xs border-t border-outline-variant mt-xs">
            <button id="cancel-pkg-modal" class="px-loose py-compact rounded-xl font-bold text-body-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all">Hủy</button>
            <button id="save-pkg-modal" class="bg-brand-primary text-white px-loose py-compact rounded-xl font-bold text-body-sm hover:bg-primary-container transition-all flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">save</span>${isEdit ? 'Lưu thay đổi' : 'Tạo gói tập'}
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('close-pkg-modal').addEventListener('click', close);
    document.getElementById('cancel-pkg-modal').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('save-pkg-modal').addEventListener('click', async () => {
      const ten = document.getElementById('pkg-ten').value.trim();
      const thang = document.getElementById('pkg-thang').value;
      const ngay = document.getElementById('pkg-ngay').value || '0';
      const gia = document.getElementById('pkg-gia').value;
      const mota = document.getElementById('pkg-mota').value.trim();

      if (!ten || thang === '' || gia === '') {
        window.GymApp.toast('Vui lòng điền đầy đủ tên gói, số tháng và giá!', 'error');
        return;
      }

      const btn = document.getElementById('save-pkg-modal');
      btn.disabled = true; btn.classList.add('opacity-50');

      try {
        const body = { ten_goi: ten, so_thang: parseInt(thang), so_ngay_them: parseInt(ngay), gia: parseInt(gia), mo_ta: mota };
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
      <div style="border-radius:16px;width:100%;max-width:400px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.3);" class="bg-surface-container-lowest">
        <div class="px-loose py-standard border-b border-outline-variant flex items-center gap-compact">
          <span class="material-symbols-outlined text-error text-2xl">warning</span>
          <h3 class="font-bold text-on-surface">Xác nhận xóa gói tập</h3>
        </div>
        <div class="p-loose">
          <p class="text-on-surface text-body-md">Bạn có chắc muốn xóa <strong>${name}</strong>?</p>
          ${count > 0 ? `<p class="text-[#e65100] text-body-sm mt-xs font-bold">Gói này có ${count} hội viên đang đăng ký — sẽ bị ẩn (soft delete), không xóa hẳn.</p>` : ''}
          <div class="flex gap-standard justify-end mt-loose">
            <button id="cancel-pkg-del" class="px-loose py-compact rounded-xl font-bold text-body-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all">Hủy</button>
            <button id="confirm-pkg-del" class="bg-error text-white px-loose py-compact rounded-xl font-bold text-body-sm hover:opacity-80 transition-all flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">delete</span>Xóa
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
