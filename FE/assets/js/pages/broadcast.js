/**
 * Broadcast Modal Module
 * Cho phép Admin gửi thông báo hàng loạt qua Modal
 */
(function () {
  const BC = {
    init: function () {
      this._setupEventListeners();
    },

    _setupEventListeners: function () {
      const trigger = document.getElementById('btn-broadcast-modal-trigger');
      const modal = document.getElementById('modal-broadcast');
      const btnClose = document.getElementById('btn-close-broadcast');
      const btnClose2 = document.getElementById('btn-close-broadcast-2');
      const btnSend = document.getElementById('btn-save-broadcast');

      // Mở modal
      trigger?.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
        // Clear form when opening
        document.getElementById('bc-title').value = '';
        document.getElementById('bc-content').value = '';
      });

      // Đóng modal
      const closeModal = () => { modal.style.display = 'none'; };
      btnClose?.addEventListener('click', closeModal);
      btnClose2?.addEventListener('click', closeModal);
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });

      // Gửi thông báo
      btnSend?.addEventListener('click', async () => {
        const title = document.getElementById('bc-title').value.trim();
        const content = document.getElementById('bc-content').value.trim();
        const target = document.getElementById('bc-target').value;
        const level = document.getElementById('bc-level').value;

        if (!title || !content) {
          window.GymApp.toast('Vui lòng nhập đủ tiêu đề và nội dung', 'error');
          return;
        }

        // Xác nhận
        const confirmMsg = target === 'all'
          ? 'Gửi thông báo tới tất cả mọi người?'
          : `Gửi thông báo tới ${target === 'members' ? 'HỘI VIÊN' : 'HLV / PT'}?`;

        if (!confirm(confirmMsg)) return;

        btnSend.disabled = true;
        const originalText = btnSend.innerHTML;
        btnSend.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> Đang gửi...';

        try {
          const res = await window.GymApp.api.post('/notifications/broadcast', {
            tieu_de: title,
            noi_dung: content,
            doi_tuong: target,
            muc_do: level
          });

          if (res?.success) {
            window.GymApp.toast(`Thành công! Đã gửi tới ${res.data?.count} người.`, 'success');
            closeModal();
          } else {
            window.GymApp.toast(res?.message || 'Có lỗi xảy ra', 'error');
          }
        } catch (err) {
          console.error('[Broadcast] error:', err);
          window.GymApp.toast(err.response?.data?.message || 'Lỗi kết nối server', 'error');
        } finally {
          btnSend.disabled = false;
          btnSend.innerHTML = originalText;
        }
      });
    }
  };

  // Khởi tạo khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BC.init());
  } else {
    BC.init();
  }
})();
