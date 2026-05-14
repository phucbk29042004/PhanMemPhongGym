window.GymApp.pages['pt-register'] = {
  _selectedPT: null,
  _selectedMember: null,
  _bookingPage: 1,
  _bookingPerPage: 5,

  render: function () {
    const pts = Array.isArray(window.GymApp.data.pts) ? window.GymApp.data.pts : [];
    const schedules = Array.isArray(window.GymApp.data.ptSchedules) ? window.GymApp.data.ptSchedules : [];
    const bookings = Array.isArray(window.GymApp.data.ptBookings) ? window.GymApp.data.ptBookings : [];
    const totalBookings = schedules.length + bookings.length;

    return `
      <div class="flex flex-col gap-margin">

        <!-- Page Title -->
        <div class="page-title-bar">
          <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Đăng ký lịch tập PT</h2>
          <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs">Đặt lịch tập giữa hội viên và huấn luyện viên cá nhân</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-10 items-stretch gap-loose">

          <!-- ===== CARD 1: Form đặt lịch ===== -->
          <div class="lg:col-span-7 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <div class="section-header px-loose py-standard border-b border-outline-variant flex items-center gap-compact">
              <div class="icon-bg icon-bg-green">
                <span class="material-symbols-outlined text-brand-primary text-lg" style="font-variation-settings:'FILL' 1">edit_calendar</span>
              </div>
              <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Thông tin đặt lịch</h3>
            </div>

            <div class="p-loose flex flex-col gap-margin">

              <!-- Khối chọn người -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-standard">
                <!-- Chọn PT -->
                <div>
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs flex items-center gap-xs">
                    <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">sports_gymnastics</span>
                    Chọn huấn luyện viên (PT)
                  </label>
                  <div id="pt-selection-area" class="space-y-xs">
                    <div class="relative mb-standard">
                      <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                      <input id="search-pt" type="text" placeholder="Tìm kiếm PT..." class="w-full bg-surface-container-low border border-outline-variant text-on-surface pl-8 pr-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md transition-colors" />
                    </div>
                    <div id="pt-list" class="flex flex-col gap-xs max-h-64 overflow-y-auto pr-xs border border-outline-variant rounded-xl p-xs">
                      <p class="text-center py-4 text-on-surface-variant text-body-sm">Đang tải danh sách PT...</p>
                    </div>
                  </div>
                  <div id="selected-pt-display" class="hidden p-compact bg-[#e7f5e9] rounded-xl border border-brand-primary flex items-center gap-compact mt-xs">
                    <div id="selected-pt-info" class="flex items-center gap-compact flex-1"></div>
                    <button id="clear-pt" class="material-symbols-outlined text-xl text-on-surface-variant hover:text-error transition-colors">close</button>
                  </div>
                </div>

                <!-- Chọn Hội viên -->
                <div>
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs flex items-center gap-xs">
                    <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">person</span>
                    Chọn hội viên
                    <span id="member-list-hint" class="text-on-surface-variant font-normal italic">(chọn PT trước)</span>
                  </label>
                  <div id="member-selection-area" class="space-y-xs">
                    <div class="relative mb-standard">
                      <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                      <input id="search-member" type="text" placeholder="Tìm kiếm hội viên..." class="w-full bg-surface-container-low border border-outline-variant text-on-surface pl-8 pr-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md transition-colors" />
                    </div>
                    <div id="member-list" class="flex flex-col gap-xs max-h-64 overflow-y-auto pr-xs border border-outline-variant rounded-xl p-xs">
                      <p class="text-center py-4 text-on-surface-variant text-body-sm">Vui lòng chọn PT trước</p>
                    </div>
                  </div>
                  <div id="selected-member-display" class="hidden p-compact bg-[#e7f5e9] rounded-xl border border-brand-primary flex items-center gap-compact mt-xs">
                    <div id="selected-member-info" class="flex items-center gap-compact flex-1"></div>
                    <button id="clear-member" class="material-symbols-outlined text-xl text-on-surface-variant hover:text-error transition-colors">close</button>
                  </div>
                </div>
              </div>

              <!-- Ngày, giờ, loại, thời lượng -->
              <div class="bg-surface-container-lowest p-standard rounded-2xl border border-outline-variant/80 grid grid-cols-1 md:grid-cols-2 gap-standard shadow-2xs">
                <div>
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs flex items-center gap-xs">
                    <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">category</span>
                    Loại đăng ký
                  </label>
                  <select id="reg-type" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md transition-all hover:border-outline">
                    <option value="Cá nhân">Cá nhân (1-1)</option>
                    <option value="Nhóm">Nhóm (2-5 người)</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <div>
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs flex items-center gap-xs">
                    <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">event</span>
                    Ngày tập
                  </label>
                  <input id="reg-date" type="date" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md transition-all hover:border-outline" />
                </div>
                <div>
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs flex items-center gap-xs">
                    <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">schedule</span>
                    Giờ bắt đầu
                  </label>
                  <input id="reg-start" type="hidden" value="06:00" />
                  <div class="flex items-center gap-xs">
                    <select id="reg-start-hour" class="flex-1 bg-surface-container-low border border-outline-variant text-on-surface px-2 py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md transition-all hover:border-outline text-center font-medium cursor-pointer">
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
                    <select id="reg-start-minute" class="flex-1 bg-surface-container-low border border-outline-variant text-on-surface px-2 py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md transition-all hover:border-outline text-center font-medium cursor-pointer">
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
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs flex items-center gap-xs">
                    <span class="material-symbols-outlined text-brand-primary text-sm" style="font-variation-settings:'FILL' 1">timer</span>
                    Thời lượng
                  </label>
                  <select id="reg-duration" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md transition-all hover:border-outline">
                    <option value="30">30 phút</option>
                    <option value="60" selected>1 giờ</option>
                    <option value="90">1.5 giờ</option>
                    <option value="120">2 giờ</option>
                  </select>
                </div>
                <div class="md:col-span-2 pt-xs border-t border-outline-variant/40">
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs flex items-center justify-between">
                    <span class="flex items-center gap-xs">
                      <span class="material-symbols-outlined text-outline text-sm">update</span>
                      Giờ kết thúc (tự động tính)
                    </span>
                    <span class="text-label-xs font-medium text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md">Tự động</span>
                  </label>
                  <input id="reg-end" type="time" readonly class="w-full bg-surface-container border border-outline-variant/60 text-on-surface-variant px-standard py-compact rounded-xl outline-none font-body-md text-body-md cursor-not-allowed opacity-80" placeholder="Chọn giờ bắt đầu và thời lượng" />
                </div>
              </div>

              <!-- Ghi chú -->
              <div>
                <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Ghi chú</label>
                <textarea id="reg-notes" rows="2" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md resize-none transition-colors" placeholder="Mục tiêu tập luyện, yêu cầu đặc biệt..."></textarea>
              </div>

              <!-- Nút đặt lịch -->
              <button id="btn-book" class="w-full btn-primary text-white py-compact rounded-xl font-bold flex items-center justify-center gap-compact">
                <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">event_available</span>
                Đặt lịch tập
              </button>
            </div>
          </div>

          <!-- ===== CARD 2: Danh sách đã đặt ===== -->
          <div class="lg:col-span-3 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col lg:h-full lg:min-h-0">
            <div class="section-header px-loose py-standard border-b border-outline-variant flex items-center gap-compact">
              <div class="icon-bg icon-bg-green">
                <span class="material-symbols-outlined text-brand-primary text-lg" style="font-variation-settings:'FILL' 1">calendar_month</span>
              </div>
              <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Lịch đã đặt</h3>
              <span id="booking-count" class="ml-auto bg-brand-primary text-white px-compact py-xs rounded-full text-label-xs font-bold">${totalBookings}</span>
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
        <div class="flex flex-col items-center justify-center py-margin text-center">
          <div class="icon-bg icon-bg-green mx-auto mb-standard" style="width:56px;height:56px;border-radius:16px">
            <span class="material-symbols-outlined text-brand-primary text-2xl">event_note</span>
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
      <div class="gym-card bg-surface-container-low rounded-2xl border border-outline-variant p-standard flex flex-col gap-xs min-w-0">
        <div class="flex items-start justify-between">
          <div class="min-w-0 pr-xs">
            <p class="font-bold text-on-surface text-body-md break-words">${b.ten_hoi_vien || 'Không rõ'}</p>
            <p class="text-on-surface-variant text-body-sm break-words">PT: ${b.ten_pt || 'Chưa gán'}</p>
          </div>
          ${window.GymApp.statusBadge(b.trang_thai || b.status)}
        </div>
        <div class="flex flex-wrap items-center gap-standard text-on-surface-variant text-body-sm">
          <span class="flex items-center gap-xs">
            <span class="material-symbols-outlined text-sm">event</span>
            ${window.GymApp.formatDate(b.ngay_tap)}
          </span>
          <span class="flex items-center gap-xs">
            <span class="material-symbols-outlined text-sm">schedule</span>
            ${b.gio_bat_dau || '—'} — ${b.gio_ket_thuc || '—'}
          </span>
          <span class="flex items-center gap-xs">
            <span class="material-symbols-outlined text-sm">group</span>
            ${b.loai_buoi === 'nhom' ? 'Nhóm' : 'Cá nhân'}
          </span>
        </div>
        ${b.notes ? `<p class="text-on-surface-variant text-body-sm italic break-words">"${b.notes}"</p>` : ''}
        <div class="flex items-center justify-end gap-atom pt-xs border-t border-outline-variant">
          <button class="material-symbols-outlined text-outline hover:text-brand-primary text-xl p-atom rounded-lg hover:bg-surface-container transition-colors" title="Sửa">edit</button>
          <button class="btn-cancel-booking material-symbols-outlined text-outline hover:text-error text-xl p-atom rounded-lg hover:bg-error-container transition-colors" data-id="${b.id}" title="Hủy">event_busy</button>
        </div>
      </div>
    `).join('');
  },

  _renderBookingPagination: function () {
    const total = this._getAllBookings().length;
    const totalPages = Math.ceil(total / this._bookingPerPage);
    if (totalPages <= 1) return '';

    return `
      <div class="flex items-center justify-between gap-standard px-standard py-compact bg-surface-container-low border-t border-outline-variant">
        <button data-pg="${this._bookingPage - 1}" ${this._bookingPage === 1 ? 'disabled' : ''} class="material-symbols-outlined rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-colors" style="width:32px;height:32px;opacity:${this._bookingPage === 1 ? '0.45' : '1'};cursor:${this._bookingPage === 1 ? 'not-allowed' : 'pointer'};">chevron_left</button>
        <span class="text-on-surface-variant text-body-sm font-bold whitespace-nowrap">Trang ${this._bookingPage}/${totalPages}</span>
        <button data-pg="${this._bookingPage + 1}" ${this._bookingPage >= totalPages ? 'disabled' : ''} class="material-symbols-outlined rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-colors" style="width:32px;height:32px;opacity:${this._bookingPage >= totalPages ? '0.45' : '1'};cursor:${this._bookingPage >= totalPages ? 'not-allowed' : 'pointer'};">chevron_right</button>
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
        <div class="member-card flex items-center gap-compact p-compact rounded-xl cursor-pointer hover:bg-surface-container transition-colors border border-transparent hover:border-outline-variant"
             data-member-id="${m.id}" data-member-name="${m.ho_ten}" data-dang-ky-pt-id="${m.dang_ky_pt_id}">
          ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'sm')}
          <div class="flex-1 min-w-0">
            <p class="font-bold text-on-surface text-body-md">${m.ho_ten}</p>
            <p class="text-on-surface-variant text-body-sm">${m.ma_ho_so} &bull; Còn ${m.buoi_con_lai} buổi</p>
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
            ${window.GymApp.avatarImg('', card.dataset.memberName, 'sm')}
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

    // Hủy booking
    document.addEventListener('click', async e => {
      const cancelBtn = e.target.closest('.btn-cancel-booking');
      if (cancelBtn) {
        const id = cancelBtn.dataset.id;
        if (confirm('Bạn có chắc chắn muốn hủy lịch tập này?')) {
          window.GymApp.toast('Yêu cầu hủy lịch đã được gửi!', 'info');
        }
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
      <div class="pt-card flex items-center gap-compact p-compact rounded-xl cursor-pointer hover:bg-surface-container transition-colors border border-transparent hover:border-outline-variant"
           data-pt-id="${pt.id}" data-pt-name="${pt.ho_ten}" data-pt-specialty="${pt.chuyen_mon || ''}">
        ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten, 'sm')}
        <div class="flex-1 min-w-0">
          <p class="font-bold text-on-surface text-body-md">${pt.ho_ten}</p>
          <p class="text-on-surface-variant text-body-sm">${pt.ma_ho_so} &bull; ${pt.chuyen_mon || 'PT'} &bull; ${pt.so_hoc_vien || 0} HV</p>
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
          ${window.GymApp.avatarImg('', card.dataset.ptName, 'sm')}
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
