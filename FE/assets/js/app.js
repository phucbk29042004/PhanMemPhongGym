(function () {
  const PAGE_TITLES = {
    'dashboard': 'Tổng quan', 'members-list': 'Danh sách hội viên',
    'member-add': 'Thêm mới hội viên', 'checkin': 'Vào - Ra',
    'expired': 'Danh sách hết hạn', 'pt-training': 'Lịch đào tạo PT',
    'pt-register': 'Đăng ký lịch tập PT', 'packages': 'Danh sách gói tập',
    'birthday': 'Sinh nhật hội viên', 'gym-rules': 'Nội quy phòng tập',
    'revenue': 'Doanh thu',
  };
  const SUB_PAGES = ['members-list', 'member-add', 'checkin', 'expired', 'pt-training', 'pt-register', 'packages', 'birthday', 'revenue'];

  // ===== NAVIGATE =====
  window.GymApp.navigate = function (pageName) {
    const page = window.GymApp.pages[pageName];
    if (!page) return;

    // Dọn dẹp trang hiện tại (chart, timer, v.v.)
    const currentPage = window.GymApp.pages[window.GymApp.currentPage];
    if (currentPage?.destroy) currentPage.destroy();

    if (window.GymApp._activeChart) {
      window.GymApp._activeChart.destroy();
      window.GymApp._activeChart = null;
    }

    // Render content
    document.getElementById('content-area').innerHTML = page.render();

    // Initialize datepickers
    if (window.GymApp.initDatePickers) {
      window.GymApp.initDatePickers(document.getElementById('content-area'));
    }

    // Update nav active state
    document.querySelectorAll('#sidebar [data-page]').forEach(btn => {
      btn.classList.remove('nav-active', 'text-brand-primary', 'font-bold', 'bg-[#e7f5e9]');
      btn.style.background = '';
      btn.style.color = '#166534';
      if (btn.dataset.page === pageName) {
        btn.classList.add('nav-active', 'font-bold');
        btn.style.background = '#1D9336';
        btn.style.color = '#ffffff';
      }
    });

    // Auto-open accordion for sub-pages
    if (SUB_PAGES.includes(pageName)) _openAccordion('hoi-vien');

    // Update breadcrumb
    const breadcrumbCurrent = document.getElementById('breadcrumb-current-page');
    if (breadcrumbCurrent) {
      if (SUB_PAGES.includes(pageName)) {
        breadcrumbCurrent.innerHTML = `<span class="text-on-surface-variant font-medium">Quản lý</span> <span class="material-symbols-outlined text-[16px] text-outline-variant align-middle mx-0.5">chevron_right</span> <span class="text-on-surface font-bold">${PAGE_TITLES[pageName] || 'Trang'}</span>`;
      } else {
        breadcrumbCurrent.textContent = PAGE_TITLES[pageName] || 'Trang';
      }
    }

    window.GymApp.currentPage = pageName;

    // Birthday: render page immediately, then auto-run celebration effect.
    if (pageName === 'birthday') {
      if (page.init) setTimeout(() => page.init(), 50);
      setTimeout(() => window.GymApp.showBirthdayEffect(), 120);
      return;
    }

    if (page.init) setTimeout(() => page.init(), 50);
  };

  // ===== ACCORDION =====
  function _openAccordion(id) {
    const content = document.getElementById('accordion-' + id);
    const trigger = document.querySelector('[data-accordion="' + id + '"]');
    if (!content || !trigger) return;
    content.style.maxHeight = content.scrollHeight + 400 + 'px';
    const arrow = trigger.querySelector('.arrow-icon');
    if (arrow) arrow.style.transform = 'rotate(90deg)';
    trigger.classList.add('text-brand-primary');
    trigger.classList.remove('text-on-surface-variant');
  }

  function _toggleAccordion(id) {
    const content = document.getElementById('accordion-' + id);
    const trigger = document.querySelector('[data-accordion="' + id + '"]');
    if (!content || !trigger) return;

    // Kiểm tra trạng thái thực tế dựa trên maxHeight
    const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';

    if (isOpen) {
      content.style.maxHeight = '0px';
      const arrow = trigger.querySelector('.arrow-icon');
      if (arrow) arrow.style.transform = 'rotate(0deg)';
      trigger.classList.remove('text-brand-primary');
      trigger.classList.add('text-on-surface-variant');
    } else {
      // Tính toán chiều cao thực tế của nội dung bên trong
      content.style.maxHeight = (content.scrollHeight + 50) + 'px';
      const arrow = trigger.querySelector('.arrow-icon');
      if (arrow) arrow.style.transform = 'rotate(90deg)';
      trigger.classList.add('text-brand-primary');
      trigger.classList.remove('text-on-surface-variant');
    }
  }

  // ===== SIDEBAR TOGGLE =====
  function _toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      sidebar.classList.toggle('mobile-open');
      let overlay = document.getElementById('sidebar-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', () => {
          sidebar.classList.remove('mobile-open');
          overlay.style.display = 'none';
        });
      }
      overlay.style.display = sidebar.classList.contains('mobile-open') ? 'block' : 'none';
    } else {
      sidebar.classList.toggle('sidebar-collapsed');
    }
  }

  // Đóng sidebar khi resize lên desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      sidebar?.classList.remove('mobile-open');
      if (overlay) overlay.style.display = 'none';
    }
  });

  // ===== BIRTHDAY EFFECT =====
  window.GymApp.showBirthdayEffect = function (callback) {
    document.getElementById('birthday-auto-effect-layer')?.remove();

    const today = new Date();
    const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const count = (window.GymApp.data.members || []).filter(m => {
      if (!m.ngay_sinh) return false;
      const p = m.ngay_sinh.split('-'); return `${p[1]}-${p[2]}` === todayMD;
    }).length;

    const colors = ['#1D9336', '#a52d59', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];

    const layer = document.createElement('div');
    layer.id = 'birthday-auto-effect-layer';
    layer.style.cssText = 'position:fixed;inset:0;z-index:9997;pointer-events:none;overflow:hidden;';
    document.body.appendChild(layer);

    for (let i = 0; i < 140; i++) {
      const el = document.createElement('div');
      const size = Math.random() * 10 + 6;
      const dur = Math.random() * 2.5 + 2;
      const delay = Math.random() * 1.5;
      el.className = 'confetti-piece';
      el.style.cssText = `left:${Math.random() * 100}vw;top:-20px;width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random() * colors.length)]};border-radius:${Math.random() > 0.5 ? '50%' : '3px'};animation-duration:${dur}s,${dur * 0.6}s;animation-delay:${delay}s,${delay}s;`;
      layer.appendChild(el);
    }

    for (let i = 0; i < 60; i++) {
      const bubble = document.createElement('span');
      const size = 18 + Math.random() * 54;
      bubble.className = 'birthday-bubble';
      bubble.style.cssText = `
        left:${Math.random() * 100}vw;bottom:-80px;width:${size}px;height:${size}px;
        border-color:${colors[Math.floor(Math.random() * colors.length)]};
        animation-duration:${3 + Math.random() * 3}s;
        animation-delay:${Math.random() * 0.7}s;
      `;
      layer.appendChild(bubble);
    }

    for (let burst = 0; burst < 4; burst++) {
      const x = window.innerWidth * (0.18 + Math.random() * 0.64);
      const y = window.innerHeight * (0.18 + Math.random() * 0.42);
      for (let i = 0; i < 28; i++) {
        const spark = document.createElement('span');
        const angle = Math.random() * Math.PI * 2;
        const distance = 70 + Math.random() * 190;
        const size = 4 + Math.random() * 8;
        spark.className = 'birthday-firework-spark';
        spark.style.cssText = `
          left:${x}px;top:${y}px;width:${size}px;height:${size}px;
          background:${colors[Math.floor(Math.random() * colors.length)]};
          --tx:${Math.cos(angle) * distance}px;--ty:${Math.sin(angle) * distance}px;
          animation-delay:${burst * 0.28 + Math.random() * 0.12}s;
        `;
        layer.appendChild(spark);
      }
    }

    const banner = document.createElement('div');
    banner.className = 'birthday-burst-banner';
    banner.innerHTML = `
      <span class="material-symbols-outlined">celebration</span>
      <strong>Không khí sinh nhật</strong>
      <span>${count > 0 ? `${count} hội viên sinh nhật hôm nay` : 'Lịch sinh nhật đã sẵn sàng'}</span>
    `;
    layer.appendChild(banner);

    setTimeout(() => layer.remove(), 6200);
    if (callback) callback();
  };

  // ===== MODAL =====
  window.GymApp.showModal = function (htmlContent) {
    document.getElementById('gym-modal')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'gym-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);backdrop-filter:blur(3px);padding:20px;';
    overlay.innerHTML = `
      <div class="modal-card" style="background:#f7f9ff;border-radius:16px;max-width:640px;width:100%;max-height:90vh;overflow-y:auto;position:relative;box-shadow:0 25px 60px rgba(0,0,0,0.25);">
        <button id="close-modal" style="position:absolute;top:12px;right:12px;background:transparent;border:none;cursor:pointer;z-index:1;" title="Đóng">
          <span class="material-symbols-outlined" style="color:#6e7a6b;font-size:22px;">close</span>
        </button>
        ${htmlContent}
      </div>`;
    document.body.appendChild(overlay);

    if (window.GymApp.initDatePickers) {
      window.GymApp.initDatePickers(overlay);
    }

    const close = () => overlay.remove();
    document.getElementById('close-modal').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    const escHandler = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);
  };

  // ===== CONFIRM MODAL =====
  window.GymApp.confirm = function (message, title = 'Xác nhận') {
    return new Promise((resolve) => {
      const html = `
        <div class="p-loose">
          <div class="flex items-center gap-standard mb-standard">
            <div class="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-brand-primary text-3xl">help_outline</span>
            </div>
            <h3 class="text-headline-sm font-black text-on-surface tracking-tight">${title}</h3>
          </div>
          <p class="text-body-md text-on-surface-variant mb-loose leading-relaxed font-medium">${message}</p>
          <div class="flex justify-end gap-standard mt-loose">
            <button id="confirm-cancel" class="px-loose py-compact rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-all">Hủy bỏ</button>
            <button id="confirm-ok" class="px-loose py-compact rounded-xl font-bold bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-all">Đồng ý</button>
          </div>
        </div>
      `;
      window.GymApp.showModal(html);

      const modal = document.getElementById('gym-modal');
      const close = (val) => {
        modal?.remove();
        resolve(val);
      };

      document.getElementById('confirm-cancel')?.addEventListener('click', () => close(false));
      document.getElementById('confirm-ok')?.addEventListener('click', () => close(true));

      // Ghi đè nút X của modal để trả về false
      const closeBtn = document.getElementById('close-modal');
      if (closeBtn) {
        const newBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newBtn, closeBtn);
        newBtn.addEventListener('click', () => close(false));
      }
    });
  };

  window.GymApp.avatarImg = function (avatarUrl, name, size = 'md', extraStyle = '') {
    const dim = size === 'sm' ? 32 : size === 'lg' ? 48 : 36;
    const defaultStyle = `width:${dim}px;height:${dim}px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid #becab9;`;
    const finalStyle = extraStyle ? `${defaultStyle}${extraStyle}` : defaultStyle;

    if (avatarUrl) {
      // Add timestamp to avatar URL to bypass browser cache
      const cacheBuster = avatarUrl.includes('?') ? `&t=${Date.now()}` : `?t=${Date.now()}`;
      return `<img src="${avatarUrl}${cacheBuster}" alt="${name}" style="${finalStyle}" loading="lazy">`;
    }
    return window.GymApp.avatarInitials(name, size, extraStyle);
  };

  // ===== UTILITIES =====
  window.GymApp.toast = function (message, type = 'success') {
    const colors = { success: 'background:#1D9336', error: 'background:#ba1a1a', info: 'background:#575f67', warning: 'background:#e65100' };
    const icons = { success: 'check_circle', error: 'error', info: 'info', warning: 'warning' };
    const el = document.createElement('div');
    el.className = 'gym-toast';
    el.style.cssText = `position:fixed;bottom:20px;right:20px;z-index:9997;${colors[type]};color:#fff;padding:10px 20px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-size:14px;display:flex;align-items:center;gap:8px;font-weight:500;`;
    el.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px">${icons[type]}</span>${message}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  window.GymApp.formatCurrency = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  window.GymApp.formatDate = d => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  window.GymApp.localeVi = {
    days: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'],
    daysShort: ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'],
    daysMin: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    months: ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'],
    monthsShort: ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'],
    today: 'Hôm nay',
    clear: 'Xóa',
    dateFormat: 'yyyy-MM-dd',
    firstDay: 1
  };

  // Air-datepicker Initializer (với cơ chế altInput ngầm đồng bộ hoàn hảo)
  window.GymApp.initDatePickers = function (container) {
    if (typeof AirDatepicker !== 'undefined') {
      const inputs = container.querySelectorAll('input[type="date"]:not([data-airpicker])');
      inputs.forEach(originalInput => {
        originalInput.setAttribute('data-airpicker', 'true');
        const originalStyle = originalInput.style.cssText;
        originalInput.style.display = 'none';

        const visibleInput = document.createElement('input');
        visibleInput.type = 'text';
        visibleInput.className = originalInput.className;
        visibleInput.style.cssText = originalStyle;
        visibleInput.placeholder = 'dd/mm/yyyy';
        originalInput.parentNode.insertBefore(visibleInput, originalInput);

        const baseDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        let currentPos = 'bottom left';

        const adp = new AirDatepicker(visibleInput, {
          locale: window.GymApp.localeVi,
          dateFormat: 'dd/MM/yyyy',
          autoClose: true,
          container: document.body,
          position: 'bottom left',
          navTitles: {
            days: function (dp) {
              const month = dp.locale.months[dp.viewDate.getMonth()].toLowerCase();
              const year = dp.viewDate.getFullYear();
              return `${month} ${year}`;
            }
          },
          onShow: function (isFinished) {
            if (isFinished) return;
            const rect = visibleInput.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const calendarHeight = 350; // Chiều cao an toàn của calendar
            
            // Quyết định vị trí tối ưu: chỉ chọn 'top left' nếu ở dưới không đủ và ở trên đủ chứa calendar
            const desiredPos = (spaceBelow < calendarHeight && rect.top > calendarHeight) ? 'top left' : 'bottom left';
            
            if (currentPos !== desiredPos) {
              currentPos = desiredPos;
              adp.update({ position: desiredPos });
            }

            // Xử lý chống tràn màn hình tuyệt đối trong mọi trường hợp (Viewport Collision Adjustment)
            setTimeout(() => {
              if (adp.$datepicker) {
                const dpRect = adp.$datepicker.getBoundingClientRect();
                
                // 1. Chống tràn mép trên (Top boundary collision)
                if (dpRect.top < 10) {
                  const currentTop = parseFloat(adp.$datepicker.style.top) || 0;
                  adp.$datepicker.style.top = `${currentTop + (10 - dpRect.top)}px`;
                }
                
                // 2. Chống tràn mép dưới (Bottom boundary collision)
                const overflowBottom = dpRect.bottom - (window.innerHeight - 10);
                if (overflowBottom > 0) {
                  const currentTop = parseFloat(adp.$datepicker.style.top) || 0;
                  // Chỉ kéo lên nếu không làm tràn mép trên (y >= 10)
                  const targetViewTop = dpRect.top - overflowBottom;
                  if (targetViewTop >= 10) {
                    adp.$datepicker.style.top = `${currentTop - overflowBottom}px`;
                  } else {
                    // Nếu kéo lên hết cỡ vẫn tràn cả 2 bên thì ưu tiên giữ lại thanh navigation ở trên cùng
                    adp.$datepicker.style.top = `${currentTop + (10 - dpRect.top)}px`;
                  }
                }
                
                // 3. Chống tràn mép trái/phải
                const spaceRight = window.innerWidth - dpRect.right;
                if (dpRect.left < 10) {
                  const currentLeft = parseFloat(adp.$datepicker.style.left) || 0;
                  adp.$datepicker.style.left = `${currentLeft + (10 - dpRect.left)}px`;
                } else if (spaceRight < 10) {
                  const currentLeft = parseFloat(adp.$datepicker.style.left) || 0;
                  adp.$datepicker.style.left = `${currentLeft - (10 - spaceRight)}px`;
                }
              }
            }, 50); // Trì hoãn nhẹ 50ms để layout được render hoàn tất
          },
          onSelect: function ({ date }) {
            if (date && !Array.isArray(date)) {
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, '0');
              const d = String(date.getDate()).padStart(2, '0');
              baseDescriptor.set.call(originalInput, `${y}-${m}-${d}`);
              originalInput.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
              baseDescriptor.set.call(originalInput, '');
              originalInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        });

        // Định nghĩa custom setter/getter để đồng bộ ngược nếu code JS gán originalInput.value
        Object.defineProperty(originalInput, 'value', {
          get: function () {
            return baseDescriptor.get.call(originalInput);
          },
          set: function (val) {
            baseDescriptor.set.call(originalInput, val);
            if (val) {
              const cleanVal = val.substring(0, 10);
              const parts = cleanVal.split('-');
              if (parts.length === 3) {
                const y = parseInt(parts[0]);
                const m = parseInt(parts[1]);
                const d = parseInt(parts[2]);
                if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                  adp.selectDate(new Date(y, m - 1, d), { silent: true });
                }
              }
            } else { adp.clear({ silent: true }); }
          }
        });

        // Tự động prefill dữ liệu ban đầu
        const initialVal = baseDescriptor.get.call(originalInput);
        if (initialVal) {
          const cleanVal = initialVal.substring(0, 10);
          const parts = cleanVal.split('-');
          if (parts.length === 3) {
            const y = parseInt(parts[0]);
            const m = parseInt(parts[1]);
            const d = parseInt(parts[2]);
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
              adp.selectDate(new Date(y, m - 1, d), { silent: true });
            }
          }
        }
      });
    }
  };

  window.GymApp.formatEnumLabel = function (value) {
    const map = {
      con_han: 'Còn hạn',
      sap_het_han: 'Sắp hết hạn',
      het_han: 'Hết hạn',
      chua_dang_ky: 'Chưa đăng ký',
      dang_hoat_dong: 'Đang hoạt động',
      hoat_dong: 'Hoạt động',
      dang_ban: 'Đang bán',
      dang_tap: 'Đang tập',
      da_ket_thuc: 'Đã kết thúc',
      cho_kich_hoat: 'Chờ kích hoạt',
      cho_duyet: 'Chờ duyệt',
      huy: 'Đã hủy',
      cho_tap: 'Chờ tập',
      da_tap: 'Đã tập',
      da_xac_nhan: 'Đã xác nhận',
      da_huy: 'Đã hủy',
      hoan_tac: 'Hoàn tác',
      vang: 'Vắng',
      vao: 'Vào',
      ra: 'Ra',
      ca_nhan: 'Cá nhân',
      nhom: 'Nhóm',
      hoi_vien: 'Hội viên',
      pt: 'Huấn luyện viên',
      le_tan: 'Lễ tân',
      nhan_vien: 'Nhân viên',
      admin: 'Quản trị viên',
      thuong: 'Thường',
      Normal: 'Thường',
      Student: 'Sinh viên',
      vip: 'VIP',
      premium: 'Premium',
      the_tu: 'Thẻ từ',
      qr_code: 'QR Code',
      khuon_mat: 'Khuôn mặt',
      thu_cong: 'Thủ công',
      tien_mat: 'Tiền mặt',
      chuyen_khoan: 'Chuyển khoản',
      the: 'Thẻ',
      vi_dien_tu: 'Ví điện tử',
      paid: 'Đã thanh toán',
      debt: 'Còn nợ',
      free: 'Miễn phí',
      active: 'Hoạt động',
      inactive: 'Không hoạt động',
      expired: 'Hết hạn',
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
    };
    if (!value) return '—';
    return map[value] || String(value).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  window.GymApp.statusBadge = function (status) {
    const map = {
      // Trạng thái hội viên (từ BE)
      con_han: { cls: 'background:#e7f5e9;color:#1D9336', label: 'Còn hạn' },
      sap_het_han: { cls: 'background:#fff8e1;color:#f57f17', label: 'Sắp hết hạn' },
      het_han: { cls: 'background:#ffdad6;color:#ba1a1a', label: 'Hết hạn' },
      chua_dang_ky: { cls: 'background:#e0e3e8;color:#3f4a3c', label: 'Chưa ĐK' },
      // Trạng thái lịch tập PT
      cho_tap: { cls: 'background:#e8def8;color:#6750a4', label: 'Chờ tập' },
      da_tap: { cls: 'background:#e7f5e9;color:#1D9336', label: 'Đã tập' },
      da_xac_nhan: { cls: 'background:#e7f5e9;color:#1D9336', label: 'Đã XN' },
      da_huy: { cls: 'background:#ffdad6;color:#ba1a1a', label: 'Đã hủy' },
      hoan_tac: { cls: 'background:#fff8e1;color:#f57f17', label: 'Hoàn tác' },
      vang: { cls: 'background:#f3e5f5;color:#6a1b9a', label: 'Vắng' },
      // Trạng thái gói tập
      dang_hoat_dong: { cls: 'background:#e7f5e9;color:#1D9336',  label: 'Đang dùng' },
      hoat_dong:      { cls: 'background:#e7f5e9;color:#1D9336',  label: 'Hoạt động' },
      dang_ban:       { cls: 'background:#e7f5e9;color:#1D9336',  label: 'Đang bán' },
      cho_kich_hoat:  { cls: 'background:#fff3e0;color:#e65100',  label: 'Chờ kích hoạt' },
      da_ket_thuc:    { cls: 'background:#e0e3e8;color:#3f4a3c',  label: 'Kết thúc' },
      // Alias legacy
      active: { cls: 'background:#e7f5e9;color:#1D9336', label: 'Hoạt động' },
      inactive: { cls: 'background:#e0e3e8;color:#3f4a3c', label: 'Không HĐ' },
      expired: { cls: 'background:#ffdad6;color:#ba1a1a', label: 'Hết hạn' },
      pending: { cls: 'background:#fff3e0;color:#e65100', label: 'Chờ XN' },
      confirmed: { cls: 'background:#e7f5e9;color:#1D9336', label: 'Đã XN' },
      vao: { cls: 'background:#e7f5e9;color:#1D9336', label: 'Vào' },
      ra: { cls: 'background:#e0e3e8;color:#3f4a3c', label: 'Ra' },
    };
    const s = map[status] || { cls: 'background:#ebeef3;color:#181c20', label: window.GymApp.formatEnumLabel(status) };
    return `<span style="padding:2px 8px;border-radius:999px;font-size:9.6px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;${s.cls}">${s.label}</span>`;
  };

  window.GymApp.avatarInitials = function (name, size = 'md', extraStyle = '') {
    const parts = (name || '').trim().split(' ');
    const initials = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : (name || '??').slice(0, 2).toUpperCase();
    const bgColors = ['#006b20', '#a52d59', '#575f67', '#03872c', '#005317', '#1D9336'];
    const bg = bgColors[((name || '').charCodeAt(0) || 0) % bgColors.length];
    const dim = size === 'sm' ? 32 : size === 'lg' ? 48 : 36;
    const fs = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;
    const defaultStyle = `width:${dim}px;height:${dim}px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${fs}px;flex-shrink:0;`;
    const finalStyle = extraStyle ? `${defaultStyle}${extraStyle}` : defaultStyle;
    return `<div style="${finalStyle}">${initials}</div>`;
  };

  // Phân trang helper
  window.GymApp.renderPagination = function (page, total, perPage, onPageChange) {
    const totalPages = Math.ceil(total / perPage);
    if (totalPages <= 1) return '';
    const start = (page - 1) * perPage + 1;
    const end = Math.min(page * perPage, total);
    const pages = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pages.push(i);

    return `
      <div class="flex items-center justify-between px-loose py-standard bg-surface-container-low border-t border-outline-variant">
        <span style="font-size:12px;color:#3f4a3c;">Hiển thị ${start}–${end} / ${total}</span>
        <div style="display:flex;gap:4px;align-items:center;">
          <button data-pg="${page - 1}" ${page === 1 ? 'disabled' : ''} style="padding:4px 6px;border:1px solid #becab9;border-radius:4px;cursor:${page === 1 ? 'not-allowed' : 'pointer'};opacity:${page === 1 ? '0.4' : '1'};background:#fff;">
            <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;">chevron_left</span>
          </button>
          ${pages.map(p => `<button data-pg="${p}" style="width:28px;height:28px;border-radius:4px;border:${p === page ? 'none' : '1px solid #becab9'};background:${p === page ? '#1D9336' : '#fff'};color:${p === page ? '#fff' : '#181c20'};font-weight:${p === page ? '700' : '400'};font-size:12px;cursor:pointer;">${p}</button>`).join('')}
          <button data-pg="${page + 1}" ${page >= totalPages ? 'disabled' : ''} style="padding:4px 6px;border:1px solid #becab9;border-radius:4px;cursor:${page >= totalPages ? 'not-allowed' : 'pointer'};opacity:${page >= totalPages ? '0.4' : '1'};background:#fff;">
            <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;">chevron_right</span>
          </button>
        </div>
      </div>
    `;
  };

  // ===== THEME =====
  function _applySidebarDarkMode(isDark) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const navColor = isDark ? 'rgba(255,255,255,0.75)' : '#166534';
    const hoverBg = isDark ? 'rgba(255,255,255,0.12)' : '#bbf7d0';
    const hoverColor = isDark ? '#ffffff' : '#14532d';

    sidebar.querySelectorAll('.nav-item, .accordion-trigger, .sub-nav-item').forEach(btn => {
      if (!btn.classList.contains('nav-active')) btn.style.color = navColor;
      btn.onmouseover = () => {
        if (!btn.classList.contains('nav-active')) {
          btn.style.background = hoverBg;
          btn.style.color = hoverColor;
        }
      };
      btn.onmouseout = () => {
        if (!btn.classList.contains('nav-active')) {
          btn.style.background = '';
          btn.style.color = navColor;
        }
      };
    });

    // Toggle button
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.style.color = isDark ? 'rgba(255,255,255,0.75)' : '#166534';
      toggleBtn.onmouseover = () => { toggleBtn.style.background = hoverBg; };
      toggleBtn.onmouseout = () => { toggleBtn.style.background = ''; };
    }
  }

  function _applyTheme(t) {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('gym-theme', t);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = t === 'dark' ? 'light_mode' : 'dark_mode';

    _applySidebarDarkMode(t === 'dark');

    // Re-render dashboard charts if active
    if (window.GymApp.currentPage === 'dashboard') {
      const db = window.GymApp.pages['dashboard'];
      if (db && db.init) db.init();
    }
  }

  // ===== DATA SYNC =====
  window.GymApp.fetchInitialData = async function () {
    try {
      const [membersRes, ptsRes, packagesRes, dashboardRes, ptPackagesRes] = await Promise.all([
        window.GymApp.api.get('/members?limit=100'),
        window.GymApp.api.get('/trainers'),
        window.GymApp.api.get('/packages'),
        window.GymApp.api.get('/revenue/dashboard'),
        window.GymApp.api.get('/packages/pt')
      ]);

      if (membersRes?.success) {
        // Backend trả về { data: [...], pagination: {...} } cho members
        window.GymApp.data.members = Array.isArray(membersRes.data) ? membersRes.data : (membersRes.data.data || []);
      }
      if (ptsRes?.success) {
        window.GymApp.data.pts = Array.isArray(ptsRes.data) ? ptsRes.data : (ptsRes.data.data || []);
      }
      if (packagesRes?.success) {
        window.GymApp.data.packages = Array.isArray(packagesRes.data) ? packagesRes.data : (packagesRes.data.data || []);
      }
      if (ptPackagesRes?.success) {
        window.GymApp.data.ptPackages = Array.isArray(ptPackagesRes.data) ? ptPackagesRes.data : (ptPackagesRes.data.data || []);
      }
      if (dashboardRes?.success) window.GymApp.data.stats = dashboardRes.data;

      // Cập nhật badge yêu cầu gia hạn
      try {
        const pkgReqRes = await window.GymApp.api.get('/members/package-requests');
        if (pkgReqRes?.success) {
          const count = (pkgReqRes.data || []).length;
          const badge = document.getElementById('pkg-req-badge');
          if (badge) { badge.textContent = count > 9 ? '9+' : count; badge.style.display = count > 0 ? 'flex' : 'none'; }
        }
      } catch (_) { }

      console.log('Global Data Synced with SQL');
    } catch (err) {
      console.error('Failed to sync global data', err);
    }
  };

  // ===== DOM READY =====
  document.addEventListener('DOMContentLoaded', async function () {
    console.log('Paradise GYM: DOMContentLoaded');

    // 1. Kiểm tra xác thực (Auth)
    try {
      const isAuthenticated = await window.GymApp.auth.init();
      if (!isAuthenticated) return;
    } catch (e) {
      console.error('Auth check failed:', e);
      // Nếu auth.js chưa load kịp hoặc bị lỗi, cho phép chạy tiếp nhưng báo lỗi
    }

    // 2. Đồng bộ dữ liệu SQL
    try {
      await window.GymApp.fetchInitialData();
    } catch (e) {
      console.error('Initial data fetch failed:', e);
    }

    // 3. Áp dụng Theme
    _applyTheme(localStorage.getItem('gym-theme') || 'light');
    // Sidebar dark-mode handlers cần DOM sẵn
    setTimeout(() => _applySidebarDarkMode(document.documentElement.classList.contains('dark')), 0);

    // Khởi tạo Flatpickr cho toàn trang và auto-init
    if (window.GymApp.initDatePickers) {
      window.GymApp.initDatePickers(document.body);
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) { // ELEMENT_NODE
                if (node.tagName === 'INPUT' && node.type === 'date') {
                  window.GymApp.initDatePickers(node.parentElement);
                } else if (node.querySelectorAll) {
                  window.GymApp.initDatePickers(node);
                }
              }
            });
          }
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // 4. Các sự kiện cố định
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      _applyTheme(isDark ? 'light' : 'dark');
    });

    document.getElementById('btn-qr-scan')?.addEventListener('click', () => {
      window._openQrModal?.();
    });

    const logoutBtns = document.querySelectorAll('button[title="Đăng xuất"], #btn-admin-logout');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn đăng xuất?')) window.GymApp.auth.logout();
      });
    });

    // Profile Modal
    let _adminAvatarFile = null;
    document.getElementById('btn-admin-profile')?.addEventListener('click', () => {
      document.getElementById('modal-admin-profile').style.display = 'flex';
      const u = window.GymApp.auth.user;
      if (u) {
        document.getElementById('profile-ho-ten').value = u.ho_ten || u.ten_dang_nhap || '';
        document.getElementById('profile-so-dien-thoai').value = u.so_dien_thoai || '';
        document.getElementById('profile-email').value = u.email || '';
        if (u.avatar_url && window.GymApp.avatarImg) {
          document.getElementById('admin-profile-avatar-preview').innerHTML = window.GymApp.avatarImg(u.avatar_url, u.ho_ten, 'lg', 'width:100%;height:100%;');
        } else {
          document.getElementById('admin-profile-avatar-preview').innerHTML = window.GymApp.avatarInitials(u.ho_ten || u.ten_dang_nhap, 'lg', 'width:100%;height:100%;font-size:32px;');
        }
      }
      _adminAvatarFile = null;
      const fileInput = document.getElementById('admin-profile-avatar-input');
      if (fileInput) fileInput.value = '';
    });

    document.getElementById('admin-profile-avatar-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        return window.GymApp.toast('Ảnh vượt quá 5MB!', 'error');
      }
      _adminAvatarFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById('admin-profile-avatar-preview').innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;" />`;
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('btn-close-profile')?.addEventListener('click', () => {
      document.getElementById('modal-admin-profile').style.display = 'none';
      _adminAvatarFile = null;
    });

    document.getElementById('btn-save-profile')?.addEventListener('click', async () => {
      const data = {
        ho_ten: document.getElementById('profile-ho-ten').value.trim(),
        so_dien_thoai: document.getElementById('profile-so-dien-thoai').value.trim(),
        email: document.getElementById('profile-email').value.trim()
      };
      if (!data.ho_ten) return window.GymApp.toast('Họ tên không được để trống!', 'error');

      const btn = document.getElementById('btn-save-profile');
      btn.innerHTML = '<span class="material-symbols-outlined animate-spin" style="font-size:16px;">autorenew</span> Đang lưu...';
      btn.disabled = true;

      try {
        // Upload ảnh trước nếu có
        if (_adminAvatarFile) {
          const fd = new FormData();
          fd.append('avatar', _adminAvatarFile);
          const uploadRes = await window.GymApp.api.upload('/auth/me/avatar', fd);
          if (uploadRes && uploadRes.success && uploadRes.data?.avatar_url) {
            window.GymApp.auth.user.avatar_url = uploadRes.data.avatar_url;
          }
        }

        const res = await window.GymApp.api.put('/auth/me', data);
        if (res?.success) {
          window.GymApp.toast('Cập nhật thông tin thành công!', 'success');
          document.getElementById('modal-admin-profile').style.display = 'none';

          window.GymApp.auth.user.ho_ten = data.ho_ten;
          window.GymApp.auth.user.so_dien_thoai = data.so_dien_thoai;
          window.GymApp.auth.user.email = data.email;
          window.GymApp.auth.updateUI();
          _adminAvatarFile = null;
        }
      } catch (err) {
        window.GymApp.toast('Lỗi cập nhật: ' + (err.message || ''), 'error');
      } finally {
        btn.innerHTML = 'Lưu thay đổi';
        btn.disabled = false;
      }
    });

    // Change Password Modal
    document.getElementById('btn-admin-change-password')?.addEventListener('click', () => {
      document.getElementById('modal-admin-change-password').style.display = 'flex';
      document.getElementById('pwd-old').value = '';
      document.getElementById('pwd-new').value = '';
      document.getElementById('pwd-confirm').value = '';
    });
    document.getElementById('btn-close-password')?.addEventListener('click', () => {
      document.getElementById('modal-admin-change-password').style.display = 'none';
    });
    document.getElementById('btn-save-password')?.addEventListener('click', async () => {
      const pwdOld = document.getElementById('pwd-old').value;
      const pwdNew = document.getElementById('pwd-new').value;
      const pwdConfirm = document.getElementById('pwd-confirm').value;
      if (!pwdOld || !pwdNew || !pwdConfirm) return window.GymApp.toast('Vui lòng nhập đầy đủ thông tin!', 'error');
      if (pwdNew.length < 6) return window.GymApp.toast('Mật khẩu mới phải có ít nhất 6 ký tự!', 'error');
      if (pwdNew !== pwdConfirm) return window.GymApp.toast('Mật khẩu xác nhận không khớp!', 'error');
      try {
        const res = await window.GymApp.api.post('/auth/doi-mat-khau', { mat_khau_cu: pwdOld, mat_khau_moi: pwdNew });
        if (res?.success) {
          window.GymApp.toast('Đổi mật khẩu thành công!', 'success');
          document.getElementById('modal-admin-change-password').style.display = 'none';
        }
      } catch (err) {
        window.GymApp.toast(err.message || 'Lỗi đổi mật khẩu', 'error');
      }
    });

    // 5. Click delegation (Cực kỳ quan trọng)
    document.addEventListener('click', function (e) {
      // Sidebar Toggle
      const sidebarToggle = e.target.closest('#sidebar-toggle');
      if (sidebarToggle) {
        _toggleSidebar();
        return;
      }

      // Accordion
      const accBtn = e.target.closest('[data-accordion]');
      if (accBtn) {
        e.preventDefault();
        _toggleAccordion(accBtn.dataset.accordion);
        return;
      }

      // Navigate
      const navBtn = e.target.closest('[data-page]');
      if (navBtn) {
        const page = navBtn.dataset.page;
        if (page) {
          // Xử lý đóng sidebar trên mobile sau khi click
          if (window.innerWidth < 1024) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.classList.contains('-translate-x-full')) _toggleSidebar();
          }

          window.GymApp.navigate(page);
          return;
        }
      }

      // Pagination
      const pgBtn = e.target.closest('[data-pg]');
      if (pgBtn && !pgBtn.disabled) {
        const pg = parseInt(pgBtn.dataset.pg);
        if (window.GymApp._pgHandler && pg > 0) window.GymApp._pgHandler(pg);
      }
    });

    // 6. Điều hướng mặc định
    console.log('Paradise GYM: Ready');
    window.GymApp.navigate('dashboard');
  });


  // ===== QR SCAN MODAL =====
  (function () {
    let _scanner = null;
    let _isScanning = false;
    let _lastScanned = '';
    let _lastScannedTime = 0;

    function _openQrModal() {
      const modal = document.getElementById('modal-qr-scan');
      if (!modal) return;
      // Reset kết quả cũ mỗi lần mở
      document.getElementById('qr-modal-result').innerHTML = '';
      document.getElementById('qr-modal-manual-token').value = '';
      modal.style.display = 'flex';
    }

    function _closeQrModal() {
      _stopScanner();
      const modal = document.getElementById('modal-qr-scan');
      if (modal) modal.style.display = 'none';
    }

    function _startScanner() {
      if (_isScanning) return;
      _scanner = new Html5Qrcode('qr-modal-reader');
      _scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => _handleScan(decodedText),
        () => { }
      ).then(() => {
        _isScanning = true;
        document.getElementById('qr-modal-btn-start').style.display = 'none';
        document.getElementById('qr-modal-btn-stop').style.display = 'flex';
      }).catch(err => {
        _showResultError('Không thể mở camera: ' + err);
      });
    }

    function _stopScanner() {
      if (!_isScanning || !_scanner) return;
      _scanner.stop().then(() => {
        _isScanning = false;
        _scanner = null;
        const btnStart = document.getElementById('qr-modal-btn-start');
        const btnStop = document.getElementById('qr-modal-btn-stop');
        if (btnStart) btnStart.style.display = 'flex';
        if (btnStop) btnStop.style.display = 'none';
      }).catch(() => { });
    }

    async function _handleScan(qrToken) {
      const now = Date.now();
      if (qrToken === _lastScanned && now - _lastScannedTime < 3000) return;
      _lastScanned = qrToken;
      _lastScannedTime = now;

      _stopScanner();
      _showLoading();

      try {
        const res = await window.GymApp.api.post('/checkin/scan', { qr_token: qrToken });
        if (res?.success) {
          _showSuccess(res.data, res.message);
        } else {
          _showResultError(res?.message || 'Check-in thất bại.');
        }
      } catch (e) {
        _showResultError('Lỗi kết nối máy chủ.');
      }
    }

    function _showLoading() {
      document.getElementById('qr-modal-result').innerHTML = `
        <div style="background:#fff;border:1px solid #e0e8dc;border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px;">
          <div style="width:36px;height:36px;border-radius:50%;background:#e8f4fd;display:flex;align-items:center;justify-content:center;">
            <span class="material-symbols-outlined" style="color:#1565c0;font-size:20px;animation:spin 1s linear infinite">sync</span>
          </div>
          <p style="font-weight:700;color:#3f4a3c;font-size:13px">Đang xử lý...</p>
        </div>`;
    }

    function _showSuccess(data, message) {
      const area = document.getElementById('qr-modal-result');
      area.innerHTML = `
        <div style="border:2px solid #1D9336;border-radius:12px;overflow:hidden;animation:slideUp 0.25s ease;">
          <div style="background:#e7f5e9;display:flex;align-items:center;gap:10px;padding:12px 14px;">
            <span class="material-symbols-outlined" style="color:#1D9336;font-size:28px;font-variation-settings:'FILL' 1">check_circle</span>
            <div>
              <p style="font-weight:700;color:#1D9336;font-size:13px">Check-in thành công!</p>
              <p style="color:#157a2a;font-size:11px">${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:#fff;">
            ${data.avatar_url
          ? `<img src="${data.avatar_url}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid #1D9336;flex-shrink:0;" />`
          : `<div style="width:52px;height:52px;border-radius:50%;background:#1D9336;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="color:#fff;font-weight:700;font-size:20px">${(data.ho_ten || '?').charAt(0)}</span></div>`
        }
            <div>
              <p style="font-weight:700;color:#181c20;font-size:14px">${data.ho_ten || '—'}</p>
              <p style="color:#6e7a6b;font-size:11px">${data.ma_ho_so || ''}</p>
              <p style="color:#1D9336;font-size:11px;margin-top:2px">Gói tập đến: ${data.ngay_ket_thuc ? new Date(data.ngay_ket_thuc).toLocaleDateString('vi-VN') : '—'}</p>
            </div>
          </div>
          <div style="padding:0 14px 14px;background:#fff;">
            <button id="qr-modal-btn-next" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border-radius:10px;background:#1D9336;color:#fff;font-weight:700;font-size:12px;border:none;cursor:pointer;">
              <span class="material-symbols-outlined" style="font-size:15px">qr_code_scanner</span>Quét hội viên tiếp theo
            </button>
          </div>
        </div>`;
      document.getElementById('qr-modal-btn-next')?.addEventListener('click', () => {
        document.getElementById('qr-modal-result').innerHTML = '';
        _startScanner();
      });
      // Cập nhật dữ liệu check-in ở trang checkin nếu đang mở
      if (window.GymApp.currentPage === 'checkin') {
        window.GymApp.pages['checkin']?._fetchAndRefresh?.();
      }
    }

    function _showResultError(msg) {
      const area = document.getElementById('qr-modal-result');
      area.innerHTML = `
        <div style="border:2px solid #ba1a1a;border-radius:12px;overflow:hidden;">
          <div style="background:#ffdad6;display:flex;align-items:center;gap:10px;padding:12px 14px;">
            <span class="material-symbols-outlined" style="color:#ba1a1a;font-size:28px;font-variation-settings:'FILL' 1">error</span>
            <div>
              <p style="font-weight:700;color:#93000a;font-size:13px">Check-in thất bại</p>
              <p style="color:#ba1a1a;font-size:11px">${msg}</p>
            </div>
          </div>
          <div style="padding:10px 14px;background:#fff;">
            <button id="qr-modal-btn-retry" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border-radius:10px;border:1px solid #cdd6ca;background:#fff;color:#3f4a3c;font-weight:700;font-size:12px;cursor:pointer;">
              <span class="material-symbols-outlined" style="font-size:15px">refresh</span>Quét lại
            </button>
          </div>
        </div>`;
      document.getElementById('qr-modal-btn-retry')?.addEventListener('click', () => {
        document.getElementById('qr-modal-result').innerHTML = '';
        _startScanner();
      });
    }

    // Bind sự kiện sau khi DOM ready
    document.addEventListener('DOMContentLoaded', function () {
      document.getElementById('btn-close-qr-modal')?.addEventListener('click', _closeQrModal);

      // Click overlay để đóng
      document.getElementById('modal-qr-scan')?.addEventListener('click', function (e) {
        if (e.target === this) _closeQrModal();
      });

      // Phím Escape
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          const modal = document.getElementById('modal-qr-scan');
          if (modal && modal.style.display === 'flex') _closeQrModal();
        }
      });

      document.getElementById('qr-modal-btn-start')?.addEventListener('click', _startScanner);
      document.getElementById('qr-modal-btn-stop')?.addEventListener('click', _stopScanner);

      document.getElementById('qr-modal-btn-manual')?.addEventListener('click', () => {
        const t = document.getElementById('qr-modal-manual-token')?.value?.trim();
        if (!t) { window.GymApp.toast('Vui lòng dán token QR vào ô nhập.', 'error'); return; }
        _handleScan(t);
        document.getElementById('qr-modal-manual-token').value = '';
      });

      document.getElementById('qr-modal-manual-token')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('qr-modal-btn-manual')?.click();
      });

      document.getElementById('qr-modal-input-upload')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const statusEl = document.getElementById('qr-modal-upload-status');
        const labelEl = document.getElementById('qr-modal-label-upload');
        statusEl.style.display = 'block';
        labelEl.style.opacity = '0.5';
        labelEl.style.pointerEvents = 'none';

        try {
          const tempScanner = new Html5Qrcode('qr-modal-reader');
          const decoded = await tempScanner.scanFile(file, false);
          statusEl.style.display = 'none';
          labelEl.style.opacity = '';
          labelEl.style.pointerEvents = '';
          e.target.value = '';
          _handleScan(decoded);
        } catch (err) {
          statusEl.style.display = 'none';
          labelEl.style.opacity = '';
          labelEl.style.pointerEvents = '';
          e.target.value = '';
          _showResultError('Không tìm thấy mã QR trong ảnh. Hãy thử ảnh rõ hơn hoặc dùng camera trực tiếp.');
        }
      });
    });

    // Export để btn-qr-scan dùng được
    window._openQrModal = _openQrModal;
  })();

  // ===== NOTIFICATIONS (BELL ICON) =====
  (function () {
    let _pollingTimer = null;
    let _dropdownOpen = false;

    const LOAI_ICON = {
      sap_het_han_goi_tap: 'schedule',
      het_han_goi_tap: 'event_busy',
      check_in: 'how_to_reg',
      chua_check_in_truoc_buoi_pt: 'warning',
      cron_tu_xac_nhan: 'smart_toy',
      sap_het_buoi_pt: 'fitness_center',
      ho_so_moi: 'person_add',
      gia_han_goi_tap: 'card_membership',
      dang_ky_goi_pt_moi: 'assignment_turned_in',
      huy_buoi_tap: 'event_busy',
      hoan_tac_buoi_tap: 'undo',
      tai_khoan_bi_khoa: 'lock',
      tai_khoan_moi: 'manage_accounts',
      tom_tat_buoi_sang: 'wb_sunny',
      het_han_goi_pt_thang: 'timer_off',
      cap_nhat_buoi_tap: 'edit_calendar',
    };
    // Ánh xạ loại sự kiện → mức độ (dùng để chọn màu M3)
    const LOAI_MUC_DO = {
      het_han_goi_tap: 'danger',
      huy_buoi_tap: 'danger',
      tai_khoan_bi_khoa: 'danger',
      sap_het_han_goi_tap: 'warning',
      chua_check_in_truoc_buoi_pt: 'warning',
      sap_het_buoi_pt: 'warning',
      het_han_goi_pt_thang: 'warning',
      hoan_tac_buoi_tap: 'warning',
      check_in: 'success',
      ho_so_moi: 'success',
      gia_han_goi_tap: 'success',
      dang_ky_goi_pt_moi: 'success',
      tai_khoan_moi: 'success',
      cron_tu_xac_nhan: 'info',
      tom_tat_buoi_sang: 'info',
      cap_nhat_buoi_tap: 'info',
    };

    // Bảng màu M3 cho từng mức độ (inline style để tránh purge Tailwind)
    const STYLE_MUC_DO = {
      danger: { bg: 'var(--notif-danger-bg)', border: 'var(--notif-danger-border)', icon: 'var(--notif-danger-icon)', text: 'var(--notif-danger-text)' },
      warning: { bg: 'var(--notif-warning-bg)', border: 'var(--notif-warning-border)', icon: 'var(--notif-warning-icon)', text: 'var(--notif-warning-text)' },
      info: { bg: 'var(--notif-info-bg)', border: 'var(--notif-info-border)', icon: 'var(--notif-info-icon)', text: 'var(--notif-info-text)' },
      success: { bg: 'var(--notif-success-bg)', border: 'var(--notif-success-border)', icon: 'var(--notif-success-icon)', text: 'var(--notif-success-text)' },
    };

    function _timeAgo(dateStr) {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diff < 60) return 'vừa xong';
      if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
      return `${Math.floor(diff / 86400)} ngày trước`;
    }

    function _updateBadge(count) {
      const badge = document.getElementById('notif-badge');
      if (!badge) return;
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    async function _fetchUnreadCount() {
      try {
        const res = await window.GymApp.api.get('/notifications/unread-count');
        if (res?.success) _updateBadge(res.data.count);
      } catch (_) { }
    }

    async function _openDropdown() {
      const dropdown = document.getElementById('notif-dropdown');
      const listEl = document.getElementById('notif-list');
      if (!dropdown || !listEl) return;

      dropdown.classList.remove('hidden');
      _dropdownOpen = true;

      listEl.innerHTML = `<div class="text-center py-8 text-on-surface-variant text-body-sm">Đang tải...</div>`;

      try {
        const res = await window.GymApp.api.get('/notifications');
        if (!res?.success) throw new Error();
        const items = res.data;

        if (!items || items.length === 0) {
          listEl.innerHTML = `<div class="text-center py-10 text-on-surface-variant text-body-sm">Không có thông báo nào</div>`;
          return;
        }

        listEl.innerHTML = items.map(n => {
          const icon = LOAI_ICON[n.loai] || 'notifications';
          const mucDo = LOAI_MUC_DO[n.loai] || 'info';
          const s = STYLE_MUC_DO[mucDo];
          const unread = n.da_doc === 0;
          return `
            <div class="notif-item" data-notif-id="${n.id}" data-da-doc="${n.da_doc}" style="
              margin-bottom:6px;
              background:${s.bg};
              border:1px solid ${s.border};
              border-radius:10px;
              padding:10px 12px;
              display:flex;
              align-items:flex-start;
              gap:10px;
              position:relative;
              transition:opacity .25s,transform .25s;
            ">
              <span class="material-symbols-outlined" style="color:${s.icon};font-size:20px;flex-shrink:0;margin-top:1px;font-variation-settings:'FILL' 1">${icon}</span>
              <div style="flex:1;min-width:0;cursor:pointer" class="notif-body">
                <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
                  ${unread ? `<span style="width:7px;height:7px;background:#1D9336;border-radius:50%;flex-shrink:0;display:inline-block"></span>` : ''}
                  <p style="font-weight:700;font-size:12px;color:${s.text};margin:0">${n.tieu_de}</p>
                </div>
                <p style="font-size:11px;color:${s.text};opacity:0.85;margin:0;line-height:1.5">${n.noi_dung}</p>
                <p style="font-size:10px;color:${s.text};opacity:0.6;margin:4px 0 0">${_timeAgo(n.ngay_tao)}</p>
              </div>
              <!-- Nút xóa item -->
              <button class="notif-del-btn" data-notif-id="${n.id}" title="Xóa thông báo" style="
                background:rgba(0,0,0,0.08);
                border:none;cursor:pointer;
                border-radius:6px;
                padding:3px;
                display:flex;align-items:center;justify-content:center;
                flex-shrink:0;
                transition:background .15s;
              " onmouseover="this.style.background='rgba(0,0,0,0.18)'" onmouseout="this.style.background='rgba(0,0,0,0.08)'">
                <span class="material-symbols-outlined" style="font-size:14px;color:${s.text}">close</span>
              </button>
            </div>`;
        }).join('');
      } catch (_) {
        listEl.innerHTML = `<div class="text-center py-8 text-red-500 text-body-sm">Không tải được thông báo</div>`;
      }
    }

    function _closeDropdown() {
      document.getElementById('notif-dropdown')?.classList.add('hidden');
      _dropdownOpen = false;
    }

    // Xóa 1 thông báo khỏi DB và DOM
    async function _deleteOne(id, itemEl, isActualDelete = true) {
      try {
        if (isActualDelete) {
          await window.GymApp.api.delete(`/notifications/${id}`);
        } else {
          await window.GymApp.api.patch(`/notifications/${id}/read`);
        }
      } catch (_) { }
      // Fade-out mượt
      itemEl.style.transition = 'opacity .25s, max-height .3s, margin .3s, padding .3s';
      itemEl.style.opacity = '0';
      itemEl.style.maxHeight = itemEl.offsetHeight + 'px';
      setTimeout(() => {
        itemEl.style.maxHeight = '0';
        itemEl.style.marginBottom = '0';
        itemEl.style.padding = '0';
      }, 50);
      setTimeout(() => {
        itemEl.remove();
        _fetchUnreadCount();
        // Nếu danh sách trống → hiện empty state
        const listEl = document.getElementById('notif-list');
        if (listEl && !listEl.querySelector('.notif-item')) {
          listEl.innerHTML = `<div style="text-align:center;padding:32px 16px;color:var(--text-on-surface-variant)">
            <span class="material-symbols-outlined" style="font-size:36px;display:block;margin-bottom:8px">notifications_none</span>
            <p style="font-size:12px;margin:0">Không có thông báo nào</p>
          </div>`;
        }
      }, 350);
    }

    // Xóa tất cả thông báo
    async function _markAllRead() {
      try {
        await window.GymApp.api.delete('/notifications');
      } catch (_) { }
      const listEl = document.getElementById('notif-list');
      const items = listEl?.querySelectorAll('.notif-item') || [];
      items.forEach((el, i) => {
        setTimeout(() => {
          el.style.transition = 'opacity .2s';
          el.style.opacity = '0';
          setTimeout(() => el.remove(), 220);
        }, i * 40);
      });
      setTimeout(() => {
        if (listEl) listEl.innerHTML = `<div style="text-align:center;padding:32px 16px;color:var(--text-on-surface-variant)">
          <span class="material-symbols-outlined" style="font-size:36px;display:block;margin-bottom:8px">notifications_none</span>
          <p style="font-size:12px;margin:0">Không có thông báo nào</p>
        </div>`;
        _updateBadge(0);
      }, items.length * 40 + 250);
    }

    async function _showLoginSummary() {
      try {
        const res = await window.GymApp.api.get('/notifications/summary');
        if (!res?.success) return;
        const d = res.data;
        if (d.tong_chua_doc === 0) return;

        const parts = [];
        if (d.sap_het_han > 0) parts.push(`${d.sap_het_han} hội viên sắp hết hạn`);
        if (d.het_han > 0) parts.push(`${d.het_han} hội viên đã hết hạn`);
        if (d.sap_het_buoi_pt > 0) parts.push(`${d.sap_het_buoi_pt} hội viên sắp hết buổi PT`);

        if (parts.length > 0) {
          window.GymApp.toast(parts.join(', '), 'info');
        }
      } catch (_) { }
    }

    document.addEventListener('DOMContentLoaded', function () {
      const bellBtn = document.getElementById('btn-bell');
      const wrapper = document.getElementById('notif-wrapper');
      if (!bellBtn) return;

      // Mở/đóng dropdown khi bấm bell
      bellBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (_dropdownOpen) {
          _closeDropdown();
        } else {
          _openDropdown();
        }
      });

      // Đóng khi click ngoài
      document.addEventListener('click', function (e) {
        if (_dropdownOpen && !wrapper?.contains(e.target)) {
          _closeDropdown();
        }
      });

      // Đánh dấu tất cả đã đọc
      document.getElementById('btn-notif-read-all')?.addEventListener('click', function (e) {
        e.stopPropagation();
        _markAllRead();
      });

      // Click nút X xóa từng item
      document.getElementById('notif-list')?.addEventListener('click', function (e) {
        // Nút X
        const delBtn = e.target.closest('.notif-del-btn');
        if (delBtn) {
          e.stopPropagation();
          const item = delBtn.closest('.notif-item');
          const id = delBtn.dataset.notifId;
          if (item && id) _deleteOne(id, item, true); // actual delete
          return;
        }
        // Click vào body item → đánh dấu đã đọc
        const body = e.target.closest('.notif-body');
        if (body) {
          const item = body.closest('.notif-item');
          const id = item?.dataset.notifId;
          const daDoc = item?.dataset.daDoc;
          if (id && daDoc === '0') _deleteOne(id, item, false); // mark read
        }
      });

      // Polling mỗi 30 giây
      _fetchUnreadCount();
      _pollingTimer = setInterval(_fetchUnreadCount, 30000);

      // Gọi summary khi app load xong (sau khi auth xác nhận)
      setTimeout(_showLoginSummary, 1500);
    });
  })();

})();
