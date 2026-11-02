import { logger } from '../../../common/logger/index.js';
import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/errorCodes.js';

export const CourierSelectionStrategies = Object.freeze({
  CHEAPEST: 'CHEAPEST',
  FASTEST: 'FASTEST',
  BALANCED: 'BALANCED',
});

export class CourierSelectionService {
  /**
   * Filter available couriers according to business constraints.
   *
   * @param {NormalizedCourierRate[]} couriers
   * @param {object} criteria
   * @param {boolean} [criteria.isCod=false]
   * @param {Array<string|number>} [criteria.allowedCouriers]
   * @returns {NormalizedCourierRate[]}
   */
  static filterEligibleCouriers(couriers = [], criteria = {}) {
    if (!Array.isArray(couriers) || couriers.length === 0) {
      return [];
    }

    const { isCod = false, allowedCouriers = [] } = criteria;
    const allowedSet = Array.isArray(allowedCouriers) && !allowedCouriers.includes('all') && allowedCouriers.length > 0
      ? new Set(allowedCouriers.map(String))
      : null;

    return couriers.filter((courier) => {
      // Must have valid positive rate
      if (typeof courier.rate !== 'number' || courier.rate <= 0) {
        return false;
      }

      // If order is COD, courier must support COD
      if (isCod && !courier.isCodAvailable) {
        return false;
      }

      // If allowedCouriers filter is active, check against whitelist
      if (allowedSet && !allowedSet.has(String(courier.courierCompanyId))) {
        return false;
      }

      return true;
    });
  }

  /**
   * Select best courier based on configured strategy or manual override.
   *
   * @param {NormalizedCourierRate[]} couriers - List of couriers from provider
   * @param {object} options
   * @param {string} [options.strategy='BALANCED'] - CHEAPEST | FASTEST | BALANCED
   * @param {object} [options.weights] - { cost: 0.4, speed: 0.4, rating: 0.2 }
   * @param {string|number} [options.overrideCourierId] - Manual admin selection
   * @param {boolean} [options.isCod=false]
   * @param {Array<string|number>} [options.allowedCouriers]
   * @returns {{ selectedCourier: NormalizedCourierRate, selectionReason: string, rankedCouriers: Array }}
   */
  static selectCourier(couriers = [], options = {}) {
    const {
      strategy = CourierSelectionStrategies.BALANCED,
      weights = { cost: 0.4, speed: 0.4, rating: 0.2 },
      overrideCourierId = null,
      isCod = false,
      allowedCouriers = [],
    } = options;

    const eligible = this.filterEligibleCouriers(couriers, { isCod, allowedCouriers });

    if (eligible.length === 0) {
      throw AppError.badRequest(
        'No eligible courier service available for the specified destination and order constraints.',
        ErrorCodes.SHIPPING_NO_SERVICEABLE_COURIER
      );
    }

    // 1. Manual Admin Override
    if (overrideCourierId) {
      const manualMatch = eligible.find((c) => String(c.courierCompanyId) === String(overrideCourierId));
      if (manualMatch) {
        return {
          selectedCourier: manualMatch,
          selectionReason: `Manual admin override selection: ${manualMatch.courierName} (ID: ${manualMatch.courierCompanyId}) at ₹${manualMatch.rate.toFixed(2)}`,
          rankedCouriers: [manualMatch, ...eligible.filter((c) => c !== manualMatch)],
        };
      }
      logger.warn(
        { overrideCourierId },
        'Requested override courier is not in eligible couriers list; falling back to automated strategy'
      );
    }

    // 2. Automated Strategy Execution
    switch (strategy.toUpperCase()) {
      case CourierSelectionStrategies.CHEAPEST:
        return this._selectCheapest(eligible);
      case CourierSelectionStrategies.FASTEST:
        return this._selectFastest(eligible);
      case CourierSelectionStrategies.BALANCED:
      default:
        return this._selectBalanced(eligible, weights);
    }
  }

