window.GymApp.pages['notification-settings'] = {
  settings: [],

  render: function () {
    return `
      <div class="flex flex-col gap-lg animate-fadeIn">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-standard">
          <div class="page-title-bar">
            <h2 class="font-display-lg text-display-lg text-on-surface font-bold">Thông báo tự động</h2>
            <p class="text-on-surface-variant text-body-sm mt-xs">Bật / tắt từng loại thông báo được gửi tự động hàng ngày theo lịch cron</p>
          </div>
          <button id="btn-save-notif-settings"
            class="flex items-center gap-xs px-5 py-2.5 rounded-xl bg-brand-primary text-white font-bold text-body-md hover:shadow-lg hover:shadow-brand-primary/20 active:scale-95 transition-all">
            <span class="material-symbols-outlined text-[16px]">save</span>
            Lưu cài đặt
          </button>
        </div>

        <!-- Info banner -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-4 flex gap-3 items-start">
          <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl mt-0.5 flex-shrink-0">info</span>
          <div>
            <p class="font-bold text-blue-800 dark:text-blue-200 text-body-sm">Lịch chạy tự động</p>
            <p class="text-blue-700 dark:text-blue-300 text-body-sm mt-0.5">
              Cron <strong>08:00 sáng mỗi ngày</strong>: Sắp hết hạn gói tập, hết hạn, sinh nhật, sắp hết buổi PT, tóm tắt buổi sáng.<br/>
              Cron <strong>mỗi 5 phút</strong>: Cảnh báo PT chưa check-in trước buổi tập.
            </p>
          </div>
        </div>

        <!-- Toggle cards -->
        <div id="notif-settings-grid" class="grid grid-cols-1 md:grid-cols-2 gap-standard">
          <div class="col-span-full flex items-center justify-center py-10">
            <span class="material-symbols-outlined animate-spin text-brand-primary text-3xl">progress_activity</span>
          </div>
        </div>
      </div>
    `;
  },

  init: async function () {
    await this._loadSettings();
    this._bindSave();
  },

  _loadSettings: async function () {
    try {
      const res = await window.GymApp.api.get('/config/notification-settings');
      if (!res?.success) return;
      this.settings = res.data || [];
      this._renderGrid();
    } catch (e) {
      window.GymApp.toast('Không thể tải cài đặt thông báo', 'error');
    }
  },

  _renderGrid: function () {
    const grid = document.getElementById('notif-settings-grid');
    if (!grid) return;

    const ICONS = {
      notif_sap_het_han: 'schedule',
      notif_het_han: 'event_busy',
      notif_sinh_nhat: 'cake',
      notif_sap_het_buoi_pt: 'sports_gymnastics',
      notif_tom_tat_buoi_sang: 'summarize',
      notif_pt_chua_checkin: 'warning',
    };

    const COLORS = {
      notif_sap_het_han: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
      notif_het_han: 'text-red-500 bg-red-50 dark:bg-red-900/20',
      notif_sinh_nhat: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20',
      notif_sap_het_buoi_pt: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
      notif_tom_tat_buoi_sang: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
      notif_pt_chua_checkin: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
    };

    const SCHEDULE = {
      notif_sap_het_han: '08:00 mỗi ngày',
      notif_het_han: '08:00 mỗi ngày',
      notif_sinh_nhat: '08:00 mỗi ngày',
      notif_sap_het_buoi_pt: '08:00 mỗi ngày',
      notif_tom_tat_buoi_sang: '08:00 mỗi ngày',
      notif_pt_chua_checkin: 'Mỗi 5 phút',
    };

    grid.innerHTML = this.settings.map(s => {
      const iconClass = COLORS[s.khoa] || 'text-brand-primary bg-brand-primary/10';
      const icon = ICONS[s.khoa] || 'notifications';
      const schedule = SCHEDULE[s.khoa] || '08:00 mỗi ngày';

      return `
        <div class="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-outline-variant/50 p-md shadow-sm hover:shadow-md transition-all duration-200">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 flex-1 min-w-0">
              <div class="w-10 h-10 rounded-xl ${iconClass} flex items-center justify-center flex-shrink-0">
                <span class="material-symbols-outlined text-[20px]">${icon}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-on-surface text-body-md leading-snug">${s.nhan}</p>
                <p class="text-on-surface-variant text-body-sm mt-0.5">${s.mo_ta}</p>
                <div class="flex items-center gap-1 mt-1.5">
                  <span class="material-symbols-outlined text-[13px] text-on-surface-variant">schedule</span>
                  <span class="text-[11px] text-on-surface-variant font-medium">${schedule}</span>
                  ${s.ngay_cap_nhat ? `
                    <span class="text-[11px] text-on-surface-variant opacity-60 ml-1">
                      • Cập nhật: ${new Date(s.ngay_cap_nhat).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ` : ''}
                </div>
              </div>
            </div>

            <!-- Toggle switch -->
            <label class="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-0.5">
              <input type="checkbox" class="sr-only notif-toggle" data-key="${s.khoa}" ${s.bat ? 'checked' : ''}>
              <div class="toggle-track w-11 h-6 rounded-full transition-colors duration-200 ${s.bat ? 'bg-brand-primary' : 'bg-gray-300 dark:bg-gray-600'}"></div>
              <div class="toggle-thumb absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${s.bat ? 'translate-x-5' : 'translate-x-0'}"></div>
            </label>
          </div>

          <!-- Status badge -->
          <div class="mt-3 pt-3 border-t border-outline-variant/30 flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 rounded-full ${s.bat ? 'bg-green-500' : 'bg-gray-400'}"></div>
            <span class="text-[11px] font-semibold ${s.bat ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}">
              ${s.bat ? 'Đang bật — Thông báo sẽ được gửi tự động' : 'Đang tắt — Thông báo sẽ bị bỏ qua'}
            </span>
          </div>
        </div>
      `;
    }).join('');

    // Bind toggle interaction
    grid.querySelectorAll('.notif-toggle').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const card = e.target.closest('.bg-white, .dark\\:bg-\\[\\#1e1e1e\\]');
        const track = e.target.closest('label').querySelector('.toggle-track');
        const thumb = e.target.closest('label').querySelector('.toggle-thumb');
        const badge = card?.querySelector('.w-1\\.5.h-1\\.5');
        const statusText = card?.querySelector('[class*="text-[11px]"][class*="font-semibold"]');

        const isOn = e.target.checked;
        if (track) {
          track.classList.toggle('bg-brand-primary', isOn);
          track.classList.toggle('bg-gray-300', !isOn);
          track.classList.toggle('dark:bg-gray-600', !isOn);
        }
        if (thumb) {
          thumb.classList.toggle('translate-x-5', isOn);
          thumb.classList.toggle('translate-x-0', !isOn);
        }
        if (badge) {
          badge.classList.toggle('bg-green-500', isOn);
          badge.classList.toggle('bg-gray-400', !isOn);
        }
        if (statusText) {
          statusText.className = `text-[11px] font-semibold ${isOn ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`;
          statusText.textContent = isOn ? 'Đang bật — Thông báo sẽ được gửi tự động' : 'Đang tắt — Thông báo sẽ bị bỏ qua';
        }
      });
    });
  },

  _bindSave: function () {
    const btn = document.getElementById('btn-save-notif-settings');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const updates = {};
      document.querySelectorAll('.notif-toggle').forEach(cb => {
        updates[cb.dataset.key] = cb.checked;
      });

      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Đang lưu...';

      try {
        const res = await window.GymApp.api.put('/config/notification-settings', updates);
        if (res?.success) {
          window.GymApp.toast('Đã lưu cài đặt thông báo tự động', 'success');
          await this._loadSettings();
        } else {
          window.GymApp.toast(res?.message || 'Lỗi khi lưu cài đặt', 'error');
        }
      } catch (e) {
        window.GymApp.toast('Lỗi kết nối máy chủ', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">save</span> Lưu cài đặt';
      }
    });
  },
};
