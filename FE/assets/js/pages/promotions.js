window.GymApp.pages['promotions'] = {
  promotions: [],
  showInactive: false,
  editingId: null,

  render: function () {
    return `
      <div class="flex flex-col gap-lg animate-fadeIn">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-standard">
          <div class="page-title-bar">
            <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Khuyến mãi</h2>
            <p class="text-on-surface-variant text-body-sm mt-xs">Tạo và quản lý các chương trình giảm giá theo % hoặc số tiền, áp dụng khi đăng ký gói tập</p>
          </div>
          <button id="btn-add-promo"
            class="flex items-center gap-xs px-5 py-2.5 rounded-xl bg-brand-primary text-white font-bold text-body-md hover:shadow-lg hover:shadow-brand-primary/20 active:scale-95 transition-all">
            <span class="material-symbols-outlined text-[16px]">add</span>
            Thêm khuyến mãi
          </button>
        </div>

        <!-- Filter -->
        <div class="flex items-center gap-2">
          <label class="flex items-center gap-2 cursor-pointer select-none text-body-sm text-on-surface-variant">
            <input type="checkbox" id="toggle-show-inactive" class="accent-brand-primary w-4 h-4 rounded" ${this.showInactive ? 'checked' : ''}>
            Hiển thị khuyến mãi hết hạn / tắt
          </label>
        </div>

        <!-- List -->
        <div id="promo-list" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-standard">
          <div class="col-span-full flex items-center justify-center py-10">
            <span class="material-symbols-outlined animate-spin text-brand-primary text-3xl">progress_activity</span>
          </div>
        </div>
      </div>

      <!-- Modal thêm/sửa khuyến mãi -->
      <div id="modal-promo" class="hidden fixed inset-0 z-[9100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
            <h3 id="modal-promo-title" class="font-bold text-on-surface text-headline">Thêm khuyến mãi</h3>
            <button id="btn-close-promo-modal" class="material-symbols-outlined text-on-surface-variant hover:text-error text-[22px] transition-colors">close</button>
          </div>
          <form id="form-promo" class="flex flex-col gap-4 p-6">
            <div>
              <label class="text-body-sm font-bold text-on-surface-variant block mb-1">Tên khuyến mãi <span class="text-error">*</span></label>
              <input id="promo-ten" type="text" placeholder="VD: Giảm 20% tháng 6" maxlength="100"
                class="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-body-md bg-surface text-on-surface focus:outline-none focus:border-brand-primary" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-body-sm font-bold text-on-surface-variant block mb-1">Loại giảm giá <span class="text-error">*</span></label>
                <select id="promo-loai"
                  class="w-full border border-outline-variant rounded-xl px-3 py-2.5 text-body-md bg-surface text-on-surface focus:outline-none focus:border-brand-primary">
                  <option value="phan_tram">Giảm %</option>
                  <option value="so_tien">Giảm số tiền</option>
                </select>
              </div>
              <div>
                <label class="text-body-sm font-bold text-on-surface-variant block mb-1">Giá trị <span class="text-error">*</span></label>
                <div class="relative">
                  <input id="promo-gia-tri" type="text" inputmode="numeric" placeholder="0"
                    class="w-full border border-outline-variant rounded-xl px-4 py-2.5 pr-12 text-body-md bg-surface text-on-surface focus:outline-none focus:border-brand-primary" />
                  <span id="promo-unit" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-body-sm font-bold">%</span>
                </div>
              </div>
            </div>
            <div>
              <label class="text-body-sm font-bold text-on-surface-variant block mb-1">Ngày hết hạn</label>
              <input id="promo-ngay-het-han" type="date"
                class="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-body-md bg-surface text-on-surface focus:outline-none focus:border-brand-primary" />
              <p class="text-body-sm text-on-surface-variant mt-1">Để trống = không giới hạn thời gian</p>
            </div>
            <div>
              <label class="text-body-sm font-bold text-on-surface-variant block mb-1">Mô tả</label>
              <textarea id="promo-mo-ta" rows="2" placeholder="Mô tả ngắn về chương trình..."
                class="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-body-md bg-surface text-on-surface focus:outline-none focus:border-brand-primary resize-none"></textarea>
            </div>
            <div class="flex items-center gap-3">
              <input type="checkbox" id="promo-is-active" class="accent-brand-primary w-4 h-4" checked>
              <label for="promo-is-active" class="text-body-md text-on-surface cursor-pointer">Đang hoạt động</label>
            </div>
          </form>
          <div class="flex gap-3 px-6 pb-5">
            <button id="btn-cancel-promo" class="flex-1 py-2.5 rounded-xl bg-surface-container-low text-on-surface-variant font-bold text-body-sm hover:bg-surface-container transition-all active:scale-95">Hủy</button>
            <button id="btn-save-promo" class="flex-1 py-2.5 rounded-xl bg-brand-primary text-white font-bold text-body-sm hover:shadow-lg hover:shadow-brand-primary/20 transition-all active:scale-95 flex items-center justify-center gap-xs">
              <span class="material-symbols-outlined text-[16px]">save</span> Lưu
            </button>
          </div>
        </div>
      </div>
    `;
  },

  init: async function () {
    await this._load();
    this._bindEvents();
  },

  _load: async function () {
    try {
      const params = this.showInactive ? '?include_expired=1' : '?active_only=0&include_expired=0';
      const res = await window.GymApp.api.get('/promotions' + params);
      if (res?.success) {
        this.promotions = res.data || [];
        this._renderList();
      }
    } catch (e) {
      window.GymApp.toast('Không thể tải danh sách khuyến mãi', 'error');
    }
  },

  _renderList: function () {
    const list = document.getElementById('promo-list');
    if (!list) return;
    const today = new Date().toLocaleDateString('sv-SE');

    if (this.promotions.length === 0) {
      list.innerHTML = `<div class="col-span-full text-center py-16 text-on-surface-variant">
        <span class="material-symbols-outlined text-5xl block mb-3 opacity-30">local_offer</span>
        <p class="font-bold text-body-lg">Chưa có khuyến mãi nào</p>
        <p class="text-body-sm mt-1">Bấm "Thêm khuyến mãi" để tạo chương trình giảm giá đầu tiên</p>
      </div>`;
      return;
    }

    list.innerHTML = this.promotions.map(p => {
      const isExpired = p.ngay_het_han && p.ngay_het_han < today;
      const isActive = p.is_active && !isExpired;

      const badgeClass = isActive
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
      const badgeText = isActive ? 'Đang áp dụng' : (isExpired ? 'Hết hạn' : 'Tắt');

      const valueDisplay = p.loai === 'phan_tram'
        ? `<span class="text-2xl font-black text-brand-primary">${p.gia_tri}%</span>`
        : `<span class="text-xl font-black text-brand-primary">${Number(p.gia_tri).toLocaleString('vi-VN')}đ</span>`;

      const typeLabel = p.loai === 'phan_tram' ? 'Giảm phần trăm' : 'Giảm trực tiếp';

      return `
        <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 ${isActive ? 'border-brand-primary/40' : 'border-outline-variant/50'} p-md shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3 relative overflow-hidden">
          ${isActive ? '<div class="absolute top-0 left-0 right-0 h-1 bg-brand-primary rounded-t-2xl"></div>' : ''}
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <p class="font-bold text-on-surface text-body-lg leading-snug truncate">${p.ten}</p>
              <p class="text-on-surface-variant text-body-sm mt-0.5">${typeLabel}</p>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 ${badgeClass}">${badgeText}</span>
          </div>

          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-brand-primary text-[20px]">local_offer</span>
            ${valueDisplay}
            ${p.loai === 'phan_tram' ? '<span class="text-on-surface-variant text-body-sm">giảm trên giá gói tập</span>' : '<span class="text-on-surface-variant text-body-sm">giảm trực tiếp</span>'}
          </div>

          ${p.mo_ta ? `<p class="text-body-sm text-on-surface-variant leading-relaxed border-t border-outline-variant/30 pt-2">${p.mo_ta}</p>` : ''}

          <div class="flex items-center justify-between border-t border-outline-variant/30 pt-2">
            <div class="flex items-center gap-1 text-body-sm text-on-surface-variant">
              <span class="material-symbols-outlined text-[14px]">event</span>
              ${p.ngay_het_han
                ? `Hết hạn: <strong class="${isExpired ? 'text-red-500' : 'text-on-surface'}">${new Date(p.ngay_het_han).toLocaleDateString('vi-VN')}</strong>`
                : 'Không giới hạn thời gian'
              }
            </div>
            <div class="flex items-center gap-1">
              <button class="btn-edit-promo p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-brand-primary transition-colors" data-id="${p.id}" title="Sửa">
                <span class="material-symbols-outlined text-[18px]">edit</span>
              </button>
              <button class="btn-delete-promo p-1.5 rounded-lg hover:bg-red-50 text-on-surface-variant hover:text-error transition-colors" data-id="${p.id}" title="Xóa">
                <span class="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind edit/delete
    list.querySelectorAll('.btn-edit-promo').forEach(btn => {
      btn.addEventListener('click', () => this._openEdit(Number(btn.dataset.id)));
    });
    list.querySelectorAll('.btn-delete-promo').forEach(btn => {
      btn.addEventListener('click', () => this._deletePromo(Number(btn.dataset.id)));
    });
  },

  _bindEvents: function () {
    document.getElementById('btn-add-promo')?.addEventListener('click', () => this._openAdd());
    document.getElementById('btn-close-promo-modal')?.addEventListener('click', () => this._closeModal());
    document.getElementById('btn-cancel-promo')?.addEventListener('click', () => this._closeModal());
    document.getElementById('btn-save-promo')?.addEventListener('click', () => this._save());
    document.getElementById('toggle-show-inactive')?.addEventListener('change', async (e) => {
      this.showInactive = e.target.checked;
      await this._load();
    });
    const fmtMoney = n => n > 0 ? new Intl.NumberFormat('vi-VN').format(n) : '';
    const parseMoney = s => parseInt(String(s || '').replace(/\./g, '').replace(/,/g, '')) || 0;

    const giaTriEl = document.getElementById('promo-gia-tri');
    const loaiEl = document.getElementById('promo-loai');

    const updateGiaTriFormat = () => {
      if (!giaTriEl || !loaiEl) return;
      if (loaiEl.value === 'so_tien') {
        giaTriEl.setAttribute('inputmode', 'numeric');
        // Format nếu đang có giá trị
        const raw = parseMoney(giaTriEl.value);
        if (raw > 0) giaTriEl.value = fmtMoney(raw);
      } else {
        // phan_tram: chỉ số nguyên, xóa dấu chấm nếu có
        giaTriEl.setAttribute('inputmode', 'numeric');
        const raw = parseMoney(giaTriEl.value);
        if (raw > 0) giaTriEl.value = String(raw);
      }
    };

    loaiEl?.addEventListener('change', (e) => {
      const unit = document.getElementById('promo-unit');
      if (unit) unit.textContent = e.target.value === 'phan_tram' ? '%' : 'đ';
      giaTriEl.value = '';
      updateGiaTriFormat();
    });

    giaTriEl?.addEventListener('focus', function () {
      if (loaiEl?.value === 'so_tien') {
        const raw = parseMoney(this.value);
        this.value = raw > 0 ? String(raw) : '';
      }
    });
    giaTriEl?.addEventListener('blur', function () {
      if (loaiEl?.value === 'so_tien') {
        const raw = parseMoney(this.value);
        this.value = raw > 0 ? fmtMoney(raw) : '';
      }
    });
    giaTriEl?.addEventListener('input', function () {
      if (loaiEl?.value === 'so_tien') {
        // Chỉ giữ chữ số
        const pos = this.selectionStart;
        const digits = this.value.replace(/\D/g, '');
        this.value = digits ? fmtMoney(Number(digits)) : '';
        // Khôi phục cursor cuối
        try { this.setSelectionRange(this.value.length, this.value.length); } catch(e) {}
      } else {
        // phan_tram: chỉ số nguyên
        this.value = this.value.replace(/\D/g, '');
      }
    });
    // Đã vô hiệu hóa click backdrop đóng modal
  },

  _openAdd: function () {
    this.editingId = null;
    document.getElementById('modal-promo-title').textContent = 'Thêm khuyến mãi';
    document.getElementById('promo-ten').value = '';
    document.getElementById('promo-loai').value = 'phan_tram';
    document.getElementById('promo-gia-tri').value = '';
    document.getElementById('promo-ngay-het-han').value = '';
    document.getElementById('promo-mo-ta').value = '';
    document.getElementById('promo-is-active').checked = true;
    document.getElementById('promo-unit').textContent = '%';
    document.getElementById('modal-promo').classList.remove('hidden');
  },

  _openEdit: function (id) {
    const p = this.promotions.find(x => x.id === id);
    if (!p) return;
    this.editingId = id;
    document.getElementById('modal-promo-title').textContent = 'Sửa khuyến mãi';
    document.getElementById('promo-ten').value = p.ten || '';
    document.getElementById('promo-loai').value = p.loai || 'phan_tram';
    document.getElementById('promo-ngay-het-han').value = p.ngay_het_han || '';
    document.getElementById('promo-mo-ta').value = p.mo_ta || '';
    document.getElementById('promo-is-active').checked = !!p.is_active;
    document.getElementById('promo-unit').textContent = p.loai === 'phan_tram' ? '%' : 'đ';
    const giaTriDisplay = p.loai === 'so_tien'
      ? (p.gia_tri > 0 ? new Intl.NumberFormat('vi-VN').format(p.gia_tri) : '')
      : (p.gia_tri || '');
    document.getElementById('promo-gia-tri').value = giaTriDisplay;
    document.getElementById('modal-promo').classList.remove('hidden');
  },

  _closeModal: function () {
    document.getElementById('modal-promo').classList.add('hidden');
    this.editingId = null;
  },

  _save: async function () {
    const ten = document.getElementById('promo-ten').value.trim();
    const loai = document.getElementById('promo-loai').value;
    const giaTriRaw = document.getElementById('promo-gia-tri').value;
    const gia_tri = loai === 'so_tien'
      ? parseInt(String(giaTriRaw).replace(/\./g, '').replace(/,/g, '')) || 0
      : Number(giaTriRaw);
    const ngay_het_han = document.getElementById('promo-ngay-het-han').value || null;
    const mo_ta = document.getElementById('promo-mo-ta').value.trim();
    const is_active = document.getElementById('promo-is-active').checked;

    if (!ten) return window.GymApp.toast('Vui lòng nhập tên khuyến mãi', 'error');
    if (!gia_tri || gia_tri <= 0) return window.GymApp.toast('Giá trị giảm phải lớn hơn 0', 'error');
    if (loai === 'phan_tram' && gia_tri > 100) return window.GymApp.toast('Giảm % không được vượt quá 100%', 'error');

    const btn = document.getElementById('btn-save-promo');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Đang lưu...';

    try {
      const body = { ten, loai, gia_tri, ngay_het_han, mo_ta: mo_ta || null, is_active };
      const res = this.editingId
        ? await window.GymApp.api.put(`/promotions/${this.editingId}`, body)
        : await window.GymApp.api.post('/promotions', body);

      if (res?.success) {
        window.GymApp.toast(this.editingId ? 'Đã cập nhật khuyến mãi' : 'Đã tạo khuyến mãi mới', 'success');
        this._closeModal();
        await this._load();
      } else {
        window.GymApp.toast(res?.message || 'Lỗi khi lưu', 'error');
      }
    } catch (e) {
      window.GymApp.toast('Lỗi kết nối máy chủ', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">save</span> Lưu';
    }
  },

  _deletePromo: async function (id) {
    const p = this.promotions.find(x => x.id === id);
    if (!p) return;
    if (!confirm(`Xóa khuyến mãi "${p.ten}"? Hành động này không thể hoàn tác.`)) return;

    try {
      const res = await window.GymApp.api.delete(`/promotions/${id}`);
      if (res?.success) {
        window.GymApp.toast('Đã xóa khuyến mãi', 'success');
        await this._load();
      } else {
        window.GymApp.toast(res?.message || 'Lỗi khi xóa', 'error');
      }
    } catch (e) {
      window.GymApp.toast('Lỗi kết nối máy chủ', 'error');
    }
  },
};
