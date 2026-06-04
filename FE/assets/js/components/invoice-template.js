window.GymApp.printInvoice = function (data) {
  // data: { type: 'goi_tap' | 'goi_pt', member: {...}, pkg: {...}, branch: {...}, creator: string }
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);

  const doc = frame.contentWindow.document;
  
  const paymentMethodLabel = (method) => {
    if (method === 'tien_mat') return 'Tiền mặt';
    if (method === 'chuyen_khoan') return 'Chuyển khoản';
    return method || '—';
  };

  const fmtDate = (dStr) => {
    if (!dStr) return '—';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (_) { return dStr; }
  };

  const today = new Date();
  const dayStr = String(today.getDate()).padStart(2, '0');
  const monthStr = String(today.getMonth() + 1).padStart(2, '0');
  const yearStr = today.getFullYear();

  const title = data.type === 'goi_pt' ? 'BIÊN LAI ĐĂNG KÝ GÓI PT' : 'BIÊN LAI ĐĂNG KÝ GÓI TẬP';
  const price = data.pkg.gia_thuc_te || data.pkg.price || 0;
  const needPay = data.pkg.so_tien_da_thu ?? price;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm 15mm 15mm 15mm;
        }
        body {
          font-family: "Times New Roman", Times, serif;
          font-size: 13px;
          line-height: 1.5;
          color: #000;
          margin: 0;
          padding: 0;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #000;
          padding-bottom: 8px;
          margin-bottom: 20px;
        }
        .branch-info {
          width: 55%;
        }
        .branch-name {
          font-weight: bold;
          font-size: 14px;
          text-transform: uppercase;
        }
        .branch-detail {
          font-size: 11px;
          margin-top: 2px;
        }
        .invoice-title-container {
          width: 45%;
          text-align: right;
        }
        .invoice-title {
          font-size: 16px;
          font-weight: bold;
          text-transform: uppercase;
          margin: 0;
        }
        .invoice-date {
          font-size: 11px;
          font-style: italic;
          margin-top: 4px;
        }
        .content {
          margin-bottom: 30px;
        }
        .section-title {
          font-weight: bold;
          text-transform: uppercase;
          font-size: 12px;
          margin-top: 15px;
          margin-bottom: 8px;
          border-bottom: 1px dashed #000;
          padding-bottom: 2px;
        }
        .grid-info {
          display: grid;
          grid-template-columns: 140px 1fr;
          row-gap: 6px;
          margin-bottom: 15px;
        }
        .info-label {
          font-weight: bold;
        }
        .info-value {
          word-break: break-word;
        }
        .table-invoice {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          margin-bottom: 15px;
        }
        .table-invoice th, .table-invoice td {
          border: 1px solid #000;
          padding: 6px 8px;
          text-align: left;
        }
        .table-invoice th {
          background-color: #f2f2f2;
          font-weight: bold;
          text-align: center;
        }
        .text-right {
          text-align: right !important;
        }
        .text-center {
          text-align: center !important;
        }
        .footer-sig {
          margin-top: 40px;
          display: flex;
          justify-content: flex-end;
        }
        .sig-container {
          text-align: center;
          width: 250px;
        }
        .sig-date {
          font-style: italic;
          font-size: 12px;
          margin-bottom: 8px;
        }
        .sig-title {
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 60px;
        }
        .sig-name {
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="branch-info">
          <div class="branch-name">${data.branch.ten || 'Paradise GYM'}</div>
          <div class="branch-detail">Địa chỉ: ${data.branch.dia_chi || 'Hệ thống phòng tập Paradise GYM'}</div>
          <div class="branch-detail">Điện thoại: 1900 9999</div>
        </div>
        <div class="invoice-title-container">
          <h1 class="invoice-title">${title}</h1>
          <div class="invoice-date">Mã GD: ${data.pkg.id || 'N/A'}</div>
          <div class="invoice-date">Thời gian in: ${fmtDate(today)}</div>
        </div>
      </div>

      <div class="content">
        <div class="section-title">Thông tin khách hàng</div>
        <div class="grid-info">
          <div class="info-label">Hội viên:</div>
          <div class="info-value">${data.member.ho_ten || data.member.name}</div>
          <div class="info-label">Mã số hồ sơ:</div>
          <div class="info-value">${data.member.ma_ho_so || '—'}</div>
          <div class="info-label">Số điện thoại:</div>
          <div class="info-value">${data.member.so_dien_thoai || '—'}</div>
        </div>

        <div class="section-title">Chi tiết dịch vụ đăng ký</div>
        <table class="table-invoice">
          <thead>
            <tr>
              <th>Tên dịch vụ / Gói đăng ký</th>
              <th style="width: 100px;">Thời lượng / Buổi</th>
              <th style="width: 120px;">Hiệu lực từ ngày</th>
              <th style="width: 120px;">Hiệu lực đến ngày</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <b>${data.pkg.ten_goi || data.pkg.name || 'Gói dịch vụ'}</b>
                ${data.type === 'goi_pt' && data.ptName ? `<br><span style="font-size: 11px; font-style: italic;">Huấn luyện viên: ${data.ptName}</span>` : ''}
              </td>
              <td class="text-center">${data.type === 'goi_pt' ? `${data.pkg.so_buoi_dang_ky || data.pkg.sessions || '—'} buổi` : 'Gói tập'}</td>
              <td class="text-center">${fmtDate(data.pkg.tu_ngay || data.pkg.from)}</td>
              <td class="text-center">${fmtDate(data.pkg.den_ngay || data.pkg.to)}</td>
            </tr>
          </tbody>
        </table>

        <div class="section-title">Thông tin thanh toán</div>
        <div class="grid-info">
          <div class="info-label">Tổng chi phí:</div>
          <div class="info-value"><b>${window.GymApp.formatCurrency(price)}</b></div>
          <div class="info-label">Đã thanh toán:</div>
          <div class="info-value">${window.GymApp.formatCurrency(needPay)}</div>
          <div class="info-label">Phương thức:</div>
          <div class="info-value">${paymentMethodLabel(data.pkg.phuong_thuc_tt || data.pkg.paymentMethod)}</div>
          ${data.pkg.ghi_chu_tt ? `
            <div class="info-label">Ghi chú:</div>
            <div class="info-value" style="font-style: italic;">"${data.pkg.ghi_chu_tt}"</div>
          ` : ''}
        </div>
      </div>

      <div class="footer-sig">
        <div class="sig-container">
          <div class="sig-date">Ngày ${dayStr} tháng ${monthStr} năm ${yearStr}</div>
          <div class="sig-title">Người lập bảng</div>
          <div class="sig-name">${data.creator || 'Nhân viên hệ thống'}</div>
        </div>
      </div>
    </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  frame.contentWindow.focus();
  setTimeout(() => {
    frame.contentWindow.print();
    setTimeout(() => {
      frame.remove();
    }, 1000);
  }, 500);
};
