/**
 * Cấu hình Cloudinary SDK
 * Luồng: FE gửi file → multer buffer → cloudinary upload → lưu URL vào DB
 */

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload buffer ảnh lên Cloudinary
 * @param {Buffer} buffer   - Buffer dữ liệu ảnh từ multer
 * @param {string} folder   - Thư mục trên Cloudinary (VD: 'paradise-gym/profiles')
 * @param {string} publicId - Tên file (để đặt tên gợi nhớ, VD: 'HV001')
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadImage = (buffer, folder = 'paradise-gym/profiles', publicId = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    };
    if (publicId) options.public_id = publicId;

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve({
        url:      result.secure_url,
        publicId: result.public_id,
      });
    });

    uploadStream.end(buffer);
  });
};

/**
 * Xóa ảnh cũ trên Cloudinary khi người dùng đổi ảnh mới
 * @param {string} publicId - cloudinary_public_id đã lưu trong DB
 */
export const deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

export default cloudinary;
