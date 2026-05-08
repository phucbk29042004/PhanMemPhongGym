window.GymApp.pages['pt-register'] = {
  _selectedPT: null,
  _selectedMember: null,

  render: function () {
    const pts = window.GymApp.data.pts;
    const members = window.GymApp.data.members.filter(m => m.status === 'active');
    const bookings = window.GymApp.data.ptBookings;

    return `
      <div class="flex flex-col gap-margin">

        <!-- Page Title -->
        <div>
          <h2 class="font-display-2xl text-display-2xl text-on-surface font-bold">Đăng ký lịch tập PT</h2>
          <p class="text-on-surface-variant font-body-sm text-body-sm">Đặt lịch tập giữa hội viên và huấn luyện viên cá nhân</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-loose">

          <!-- ===== CARD 1: Form đặt lịch ===== -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div class="px-loose py-standard border-b border-outline-variant bg-surface-container-low">
              <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface flex items-center gap-compact">
                <span class="material-symbols-outlined text-brand-primary">edit_calendar</span>
                Thông tin đặt lịch
              </h3>
            </div>

            <div class="p-loose flex flex-col gap-margin">

              <!-- Chọn PT -->
              <div>
                <label class="block text-body-sm text-on-surface-variant font-bold mb-xs flex items-center gap-xs">
                  <span class="material-symbols-outlined text-brand-primary text-sm">sports_gymnastics</span>
                  Chọn huấn luyện viên (PT)
                </label>
                <!-- Search PT -->
                <div class="relative mb-standard">
                  <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                  <input id="search-pt" type="text" placeholder="Tìm kiếm PT..." class="w-full bg-surface-container-low border border-outline-variant text-on-surface pl-8 pr-standard py-compact rounded-lg focus:border-brand-primary outline-none font-body-md text-body-md" />
                </div>
                <!-- Danh sách PT (scroll) -->
                <div id="pt-list" class="flex flex-col gap-xs max-h-48 overflow-y-auto pr-xs border border-outline-variant rounded-lg p-xs">
                  ${pts.map(pt => `
                    <div
                      class="pt-card flex items-center gap-compact p-compact rounded-lg cursor-pointer hover:bg-surface-container transition-colors border border-transparent"
                      data-pt-id="${pt.id}" data-pt-name="${pt.name}" data-pt-specialty="${pt.specialty}"
                    >
                      ${window.GymApp.avatarImg(pt.avatar, pt.name, 'sm')}
                      <div class="flex-1 min-w-0">
                        <p class="font-bold text-on-surface text-body-md">${pt.name}</p>
                        <p class="text-on-surface-variant text-body-sm">${pt.specialty}</p>
                      </div>
                      <div class="flex items-center gap-xs flex-shrink-0">
                        <span class="material-symbols-outlined text-sm text-[#f59e0b]">star</span>
                        <span class="text-body-sm font-bold">${pt.rating}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
                <!-- PT đã chọn -->
                <div id="selected-pt-display" class="hidden mt-compact p-compact bg-[#e7f5e9] rounded-lg border border-brand-primary flex items-center gap-compact">
                  <span class="material-symbols-outlined text-brand-primary text-sm">check_circle</span>
                  <span id="selected-pt-name" class="text-brand-primary font-bold text-body-sm"></span>
                  <button id="clear-pt" class="ml-auto material-symbols-outlined text-sm text-on-surface-variant hover:text-error">close</button>
                </div>
              </div>

              <!-- Chọn Hội viên -->
              <div>
                <label class="block text-body-sm text-on-surface-variant font-bold mb-xs flex items-center gap-xs">
                  <span class="material-symbols-outlined text-brand-primary text-sm">person</span>
                  Chọn hội viên
                </label>
                <!-- Search Member -->
                <div class="relative mb-standard">
                  <span class="material-symbols-outlined absolute left-standard top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                  <input id="search-member" type="text" placeholder="Tìm kiếm hội viên..." class="w-full bg-surface-container-low border border-outline-variant text-on-surface pl-8 pr-standard py-compact rounded-lg focus:border-brand-primary outline-none font-body-md text-body-md" />
                </div>
                <!-- Danh sách Hội viên (scroll) -->
                <div id="member-list" class="flex flex-col gap-xs max-h-48 overflow-y-auto pr-xs border border-outline-variant rounded-lg p-xs">
                  ${members.map(m => `
                    <div
                      class="member-card flex items-center gap-compact p-compact rounded-lg cursor-pointer hover:bg-surface-container transition-colors border border-transparent"
                      data-member-id="${m.id}" data-member-name="${m.name}" data-member-phone="${m.phone}"
                    >
                      ${window.GymApp.avatarImg(m.avatar, m.name, 'sm')}
                      <div class="flex-1 min-w-0">
                        <p class="font-bold text-on-surface text-body-md">${m.name}</p>
                        <p class="text-on-surface-variant text-body-sm">${m.id} &bull; ${m.phone}</p>
                      </div>
                      <span class="text-on-surface-variant text-body-sm flex-shrink-0">${m.package}</span>
                    </div>
                  `).join('')}
                </div>
                <!-- Member đã chọn -->
                <div id="selected-member-display" class="hidden mt-compact p-compact bg-[#e7f5e9] rounded-lg border border-brand-primary flex items-center gap-compact">
                  <span class="material-symbols-outlined text-brand-primary text-sm">check_circle</span>
                  <span id="selected-member-name" class="text-brand-primary font-bold text-body-sm"></span>
                  <button id="clear-member" class="ml-auto material-symbols-outlined text-sm text-on-surface-variant hover:text-error">close</button>
                </div>
              </div>

              <!-- Loại đăng ký, ngày, giờ -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-standard">
                <div>
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Loại đăng ký</label>
                  <select id="reg-type" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-lg focus:border-brand-primary outline-none font-body-md text-body-md">
                    <option value="Cá nhân">Cá nhân (1-1)</option>
                    <option value="Nhóm">Nhóm (2-5 người)</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <div>
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Ngày tập</label>
                  <input id="reg-date" type="date" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-lg focus:border-brand-primary outline-none font-body-md text-body-md" />
                </div>
                <div>
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Giờ bắt đầu</label>
                  <input id="reg-start" type="time" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-lg focus:border-brand-primary outline-none font-body-md text-body-md" />
                </div>
                <div>
                  <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Giờ kết thúc</label>
                  <input id="reg-end" type="time" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-lg focus:border-brand-primary outline-none font-body-md text-body-md" />
                </div>
              </div>

              <!-- Ghi chú -->
              <div>
                <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Ghi chú</label>
                <textarea id="reg-notes" rows="2" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-standard py-compact rounded-lg focus:border-brand-primary outline-none font-body-md text-body-md resize-none" placeholder="Mục tiêu tập luyện, yêu cầu đặc biệt..."></textarea>
              </div>

              <!-- Nút đặt lịch -->
              <button id="btn-book" class="w-full bg-brand-primary text-white py-compact rounded-lg font-bold hover:bg-[#187a2d] transition-all flex items-center justify-center gap-compact shadow-sm">
                <span class="material-symbols-outlined text-sm">event_available</span>
                Đặt lịch tập
              </button>
            </div>
          </div>

          <!-- ===== CARD 2: Danh sách đã đặt ===== -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
            <div class="px-loose py-standard border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
              <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface flex items-center gap-compact">
                <span class="material-symbols-outlined text-brand-primary">calendar_month</span>
                Lịch đã đặt
              </h3>
              <span id="booking-count" class="bg-brand-primary text-white px-compact py-xs rounded-full text-label-xs font-bold">
                ${[...window.GymApp.data.ptSchedules, ...window.GymApp.data.ptBookings].length}
              </span>
            </div>

            <div id="booking-list" class="flex-grow overflow-y-auto p-standard flex flex-col gap-standard">
              ${this._renderBookingList()}
            </div>
          </div>

        </div>
      </div>
    `;
  },

  _renderBookingList: function () {
    const all = [...window.GymApp.data.ptSchedules, ...window.GymApp.data.ptBookings];
    if (all.length === 0) {
      return `
        <div class="flex flex-col items-center justify-center h-full py-margin text-center">
          <span class="material-symbols-outlined text-5xl text-outline">event_note</span>
          <p class="text-on-surface-variant text-body-sm mt-standard">Chưa có lịch đặt nào</p>
        </div>
      `;
    }
    return all.map(b => `
      <div class="bg-surface-container-low rounded-xl border border-outline-variant p-standard flex flex-col gap-xs hover:border-brand-primary transition-colors">
        <div class="flex items-start justify-between">
          <div>
            <p class="font-bold text-on-surface text-body-md">${b.memberName}</p>
            <p class="text-on-surface-variant text-body-sm">${b.ptName}</p>
          </div>
          ${window.GymApp.statusBadge(b.status)}
        </div>
        <div class="flex items-center gap-loose text-on-surface-variant text-body-sm">
          <span class="flex items-center gap-xs">
            <span class="material-symbols-outlined text-sm">event</span>
            ${window.GymApp.formatDate(b.date)}
          </span>
          <span class="flex items-center gap-xs">
            <span class="material-symbols-outlined text-sm">schedule</span>
            ${b.startTime} — ${b.endTime}
          </span>
          <span class="flex items-center gap-xs">
            <span class="material-symbols-outlined text-sm">group</span>
            ${b.type}
          </span>
        </div>
        ${b.notes ? `<p class="text-on-surface-variant text-body-sm italic">"${b.notes}"</p>` : ''}
        <div class="flex items-center justify-end gap-atom pt-xs border-t border-outline-variant">
          <button class="material-symbols-outlined text-outline hover:text-brand-primary text-xl p-atom rounded hover:bg-surface-container transition-colors" title="Sửa">edit</button>
          <button class="btn-cancel-booking material-symbols-outlined text-outline hover:text-error text-xl p-atom rounded hover:bg-error-container transition-colors" data-id="${b.id}" title="Hủy">event_busy</button>
        </div>
      </div>
    `).join('');
  },

  _refreshBookingList: function () {
    const list = document.getElementById('booking-list');
    const count = document.getElementById('booking-count');
    if (list) list.innerHTML = this._renderBookingList();
    const total = window.GymApp.data.ptSchedules.length + window.GymApp.data.ptBookings.length;
    if (count) count.textContent = total;
  },

  init: function () {
    const self = this;
    self._selectedPT = null;
    self._selectedMember = null;

    // Set default date
    const today = new Date().toISOString().split('T')[0];
    const regDate = document.getElementById('reg-date');
    if (regDate) regDate.value = today;

    // Search PT filter
    document.getElementById('search-pt')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.pt-card').forEach(card => {
        const name = card.dataset.ptName.toLowerCase();
        const spec = card.dataset.ptSpecialty?.toLowerCase() || '';
        card.style.display = name.includes(q) || spec.includes(q) ? '' : 'none';
      });
    });

    // Search Member filter
    document.getElementById('search-member')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.member-card').forEach(card => {
        const name = card.dataset.memberName.toLowerCase();
        const id = card.dataset.memberId?.toLowerCase() || '';
        card.style.display = name.includes(q) || id.includes(q) ? '' : 'none';
      });
    });

    // Chọn PT
    document.querySelectorAll('.pt-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.pt-card').forEach(c => c.classList.remove('border-brand-primary', 'bg-[#e7f5e9]'));
        card.classList.add('border-brand-primary', 'bg-[#e7f5e9]');
        self._selectedPT = { id: card.dataset.ptId, name: card.dataset.ptName };
        const display = document.getElementById('selected-pt-display');
        document.getElementById('selected-pt-name').textContent = card.dataset.ptName;
        display.classList.remove('hidden');
      });
    });

    // Clear PT
    document.getElementById('clear-pt')?.addEventListener('click', () => {
      self._selectedPT = null;
      document.getElementById('selected-pt-display').classList.add('hidden');
      document.querySelectorAll('.pt-card').forEach(c => c.classList.remove('border-brand-primary', 'bg-[#e7f5e9]'));
    });

    // Chọn Member
    document.querySelectorAll('.member-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.member-card').forEach(c => c.classList.remove('border-brand-primary', 'bg-[#e7f5e9]'));
        card.classList.add('border-brand-primary', 'bg-[#e7f5e9]');
        self._selectedMember = { id: card.dataset.memberId, name: card.dataset.memberName };
        const display = document.getElementById('selected-member-display');
        document.getElementById('selected-member-name').textContent = card.dataset.memberName;
        display.classList.remove('hidden');
      });
    });

    // Clear Member
    document.getElementById('clear-member')?.addEventListener('click', () => {
      self._selectedMember = null;
      document.getElementById('selected-member-display').classList.add('hidden');
      document.querySelectorAll('.member-card').forEach(c => c.classList.remove('border-brand-primary', 'bg-[#e7f5e9]'));
    });

    // Đặt lịch
    document.getElementById('btn-book')?.addEventListener('click', () => {
      if (!self._selectedPT) { window.GymApp.toast('Vui lòng chọn huấn luyện viên PT!', 'error'); return; }
      if (!self._selectedMember) { window.GymApp.toast('Vui lòng chọn hội viên!', 'error'); return; }
      const date = document.getElementById('reg-date')?.value;
      const start = document.getElementById('reg-start')?.value;
      const end = document.getElementById('reg-end')?.value;
      if (!date || !start || !end) { window.GymApp.toast('Vui lòng điền đầy đủ ngày và giờ!', 'error'); return; }

      const newBooking = {
        id: 'BK-' + Date.now(),
        ptId: self._selectedPT.id,
        ptName: self._selectedPT.name,
        memberId: self._selectedMember.id,
        memberName: self._selectedMember.name,
        date: date,
        startTime: start,
        endTime: end,
        type: document.getElementById('reg-type')?.value || 'Cá nhân',
        status: 'pending',
        notes: document.getElementById('reg-notes')?.value || '',
      };

      window.GymApp.data.ptBookings.unshift(newBooking);
      self._refreshBookingList();
      window.GymApp.toast('Đặt lịch tập thành công!', 'success');

      // Reset form
      document.getElementById('reg-date').value = today;
      document.getElementById('reg-start').value = '';
      document.getElementById('reg-end').value = '';
      document.getElementById('reg-notes').value = '';
    });

    // Hủy booking
    document.addEventListener('click', e => {
      const cancelBtn = e.target.closest('.btn-cancel-booking');
      if (cancelBtn) {
        const id = cancelBtn.dataset.id;
        window.GymApp.data.ptBookings = window.GymApp.data.ptBookings.filter(b => b.id !== id);
        self._refreshBookingList();
        window.GymApp.toast('Đã hủy lịch tập!', 'info');
      }
    });
  }
};
