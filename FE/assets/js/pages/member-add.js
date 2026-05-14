window.GymApp.pages['member-add'] = {
  _activeTab: 'register',
  _provinces: [], _districts: [], _wards: [],
  _avatarFile: null,
  _currentMemberId: null,
  _currentMemberName: '',

  // Danh sách chuyên môn PT gợi ý
  _PT_SPECIALTIES: [
    'Gym & Thể hình', 'Yoga', 'Boxing', 'Zumba', 'CrossFit',
    'Pilates', 'Kickboxing', 'Bơi lội', 'Aerobic', 'Chạy bộ',
    'Calisthenics', 'Powerlifting', 'Cardio', 'Giảm cân', 'Tăng cơ',
  ],

  render: function () {
    const provinceDatalist = `
      <datalist id="dl-que-quan">
        ${['Hà Nội','TP. Hồ Chí Minh','Đà Nẵng','Hải Phòng','Cần Thơ','An Giang','Bà Rịa - Vũng Tàu','Bắc Giang','Bắc Kạn','Bạc Liêu','Bắc Ninh','Bến Tre','Bình Định','Bình Dương','Bình Phước','Bình Thuận','Cà Mau','Cao Bằng','Đắk Lắk','Đắk Nông','Điện Biên','Đồng Nai','Đồng Tháp','Gia Lai','Hà Giang','Hà Nam','Hà Tĩnh','Hải Dương','Hậu Giang','Hòa Bình','Hưng Yên','Khánh Hòa','Kiên Giang','Kon Tum','Lai Châu','Lâm Đồng','Lạng Sơn','Lào Cai','Long An','Nam Định','Nghệ An','Ninh Bình','Ninh Thuận','Phú Thọ','Phú Yên','Quảng Bình','Quảng Nam','Quảng Ngãi','Quảng Ninh','Quảng Trị','Sóc Trăng','Sơn La','Tây Ninh','Thái Bình','Thái Nguyên','Thanh Hóa','Thừa Thiên Huế','Tiền Giang','Trà Vinh','Tuyên Quang','Vĩnh Long','Vĩnh Phúc','Yên Bái'].map(t => `<option value="${t}">`).join('')}
      </datalist>`;

    const specialtyDatalist = `
      <datalist id="dl-chuyen-mon">
        ${this._PT_SPECIALTIES.map(s => `<option value="${s}">`).join('')}
      </datalist>`;

    return `
      ${provinceDatalist}
      ${specialtyDatalist}
      <div class="flex flex-col gap-compact w-full max-w-none mx-auto">

        <!-- Header -->
        <div class="flex items-center gap-standard">
          <button class="flex items-center justify-center w-9 h-9 rounded-xl border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-surface-container transition-all" data-page="members-list">
            <span class="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div class="page-title-bar">
            <h2 class="font-display-2xl text-display-2xl text-on-surface font-bold">Quản lý Hồ sơ mới</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm">Đăng ký Hội viên, PT hoặc Nhân viên mới</p>
          </div>
        </div>

        <!-- Tab Switcher -->
        <div class="flex gap-xs bg-surface-container p-xs rounded-2xl border border-outline-variant w-fit shadow-sm">
          <button id="tab-register" class="tab-btn px-loose py-compact rounded-xl font-bold text-body-md transition-all bg-surface-container-lowest text-brand-primary shadow-sm">
            <span class="flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">person_add</span>
              Thông tin hồ sơ
            </span>
          </button>
          <button id="tab-package" class="tab-btn px-loose py-compact rounded-xl font-bold text-body-md transition-all text-on-surface-variant hover:text-brand-primary">
            <span class="flex items-center gap-xs">
              <span class="material-symbols-outlined text-sm">card_membership</span>
              Gói tập (Hội viên)
            </span>
          </button>
        </div>

        <div id="form-register">
          <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-compact md:p-standard">

            <!-- Avatar + Mã/Tên/Loại -->
            <div class="flex items-start gap-compact mb-compact">
              <div class="flex flex-col items-center gap-xs flex-shrink-0">
                <div class="relative">
                  <div id="avatar-area-reg" class="w-20 h-20 md:w-24 md:h-24 bg-surface-container-low border-2 border-dashed border-outline-variant rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-brand-primary">
                    <span class="material-symbols-outlined text-outline text-4xl" id="avatar-placeholder-reg">person</span>
                    <img id="avatar-preview-reg" class="w-full h-full object-cover absolute inset-0 hidden" alt="preview" />
                  </div>
                  <button type="button" id="avatar-btn-reg" class="absolute -bottom-2 -right-2 w-8 h-8 btn-primary rounded-full flex items-center justify-center shadow-md z-10">
                    <span class="material-symbols-outlined text-white text-sm">photo_camera</span>
                  </button>
                  <input type="file" id="avatar-input-reg" class="hidden" accept="image/jpeg,image/png,image/webp" />
                </div>
                <p class="text-[10px] text-on-surface-variant text-center" style="max-width:80px;">JPG/PNG, tối đa 5MB</p>
              </div>

              <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-compact">
                ${this._field('Mã số hồ sơ', 'reg-ma-ho-so', 'text', 'Tự động...', true)}
                ${this._field('Họ và tên *', 'reg-ho-ten', 'text', 'Nhập họ và tên đầy đủ')}
                ${this._select('Loại hồ sơ *', 'reg-loai-ho-so', [
                  {v:'hoi_vien', t:'Hội viên'},
                  {v:'pt', t:'Huấn luyện viên (PT)'},
                  {v:'nhan_vien', t:'Nhân viên'}
                ])}
              </div>
            </div>

            <!-- Trường đặc thù theo loại -->
            <div id="extra-fields" class="mb-compact grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-compact border-y border-outline-variant/30 py-compact hidden"></div>

            <!-- Thông tin cá nhân -->
            <div class="mb-compact">
              <div class="flex items-center gap-compact mb-standard">
                <div class="icon-bg icon-bg-green" style="width:32px;height:32px;border-radius:8px">
                  <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">badge</span>
                </div>
                <h3 class="font-bold text-on-surface text-body-md">Thông tin cá nhân</h3>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-compact">
                ${this._field('Ngày sinh', 'reg-ngay-sinh', 'date')}
                ${this._select('Giới tính', 'reg-gioi-tinh', [{v:'nam',t:'Nam'},{v:'nu',t:'Nữ'},{v:'khac',t:'Khác'}])}
                <!-- SĐT với inline error -->
                <div>
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Số điện thoại *</label>
                  <input id="reg-so-dien-thoai" type="tel" placeholder="0912345678" maxlength="10"
                    class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none transition-colors" />
                  <p id="err-sdt" class="hidden text-error text-[11px] mt-xs font-medium"></p>
                </div>
                <!-- Email với inline error -->
                <div>
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Email</label>
                  <input id="reg-email" type="email" placeholder="example@email.com"
                    class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none transition-colors" />
                  <p id="err-email" class="hidden text-error text-[11px] mt-xs font-medium"></p>
                </div>
                <!-- CCCD với inline error -->
                <div>
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">CCCD / CMND</label>
                  <input id="reg-cccd" type="text" placeholder="012345678901" maxlength="12"
                    class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none transition-colors" />
                  <p id="err-cccd" class="hidden text-error text-[11px] mt-xs font-medium"></p>
                </div>
                ${this._field('Nơi sinh', 'reg-noi-sinh', 'text', 'VD: Hà Nội')}
                <!-- Quê quán với datalist 63 tỉnh -->
                <div>
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Quê quán</label>
                  <input id="reg-que-quan" type="text" list="dl-que-quan" placeholder="Chọn hoặc nhập tỉnh/thành..."
                    class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none transition-colors" />
                </div>
                ${this._select('Chi nhánh', 'reg-chi-nhanh', [{v:'CN1',t:'Chi nhánh 1'},{v:'CN2',t:'Chi nhánh 2'}])}
              </div>
            </div>

            <!-- Địa chỉ -->
            <div class="mb-compact">
              <div class="flex items-center gap-compact mb-standard">
                <div class="icon-bg icon-bg-orange" style="width:32px;height:32px;border-radius:8px">
                  <span class="material-symbols-outlined text-[#e65100] text-sm" style="font-variation-settings:'FILL' 1">location_on</span>
                </div>
                <h3 class="font-bold text-on-surface text-body-md">Địa chỉ thường trú</h3>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-compact">
                ${this._select('Tỉnh / Thành phố', 'reg-tinh-thanh', [])}
                ${this._select('Quận / Huyện', 'reg-quan-huyen', [])}
                ${this._select('Phường / Xã', 'reg-phuong-xa', [])}
                ${this._field('Số nhà / Đường', 'reg-dia-chi', 'text', '123 Đường...')}
              </div>
            </div>

            <!-- Tạo tài khoản đăng nhập -->
            <div class="mb-compact border border-outline-variant rounded-xl p-compact bg-surface-container">
              <label class="flex items-center gap-compact cursor-pointer select-none mb-0" id="label-create-account">
                <input type="checkbox" id="chk-create-account" class="w-4 h-4 rounded accent-brand-primary cursor-pointer" />
                <span class="material-symbols-outlined text-brand-primary text-base" style="font-variation-settings:'FILL' 1">manage_accounts</span>
                <span class="font-bold text-on-surface text-body-md">Tạo tài khoản đăng nhập ngay</span>
              </label>
              <div id="account-fields" class="hidden mt-compact grid grid-cols-1 md:grid-cols-2 gap-compact">
                ${this._field('Tên đăng nhập *', 'reg-ten-dang-nhap', 'text', 'Số điện thoại hoặc tên đăng nhập')}
                ${this._field('Mật khẩu *', 'reg-mat-khau', 'password', 'Ít nhất 6 ký tự')}
              </div>
            </div>

            <div class="flex justify-end gap-compact pt-compact border-t border-outline-variant">
              <button type="button" class="px-loose py-compact rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors font-bold" data-page="members-list">Hủy</button>
              <button type="button" id="btn-save-member" class="btn-primary text-white px-loose py-compact rounded-xl font-bold flex items-center gap-compact">
                <span class="material-symbols-outlined text-sm">save</span>
                Lưu hồ sơ
              </button>
            </div>
          </div>
        </div>

        <div id="form-package" class="hidden">
          <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-compact md:p-standard">
            
            <div id="selected-member-info" class="mb-compact p-standard bg-brand-primary/10 border border-brand-primary/20 rounded-xl hidden">
              <div class="flex items-center gap-standard">
                <div class="w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-xl" id="selected-member-avatar-text">?</div>
                <div>
                  <p class="text-body-sm text-brand-primary font-bold">Đang đăng ký gói cho hội viên:</p>
                  <h4 class="text-on-surface font-bold text-display-xs" id="selected-member-name-display">Chưa chọn hội viên</h4>
                </div>
              </div>
            </div>

            <!-- Chọn gói tập -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-compact mb-compact">
              <div>
                <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Chọn gói tập</label>
                <select id="pkg-select" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none transition-colors">
                  <option value="">— Chọn gói tập —</option>
                  ${(window.GymApp.data.packages || []).map(p => `<option value="${p.id}" data-gia="${p.gia}" data-thang="${p.so_thang || 0}" data-them="${p.so_ngay_them || 0}">${p.ten_goi} — ${window.GymApp.formatCurrency(p.gia)}</option>`).join('')}
                </select>
              </div>
              ${this._field('Giá gói tập (VNĐ)', 'pkg-price', 'text', '0', true)}
            </div>

            <!-- Thời hạn -->
            <div class="mb-compact">
              <div class="flex items-center gap-compact mb-standard">
                <div class="icon-bg icon-bg-green" style="width:32px;height:32px;border-radius:8px">
                  <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">event</span>
                </div>
                <h3 class="font-bold text-on-surface text-body-md">Thời hạn gói tập</h3>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-compact">
                ${this._field('Từ ngày', 'pkg-from', 'date')}
                ${this._field('Đến ngày (tự tính)', 'pkg-to', 'date', '', true)}
                ${this._select('Trạng thái', 'pkg-status', [{v:'dang_hoat_dong',t:'Kích hoạt ngay'},{v:'cho_kich_hoat',t:'Chờ kích hoạt'}])}
                ${this._field('Mã giảm giá', 'pkg-coupon', 'text', 'GYM2026')}
              </div>
            </div>

            <!-- Thanh toán -->
            <div class="mb-compact">
              <div class="flex items-center gap-compact mb-standard">
                <div class="icon-bg icon-bg-orange" style="width:32px;height:32px;border-radius:8px">
                  <span class="material-symbols-outlined text-[#e65100] text-sm" style="font-variation-settings:'FILL' 1">payments</span>
                </div>
                <h3 class="font-bold text-on-surface text-body-md">Thanh toán</h3>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-compact">
                ${this._field('Tổng tiền', 'pkg-total', 'text', '0', true)}
                ${this._field('Tiền khách trả', 'pkg-paid', 'text', 'Nhập số tiền')}
                ${this._field('Ngày thu', 'pkg-pay-date', 'date')}
                ${this._select('Phương thức', 'pkg-method', [{v:'tien_mat',t:'Tiền mặt'},{v:'chuyen_khoan',t:'Chuyển khoản'}])}
              </div>
            </div>

            <div class="flex justify-end gap-compact pt-compact border-t border-outline-variant">
              <button type="button" class="px-loose py-compact rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors font-bold" data-page="members-list">Hủy</button>
              <button type="button" id="btn-save-package" class="btn-primary text-white px-loose py-compact rounded-xl font-bold flex items-center gap-compact">
                <span class="material-symbols-outlined text-sm">save</span>
                Lưu đăng ký gói
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _field: function (label, id, type, placeholder = '', readonly = false) {
    const base = 'w-full border border-outline-variant text-on-surface px-standard py-compact rounded-xl outline-none transition-colors';
    if (readonly) {
      return `<div>
        <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">${label}</label>
        <input id="${id}" type="${type}" placeholder="${placeholder}" readonly
          class="${base} bg-surface-container text-on-surface-variant cursor-not-allowed" />
      </div>`;
    }
    return `<div>
      <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">${label}</label>
      <input id="${id}" type="${type}" placeholder="${placeholder}"
        class="${base} bg-surface-container-lowest focus:border-brand-primary" />
    </div>`;
  },

  _select: function (label, id, options) {
    return `<div>
      <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">${label}</label>
      <select id="${id}" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none transition-colors">
        <option value="">— ${label} —</option>
        ${options.map(o => `<option value="${o.v}">${o.t}</option>`).join('')}
      </select>
    </div>`;
  },

  // Hiển thị/ẩn lỗi inline bên dưới input
  _setFieldError: function (errId, msg) {
    const el = document.getElementById(errId);
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.classList.remove('hidden');
    } else {
      el.textContent = '';
      el.classList.add('hidden');
    }
  },

  // Validate format, trả về null nếu hợp lệ, chuỗi lỗi nếu sai
  _validateFormat: function () {
    const sdt = document.getElementById('reg-so-dien-thoai').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const cccd = document.getElementById('reg-cccd').value.trim();
    let hasError = false;

    // Reset tất cả lỗi trước
    ['err-sdt', 'err-email', 'err-cccd'].forEach(id => this._setFieldError(id, ''));

    if (sdt && !/^(0[3-9]\d{8})$/.test(sdt)) {
      this._setFieldError('err-sdt', 'Số điện thoại phải có 10 chữ số, bắt đầu bằng 03-09');
      hasError = true;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this._setFieldError('err-email', 'Email không hợp lệ (phải có @)');
      hasError = true;
    }
    if (cccd && !/^\d{9}$|^\d{12}$/.test(cccd)) {
      this._setFieldError('err-cccd', 'CCCD phải có 12 chữ số (CMND 9 chữ số)');
      hasError = true;
    }
    return !hasError;
  },

  // Kiểm tra trùng SĐT/CCCD với API, trả về true nếu hợp lệ (không trùng)
  _validateDuplicate: async function () {
    const sdt = document.getElementById('reg-so-dien-thoai').value.trim();
    const cccd = document.getElementById('reg-cccd').value.trim();
    let hasError = false;

    if (sdt) {
      try {
        const r = await window.GymApp.api.get(`/members/check-duplicate?field=so_dien_thoai&value=${encodeURIComponent(sdt)}`);
        if (r.data?.exists) {
          this._setFieldError('err-sdt', 'Số điện thoại này đã được đăng ký trong hệ thống');
          hasError = true;
        }
      } catch (_) {}
    }
    if (cccd && /^\d{9}$|^\d{12}$/.test(cccd)) {
      try {
        const r = await window.GymApp.api.get(`/members/check-duplicate?field=cccd&value=${encodeURIComponent(cccd)}`);
        if (r.data?.exists) {
          this._setFieldError('err-cccd', 'CCCD/CMND này đã tồn tại trong hệ thống');
          hasError = true;
        }
      } catch (_) {}
    }
    return !hasError;
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
      pSelect.innerHTML = '<option value="">— Chọn Tỉnh/Thành —</option>' +
        pRes.map(p => `<option value="${p.code}">${p.name}</option>`).join('');

      pSelect.addEventListener('change', () => {
        const code = pSelect.value;
        const filtered = self._districts.filter(d => d.province_code === code);
        const dSelect = document.getElementById('reg-quan-huyen');
        dSelect.innerHTML = '<option value="">— Chọn Quận/Huyện —</option>' +
          filtered.map(d => `<option value="${d.code}">${d.name}</option>`).join('');
        document.getElementById('reg-phuong-xa').innerHTML = '<option value="">— Chọn Phường/Xã —</option>';
      });

      document.getElementById('reg-quan-huyen').addEventListener('change', (e) => {
        const code = e.target.value;
        const filtered = self._wards.filter(w => w.district_code === code);
        document.getElementById('reg-phuong-xa').innerHTML = '<option value="">— Chọn Phường/Xã —</option>' +
          filtered.map(w => `<option value="${w.code}">${w.name}</option>`).join('');
      });
    } catch(e) { console.error('Address load error:', e); }

    // 2. Tab Switcher
    const tabReg = document.getElementById('tab-register');
    const tabPkg = document.getElementById('tab-package');
    const formReg = document.getElementById('form-register');
    const formPkg = document.getElementById('form-package');
    const clsActive = 'tab-btn px-loose py-compact rounded-xl font-bold text-body-md transition-all bg-surface-container-lowest text-brand-primary shadow-sm';
    const clsInactive = 'tab-btn px-loose py-compact rounded-xl font-bold text-body-md transition-all text-on-surface-variant hover:text-brand-primary';

    tabReg?.addEventListener('click', () => {
      formReg.classList.remove('hidden'); formPkg.classList.add('hidden');
      tabReg.className = clsActive; tabPkg.className = clsInactive;
    });
    tabPkg?.addEventListener('click', () => {
      formPkg.classList.remove('hidden'); formReg.classList.add('hidden');
      tabPkg.className = clsActive; tabReg.className = clsInactive;
    });

    // 3. Gói tập — tự động điền giá + đến ngày
    const pkgSelect = document.getElementById('pkg-select');
    const pkgFrom = document.getElementById('pkg-from');
    const pkgTo = document.getElementById('pkg-to');

    const calcPkgEndDate = () => {
      const opt = pkgSelect.options[pkgSelect.selectedIndex];
      if (!opt || !pkgFrom.value) return;
      const soThang = parseInt(opt.dataset.thang) || 0;
      const soThem = parseInt(opt.dataset.them) || 0;
      if (soThang > 0 || soThem > 0) {
        const d = new Date(pkgFrom.value);
        d.setMonth(d.getMonth() + soThang);
        d.setDate(d.getDate() + soThem);
        pkgTo.value = d.toISOString().split('T')[0];
      }
    };

    pkgSelect?.addEventListener('change', () => {
      const opt = pkgSelect.options[pkgSelect.selectedIndex];
      if (!opt) return;
      const gia = parseFloat(opt.dataset.gia) || 0;
      if (gia > 0) {
        document.getElementById('pkg-price').value = gia;
        document.getElementById('pkg-total').value = gia;
      }
      calcPkgEndDate();
    });
    pkgFrom?.addEventListener('change', calcPkgEndDate);

    const today = new Date().toISOString().split('T')[0];
    if (pkgFrom) pkgFrom.value = today;
    if (document.getElementById('pkg-pay-date')) document.getElementById('pkg-pay-date').value = today;

    // 4. Loại hồ sơ & Trường đặc thù
    typeSelect?.addEventListener('change', () => {
      const type = typeSelect.value;
      extraFields.classList.remove('hidden');
      if (type === 'pt') {
        // Chuyên môn PT: input + datalist gợi ý
        extraFields.innerHTML = `
          <div>
            <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Chuyên môn PT *</label>
            <input id="reg-chuyen-mon" type="text" list="dl-chuyen-mon" placeholder="VD: Gym, Yoga, Boxing..."
              class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none transition-colors" />
          </div>
          <div>
            <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Kinh nghiệm (năm)</label>
            <input id="reg-kinh-nghiem" type="number" min="0" max="50" placeholder="VD: 3"
              class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none transition-colors" />
          </div>`;
      } else if (type === 'nhan_vien') {
        extraFields.innerHTML = `
          <div>
            <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Chức vụ *</label>
            <input id="reg-chuc-vu" type="text" placeholder="VD: Lễ tân, Quản lý..."
              class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none transition-colors" />
          </div>`;
      } else if (type === 'hoi_vien') {
        extraFields.innerHTML = `
          <div>
            <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Hạng hội viên</label>
            <select id="reg-loai-hv" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none transition-colors">
              <option value="Normal">Thường</option>
              <option value="VIP">VIP</option>
              <option value="Student">Sinh viên</option>
            </select>
          </div>`;
      } else {
        extraFields.classList.add('hidden');
      }
      const prefixes = { 'hoi_vien': 'HV', 'pt': 'PT', 'nhan_vien': 'NV' };
      const prefix = prefixes[type] || 'HS';
      document.getElementById('reg-ma-ho-so').value = `${prefix}-${String(Date.now()).slice(-4)}`;
    });

    // 5. Avatar Upload — lưu file vào _avatarFile để gửi cùng FormData
    self._avatarFile = null;
    const avatarInput = document.getElementById('avatar-input-reg');
    const avatarPreview = document.getElementById('avatar-preview-reg');
    const avatarPlaceholder = document.getElementById('avatar-placeholder-reg');
    const avatarBtn = document.getElementById('avatar-btn-reg');
    const avatarArea = document.getElementById('avatar-area-reg');

    const openFilePicker = () => avatarInput.click();
    avatarBtn?.addEventListener('click', openFilePicker);
    avatarArea?.addEventListener('click', openFilePicker);

    avatarInput?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        window.GymApp.toast('Ảnh quá lớn — tối đa 5MB', 'error');
        avatarInput.value = '';
        return;
      }
      self._avatarFile = file;
      const reader = new FileReader();
      reader.onload = ev => {
        avatarPreview.src = ev.target.result;
        avatarPreview.classList.remove('hidden');
        avatarPlaceholder.classList.add('hidden');
      };
      reader.readAsDataURL(file);
    });

    // 5b. Toggle form tạo tài khoản + tự fill SĐT
    const chkAccount = document.getElementById('chk-create-account');
    const accountFields = document.getElementById('account-fields');
    chkAccount?.addEventListener('change', () => {
      if (chkAccount.checked) {
        accountFields.classList.remove('hidden');
        const sdt = document.getElementById('reg-so-dien-thoai').value.trim();
        if (sdt) document.getElementById('reg-ten-dang-nhap').value = sdt;
      } else {
        accountFields.classList.add('hidden');
      }
    });
    document.getElementById('reg-so-dien-thoai')?.addEventListener('blur', () => {
      if (!chkAccount?.checked) return;
      const sdt = document.getElementById('reg-so-dien-thoai').value.trim();
      const usernameInput = document.getElementById('reg-ten-dang-nhap');
      if (sdt && usernameInput) usernameInput.value = sdt;
    });

    // Xóa lỗi khi người dùng bắt đầu nhập lại
    document.getElementById('reg-so-dien-thoai')?.addEventListener('input', () => self._setFieldError('err-sdt', ''));
    document.getElementById('reg-email')?.addEventListener('input', () => self._setFieldError('err-email', ''));
    document.getElementById('reg-cccd')?.addEventListener('input', () => self._setFieldError('err-cccd', ''));

    // 6. Lưu hồ sơ — gửi FormData để upload ảnh cùng lúc
    document.getElementById('btn-save-member')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-save-member');
      const tinhThanh = document.getElementById('reg-tinh-thanh');
      const quanHuyen = document.getElementById('reg-quan-huyen');
      const phuongXa = document.getElementById('reg-phuong-xa');

      const ho_ten = document.getElementById('reg-ho-ten').value.trim();
      const loai_ho_so = typeSelect.value;
      const sdt = document.getElementById('reg-so-dien-thoai').value.trim();

      if (!ho_ten || !loai_ho_so || !sdt) {
        return window.GymApp.toast('Vui lòng điền đủ các trường bắt buộc (*)', 'error');
      }

      // Validate format trước
      if (!self._validateFormat()) return;

      btn.disabled = true;
      btn.innerHTML = '<span class="animate-spin material-symbols-outlined text-sm">sync</span> Đang kiểm tra...';

      // Validate trùng với DB
      const noDuplicate = await self._validateDuplicate();
      if (!noDuplicate) {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">save</span> Lưu hồ sơ';
        return;
      }

      btn.innerHTML = '<span class="animate-spin material-symbols-outlined text-sm">sync</span> Đang lưu...';

      try {
        // Dùng FormData để gửi ảnh cùng với dữ liệu hồ sơ
        const fd = new FormData();
        fd.append('ho_ten', ho_ten);
        fd.append('loai_ho_so', loai_ho_so);
        fd.append('so_dien_thoai', sdt);

        const fields = {
          ngay_sinh: 'reg-ngay-sinh', gioi_tinh: 'reg-gioi-tinh',
          email: 'reg-email', cccd: 'reg-cccd', noi_sinh: 'reg-noi-sinh',
          que_quan: 'reg-que-quan', chi_nhanh: 'reg-chi-nhanh',
          dia_chi_tam_tru: 'reg-dia-chi',
          chuyen_mon: 'reg-chuyen-mon', chuc_vu: 'reg-chuc-vu',
          loai_hv: 'reg-loai-hv',
          kinh_nghiem: 'reg-kinh-nghiem',
        };
        for (const [key, id] of Object.entries(fields)) {
          const val = document.getElementById(id)?.value?.trim();
          if (val) fd.append(key, val);
        }

        // Địa chỉ: lấy text của option được chọn
        if (tinhThanh.selectedIndex > 0) fd.append('tinh_thanh', tinhThanh.options[tinhThanh.selectedIndex].text);
        if (quanHuyen.selectedIndex > 0) fd.append('quan_huyen', quanHuyen.options[quanHuyen.selectedIndex].text);
        if (phuongXa.selectedIndex > 0) fd.append('phuong_xa', phuongXa.options[phuongXa.selectedIndex].text);

        // Đính kèm ảnh nếu có
        if (self._avatarFile) fd.append('avatar', self._avatarFile);

        // Gửi FormData — KHÔNG set Content-Type (browser tự set multipart/form-data)
        const token = localStorage.getItem('gym-token');
        const fetchRes = await fetch('http://localhost:3000/api/members', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: fd,
        });
        const res = await fetchRes.json();
        if (!res.success) {
          window.GymApp.toast(res.message || 'Lỗi khi lưu hồ sơ', 'error');
          return;
        }

        const newId = res.data?.id;
        self._currentMemberId = newId;
        self._currentMemberName = ho_ten;

        // Hiển thị thông tin hội viên ở tab gói tập
        const infoBox = document.getElementById('selected-member-info');
        const nameDisplay = document.getElementById('selected-member-name-display');
        const avatarText = document.getElementById('selected-member-avatar-text');
        if (infoBox && nameDisplay) {
          infoBox.classList.remove('hidden');
          nameDisplay.textContent = ho_ten;
          avatarText.textContent = ho_ten.charAt(0).toUpperCase();
        }

        // Tạo tài khoản nếu checkbox được tick
        const wantAccount = document.getElementById('chk-create-account')?.checked;
        if (wantAccount && newId) {
          const username = document.getElementById('reg-ten-dang-nhap')?.value.trim();
          const password = document.getElementById('reg-mat-khau')?.value;
          if (!username || !password) {
            window.GymApp.toast('Hồ sơ đã lưu nhưng thiếu tên đăng nhập/mật khẩu — chưa tạo tài khoản.', 'info');
          } else {
            const accRes = await window.GymApp.api.post(`/members/${newId}/create-account`, { ten_dang_nhap: username, mat_khau: password });
            if (accRes.success) {
              window.GymApp.toast(`Đã tạo hồ sơ và tài khoản "${username}" thành công!`, 'success');
            } else {
              window.GymApp.toast(`Hồ sơ đã lưu. Lỗi tạo tài khoản: ${accRes.message}`, 'error');
            }
          }
        } else {
          window.GymApp.toast('Đã tạo hồ sơ thành công! Tiếp tục đăng ký gói tập.', 'success');
        }

        await window.GymApp.fetchInitialData();
        
        // Chuyển sang tab gói tập
        const tabPkg = document.getElementById('tab-package');
        if (tabPkg) tabPkg.click();
        
        // Clear form thông tin hồ sơ
        const hoTenInput = document.getElementById('reg-ho-ten');
        if (hoTenInput) hoTenInput.value = '';
        const sdtInput = document.getElementById('reg-so-dien-thoai');
        if (sdtInput) sdtInput.value = '';
        const emailInput = document.getElementById('reg-email');
        if (emailInput) emailInput.value = '';
        const cccdInput = document.getElementById('reg-cccd');
        if (cccdInput) cccdInput.value = '';
        
        if (avatarPreview) avatarPreview.classList.add('hidden');
        if (avatarPlaceholder) avatarPlaceholder.classList.remove('hidden');
        self._avatarFile = null;
        
        const chkAccount = document.getElementById('chk-create-account');
        const accountFields = document.getElementById('account-fields');
        if (chkAccount) chkAccount.checked = false;
        if (accountFields) accountFields.classList.add('hidden');
      } catch(e) {
        console.error('Save member error:', e);
        window.GymApp.toast('Lỗi kết nối máy chủ', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">save</span> Lưu hồ sơ';
      }
    });

    // 7. Lưu đăng ký gói tập
    document.getElementById('btn-save-package')?.addEventListener('click', async () => {
      if (!self._currentMemberId) {
        return window.GymApp.toast('Vui lòng lưu hồ sơ hội viên trước!', 'warning');
      }

      const pkgId = document.getElementById('pkg-select').value;
      const tuNgay = document.getElementById('pkg-from').value;
      const giaThucTe = document.getElementById('pkg-price').value;
      const phuongThucTT = document.getElementById('pkg-method').value;

      if (!pkgId || !tuNgay || !phuongThucTT) {
        return window.GymApp.toast('Vui lòng điền đủ thông tin gói tập!', 'error');
      }

      const btn = document.getElementById('btn-save-package');
      btn.disabled = true;
      btn.innerHTML = '<span class="animate-spin material-symbols-outlined text-sm">sync</span> Đang lưu...';

      try {
        const res = await window.GymApp.api.post(`/members/${self._currentMemberId}/package`, {
          goi_tap_id: pkgId,
          tu_ngay: tuNgay,
          gia_thuc_te: giaThucTe,
          phuong_thuc_tt: phuongThucTT,
          ma_giao_dich: document.getElementById('pkg-coupon')?.value || ''
        });

        if (res.success) {
          window.GymApp.toast('Đăng ký gói tập thành công!', 'success');
          await window.GymApp.fetchInitialData();
          window.GymApp.navigate('members-list');
        } else {
          window.GymApp.toast(res.message || 'Lỗi khi đăng ký gói tập', 'error');
        }
      } catch (err) {
        console.error(err);
        window.GymApp.toast('Lỗi kết nối máy chủ', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">save</span> Lưu đăng ký gói';
      }
    });
  },
};
