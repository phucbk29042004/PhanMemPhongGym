/**
 * Package Requests — Phê duyệt yêu cầu gia hạn gói tập từ App
 */
(function () {
  const PAGE = {
    _data: [],

    render() {
      return `
        <div class="flex flex-col gap-loose">
          <!-- Header -->
          <div class="flex flex-wrap items-start justify-between gap-compact">
            <div class="page-title-bar">
              <h2 class="font-bold text-on-surface" style="font-size:22px">Yêu cầu gia hạn gói tập</h2>
              <p class="text-on-surface-variant font-body-sm text-body-sm mt-xs">Hội viên gửi yêu cầu từ ứng dụng — duyệt để kích hoạt gói mới</p>
            </div>
            <button id="btn-refresh-pkg-req"
              class="flex items-center gap-xs px-compact py-compact rounded-xl border border-outline-variant text-on-surface-variant hover:text-brand-primary hover:border-brand-primary transition-all text-body-sm font-bold">
              <span class="material-symbols-outlined text-sm">refresh</span> Làm mới
            </button>
          </div>

          <!-- Stats -->
          <div id="pkg-req-stats" class="grid grid-cols-1 sm:grid-cols-3 gap-compact"></div>

          <!-- Table/Card list -->
          <div id="pkg-req-list" class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <div class="section-header px-standard py-compact border-b border-outline-variant flex items-center gap-compact">
              <span class="material-symbols-outlined text-brand-primary text-xl" style="font-variation-settings:'FILL' 1">assignment_turned_in</span>
              <span class="font-bold text-on-surface">Danh sách yêu cầu chờ duyệt</span>
              <span id="pkg-req-count" class="ml-auto text-body-sm text-on-surface-variant"></span>
            </div>
            <div id="pkg-req-content" class="p-standard">
              <div class="text-center py-loose text-on-surface-variant">
                <span class="material-symbols-outlined text-4xl block mb-standard animate-spin">refresh</span>
                <p class="text-body-sm">Đang tải...</p>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    async init() {
      await this._load();

      document.getElementById('btn-refresh-pkg-req')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-refresh-pkg-req');
        const icon = btn?.querySelector('.material-symbols-outlined');
        if (icon) icon.classList.add('animate-spin');
        if (btn) {
          btn.disabled = true;
          btn.classList.add('pointer-events-none', 'opacity-50');
        }
        await this._load();
        if (icon) icon.classList.remove('animate-spin');
        if (btn) {
          btn.disabled = false;
          btn.classList.remove('pointer-events-none', 'opacity-50');
        }
      });
    },

    async _load() {
      try {
        const res = await window.GymApp.api.get('/members/package-requests');
        if (res?.success) this._data = res.data || [];
      } catch (e) {
        console.error('[PkgReq] load error', e);
        this._data = [];
      }
      this._renderStats();
      this._renderList();
      this._updateBadge();
    },

    _renderStats() {
      const total = this._data.length;
      const el = document.getElementById('pkg-req-stats');
      if (!el) return;
      el.innerHTML = [
        { label: 'Chờ duyệt', value: total, icon: 'pending_actions', bg: '#fff3e0', color: '#e65100' },
        { label: 'Hôm nay', value: this._data.filter(r => r.ngay_tao?.startsWith(new Date().toISOString().slice(0,10))).length, icon: 'today', bg: '#e3f2fd', color: '#1565c0' },
        { label: 'Tuần này', value: (() => { const w = new Date(); w.setDate(w.getDate() - 7); return this._data.filter(r => new Date(r.ngay_tao) >= w).length; })(), icon: 'date_range', bg: '#e7f5e9', color: '#1D9336' },
      ].map(s => `
        <div class="gym-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-standard shadow-sm flex items-center gap-compact">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:${s.bg}">
            <span class="material-symbols-outlined" style="color:${s.color};font-size:20px;font-variation-settings:'FILL' 1">${s.icon}</span>
          </div>
          <div>
            <p class="text-on-surface-variant text-body-sm">${s.label}</p>
            <p class="font-bold text-on-surface" style="font-size:22px;line-height:1.2">${s.value}</p>
          </div>
        </div>
      `).join('');
    },

    _renderList() {
      const el = document.getElementById('pkg-req-content');
      const countEl = document.getElementById('pkg-req-count');
      if (!el) return;
      if (countEl) countEl.textContent = `${this._data.length} yêu cầu`;

      if (!this._data.length) {
        el.innerHTML = `
          <div class="text-center py-margin text-on-surface-variant flex flex-col items-center gap-compact">
            <span class="material-symbols-outlined" style="font-size:48px;color:var(--outline-variant)">check_circle</span>
            <p class="font-bold text-on-surface">Không có yêu cầu chờ duyệt</p>
            <p class="text-body-sm">Tất cả yêu cầu đã được xử lý</p>
          </div>`;
        return;
      }

      // Desktop: table; Mobile: cards
      el.innerHTML = `
        <!-- Desktop table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-body-sm">
            <thead>
              <tr class="border-b border-outline-variant text-on-surface-variant">
                <th class="text-left py-compact px-standard font-bold">Hội viên</th>
                <th class="text-left py-compact px-standard font-bold">Gói tập</th>
                <th class="text-left py-compact px-standard font-bold">Từ ngày</th>
                <th class="text-left py-compact px-standard font-bold">Giá dự kiến</th>
                <th class="text-left py-compact px-standard font-bold">Gửi lúc</th>
                <th class="text-center py-compact px-standard font-bold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${this._data.map(r => `
                <tr class="border-b border-outline-variant hover:bg-surface-container-low transition-colors" data-req-id="${r.id}">
                  <td class="py-compact px-standard">
                    <div class="flex items-center gap-compact">
                      <div class="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                        <span class="font-bold text-brand-primary text-body-sm">${(r.ho_ten||'?')[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p class="font-bold text-on-surface">${r.ho_ten || '—'}</p>
                        <p class="text-on-surface-variant" style="font-size:10px">${r.ma_ho_so || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td class="py-compact px-standard">
                    <span class="font-bold text-on-surface">${r.ten_goi_tap || '—'}</span>
                  </td>
                  <td class="py-compact px-standard text-on-surface">
                    ${r.tu_ngay ? window.GymApp.formatDate(r.tu_ngay) : '—'}
                  </td>
                  <td class="py-compact px-standard font-bold text-brand-primary">
                    ${r.gia_thuc_te ? Number(r.gia_thuc_te).toLocaleString('vi-VN') + 'đ' : '—'}
                  </td>
                  <td class="py-compact px-standard text-on-surface-variant" style="font-size:11px">
                    ${r.ngay_tao ? new Date(r.ngay_tao).toLocaleString('vi-VN', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'}
                  </td>
                  <td class="py-compact px-standard text-center">
                    <div class="flex items-center justify-center gap-xs">
                      <button class="btn-approve-req px-compact py-xs rounded-lg font-bold text-white transition-all hover:opacity-90 active:scale-95 text-body-sm"
                        style="background:#1D9336" data-id="${r.id}" data-name="${r.ho_ten}" data-goi="${r.ten_goi_tap}" data-gia="${r.gia_thuc_te||0}">
                        <span class="material-symbols-outlined text-sm align-middle">check</span> Duyệt
                      </button>
                      <button class="btn-reject-req px-compact py-xs rounded-lg font-bold border border-outline-variant text-on-surface-variant hover:text-error hover:border-error transition-all text-body-sm"
                        data-id="${r.id}" data-name="${r.ho_ten}">
                        <span class="material-symbols-outlined text-sm align-middle">close</span> Từ chối
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Mobile cards -->
        <div class="md:hidden flex flex-col gap-compact">
          ${this._data.map(r => `
            <div class="rounded-xl border border-outline-variant overflow-hidden" data-req-id="${r.id}">
              <div class="section-header px-compact py-compact flex items-center gap-compact border-b border-outline-variant">
                <div class="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                  <span class="font-bold text-brand-primary text-body-sm">${(r.ho_ten||'?')[0].toUpperCase()}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-on-surface text-body-sm truncate">${r.ho_ten || '—'}</p>
                  <p class="text-on-surface-variant" style="font-size:10px">${r.ma_ho_so || ''}</p>
                </div>
                <span style="font-size:10px;padding:2px 8px;border-radius:999px;background:#fff3e0;color:#e65100;font-weight:700">Chờ duyệt</span>
              </div>
              <div class="p-compact grid grid-cols-2 gap-xs text-body-sm">
                <div><p class="text-on-surface-variant">Gói tập</p><p class="font-bold text-on-surface">${r.ten_goi_tap || '—'}</p></div>
                <div><p class="text-on-surface-variant">Từ ngày</p><p class="font-bold text-on-surface">${r.tu_ngay ? window.GymApp.formatDate(r.tu_ngay) : '—'}</p></div>
                <div><p class="text-on-surface-variant">Giá dự kiến</p><p class="font-bold text-brand-primary">${r.gia_thuc_te ? Number(r.gia_thuc_te).toLocaleString('vi-VN') + 'đ' : '—'}</p></div>
                <div><p class="text-on-surface-variant">Gửi lúc</p><p class="font-bold text-on-surface">${r.ngay_tao ? new Date(r.ngay_tao).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'}</p></div>
              </div>
              <div class="px-compact pb-compact flex gap-xs">
                <button class="btn-approve-req flex-1 py-xs rounded-lg font-bold text-white text-body-sm" style="background:#1D9336"
                  data-id="${r.id}" data-name="${r.ho_ten}" data-goi="${r.ten_goi_tap}" data-gia="${r.gia_thuc_te||0}">
                  ✓ Duyệt
                </button>
                <button class="btn-reject-req flex-1 py-xs rounded-lg font-bold border border-outline-variant text-on-surface-variant text-body-sm"
                  data-id="${r.id}" data-name="${r.ho_ten}">
                  ✕ Từ chối
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      // Bind approve buttons
      document.querySelectorAll('.btn-approve-req').forEach(btn => {
        btn.addEventListener('click', () => this._showApproveModal(btn.dataset));
      });
      // Bind reject buttons
      document.querySelectorAll('.btn-reject-req').forEach(btn => {
        btn.addEventListener('click', () => this._confirmReject(btn.dataset.id, btn.dataset.name));
      });
    },

    _updateBadge() {
      const badge = document.getElementById('pkg-req-badge');
      if (!badge) return;
      const count = this._data.length;
      badge.textContent = count > 9 ? '9+' : count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    },

    _showApproveModal({ id, name, goi, gia }) {
      const existingModal = document.getElementById('modal-approve-req');
      if (existingModal) existingModal.remove();

      const html = `
        <div id="modal-approve-req" class="fixed inset-0 z-[1000] flex items-center justify-center p-standard bg-black/60 backdrop-blur-sm">
          <div class="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div class="px-loose py-standard flex items-center gap-compact border-b border-outline-variant"
              style="background:linear-gradient(135deg,#1D9336,#157a2a)">
              <span class="material-symbols-outlined text-white" style="font-variation-settings:'FILL' 1">assignment_turned_in</span>
              <div>
                <h3 class="font-bold text-white">Duyệt yêu cầu gia hạn</h3>
                <p class="text-white/80 text-body-sm">${name} — ${goi}</p>
              </div>
              <button id="btn-close-approve" class="ml-auto text-white/80 hover:text-white">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="p-loose space-y-standard">
              <div>
                <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Giá thực thu (VNĐ)</label>
                <div class="relative">
                  <input type="text" inputmode="numeric" id="approve-price" value="${new Intl.NumberFormat('vi-VN').format(gia || 0)}"
                    class="w-full bg-surface-container-low border border-outline-variant pl-standard pr-12 py-compact rounded-xl outline-none focus:border-brand-primary transition-all font-bold text-on-surface text-body-md" />
                  <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline text-label-xs font-black opacity-50">VNĐ</span>
                </div>
              </div>
              <div>
                <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Phương thức thanh toán</label>
                <select id="approve-method"
                  class="w-full bg-surface-container-low border border-outline-variant px-standard py-compact rounded-xl outline-none focus:border-brand-primary transition-all text-on-surface text-body-md">
                  <option value="tien_mat">Tiền mặt</option>
                  <option value="chuyen_khoan">Chuyển khoản</option>
                </select>
              </div>
              <div>
                <label class="block text-body-sm text-on-surface-variant font-bold mb-xs">Ghi chú (tuỳ chọn)</label>
                <input type="text" id="approve-note" placeholder="VD: Đã nhận tiền, biên lai số 001..."
                  class="w-full bg-surface-container-low border border-outline-variant px-standard py-compact rounded-xl outline-none focus:border-brand-primary transition-all text-on-surface text-body-md" />
              </div>
            </div>

            <div class="px-loose py-standard border-t border-outline-variant flex gap-compact">
              <button id="btn-cancel-approve"
                class="flex-1 py-compact rounded-xl border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container transition-colors text-body-sm">
                Hủy bỏ
              </button>
              <button id="btn-confirm-approve"
                class="flex-1 py-compact rounded-xl text-white font-bold hover:opacity-90 transition-all text-body-sm"
                style="background:#1D9336">
                <span class="material-symbols-outlined text-sm align-middle">check</span> Xác nhận duyệt
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', html);

      // Format VNĐ helper
      const _fmtVND = n => n > 0 ? new Intl.NumberFormat('vi-VN').format(n) : '0';
      const _parseVND = s => parseInt((s || '').replace(/\./g, '').replace(/,/g, '')) || 0;

      const priceEl = document.getElementById('approve-price');
      priceEl?.addEventListener('focus', function () {
        const raw = _parseVND(this.value);
        this.value = raw > 0 ? String(raw) : '';
      });
      priceEl?.addEventListener('blur', function () {
        const raw = _parseVND(this.value);
        this.value = raw > 0 ? _fmtVND(raw) : '0';
      });

      const closeModal = () => document.getElementById('modal-approve-req')?.remove();
      document.getElementById('btn-close-approve').onclick = closeModal;
      document.getElementById('btn-cancel-approve').onclick = closeModal;
      document.getElementById('modal-approve-req').addEventListener('click', e => {
        if (e.target === document.getElementById('modal-approve-req')) closeModal();
      });

      document.getElementById('btn-confirm-approve').onclick = async () => {
        const gia_thuc_te = _parseVND(document.getElementById('approve-price').value);
        const phuong_thuc_tt = document.getElementById('approve-method').value;
        const ghi_chu_tt = document.getElementById('approve-note').value;
        const confirmBtn = document.getElementById('btn-confirm-approve');
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Đang duyệt...';
        try {
          const res = await window.GymApp.api.put(`/members/package-requests/${id}/approve`, {
            action: 'approve', gia_thuc_te: Number(gia_thuc_te), phuong_thuc_tt, ghi_chu_tt
          });
          if (res?.success) {
            window.GymApp.toast('Đã duyệt yêu cầu gia hạn thành công!', 'success');
            closeModal();
            await this._load();
          } else {
            window.GymApp.toast(res?.message || 'Có lỗi xảy ra', 'error');
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Xác nhận duyệt';
          }
        } catch (e) {
          window.GymApp.toast('Lỗi kết nối server', 'error');
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Xác nhận duyệt';
        }
      };
    },

    async _confirmReject(id, name) {
      if (!confirm(`Từ chối yêu cầu gia hạn của "${name}"?`)) return;
      try {
        const res = await window.GymApp.api.put(`/members/package-requests/${id}/approve`, { action: 'reject' });
        if (res?.success) {
          window.GymApp.toast('Đã từ chối yêu cầu.', 'info');
          await this._load();
        } else {
          window.GymApp.toast(res?.message || 'Có lỗi xảy ra', 'error');
        }
      } catch (e) {
        window.GymApp.toast('Lỗi kết nối server', 'error');
      }
    }
  };

  // Đăng ký page
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.GymApp.pages['package-requests'] = PAGE;
    });
  } else {
    window.GymApp.pages['package-requests'] = PAGE;
  }
})();
