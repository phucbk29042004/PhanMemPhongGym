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
      <div class="flex flex-col gap-xs w-full animate-fadeIn pb-2 px-1">
 
        <div class="bg-white/95 dark:bg-[#1a1c23]/98 backdrop-blur rounded-[24px] border border-outline-variant/15 shadow-lg flex flex-col overflow-hidden transition-all duration-300 w-full">
          
          <!-- Unified Header & Tab Navigation -->
          <div class="bg-gradient-to-r from-slate-50/60 to-slate-100/30 dark:from-[#222530]/60 dark:to-[#1e202b]/30 px-5 py-2.5 border-b border-outline-variant/15 flex flex-wrap items-center justify-between gap-xs">
            <div class="flex items-center gap-compact w-full sm:w-auto justify-between sm:justify-start">
              <button class="flex items-center justify-center w-8 h-8 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:text-brand-primary hover:border-brand-primary/60 hover:bg-brand-primary/5 transition-all bg-white dark:bg-[#1e1e1e] active:scale-90 shadow-sm" data-page="members-list" title="Quay lại">
                <span class="material-symbols-outlined text-base">arrow_back</span>
              </button>
              <div class="flex p-0.5 bg-slate-200/50 dark:bg-slate-800/40 backdrop-blur rounded-[16px] border border-outline-variant/20 gap-0.5 shadow-inner">
                <button id="tab-register" class="tab-btn px-4 py-1.5 rounded-[12px] font-extrabold text-body-sm transition-all bg-brand-primary text-white shadow-sm flex items-center gap-xs">
                  <span class="material-symbols-outlined text-[16px]">person_add</span>
                  Hồ sơ cá nhân
                </button>
                <button id="tab-package" class="tab-btn px-4 py-1.5 rounded-[12px] font-extrabold text-body-sm transition-all text-on-surface-variant hover:text-brand-primary hover:bg-brand-primary/5 flex items-center gap-xs">
                  <span class="material-symbols-outlined text-[16px]">card_membership</span>
                  Đăng ký gói dịch vụ
                </button>
              </div>
            </div>
          </div>
 
          <!-- Content Area: Hồ sơ cá nhân -->
          <div id="form-register" class="p-4 flex-grow flex flex-col">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-grow">
              
              <!-- CỘT TRÁI: Hồ sơ & Cá nhân (lg:col-span-7) -->
              <div class="lg:col-span-7 flex flex-col justify-between h-full space-y-4">
                <div class="space-y-4">
                  <!-- Avatar + Mã số/Họ tên -->
                  <div class="bg-gradient-to-br from-slate-50/55 to-slate-100/20 dark:from-[#232836]/40 dark:to-[#1a1d26]/10 rounded-2xl border border-outline-variant/15 p-4 flex flex-col sm:flex-row gap-6 items-center sm:items-start transition-all hover:border-outline-variant/25">
                    <div class="flex flex-col items-center gap-1 flex-shrink-0">
                      <div class="relative group">
                        <div id="avatar-area-reg" class="w-20 h-20 bg-slate-200/30 dark:bg-slate-800/30 border-2 border-dashed border-outline-variant/50 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-brand-primary hover:bg-brand-primary/5 shadow-inner">
                          <span class="material-symbols-outlined text-on-surface-variant/60 text-3xl group-hover:scale-110 transition-transform" id="avatar-placeholder-reg">person</span>
                          <img id="avatar-preview-reg" class="w-full h-full object-cover absolute inset-0 hidden" alt="preview" />
                        </div>
                        <button type="button" id="avatar-btn-reg" class="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-primary text-white rounded-lg flex items-center justify-center shadow-lg z-10 hover:scale-110 active:scale-90 transition-all border-2 border-white dark:border-[#1a1c23]">
                          <span class="material-symbols-outlined text-white text-[10px]">photo_camera</span>
                        </button>
                        <input type="file" id="avatar-input-reg" class="hidden" accept="image/jpeg,image/png,image/webp" />
                      </div>
                      <span class="text-[9px] text-on-surface-variant/80 font-bold uppercase tracking-widest">Ảnh</span>
                    </div>
                    
                    <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                      ${this._field('Mã số hồ sơ', 'reg-ma-ho-so', 'text', 'Hệ thống tự tạo...', true)}
                      ${this._field('Họ và tên *', 'reg-ho-ten', 'text', 'Họ tên đầy đủ')}
                      ${this._select('Loại hồ sơ *', 'reg-loai-ho-so', [
      { v: 'hoi_vien', t: 'Hội viên' },
      { v: 'pt', t: 'Huấn luyện viên' },
      { v: 'nhan_vien', t: 'Nhân viên' }
    ])}
                    </div>
                  </div>
                  
                  <!-- Dynamic extra fields -->
                  <div id="extra-fields" class="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-dashed border-outline-variant/30 p-4 rounded-2xl bg-brand-primary/5 dark:bg-[#1a1d26]/20 transition-all hidden"></div>
                  
                  <!-- Cá nhân chi tiết & liên hệ -->
                  <div class="bg-slate-50/10 dark:bg-[#1c2028]/5 rounded-2xl border border-outline-variant/15 p-4 space-y-3 shadow-sm">
                    <div class="flex items-center gap-compact border-b border-outline-variant/15 pb-1">
                      <span class="material-symbols-outlined text-brand-primary text-base">contact_page</span>
                      <h4 class="font-extrabold text-on-surface text-body-sm uppercase tracking-wider">Cá nhân & Liên hệ</h4>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                      ${this._field('Ngày sinh', 'reg-ngay-sinh', 'date')}
                      ${this._select('Giới tính', 'reg-gioi-tinh', [{ v: 'nam', t: 'Nam' }, { v: 'nu', t: 'Nữ' }, { v: 'khac', t: 'Khác' }])}
                      
                      <div class="mb-1.5">
                        <label class="block text-body-sm font-extrabold text-on-surface-variant/80 mb-0.5 uppercase tracking-wider text-[9.5px]">Số điện thoại <span class="text-red-500">*</span></label>
                        <input id="reg-so-dien-thoai" type="tel" placeholder="0912345678" maxlength="10"
                          class="w-full bg-slate-50/50 dark:bg-slate-900/30 border border-outline-variant/40 text-on-surface px-3 py-1.5 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1a1c23] outline-none text-body-md font-semibold transition-all duration-200 shadow-sm focus:shadow-md focus:ring-2 focus:ring-brand-primary/10" />
                        <p id="err-sdt" class="hidden text-body-xs mt-xs font-semibold text-red-500"></p>
                      </div>
                      
                      <div class="mb-1.5">
                        <label class="block text-body-sm font-extrabold text-on-surface-variant/80 mb-0.5 uppercase tracking-wider text-[9.5px]">Email</label>
                        <input id="reg-email" type="email" placeholder="example@email.com"
                          class="w-full bg-slate-50/50 dark:bg-slate-900/30 border border-outline-variant/40 text-on-surface px-3 py-1.5 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1a1c23] outline-none text-body-md font-semibold transition-all duration-200 shadow-sm focus:shadow-md focus:ring-2 focus:ring-brand-primary/10" />
                        <p id="err-email" class="hidden text-body-xs mt-xs font-semibold text-red-500"></p>
                      </div>
                      
                      <div class="mb-1.5">
                        <label class="block text-body-sm font-extrabold text-on-surface-variant/80 mb-0.5 uppercase tracking-wider text-[9.5px]">CCCD / CMND</label>
                        <input id="reg-cccd" type="text" placeholder="012345678901" maxlength="12"
                          class="w-full bg-slate-50/50 dark:bg-slate-900/30 border border-outline-variant/40 text-on-surface px-3 py-1.5 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1a1c23] outline-none text-body-md font-semibold transition-all duration-200 shadow-sm focus:shadow-md focus:ring-2 focus:ring-brand-primary/10" />
                        <p id="err-cccd" class="hidden text-body-xs mt-xs font-semibold text-red-500"></p>
                      </div>
   
                      ${this._field('Nơi sinh', 'reg-noi-sinh', 'text', 'VD: Hà Nội')}
                      ${this._field('Quê quán', 'reg-que-quan', 'text', 'Chọn hoặc nhập...')}
                      ${this._select('Chi nhánh', 'reg-chi-nhanh', [])}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- CỘT PHẢI: Địa chỉ & Tài khoản (lg:col-span-5) -->
              <div class="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
                <div class="space-y-4 flex flex-col justify-start">
                  <!-- Địa chỉ -->
                  <div class="bg-slate-50/10 dark:bg-[#1c2028]/5 rounded-2xl border border-outline-variant/15 p-4 space-y-3 shadow-sm">
                    <div class="flex items-center gap-standard border-b border-outline-variant/15 pb-1">
                      <span class="material-symbols-outlined text-brand-primary text-base">home_pin</span>
                      <h4 class="font-extrabold text-on-surface text-body-sm uppercase tracking-wider">Địa chỉ thường trú</h4>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      ${this._select('Tỉnh / Thành', 'reg-tinh-thanh', [])}
                      ${this._select('Phường / Xã', 'reg-phuong-xa', [])}
                    </div>
                    <div class="mt-1">
                      ${this._field('Số nhà / Đường', 'reg-dia-chi', 'text', '123 Đường...')}
                    </div>
                  </div>

                  <!-- Tài khoản -->
                  <div class="bg-slate-50/10 dark:bg-[#1c2028]/5 rounded-2xl border border-outline-variant/15 p-4 transition-all shadow-sm flex flex-col justify-start">
                    <label class="flex items-center gap-compact cursor-pointer select-none mb-0" id="label-create-account">
                      <input type="checkbox" id="chk-create-account" class="w-4 h-4 rounded border-2 border-outline-variant/60 accent-brand-primary cursor-pointer transition-all" />
                      <span class="material-symbols-outlined text-brand-primary text-[18px]">manage_accounts</span>
                      <span class="font-bold text-on-surface text-[10px] uppercase tracking-wider">Kích hoạt tài khoản đăng nhập</span>
                    </label>
                    <div id="account-help-text" class="text-body-xs text-on-surface-variant/70 mt-2 font-medium leading-relaxed">
                      Kích hoạt tài khoản đăng nhập để hội viên sử dụng ứng dụng di động theo dõi gói tập, lịch sử tập luyện và nhận thông báo từ phòng tập.
                    </div>
                    <div id="account-fields" class="hidden mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white/70 dark:bg-[#1a1c23]/60 backdrop-blur rounded-xl border border-outline-variant/15 animate-fadeIn">
                      ${this._field('Tên đăng nhập *', 'reg-ten-dang-nhap', 'text', 'Tên đăng nhập')}
                      ${this._field('Mật khẩu *', 'reg-mat-khau', 'password', 'Tối thiểu 6 ký tự')}
                    </div>
                  </div>

                  <!-- Thẻ lưu ý bảo mật -->
                  <div class="p-4 bg-slate-50/5 dark:bg-[#1c2028]/2 rounded-2xl border border-dashed border-outline-variant/25 space-y-2">
                    <div class="flex items-center gap-compact text-on-surface-variant/80">
                      <span class="material-symbols-outlined text-[16px] text-brand-primary">shield</span>
                      <span class="font-bold text-[9px] uppercase tracking-wider">Lưu ý bảo mật tài khoản</span>
                    </div>
                    <ul class="text-[10px] text-on-surface-variant/70 space-y-1 list-disc pl-4 leading-normal">
                      <li>Mật khẩu cấp mới nên có độ dài tối thiểu 6 ký tự.</li>
                      <li>Khuyến khích hội viên đổi mật khẩu ngay sau lần đăng nhập đầu tiên.</li>
                      <li>Tài khoản này dùng để đăng nhập ứng dụng Mobile theo dõi lịch tập và gói dịch vụ.</li>
                    </ul>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex justify-end gap-standard pt-3 border-t border-outline-variant/15 mt-auto">
                  <button type="button" class="px-4 py-2 rounded-xl border border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-95 transition-all font-bold text-body-sm shadow-sm" data-page="members-list">Hủy</button>
                  <button type="button" id="btn-save-member" class="px-4 py-2 rounded-xl bg-brand-primary text-white hover:shadow-lg hover:shadow-brand-primary/25 active:scale-95 transition-all font-bold text-body-sm flex items-center justify-center gap-compact">
                    <span class="material-symbols-outlined text-sm font-extrabold">save</span>
                    Lưu hồ sơ
                  </button>
                </div>
              </div>
 
            </div>
          </div> <!-- End form-register -->
 
          <!-- Content Area: Đăng ký gói tập -->
          <div id="form-package" class="hidden p-4 flex-grow flex flex-col animate-fadeIn">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-grow">
              
              <!-- CỘT TRÁI: Gói tập & Thanh toán -->
              <div class="lg:col-span-7 flex flex-col justify-between h-full space-y-4">
                <div class="space-y-4 flex-grow flex flex-col justify-start">

                  <div class="bg-slate-50/10 dark:bg-[#1c2028]/5 border border-outline-variant/20 rounded-2xl p-4 space-y-4 shadow-sm">
                    <div class="flex items-center gap-standard border-b border-outline-variant/15 pb-1">
                      <span class="material-symbols-outlined text-brand-primary text-base">assignment</span>
                      <h4 class="font-extrabold text-on-surface text-body-sm uppercase tracking-wider">
                        Thông tin Đăng ký & Thanh toán
                        <span id="selected-member-name-inline" class="text-brand-primary text-[11px] normal-case ml-2 font-bold hidden"></span>
                      </h4>
                    </div>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                      <div class="mb-1.5">
                        <label class="block text-body-sm font-extrabold text-on-surface-variant/80 mb-0.5 uppercase tracking-wider text-[9.5px]">Chọn gói tập <span class="text-red-500">*</span></label>
                        <select id="pkg-select" class="w-full bg-slate-50/50 dark:bg-slate-900/30 border border-outline-variant/40 text-on-surface px-3 py-1.5 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1a1c23] outline-none text-body-md font-semibold transition-all cursor-pointer shadow-sm focus:ring-2 focus:ring-brand-primary/10">
                          <option value="">— Chọn gói tập —</option>
                          ${(window.GymApp.data.packages || []).map(p => `<option value="${p.id}" data-gia="${p.gia}" data-thang="${p.so_thang || 0}" data-them="${p.so_ngay_them || 0}">${p.ten_goi} — ${window.GymApp.formatCurrency(p.gia)}</option>`).join('')}
                        </select>
                      </div>
                      ${this._field('Giá thực tế gói tập (đ) *', 'pkg-price', 'text', '0', true)}
                      ${this._field('Mã giảm giá', 'pkg-coupon', 'text', 'Không có')}
                      ${this._field('Từ ngày', 'pkg-from', 'date')}
                      ${this._field('Đến ngày (tự động tính)', 'pkg-to', 'date', '', true)}
                      ${this._field('Tổng số tiền cần trả (đ)', 'pkg-total', 'text', '0', true)}
                      
                      <div class="mb-1.5">
                        <label class="block text-body-sm font-extrabold text-on-surface-variant/80 mb-0.5 uppercase tracking-wider text-[9.5px]">Số tiền khách trả (đ) <span class="text-red-500">*</span></label>
                        <input id="pkg-paid" type="text" inputmode="numeric" placeholder="VD: 1.500.000"
                          class="w-full bg-slate-50/50 dark:bg-slate-900/30 border border-outline-variant/40 text-on-surface px-3 py-1.5 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1a1c23] outline-none text-body-md font-semibold transition-all shadow-sm focus:shadow-md focus:ring-2 focus:ring-brand-primary/10" />
                        <p id="err-pkg-paid" class="hidden text-body-xs mt-xs font-semibold text-red-500"></p>
                      </div>
                      ${this._field('Ngày thu tiền *', 'pkg-pay-date', 'date', '', true)}
                      ${this._select('Phương thức thanh toán', 'pkg-method', [{ v: 'tien_mat', t: 'Tiền mặt' }, { v: 'chuyen_khoan', t: 'Chuyển khoản' }])}
                      ${this._field('Ghi chú giao dịch', 'pkg-note', 'text', 'Ghi chú thanh toán...')}
                    </div>
                  </div>
                </div>
              </div>
   
              <!-- CỘT PHẢI: Hóa đơn tạm tính & Quyền lợi & Actions -->
              <div class="lg:col-span-5 flex flex-col justify-between h-full space-y-3">
                <div id="pkg-summary-card" class="bg-gradient-to-br from-slate-50/90 to-slate-100/50 dark:from-[#232836]/40 dark:to-[#1a1d26]/20 border border-outline-variant/15 rounded-2xl p-4 py-3 space-y-3 shadow-md flex-grow flex flex-col justify-between">
                  <!-- Receipt Header -->
                  <div class="flex items-center justify-between border-b border-dashed border-outline-variant/40 pb-1.5">
                    <div class="flex items-center gap-compact">
                      <span class="material-symbols-outlined text-brand-primary text-base">receipt_long</span>
                      <span class="font-extrabold text-on-surface text-body-sm uppercase tracking-wider">Hóa đơn tạm tính</span>
                    </div>
                    <span class="text-[9px] font-bold text-on-surface-variant bg-slate-200/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-full uppercase tracking-wider">Tạm tính</span>
                  </div>

                  <!-- Receipt items -->
                  <div class="space-y-1.5 text-body-sm flex-grow">
                    <!-- Member Info in receipt -->
                    <div class="flex justify-between items-center text-[10px] text-on-surface-variant/90 border-b border-outline-variant/10 pb-1">
                      <span class="font-bold uppercase tracking-wider text-[9px]">Hội viên:</span>
                      <span id="receipt-member-name" class="font-extrabold text-on-surface text-right truncate max-w-[180px]">Chưa lưu hồ sơ</span>
                    </div>

                    <!-- Package Name -->
                    <div class="flex justify-between items-start text-body-sm border-b border-outline-variant/10 pb-1">
                      <span class="font-bold text-on-surface-variant/80">Gói tập:</span>
                      <span id="receipt-package-name" class="font-extrabold text-on-surface text-right max-w-[180px]">Chưa chọn</span>
                    </div>

                    <!-- Duration -->
                    <div class="flex justify-between items-center text-body-sm border-b border-outline-variant/10 pb-1">
                      <span class="font-bold text-on-surface-variant/80">Thời hạn:</span>
                      <span id="receipt-duration" class="font-extrabold text-on-surface text-right">--</span>
                    </div>

                    <!-- Apply Date -->
                    <div class="flex justify-between items-center text-body-sm border-b border-outline-variant/10 pb-1">
                      <span class="font-bold text-on-surface-variant/80">Hiệu lực:</span>
                      <span id="receipt-validity" class="font-extrabold text-on-surface text-right text-xs">--</span>
                    </div>

                    <!-- Calculation details -->
                    <div class="space-y-1.5 pt-1">
                      <div class="flex justify-between items-center text-body-sm">
                        <span class="font-bold text-on-surface-variant/80">Cần thanh toán:</span>
                        <span id="receipt-total" class="font-extrabold text-on-surface">0 đ</span>
                      </div>
                      <div class="flex justify-between items-center text-body-sm">
                        <span class="font-bold text-on-surface-variant/80">Đã trả:</span>
                        <span id="receipt-paid" class="font-extrabold text-brand-primary">0 đ</span>
                      </div>
                      <!-- Remaining / Overpaid -->
                      <div class="flex justify-between items-center text-body-sm pt-1 border-t border-dashed border-outline-variant/40">
                        <span id="receipt-status-label" class="font-extrabold uppercase text-[10px] tracking-wider text-on-surface-variant/80">Còn thiếu:</span>
                        <span id="receipt-status-value" class="font-black text-body-md text-red-500">0 đ</span>
                      </div>
                    </div>
                  </div>

                  <!-- Mini Package Benefits (Quyền lợi gói tập) -->
                  <div class="border-t border-outline-variant/15 pt-2 space-y-1">
                    <div class="flex items-center gap-compact text-on-surface-variant/80">
                      <span class="material-symbols-outlined text-[15px] text-brand-primary">workspace_premium</span>
                      <span class="font-bold text-[9px] uppercase tracking-wider">Đặc quyền hội viên </span>
                    </div>
                    <div id="receipt-benefits" class="grid grid-cols-2 gap-1 text-[9px] text-on-surface-variant/80 font-semibold">
                      <div class="flex items-center gap-xs"><span class="material-symbols-outlined text-[12px] text-emerald-500">check_circle</span>Tập tự do</div>
                      <div class="flex items-center gap-xs"><span class="material-symbols-outlined text-[12px] text-emerald-500">check_circle</span>Tủ Locker</div>
                      <div class="flex items-center gap-xs"><span class="material-symbols-outlined text-[12px] text-emerald-500">check_circle</span>Nước uống</div>
                      <div class="flex items-center gap-xs"><span class="material-symbols-outlined text-[12px] text-emerald-500">check_circle</span>InBody/BMI</div>
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex justify-end gap-standard pt-2 border-t border-outline-variant/15 mt-auto">
                  <button type="button" class="px-4 py-2 rounded-xl border border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-95 transition-all font-bold text-body-sm shadow-sm" data-page="members-list">Hủy</button>
                  <button type="button" id="btn-save-package" class="px-4 py-2 rounded-xl bg-brand-primary text-white hover:shadow-lg hover:shadow-brand-primary/25 active:scale-95 transition-all font-bold text-body-sm flex items-center justify-center gap-compact">
                    <span class="material-symbols-outlined text-sm font-extrabold">save</span>
                    Xác nhận lưu
                  </button>
                </div>
              </div>
 
            </div>
          </div>
        </div> <!-- End Main Container -->
      </div>`;
  },

  _field: function (label, id, type, placeholder = '', readonly = false) {
    const formattedLabel = label.replace('*', ' <span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>');
    const base = 'w-full border border-outline-variant/40 text-on-surface px-3 py-1.5 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1a1c23] outline-none text-body-md font-semibold transition-all duration-200 focus:ring-2 focus:ring-brand-primary/10';
    if (readonly) {
      return `<div class="mb-1.5">
        <label class="block text-body-sm font-bold text-on-surface-variant/80 mb-0.5 uppercase tracking-wider text-[9.5px]">${formattedLabel}</label>
        <input id="${id}" type="${type}" placeholder="${placeholder}" readonly
          class="${base} bg-slate-200/50 dark:bg-slate-800/50 text-on-surface-variant cursor-not-allowed opacity-75 shadow-none border-dashed" />
      </div>`;
    }
    return `<div class="mb-1.5">
      <label class="block text-body-sm font-bold text-on-surface-variant/80 mb-0.5 uppercase tracking-wider text-[9.5px]">${formattedLabel}</label>
      <input id="${id}" type="${type}" placeholder="${placeholder}"
        class="${base} bg-slate-50/50 dark:bg-slate-900/30 shadow-sm focus:shadow-md" />
    </div>`;
  },

  _select: function (label, id, options) {
    const formattedLabel = label.replace('*', ' <span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>');
    return `<div class="mb-1.5">
      <label class="block text-body-sm font-bold text-on-surface-variant/80 mb-0.5 uppercase tracking-wider text-[9.5px]">${formattedLabel}</label>
      <select id="${id}" class="w-full bg-slate-50/50 dark:bg-slate-900/30 border border-outline-variant/40 text-on-surface px-3 py-1.5 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1a1c23] outline-none text-body-md font-semibold transition-all cursor-pointer shadow-sm focus:shadow-md focus:ring-2 focus:ring-brand-primary/10">
        <option value="">— ${label.replace('*', '').trim()} —</option>
        ${options.map(o => `<option value="${o.v}">${o.t}</option>`).join('')}
      </select>
    </div>`;
  },

  _datalistInput: function (label, id, listId, placeholder = '') {
    const formattedLabel = label.replace('*', ' <span style="color:#ba1a1a;margin-left:2px;font-weight:700;">*</span>');
    const base = 'w-full bg-slate-50/50 dark:bg-slate-900/30 border border-outline-variant/40 text-on-surface px-3 py-1.5 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1a1c23] outline-none text-body-md font-semibold transition-all duration-200 focus:ring-2 focus:ring-brand-primary/10 shadow-sm focus:shadow-md';
    return `<div class="mb-1.5">
      <label class="block text-body-sm font-bold text-on-surface-variant/80 mb-0.5 uppercase tracking-wider text-[9.5px]">${formattedLabel}</label>
      <input id="${id}" type="text" list="${listId}" placeholder="${placeholder}"
        class="${base}" autocomplete="off" />
      <datalist id="${listId}"></datalist>
    </div>`;
  },

  // Logics
  init: async function () {
    const self = this;

    // Tải danh sách chi nhánh nếu chưa có trong cache
    if (!window.GymApp.data.branches || window.GymApp.data.branches.length === 0) {
      try {
        const branchesRes = await window.GymApp.api.get('/branches').catch(() => null);
        if (branchesRes && branchesRes.success) {
          window.GymApp.data.branches = branchesRes.data || [];
        } else {
          const localBranches = await fetch('assets/data/branches.json').then(r => r.json()).catch(() => []);
          window.GymApp.data.branches = localBranches;
        }
      } catch (e) {
        console.error('Failed to fetch branches:', e);
      }
    }

    // Tải dữ liệu tỉnh thành / quận huyện / phường xã nếu chưa có trong cache
    if (!this._provinces || this._provinces.length === 0) {
      try {
        const [pRes, dRes, wRes] = await Promise.all([
          fetch('assets/data/provinces.json').then(r => r.json()).catch(() => []),
          fetch('assets/data/districts.json').then(r => r.json()).catch(() => []),
          fetch('assets/data/wards.json').then(r => r.json()).catch(() => [])
        ]);
        this._provinces = pRes;
        this._districts = dRes;
        this._wards = wRes;
        console.log('Address data loaded and cached:', {
          provinces: pRes.length,
          districts: dRes.length,
          wards: wRes.length
        });
      } catch (e) {
        console.error('Failed to fetch provinces/districts/wards:', e);
      }
    }

    this._initEvents();
    this._loadInitialData();
  },

  _loadInitialData: function () {
    const elBranch = document.getElementById('reg-chi-nhanh');
    if (elBranch) {
      const branches = window.GymApp.data.branches || [];
      elBranch.innerHTML = '<option value="">— Chọn chi nhánh —</option>' +
        branches.map(b => `<option value="${b.id}">${b.ten || b.ten_chi_nhanh}</option>`).join('');
    }
    this._renderProvinces();
  },

  _renderProvinces: function () {
    const elProvince = document.getElementById('reg-tinh-thanh');
    if (!elProvince) return;
    elProvince.innerHTML = '<option value="">— Tỉnh / Thành —</option>' +
      this._provinces.map(p => `<option value="${p.code}">${p.name}</option>`).join('');
  },

  _initEvents: function () {
    const self = this;

    // Switch tab
    const tabRegister = document.getElementById('tab-register');
    const tabPackage = document.getElementById('tab-package');
    const formRegister = document.getElementById('form-register');
    const formPackage = document.getElementById('form-package');

    if (tabRegister && tabPackage && formRegister && formPackage) {
      tabRegister.addEventListener('click', function () {
        self._activeTab = 'register';
        tabRegister.classList.add('bg-brand-primary', 'text-white', 'shadow-sm');
        tabRegister.classList.remove('text-on-surface-variant', 'hover:text-brand-primary', 'hover:bg-brand-primary/5');
        tabPackage.classList.remove('bg-brand-primary', 'text-white', 'shadow-sm');
        tabPackage.classList.add('text-on-surface-variant', 'hover:text-brand-primary', 'hover:bg-brand-primary/5');
        formRegister.classList.remove('hidden');
        formPackage.classList.add('hidden');
      });

      tabPackage.addEventListener('click', function () {
        self._activeTab = 'package';
        tabPackage.classList.add('bg-brand-primary', 'text-white', 'shadow-sm');
        tabPackage.classList.remove('text-on-surface-variant', 'hover:text-brand-primary', 'hover:bg-brand-primary/5');
        tabRegister.classList.remove('bg-brand-primary', 'text-white', 'shadow-sm');
        tabRegister.classList.add('text-on-surface-variant', 'hover:text-brand-primary', 'hover:bg-brand-primary/5');
        formPackage.classList.remove('hidden');
        formRegister.classList.add('hidden');
        self._syncSelectedMemberInfo();
        self._updatePackageSummary();
      });
    }

    // Avatar upload preview
    const avatarArea = document.getElementById('avatar-area-reg');
    const avatarInput = document.getElementById('avatar-input-reg');
    const avatarBtn = document.getElementById('avatar-btn-reg');
    const avatarPreview = document.getElementById('avatar-preview-reg');
    const avatarPlaceholder = document.getElementById('avatar-placeholder-reg');

    if (avatarArea && avatarInput) {
      const triggerSelect = () => avatarInput.click();
      avatarArea.addEventListener('click', triggerSelect);
      if (avatarBtn) avatarBtn.addEventListener('click', (e) => { e.stopPropagation(); triggerSelect(); });

      avatarInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
          self._avatarFile = file;
          const reader = new FileReader();
          reader.onload = function (evt) {
            avatarPreview.src = evt.target.result;
            avatarPreview.classList.remove('hidden');
            avatarPlaceholder.classList.add('hidden');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Tỉnh thành -> Phường xã trực tiếp
    const elProvince = document.getElementById('reg-tinh-thanh');
    const elWard = document.getElementById('reg-phuong-xa');

    if (elProvince && elWard) {
      elProvince.addEventListener('change', function () {
        const pCode = this.value;
        console.log('Province selected:', pCode);
        if (!pCode) {
          elWard.innerHTML = '<option value="">— Phường / Xã —</option>';
          return;
        }
        // Lấy tất cả quận/huyện thuộc tỉnh/thành này
        const districtsInProv = self._districts.filter(d => d.province_code == pCode);
        const distCodes = districtsInProv.map(d => d.code);
        // Lọc tất cả các phường/xã thuộc các quận/huyện đó
        const filteredWards = self._wards.filter(w => distCodes.includes(w.district_code));
        console.log('Filtered wards count for province:', filteredWards.length);

        elWard.innerHTML = '<option value="">— Phường / Xã —</option>' +
          filteredWards.map(w => `<option value="${w.code}">${w.name}</option>`).join('');
      });
    }

    // Toggle Account fields
    const chkAccount = document.getElementById('chk-create-account');
    const accountFields = document.getElementById('account-fields');
    const accountHelpText = document.getElementById('account-help-text');
    if (chkAccount && accountFields) {
      chkAccount.addEventListener('change', function () {
        if (this.checked) {
          accountFields.classList.remove('hidden');
          accountFields.classList.add('grid');
          if (accountHelpText) accountHelpText.classList.add('hidden');
          // Autocomplete username by phone if filled
          const phone = document.getElementById('reg-so-dien-thoai').value;
          const uInput = document.getElementById('reg-ten-dang-nhap');
          if (phone && uInput && !uInput.value) {
            uInput.value = phone;
          }
        } else {
          accountFields.classList.add('hidden');
          accountFields.classList.remove('grid');
          if (accountHelpText) accountHelpText.classList.remove('hidden');
        }
      });
    }

    // Extra fields based on role selection
    const elRole = document.getElementById('reg-loai-ho-so');
    if (elRole) {
      elRole.addEventListener('change', function () {
        self._renderExtraFields(this.value);
      });
    }

    // Save Member Action
    const btnSaveMem = document.getElementById('btn-save-member');
    if (btnSaveMem) {
      btnSaveMem.addEventListener('click', function () {
        self._handleSaveMember();
      });
    }

    // Gói tập calculations
    const pkgSelect = document.getElementById('pkg-select');
    const pkgPriceInput = document.getElementById('pkg-price');
    const pkgTotalInput = document.getElementById('pkg-total');
    const pkgFromInput = document.getElementById('pkg-from');
    const pkgToInput = document.getElementById('pkg-to');
    const pkgPaidInput = document.getElementById('pkg-paid');
    const pkgPayDateInput = document.getElementById('pkg-pay-date');

    if (pkgSelect) {
      pkgSelect.addEventListener('change', function () {
        const opt = this.options[this.selectedIndex];
        if (!opt || !opt.value) {
          pkgPriceInput.value = '0';
          pkgTotalInput.value = '0';
          pkgToInput.value = '';
          self._updatePackageSummary();
          return;
        }
        const rawGia = parseFloat(opt.getAttribute('data-gia') || 0);
        const formatted = new Intl.NumberFormat('vi-VN').format(rawGia);
        pkgPriceInput.value = formatted;
        pkgTotalInput.value = formatted;
        pkgPaidInput.value = formatted;
        self._calculateEndDate();
        self._updatePackageSummary();
      });
    }

    if (pkgFromInput) {
      pkgFromInput.value = new Date().toISOString().split('T')[0];
      pkgFromInput.addEventListener('change', function () {
        self._calculateEndDate();
        self._updatePackageSummary();
      });
    }

    if (pkgPayDateInput) {
      pkgPayDateInput.value = new Date().toISOString().split('T')[0];
    }

    // Format paid currency on blur/input
    if (pkgPaidInput) {
      pkgPaidInput.addEventListener('input', function (e) {
        let val = this.value.replace(/[^0-9]/g, '');
        if (val) {
          this.value = new Intl.NumberFormat('vi-VN').format(parseFloat(val));
        } else {
          this.value = '';
        }
        self._updatePackageSummary();
      });
    }

    // Save package logic
    const btnSavePkg = document.getElementById('btn-save-package');
    if (btnSavePkg) {
      btnSavePkg.addEventListener('click', function () {
        self._handleSavePackage();
      });
    }
  },

  _syncSelectedMemberInfo: function () {
    const nameDisplayInline = document.getElementById('selected-member-name-inline');
    const nameDisplayReceipt = document.getElementById('receipt-member-name');

    if (this._currentMemberId) {
      if (nameDisplayInline) {
        nameDisplayInline.textContent = `(Hội viên: ${this._currentMemberName} - #${this._currentMemberId})`;
        nameDisplayInline.classList.remove('hidden');
      }
      if (nameDisplayReceipt) {
        nameDisplayReceipt.textContent = this._currentMemberName;
      }
    }
  },

  _calculateEndDate: function () {
    const pkgSelect = document.getElementById('pkg-select');
    const pkgFromInput = document.getElementById('pkg-from');
    const pkgToInput = document.getElementById('pkg-to');

    if (!pkgSelect || !pkgFromInput || !pkgToInput) return;

    const opt = pkgSelect.options[pkgSelect.selectedIndex];
    if (!opt || !opt.value || !pkgFromInput.value) return;

    const startVal = pkgFromInput.value;
    const months = parseInt(opt.getAttribute('data-thang') || 0);
    const extraDays = parseInt(opt.getAttribute('data-them') || 0);

    const startDate = new Date(startVal);
    if (isNaN(startDate.getTime())) return;

    // Add months
    startDate.setMonth(startDate.getMonth() + months);
    // Add extra days
    if (extraDays > 0) {
      startDate.setDate(startDate.getDate() + extraDays);
    }
    pkgToInput.value = startDate.toISOString().split('T')[0];
  },

  _renderExtraFields: function (role) {
    const box = document.getElementById('extra-fields');
    if (!box) return;

    box.innerHTML = '';
    if (!role || role === 'hoi_vien') {
      box.classList.add('hidden');
      return;
    }

    box.classList.remove('hidden');
    if (role === 'pt') {
      box.innerHTML = `
        ${this._field('Số CCCD *', 'pt-cccd', 'text', 'CCCD huấn luyện viên')}
        ${this._field('Bằng cấp / Chứng chỉ', 'pt-bang-cap', 'text', 'VD: NASM, Bằng thể thao...')}
        <div class="mb-1.5">
          <label class="block text-body-sm font-bold text-on-surface-variant/80 mb-0.5 uppercase tracking-wider text-[9.5px]">Chuyên môn chính</label>
          <input id="pt-chuyen-mon" type="text" list="dl-chuyen-mon" placeholder="Chọn hoặc nhập..."
            class="w-full bg-slate-50/50 dark:bg-slate-900/30 border border-outline-variant/40 text-on-surface px-3 py-1.5 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1a1c23] outline-none text-body-md font-semibold transition-all duration-200 focus:ring-2 focus:ring-brand-primary/10 shadow-sm" />
        </div>
        ${this._field('Tỷ lệ chia sẻ doanh thu (%)', 'pt-commission', 'number', 'VD: 30')}
      `;
    } else if (role === 'nhan_vien') {
      box.innerHTML = `
        ${this._field('Số CCCD *', 'nv-cccd', 'text', 'CCCD nhân viên')}
        ${this._select('Chức vụ *', 'nv-chuc-vu', [
        { v: 'admin', t: 'Quản trị viên' },
        { v: 'nhan_vien', t: 'Lễ tân / Nhân viên' }
      ])}
        ${this._field('Mức lương cơ bản (đ)', 'nv-luong', 'text', 'VD: 5.000.000')}
      `;
    }
  },

  _handleSaveMember: function () {
    const self = this;
    const hoTen = document.getElementById('reg-ho-ten').value.trim();
    const loaiHoSo = document.getElementById('reg-loai-ho-so').value;
    const sdt = document.getElementById('reg-so-dien-thoai').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const cccd = document.getElementById('reg-cccd').value.trim();
    const ngaySinh = document.getElementById('reg-ngay-sinh').value;
    const gioiTinh = document.getElementById('reg-gioi-tinh').value;
    const noiSinh = document.getElementById('reg-noi-sinh').value.trim();
    const queQuan = document.getElementById('reg-que-quan').value.trim();
    const chiNhanhId = document.getElementById('reg-chi-nhanh').value;

    const elProvince = document.getElementById('reg-tinh-thanh');
    const elWard = document.getElementById('reg-phuong-xa');
    const street = document.getElementById('reg-dia-chi').value.trim();

    // Inline errors reset
    const errSdt = document.getElementById('err-sdt');
    const errEmail = document.getElementById('err-email');
    const errCccd = document.getElementById('err-cccd');

    if (errSdt) errSdt.classList.add('hidden');
    if (errEmail) errEmail.classList.add('hidden');
    if (errCccd) errCccd.classList.add('hidden');

    if (!hoTen) {
      window.GymApp.toast('Vui lòng nhập họ và tên', 'error');
      return;
    }
    if (!loaiHoSo) {
      window.GymApp.toast('Vui lòng chọn loại hồ sơ', 'error');
      return;
    }
    if (!sdt) {
      window.GymApp.toast('Vui lòng nhập số điện thoại', 'error');
      return;
    }

    // Validate phone format
    const phoneRegex = /^(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})$/;
    if (!phoneRegex.test(sdt)) {
      if (errSdt) {
        errSdt.textContent = 'Số điện thoại không đúng định dạng VN (10 số)';
        errSdt.classList.remove('hidden');
      }
      window.GymApp.toast('Số điện thoại không đúng định dạng!', 'error');
      return;
    }

    // Validate email format
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        if (errEmail) {
          errEmail.textContent = 'Địa chỉ email không đúng định dạng';
          errEmail.classList.remove('hidden');
        }
        window.GymApp.toast('Email không đúng định dạng!', 'error');
        return;
      }
    }

    // Validate CCCD format
    if (cccd) {
      const cccdRegex = /^[0-9]{9}$|^[0-9]{12}$/;
      if (!cccdRegex.test(cccd)) {
        if (errCccd) {
          errCccd.textContent = 'CCCD phải là 9 hoặc 12 số';
          errCccd.classList.remove('hidden');
        }
        window.GymApp.toast('CCCD không hợp lệ!', 'error');
        return;
      }
    }

    // Role dynamic validation
    let extraData = {};
    if (loaiHoSo === 'pt') {
      const ptCccd = document.getElementById('pt-cccd').value.trim();
      const ptBangCap = document.getElementById('pt-bang-cap').value.trim();
      const ptChuyenMon = document.getElementById('pt-chuyen-mon').value.trim();
      const ptComm = document.getElementById('pt-commission').value.trim();
      if (!ptCccd) {
        window.GymApp.toast('Vui lòng nhập CCCD huấn luyện viên', 'error');
        return;
      }
      extraData = { cccd: ptCccd, bang_cap: ptBangCap, chuyen_mon: ptChuyenMon, ty_le_chia_se: ptComm };
    } else if (loaiHoSo === 'nhan_vien') {
      const nvCccd = document.getElementById('nv-cccd').value.trim();
      const nvChucVu = document.getElementById('nv-chuc-vu').value;
      const nvLuong = document.getElementById('nv-luong').value.trim();
      if (!nvCccd) {
        window.GymApp.toast('Vui lòng nhập CCCD nhân viên', 'error');
        return;
      }
      if (!nvChucVu) {
        window.GymApp.toast('Vui lòng chọn chức vụ nhân viên', 'error');
        return;
      }
      extraData = { cccd: nvCccd, chuc_vu: nvChucVu, luong_co_ban: nvLuong };
    }

    // Account creation
    const chkAccount = document.getElementById('chk-create-account');
    let accountData = null;
    if (chkAccount && chkAccount.checked) {
      const username = document.getElementById('reg-ten-dang-nhap').value.trim();
      const password = document.getElementById('reg-mat-khau').value.trim();
      if (!username || !password) {
        window.GymApp.toast('Vui lòng điền đầy đủ thông tin tài khoản đăng nhập', 'error');
        return;
      }
      if (password.length < 6) {
        window.GymApp.toast('Mật khẩu đăng nhập phải từ 6 ký tự trở lên', 'error');
        return;
      }
      accountData = { username, password };
    }

    // Address
    const provOpt = elProvince.options[elProvince.selectedIndex];
    const selectedWardVal = elWard.value;
    const selectedWardObj = self._wards.find(w => w.code == selectedWardVal);
    const districtName = selectedWardObj ? (self._districts.find(d => d.code == selectedWardObj.district_code)?.name || '') : '';
    const wardName = selectedWardObj ? selectedWardObj.name : '';

    const address = {
      tinh_thanh: provOpt && provOpt.value ? provOpt.textContent : '',
      quan_huyen: districtName,
      phuong_xa: wardName,
      dia_chi: street
    };

    const formData = new FormData();
    formData.append('ho_ten', hoTen);
    formData.append('loai_ho_so', loaiHoSo);
    formData.append('so_dien_thoai', sdt);
    formData.append('email', email);
    formData.append('cccd', cccd);
    formData.append('ngay_sinh', ngaySinh);
    formData.append('gioi_tinh', gioiTinh);
    formData.append('noi_sinh', noiSinh);
    formData.append('que_quan', queQuan);
    if (chiNhanhId) formData.append('chi_nhanh_id', chiNhanhId);
    formData.append('dia_chi_json', JSON.stringify(address));
    formData.append('extra_data', JSON.stringify(extraData));
    if (accountData) {
      formData.append('account_data', JSON.stringify(accountData));
    }
    if (this._avatarFile) {
      formData.append('avatar', this._avatarFile);
    }

    const btn = document.getElementById('btn-save-member');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang lưu...';

    window.GymApp.fetchAPI('/api/members', {
      method: 'POST',
      body: formData
    })
      .then(res => {
        if (res.success) {
          window.GymApp.toast('Thêm hồ sơ thành công!', 'success');
          self._currentMemberId = res.data.id;
          self._currentMemberName = res.data.ho_ten;

          if (accountData) {
            // Gọi API kích hoạt tài khoản đăng nhập
            window.GymApp.fetchAPI('/api/members/' + res.data.id + '/create-account', {
              method: 'POST',
              body: JSON.stringify({
                ten_dang_nhap: accountData.username,
                mat_khau: accountData.password
              })
            })
            .then(accRes => {
              if (accRes && accRes.success) {
                window.GymApp.toast('Kích hoạt tài khoản thành công!', 'success');
              } else {
                window.GymApp.toast(accRes.message || 'Lỗi tạo tài khoản đăng nhập', 'error');
              }
              // Chuyển bước tiếp theo
              if (loaiHoSo === 'hoi_vien') {
                const tabPackage = document.getElementById('tab-package');
                if (tabPackage) tabPackage.click();
              } else {
                window.GymApp.navigate('members-list');
              }
            })
            .catch(accErr => {
              console.error(accErr);
              window.GymApp.toast('Lỗi kết nối tạo tài khoản', 'error');
              if (loaiHoSo === 'hoi_vien') {
                const tabPackage = document.getElementById('tab-package');
                if (tabPackage) tabPackage.click();
              } else {
                window.GymApp.navigate('members-list');
              }
            });
          } else {
            // Nếu không chọn kích hoạt tài khoản thì chuyển tiếp luôn
            if (loaiHoSo === 'hoi_vien') {
              const tabPackage = document.getElementById('tab-package');
              if (tabPackage) tabPackage.click();
            } else {
              window.GymApp.navigate('members-list');
            }
          }
        } else {
          // Handle server validations inline
          if (res.message && res.message.includes('Số điện thoại')) {
            if (errSdt) {
              errSdt.textContent = res.message;
              errSdt.classList.remove('hidden');
            }
          }
          if (res.message && res.message.includes('CCCD')) {
            if (errCccd) {
              errCccd.textContent = res.message;
              errCccd.classList.remove('hidden');
            }
          }
          if (res.message && res.message.includes('Email')) {
            if (errEmail) {
              errEmail.textContent = res.message;
              errEmail.classList.remove('hidden');
            }
          }
          window.GymApp.toast(res.message || 'Lỗi lưu hồ sơ', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        window.GymApp.toast(err.message || 'Lỗi kết nối máy chủ', 'error');
      })
      .finally(() => {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm font-extrabold">save</span> Lưu hồ sơ';
      });
  },

  _handleSavePackage: function () {
    if (!this._currentMemberId) {
      window.GymApp.toast('Vui lòng lưu hồ sơ cá nhân hội viên trước!', 'warning');
      const tabRegister = document.getElementById('tab-register');
      if (tabRegister) tabRegister.click();
      return;
    }

    const pkgSelect = document.getElementById('pkg-select');
    const pkgId = pkgSelect.value;
    const pkgPrice = document.getElementById('pkg-price').value.replace(/[^0-9]/g, '');
    const coupon = document.getElementById('pkg-coupon').value.trim();
    const tuNgay = document.getElementById('pkg-from').value;
    const denNgay = document.getElementById('pkg-to').value;
    const paidVal = document.getElementById('pkg-paid').value.replace(/[^0-9]/g, '');
    const payDate = document.getElementById('pkg-pay-date').value;
    const method = document.getElementById('pkg-method').value;
    const note = document.getElementById('pkg-note').value.trim();

    if (!pkgId) {
      window.GymApp.toast('Vui lòng chọn gói tập!', 'error');
      return;
    }
    if (!paidVal) {
      window.GymApp.toast('Vui lòng nhập số tiền khách thanh toán!', 'error');
      return;
    }

    const payload = {
      hoi_vien_id: this._currentMemberId,
      goi_tap_id: parseInt(pkgId),
      gia_thuc_te: parseFloat(pkgPrice || 0),
      ma_giam_gia: coupon,
      tu_ngay: tuNgay,
      den_ngay: denNgay,
      so_tien_da_thu: parseFloat(paidVal || 0),
      ngay_thanh_toan: payDate,
      phuong_thuc_tt: method,
      ghi_chu_tt: note
    };

    const btn = document.getElementById('btn-save-package');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang lưu...';

    window.GymApp.fetchAPI(`/api/members/${this._currentMemberId}/package`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (res.success) {
          window.GymApp.toast('Kích hoạt và thu tiền gói tập thành công!', 'success');
          window.GymApp.navigate('members-list');
        } else {
          window.GymApp.toast(res.message || 'Lỗi đăng ký gói tập', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        window.GymApp.toast(err.message || 'Lỗi kết nối máy chủ', 'error');
      })
      .finally(() => {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">save</span> Lưu đăng ký gói';
      });
  },

  _updatePackageSummary: function () {
    const elMemberName = document.getElementById('receipt-member-name');
    const elPkgName = document.getElementById('receipt-package-name');
    const elDuration = document.getElementById('receipt-duration');
    const elValidity = document.getElementById('receipt-validity');
    const elTotal = document.getElementById('receipt-total');
    const elPaid = document.getElementById('receipt-paid');
    const elStatusLabel = document.getElementById('receipt-status-label');
    const elStatusVal = document.getElementById('receipt-status-value');
    const elBenefits = document.getElementById('receipt-benefits');

    if (!elPkgName) return;

    // 1. Member Name
    if (elMemberName) {
      elMemberName.textContent = this._currentMemberName || 'Chưa lưu hồ sơ';
    }

    const pkgSelect = document.getElementById('pkg-select');
    if (!pkgSelect) return;

    const opt = pkgSelect.options[pkgSelect.selectedIndex];
    if (!opt || !opt.value) {
      elPkgName.textContent = 'Chưa chọn';
      if (elDuration) elDuration.textContent = '--';
      if (elValidity) elValidity.textContent = '--';
      if (elTotal) elTotal.textContent = '0 đ';
      if (elPaid) elPaid.textContent = '0 đ';
      if (elStatusLabel) elStatusLabel.textContent = 'Còn thiếu:';
      if (elStatusVal) {
        elStatusVal.textContent = '0 đ';
        elStatusVal.className = 'font-black text-body-md text-red-500';
      }
      if (elBenefits) {
        elBenefits.innerHTML = `
          <div class="flex items-center gap-xs"><span class="material-symbols-outlined text-[12px] text-emerald-500">check_circle</span>Tập tự do</div>
          <div class="flex items-center gap-xs"><span class="material-symbols-outlined text-[12px] text-emerald-500">check_circle</span>Tủ Locker</div>
          <div class="flex items-center gap-xs"><span class="material-symbols-outlined text-[12px] text-emerald-500">check_circle</span>Nước uống</div>
          <div class="flex items-center gap-xs"><span class="material-symbols-outlined text-[12px] text-emerald-500">check_circle</span>InBody/BMI</div>
        `;
      }
      return;
    }

    // 2. Package info
    const fullText = opt.textContent;
    const cleanPkgName = fullText.split(' — ')[0] || fullText;
    elPkgName.textContent = cleanPkgName;

    const months = parseInt(opt.getAttribute('data-thang') || 0);
    const extraDays = parseInt(opt.getAttribute('data-them') || 0);
    let durationText = `${months} tháng`;
    if (extraDays > 0) {
      durationText += ` + ${extraDays} ngày`;
    }
    if (elDuration) elDuration.textContent = durationText;

    // 3. Validity
    const pkgFromVal = document.getElementById('pkg-from').value;
    const pkgToVal = document.getElementById('pkg-to').value;
    if (elValidity) {
      if (pkgFromVal && pkgToVal) {
        const fmtDate = (dStr) => {
          if (!dStr) return '';
          const parts = dStr.split('-');
          if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
          return dStr;
        };
        elValidity.textContent = `Từ: ${fmtDate(pkgFromVal)} - Đến: ${fmtDate(pkgToVal)}`;
      } else {
        elValidity.textContent = '--';
      }
    }

    // 4. Calculation
    const pkgTotalInput = document.getElementById('pkg-total');
    const pkgPaidInput = document.getElementById('pkg-paid');

    const totalRaw = pkgTotalInput ? parseFloat(pkgTotalInput.value.replace(/[^0-9]/g, '')) || 0 : 0;
    const paidRaw = pkgPaidInput ? parseFloat(pkgPaidInput.value.replace(/[^0-9]/g, '')) || 0 : 0;

    if (elTotal) elTotal.textContent = window.GymApp.formatCurrency(totalRaw);
    if (elPaid) elPaid.textContent = window.GymApp.formatCurrency(paidRaw);

    const diff = totalRaw - paidRaw;
    if (elStatusLabel && elStatusVal) {
      if (diff > 0) {
        elStatusLabel.textContent = 'Còn thiếu:';
        elStatusVal.textContent = window.GymApp.formatCurrency(diff);
        elStatusVal.className = 'font-black text-body-md text-red-500';
      } else if (diff === 0) {
        elStatusLabel.textContent = 'Trạng thái:';
        elStatusVal.textContent = 'Đã thu đủ';
        elStatusVal.className = 'font-black text-body-md text-emerald-500 dark:text-emerald-400';
      } else {
        elStatusLabel.textContent = 'Thối lại:';
        elStatusVal.textContent = window.GymApp.formatCurrency(Math.abs(diff));
        elStatusVal.className = 'font-black text-body-md text-emerald-500 dark:text-emerald-400';
      }
    }

    // 5. Dynamic benefits
    if (elBenefits) {
      let items = [
        'Tập tự do',
        'Tủ Locker',
        'Nước uống',
        'InBody/BMI'
      ];
      if (months >= 3) {
        items.push('Đặt PT ưu tiên');
      }
      if (months >= 6) {
        items.push('Giảm 10% dịch vụ');
      }
      if (months >= 12) {
        items.push('1 buổi PT/tháng');
      }
      elBenefits.innerHTML = items.map(it => `
        <div class="flex items-center gap-xs">
          <span class="material-symbols-outlined text-[12px] text-emerald-500">check_circle</span>
          ${it}
        </div>
      `).join('');
    }
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
