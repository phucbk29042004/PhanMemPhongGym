window.GymApp.pages['member-add'] = {
  _activeTab: 'register',
  _provinces: [], _districts: [], _wards: [],

  render: function () {
    return `
      <div class="flex flex-col gap-compact w-full xl:w-[90%] max-w-none mx-auto">
        <!-- Header -->
        <div class="flex items-center gap-standard">
          <button class="flex items-center gap-xs text-on-surface-variant hover:text-brand-primary transition-colors" data-page="members-list">
            <span class="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h2 class="font-display-2xl text-display-2xl text-on-surface font-bold">Quản lý Hồ sơ mới</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm">Đăng ký Hội viên, PT hoặc Nhân viên mới</p>
          </div>
        </div>

        <!-- Tab Switcher -->
        <div class="flex gap-xs bg-surface-container p-xs rounded-xl border border-outline-variant w-fit">
          <button id="tab-register" class="tab-btn px-loose py-compact rounded-lg font-bold text-body-md transition-all bg-surface-container-lowest text-brand-primary shadow-sm">
            <span class="flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">person_add</span>
              Thông tin hồ sơ
            </span>
          </button>
          <button id="tab-package" class="tab-btn px-loose py-compact rounded-lg font-bold text-body-md transition-all text-on-surface-variant hover:text-brand-primary">
            <span class="flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">card_membership</span>
              Gói tập (Hội viên)
            </span>
          </button>
        </div>

        <div id="form-register">
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-compact md:p-standard">
            
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
              </div>

              <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-compact">
                ${this._field('Mã số hồ sơ', 'reg-ma-ho-so', 'text', 'Tự động...', '', true)}
                ${this._field('Họ và tên *', 'reg-ho-ten', 'text', 'Nhập họ và tên đầy đủ')}
                ${this._select('Loại hồ sơ *', 'reg-loai-ho-so', [
                  {v:'hoi_vien', t:'Hội viên'}, 
                  {v:'pt', t:'Huấn luyện viên (PT)'}, 
                  {v:'nhan_vien', t:'Nhân viên'}
                ])}
              </div>
            </div>

            <!-- Trường thông tin đặc thù -->
            <div id="extra-fields" class="mb-compact grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-compact border-y border-outline-variant/30 py-compact hidden">
                <!-- Sẽ nạp động qua JS -->
            </div>

            <div class="mb-compact">
              <h3 class="font-bold text-on-surface text-body-md mb-xs flex items-center gap-xs">
                <span class="material-symbols-outlined text-brand-primary text-sm">badge</span>
                Thông tin cá nhân
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-compact">
                ${this._field('Ngày sinh', 'reg-ngay-sinh', 'date')}
                ${this._select('Giới tính', 'reg-gioi-tinh', [{v:'nam',t:'Nam'},{v:'nu',t:'Nữ'},{v:'khac',t:'Khác'}])}
                ${this._field('Số điện thoại *', 'reg-so-dien-thoai', 'tel', '09xxx')}
                ${this._field('Email', 'reg-email', 'email')}
                ${this._field('CCCD / CMND', 'reg-cccd', 'text')}
                ${this._field('Nơi sinh', 'reg-noi-sinh', 'text')}
                ${this._field('Quê quán', 'reg-que-quan', 'text')}
                ${this._select('Chi nhánh', 'reg-chi-nhanh', [{v:'CN1',t:'Chi nhánh 1'},{v:'CN2',t:'Chi nhánh 2'}])}
              </div>
            </div>

            <div class="mb-compact">
              <h3 class="font-bold text-on-surface text-body-md mb-xs flex items-center gap-xs">
                <span class="material-symbols-outlined text-brand-primary text-sm">location_on</span>
                Địa chỉ thường trú
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-compact">
                ${this._select('Tỉnh / Thành phố', 'reg-tinh-thanh', [])}
                ${this._select('Quận / Huyện', 'reg-quan-huyen', [])}
                ${this._select('Phường / Xã', 'reg-phuong-xa', [])}
                ${this._field('Số nhà / Đường', 'reg-dia-chi', 'text', '123 Đường...')}
              </div>
            </div>

            <div class="flex justify-end gap-compact pt-compact border-t border-outline-variant">
              <button type="button" class="px-loose py-compact rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors" data-page="members-list">Hủy</button>
              <button type="button" id="btn-save-member" class="bg-brand-primary text-white px-loose py-compact rounded-lg font-bold hover:bg-[#187a2d] shadow-sm flex items-center gap-compact">
                <span class="material-symbols-outlined text-sm">save</span>
                Lưu hồ sơ
              </button>
            </div>
          </div>
        </div>

        <div id="form-package" class="hidden">
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-compact md:p-standard">
            <!-- Chọn gói tập -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-compact mb-compact">
              <div>
                <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Chọn gói tập</label>
                <select id="pkg-select" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-lg focus:border-brand-primary outline-none">
                  <option value="">— Chọn gói tập —</option>
                  ${(window.GymApp.data.packages || []).map(p => `<option value="${p.id}">${p.ten_goi} — ${window.GymApp.formatCurrency(p.gia)}</option>`).join('')}
                </select>
              </div>
              ${this._field('Giá gói tập (VNĐ)', 'pkg-price', 'text', '0', '', true)}
            </div>

            <!-- Thông tin đăng ký -->
            <div class="mb-compact">
              <h3 class="font-bold text-on-surface text-body-md mb-xs flex items-center gap-xs">
                <span class="material-symbols-outlined text-brand-primary text-sm">event</span>
                Thời hạn gói tập
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-compact">
                ${this._field('Từ ngày', 'pkg-from', 'date')}
                ${this._field('Đến ngày', 'pkg-to', 'date')}
                ${this._select('Trạng thái', 'pkg-status', [{v:'dang_hoat_dong',t:'Kích hoạt ngay'},{v:'cho_kich_hoat',t:'Chờ kích hoạt'}])}
                ${this._field('Mã giảm giá', 'pkg-coupon', 'text', 'GYM2026')}
              </div>
            </div>

            <!-- Thanh toán -->
            <div class="mb-compact">
              <h3 class="font-bold text-on-surface text-body-md mb-xs flex items-center gap-xs">
                <span class="material-symbols-outlined text-brand-primary text-sm">payments</span>
                Thanh toán
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-compact">
                ${this._field('Tổng tiền', 'pkg-total', 'text', '0', '', true)}
                ${this._field('Tiền khách trả', 'pkg-paid', 'text', 'Nhập số tiền')}
                ${this._field('Ngày thu', 'pkg-pay-date', 'date')}
                ${this._select('Phương thức', 'pkg-method', [{v:'tien_mat',t:'Tiền mặt'},{v:'chuyen_khoan',t:'Chuyển khoản'}])}
              </div>
            </div>

            <div class="flex justify-end gap-compact pt-compact border-t border-outline-variant">
              <button type="button" class="px-loose py-compact rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors" data-page="members-list">Hủy</button>
              <button type="button" id="btn-save-package" class="bg-brand-primary text-white px-loose py-compact rounded-lg font-bold hover:bg-[#187a2d] shadow-sm flex items-center gap-compact">
                <span class="material-symbols-outlined text-sm">save</span>
                Lưu đăng ký gói
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _field: function (label, id, type, placeholder = '', hint = '', readonly = false) {
    return `<div>
      <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">${label}</label>
      <input id="${id}" type="${type}" placeholder="${placeholder}" ${readonly ? 'readonly class="w-full bg-surface-container border border-outline-variant text-on-surface-variant px-standard py-compact rounded-lg outline-none cursor-not-allowed"' : 'class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-lg focus:border-brand-primary outline-none"'} />
    </div>`;
  },

  _select: function (label, id, options) {
    return `<div>
      <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">${label}</label>
      <select id="${id}" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-lg focus:border-brand-primary outline-none">
        <option value="">— ${label} —</option>
        ${options.map(o => `<option value="${o.v}">${o.t}</option>`).join('')}
      </select>
    </div>`;
  },

  init: async function () {
    const self = this;
    const typeSelect = document.getElementById('reg-loai-ho-so');
    const extraFields = document.getElementById('extra-fields');

    // 1. Tải dữ liệu địa chính
    try {
      const [pRes, dRes, wRes] = await Promise.all([
        fetch('assets/data/provinces.json').then(r => r.json()),
        fetch('assets/data/districts.json').then(r => r.json()),
        fetch('assets/data/wards.json').then(r => r.json())
      ]);
      self._provinces = pRes; self._districts = dRes; self._wards = wRes;
      
      const pSelect = document.getElementById('reg-tinh-thanh');
      pSelect.innerHTML = '<option value="">— Chọn Tỉnh/Thành —</option>' + pRes.map(p => `<option value="${p.code}">${p.name}</option>`).join('');
      
      pSelect.addEventListener('change', () => {
        const code = pSelect.value;
        const filtered = self._districts.filter(d => d.province_code === code);
        const dSelect = document.getElementById('reg-quan-huyen');
        dSelect.innerHTML = '<option value="">— Chọn Quận/Huyện —</option>' + filtered.map(d => `<option value="${d.code}">${d.name}</option>`).join('');
        document.getElementById('reg-phuong-xa').innerHTML = '<option value="">— Chọn Phường/Xã —</option>';
      });

      document.getElementById('reg-quan-huyen').addEventListener('change', (e) => {
        const code = e.target.value;
        const filtered = self._wards.filter(w => w.district_code === code);
        document.getElementById('reg-phuong-xa').innerHTML = '<option value="">— Chọn Phường/Xã —</option>' + filtered.map(w => `<option value="${w.code}">${w.name}</option>`).join('');
      });
    } catch(e) { console.error('Address load error:', e); }

    // 2. Xử lý Chuyển đổi Tab
    const tabReg = document.getElementById('tab-register');
    const tabPkg = document.getElementById('tab-package');
    const formReg = document.getElementById('form-register');
    const formPkg = document.getElementById('form-package');

    tabReg?.addEventListener('click', () => {
      formReg.classList.remove('hidden');
      formPkg.classList.add('hidden');
      tabReg.className = 'tab-btn px-loose py-compact rounded-lg font-bold text-body-md transition-all bg-surface-container-lowest text-brand-primary shadow-sm';
      tabPkg.className = 'tab-btn px-loose py-compact rounded-lg font-bold text-body-md transition-all text-on-surface-variant hover:text-brand-primary';
    });

    tabPkg?.addEventListener('click', () => {
      formPkg.classList.remove('hidden');
      formReg.classList.add('hidden');
      tabPkg.className = 'tab-btn px-loose py-compact rounded-lg font-bold text-body-md transition-all bg-surface-container-lowest text-brand-primary shadow-sm';
      tabReg.className = 'tab-btn px-loose py-compact rounded-lg font-bold text-body-md transition-all text-on-surface-variant hover:text-brand-primary';
    });

    // 3. Xử lý Gói tập (Tự động điền giá)
    const pkgSelect = document.getElementById('pkg-select');
    const pkgPrice = document.getElementById('pkg-price');
    const pkgTotal = document.getElementById('pkg-total');
    
    pkgSelect?.addEventListener('change', () => {
      const pkgId = pkgSelect.value;
      const pkg = (window.GymApp.data.packages || []).find(p => String(p.id) === pkgId);
      if (pkg) {
        pkgPrice.value = window.GymApp.formatCurrency(pkg.gia);
        pkgTotal.value = window.GymApp.formatCurrency(pkg.gia);
      }
    });

    const today = new Date().toISOString().split('T')[0];
    const pkgFrom = document.getElementById('pkg-from');
    const pkgPayDate = document.getElementById('pkg-pay-date');
    if (pkgFrom) pkgFrom.value = today;
    if (pkgPayDate) pkgPayDate.value = today;

    // 4. Xử lý Loại hồ sơ & Trường đặc thù
    typeSelect?.addEventListener('change', () => {
      const type = typeSelect.value;
      extraFields.classList.remove('hidden');
      if (type === 'pt') {
        extraFields.innerHTML = self._field('Chuyên môn PT *', 'reg-chuyen-mon', 'text', 'VD: Yoga, Gym, Boxing...');
      } else if (type === 'nhan_vien') {
        extraFields.innerHTML = self._field('Chức vụ *', 'reg-chuc-vu', 'text', 'VD: Lễ tân, Quản lý...');
      } else if (type === 'hoi_vien') {
        extraFields.innerHTML = self._select('Hạng hội viên', 'reg-loai-hv', [{v:'Normal',t:'Thường'},{v:'VIP',t:'VIP'},{v:'Student',t:'Sinh viên'}]);
      } else {
        extraFields.classList.add('hidden');
      }
      // Sinh mã hồ sơ mới khi đổi loại
      const prefixes = { 'hoi_vien': 'HV', 'pt': 'PT', 'nhan_vien': 'NV' };
      const prefix = prefixes[type] || 'HS';
      document.getElementById('reg-ma-ho-so').value = `${prefix}-${String(Date.now()).slice(-4)}`;
    });

    // 3. Avatar Upload
    window.GymApp.pages['member-add']._setupAvatarUpload('avatar-btn-reg','avatar-input-reg','avatar-preview-reg','avatar-placeholder-reg','avatar-area-reg');

    // 4. Lưu hồ sơ
    document.getElementById('btn-save-member')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-save-member');
      const tinhThanh = document.getElementById('reg-tinh-thanh');
      const quanHuyen = document.getElementById('reg-quan-huyen');
      const phuongXa = document.getElementById('reg-phuong-xa');

      const data = {
        ho_ten: document.getElementById('reg-ho-ten').value,
        loai_ho_so: typeSelect.value,
        ngay_sinh: document.getElementById('reg-ngay-sinh').value,
        gioi_tinh: document.getElementById('reg-gioi-tinh').value,
        so_dien_thoai: document.getElementById('reg-so-dien-thoai').value,
        email: document.getElementById('reg-email').value,
        cccd: document.getElementById('reg-cccd').value,
        noi_sinh: document.getElementById('reg-noi-sinh').value,
        que_quan: document.getElementById('reg-que-quan').value,
        chi_nhanh: document.getElementById('reg-chi-nhanh').value,
        tinh_thanh: tinhThanh.selectedIndex > 0 ? tinhThanh.options[tinhThanh.selectedIndex].text : '',
        quan_huyen: quanHuyen.selectedIndex > 0 ? quanHuyen.options[quanHuyen.selectedIndex].text : '',
        phuong_xa: phuongXa.selectedIndex > 0 ? phuongXa.options[phuongXa.selectedIndex].text : '',
        dia_chi_tam_tru: document.getElementById('reg-dia-chi').value,
        chuyen_mon: document.getElementById('reg-chuyen-mon')?.value,
        chuc_vu: document.getElementById('reg-chuc-vu')?.value,
        loai_hv: document.getElementById('reg-loai-hv')?.value
      };

      if (!data.ho_ten || !data.loai_ho_so || !data.so_dien_thoai) {
        return window.GymApp.toast('Vui lòng điền đủ các trường bắt buộc (*)', 'error');
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="animate-spin material-symbols-outlined text-sm">sync</span> Đang lưu...';
      
      try {
        const res = await window.GymApp.api.post('/members', data);
        if (res.success) {
          window.GymApp.toast('Đã tạo hồ sơ thành công!', 'success');
          await window.GymApp.fetchInitialData();
          window.GymApp.navigate('members-list');
        } else { window.GymApp.toast(res.message, 'error'); }
      } catch(e) { window.GymApp.toast('Lỗi kết nối máy chủ', 'error'); }
      finally { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined text-sm">save</span> Lưu hồ sơ'; }
    });

    // 5. Lưu đăng ký gói tập
    document.getElementById('btn-save-package')?.addEventListener('click', async () => {
      const pkgId = document.getElementById('pkg-select').value;
      if (!pkgId) return window.GymApp.toast('Vui lòng chọn gói tập!', 'error');
      
      // Ở trang member-add, ta chưa có ho_so_id cho đến khi lưu hồ sơ xong.
      // Do đó thường quy trình là: Lưu hồ sơ -> Có ID -> Lưu Gói tập.
      window.GymApp.toast('Vui lòng "Lưu hồ sơ" trước khi lưu gói tập!', 'info');
    });
  },

  _setupAvatarUpload: function (btnId, inputId, previewId, placeholderId, areaId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const placeholder = document.getElementById(placeholderId);
    const area = document.getElementById(areaId);
    if (!btn || !input) return;
    btn.onclick = () => input.click();
    area.onclick = () => input.click();
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        preview.src = ev.target.result;
        preview.classList.remove('hidden');
        placeholder.classList.add('hidden');
      };
      reader.readAsDataURL(file);
    };
  }
};
