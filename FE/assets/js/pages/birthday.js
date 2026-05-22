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
    });
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
    const currentMonth = today.getMonth() + 1;
    const groups = this._getBirthdayGroups();
    const todayBirthdays = this._getTodayBirthdays();
    const totalMembers = groups.reduce((sum, g) => sum + g.members.length, 0);
    const busiestGroup = groups.reduce((best, g) => !best || g.members.length > best.members.length ? g : best, null);
    const monthsWithData = groups.filter(g => g.members.length > 0).length;

    // Seasonal card settings
    const monthGradients = {
      1: { gradient: 'from-[#0284c7] to-[#0369a1]', glow: 'rgba(2, 132, 199, 0.15)', title: 'Mùa Đông ❄️' },
      2: { gradient: 'from-[#0ea5e9] to-[#0284c7]', glow: 'rgba(14, 165, 233, 0.15)', title: 'Mùa Đông ❄️' },
      3: { gradient: 'from-[#10b981] to-[#047857]', glow: 'rgba(16, 185, 129, 0.15)', title: 'Mùa Xuân 🌸' },
      4: { gradient: 'from-[#059669] to-[#065f46]', glow: 'rgba(5, 150, 105, 0.15)', title: 'Mùa Xuân 🌸' },
      5: { gradient: 'from-[#34d399] to-[#059669]', glow: 'rgba(52, 211, 153, 0.15)', title: 'Mùa Xuân 🌸' },
      6: { gradient: 'from-[#f59e0b] to-[#d97706]', glow: 'rgba(245, 158, 11, 0.15)', title: 'Mùa Hạ ☀️' },
      7: { gradient: 'from-[#ea580c] to-[#c2410c]', glow: 'rgba(234, 88, 12, 0.15)', title: 'Mùa Hạ ☀️' },
      8: { gradient: 'from-[#f97316] to-[#ea580c]', glow: 'rgba(249, 115, 22, 0.15)', title: 'Mùa Hạ ☀️' },
      9: { gradient: 'from-[#84cc16] to-[#65a30d]', glow: 'rgba(132, 204, 22, 0.15)', title: 'Mùa Thu 🍁' },
      10: { gradient: 'from-[#eab308] to-[#ca8a04]', glow: 'rgba(234, 179, 8, 0.15)', title: 'Mùa Thu 🍁' },
      11: { gradient: 'from-[#d97706] to-[#b45309]', glow: 'rgba(217, 119, 6, 0.15)', title: 'Mùa Thu 🍁' },
      12: { gradient: 'from-[#a52d59] to-[#881b40]', glow: 'rgba(165, 45, 89, 0.15)', title: 'Mùa Đông 🎄' }
    };

    const styleBlock = `
      <style>
        /* CSS Animations for Redesigned Birthday Page */
        @keyframes float-balloon-anim {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-cake-anim {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes emoji-bounce-anim {
          0%, 100% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-16px) scale(1.15) rotate(6deg); }
          50% { transform: translateY(0) scale(0.95); }
          70% { transform: translateY(-6px) scale(1.05) rotate(-4deg); }
        }
        @keyframes confetti-fall-anim {
          0% { transform: translateY(-20px) rotate(0deg); }
          100% { transform: translateY(105vh) rotate(360deg); }
        }

        .animate-float-balloon {
          animation: float-balloon-anim 3.6s ease-in-out infinite;
        }
        .animate-float-cake {
          animation: float-cake-anim 4s ease-in-out infinite;
        }

        .month-card:hover .float-balloon-decor {
          animation: emoji-bounce-anim 1.1s cubic-bezier(0.28, 0.84, 0.42, 1) both;
        }
        .month-card:hover .float-cake-decor {
          animation: emoji-bounce-anim 1.1s cubic-bezier(0.28, 0.84, 0.42, 1) both;
          animation-delay: 0.12s;
        }

        /* Custom Scrollbar for scrollable members list */
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--outline-variant, #becab9);
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--text-on-surface-variant, #3f4a3c);
        }

        /* Full screen celebration style overrides */
        .birthday-burst-banner-redesign {
          position: fixed;
          left: 50%;
          top: 24px;
          z-index: 9998;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(28, 32, 40, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          color: #dde1e7;
          border: 2px solid rgba(165, 45, 89, 0.4);
          border-radius: 24px;
          padding: 12px 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
          animation: birthday-banner-pop 5.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        /* Light mode banner support */
        html:not(.dark) .birthday-burst-banner-redesign {
          background: rgba(255, 255, 255, 0.9);
          color: #181c20;
          border: 2px solid rgba(165, 45, 89, 0.25);
          box-shadow: 0 20px 48px rgba(165, 45, 89, 0.12);
        }

        .birthday-emoji-particle {
          position: absolute;
          pointer-events: none;
          user-select: none;
          z-index: 9999;
          animation: birthday-emoji-rise ease-out forwards;
        }

        @keyframes birthday-emoji-rise {
          0% {
            transform: translate(0, 0) scale(0.2) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(var(--scale, 1.2)) rotate(var(--rot, 360deg));
            opacity: 0;
          }
        }

        .birthday-bubble-particle {
          position: absolute;
          border: 1.5px solid rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          box-shadow: inset 0 0 8px rgba(255, 255, 255, 0.25), 0 0 12px rgba(255, 255, 255, 0.08);
          animation: birthday-bubble-rise ease-out forwards;
        }

        @keyframes birthday-bubble-rise {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 0;
          }
          15% { opacity: 0.8; }
          85% { opacity: 0.4; }
          100% {
            transform: translateY(var(--ty, -115vh)) scale(1.35);
            opacity: 0;
          }
        }
      </style>
    `;

    const monthCardsHtml = groups.map(group => {
      const isCurrentMonth = group.month === currentMonth;
      const count = group.members.length;
      const config = monthGradients[group.month] || monthGradients[12];
      
      this._monthPages = this._monthPages || {};
      this._monthPages[group.month] = this._monthPages[group.month] || 1;
      const page = this._monthPages[group.month];
      const perPage = 3;
      const totalPages = Math.ceil(count / perPage) || 1;
      const paginatedMembers = group.members.slice((page - 1) * perPage, page * perPage);
      
      return `
        <div class="month-card relative overflow-hidden bg-white dark:bg-[#1e1e1e] border-2 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col ${isCurrentMonth ? 'border-[#a52d59] shadow-md shadow-[#a52d59]/5' : 'border-outline-variant/50'}" data-month="${group.month}">
          <!-- Seasonal Header Gradient Banner -->
          <div class="relative overflow-hidden p-standard flex items-center justify-between text-white bg-gradient-to-br ${config.gradient}" style="border-top-left-radius: 12px; border-top-right-radius: 12px;">
            <!-- Floating Decorative Emojis (breathing & sway) -->
            <div class="absolute right-6 -bottom-1 opacity-25 pointer-events-none select-none text-4xl animate-float-balloon float-balloon-decor">🎈</div>
            <div class="absolute left-6 -top-2 opacity-25 pointer-events-none select-none text-4xl animate-float-cake float-cake-decor">🎂</div>
            
            <div class="relative z-10 flex flex-col text-left">
              <span class="text-white/70 font-bold text-label-xs tracking-wider uppercase">${config.title}</span>
              <h4 class="font-bold text-body-md text-white mt-0.5">${group.label}</h4>
            </div>
            
            <div class="relative z-10 flex flex-col items-end gap-xs">
              ${isCurrentMonth ? `
                <span class="bg-white/20 backdrop-blur-md text-white font-bold px-2 py-0.5 rounded-full text-label-xs shadow-sm uppercase tracking-wide">
                  Hiện tại 🌟
                </span>
              ` : ''}
              ${busiestGroup && busiestGroup.month === group.month && count > 0 ? `
                <span class="bg-[#fff3e0] dark:bg-[#ffa726]/20 text-[#e65100] dark:text-[#ffb74d] font-bold px-2 py-0.5 rounded-full text-label-xs shadow-sm flex items-center gap-xs">
                  <span class="material-symbols-outlined text-[10px]" style="font-variation-settings:'FILL' 1">local_fire_department</span>
                  Đông nhất
                </span>
              ` : ''}
            </div>
          </div>
          
          <!-- Card Content Body -->
          <div class="p-standard flex flex-col flex-1 gap-standard">
            <!-- Count summary -->
            <div class="flex items-center justify-between border-b border-outline-variant/50 pb-compact">
              <span class="text-on-surface-variant font-bold text-body-sm">Tổng sinh nhật:</span>
              <span class="font-bold text-body-sm ${count > 0 ? 'text-[#a52d59] bg-[#a52d59]/10' : 'text-on-surface-variant bg-surface-container-high'} px-2 py-0.5 rounded-full">
                ${count} hội viên
              </span>
            </div>
            
            <!-- Members List Scrollable Area -->
            <div id="birthday-list-month-${group.month}" class="flex flex-col gap-compact overflow-y-auto pr-xs custom-scrollbar" style="height: 180px;">
              ${count === 0 ? `
                <!-- Empty state for empty months -->
                <div class="flex flex-col items-center justify-center flex-1 gap-xs text-center py-standard opacity-65">
                  <span class="material-symbols-outlined text-on-surface-variant text-4xl" style="font-variation-settings:'FILL' 0">cake</span>
                  <p class="text-on-surface-variant font-bold text-body-md">Không có sinh nhật</p>
                  <p class="text-[#a52d59] font-bold text-body-sm">Không có sinh nhật tháng này</p>
                </div>
              ` : paginatedMembers.map(m => `
                <!-- Member Card Chip -->
                <div class="birthday-member-chip flex items-center gap-compact bg-surface-container-low/30 border-2 border-outline-variant/50 rounded-xl p-compact hover:bg-surface-container-low transition-all">
                  ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'sm')}
                  <div class="min-w-0 flex-1 text-left">
                    <p class="font-bold text-on-surface text-body-md truncate">${m.ho_ten}</p>
                    <p class="text-on-surface-variant text-body-sm font-semibold mt-xxs">
                      📅 ${String(m.birthDay).padStart(2, '0')}/${String(m.birthMonth).padStart(2, '0')} · <span class="text-[#a52d59] font-bold">${m.ageThisYear} tuổi</span>
                    </p>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <!-- Local pagination controls for month -->
            <div id="birthday-pagination-month-${group.month}">
              ${totalPages > 1 ? `
                <div class="flex items-center justify-between pt-xs text-[11px] border-t border-outline-variant/30">
                  <span class="text-on-surface-variant font-bold">Trang ${page}/${totalPages}</span>
                  <div class="flex gap-1">
                    <button data-month-action="prev" data-month="${group.month}" ${page === 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : 'style="cursor: pointer;"'} class="w-6 h-6 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-[#a52d59]/5 hover:text-[#a52d59] transition-all">
                      <span class="material-symbols-outlined text-xs">chevron_left</span>
                    </button>
                    <button data-month-action="next" data-month="${group.month}" ${page === totalPages ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : 'style="cursor: pointer;"'} class="w-6 h-6 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-[#a52d59]/5 hover:text-[#a52d59] transition-all">
                      <span class="material-symbols-outlined text-xs">chevron_right</span>
                    </button>
                  </div>
                </div>
              ` : ''}
            </div>
            
            <!-- Card Footer Operations -->
            <div class="flex items-center gap-compact pt-compact border-t border-outline-variant/50 mt-auto">
              ${count > 0 ? `
                ${isCurrentMonth ? `
                  <button class="btn-wish-month flex-1 inline-flex items-center justify-center gap-xs px-4 py-2 rounded-xl bg-[#a52d59] text-white font-bold text-body-md hover:shadow-lg hover:shadow-pink-500/20 active:scale-95 transition-all" data-month="${group.month}" data-members='${JSON.stringify(group.members.map(m => ({ id: m.id, ho_ten: m.ho_ten })))}'>
                    <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">send</span>
                    Gửi lời chúc
                  </button>
                ` : ''}
                <button class="birthday-burst-btn ${isCurrentMonth ? 'px-compact' : 'flex-1'} inline-flex items-center justify-center gap-xs px-4 py-2 rounded-xl border-2 border-outline-variant/50 bg-white dark:bg-[#1e1e1e] text-on-surface-variant hover:text-[#a52d59] hover:border-[#a52d59]/50 active:scale-95 transition-all font-bold text-body-sm" data-month="${group.month}" data-label="${group.label}" data-count="${count}">
                  <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">auto_awesome</span>
                  ${isCurrentMonth ? '' : 'Bắn hiệu ứng'}
                </button>
              ` : `
                <!-- Disabled footer actions for empty month -->
                <div class="flex items-center justify-center w-full text-on-surface-variant/40 text-label-xs font-bold uppercase tracking-wider">
                  Yên bình 🍃
                </div>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
 
    return `
      ${styleBlock}
      <div class="flex flex-col gap-lg animate-fadeIn">
        <!-- Stats Grid Redesigned -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-standard">
          ${[
            { label: 'Sinh nhật hôm nay', value: todayBirthdays.length, icon: 'cake', iconBg: 'bg-[#a52d59]/10', color: 'text-[#a52d59]' },
            { label: 'Tháng có sinh nhật', value: monthsWithData, icon: 'calendar_month', iconBg: 'bg-brand-primary/10', color: 'text-brand-primary' },
            { label: busiestGroup ? `Tháng đông nhất: ${busiestGroup.label}` : 'Tháng đông nhất', value: busiestGroup ? busiestGroup.members.length : 0, icon: 'groups', iconBg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
          ].map(s => `
            <div class="bg-white dark:bg-[#1e1e1e] border-2 border-outline-variant/50 rounded-2xl p-standard shadow-sm flex items-center gap-standard transition-all hover:-translate-y-1 hover:shadow-md duration-300">
              <div class="w-12 h-12 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0">
                <span class="material-symbols-outlined ${s.color} text-xl" style="font-variation-settings:'FILL' 1">${s.icon}</span>
              </div>
              <div class="text-left">
                <p class="text-on-surface-variant text-body-sm font-bold">${s.label}</p>
                <p class="${s.color} text-headline font-bold mt-0.5">${s.value}</p>
              </div>
            </div>
          `).join('')}
        </div>
 
        <!-- Hôm nay có sinh nhật -->
        ${todayBirthdays.length > 0 ? `
          <div class="bg-gradient-to-r from-[#ffd9e1]/20 to-transparent dark:from-[#3a1a24]/20 dark:to-transparent rounded-2xl border-2 border-[#a52d59]/40 p-standard shadow-sm relative overflow-hidden">
            <!-- Background sparkles decorative -->
            <div class="absolute right-4 top-4 text-6xl opacity-10 pointer-events-none select-none animate-float-balloon">🎈</div>
            
            <div class="flex flex-col sm:flex-row sm:items-center gap-compact mb-standard relative z-10">
              <div class="flex items-center gap-compact text-left">
                <div class="w-10 h-10 rounded-lg bg-[#a52d59]/10 flex items-center justify-center shadow-sm">
                  <span class="material-symbols-outlined text-[#a52d59] text-lg" style="font-variation-settings:'FILL' 1">cake</span>
                </div>
                <div>
                  <h3 class="font-bold text-on-surface text-body-lg">Sinh nhật hôm nay 🎂</h3>
                  <p class="text-on-surface-variant text-body-sm font-semibold">Gửi lời chúc ấm áp nhất đến hội viên của chúng ta!</p>
                </div>
              </div>
              
              <div class="sm:ml-auto flex items-center gap-compact mt-2 sm:mt-0">
                <span class="bg-[#a52d59]/15 text-[#a52d59] px-2.5 py-1 rounded-full text-label-xs font-bold shadow-sm">${todayBirthdays.length} người</span>
                <button id="btn-wish-all" class="flex items-center gap-xs px-4 py-2.5 rounded-xl bg-[#a52d59] text-white font-bold text-body-md hover:shadow-lg hover:shadow-pink-500/20 active:scale-95 transition-all">
                  <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">send</span>
                  Gửi lời chúc tất cả
                </button>
              </div>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-compact relative z-10">
              ${todayBirthdays.map(m => `
                <div class="flex items-center justify-between bg-white dark:bg-[#1e1e1e] border-2 border-outline-variant/50 rounded-xl p-compact hover:shadow-sm hover:border-[#a52d59]/50 transition-all duration-300">
                  <div class="flex items-center gap-compact min-w-0">
                    ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'sm')}
                    <div class="text-left min-w-0">
                      <span class="font-bold text-on-surface text-body-md block truncate">${m.ho_ten}</span>
                      <span class="text-[#a52d59] text-label-xs font-bold bg-[#ffd9e1]/40 dark:bg-[#a52d59]/20 px-2 py-0.5 rounded-full inline-block mt-xs">🎂 Hôm nay</span>
                    </div>
                  </div>
                  <button class="btn-wish-one flex items-center justify-center w-8 h-8 rounded-full border border-[#a52d59]/30 text-[#a52d59] hover:bg-[#a52d59] hover:text-white hover:border-[#a52d59] active:scale-95 transition-all flex-shrink-0" data-id="${m.id}" data-name="${m.ho_ten}" title="Gửi lời chúc">
                    <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">send</span>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
 
        <!-- Lịch sinh nhật 12 tháng Grid Redesign -->
        <div class="flex flex-col gap-standard">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-compact mb-compact text-left">
            <div class="flex items-center gap-compact">
              <div class="w-10 h-10 rounded-lg bg-[#a52d59]/10 flex items-center justify-center shadow-sm">
                <span class="material-symbols-outlined text-[#a52d59] text-lg" style="font-variation-settings:'FILL' 1">featured_seasonal_and_gifts</span>
              </div>
              <div>
                <h3 class="font-bold text-on-surface text-body-lg">Lịch sinh nhật 12 tháng</h3>
                <p class="text-on-surface-variant text-body-sm font-semibold">Theo dõi và chúc mừng sinh nhật của toàn bộ hội viên trong năm</p>
              </div>
            </div>
            
            <div class="flex items-center gap-compact mt-2 md:mt-0">
              <span class="text-on-surface-variant text-body-sm font-bold bg-surface-container px-3 py-1 rounded-full shadow-sm">
                ${totalMembers} hội viên có ngày sinh
              </span>
              <button id="btn-birthday-celebrate-all" class="flex items-center gap-xs px-4 py-2.5 rounded-xl bg-brand-primary text-white font-bold text-body-md hover:shadow-lg hover:shadow-brand-primary/20 hover:-translate-y-0.5 active:scale-95 transition-all">
                <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">celebration</span>
                Đại tiệc sinh nhật 🎉
              </button>
            </div>
          </div>
          
          <div id="birthday-months-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-standard">
            ${monthCardsHtml}
          </div>
        </div>
      </div>
    `;
  },

  _createMiniBurst: function (x, y, container) {
    const colors = ['#1D9336', '#a52d59', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'];
    const emojis = ['🎈', '🎂', '🎉', '✨', '🧁', '🎁'];
    
    // Launch dynamic emojis
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('span');
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 80;
      const scale = 0.8 + Math.random() * 0.8;
      const rot = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 180);
      
      p.className = 'birthday-emoji-particle';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      p.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        font-size: 20px;
        --tx: ${Math.cos(angle) * distance}px;
        --ty: ${Math.sin(angle) * distance}px;
        --scale: ${scale};
        --rot: ${rot}deg;
        animation-duration: ${600 + Math.random() * 400}ms;
      `;
      container.appendChild(p);
    }
    
    // Launch glowing sparkles
    for (let i = 0; i < 12; i++) {
      const spark = document.createElement('span');
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 60;
      const size = 4 + Math.random() * 6;
      
      spark.className = 'birthday-firework-spark';
      spark.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        --tx: ${Math.cos(angle) * distance}px;
        --ty: ${Math.sin(angle) * distance}px;
        animation-duration: 700ms;
      `;
      container.appendChild(spark);
    }
  },

  _showBirthdayBurst: function (label, count, originEvent) {
    document.getElementById('birthday-burst-layer')?.remove();
    const layer = document.createElement('div');
    layer.id = 'birthday-burst-layer';
    layer.style.cssText = 'position:fixed;inset:0;z-index:9997;pointer-events:auto;overflow:hidden;background:rgba(0,0,0,0.18);';
    document.body.appendChild(layer);

    const colors = ['#1D9336', '#a52d59', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'];
    const emojis = ['🎈', '🎂', '🎉', '✨', '🧁', '🎁'];
    const x = originEvent?.clientX || window.innerWidth / 2;
    const y = originEvent?.clientY || window.innerHeight / 2;

    // 1. Initial burst at click position
    for (let i = 0; i < 30; i++) {
      const spark = document.createElement('span');
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * 190;
      const size = 5 + Math.random() * 8;
      spark.className = 'birthday-firework-spark';
      spark.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random() * colors.length)]};--tx:${Math.cos(angle) * distance}px;--ty:${Math.sin(angle) * distance}px;animation-duration:${800 + Math.random() * 300}ms;`;
      layer.appendChild(spark);
    }

    // 2. Launch spinning Emojis from click position
    for (let i = 0; i < 22; i++) {
      const p = document.createElement('span');
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 240;
      const scale = 1.0 + Math.random() * 0.9;
      const rot = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360);
      p.className = 'birthday-emoji-particle';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      p.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        font-size: 24px;
        --tx: ${Math.cos(angle) * distance}px;
        --ty: ${Math.sin(angle) * distance}px;
        --scale: ${scale};
        --rot: ${rot}deg;
        animation-duration: ${1000 + Math.random() * 600}ms;
        animation-delay: ${Math.random() * 80}ms;
      `;
      layer.appendChild(p);
    }

    // 3. Floating Balloons from bottom sways to top
    for (let i = 0; i < 24; i++) {
      const p = document.createElement('span');
      const left = Math.random() * 100;
      const delay = Math.random() * 1.6;
      const duration = 4.2 + Math.random() * 3.0;
      p.className = 'birthday-emoji-particle';
      p.textContent = '🎈';
      p.style.cssText = `
        left: ${left}vw;
        top: 105vh;
        font-size: ${32 + Math.random() * 32}px;
        --tx: ${(Math.random() - 0.5) * 200}px;
        --ty: -115vh;
        --scale: 1.0;
        --rot: ${(Math.random() - 0.5) * 45}deg;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
      `;
      layer.appendChild(p);
    }

    // 4. Floating Cakes from bottom sways to top
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('span');
      const left = Math.random() * 100;
      const delay = Math.random() * 2.0;
      const duration = 5.2 + Math.random() * 3.0;
      p.className = 'birthday-emoji-particle';
      p.textContent = '🎂';
      p.style.cssText = `
        left: ${left}vw;
        top: 105vh;
        font-size: ${28 + Math.random() * 24}px;
        --tx: ${(Math.random() - 0.5) * 160}px;
        --ty: -115vh;
        --scale: 1.0;
        --rot: ${(Math.random() - 0.5) * 80}deg;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
      `;
      layer.appendChild(p);
    }

    // 5. Elegant Glassmorphic Bubbles (🫧) rising
    for (let i = 0; i < 35; i++) {
      const bubble = document.createElement('span');
      const size = 16 + Math.random() * 36;
      bubble.className = 'birthday-bubble-particle';
      bubble.style.cssText = `
        left: ${Math.random() * 100}vw;
        top: 105vh;
        width: ${size}px;
        height: ${size}px;
        --ty: -115vh;
        animation-duration: ${3.5 + Math.random() * 2.5}s;
        animation-delay: ${Math.random() * 1.5}s;
      `;
      layer.appendChild(bubble);
    }

    // 6. Confetti falling down
    for (let i = 0; i < 40; i++) {
      const confetti = document.createElement('span');
      const left = Math.random() * 100;
      const size = 6 + Math.random() * 8;
      const delay = Math.random() * 0.8;
      const duration = 2.5 + Math.random() * 2.2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      confetti.style.cssText = `
        position: fixed;
        left: ${left}vw;
        top: -20px;
        width: ${size}px;
        height: ${size * (0.4 + Math.random() * 0.6)}px;
        background: ${color};
        opacity: ${0.7 + Math.random() * 0.3};
        border-radius: ${Math.random() > 0.5 ? '50%' : '3px'};
        transform: rotate(${Math.random() * 360}deg);
        z-index: 9998;
        pointer-events: none;
        animation: confetti-fall-anim ${duration}s linear ${delay}s forwards;
      `;
      layer.appendChild(confetti);
    }

    // 7. Interactive center glassmorphic banner popup
    const banner = document.createElement('div');
    banner.className = 'birthday-burst-banner-redesign';
    banner.innerHTML = `
      <span class="material-symbols-outlined text-[#a52d59]" style="font-size: 26px; font-variation-settings: 'FILL' 1">celebration</span>
      <div class="flex flex-col text-left">
        <span class="font-extrabold text-body-md tracking-wide text-brand-primary uppercase">${label}</span>
        <span class="text-[#a52d59] font-bold text-body-lg">🎂 Có ${count} hội viên sinh nhật! 🎉</span>
      </div>
    `;
    layer.appendChild(banner);

    // 8. Dynamic Pop on cursor click
    const self = this;
    layer.addEventListener('click', e => {
      self._createMiniBurst(e.clientX, e.clientY, layer);
    });

    window.GymApp.toast(`Đã mở tiệc sinh nhật cho ${label} 🎉`, 'success');
    
    // Auto remove layer when animation ends
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
      if (btn) { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined text-sm" style="font-variation-settings:\'FILL\' 1">send</span> Gửi lời chúc tất cả'; }
    }
  },

  _renderMonthPage: function (month) {
    const listEl = document.getElementById(`birthday-list-month-${month}`);
    const pagEl = document.getElementById(`birthday-pagination-month-${month}`);
    if (!listEl || !pagEl) return;

    const groups = this._getBirthdayGroups();
    const group = groups.find(g => g.month === month);
    if (!group) return;

    const count = group.members.length;
    this._monthPages = this._monthPages || {};
    this._monthPages[month] = this._monthPages[month] || 1;
    const page = this._monthPages[month];
    const perPage = 3;
    const totalPages = Math.ceil(count / perPage) || 1;
    const paginatedMembers = group.members.slice((page - 1) * perPage, page * perPage);

    listEl.innerHTML = paginatedMembers.map(m => `
      <!-- Member Card Chip -->
      <div class="birthday-member-chip flex items-center gap-compact bg-surface-container-low/30 border-2 border-outline-variant/50 rounded-xl p-compact hover:bg-surface-container-low transition-all">
        ${window.GymApp.avatarImg(m.avatar_url, m.ho_ten, 'sm')}
        <div class="min-w-0 flex-1 text-left">
          <p class="font-bold text-on-surface text-body-md truncate">${m.ho_ten}</p>
          <p class="text-on-surface-variant text-body-sm font-semibold mt-xxs">
            📅 ${String(m.birthDay).padStart(2, '0')}/${String(m.birthMonth).padStart(2, '0')} · <span class="text-[#a52d59] font-bold">${m.ageThisYear} tuổi</span>
          </p>
        </div>
      </div>
    `).join('');

    pagEl.innerHTML = totalPages > 1 ? `
      <div class="flex items-center justify-between pt-xs text-[11px] border-t border-outline-variant/30">
        <span class="text-on-surface-variant font-bold">Trang ${page}/${totalPages}</span>
        <div class="flex gap-1">
          <button data-month-action="prev" data-month="${group.month}" ${page === 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : 'style="cursor: pointer;"'} class="w-6 h-6 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-[#a52d59]/5 hover:text-[#a52d59] transition-all">
            <span class="material-symbols-outlined text-xs">chevron_left</span>
          </button>
          <button data-month-action="next" data-month="${group.month}" ${page === totalPages ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : 'style="cursor: pointer;"'} class="w-6 h-6 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-[#a52d59]/5 hover:text-[#a52d59] transition-all">
            <span class="material-symbols-outlined text-xs">chevron_right</span>
          </button>
        </div>
      </div>
    ` : '';
  },

  init: function () {
    const self = this;
    this._monthPages = {};

    // Card click event triggers full-screen fireworks
    document.querySelectorAll('.month-card').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('.birthday-burst-btn') || e.target.closest('.btn-wish-month') || e.target.closest('.birthday-member-chip') || e.target.closest('[data-month-action]')) return;
        
        const burstBtn = card.querySelector('.birthday-burst-btn');
        if (burstBtn) {
          self._showBirthdayBurst(burstBtn.dataset.label, burstBtn.dataset.count, e);
        }
      });
    });

    // Burst button triggers full-screen fireworks
    document.querySelectorAll('.birthday-burst-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        self._showBirthdayBurst(btn.dataset.label, btn.dataset.count, e);
      });
    });

    // Wish individual member
    document.querySelectorAll('.btn-wish-one').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        btn.disabled = true;
        await self._sendWish(btn.dataset.id, btn.dataset.name);
        btn.disabled = false;
      });
    });

    // Wish all members today
    document.getElementById('btn-wish-all')?.addEventListener('click', () => self._sendWishAll());

    // Wish all members in current month
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
        btn.innerHTML = '<span class="material-symbols-outlined text-xs" style="font-variation-settings:\'FILL\' 1">send</span> Gửi lời chúc';
      });
    });

    // Big celebrate all members event
    document.getElementById('btn-birthday-celebrate-all')?.addEventListener('click', e => {
      const totalCount = Array.isArray(window.GymApp.data.members) ? window.GymApp.data.members.length : 0;
      self._showBirthdayBurst('Tất cả sinh nhật', totalCount, e);
    });

    // Event delegation for local pagination in month cards
    document.getElementById('birthday-months-grid')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-month-action]');
      if (!btn) return;
      e.stopPropagation();
      const month = parseInt(btn.dataset.month);
      const action = btn.dataset.monthAction;
      
      const groups = self._getBirthdayGroups();
      const group = groups.find(g => g.month === month);
      const count = group ? group.members.length : 0;
      const totalPages = Math.ceil(count / 3) || 1;
      
      self._monthPages = self._monthPages || {};
      self._monthPages[month] = self._monthPages[month] || 1;
      
      if (action === 'prev' && self._monthPages[month] > 1) {
        self._monthPages[month]--;
        self._renderMonthPage(month);
      } else if (action === 'next' && self._monthPages[month] < totalPages) {
        self._monthPages[month]++;
        self._renderMonthPage(month);
      }
    });
  }
};
