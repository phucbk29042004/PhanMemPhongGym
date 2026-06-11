window.GymApp.pages['birthday'] = {
  _monthNames: [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ],

  _getBirthdayGroups: function () {
    const currentYear = new Date().getFullYear();
    const branch = window.GymApp.selectedBranch || '';
    let membersList = Array.isArray(window.GymApp.data.members) ? window.GymApp.data.members : [];
    if (branch) {
      membersList = membersList.filter(m => m.chi_nhanh === branch);
    }
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
    });
  },

  _getTodayBirthdays: function () {
    const today = new Date();
    const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const branch = window.GymApp.selectedBranch || '';
    let membersList = Array.isArray(window.GymApp.data.members) ? window.GymApp.data.members : [];
    if (branch) {
      membersList = membersList.filter(m => m.chi_nhanh === branch);
    }
    return membersList
      .filter(m => {
        const bDay = m.ngay_sinh || m.dob;
        if (!bDay || typeof bDay !== 'string') return false;
        const parts = bDay.split('-');
        return parts.length >= 3 && `${parts[1]}-${parts[2]}` === todayMD;
      })
      .map(m => {
        const bDay = m.ngay_sinh || m.dob;
        const [year, mth, day] = bDay.split('-').map(Number);
        return { ...m, birthDay: day, birthMonth: mth };
      });
  },

  render: function () {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    const groups = this._getBirthdayGroups();
    const todayBirthdays = this._getTodayBirthdays();
    const totalMembers = groups.reduce((sum, g) => sum + g.members.length, 0);
    const busiestGroup = groups.reduce((best, g) => !best || g.members.length > best.members.length ? g : best, null);
    const monthsWithData = groups.filter(g => g.members.length > 0).length;

    // Month icon labels
    const monthIcons = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const styleBlock = `
      <style>
        /* ── Month card ── */
        .bd-month-card {
          position: relative;
          background: #fff;
          border: 1.5px solid #e8eae6;
          border-radius: 16px;
          padding: 16px 20px 18px;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .dark .bd-month-card {
          background: #1e2220;
          border-color: #2e3530;
        }

        /* Glow tháng hiện tại */
        .bd-month-card.bd-current {
          border: 2px solid #40916c;
          box-shadow:
            0 0 0 3px rgba(64,145,108,0.10),
            0 0 20px 4px rgba(64,145,108,0.10);
          animation: bd-green-glow 2.8s ease-in-out infinite;
        }
        @keyframes bd-green-glow {
          0%,100% { box-shadow: 0 0 0 3px rgba(64,145,108,0.10), 0 0 20px 4px rgba(64,145,108,0.10); }
          50%      { box-shadow: 0 0 0 5px rgba(64,145,108,0.16), 0 0 32px 8px rgba(64,145,108,0.16); }
        }

        /* Header tháng */
        .bd-month-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }
        .bd-month-icon {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #a52d59;
          flex-shrink: 0;
          line-height: 1;
        }
        .bd-month-icon-top {
          font-size: 8px;
          font-weight: 800;
          color: #ffd6e6;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .bd-month-icon-mid {
          width: 22px;
          height: 1.5px;
          background: rgba(255,255,255,0.35);
          margin: 2px 0;
        }
        .bd-month-icon-dots {
          display: flex;
          gap: 2px;
        }
        .bd-month-icon-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(255,255,255,0.7);
        }

        .bd-month-name {
          font-size: 17px;
          font-weight: 800;
          color: #a52d59;
        }
        .bd-current .bd-month-name { color: #2d6a4f; }
        .bd-current .bd-month-icon { background: #2d6a4f; }

        .bd-month-count {
          font-size: 13px;
          font-weight: 700;
          color: #7a8878;
        }

        /* Scroll ngang chứa avatar */
        .bd-avatars-track {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 6px;
          scrollbar-width: thin;
          scrollbar-color: #d1d9cd transparent;
          -webkit-overflow-scrolling: touch;
        }
        .bd-avatars-track::-webkit-scrollbar { height: 4px; }
        .bd-avatars-track::-webkit-scrollbar-track { background: transparent; }
        .bd-avatars-track::-webkit-scrollbar-thumb { background: #d1d9cd; border-radius: 99px; }

        /* Avatar item */
        .bd-avatar-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          cursor: default;
        }
        .bd-avatar-wrap {
          position: relative;
          width: 64px;
          height: 64px;
        }
        .bd-avatar-img {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          border: 2.5px solid #e0ede6;
          background: #edf3f0;
          display: block;
        }
        .bd-avatar-fallback {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 2.5px solid #e0ede6;
          background: linear-gradient(135deg, #b7e4c7, #74c69d);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          flex-shrink: 0;
        }
        /* Viền glowing cho "hôm nay" */
        .bd-avatar-today .bd-avatar-img,
        .bd-avatar-today .bd-avatar-fallback {
          border: 3px solid #a52d59;
          box-shadow: 0 0 0 3px rgba(165,45,89,0.15), 0 0 12px 3px rgba(165,45,89,0.18);
          animation: bd-avatar-today-glow 2s ease-in-out infinite;
        }
        @keyframes bd-avatar-today-glow {
          0%,100% { box-shadow: 0 0 0 3px rgba(165,45,89,0.14), 0 0 10px 2px rgba(165,45,89,0.14); }
          50%      { box-shadow: 0 0 0 5px rgba(165,45,89,0.22), 0 0 18px 5px rgba(165,45,89,0.20); }
        }
        .bd-avatar-today-dot {
          position: absolute;
          bottom: 1px;
          right: 1px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #a52d59;
          border: 2px solid #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 7px;
          line-height: 1;
        }
        .bd-avatar-name {
          font-size: 12px;
          font-weight: 700;
          color: #2c3530;
          text-align: center;
          max-width: 72px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          line-height: 1.3;
        }
        .dark .bd-avatar-name { color: #d8e5de; }
        .bd-avatar-date {
          font-size: 11px;
          font-weight: 600;
          color: #7a8878;
          text-align: center;
        }
        .bd-avatar-today .bd-avatar-date { color: #a52d59; font-weight: 800; }

        /* Wish button nhỏ trên avatar */
        .bd-wish-btn {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          border: 1.5px solid #e0d0e8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.15s, background 0.15s;
          z-index: 2;
        }
        .bd-avatar-item:hover .bd-wish-btn { opacity: 1; }
        .bd-wish-btn:hover { background: #a52d59; border-color: #a52d59; }
        .bd-wish-btn:hover .bd-wish-icon { color: #fff; }
        .bd-wish-icon { font-size: 11px !important; color: #a52d59; }

        /* Empty state */
        .bd-empty {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #aab8a8;
          font-size: 13px;
          font-weight: 600;
          padding: 4px 0 2px;
        }

        /* Today section */
        .bd-today-section {
          border: 2px solid rgba(165,45,89,0.3);
          border-radius: 16px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(165,45,89,0.07), 0 0 20px 4px rgba(165,45,89,0.08);
          animation: bd-pink-glow 2.8s ease-in-out infinite;
        }
        .dark .bd-today-section { background: #1e2220; }
        @keyframes bd-pink-glow {
          0%,100% { box-shadow: 0 0 0 3px rgba(165,45,89,0.07), 0 0 18px 3px rgba(165,45,89,0.08); }
          50%      { box-shadow: 0 0 0 5px rgba(165,45,89,0.13), 0 0 28px 7px rgba(165,45,89,0.14); }
        }

        /* Stats */
        .bd-stat-card {
          background: #fff;
          border: 1.5px solid #e8eae6;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .bd-stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.06);
        }
        .dark .bd-stat-card { background: #1e2220; border-color: #2e3530; }

        /* Burst */
        .birthday-burst-banner-redesign {
          position: fixed; left: 50%; top: 24px; z-index: 9998;
          transform: translateX(-50%);
          display: flex; align-items: center; gap: 14px;
          background: rgba(28,32,40,0.85); backdrop-filter: blur(16px);
          color: #dde1e7; border: 2px solid rgba(165,45,89,0.4);
          border-radius: 24px; padding: 12px 24px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.35);
          animation: birthday-banner-pop 5.2s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
        }
        html:not(.dark) .birthday-burst-banner-redesign {
          background: rgba(255,255,255,0.9); color: #181c20;
          border: 2px solid rgba(165,45,89,0.25);
          box-shadow: 0 20px 48px rgba(165,45,89,0.12);
        }
        .birthday-emoji-particle {
          position: absolute; pointer-events: none; user-select: none;
          z-index: 9999; animation: birthday-emoji-rise ease-out forwards;
        }
        @keyframes birthday-emoji-rise {
          0%   { transform: translate(0,0) scale(0.2) rotate(0deg); opacity:1; }
          100% { transform: translate(var(--tx),var(--ty)) scale(var(--scale,1.2)) rotate(var(--rot,360deg)); opacity:0; }
        }
        .birthday-bubble-particle {
          position: absolute; border: 1.5px solid rgba(255,255,255,0.4);
          border-radius: 50%; background: rgba(255,255,255,0.06);
          animation: birthday-bubble-rise ease-out forwards;
        }
        @keyframes birthday-bubble-rise {
          0%  { transform: translateY(0) scale(0.6); opacity:0; }
          15% { opacity:0.8; } 85% { opacity:0.4; }
          100%{ transform: translateY(var(--ty,-115vh)) scale(1.35); opacity:0; }
        }
        @keyframes confetti-fall-anim {
          0%  { transform: translateY(-20px) rotate(0deg); }
          100%{ transform: translateY(105vh) rotate(360deg); }
        }
      </style>
    `;

    // Helper: render avatar circle
    const renderAvatar = (m, isToday) => {
      const initial = (m.ho_ten || '?').trim()[0].toUpperCase();
      const avatarEl = m.avatar_url
        ? `<img class="bd-avatar-img" src="${m.avatar_url}" alt="${m.ho_ten}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="bd-avatar-fallback" style="display:none">${initial}</div>`
        : `<div class="bd-avatar-fallback">${initial}</div>`;

      return `
        <div class="bd-avatar-item${isToday ? ' bd-avatar-today' : ''}">
          <div class="bd-avatar-wrap">
            ${avatarEl}
            ${isToday ? `<div class="bd-avatar-today-dot">🎂</div>` : ''}
            <button class="bd-wish-btn btn-wish-one" data-id="${m.id}" data-name="${m.ho_ten}" title="Gửi lời chúc">
              <span class="material-symbols-outlined bd-wish-icon" style="font-variation-settings:'FILL' 1">send</span>
            </button>
          </div>
          <span class="bd-avatar-name">${m.ho_ten}</span>
          <span class="bd-avatar-date">${String(m.birthDay).padStart(2,'0')}/${String(m.birthMonth).padStart(2,'0')}</span>
        </div>
      `;
    };

    // 12 tháng
    const monthSectionsHtml = groups.map(group => {
      const isCurrentMonth = group.month === currentMonth;
      const count = group.members.length;
      const iconLabel = monthIcons[group.month - 1];

      const contentHtml = count === 0
        ? `<div class="bd-empty">
             <span class="material-symbols-outlined" style="font-size:16px;font-variation-settings:'FILL' 0">cake</span>
             Không có hội viên sinh nhật
           </div>`
        : `<div class="bd-avatars-track">
             ${group.members.map(m => {
               const isToday = m.birthDay === todayDay && m.birthMonth === currentMonth;
               return renderAvatar(m, isToday);
             }).join('')}
           </div>`;

      const wishFooter = count > 0 ? `
        <div style="display:flex;justify-content:flex-end;margin-top:12px;">
          <button class="btn-wish-month" style="display:flex;align-items:center;gap:5px;padding:5px 14px;border-radius:8px;background:#2d6a4f;color:#fff;font-weight:700;font-size:12px;border:none;cursor:pointer;transition:background 0.15s;"
            onmouseover="this.style.background='#40916c'" onmouseout="this.style.background='#2d6a4f'"
            data-month="${group.month}" data-members='${JSON.stringify(group.members.map(m => ({ id: m.id, ho_ten: m.ho_ten })))}'>
            <span class="material-symbols-outlined" style="font-size:13px;font-variation-settings:'FILL' 1">send</span>
            Gửi lời chúc cả tháng
          </button>
        </div>
      ` : '';

      return `
        <div class="bd-month-card${isCurrentMonth ? ' bd-current' : ''}">
          <div class="bd-month-header">
            <div class="bd-month-icon">
              <span class="bd-month-icon-top">${iconLabel}</span>
              <div class="bd-month-icon-mid"></div>
              <div class="bd-month-icon-dots">
                <div class="bd-month-icon-dot"></div>
                <div class="bd-month-icon-dot"></div>
                <div class="bd-month-icon-dot"></div>
              </div>
            </div>
            <span class="bd-month-name">${group.label}</span>
            <span class="bd-month-count">(${count})</span>
            ${isCurrentMonth ? `<span style="font-size:11px;font-weight:700;color:#2d6a4f;background:rgba(45,106,79,0.10);padding:1px 8px;border-radius:99px;margin-left:2px;">Tháng này</span>` : ''}
            ${busiestGroup && busiestGroup.month === group.month && count > 0 ? `<span style="font-size:11px;font-weight:700;color:#b45309;background:rgba(180,83,9,0.09);padding:1px 8px;border-radius:99px;">Đông nhất</span>` : ''}
          </div>
          ${contentHtml}
          ${wishFooter}
        </div>
      `;
    }).join('');

    return `
      ${styleBlock}
      <div class="flex flex-col gap-lg animate-fadeIn">

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-standard">
          ${[
            { label: 'Sinh nhật hôm nay', value: todayBirthdays.length, icon: 'cake', color: '#a52d59', bg: 'rgba(165,45,89,0.08)' },
            { label: 'Tháng có sinh nhật', value: monthsWithData, icon: 'calendar_month', color: '#2d6a4f', bg: 'rgba(45,106,79,0.08)' },
            { label: busiestGroup ? `Đông nhất: ${busiestGroup.label}` : 'Tháng đông nhất', value: busiestGroup ? busiestGroup.members.length : 0, icon: 'groups', color: '#b45309', bg: 'rgba(180,83,9,0.08)' },
          ].map(s => `
            <div class="bd-stat-card">
              <div style="width:40px;height:40px;border-radius:10px;background:${s.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <span class="material-symbols-outlined" style="color:${s.color};font-size:20px;font-variation-settings:'FILL' 1">${s.icon}</span>
              </div>
              <div class="text-left">
                <p class="text-on-surface-variant text-body-sm font-semibold">${s.label}</p>
                <p class="font-bold text-headline" style="color:${s.color}">${s.value}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Sinh nhật hôm nay -->
        ${todayBirthdays.length > 0 ? `
          <div class="bd-today-section">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid rgba(165,45,89,0.14);background:rgba(165,45,89,0.04);">
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="material-symbols-outlined" style="color:#a52d59;font-size:18px;font-variation-settings:'FILL' 1">cake</span>
                <span style="font-weight:800;font-size:14px;color:inherit;">Sinh nhật hôm nay</span>
                <span style="font-size:11px;font-weight:700;color:#a52d59;background:rgba(165,45,89,0.10);padding:1px 8px;border-radius:99px;">${todayBirthdays.length} người</span>
              </div>
              <button id="btn-wish-all" style="display:flex;align-items:center;gap:5px;padding:6px 14px;border-radius:8px;background:#a52d59;color:#fff;font-weight:700;font-size:12px;border:none;cursor:pointer;transition:background 0.15s;"
                onmouseover="this.style.background='#881b40'" onmouseout="this.style.background='#a52d59'">
                <span class="material-symbols-outlined" style="font-size:13px;font-variation-settings:'FILL' 1">send</span>
                Gửi tất cả
              </button>
            </div>
            <div style="padding:16px 20px;">
              <div class="bd-avatars-track">
                ${todayBirthdays.map(m => renderAvatar(m, true)).join('')}
              </div>
            </div>
          </div>
        ` : ''}

        <!-- 12 tháng -->
        <div>
          <div class="text-left mb-3">
            <h3 class="font-bold text-on-surface text-body-lg">Lịch sinh nhật 12 tháng</h3>
            <p class="text-on-surface-variant text-body-sm font-semibold mt-0.5">${totalMembers} hội viên có ngày sinh</p>
          </div>
          <div class="flex flex-col gap-3">
            ${monthSectionsHtml}
          </div>
        </div>

      </div>
    `;
  },

  _createMiniBurst: function (x, y, container) {
    const colors = ['#1D9336','#a52d59','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#ef4444','#14b8a6'];
    const emojis = ['🎈','🎂','🎉','✨','🧁','🎁'];
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('span');
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 80;
      p.className = 'birthday-emoji-particle';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      p.style.cssText = `left:${x}px;top:${y}px;font-size:20px;--tx:${Math.cos(angle)*dist}px;--ty:${Math.sin(angle)*dist}px;--scale:${0.8+Math.random()*0.8};--rot:${(Math.random()>.5?1:-1)*(180+Math.random()*180)}deg;animation-duration:${600+Math.random()*400}ms;`;
      container.appendChild(p);
    }
  },

  _showBirthdayBurst: function (label, count, originEvent) {
    document.getElementById('birthday-burst-layer')?.remove();
    const layer = document.createElement('div');
    layer.id = 'birthday-burst-layer';
    layer.style.cssText = 'position:fixed;inset:0;z-index:9997;pointer-events:auto;overflow:hidden;background:rgba(0,0,0,0.18);';
    document.body.appendChild(layer);

    const colors = ['#1D9336','#a52d59','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#ef4444','#14b8a6'];
    const emojis = ['🎈','🎂','🎉','✨','🧁','🎁'];
    const x = originEvent?.clientX || window.innerWidth / 2;
    const y = originEvent?.clientY || window.innerHeight / 2;

    for (let i = 0; i < 30; i++) {
      const spark = document.createElement('span');
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 190;
      const size = 5 + Math.random() * 8;
      spark.className = 'birthday-firework-spark';
      spark.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random()*colors.length)]};--tx:${Math.cos(angle)*dist}px;--ty:${Math.sin(angle)*dist}px;animation-duration:${800+Math.random()*300}ms;`;
      layer.appendChild(spark);
    }
    for (let i = 0; i < 22; i++) {
      const p = document.createElement('span');
      const angle = Math.random() * Math.PI * 2;
      const dist = 100 + Math.random() * 240;
      p.className = 'birthday-emoji-particle';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      p.style.cssText = `left:${x}px;top:${y}px;font-size:24px;--tx:${Math.cos(angle)*dist}px;--ty:${Math.sin(angle)*dist}px;--scale:${1+Math.random()*0.9};--rot:${(Math.random()>.5?1:-1)*(360+Math.random()*360)}deg;animation-duration:${1000+Math.random()*600}ms;animation-delay:${Math.random()*80}ms;`;
      layer.appendChild(p);
    }
    for (let i = 0; i < 24; i++) {
      const p = document.createElement('span');
      p.className = 'birthday-emoji-particle';
      p.textContent = '🎈';
      p.style.cssText = `left:${Math.random()*100}vw;top:105vh;font-size:${32+Math.random()*32}px;--tx:${(Math.random()-.5)*200}px;--ty:-115vh;--scale:1;--rot:${(Math.random()-.5)*45}deg;animation-duration:${4.2+Math.random()*3}s;animation-delay:${Math.random()*1.6}s;`;
      layer.appendChild(p);
    }
    for (let i = 0; i < 35; i++) {
      const b = document.createElement('span');
      const size = 16 + Math.random() * 36;
      b.className = 'birthday-bubble-particle';
      b.style.cssText = `left:${Math.random()*100}vw;top:105vh;width:${size}px;height:${size}px;--ty:-115vh;animation-duration:${3.5+Math.random()*2.5}s;animation-delay:${Math.random()*1.5}s;`;
      layer.appendChild(b);
    }
    for (let i = 0; i < 40; i++) {
      const c = document.createElement('span');
      const size = 6 + Math.random() * 8;
      c.style.cssText = `position:fixed;left:${Math.random()*100}vw;top:-20px;width:${size}px;height:${size*(0.4+Math.random()*0.6)}px;background:${colors[Math.floor(Math.random()*colors.length)]};opacity:${0.7+Math.random()*0.3};border-radius:${Math.random()>.5?'50%':'3px'};transform:rotate(${Math.random()*360}deg);z-index:9998;pointer-events:none;animation:confetti-fall-anim ${2.5+Math.random()*2.2}s linear ${Math.random()*0.8}s forwards;`;
      layer.appendChild(c);
    }

    const banner = document.createElement('div');
    banner.className = 'birthday-burst-banner-redesign';
    banner.innerHTML = `
      <span class="material-symbols-outlined text-[#a52d59]" style="font-size:26px;font-variation-settings:'FILL' 1">celebration</span>
      <div class="flex flex-col text-left">
        <span style="font-weight:800;font-size:13px;letter-spacing:.04em;color:#40916c;text-transform:uppercase;">${label}</span>
        <span style="font-weight:700;font-size:15px;color:#a52d59;">🎂 Có ${count} hội viên sinh nhật! 🎉</span>
      </div>
    `;
    layer.appendChild(banner);

    const self = this;
    layer.addEventListener('click', e => { self._createMiniBurst(e.clientX, e.clientY, layer); });
    window.GymApp.toast(`Đã mở tiệc sinh nhật cho ${label} 🎉`, 'success');
    setTimeout(() => {
      layer.style.transition = 'opacity 800ms ease';
      layer.style.opacity = '0';
      setTimeout(() => layer.remove(), 800);
    }, 5500);
  },

  _sendWish: async function (id, name) {
    try {
      await window.GymApp.api.post(`/members/${id}/birthday-wish`);
      window.GymApp.toast(`Đã gửi lời chúc sinh nhật đến ${name} 🎂`, 'success');
    } catch (e) {
      window.GymApp.toast(e?.message || 'Gửi thất bại', 'error');
    }
  },

  _sendWishAll: async function () {
    const btn = document.getElementById('btn-wish-all');
    if (btn) { btn.disabled = true; btn.textContent = 'Đang gửi...'; }
    try {
      const res = await window.GymApp.api.post('/members/birthday-wish-all');
      window.GymApp.toast(`Đã gửi lời chúc đến ${res.data?.so_luong || 0} hội viên sinh nhật hôm nay 🎉`, 'success');
    } catch (e) {
      window.GymApp.toast(e?.message || 'Gửi thất bại', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:13px;font-variation-settings:\'FILL\' 1">send</span> Gửi tất cả';
      }
    }
  },

  init: function () {
    const self = this;

    // Wish individual — event delegation trên document để catch cả trong scroll-track
    document.addEventListener('click', function _bdWish(e) {
      const btn = e.target.closest('.btn-wish-one');
      if (!btn) return;
      e.stopPropagation();
      btn.disabled = true;
      self._sendWish(btn.dataset.id, btn.dataset.name).then(() => { btn.disabled = false; });
    });

    // Wish all today
    document.getElementById('btn-wish-all')?.addEventListener('click', () => self._sendWishAll());

    // Wish all in month
    document.querySelectorAll('.btn-wish-month').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        const members = JSON.parse(btn.dataset.members || '[]');
        if (!members.length) return;
        btn.disabled = true;
        btn.textContent = 'Đang gửi...';
        let ok = 0;
        for (const m of members) {
          try { await window.GymApp.api.post(`/members/${m.id}/birthday-wish`); ok++; } catch (_) {}
        }
        window.GymApp.toast(`Đã gửi lời chúc đến ${ok}/${members.length} hội viên tháng này 🎂`, 'success');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:13px;font-variation-settings:\'FILL\' 1">send</span> Gửi lời chúc cả tháng';
      });
    });
  },

  guideHtml: `
    <div class="space-y-4 text-xs">
      <div class="flex items-start gap-2 bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/10">
        <span class="material-symbols-outlined text-brand-primary text-base flex-shrink-0 mt-0.5">info</span>
        <p class="text-on-surface-variant leading-relaxed">Trang <strong>Sinh nhật hội viên</strong> tổng hợp danh sách các khách hàng có ngày sinh nhật trong ngày hoặc phân nhóm theo 12 tháng để lên kế hoạch tri ân, gửi lời chúc mừng.</p>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">Sinh nhật hôm nay:</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li>Hiển thị nổi bật ở khung phía trên kèm ảnh đại diện của hội viên.</li>
          <li><strong>Gửi lời chúc:</strong> Bấm nút **Gửi tất cả** để gửi thông điệp chúc mừng sinh nhật qua thông báo App tới toàn bộ hội viên có sinh nhật hôm nay, hoặc gửi riêng từng người bằng nút **Gửi chúc mừng** bên dưới avatar.</li>
        </ul>
      </div>

      <div>
        <h4 class="font-bold text-on-surface mb-1">Lịch sinh nhật 12 tháng:</h4>
        <ul class="list-disc pl-5 space-y-1 text-on-surface-variant">
          <li>Phân chia hội viên theo từng tháng sinh.</li>
          <li>Tháng hiện tại sẽ được đánh dấu nhãn **Tháng này**.</li>
          <li>Tháng có nhiều sinh nhật nhất sẽ có nhãn **Đông nhất**.</li>
          <li>Bấm nút **Gửi lời chúc cả tháng** để gửi hàng loạt lời chúc mừng tới tất cả hội viên sinh nhật trong tháng đó.</li>
        </ul>
      </div>
    </div>
  `
};
