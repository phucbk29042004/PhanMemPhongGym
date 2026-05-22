window.GymApp.pages['pt-register'] = {
  _selectedPT: null,
  _selectedMember: null,
  _bookingPage: 1,
  _bookingPerPage: 3,

  render: function () {
    const pts = Array.isArray(window.GymApp.data.pts) ? window.GymApp.data.pts : [];
    const schedules = Array.isArray(window.GymApp.data.ptSchedules) ? window.GymApp.data.ptSchedules : [];
    const bookings = Array.isArray(window.GymApp.data.ptBookings) ? window.GymApp.data.ptBookings : [];
    const totalBookings = schedules.length + bookings.length;

    return `
      <div class="flex flex-col gap-lg">
        <div class="grid grid-cols-1 lg:grid-cols-10 items-stretch gap-standard">

          <!-- ===== CARD 1: Form đặt lịch ===== -->
          <div class="lg:col-span-7 bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-sm flex flex-col">
            <div class="section-header px-standard py-compact border-b border-outline-variant/50 flex items-center gap-compact bg-surface-container-low/20" style="border-top-left-radius: 14px; border-top-right-radius: 14px;">
              <div class="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-brand-primary text-base" style="font-variation-settings:'FILL' 1">edit_calendar</span>
              </div>
              <h3 class="font-bold text-on-surface text-body-lg">Thông tin đặt lịch</h3>
            </div>

            <div class="p-standard flex flex-col gap-standard">

              <!-- Khối chọn người -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-standard">
                <!-- Chọn PT -->
                <div>
                  <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5 flex items-center gap-xs">
                    <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">sports_gymnastics</span>
                    Chọn huấn luyện viên (PT)
                  </label>
                  <div id="pt-selection-area" class="space-y-xs">
                    <div class="relative mb-standard group">
                      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[16px] group-focus-within:text-brand-primary transition-colors">search</span>
                      <input id="search-pt" type="text" placeholder="Tìm kiếm PT..." class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface pl-10 pr-4 py-2 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all shadow-sm focus:shadow-none" />
                    </div>
                    <div id="pt-list" class="flex flex-col gap-xs max-h-[220px] overflow-y-auto pr-xs border-2 border-outline-variant/50 rounded-xl p-2 bg-surface-container-low/10">
                      <p class="text-center py-4 text-on-surface-variant text-body-sm font-semibold">Đang tải danh sách PT...</p>
                    </div>
                  </div>
                  <div id="selected-pt-display" class="hidden p-compact bg-brand-primary/10 rounded-xl border-2 border-brand-primary/30 flex items-center gap-compact mt-xs">
                    <div id="selected-pt-info" class="flex items-center gap-compact flex-1 text-body-sm"></div>
                    <button id="clear-pt" class="material-symbols-outlined text-lg text-on-surface-variant hover:text-error transition-colors">close</button>
                  </div>
                </div>

                <!-- Chọn Hội viên -->
                <div>
                  <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5 flex items-center gap-xs">
                    <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">person</span>
                    Chọn hội viên
                    <span id="member-list-hint" class="text-on-surface-variant font-normal italic text-label-xs">(chọn PT trước)</span>
                  </label>
                  <div id="member-selection-area" class="space-y-xs">
                    <div class="relative mb-standard group">
                      <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[16px] group-focus-within:text-brand-primary transition-colors">search</span>
                      <input id="search-member" type="text" placeholder="Tìm kiếm hội viên..." class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface pl-10 pr-4 py-2 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all shadow-sm focus:shadow-none" />
                    </div>
                    <div id="member-list" class="flex flex-col gap-xs max-h-[220px] overflow-y-auto pr-xs border-2 border-outline-variant/50 rounded-xl p-2 bg-surface-container-low/10">
                      <p class="text-center py-4 text-on-surface-variant text-body-sm font-semibold">Vui lòng chọn PT trước</p>
                    </div>
                  </div>
                  <div id="selected-member-display" class="hidden p-compact bg-brand-primary/10 rounded-xl border-2 border-brand-primary/30 flex items-center gap-compact mt-xs">
                    <div id="selected-member-info" class="flex items-center gap-compact flex-1 text-body-sm"></div>
                    <button id="clear-member" class="material-symbols-outlined text-lg text-on-surface-variant hover:text-error transition-colors">close</button>
                  </div>
                </div>
              </div>

              <!-- Ngày, giờ, loại, thời lượng -->
              <div class="bg-surface-container-low/10 p-standard rounded-2xl border-2 border-outline-variant/30 grid grid-cols-1 md:grid-cols-2 gap-standard">
                <div>
                  <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5 flex items-center gap-xs">
                    <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">category</span>
                    Loại đăng ký
                  </label>
                  <select id="reg-type" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-2 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all cursor-pointer">
                    <option value="Cá nhân">Cá nhân (1-1)</option>
                    <option value="Nhóm">Nhóm (2-5 người)</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <div>
                  <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5 flex items-center gap-xs">
                    <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">event</span>
                    Ngày tập
                  </label>
                  <input id="reg-date" type="date" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-2 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all" />
                </div>
                <div>
                  <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5 flex items-center gap-xs">
                    <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">schedule</span>
                    Giờ bắt đầu
                  </label>
                  <input id="reg-start" type="hidden" value="06:00" />
                  <div class="flex items-center gap-xs">
                    <select id="reg-start-hour" class="flex-1 bg-surface-container-low/30 border border-outline-variant/50 text-on-surface py-2 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all text-center cursor-pointer">
                      <option value="05">05</option>
                      <option value="06" selected>06</option>
                      <option value="07">07</option>
                      <option value="08">08</option>
                      <option value="09">09</option>
                      <option value="10">10</option>
                      <option value="11">11</option>
                      <option value="12">12</option>
                      <option value="13">13</option>
                      <option value="14">14</option>
                      <option value="15">15</option>
                      <option value="16">16</option>
                      <option value="17">17</option>
                      <option value="18">18</option>
                      <option value="19">19</option>
                      <option value="20">20</option>
                      <option value="21">21</option>
                      <option value="22">22</option>
                    </select>
                    <span class="text-on-surface-variant font-bold">:</span>
                    <select id="reg-start-minute" class="flex-1 bg-surface-container-low/30 border border-outline-variant/50 text-on-surface py-2 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all text-center cursor-pointer">
                      <option value="00" selected>00</option>
                      <option value="10">10</option>
                      <option value="15">15</option>
                      <option value="20">20</option>
                      <option value="30">30</option>
                      <option value="40">40</option>
                      <option value="45">45</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5 flex items-center gap-xs">
                    <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">timer</span>
                    Thời lượng
                  </label>
                  <select id="reg-duration" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-2 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold transition-all cursor-pointer">
                    <option value="30">30 phút</option>
                    <option value="60" selected>1 giờ</option>
                    <option value="90">1.5 giờ</option>
                    <option value="120">2 giờ</option>
                  </select>
                </div>
                <div class="md:col-span-2 pt-xs border-t border-outline-variant/40">
                  <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5 flex items-center justify-between">
                    <span class="flex items-center gap-xs">
                      <span class="material-symbols-outlined text-outline text-sm">update</span>
                      Giờ kết thúc (tự động tính)
                    </span>
                    <span class="text-label-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md">Tự động</span>
                  </label>
                  <input id="reg-end" type="time" readonly class="w-full bg-surface-container border border-outline-variant/60 text-on-surface-variant px-4 py-2 rounded-xl outline-none text-body-md font-semibold cursor-not-allowed opacity-80" placeholder="Chọn giờ bắt đầu và thời lượng" />
                </div>
              </div>

              <!-- Ghi chú -->
              <div>
                <label class="block text-body-sm font-bold text-on-surface-variant mb-1.5">Ghi chú</label>
                <textarea id="reg-notes" rows="2" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-2 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-body-md font-semibold resize-none transition-all" placeholder="Mục tiêu tập luyện, yêu cầu đặc biệt..."></textarea>
              </div>

              <!-- Nút đặt lịch -->
              <button id="btn-book" class="w-full py-2.5 rounded-xl bg-brand-primary text-white font-bold text-body-md hover:shadow-lg hover:shadow-brand-primary/20 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-xs">
                <span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'FILL' 1">event_available</span>
                Đặt lịch tập
              </button>
            </div>
          </div>

          <!-- ===== CARD 2: Danh sách đã đặt ===== -->
          <div class="lg:col-span-3 bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 shadow-sm overflow-hidden flex flex-col lg:h-full lg:min-h-0">
            <div class="section-header px-standard py-compact border-b border-outline-variant/50 flex items-center gap-compact bg-surface-container-low/20">
              <div class="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-brand-primary text-base" style="font-variation-settings:'FILL' 1">calendar_month</span>
              </div>
              <h3 class="font-bold text-on-surface text-sm">Lịch đã đặt</h3>
              <span id="booking-count" class="ml-auto bg-brand-primary text-white px-2 py-0.5 rounded-full text-label-xs font-bold">${totalBookings}</span>
            </div>

            <div id="booking-list" class="p-standard flex flex-col gap-standard flex-1 lg:min-h-0 overflow-y-auto" style="min-height:400px">
              ${this._renderBookingList()}
            </div>
            <div id="booking-pagination"></div>
          </div>

        </div>
      </div>
    `;
  },

  _getAllBookings: function () {
    const schedules = Array.isArray(window.GymApp.data.ptSchedules) ? window.GymApp.data.ptSchedules : [];
    const bookings = Array.isArray(window.GymApp.data.ptBookings) ? window.GymApp.data.ptBookings : [];
    const all = [...schedules, ...bookings];
    // Sắp xếp mới nhất lên đầu (ngay_tap DESC, gio_bat_dau DESC)
    return all.sort((a, b) => {
      if (a.ngay_tap !== b.ngay_tap) return b.ngay_tap.localeCompare(a.ngay_tap);
      return (b.gio_bat_dau || '').localeCompare(a.gio_bat_dau || '');
    });
  },

  _renderBookingList: function () {
    const all = this._getAllBookings();
    if (all.length === 0) {
      return `
        <div class="flex flex-col items-center justify-center py-standard text-center">
          <div class="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-compact">
            <span class="material-symbols-outlined text-brand-primary text-lg">event_note</span>
          </div>
          <p class="text-on-surface font-bold text-body-md">Chưa có lịch đặt nào</p>
          <p class="text-on-surface-variant text-body-sm mt-xs">Đặt lịch bên trái để bắt đầu</p>
        </div>
      `;
    }
    const totalPages = Math.max(1, Math.ceil(all.length / this._bookingPerPage));
    if (this._bookingPage > totalPages) this._bookingPage = totalPages;
    if (this._bookingPage < 1) this._bookingPage = 1;

    const start = (this._bookingPage - 1) * this._bookingPerPage;
    const paginated = all.slice(start, start + this._bookingPerPage);

    return paginated.map(b => `
      <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-standard flex flex-col gap-standard shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 min-w-0">
        <div class="flex items-start justify-between gap-compact">
          <div class="min-w-0 pr-xs">
            <p class="font-bold text-on-surface text-body-md break-words">${b.ten_hoi_vien || 'Không rõ'}</p>
            <p class="text-on-surface-variant text-body-sm font-semibold break-words">PT: ${b.ten_pt || 'Chưa gán'}</p>
          </div>
          ${window.GymApp.statusBadge(b.trang_thai || b.status)}
        </div>
        <div class="flex flex-col gap-xs text-on-surface-variant text-body-sm font-semibold">
          <span class="flex items-center gap-xs">
            <span class="material-symbols-outlined text-[14px]">event</span>
            ${window.GymApp.formatDate(b.ngay_tap)}
          </span>
          <span class="flex items-center gap-xs">
            <span class="material-symbols-outlined text-[14px]">schedule</span>
            ${b.gio_bat_dau || '—'} — ${b.gio_ket_thuc || '—'}
          </span>
          <span class="flex items-center gap-xs">
            <span class="material-symbols-outlined text-[14px]">group</span>
            ${b.loai_buoi === 'nhom' ? 'Nhóm' : 'Cá nhân'}
          </span>
        </div>
        ${b.ghi_chu ? `<p class="text-on-surface-variant text-body-sm italic break-words">"${b.ghi_chu}"</p>` : ''}
        <div class="flex items-center justify-end gap-xs pt-xs border-t border-outline-variant/50">
          ${b.trang_thai === 'cho_tap' ? `
            <button class="btn-edit-booking material-symbols-outlined text-outline hover:text-brand-primary text-body-md p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
              data-id="${b.id}" data-ngay="${b.ngay_tap}" data-start="${b.gio_bat_dau}" data-end="${b.gio_ket_thuc}" data-ghi-chu="${b.ghi_chu || ''}" title="Sửa lịch">edit</button>
            <button class="btn-cancel-booking material-symbols-outlined text-outline hover:text-error text-body-md p-1.5 rounded-lg hover:bg-error/10 transition-colors"
              data-id="${b.id}" title="Hủy lịch">event_busy</button>
          ` : ''}
        </div>
      </div>
    `).join('');
  },

  _renderBookingPagination: function () {
    const total = this._getAllBookings().length;
    const totalPages = Math.ceil(total / this._bookingPerPage);
    if (totalPages <= 1) return '';

    return `
      <div class="flex items-center justify-between gap-standard px-standard py-compact bg-surface-container-low/20 border-t border-outline-variant/50">
        <button data-pg="${this._bookingPage - 1}" ${this._bookingPage === 1 ? 'disabled' : ''} class="material-symbols-outlined rounded-lg border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:-translate-y-0.5 transition-all" style="width:28px;height:28px;font-size:16px;display:flex;align-items:center;justify-content:center;opacity:${this._bookingPage === 1 ? '0.45' : '1'};cursor:${this._bookingPage === 1 ? 'not-allowed' : 'pointer'};">chevron_left</button>
        <span class="text-on-surface-variant text-body-sm font-bold whitespace-nowrap">Trang ${this._bookingPage}/${totalPages}</span>
        <button data-pg="${this._bookingPage + 1}" ${this._bookingPage >= totalPages ? 'disabled' : ''} class="material-symbols-outlined rounded-lg border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-brand-primary hover:border-brand-primary hover:-translate-y-0.5 transition-all" style="width:28px;height:28px;font-size:16px;display:flex;align-items:center;justify-content:center;opacity:${this._bookingPage >= totalPages ? '0.45' : '1'};cursor:${this._bookingPage >= totalPages ? 'not-allowed' : 'pointer'};">chevron_right</button>
      </div>
    `;
  },

  _refreshBookingList: function () {
    const list = document.getElementById('booking-list');
    const count = document.getElementById('booking-count');
    const pagination = document.getElementById('booking-pagination');
    if (list) list.innerHTML = this._renderBookingList();
    if (pagination) pagination.innerHTML = this._renderBookingPagination();
    if (count) count.textContent = this._getAllBookings().length;
  },

  // Tự tính giờ kết thúc từ giờ bắt đầu + thời lượng (phút)
  _calcEndTime: function () {
    const startVal = document.getElementById('reg-start')?.value;
    const durationVal = parseInt(document.getElementById('reg-duration')?.value || '60');
    if (!startVal) return;
    const [h, m] = startVal.split(':').map(Number);
    const totalMins = h * 60 + m + durationVal;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    document.getElementById('reg-end').value =
      String(endH).padStart(2, '0') + ':' + String(endM).padStart(2, '0');
  },

  // Load danh sách hội viên có hợp đồng với PT đã chọn
  _loadMembersForPT: async function (ptId) {
    const list = document.getElementById('member-list');
    const hint = document.getElementById('member-list-hint');
    if (!list) return;

    list.innerHTML = '<p class="text-center py-4 text-on-surface-variant text-body-sm">Đang tải...</p>';
    try {
      const res = await window.GymApp.api.get(`/trainers/${ptId}/members`);
      const members = res?.success ? (Array.isArray(res.data) ? res.data : []) : [];
      if (hint) hint.textContent = members.length > 0 ? `(${members.length} hội viên)` : '(chưa có hội viên)';

      if (members.length === 0) {
        list.innerHTML = '<p class="text-center py-4 text-on-surface-variant text-body-sm">PT này chưa có hội viên đang hoạt động</p>';
        return;
      }

      list.innerHTML = members.map(m => `
        <div class="member-card flex items-center gap-compact p-compact rounded-xl cursor-pointer hover:bg-surface-container-low transition-all border-2 border-transparent hover:border-outline-variant/50"
             data-member-id="${m.id}" data-member-name="${m.ho_ten}" data-dang-ky-pt-id="${m.dang_ky_pt_id}" data-avatar-url="${m.avatar_url || ''}">
          ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'sm')}
          <div class="flex-1 min-w-0">
            <p class="font-bold text-on-surface text-xs">${m.ho_ten}</p>
            <p class="text-on-surface-variant text-[11px]">${m.ma_ho_so} &bull; <span class="font-bold" style="color:#1D9336;">Còn ${m.buoi_con_lai} buổi</span></p>
          </div>
        </div>
      `).join('');

      // Bind click cho từng member card
      list.querySelectorAll('.member-card').forEach(card => {
        card.addEventListener('click', () => {
          this._selectedMember = {
            id: card.dataset.memberId,
            name: card.dataset.memberName,
            dang_ky_pt_id: card.dataset.dangKyPtId,
          };
          document.getElementById('member-selection-area').classList.add('hidden');
          const display = document.getElementById('selected-member-display');
          display.classList.remove('hidden');
          document.getElementById('selected-member-info').innerHTML = `
            ${window.GymApp.avatarImg(card.dataset.avatarUrl || '', card.dataset.memberName, 'sm')}
            <span class="text-brand-primary font-bold text-body-sm">${card.dataset.memberName}</span>
          `;
        });
      });
    } catch (e) {
      list.innerHTML = '<p class="text-center py-4 text-error text-body-sm">Lỗi tải danh sách hội viên</p>';
    }
  },

  init: async function () {
    const self = this;
    self._selectedPT = null;
    self._selectedMember = null;
    self._bookingPage = 1;

    // Fetch PT nếu chưa có
    if (!window.GymApp.data.pts || window.GymApp.data.pts.length === 0) {
      try {
        const ptsRes = await window.GymApp.api.get('/trainers');
        if (ptsRes?.success) window.GymApp.data.pts = Array.isArray(ptsRes.data) ? ptsRes.data : (ptsRes.data?.data || []);
      } catch (e) { }
    }

    this._renderPTList();

    // Nạp lịch tập ban đầu
    if (!window.GymApp.data.ptSchedules) {
      try {
        const res = await window.GymApp.api.get('/pt/schedules');
        if (res?.success) window.GymApp.data.ptSchedules = Array.isArray(res.data) ? res.data : [];
      } catch (e) { }
    }
    if (!window.GymApp.data.ptBookings) window.GymApp.data.ptBookings = [];

    this._refreshBookingList();

    window.GymApp._pgHandler = function (pg) {
      const total = self._getAllBookings().length;
      const totalPages = Math.max(1, Math.ceil(total / self._bookingPerPage));
      self._bookingPage = Math.min(Math.max(pg, 1), totalPages);
      self._refreshBookingList();
    };

    const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];
    const regDate = document.getElementById('reg-date');
    if (regDate) regDate.value = today;

    // Tự tính giờ kết thúc khi đổi giờ bắt đầu hoặc thời lượng
    const updateStartTime = () => {
      const h = document.getElementById('reg-start-hour')?.value || '06';
      const m = document.getElementById('reg-start-minute')?.value || '00';
      const startInput = document.getElementById('reg-start');
      if (startInput) {
        startInput.value = `${h}:${m}`;
        self._calcEndTime();
      }
    };
    document.getElementById('reg-start-hour')?.addEventListener('change', updateStartTime);
    document.getElementById('reg-start-minute')?.addEventListener('change', updateStartTime);
    document.getElementById('reg-duration')?.addEventListener('change', () => self._calcEndTime());

    // Khởi tạo giờ kết thúc mặc định lúc load trang
    updateStartTime();

    // Search PT
    document.getElementById('search-pt')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.pt-card').forEach(card => {
        const name = card.dataset.ptName.toLowerCase();
        const spec = card.dataset.ptSpecialty?.toLowerCase() || '';
        card.style.display = name.includes(q) || spec.includes(q) ? '' : 'none';
      });
    });

    // Search Member (trong danh sách đã load)
    document.getElementById('search-member')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.member-card').forEach(card => {
        const name = card.dataset.memberName.toLowerCase();
        card.style.display = name.includes(q) ? '' : 'none';
      });
    });

    // Clear PT → reset cả member
    document.getElementById('clear-pt')?.addEventListener('click', () => {
      self._selectedPT = null;
      self._selectedMember = null;
      document.getElementById('selected-pt-display').classList.add('hidden');
      document.getElementById('pt-selection-area').classList.remove('hidden');
      // Reset member area
      document.getElementById('selected-member-display').classList.add('hidden');
      document.getElementById('member-selection-area').classList.remove('hidden');
      document.getElementById('member-list').innerHTML = '<p class="text-center py-4 text-on-surface-variant text-body-sm">Vui lòng chọn PT trước</p>';
      const hint = document.getElementById('member-list-hint');
      if (hint) hint.textContent = '(chọn PT trước)';
    });

    // Clear Member
    document.getElementById('clear-member')?.addEventListener('click', () => {
      self._selectedMember = null;
      document.getElementById('selected-member-display').classList.add('hidden');
      document.getElementById('member-selection-area').classList.remove('hidden');
    });

    // Đặt lịch
    document.getElementById('btn-book')?.addEventListener('click', async () => {
      if (!self._selectedPT) { window.GymApp.toast('Vui lòng chọn huấn luyện viên PT!', 'error'); return; }
      if (!self._selectedMember) { window.GymApp.toast('Vui lòng chọn hội viên!', 'error'); return; }

      const date = document.getElementById('reg-date')?.value;
      const start = document.getElementById('reg-start')?.value;
      const end = document.getElementById('reg-end')?.value;
      if (!date) { window.GymApp.toast('Vui lòng chọn ngày tập!', 'error'); return; }
      if (!start) { window.GymApp.toast('Vui lòng chọn giờ bắt đầu!', 'error'); return; }
      if (!end) { window.GymApp.toast('Giờ kết thúc chưa được tính. Hãy chọn giờ bắt đầu và thời lượng!', 'error'); return; }

      try {
        const bookingData = {
          dang_ky_pt_id: self._selectedMember.dang_ky_pt_id,
          ngay_tap: date,
          gio_bat_dau: start,
          gio_ket_thuc: end,
          loai_buoi: document.getElementById('reg-type')?.value === 'Nhóm' ? 'nhom' : 'ca_nhan',
          ghi_chu: document.getElementById('reg-notes')?.value || '',
        };

        const res = await window.GymApp.api.post('/pt/schedules', bookingData);
        if (res && res.success) {
          window.GymApp.toast('Đặt lịch tập thành công!', 'success');
          const schedulesRes = await window.GymApp.api.get('/pt/schedules');
          if (schedulesRes?.success) window.GymApp.data.ptSchedules = Array.isArray(schedulesRes.data) ? schedulesRes.data : [];
          self._bookingPage = 1;
          self._refreshBookingList();

          document.getElementById('clear-pt').click();
          if (document.getElementById('reg-start-hour')) document.getElementById('reg-start-hour').value = '06';
          if (document.getElementById('reg-start-minute')) document.getElementById('reg-start-minute').value = '00';
          const st = document.getElementById('reg-start');
          if (st) { st.value = '06:00'; self._calcEndTime(); }
          document.getElementById('reg-notes').value = '';
        } else {
          window.GymApp.toast(res?.message || 'Đặt lịch thất bại!', 'error');
        }
      } catch (err) {
        console.error('Booking failed', err);
        window.GymApp.toast('Lỗi kết nối máy chủ', 'error');
      }
    });

    // Hủy booking — gọi API thực sự
    document.getElementById('booking-list')?.addEventListener('click', async e => {
      // Nút hủy
      const cancelBtn = e.target.closest('.btn-cancel-booking');
      if (cancelBtn) {
        const id = cancelBtn.dataset.id;
        const ok = await window.GymApp.confirm('Bạn có chắc chắn muốn hủy lịch tập này?', 'Hủy lịch tập');
        if (!ok) return;
        try {
          const res = await window.GymApp.api.put(`/pt/schedules/${id}/cancel`, { ly_do: 'Hủy từ trang đặt lịch' });
          if (res?.success) {
            window.GymApp.toast('Đã hủy lịch tập thành công!', 'success');
            const schedulesRes = await window.GymApp.api.get('/pt/schedules');
            if (schedulesRes?.success) window.GymApp.data.ptSchedules = Array.isArray(schedulesRes.data) ? schedulesRes.data : [];
            self._refreshBookingList();
          } else {
            window.GymApp.toast(res?.message || 'Hủy lịch thất bại!', 'error');
          }
        } catch (err) {
          window.GymApp.toast('Lỗi kết nối máy chủ', 'error');
        }
        return;
      }

      // Nút sửa
      const editBtn = e.target.closest('.btn-edit-booking');
      if (editBtn) {
        const id = editBtn.dataset.id;
        const ngay = editBtn.dataset.ngay;
        const start = editBtn.dataset.start;
        const end = editBtn.dataset.end;
        const ghiChu = editBtn.dataset.ghiChu;

        const [startH, startM] = (start || '06:00').split(':');
        const startMins = parseInt(startH) * 60 + parseInt(startM);
        const [endH, endM] = (end || '07:00').split(':');
        const durationMins = (parseInt(endH) * 60 + parseInt(endM)) - startMins;

        window.GymApp.showModal(`
          <div class="p-standard flex flex-col gap-standard">
            <h3 class="font-bold text-on-surface text-sm flex items-center gap-compact">
              <span class="material-symbols-outlined text-brand-primary" style="font-variation-settings:'FILL' 1">edit_calendar</span>
              Sửa lịch tập
            </h3>
            <div class="grid grid-cols-2 gap-standard">
              <div>
                <label class="block text-[11px] font-bold text-on-surface-variant mb-1.5">Ngày tập</label>
                <input id="edit-ngay" type="date" value="${ngay}" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-2 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-xs font-semibold transition-all" />
              </div>
              <div>
                <label class="block text-[11px] font-bold text-on-surface-variant mb-1.5">Giờ bắt đầu</label>
                <div class="flex items-center gap-xs">
                  <select id="edit-start-hour" class="flex-1 bg-surface-container-low/30 border border-outline-variant/50 text-on-surface py-2 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-xs font-semibold transition-all text-center cursor-pointer">
                    ${[5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22].map(h => `<option value="${String(h).padStart(2,'0')}" ${String(h).padStart(2,'0') === startH ? 'selected' : ''}>${String(h).padStart(2,'0')}</option>`).join('')}
                  </select>
                  <span class="font-bold text-on-surface-variant">:</span>
                  <select id="edit-start-minute" class="flex-1 bg-surface-container-low/30 border border-outline-variant/50 text-on-surface py-2 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-xs font-semibold transition-all text-center cursor-pointer">
                    ${['00','10','15','20','30','40','45','50'].map(m => `<option value="${m}" ${m === startM ? 'selected' : ''}>${m}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-[11px] font-bold text-on-surface-variant mb-1.5">Thời lượng</label>
                <select id="edit-duration" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-2 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-xs font-semibold transition-all cursor-pointer">
                  ${[30,60,90,120].map(d => `<option value="${d}" ${d === durationMins ? 'selected' : ''}>${d === 30 ? '30 phút' : d === 60 ? '1 giờ' : d === 90 ? '1.5 giờ' : '2 giờ'}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-bold text-on-surface-variant mb-1.5">Giờ kết thúc</label>
                <input id="edit-end" type="time" readonly value="${end}" class="w-full bg-surface-container border border-outline-variant/60 text-on-surface-variant px-4 py-2 rounded-xl outline-none text-xs font-semibold cursor-not-allowed opacity-80" />
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-on-surface-variant mb-1.5">Ghi chú</label>
              <textarea id="edit-ghi-chu" rows="2" class="w-full bg-surface-container-low/30 border border-outline-variant/50 text-on-surface px-4 py-2 rounded-xl focus:border-brand-primary focus:bg-white dark:focus:bg-[#1e1e1e] outline-none text-xs font-semibold resize-none transition-all">${ghiChu}</textarea>
            </div>
            <div class="flex gap-standard justify-end pt-xs">
              <button id="close-modal" class="flex-1 py-2.5 rounded-xl bg-surface-container-low text-on-surface-variant font-bold text-xs hover:bg-surface-container transition-all active:scale-95">Hủy bỏ</button>
              <button id="btn-edit-save" class="flex-1 py-2.5 rounded-xl bg-brand-primary text-white font-bold text-xs hover:shadow-lg hover:shadow-brand-primary/20 transition-all active:scale-95 flex items-center justify-center gap-xs">
                <span class="material-symbols-outlined text-sm">save</span>Lưu thay đổi
              </button>
            </div>
          </div>
        `);

        // Tự tính giờ kết thúc khi đổi giờ/thời lượng trong modal
        const calcEditEnd = () => {
          const h = document.getElementById('edit-start-hour')?.value || '06';
          const m = document.getElementById('edit-start-minute')?.value || '00';
          const dur = parseInt(document.getElementById('edit-duration')?.value || '60');
          const total = parseInt(h) * 60 + parseInt(m) + dur;
          document.getElementById('edit-end').value = `${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
        };
        document.getElementById('edit-start-hour')?.addEventListener('change', calcEditEnd);
        document.getElementById('edit-start-minute')?.addEventListener('change', calcEditEnd);
        document.getElementById('edit-duration')?.addEventListener('change', calcEditEnd);

        document.getElementById('btn-edit-save')?.addEventListener('click', async () => {
          const newNgay = document.getElementById('edit-ngay')?.value;
          const newStart = `${document.getElementById('edit-start-hour').value}:${document.getElementById('edit-start-minute').value}`;
          const newEnd = document.getElementById('edit-end')?.value;
          const newGhiChu = document.getElementById('edit-ghi-chu')?.value || '';
          if (!newNgay) { window.GymApp.toast('Vui lòng chọn ngày tập!', 'error'); return; }
          try {
            const res = await window.GymApp.api.put(`/pt/schedules/${id}`, {
              ngay_tap: newNgay, gio_bat_dau: newStart, gio_ket_thuc: newEnd, ghi_chu: newGhiChu,
            });
            if (res?.success) {
              window.GymApp.toast('Đã cập nhật lịch tập thành công!', 'success');
              document.getElementById('gym-modal')?.remove();
              const schedulesRes = await window.GymApp.api.get('/pt/schedules');
              if (schedulesRes?.success) window.GymApp.data.ptSchedules = Array.isArray(schedulesRes.data) ? schedulesRes.data : [];
              self._refreshBookingList();
            } else {
              window.GymApp.toast(res?.message || 'Cập nhật thất bại!', 'error');
            }
          } catch (err) {
            window.GymApp.toast('Lỗi kết nối máy chủ', 'error');
          }
        });
      }
    });
  },

  _renderPTList: function () {
    const pts = window.GymApp.data.pts || [];
    const list = document.getElementById('pt-list');
    if (!list) return;

    if (pts.length === 0) {
      list.innerHTML = '<p class="text-center py-4 text-on-surface-variant text-body-sm">Không có PT nào</p>';
      return;
    }

    list.innerHTML = pts.map(pt => `
      <div class="pt-card flex items-center gap-compact p-compact rounded-xl cursor-pointer hover:bg-surface-container-low transition-all border-2 border-transparent hover:border-outline-variant/50"
           data-pt-id="${pt.id}" data-pt-name="${pt.ho_ten}" data-pt-specialty="${pt.chuyen_mon || ''}" data-avatar-url="${pt.avatar_url || ''}">
        ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten, 'sm')}
        <div class="flex-1 min-w-0">
          <p class="font-bold text-on-surface text-xs">${pt.ho_ten}</p>
          <p class="text-on-surface-variant text-[11px]">${pt.ma_ho_so} &bull; ${pt.chuyen_mon || 'Huấn luyện viên'} &bull; ${pt.so_hoc_vien || 0} HV</p>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.pt-card').forEach(card => {
      card.addEventListener('click', () => {
        const ptId = card.dataset.ptId;
        this._selectedPT = { id: ptId, name: card.dataset.ptName };
        this._selectedMember = null;

        // Ẩn vùng chọn PT, hiện thẻ đã chọn
        document.getElementById('pt-selection-area').classList.add('hidden');
        const display = document.getElementById('selected-pt-display');
        display.classList.remove('hidden');
        document.getElementById('selected-pt-info').innerHTML = `
          ${window.GymApp.avatarImg(card.dataset.avatarUrl || '', card.dataset.ptName, 'sm')}
          <span class="text-brand-primary font-bold text-body-sm">${card.dataset.ptName}</span>
        `;

        // Reset member display và load HV của PT này
        document.getElementById('selected-member-display').classList.add('hidden');
        document.getElementById('member-selection-area').classList.remove('hidden');
        this._loadMembersForPT(ptId);
      });
    });
  },
};
