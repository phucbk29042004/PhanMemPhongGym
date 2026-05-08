window.GymApp.pages['birthday'] = {
  _monthNames: [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ],

  _getBirthdayGroups: function () {
    const currentYear = new Date().getFullYear();
    const rawMembers = window.GymApp.data.members;
    const membersList = Array.isArray(rawMembers) ? rawMembers : [];
    return Array.from({ length: 12 }, (_, idx) => {
      const month = idx + 1;
      const members = membersList
        .filter(m => {
          const bDay = m.ngay_sinh || m.dob;
          return bDay && typeof bDay === 'string' && Number(bDay.split('-')[1]) === month;
        })
        .map(m => {
          const bDay = m.ngay_sinh || m.dob;
          const [year, mth, day] = bDay.split('-').map(Number);
          return {
            ...m,
            birthDay: day,
            birthMonth: mth,
            ageThisYear: currentYear - year,
          };
        })
        .sort((a, b) => a.birthDay - b.birthDay || (a.ho_ten || '').localeCompare(b.ho_ten || '', 'vi'));

      return {
        month,
        label: this._monthNames[idx],
        members,
      };
    }).filter(group => group.members.length > 0);
  },

  _getTodayBirthdays: function () {
    const today = new Date();
    const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const rawMembers = window.GymApp.data.members;
    const members = Array.isArray(rawMembers) ? rawMembers : [];
    return members.filter(m => {
      const bDay = m.ngay_sinh || m.dob;
      if (!bDay) return false;
      const parts = bDay.split('-');
      return `${parts[1]}-${parts[2]}` === todayMD;
    });
  },

  render: function () {
    const today = new Date();
    const groups = this._getBirthdayGroups();
    const todayBirthdays = this._getTodayBirthdays();
    const totalMembers = groups.reduce((sum, group) => sum + group.members.length, 0);
    const busiestGroup = groups.reduce((best, group) => !best || group.members.length > best.members.length ? group : best, null);

    return `
      <div class="flex flex-col gap-standard">

        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-standard">
          <div>
            <h2 class="font-display-2xl text-display-2xl text-on-surface font-bold">Sinh nhật hội viên</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm">
              Lịch sinh nhật theo 12 tháng, tự gộp hội viên cùng tháng vào một dòng
            </p>
          </div>
          <button id="btn-birthday-celebrate-all" class="bg-brand-primary text-white px-loose py-compact rounded-lg font-bold hover:bg-[#187a2d] flex items-center gap-compact shadow-sm">
            <span class="material-symbols-outlined text-sm">celebration</span>
            Chúc mừng tất cả
          </button>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-standard">
          ${[
            { label: 'Sinh nhật hôm nay', value: todayBirthdays.length, icon: 'cake', color: 'text-[#a52d59]', bg: 'bg-[#ffd9e1]' },
            { label: 'Tháng có dữ liệu', value: groups.length, icon: 'calendar_month', color: 'text-brand-primary', bg: 'bg-[#e7f5e9]' },
            { label: busiestGroup ? `Đông nhất: ${busiestGroup.label}` : 'Đông nhất', value: busiestGroup ? busiestGroup.members.length : 0, icon: 'groups', color: 'text-[#e65100]', bg: 'bg-[#fff3e0]' },
          ].map(s => `
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-standard shadow-sm flex items-center gap-standard">
              <div class="w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0">
                <span class="material-symbols-outlined ${s.color} text-2xl">${s.icon}</span>
              </div>
              <div>
                <p class="text-on-surface-variant text-body-sm font-bold">${s.label}</p>
                <p class="${s.color} font-display-2xl text-display-2xl font-bold">${s.value}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Monthly birthday list -->
        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div class="px-loose py-standard border-b border-outline-variant bg-surface-container-high flex flex-col md:flex-row md:items-center gap-xs md:gap-compact">
            <div class="flex items-center gap-compact">
              <span class="material-symbols-outlined text-brand-primary">featured_seasonal_and_gifts</span>
              <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Lịch sinh nhật 12 tháng</h3>
            </div>
            <span class="md:ml-auto text-on-surface-variant text-body-sm font-bold">${totalMembers} hội viên có ngày sinh</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead class="bg-surface-container">
                <tr class="h-10">
                  <th class="px-loose font-bold text-body-md text-on-surface" style="width:150px;">Tháng</th>
                  <th class="px-loose font-bold text-body-md text-on-surface" style="width:110px;">Số lượng</th>
                  <th class="px-loose font-bold text-body-md text-on-surface">Hội viên sinh nhật trong tháng</th>
                  <th class="px-loose font-bold text-body-md text-on-surface text-right" style="width:120px;">Hiệu ứng</th>
                </tr>
              </thead>
              <tbody>
                ${groups.map(group => `
                  <tr class="birthday-month-row border-b border-outline-variant hover:bg-surface-container-low transition-colors cursor-pointer" data-month="${group.month}" data-label="${group.label}" data-count="${group.members.length}">
                    <td class="px-loose py-standard align-top">
                      <div class="flex items-center gap-compact">
                        <div class="w-10 h-10 rounded-xl bg-[#e7f5e9] flex items-center justify-center flex-shrink-0">
                          <span class="material-symbols-outlined text-brand-primary text-xl">cake</span>
                        </div>
                        <div>
                          <p class="font-bold text-on-surface text-body-md">${group.label}</p>
                          <p class="text-on-surface-variant text-body-sm">Năm ${today.getFullYear()}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-loose py-standard align-top">
                      <span class="inline-flex items-center justify-center px-compact py-xs rounded-full font-bold text-body-sm bg-[#fff3e0] text-[#e65100]">
                        ${group.members.length} người
                      </span>
                    </td>
                    <td class="px-loose py-standard">
                      <div class="flex flex-wrap gap-compact">
                        ${group.members.map(m => `
                          <div class="birthday-member-chip flex items-center gap-compact bg-surface-container border border-outline-variant rounded-lg px-compact py-xs">
                            ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'sm')}
                            <div class="min-w-0">
                              <p class="font-bold text-on-surface text-body-sm">${m.ho_ten}</p>
                              <p class="text-on-surface-variant" style="font-size:11px;">${String(m.birthDay).padStart(2, '0')}/${String(m.birthMonth).padStart(2, '0')} · ${m.ageThisYear} tuổi · ${m.so_dien_thoai || ''}</p>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    </td>
                    <td class="px-loose py-standard align-middle text-right">
                      <button class="birthday-burst-btn inline-flex items-center gap-xs px-standard py-compact rounded-lg border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-colors font-bold text-body-sm" data-month="${group.month}" data-label="${group.label}" data-count="${group.members.length}">
                        <span class="material-symbols-outlined text-sm">auto_awesome</span>
                        Bắn
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        ${todayBirthdays.length > 0 ? `
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-standard shadow-sm flex flex-col gap-compact">
            <div class="flex items-center gap-compact">
              <span class="material-symbols-outlined text-[#a52d59]">cake</span>
              <h3 class="font-bold text-on-surface text-body-lg">Hôm nay có sinh nhật</h3>
              <span class="ml-auto bg-[#a52d59] text-white px-compact py-xs rounded-full text-label-xs font-bold">${todayBirthdays.length} người</span>
            </div>
            <div class="flex flex-wrap gap-compact">
              ${todayBirthdays.map(m => `
                <button class="birthday-today-chip flex items-center gap-compact bg-surface-container border border-outline-variant rounded-lg px-compact py-xs hover:border-brand-primary transition-colors" data-label="Sinh nhật hôm nay" data-count="${todayBirthdays.length}">
                  ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'sm')}
                  <span class="font-bold text-on-surface text-body-sm">${m.ho_ten}</span>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

      </div>
    `;
  },

  _showBirthdayBurst: function (label, count, originEvent) {
    document.getElementById('birthday-burst-layer')?.remove();

    const layer = document.createElement('div');
    layer.id = 'birthday-burst-layer';
    layer.style.cssText = 'position:fixed;inset:0;z-index:9997;pointer-events:none;overflow:hidden;';
    document.body.appendChild(layer);

    const colors = ['#1D9336', '#a52d59', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'];
    const x = originEvent?.clientX || window.innerWidth / 2;
    const y = originEvent?.clientY || window.innerHeight / 2;

    for (let i = 0; i < 34; i++) {
      const spark = document.createElement('span');
      const angle = Math.random() * Math.PI * 2;
      const distance = 90 + Math.random() * 220;
      const size = 5 + Math.random() * 8;
      spark.className = 'birthday-firework-spark';
      spark.style.cssText = `
        left:${x}px;top:${y}px;width:${size}px;height:${size}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        --tx:${Math.cos(angle) * distance}px;--ty:${Math.sin(angle) * distance}px;
        animation-delay:${Math.random() * 0.12}s;
      `;
      layer.appendChild(spark);
    }

    for (let i = 0; i < 46; i++) {
      const bubble = document.createElement('span');
      const size = 18 + Math.random() * 48;
      bubble.className = 'birthday-bubble';
      bubble.style.cssText = `
        left:${Math.random() * 100}vw;bottom:-70px;width:${size}px;height:${size}px;
        border-color:${colors[Math.floor(Math.random() * colors.length)]};
        animation-duration:${3 + Math.random() * 2.8}s;
        animation-delay:${Math.random() * 0.5}s;
      `;
      layer.appendChild(bubble);
    }

    const banner = document.createElement('div');
    banner.className = 'birthday-burst-banner';
    banner.innerHTML = `
      <span class="material-symbols-outlined">celebration</span>
      <strong>${label}</strong>
      <span>${count} hội viên sinh nhật</span>
    `;
    layer.appendChild(banner);

    window.GymApp.toast(`Đã mở hiệu ứng sinh nhật cho ${label}`, 'success');
    setTimeout(() => layer.remove(), 5200);
  },

  init: function () {
    const self = this;

    document.querySelectorAll('.birthday-month-row').forEach(row => {
      row.addEventListener('click', e => {
        if (e.target.closest('.birthday-burst-btn')) return;
        self._showBirthdayBurst(row.dataset.label, row.dataset.count, e);
      });
    });

    document.querySelectorAll('.birthday-burst-btn, .birthday-today-chip').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        self._showBirthdayBurst(btn.dataset.label, btn.dataset.count, e);
      });
    });

    document.getElementById('btn-birthday-celebrate-all')?.addEventListener('click', e => {
      self._showBirthdayBurst('Tất cả sinh nhật', window.GymApp.data.members.length, e);
    });
  }
};
