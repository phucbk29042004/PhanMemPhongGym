window.GymApp.pages['member-add'] = {
  _activeTab: 'register', // 'register' | 'package'

  render: function () {
    return `
      <div class="flex flex-col gap-compact w-full xl:w-[90%] max-w-none mx-auto">

        <!-- Header -->
        <div class="flex items-center gap-standard">
          <button class="flex items-center gap-xs text-on-surface-variant hover:text-brand-primary transition-colors" data-page="members-list">
            <span class="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h2 class="font-display-2xl text-display-2xl text-on-surface font-bold">Thêm mới hội viên</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm">Điền đầy đủ thông tin để tạo hồ sơ hội viên</p>
          </div>
        </div>

        <!-- Tab Switcher -->
        <div class="flex gap-xs bg-surface-container p-xs rounded-xl border border-outline-variant w-fit">
          <button id="tab-register" class="tab-btn px-loose py-compact rounded-lg font-bold text-body-md transition-all bg-surface-container-lowest text-brand-primary shadow-sm">
            <span class="flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">person_add</span>
              Đăng ký hội viên
            </span>
          </button>
          <button id="tab-package" class="tab-btn px-loose py-compact rounded-lg font-bold text-body-md transition-all text-on-surface-variant hover:text-brand-primary">
            <span class="flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">card_membership</span>
              Đăng ký gói tập
            </span>
          </button>
        </div>

        <!-- Form Đăng ký hội viên -->
        <div id="form-register">
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-compact md:p-standard">

            <!-- Avatar Upload -->
            <div class="flex items-start gap-compact mb-compact">
              <div class="flex flex-col items-center gap-xs flex-shrink-0">
                <div class="relative">
                  <div id="avatar-area-reg" class="w-20 h-20 md:w-24 md:h-24 bg-surface-container-low border-2 border-dashed border-outline-variant rounded-xl flex items-center justify-center cursor-pointer overflow-hidden">
                    <span class="material-symbols-outlined text-outline text-4xl" id="avatar-placeholder-reg">person</span>
                    <img id="avatar-preview-reg" class="w-full h-full object-cover absolute inset-0 hidden" alt="preview" />
                  </div>
                  <button type="button" id="avatar-btn-reg" class="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center shadow-md hover:bg-[#187a2d] transition-colors z-10">
                    <span class="material-symbols-outlined text-white text-sm">photo_camera</span>
                  </button>
                  <input type="file" id="avatar-input-reg" class="hidden" accept="image/*" />
                </div>
                <span class="text-on-surface-variant text-body-sm text-center">Ảnh đại diện</span>
              </div>

              <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-compact">
                ${this._field('Mã hội viên', 'reg-id', 'text', 'Tự động tạo', 'Mã hội viên sẽ tự sinh bởi hệ thống', true)}
                ${this._field('Họ và tên', 'reg-name', 'text', 'Nhập họ và tên đầy đủ')}
              </div>
            </div>

            <!-- Thông tin cá nhân -->
            <div class="mb-compact">
              <h3 class="font-bold text-on-surface text-body-md mb-xs flex items-center gap-xs">
                <span class="material-symbols-outlined text-brand-primary text-sm">badge</span>
                Thông tin cá nhân
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-compact">
                ${this._field('Ngày sinh', 'reg-dob', 'date')}
                ${this._select('Giới tính', 'reg-gender', ['Nam','Nữ','Khác'])}
                ${this._field('Số điện thoại', 'reg-phone', 'tel', '0901234567')}
                ${this._field('Email', 'reg-email', 'email', 'email@example.com')}
                ${this._select('Chi nhánh', 'reg-branch', ['Chi nhánh Q1','Chi nhánh Q3','Chi nhánh Q7'])}
                ${this._select('Phòng tập', 'reg-gym', ['Phòng tập chính','Phòng tập 2','Phòng tập 3'])}
                ${this._select('Loại hồ sơ', 'reg-type', ['Thường','VIP','Student'])}
                ${this._field('Nơi sinh', 'reg-birthplace', 'text', 'TP.HCM')}
              </div>
            </div>

            <!-- Địa chỉ -->
            <div class="mb-compact">
              <h3 class="font-bold text-on-surface text-body-md mb-xs flex items-center gap-xs">
                <span class="material-symbols-outlined text-brand-primary text-sm">location_on</span>
                Địa chỉ thường trú
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-compact">
                ${this._select('Tỉnh / Thành phố', 'reg-province', ['TP.HCM','Hà Nội','Đà Nẵng','Cần Thơ','Bình Dương'])}
                ${this._select('Quận / Huyện', 'reg-district', ['Quận 1','Quận 3','Quận 7','Quận Bình Thạnh','Quận Tân Bình'])}
                ${this._select('Phường / Xã', 'reg-ward', ['Phường Bến Nghé','Phường Đa Kao','Phường Phạm Ngũ Lão','Phường 5','Phường 7'])}
                ${this._field('Số nhà / Đường', 'reg-address', 'text', '123 Nguyễn Huệ')}
              </div>
            </div>

            <!-- Nút lưu -->
            <div class="flex justify-end gap-compact pt-compact border-t border-outline-variant">
              <button type="button" class="px-loose py-compact rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors font-body-md" data-page="members-list">
                Hủy bỏ
              </button>
              <button type="button" id="btn-save-member" class="bg-brand-primary text-white px-loose py-compact rounded-lg font-bold hover:bg-[#187a2d] transition-all flex items-center gap-compact shadow-sm">
                <span class="material-symbols-outlined text-sm">save</span>
                Lưu hội viên
              </button>
            </div>
          </div>
        </div>

        <!-- Form Đăng ký gói tập -->
        <div id="form-package" class="hidden">
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-compact md:p-standard">

            <!-- Avatar Upload -->
            <div class="flex items-start gap-compact mb-compact">
              <div class="flex flex-col items-center gap-xs flex-shrink-0">
                <div class="relative">
                  <div id="avatar-area-pkg" class="w-20 h-20 md:w-24 md:h-24 bg-surface-container-low border-2 border-dashed border-outline-variant rounded-xl flex items-center justify-center cursor-pointer overflow-hidden">
                    <span class="material-symbols-outlined text-outline text-4xl" id="avatar-placeholder-pkg">person</span>
                    <img id="avatar-preview-pkg" class="w-full h-full object-cover absolute inset-0 hidden" alt="preview" />
                  </div>
                  <button type="button" id="avatar-btn-pkg" class="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center shadow-md hover:bg-[#187a2d] transition-colors z-10">
                    <span class="material-symbols-outlined text-white text-sm">photo_camera</span>
                  </button>
                  <input type="file" id="avatar-input-pkg" class="hidden" accept="image/*" />
                </div>
                <span class="text-on-surface-variant text-body-sm text-center">Ảnh đại diện</span>
              </div>

              <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-compact">
                <div>
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Tên gói tập</label>
                  <select class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-lg focus:border-brand-primary outline-none font-body-md text-body-md">
                    ${window.GymApp.data.packages.map(p => `<option value="${p.id}">${p.name} — ${window.GymApp.formatCurrency(p.price)}</option>`).join('')}
                  </select>
                </div>
                ${this._field('Giá gói tập', 'pkg-price', 'text', '1,300,000 đ', '', true)}
              </div>
            </div>

            <!-- Thông tin đăng ký -->
            <div class="mb-compact">
              <h3 class="font-bold text-on-surface text-body-md mb-xs flex items-center gap-xs">
                <span class="material-symbols-outlined text-brand-primary text-sm">event</span>
                Thông tin đăng ký
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-compact">
                ${this._field('Từ ngày', 'pkg-from', 'date')}
                ${this._field('Đến ngày', 'pkg-to', 'date')}
                ${this._select('Trạng thái đăng ký', 'pkg-status', ['Đã thanh toán','Đang xử lý','Chờ thanh toán'])}
                ${this._field('Mã giảm giá', 'pkg-coupon', 'text', 'GYM2026')}
              </div>
            </div>

            <!-- Thanh toán -->
            <div class="mb-compact">
              <h3 class="font-bold text-on-surface text-body-md mb-xs flex items-center gap-xs">
                <span class="material-symbols-outlined text-brand-primary text-sm">payments</span>
                Thông tin thanh toán
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-compact">
                ${this._field('Cần thanh toán', 'pkg-total', 'text', '1,300,000 đ', '', true)}
                ${this._field('Tiền khách đưa', 'pkg-paid', 'text', 'Nhập số tiền')}
                ${this._field('Ngày thanh toán', 'pkg-pay-date', 'date')}
                ${this._field('Khách nợ', 'pkg-debt', 'text', '0 đ', '', true)}
                <div class="md:col-span-2 xl:col-span-4">
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Ghi chú</label>
                  <textarea id="pkg-notes" rows="1" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-lg focus:border-brand-primary outline-none font-body-md text-body-md resize-none" placeholder="Ghi chú thêm..."></textarea>
                </div>
              </div>
            </div>

            <!-- Nút lưu -->
            <div class="flex justify-end gap-compact pt-compact border-t border-outline-variant">
              <button type="button" class="px-loose py-compact rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors font-body-md" data-page="members-list">
                Hủy bỏ
              </button>
              <button type="button" id="btn-save-package" class="bg-brand-primary text-white px-loose py-compact rounded-lg font-bold hover:bg-[#187a2d] transition-all flex items-center gap-compact shadow-sm">
                <span class="material-symbols-outlined text-sm">save</span>
                Lưu đăng ký
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
  },

  _field: function (label, id, type, placeholder = '', hint = '', readonly = false) {
    return `
      <div>
        <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">${label}</label>
        <input
          id="${id}" type="${type}"
          placeholder="${placeholder}"
          ${readonly ? 'readonly class="w-full bg-surface-container border border-outline-variant text-on-surface-variant px-standard py-compact rounded-lg outline-none font-body-md text-body-md cursor-not-allowed"' : 'class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-lg focus:border-brand-primary outline-none font-body-md text-body-md"'}
        />
        ${hint ? `<p class="text-body-sm text-on-surface-variant mt-xs">${hint}</p>` : ''}
      </div>
    `;
  },

  _select: function (label, id, options) {
    return `
      <div>
        <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">${label}</label>
        <select id="${id}" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-lg focus:border-brand-primary outline-none font-body-md text-body-md">
          <option value="">— Chọn ${label.toLowerCase()} —</option>
          ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
        </select>
      </div>
    `;
  },

  _setupAvatarUpload: function (btnId, inputId, previewId, placeholderId, areaId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const placeholder = document.getElementById(placeholderId);
    const area = document.getElementById(areaId);
    if (!btn || !input) return;
    const trigger = () => input.click();
    btn.addEventListener('click', trigger);
    area.addEventListener('click', trigger);
    input.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        preview.src = ev.target.result;
        preview.classList.remove('hidden');
        placeholder.classList.add('hidden');
      };
      reader.readAsDataURL(file);
    });
  },

  init: function () {
    const self = this;

    // Tab switching
    document.getElementById('tab-register')?.addEventListener('click', () => {
      document.getElementById('form-register').classList.remove('hidden');
      document.getElementById('form-package').classList.add('hidden');
      document.getElementById('tab-register').className = 'tab-btn px-loose py-compact rounded-lg font-bold text-body-md transition-all bg-surface-container-lowest text-brand-primary shadow-sm';
      document.getElementById('tab-package').className = 'tab-btn px-loose py-compact rounded-lg font-bold text-body-md transition-all text-on-surface-variant hover:text-brand-primary';
    });
    document.getElementById('tab-package')?.addEventListener('click', () => {
      document.getElementById('form-package').classList.remove('hidden');
      document.getElementById('form-register').classList.add('hidden');
      document.getElementById('tab-package').className = 'tab-btn px-loose py-compact rounded-lg font-bold text-body-md transition-all bg-surface-container-lowest text-brand-primary shadow-sm';
      document.getElementById('tab-register').className = 'tab-btn px-loose py-compact rounded-lg font-bold text-body-md transition-all text-on-surface-variant hover:text-brand-primary';
    });

    // Avatar uploads
    self._setupAvatarUpload('avatar-btn-reg','avatar-input-reg','avatar-preview-reg','avatar-placeholder-reg','avatar-area-reg');
    self._setupAvatarUpload('avatar-btn-pkg','avatar-input-pkg','avatar-preview-pkg','avatar-placeholder-pkg','avatar-area-pkg');

    // Auto-generate member ID
    const newId = 'HV-' + String(window.GymApp.data.members.length + 1).padStart(3, '0');
    const idField = document.getElementById('reg-id');
    if (idField) idField.value = newId;

    // Lưu hội viên
    document.getElementById('btn-save-member')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-save-member');
      const name = document.getElementById('reg-name')?.value.trim();
      if (!name) { window.GymApp.toast('Vui lòng nhập họ và tên!', 'error'); return; }

      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span> Đang lưu...';

      try {
        const data = {
          ho_ten: name,
          ngay_sinh: document.getElementById('reg-dob')?.value,
          gioi_tinh: document.getElementById('reg-gender')?.value === 'Nam' ? 'male' : 'female',
          so_dien_thoai: document.getElementById('reg-phone')?.value,
          email: document.getElementById('reg-email')?.value,
          dia_chi: document.getElementById('reg-address')?.value,
          loai_ho_so: 'hv'
        };

        // TODO: Handle avatar upload if needed
        const res = await window.GymApp.api.post('/members', data);

        if (res && res.success) {
          window.GymApp.toast('Đã lưu hội viên thành công!', 'success');
          // Refresh global data
          await window.GymApp.fetchInitialData();
          // Navigate back
          window.GymApp.navigateTo('members-list');
        } else {
          window.GymApp.toast(res.message || 'Lỗi khi lưu hội viên', 'error');
        }
      } catch (err) {
        console.error('Save member error:', err);
        window.GymApp.toast('Không thể kết nối máy chủ', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">save</span> Lưu hội viên';
      }
    });

    // Lưu gói tập
    document.getElementById('btn-save-package')?.addEventListener('click', () => {
      window.GymApp.toast('Đã lưu đăng ký gói tập!', 'success');
    });

    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const pkgFrom = document.getElementById('pkg-from');
    const pkgPayDate = document.getElementById('pkg-pay-date');
    if (pkgFrom) pkgFrom.value = today;
    if (pkgPayDate) pkgPayDate.value = today;
  }
};
