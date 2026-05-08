window.GymApp.pages['pt-register'] = {
  _selectedPT: null,
  _selectedMember: null,
  _bookingPage: 1,
  _bookingPerPage: 3,

  render: function () {
    const pts = Array.isArray(window.GymApp.data.pts) ? window.GymApp.data.pts : [];
    const membersRaw = Array.isArray(window.GymApp.data.members) ? window.GymApp.data.members : [];
    const members = membersRaw.filter(m => m.trang_thai === 'dang_tap' || m.trang_thai === 'active');
    // Fix bug: null-safe spread, tránh TypeError khi ptSchedules/ptBookings là undefined
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
                </label>
                <div id="member-selection-area" class="space-y-xs">
                  <div class="relative mb-standard">
                    <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                    <input id="search-member" type="text" placeholder="Tìm kiếm hội viên..." class="w-full bg-surface-container-low border border-outline-variant text-on-surface pl-8 pr-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md transition-colors" />
                  </div>
                  <div id="member-list" class="flex flex-col gap-xs max-h-64 overflow-y-auto pr-xs border border-outline-variant rounded-xl p-xs">
                    <p class="text-center py-4 text-on-surface-variant text-body-sm">Đang tải danh sách hội viên...</p>
                  </div>
                </div>
                <div id="selected-member-display" class="hidden p-compact bg-[#e7f5e9] rounded-xl border border-brand-primary flex items-center gap-compact mt-xs">
                  <div id="selected-member-info" class="flex items-center gap-compact flex-1"></div>
                  <button id="clear-member" class="material-symbols-outlined text-xl text-on-surface-variant hover:text-error transition-colors">close</button>
                </div>
              </div>

              <!-- Ngày, giờ, loại -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-standard">
                <div>
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Loại đăng ký</label>
                  <select id="reg-type" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md transition-colors">
                    <option value="Cá nhân">Cá nhân (1-1)</option>
                    <option value="Nhóm">Nhóm (2-5 người)</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <div>
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Ngày tập</label>
                  <input id="reg-date" type="date" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md transition-colors" />
                </div>
                <div>
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Giờ bắt đầu</label>
                  <input id="reg-start" type="time" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md transition-colors" />
                </div>
                <div>
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Giờ kết thúc</label>
                  <input id="reg-end" type="time" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-xl focus:border-brand-primary outline-none font-body-md text-body-md transition-colors" />
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
          <div class="lg:col-span-3 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col h-full min-h-0">
            <div class="section-header px-loose py-standard border-b border-outline-variant flex items-center gap-compact">
              <div class="icon-bg icon-bg-green">
                <span class="material-symbols-outlined text-brand-primary text-lg" style="font-variation-settings:'FILL' 1">calendar_month</span>
              </div>
              <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Lịch đã đặt</h3>
              <span id="booking-count" class="ml-auto bg-brand-primary text-white px-compact py-xs rounded-full text-label-xs font-bold">${totalBookings}</span>
            </div>

            <div id="booking-list" class="p-standard flex flex-col gap-standard flex-1 min-h-0 overflow-y-auto">
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
    return [...schedules, ...bookings];
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

  init: async function () {
    const self = this;
    self._selectedPT = null;
    self._selectedMember = null;
    self._bookingPage = 1;

    // Fetch dữ liệu nếu chưa có
    if (!window.GymApp.data.pts || window.GymApp.data.pts.length === 0) {
      try {
        const [ptsRes, membersRes] = await Promise.all([
          window.GymApp.api.get('/trainers'),
          window.GymApp.api.get('/members')
        ]);
        if (ptsRes?.success) window.GymApp.data.pts = Array.isArray(ptsRes.data) ? ptsRes.data : (ptsRes.data?.data || []);
        if (membersRes?.success) window.GymApp.data.members = Array.isArray(membersRes.data) ? membersRes.data : (membersRes.data?.data || []);
      } catch (e) { }
    }

    this._renderPTList();
    this._renderMemberList();

    // Nạp lịch tập ban đầu nếu chưa có
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

    const today = new Date().toISOString().split('T')[0];
    const regDate = document.getElementById('reg-date');
    if (regDate) regDate.value = today;

    // Search PT
    document.getElementById('search-pt')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.pt-card').forEach(card => {
        const name = card.dataset.ptName.toLowerCase();
        const spec = card.dataset.ptSpecialty?.toLowerCase() || '';
        card.style.display = name.includes(q) || spec.includes(q) ? '' : 'none';
      });
    });

    // Search Member
    document.getElementById('search-member')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.member-card').forEach(card => {
        const name = card.dataset.memberName.toLowerCase();
        const id = card.dataset.memberId?.toString().toLowerCase() || '';
        card.style.display = name.includes(q) || id.includes(q) ? '' : 'none';
      });
    });

    // Clear PT
    document.getElementById('clear-pt')?.addEventListener('click', () => {
      self._selectedPT = null;
      document.getElementById('selected-pt-display').classList.add('hidden');
      document.getElementById('pt-selection-area').classList.remove('hidden');
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
      if (!date || !start || !end) { window.GymApp.toast('Vui lòng điền đầy đủ ngày và giờ!', 'error'); return; }

      try {
        const memberDetail = await window.GymApp.api.get(`/members/${self._selectedMember.id}`);
        const activeContract = (memberDetail.data?.pt_hien_tai || []).find(c => String(c.pt_id) === String(self._selectedPT.id));

        if (!activeContract) {
          window.GymApp.toast('Hội viên này chưa đăng ký gói tập với PT này!', 'error');
          return;
        }

        const bookingData = {
          dang_ky_pt_id: activeContract.id,
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
          document.getElementById('clear-member').click();
          document.getElementById('reg-start').value = '';
          document.getElementById('reg-end').value = '';
          document.getElementById('reg-notes').value = '';
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
           data-pt-id="${pt.id}" data-pt-name="${pt.ho_ten}" data-pt-specialty="${pt.loai_ho_so || ''}">
        ${window.GymApp.avatarImg(pt.avatar_url, pt.ho_ten, 'sm')}
        <div class="flex-1 min-w-0">
          <p class="font-bold text-on-surface text-body-md">${pt.ho_ten}</p>
          <p class="text-on-surface-variant text-body-sm">${pt.ma_ho_so} &bull; ${pt.chuyen_mon || 'PT'}</p>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.pt-card').forEach(card => {
      card.addEventListener('click', () => {
        this._selectedPT = { id: card.dataset.ptId, name: card.dataset.ptName };
        document.getElementById('pt-selection-area').classList.add('hidden');
        const display = document.getElementById('selected-pt-display');
        display.classList.remove('hidden');
        document.getElementById('selected-pt-info').innerHTML = `
          ${window.GymApp.avatarImg('', card.dataset.ptName, 'sm')}
          <span class="text-brand-primary font-bold text-body-sm">${card.dataset.ptName}</span>
        `;
      });
    });
  },

  _renderMemberList: function () {
    const members = Array.isArray(window.GymApp.data.members) ? window.GymApp.data.members.filter(m => m.trang_thai === 'dang_tap' || m.trang_thai === 'active') : [];
    const list = document.getElementById('member-list');
    if (!list) return;

    if (members.length === 0) {
      list.innerHTML = '<p class="text-center py-4 text-on-surface-variant text-body-sm">Không có hội viên đang hoạt động</p>';
      return;
    }

    list.innerHTML = members.map(m => `
      <div class="member-card flex items-center gap-compact p-compact rounded-xl cursor-pointer hover:bg-surface-container transition-colors border border-transparent hover:border-outline-variant"
           data-member-id="${m.id}" data-member-name="${m.ho_ten}" data-member-phone="${m.so_dien_thoai || ''}">
        ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'sm')}
        <div class="flex-1 min-w-0">
          <p class="font-bold text-on-surface text-body-md">${m.ho_ten}</p>
          <p class="text-on-surface-variant text-body-sm">${m.ma_ho_so} &bull; ${m.so_dien_thoai || ''}</p>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.member-card').forEach(card => {
      card.addEventListener('click', () => {
        this._selectedMember = { id: card.dataset.memberId, name: card.dataset.memberName };
        document.getElementById('member-selection-area').classList.add('hidden');
        const display = document.getElementById('selected-member-display');
        display.classList.remove('hidden');
        document.getElementById('selected-member-info').innerHTML = `
          ${window.GymApp.avatarImg('', card.dataset.memberName, 'sm')}
          <span class="text-brand-primary font-bold text-body-sm">${card.dataset.memberName}</span>
        `;
      });
    });
  },
};
