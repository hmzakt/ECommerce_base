import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CourierSelectionService,
  CourierSelectionStrategies,
} from '../../src/modules/shipping/engine/courierSelection.service.js';
import { NormalizedCourierRate } from '../../src/modules/shipping/providers/models/normalizedModels.js';

describe('CourierSelectionService Unit Tests', () => {
  const sampleCouriers = [
    new NormalizedCourierRate({
      courierCompanyId: 101,
      courierName: 'Courier Premium Air',
      rate: 120.0,
      estimatedDeliveryDays: 1,
      rating: 4.8,
      isCodAvailable: true,
    }),
    new NormalizedCourierRate({
      courierCompanyId: 102,
      courierName: 'Courier Economy Surface',
      rate: 45.0,
      estimatedDeliveryDays: 5,
      rating: 3.9,
      isCodAvailable: true,
    }),
    new NormalizedCourierRate({
      courierCompanyId: 103,
      courierName: 'Courier Standard Express',
      rate: 65.0,
      estimatedDeliveryDays: 2,
      rating: 4.6,
      isCodAvailable: false,
    }),
    new NormalizedCourierRate({
      courierCompanyId: 104,
      courierName: 'Courier Budget Surface',
      rate: 40.0,
      estimatedDeliveryDays: 6,
      rating: 3.2,
      isCodAvailable: false,
    }),
  ];

  it('CHEAPEST strategy selects the courier with lowest rate', () => {
    const result = CourierSelectionService.selectCourier(sampleCouriers, {
      strategy: CourierSelectionStrategies.CHEAPEST,
      isCod: false,
    });

    assert.equal(result.selectedCourier.courierCompanyId, 104);
    assert.equal(result.selectedCourier.rate, 40.0);
    assert.match(result.selectionReason, /CHEAPEST/);
  });

  it('CHEAPEST strategy filters out non-COD couriers when isCod=true', () => {
    const result = CourierSelectionService.selectCourier(sampleCouriers, {
      strategy: CourierSelectionStrategies.CHEAPEST,
      isCod: true,
    });

    // Between 101 (120) and 102 (45), 102 is cheapest COD courier
    assert.equal(result.selectedCourier.courierCompanyId, 102);
    assert.equal(result.selectedCourier.rate, 45.0);
    assert.equal(result.selectedCourier.isCodAvailable, true);
  });

  it('FASTEST strategy selects earliest delivery turnaround', () => {
    const result = CourierSelectionService.selectCourier(sampleCouriers, {
      strategy: CourierSelectionStrategies.FASTEST,
      isCod: false,
    });

    assert.equal(result.selectedCourier.courierCompanyId, 101);
    assert.equal(result.selectedCourier.estimatedDeliveryDays, 1);
    assert.match(result.selectionReason, /FASTEST/);
  });

  it('FASTEST strategy respects COD requirement', () => {
    const result = CourierSelectionService.selectCourier(sampleCouriers, {
      strategy: CourierSelectionStrategies.FASTEST,
      isCod: true,
    });

    // 101 is 1 day and supports COD
    assert.equal(result.selectedCourier.courierCompanyId, 101);
  });

  it('BALANCED strategy balances speed, cost, and rating', () => {
    const result = CourierSelectionService.selectCourier(sampleCouriers, {
      strategy: CourierSelectionStrategies.BALANCED,
      weights: { cost: 0.4, speed: 0.4, rating: 0.2 },
      isCod: false,
    });

    // 103 (₹65, 2 days, 4.6 stars) offers superior composite value over 101 (₹120) and 104 (₹40, 6 days)
    assert.equal(result.selectedCourier.courierCompanyId, 103);
    assert.match(result.selectionReason, /BALANCED/);
    assert.ok(result.rankedCouriers.length > 0);
  });

  it('Manual override takes precedence over automated strategy', () => {
    const result = CourierSelectionService.selectCourier(sampleCouriers, {
      strategy: CourierSelectionStrategies.CHEAPEST,
      overrideCourierId: 101, // Manual override to pick Premium Air
      isCod: false,
    });

    assert.equal(result.selectedCourier.courierCompanyId, 101);
    assert.match(result.selectionReason, /Manual admin override/);
  });

  it('allowedCouriers whitelist filters out unapproved couriers', () => {
    const result = CourierSelectionService.selectCourier(sampleCouriers, {
      strategy: CourierSelectionStrategies.CHEAPEST,
      allowedCouriers: ['101', '102'], // Only 101 and 102 allowed
      isCod: false,
    });

    assert.equal(result.selectedCourier.courierCompanyId, 102);
  });

  it('Throws AppError when no eligible courier is available', () => {
    assert.throws(
      () => {
        CourierSelectionService.selectCourier([], { strategy: CourierSelectionStrategies.BALANCED });
      },
      {
        message: /No eligible courier service available/,
      }
    );
  });
});
