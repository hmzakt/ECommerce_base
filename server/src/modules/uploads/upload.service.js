import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/errorCodes.js';

/**
 * Upload an image buffer directly to Cloudinary using upload_stream
 *
 * @param {Buffer} buffer - File buffer from multer memory storage
 * @param {object} options
 * @param {string} [options.folder='products'] - Target folder in Cloudinary
 * @returns {Promise<{ url: string, publicId: string, width?: number, height?: number, format?: string }>}
 */
export const uploadImageToCloudinary = (buffer, { folder = 'products' } = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(
            new AppError(
              error.message || 'Failed to upload image to Cloudinary',
              500,
              ErrorCodes.INTERNAL_SERVER_ERROR
            )
          );
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      }
    );

    uploadStream.end(buffer);
  });
};
