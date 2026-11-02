import { ShiprocketProvider } from './shiprocket/shiprocket.provider.js';
import { DelhiveryAdapter } from './adapters/delhivery.adapter.js';
import { EkartAdapter } from './adapters/ekart.adapter.js';
import { IndiaPostAdapter } from './adapters/indiapost.adapter.js';
import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/errorCodes.js';

export class ShippingProviderFactory {
  static getProvider(providerCode = 'SHIPROCKET', providerConfig = {}) {
    const code = (providerCode || 'SHIPROCKET').toUpperCase();

    switch (code) {
      case 'SHIPROCKET':
        return new ShiprocketProvider(providerConfig);
      case 'DELHIVERY':
        return new DelhiveryAdapter(providerConfig);
      case 'EKART':
        return new EkartAdapter(providerConfig);
      case 'INDIAPOST':
        return new IndiaPostAdapter(providerConfig);
      default:
        throw AppError.badRequest(
          `Unsupported shipping provider code: ${providerCode}`,
          ErrorCodes.SHIPPING_PROVIDER_UNAVAILABLE
        );
    }
  }
}
