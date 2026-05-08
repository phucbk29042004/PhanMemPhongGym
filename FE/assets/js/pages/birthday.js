window.GymApp.pages['birthday'] = {
  _monthNames: [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ],

  _getBirthdayGroups: function () {
    const currentYear = new Date().getFullYear();
    const membersList = Array.isArray(window.GymApp.data.members) ? window.GymApp.data.members : [];
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
          return { ...m, birthDay: day, birthMonth: mth, ageThisYear: currentYear - year };
        })
        .sort((a, b) => a.birthDay - b.birthDay || (a.ho_ten || '').localeCompare(b.ho_ten || '', 'vi'));
      return { month, label: this._monthNames[idx], members };
    }).filter(g => g.members.length > 0);
  },

  _getTodayBirthdays: function () {
    const today = new Date();
    const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return (Array.isArray(window.GymApp.data.members) ? window.GymApp.data.members : []).filter(m => {
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
    const totalMembers = groups.reduce((sum, g) => sum + g.members.length, 0);
    const busiestGroup = groups.reduce((best, g) => !best || g.members.length > best.members.length ? g : best, null);

    return `
      <div class="flex flex-col gap-margin">

        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-standard">
          <div class="page-title-bar">
            <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Sinh nhật hội viên</h2>
            <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs">Lịch sinh nhật theo 12 tháng</p>
          </div>
          <button id="btn-birthday-celebrate-all" class="btn-primary text-white px-loose py-compact rounded-xl font-bold flex items-center gap-compact">
            <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">celebration</span>
            Chúc mừng tất cả
          </button>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-loose">
          ${[
            { label: 'Sinh nhật hôm nay', value: todayBirthdays.length, icon: 'cake', iconBg: 'icon-bg-pink', color: 'text-[#a52d59]' },
            { label: 'Tháng có dữ liệu', value: groups.length, icon: 'calendar_month', iconBg: 'icon-bg-green', color: 'text-brand-primary' },
            { label: busiestGroup ? `Đông nhất: ${busiestGroup.label}` : 'Đông nhất', value: busiestGroup ? busiestGroup.members.length : 0, icon: 'groups', iconBg: 'icon-bg-orange', color: 'text-[#e65100]' },
          ].map(s => `
            <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-loose shadow-sm flex items-center gap-loose">
              <div class="icon-bg ${s.iconBg}" style="width:48px;height:48px;border-radius:14px">
                <span class="material-symbols-outlined ${s.color} text-2xl" style="font-variation-settings:'FILL' 1">${s.icon}</span>
              </div>
              <div>
                <p class="text-on-surface-variant text-body-sm font-bold">${s.label}</p>
                <p class="${s.color} font-display-lg text-display-lg font-bold">${s.value}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Hôm nay có sinh nhật -->
        ${todayBirthdays.length > 0 ? `
          <div class="bg-gradient-to-r from-[#ffd9e1]/40 to-transparent rounded-2xl border border-[#a52d59]/20 p-standard shadow-sm">
            <div class="flex items-center gap-compact mb-compact">
              <div class="icon-bg icon-bg-pink" style="width:36px;height:36px;border-radius:10px">
                <span class="material-symbols-outlined text-[#a52d59]" style="font-size:18px;font-variation-settings:'FILL' 1">cake</span>
              </div>
              <h3 class="font-bold text-on-surface text-body-lg">Sinh nhật hôm nay</h3>
              <span class="ml-auto bg-[#a52d59] text-white px-compact py-xs rounded-full text-label-xs font-bold">${todayBirthdays.length} người</span>
            </div>
            <div class="flex flex-wrap gap-compact">
              ${todayBirthdays.map(m => `
                <button class="birthday-today-chip gym-card flex items-center gap-compact bg-surface-container-lowest border border-outline-variant rounded-xl px-compact py-xs" data-label="Sinh nhật hôm nay" data-count="${todayBirthdays.length}">
                  ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'sm')}
                  <div class="text-left">
                    <span class="font-bold text-on-surface text-body-sm block">${m.ho_ten}</span>
                    <span class="text-[#a52d59] text-body-sm">🎂 Hôm nay</span>
                  </div>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Lịch sinh nhật 12 tháng -->
        <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
          <div class="section-header px-loose py-standard border-b border-outline-variant flex flex-col md:flex-row md:items-center gap-xs md:gap-compact">
            <div class="flex items-center gap-compact">
              <div class="icon-bg icon-bg-pink">
                <span class="material-symbols-outlined text-[#a52d59] text-lg" style="font-variation-settings:'FILL' 1">featured_seasonal_and_gifts</span>
              </div>
              <h3 class="font-display-2xl text-display-2xl font-bold text-on-surface">Lịch sinh nhật 12 tháng</h3>
            </div>
            <span class="md:ml-auto text-on-surface-variant text-body-sm font-bold bg-surface-container px-compact py-xs rounded-full">${totalMembers} hội viên có ngày sinh</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse gym-table">
              <thead>
                <tr class="h-10">
                  <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider" style="width:150px">Tháng</th>
                  <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider" style="width:110px">Số lượng</th>
                  <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider">Hội viên sinh nhật</th>
                  <th class="px-loose font-bold text-body-sm text-on-surface-variant uppercase tracking-wider text-right" style="width:120px">Hiệu ứng</th>
                </tr>
              </thead>
              <tbody>
                ${groups.length === 0
                  ? `<tr><td colspan="4" class="px-loose py-margin text-center text-on-surface-variant">Không có dữ liệu sinh nhật</td></tr>`
                  : groups.map(group => `
                    <tr class="birthday-month-row border-b border-outline-variant hover:bg-surface-container-low transition-colors cursor-pointer" data-month="${group.month}" data-label="${group.label}" data-count="${group.members.length}">
                      <td class="px-loose py-standard align-top">
                        <div class="flex items-center gap-compact">
                          <div class="icon-bg icon-bg-pink" style="border-radius:10px">
                            <span class="material-symbols-outlined text-[#a52d59] text-sm" style="font-variation-settings:'FILL' 1">cake</span>
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
                            <div class="birthday-member-chip gym-card flex items-center gap-compact bg-surface-container border border-outline-variant rounded-xl px-compact py-xs">
                              ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'sm')}
                              <div class="min-w-0">
                                <p class="font-bold text-on-surface text-body-sm">${m.ho_ten}</p>
                                <p class="text-on-surface-variant" style="font-size:11px">${String(m.birthDay).padStart(2, '0')}/${String(m.birthMonth).padStart(2, '0')} · ${m.ageThisYear} tuổi</p>
                              </div>
                            </div>
                          `).join('')}
                        </div>
                      </td>
                      <td class="px-loose py-standard align-middle text-right">
                        <button class="birthday-burst-btn inline-flex items-center gap-xs px-standard py-compact rounded-xl border border-outline-variant text-on-surface-variant hover:text-[#a52d59] hover:border-[#a52d59]/40 transition-colors font-bold text-body-sm" data-month="${group.month}" data-label="${group.label}" data-count="${group.members.length}">
                          <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">auto_awesome</span>
                          Bắn
                        </button>
                      </td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>
        </div>

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
      spark.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random() * colors.length)]};--tx:${Math.cos(angle) * distance}px;--ty:${Math.sin(angle) * distance}px;animation-delay:${Math.random() * 0.12}s;`;
      layer.appendChild(spark);
    }

    for (let i = 0; i < 46; i++) {
      const bubble = document.createElement('span');
      const size = 18 + Math.random() * 48;
      bubble.className = 'birthday-bubble';
      bubble.style.cssText = `left:${Math.random() * 100}vw;bottom:-70px;width:${size}px;height:${size}px;border-color:${colors[Math.floor(Math.random() * colors.length)]};animation-duration:${3 + Math.random() * 2.8}s;animation-delay:${Math.random() * 0.5}s;`;
      layer.appendChild(bubble);
    }

    const banner = document.createElement('div');
    banner.className = 'birthday-burst-banner';
    banner.innerHTML = `<span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">celebration</span><strong>${label}</strong><span>${count} hội viên sinh nhật</span>`;
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
