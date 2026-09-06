import { uploadImageToCloudinary } from './upload.service.js';
import { sendSuccess } from '../../common/utils/response.js';
import { AppError } from '../../common/errors/AppError.js';
import { ErrorCodes } from '../../common/errors/errorCodes.js';

export const uploadController = {
  /**
   * Handle single image upload
   * POST /api/v1/admin/uploads/image
   */
  uploadImage: async (req, res) => {
    if (!req.file) {
      throw AppError.badRequest('No image file provided', ErrorCodes.VALIDATION_ERROR);
    }

    const folder = req.body?.folder?.trim() || 'products';
    const result = await uploadImageToCloudinary(req.file.buffer, { folder });

    return sendSuccess(res, {
      message: 'Image uploaded successfully to Cloudinary',
      data: result,
      statusCode: 201,
    });
  },
};
