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
        ${['An Giang', 'Bắc Ninh', 'Cao Bằng', 'Cà Mau', 'Điện Biên', 'Đà Nẵng', 'Đắk Lắk', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Tĩnh', 'Hải Phòng', 'Hưng Yên', 'Khánh Hoà', 'Lai Châu', 'Lạng Sơn', 'Lào Cai', 'Lâm Đồng', 'Nghệ An', 'Ninh Bình', 'Phú Thọ', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sơn La', 'Tây Ninh', 'Thái Nguyên', 'Thanh Hoá', 'Thành phố Cần Thơ', 'Thành phố Hà Nội', 'Thành phố Hồ Chí Minh', 'Thành phố Huế', 'Tuyên Quang', 'Vĩnh Long'].map(t => `<option value="${t}">`).join('')}
      </datalist>`;

    const specialtyDatalist = `
      <datalist id="dl-chuyen-mon">
        ${this._PT_SPECIALTIES.map(s => `<option value="${s}">`).join('')}
      </datalist>`;

    return `
      ${provinceDatalist}
      ${specialtyDatalist}
      <div class="flex flex-col gap-standard w-full max-w-none mx-auto animate-fadeIn">
 
        <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-sm flex flex-col">
          
          <!-- Unified Header & Tab Navigation -->
          <div class="bg-surface-container-low/20 px-standard py-compact border-b-2 border-outline-variant/50 flex flex-wrap items-center justify-between gap-compact" style="border-top-left-radius: 14px; border-top-right-radius: 14px;">
            <div class="flex items-center gap-standard">
              <button class="flex items-center justify-center w-8 h-8 rounded-xl border-2 border-outline-variant/50 text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:bg-surface-container-low transition-all bg-white dark:bg-[#1e1e1e]" data-page="members-list">
                <span class="material-symbols-outlined text-lg">arrow_back</span>
              </button>
              <div class="flex gap-xs p-1 bg-surface-container-low/40 rounded-full border border-outline-variant/30">
                <button id="tab-register" class="tab-btn px-4 py-1.5 rounded-full font-bold text-body-md transition-all bg-brand-primary text-white shadow-sm flex items-center gap-xs">
                  <span class="material-symbols-outlined text-sm">person_add</span>
                  Thông tin hồ sơ
                </button>
                <button id="tab-package" class="tab-btn px-4 py-1.5 rounded-full font-bold text-body-md transition-all text-on-surface-variant hover:text-brand-primary hover:bg-brand-primary/5 flex items-center gap-xs">
                  <span class="material-symbols-outlined text-sm">card_membership</span>
                  Gói tập (Hội viên)
                </button>
              </div>
            </div>
 
          </div>
 
          <!-- Content Areas -->
          <div id="form-register" class="p-standard">
 
            <!-- Avatar + Mã/Tên/Loại -->
            <div class="flex items-start gap-compact mb-4">
              <div class="flex flex-col items-center gap-xs flex-shrink-0">
                <div class="relative">
                  <div id="avatar-area-reg" class="w-20 h-20 md:w-24 md:h-24 bg-surface-container-low/30 border-2 border-dashed border-outline-variant rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-brand-primary">
                    <span class="material-symbols-outlined text-on-surface-variant text-4xl" id="avatar-placeholder-reg">person</span>
                    <img id="avatar-preview-reg" class="w-full h-full object-cover absolute inset-0 hidden" alt="preview" />
                  </div>
                  <button type="button" id="avatar-btn-reg" class="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-md z-10 hover:opacity-90 active:scale-95 transition-all">
                    <span class="material-symbols-outlined text-white text-xs">photo_camera</span>
                  </button>
                  <input type="file" id="avatar-input-reg" class="hidden" accept="image/jpeg,image/png,image/webp" />
                </div>
              </div>
 
              <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-standard">
                ${this._field('Mã số hồ sơ', 'reg-ma-ho-so', 'text', 'Tự động...', true)}
                ${this._field('Họ và tên *', 'reg-ho-ten', 'text', 'Nhập họ và tên đầy đủ')}
                ${this._select('Loại hồ sơ *', 'reg-loai-ho-so', [
      { v: 'hoi_vien', t: 'Hội viên' },
      { v: 'pt', t: 'Huấn luyện viên (PT)' },
      { v: 'nhan_vien', t: 'Nhân viên' }
    ])}
              </div>
            </div>
 
            <!-- Trường đặc thù theo loại -->
            <div id="extra-fields" class="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-standard border-y border-outline-variant/30 py-compact hidden"></div>
 
            <!-- Thông tin cá nhân -->
            <div class="mb-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-standard">
                ${this._field('Ngày sinh', 'reg-ngay-sinh', 'date')}
                ${this._select('Giới tính', 'reg-gioi-tinh', [{ v: 'nam', t: 'Nam' }, { v: 'nu', t: 'Nữ' }, { v: 'khac', t: 'Khác' }])}
                <!-- SĐT với inline error -->
                <div>
                  <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5">Số điện thoại <span style="color:#ba1a1a;">*</span></label>
                  <input id="reg-so-dien-thoai" type="tel" placeholder="0912345678" maxlength="10"
                    class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-3 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all" />
                  <p id="err-sdt" class="hidden text-body-sm mt-xs font-medium" style="color:#ba1a1a"></p>
                </div>
                <!-- Email với inline error -->
                <div>
                  <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5">Email</label>
                  <input id="reg-email" type="email" placeholder="example@email.com"
                    class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-3 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all" />
                  <p id="err-email" class="hidden text-body-sm mt-xs font-medium" style="color:#ba1a1a"></p>
                </div>
                <!-- CCCD với inline error -->
                <div>
                  <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5">CCCD / CMND</label>
                  <input id="reg-cccd" type="text" placeholder="012345678901" maxlength="12"
                    class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-3 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all" />
                  <p id="err-cccd" class="hidden text-body-sm mt-xs font-medium" style="color:#ba1a1a"></p>
                </div>
                ${this._field('Nơi sinh', 'reg-noi-sinh', 'text', 'VD: Hà Nội')}
                <!-- Quê quán với datalist 63 tỉnh -->
                <div>
                  <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5">Quê quán</label>
                  <input id="reg-que-quan" type="text" list="dl-que-quan" placeholder="Chọn hoặc nhập tỉnh/thành..."
                    class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-3 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all" />
                </div>
                ${this._select('Chi nhánh', 'reg-chi-nhanh', [])}
              </div>
            </div>
 
            <!-- Địa chỉ -->
            <div class="mb-4">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-standard">
                ${this._select('Tỉnh / Thành phố', 'reg-tinh-thanh', [])}
                ${this._select('Quận / Huyện', 'reg-quan-huyen', [])}
                ${this._datalistInput('Phường / Xã', 'reg-phuong-xa', 'dl-phuong-xa', 'Chọn hoặc nhập phường/xã...')}
                ${this._field('Số nhà / Đường', 'reg-dia-chi', 'text', '123 Đường...')}
              </div>
            </div>
 
            <!-- Tạo tài khoản đăng nhập -->
            <div class="mb-4 border-2 border-outline-variant/50 rounded-xl p-4 bg-surface-container-low/30">
              <label class="flex items-center gap-compact cursor-pointer select-none mb-0" id="label-create-account">
                <input type="checkbox" id="chk-create-account" class="w-4 h-4 rounded border-2 border-outline-variant/50 accent-brand-primary cursor-pointer" />
                <span class="material-symbols-outlined text-brand-primary text-base" style="font-variation-settings:'FILL' 1">manage_accounts</span>
                <span class="font-bold text-on-surface text-body-md">Tạo tài khoản đăng nhập ngay</span>
              </label>
              <div id="account-fields" class="hidden mt-compact grid grid-cols-1 md:grid-cols-2 gap-standard">
                ${this._field('Tên đăng nhập *', 'reg-ten-dang-nhap', 'text', 'Số điện thoại hoặc tên đăng nhập')}
                ${this._field('Mật khẩu *', 'reg-mat-khau', 'password', 'Ít nhất 6 ký tự')}
              </div>
            </div>
 
            <div class="flex justify-end gap-compact pt-standard border-t border-outline-variant/50">
              <button type="button" class="px-5 py-2.5 rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:bg-surface-container-low active:scale-95 transition-all font-bold text-body-md" data-page="members-list">Hủy</button>
              <button type="button" id="btn-save-member" class="px-5 py-2.5 rounded-xl bg-brand-primary text-white hover:shadow-lg hover:shadow-brand-primary/20 active:scale-95 transition-all font-bold text-body-md flex items-center justify-center gap-compact">
                <span class="material-symbols-outlined text-sm">save</span>
                Lưu hồ sơ
              </button>
            </div>
          </div> <!-- End form-register -->
 
          <div id="form-package" class="hidden p-standard">
            
            <div id="selected-member-info" class="mb-standard p-standard bg-brand-primary/10 border border-brand-primary/20 rounded-xl hidden">
              <div class="flex items-center gap-standard">
                <div class="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-body-md" id="selected-member-avatar-text">?</div>
                <div>
                  <p class="text-body-sm text-brand-primary font-bold">Đang đăng ký gói cho hội viên:</p>
                  <h4 class="text-on-surface font-bold text-body-md" id="selected-member-name-display">Chưa chọn hội viên</h4>
                </div>
              </div>
            </div>
 
            <!-- Khung Grid gọn gàng nhập thông tin gói tập -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-standard mb-4">
              <div>
                <label class="block text-body-sm font-bold text-on-surface-variant mb-2">Chọn gói tập <span style="color:#ba1a1a;">*</span></label>
                <select id="pkg-select" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-3 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all cursor-pointer">
                  <option value="">— Chọn gói tập —</option>
                  ${(window.GymApp.data.packages || []).map(p => `<option value="${p.id}" data-gia="${p.gia}" data-thang="${p.so_thang || 0}" data-them="${p.so_ngay_them || 0}">${p.ten_goi} — ${window.GymApp.formatCurrency(p.gia)}</option>`).join('')}
                </select>
              </div>
              ${this._field('Giá gói tập (VNĐ)', 'pkg-price', 'text', '0', true)}
              ${this._field('Mã giảm giá', 'pkg-coupon', 'text', 'GYM2026')}
              ${this._field('Từ ngày', 'pkg-from', 'date')}

              ${this._field('Đến ngày (tự tính)', 'pkg-to', 'date', '', true)}
              
              ${this._field('Tổng tiền', 'pkg-total', 'text', '0', true)}

              <div>
                <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5">Tiền khách trả <span style="color:#ba1a1a;">*</span></label>
                <input id="pkg-paid" type="text" inputmode="numeric" placeholder="VD: 1.500.000"
                  class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-3 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all" />
                <p id="err-pkg-paid" class="hidden text-body-sm mt-xs font-medium" style="color:#ba1a1a"></p>
              </div>
              ${this._field('Ngày thu *', 'pkg-pay-date', 'date', '', true)}
              ${this._select('Phương thức', 'pkg-method', [{ v: 'tien_mat', t: 'Tiền mặt' }, { v: 'chuyen_khoan', t: 'Chuyển khoản' }])}
              
              <!-- Ghi chú thanh toán -->
              <div class="col-span-full">
                <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5">Ghi chú thanh toán</label>
                <textarea id="pkg-note" rows="2" placeholder="Nhập ghi chú thanh toán, khuyến mãi hoặc thông tin thêm..."
                  class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-3 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold resize-none transition-all"></textarea>
              </div>
            </div>
 
            <div class="flex justify-end gap-compact pt-standard border-t border-outline-variant/50">
              <button type="button" class="px-5 py-2.5 rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:bg-surface-container-low active:scale-95 transition-all font-bold text-body-md" data-page="members-list">Hủy</button>
              <button type="button" id="btn-save-package" class="px-5 py-2.5 rounded-xl bg-brand-primary text-white hover:shadow-lg hover:shadow-brand-primary/20 active:scale-95 transition-all font-bold text-body-md flex items-center justify-center gap-compact">
                <span class="material-symbols-outlined text-sm">save</span>
                Lưu đăng ký gói
              </button>
            </div>
        </div> <!-- End Main Container -->
      </div>
    `;
  },

  _field: function (label, id, type, placeholder = '', readonly = false) {
    const formattedLabel = label.replace('*', ' <span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>');
    const base = 'w-full border border-outline-variant/50 text-on-surface px-4 py-3 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all duration-200';
    if (readonly) {
      return `<div class="mb-3">
        <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5">${formattedLabel}</label>
        <input id="${id}" type="${type}" placeholder="${placeholder}" readonly
          class="${base} bg-surface-container text-on-surface-variant cursor-not-allowed opacity-75" />
      </div>`;
    }
    return `<div class="mb-3">
      <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5">${formattedLabel}</label>
      <input id="${id}" type="${type}" placeholder="${placeholder}"
        class="${base} bg-surface-container-low/30" />
    </div>`;
  },

  _select: function (label, id, options) {
    const formattedLabel = label.replace('*', ' <span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>');
    return `<div class="mb-3">
      <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5">${formattedLabel}</label>
      <select id="${id}" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-3 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all cursor-pointer">
        <option value="">— ${label.replace('*', '').trim()} —</option>
        ${options.map(o => `<option value="${o.v}">${o.t}</option>`).join('')}
      </select>
    </div>`;
  },

  _datalistInput: function (label, id, listId, placeholder = '') {
    const formattedLabel = label.replace('*', ' <span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>');
    const base = 'w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-3 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all duration-200';
    return `<div class="mb-3">
      <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5">${formattedLabel}</label>
      <input id="${id}" type="text" list="${listId}" placeholder="${placeholder}"
        class="${base}" autocomplete="off" />
      <datalist id="${listId}"></datalist>
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

  // Kiểm tra trùng SĐT/CCCD/Username với API, trả về true nếu hợp lệ (không trùng)
  _validateDuplicate: async function () {
    const sdt = document.getElementById('reg-so-dien-thoai').value.trim();
    const cccd = document.getElementById('reg-cccd').value.trim();
    const chkAccount = document.getElementById('chk-create-account');
    const usernameInput = document.getElementById('reg-ten-dang-nhap');
    let hasError = false;

    if (sdt) {
      try {
        const r = await window.GymApp.api.get(`/members/check-duplicate?field=so_dien_thoai&value=${encodeURIComponent(sdt)}`);
        if (r.data?.exists) {
          this._setFieldError('err-sdt', 'Số điện thoại này đã được đăng ký trong hệ thống');
          hasError = true;
        }
      } catch (_) { }
    }
    if (cccd && /^\d{9}$|^\d{12}$/.test(cccd)) {
      try {
        const r = await window.GymApp.api.get(`/members/check-duplicate?field=cccd&value=${encodeURIComponent(cccd)}`);
        if (r.data?.exists) {
          this._setFieldError('err-cccd', 'CCCD/CMND này đã tồn tại trong hệ thống');
          hasError = true;
        }
      } catch (_) { }
    }
    if (chkAccount && chkAccount.checked && usernameInput) {
      const username = usernameInput.value.trim();
      if (username) {
        try {
          const r = await window.GymApp.api.get(`/members/check-duplicate?field=ten_dang_nhap&value=${encodeURIComponent(username)}`);
          if (r.data?.exists) {
            window.GymApp.toast('Tên đăng nhập này đã được sử dụng!', 'error');
            usernameInput.classList.add('border-error');
            hasError = true;
          } else {
            usernameInput.classList.remove('border-error');
          }
        } catch (_) { }
      }
    }
    return !hasError;
  },

  init: async function () {
    const self = this;
    const typeSelect = document.getElementById('reg-loai-ho-so');
    const extraFields = document.getElementById('extra-fields');

    // 1. Tải dữ liệu địa chính & chi nhánh
    try {
      const [pRes, dRes, wRes, hcmcRes, branchesRes] = await Promise.all([
        fetch('assets/data/provinces.json').then(r => r.json()),
        fetch('assets/data/districts.json').then(r => r.json()),
        fetch('assets/data/wards.json').then(r => r.json()),
        fetch('assets/data/hanh_chinh_tphcm.json').then(r => r.json()),
        window.GymApp.api.get('/branches').catch(() => ({ success: false, data: [] }))
      ]);
      self._provinces = pRes; self._districts = dRes; self._wards = wRes;
      self._hcmcWards = hcmcRes;

      const branches = (branchesRes && branchesRes.success) ? (branchesRes.data || []) : [];
      const branchSelect = document.getElementById('reg-chi-nhanh');
      if (branchSelect) {
        branchSelect.innerHTML = '<option value="">— Chi nhánh —</option>' +
          branches.map(b => `<option value="${b.ten}">${b.ten}</option>`).join('');

        // Mặc định chọn chi nhánh đang đứng (nếu có)
        if (window.GymApp.selectedBranch) {
          branchSelect.value = window.GymApp.selectedBranch;
        }

        // Nhân viên có chi nhánh cố định: khóa dropdown, không cho chọn chi nhánh khác
        const currentUser = window.GymApp.auth.user;
        if (currentUser && currentUser.chi_nhanh) {
          branchSelect.value = currentUser.chi_nhanh;
          branchSelect.disabled = true;
        }
      }

      const pSelect = document.getElementById('reg-tinh-thanh');
      pSelect.innerHTML = '<option value="">— Chọn Tỉnh/Thành —</option>' +
        pRes.map(p => `<option value="${p.code}">${p.name}</option>`).join('');

      pSelect.addEventListener('change', () => {
        const code = pSelect.value;
        const dSelect = document.getElementById('reg-quan-huyen');
        const dContainer = dSelect.closest('div');
        const wInput = document.getElementById('reg-phuong-xa');
        const dlPhuongXa = document.getElementById('dl-phuong-xa');

        wInput.value = '';
        if (code === '79') {
          // Thành phố Hồ Chí Minh: Ẩn Quận/Huyện, nạp trực tiếp Phường mới nhất từ hanh_chinh_tphcm.json vào datalist
          if (dContainer) dContainer.style.display = 'none';
          dSelect.innerHTML = '<option value="">— Chọn Quận/Huyện —</option>';
          dSelect.value = '';

          // Lấy danh sách các new_ward không trùng lặp, sắp xếp bảng chữ cái tiếng Việt
          const uniqueWards = [...new Set(self._hcmcWards.map(item => item.new_ward))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'vi'));
          if (dlPhuongXa) {
            dlPhuongXa.innerHTML = uniqueWards.map(w => `<option value="${w}">`).join('');
          }
        } else {
          // Tỉnh/Thành khác: Hiện Quận/Huyện, chạy luồng 3 cấp chuẩn
          if (dContainer) dContainer.style.display = 'block';
          const filtered = self._districts.filter(d => d.province_code === code);
          dSelect.innerHTML = '<option value="">— Chọn Quận/Huyện —</option>' +
            filtered.map(d => `<option value="${d.code}">${d.name}</option>`).join('');
          if (dlPhuongXa) dlPhuongXa.innerHTML = '';
        }
      });

      document.getElementById('reg-quan-huyen').addEventListener('change', (e) => {
        const code = e.target.value;
        const filtered = self._wards.filter(w => w.district_code === code);
        const wInput = document.getElementById('reg-phuong-xa');
        const dlPhuongXa = document.getElementById('dl-phuong-xa');
        wInput.value = '';
        if (dlPhuongXa) {
          dlPhuongXa.innerHTML = filtered.map(w => `<option value="${w.name}">`).join('');
        }
      });
    } catch (e) { console.error('Address load error:', e); }

    // 2. Tab Switcher
    const tabReg = document.getElementById('tab-register');
    const tabPkg = document.getElementById('tab-package');
    const formReg = document.getElementById('form-register');
    const formPkg = document.getElementById('form-package');
    const clsActive = 'tab-btn px-4 py-1.5 rounded-full font-bold text-body-md transition-all bg-brand-primary text-white shadow-sm flex items-center gap-xs';
    const clsInactive = 'tab-btn px-4 py-1.5 rounded-full font-bold text-body-md transition-all text-on-surface-variant hover:text-brand-primary hover:bg-brand-primary/5 flex items-center gap-xs';

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

    // Format VNĐ helper — dùng cho các field giá
    const fmtVND = n => n > 0 ? new Intl.NumberFormat('vi-VN').format(n) : '';
    const parseVND = s => parseInt((s || '').replace(/\./g, '').replace(/,/g, '')) || 0;

    pkgSelect?.addEventListener('change', () => {
      const opt = pkgSelect.options[pkgSelect.selectedIndex];
      if (!opt) return;
      const gia = parseFloat(opt.dataset.gia) || 0;
      if (gia > 0) {
        document.getElementById('pkg-price').value = fmtVND(gia);
        document.getElementById('pkg-total').value = fmtVND(gia);
      }
      calcPkgEndDate();
    });
    pkgFrom?.addEventListener('change', () => {
      calcPkgEndDate();
      const payDateEl = document.getElementById('pkg-pay-date');
      if (payDateEl) {
        payDateEl.value = pkgFrom.value;
      }
    });

    // Format tiền khách trả khi blur
    document.getElementById('pkg-paid')?.addEventListener('blur', function () {
      const raw = parseVND(this.value);
      this.value = raw > 0 ? fmtVND(raw) : '';
    });
    document.getElementById('pkg-paid')?.addEventListener('focus', function () {
      const raw = parseVND(this.value);
      this.value = raw > 0 ? String(raw) : '';
    });
    document.getElementById('pkg-paid')?.addEventListener('input', function () {
      const errEl = document.getElementById('err-pkg-paid');
      if (errEl) errEl.classList.add('hidden');
      // Xóa highlight lỗi khi người dùng nhập
      this.classList.remove('border-error');
    });

    const today = new Date().toISOString().split('T')[0];
    if (pkgFrom) pkgFrom.value = today;
    if (document.getElementById('pkg-pay-date')) document.getElementById('pkg-pay-date').value = today;

    // 4. Loại hồ sơ & Trường đặc thù
    typeSelect?.addEventListener('change', () => {
      const type = typeSelect.value;
      extraFields.classList.remove('hidden');
      if (type === 'pt') {
        // Chuyên môn PT: input + datalist
        extraFields.innerHTML = `
            <div>
            <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5">Chuyên môn PT <span style="color:#ba1a1a;">*</span></label>
            <input id="reg-chuyen-mon" type="text" list="dl-chuyen-mon" placeholder="VD: Gym, Yoga, Boxing..."
              class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-3 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all" />
          </div>
          <div>
            <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5">Kinh nghiệm (năm)</label>
            <input id="reg-kinh-nghiem" type="number" min="0" max="50" placeholder="VD: 3"
              class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-3 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all" />
          </div>`;
      } else if (type === 'nhan_vien') {
        extraFields.innerHTML = `
          <div>
            <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5">Chức vụ <span style="color:#ba1a1a;">*</span></label>
            <input id="reg-chuc-vu" type="text" placeholder="VD: Lễ tân, Quản lý..."
              class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-3 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all" />
          </div>`;
      } else if (type === 'hoi_vien') {
        extraFields.innerHTML = `
          <div>
            <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5">Hạng hội viên</label>
            <select id="reg-loai-hv" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-3 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all cursor-pointer">
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
    document.getElementById('reg-ten-dang-nhap')?.addEventListener('input', function() {
      this.classList.remove('border-error');
    });

    // 6. Lưu hồ sơ — gửi FormData để upload ảnh cùng lúc
    document.getElementById('btn-save-member')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-save-member');
      const tinhThanh = document.getElementById('reg-tinh-thanh');
      const quanHuyen = document.getElementById('reg-quan-huyen');
      const phuongXa = document.getElementById('reg-phuong-xa');

      const ho_ten = document.getElementById('reg-ho-ten').value.trim();
      const loai_ho_so = typeSelect.value;
      const sdt = document.getElementById('reg-so-dien-thoai').value.trim();
      const chi_nhanh = document.getElementById('reg-chi-nhanh')?.value?.trim();

      if (!ho_ten || !loai_ho_so || !sdt) {
        return window.GymApp.toast('Vui lòng điền đủ các trường bắt buộc (*)', 'error');
      }

      if (['hoi_vien', 'pt', 'nhan_vien'].includes(loai_ho_so) && !chi_nhanh) {
        return window.GymApp.toast('Vui lòng chọn chi nhánh!', 'error');
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
        const pxVal = phuongXa.value?.trim();
        if (pxVal) fd.append('phuong_xa', pxVal);

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
          if (loai_ho_so === 'hoi_vien') {
            const tabPkg = document.getElementById('tab-package');
            if (tabPkg) tabPkg.click();
          } else if (loai_ho_so === 'pt') {
            window.GymApp.navigate('members-list');  // về tab PT trong danh sách
          } else if (loai_ho_so === 'nhan_vien') {
            window.GymApp.navigate('staff');    // về danh sách nhân viên
          }
        }

        await window.GymApp.fetchInitialData();

        if (loai_ho_so === 'hoi_vien') {
          const tabPkg = document.getElementById('tab-package');
          if (tabPkg) tabPkg.click();
        } else if (loai_ho_so === 'pt') {
          window.GymApp.navigate('members-list');
        } else if (loai_ho_so === 'nhan_vien') {
          window.GymApp.navigate('staff');
        }

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
      } catch (e) {
        console.error('Save member error:', e);
        window.GymApp.toast('Lỗi kết nối máy chủ', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">save</span> Lưu hồ sơ';
      }
    });

    // Helper highlight field lỗi
    const highlightField = (id, hasError) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (hasError) {
        el.classList.add('border-error');
        el.classList.remove('border-outline-variant');
      } else {
        el.classList.remove('border-error');
        el.classList.add('border-outline-variant');
      }
    };

    // 7. Lưu đăng ký gói tập
    document.getElementById('btn-save-package')?.addEventListener('click', async () => {
      if (!self._currentMemberId) {
        return window.GymApp.toast('Vui lòng lưu hồ sơ hội viên trước!', 'warning');
      }

      const pkgId = document.getElementById('pkg-select').value;
      const tuNgay = document.getElementById('pkg-from').value;
      const denNgay = document.getElementById('pkg-to').value;
      const ngayThu = document.getElementById('pkg-pay-date').value;
      const phuongThucTT = document.getElementById('pkg-method').value;
      const paidRaw = parseVND(document.getElementById('pkg-paid')?.value);
      const priceRaw = parseVND(document.getElementById('pkg-price')?.value);

      // Highlight các trường bắt buộc chưa điền
      highlightField('pkg-select', !pkgId);
      highlightField('pkg-from', !tuNgay);
      highlightField('pkg-method', !phuongThucTT);
      highlightField('pkg-pay-date', !ngayThu);
      const paidErrEl = document.getElementById('err-pkg-paid');
      const paidInput = document.getElementById('pkg-paid');
      const paidMissing = !document.getElementById('pkg-paid')?.value?.trim();
      if (paidMissing) {
        if (paidErrEl) { paidErrEl.textContent = 'Vui lòng nhập số tiền khách trả'; paidErrEl.classList.remove('hidden'); }
        if (paidInput) paidInput.classList.add('border-error');
      } else {
        if (paidErrEl) paidErrEl.classList.add('hidden');
        if (paidInput) paidInput.classList.remove('border-error');
      }

      if (!pkgId || !tuNgay || !phuongThucTT || paidMissing || !ngayThu) {
        return window.GymApp.toast('Vui lòng điền đủ các trường bắt buộc (*)', 'error');
      }

      if (paidRaw < priceRaw) {
        if (paidErrEl) {
          paidErrEl.textContent = `Số tiền khách trả không được nhỏ hơn giá gói tập (${window.GymApp.formatCurrency(priceRaw)})`;
          paidErrEl.classList.remove('hidden');
        }
        if (paidInput) paidInput.classList.add('border-error');
        return window.GymApp.toast('Số tiền khách trả không đủ!', 'error');
      }

      if (denNgay && ngayThu > denNgay) {
        highlightField('pkg-pay-date', true);
        return window.GymApp.toast('Ngày thu tiền không được vượt quá ngày kết thúc gói tập', 'error');
      }

      const giaThucTe = priceRaw || undefined;

      const btn = document.getElementById('btn-save-package');
      btn.disabled = true;
      btn.innerHTML = '<span class="animate-spin material-symbols-outlined text-sm">sync</span> Đang lưu...';

      try {
        const ghiChuTT = document.getElementById('pkg-note')?.value.trim() || '';
        const res = await window.GymApp.api.post(`/members/${self._currentMemberId}/package`, {
          goi_tap_id: pkgId,
          tu_ngay: tuNgay,
          gia_thuc_te: giaThucTe,
          phuong_thuc_tt: phuongThucTT,
          ma_giao_dich: document.getElementById('pkg-coupon')?.value || '',
          ngay_thanh_toan: ngayThu,
          so_tien_da_thu: paidRaw,
          ghi_chu_tt: ghiChuTT
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

  guideHtml: `
    <div class="space-y-4 text-xs">
      <div class="flex items-start gap-2 bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/10">
        <span class="material-symbols-outlined text-brand-primary text-base flex-shrink-0 mt-0.5">info</span>
        <p class="text-on-surface-variant leading-relaxed">Trang <strong>Thêm hội viên mới</strong> cho phép nhập hồ sơ thông tin và tiến hành đăng ký gói tập ban đầu cho khách hàng.</p>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">Các bước thực hiện:</h4>
        <ul class="list-decimal pl-5 space-y-1 text-on-surface-variant">
          <li><strong>Bước 1: Điền thông tin cá nhân:</strong> Nhập họ tên, số điện thoại, giới tính, ngày sinh. Tải ảnh đại diện (avatar) của hội viên để nhận diện khi check-in.</li>
          <li><strong>Bước 2: Chọn gói tập ban đầu:</strong> Lựa chọn gói tập phù hợp trong danh sách, hệ thống sẽ tự động tính ngày bắt đầu và kết thúc.</li>
          <li><strong>Bước 3: Xác nhận thanh toán:</strong> Chọn phương thức thanh toán (tiền mặt/chuyển khoản), điền số tiền thực tế khách trả (nếu nợ cần chú ý).</li>
          <li><strong>Bước 4: Hoàn tất:</strong> Bấm <strong>Lưu hồ sơ</strong> để tạo tài khoản hội viên và kích hoạt gói tập.</li>
        </ul>
      </div>

      <div class="bg-error/5 border border-error/20 rounded-xl p-3 flex gap-2">
        <span class="material-symbols-outlined text-error text-base flex-shrink-0 mt-0.5">warning</span>
        <p class="text-on-surface-variant leading-relaxed"><strong>Chú ý:</strong> Số điện thoại của hội viên là bắt buộc và phải là duy nhất (không được trùng lặp trong hệ thống).</p>
      </div>
    </div>
  `
};