  static _selectCheapest(couriers) {
    const ranked = [...couriers].sort((a, b) => {
      if (a.rate !== b.rate) return a.rate - b.rate;
      if (a.estimatedDeliveryDays !== b.estimatedDeliveryDays) {
        return (a.estimatedDeliveryDays || 99) - (b.estimatedDeliveryDays || 99);
      }
      return (b.rating || 0) - (a.rating || 0);
    });

    const best = ranked[0];
    return {
      selectedCourier: best,
      selectionReason: `Strategy [CHEAPEST]: Selected lowest eligible shipping cost ₹${best.rate.toFixed(2)} with ${best.courierName} (${best.estimatedDeliveryDays || 'N/A'} days)`,
      rankedCouriers: ranked,
    };
  }

  static _selectFastest(couriers) {
    const ranked = [...couriers].sort((a, b) => {
      const daysA = a.estimatedDeliveryDays || 99;
      const daysB = b.estimatedDeliveryDays || 99;
      if (daysA !== daysB) return daysA - daysB;
      if (a.rate !== b.rate) return a.rate - b.rate;
      return (b.rating || 0) - (a.rating || 0);
    });

    const best = ranked[0];
    return {
      selectedCourier: best,
      selectionReason: `Strategy [FASTEST]: Selected earliest turnaround of ${best.estimatedDeliveryDays || 'N/A'} days with ${best.courierName} at ₹${best.rate.toFixed(2)}`,
      rankedCouriers: ranked,
    };
  }

  static _selectBalanced(couriers, weights = {}) {
    const minRate = Math.min(...couriers.map((c) => c.rate));
    const maxRate = Math.max(...couriers.map((c) => c.rate));
    const minDays = Math.min(...couriers.map((c) => c.estimatedDeliveryDays || 3));
    const maxDays = Math.max(...couriers.map((c) => c.estimatedDeliveryDays || 5));

    // Check if ratings exist
    const hasRatings = couriers.some((c) => typeof c.rating === 'number' && c.rating > 0);

    let weightCost = weights.cost ?? 0.4;
    let weightSpeed = weights.speed ?? 0.4;
    let weightRating = hasRatings ? (weights.rating ?? 0.2) : 0;

    // Normalize weights to sum to 1.0
    const weightSum = weightCost + weightSpeed + weightRating;
    weightCost /= weightSum;
    weightSpeed /= weightSum;
    weightRating /= weightSum;

    const scored = couriers.map((courier) => {
      // Normalized cost (0 = lowest rate, 1 = highest rate)
      const normCost = maxRate === minRate ? 0 : (courier.rate - minRate) / (maxRate - minRate);

      // Normalized speed (0 = fastest, 1 = slowest)
      const days = courier.estimatedDeliveryDays || maxDays;
      const normSpeed = maxDays === minDays ? 0 : (days - minDays) / (maxDays - minDays);

      // Normalized rating penalty (0 = 5 stars, 1 = 1 star)
      let normRating = 0.5;
      if (hasRatings && courier.rating) {
        normRating = 1 - Math.max(0, Math.min(1, (courier.rating - 1) / 4));
      }

      // Lower composite score indicates a better balanced option
      const score = Number(
        (weightCost * normCost + weightSpeed * normSpeed + weightRating * normRating).toFixed(4)
      );

      return {
        ...courier,
        compositeScore: score,
        normalizedCost: normCost,
        normalizedSpeed: normSpeed,
        normalizedRating: normRating,
      };
    });

    const ranked = scored.sort((a, b) => a.compositeScore - b.compositeScore);
    const best = ranked[0];

    return {
      selectedCourier: best,
      selectionReason: `Strategy [BALANCED]: Composite score ${best.compositeScore} (Cost: ₹${best.rate.toFixed(2)}, ETA: ${best.estimatedDeliveryDays || 'N/A'}d, Rating: ${best.rating || 'N/A'}) with ${best.courierName}`,
      rankedCouriers: ranked,
    };
  }
}
