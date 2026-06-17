import { PayOS } from '@payos/node';

const payOS = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || 'fa35782c-6e2f-40d5-a9ca-5d478c0f1dd4',
  apiKey: process.env.PAYOS_API_KEY || 'd0e918a5-0265-4658-aded-c31b95070b38',
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || 'df6877c2d608887722b9bad2a842b8c32352bc649de1fca3ac49269a4876e89e'
});

/**
 * Loại bỏ dấu tiếng Việt và ký tự đặc biệt để tuân thủ quy tắc mô tả của PayOS (chỉ chữ, số, khoảng trắng, tối đa 25 ký tự)
 */
export function cleanDescription(str) {
  if (!str) return 'Thanh toan goi tap';
  
  // Loại bỏ dấu tiếng Việt
  const signedChars = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ";
  const unsignedChars = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD";
  
  let result = str;
  for (let i = 0; i < signedChars.length; i++) {
    const reg = new RegExp(signedChars[i], "g");
    result = result.replace(reg, unsignedChars[i]);
  }
  
  // Chỉ giữ lại chữ, số và khoảng trắng
  result = result.replace(/[^a-zA-Z0-9 ]/g, '');
  
  // Rút gọn còn tối đa 25 ký tự
  return result.trim().substring(0, 25);
}

/**
 * Tạo link thanh toán PayOS
 * @param {number} orderCode Mã đơn hàng (dạng số nguyên dương)
 * @param {number} amount Số tiền thanh toán
 * @param {string} description Mô tả đơn hàng
 * @param {string} returnUrl URL chuyển hướng khi thanh toán thành công
 * @param {string} cancelUrl URL chuyển hướng khi hủy thanh toán
 */
export async function createPaymentLink(orderCode, amount, description, returnUrl, cancelUrl) {
  try {
    const cleanedDesc = cleanDescription(description);
    const paymentData = {
      orderCode: Number(orderCode),
      amount: Number(amount),
      description: cleanedDesc,
      cancelUrl: cancelUrl || 'https://google.com',
      returnUrl: returnUrl || 'https://google.com',
      expiredAt: Math.floor(Date.now() / 1000) + 600 // Hết hạn sau 10 phút (600 giây)
    };

    console.log('[PayOS] Đang tạo link thanh toán:', paymentData);
    const paymentLinkRes = await payOS.paymentRequests.create(paymentData);
    return paymentLinkRes;
  } catch (error) {
    console.error('[PayOS] Lỗi khi tạo link thanh toán:', error);
    throw error;
  }
}

/**
 * Lấy thông tin thanh toán từ PayOS
 * @param {number|string} orderCode 
 */
export async function getPaymentLinkInformation(orderCode) {
  try {
    const paymentInfo = await payOS.paymentRequests.get(orderCode);
    return paymentInfo;
  } catch (error) {
    console.error('[PayOS] Lỗi khi lấy thông tin thanh toán:', error);
    throw error;
  }
}

export default payOS;
