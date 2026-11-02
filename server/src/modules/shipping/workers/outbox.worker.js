import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { outboxService, OutboxEventTypes } from '../services/outbox.service.js';
import { logisticsService } from '../services/logistics.service.js';
import { shippingSettingsRepository } from '../repositories/shippingSettings.repository.js';
import { logger } from '../../../common/logger/index.js';
import { config } from '../../../config/index.js';

export class OutboxWorker {
  constructor(options = {}) {
    this.workerId = options.workerId || `worker-${os.hostname()}-${process.pid}-${uuidv4().slice(0, 6)}`;
    this.pollIntervalMs = options.pollIntervalMs || config.shipping.workerPollIntervalMs || 5000;
    this.batchSize = options.batchSize || 5;
    this.isRunning = false;
    this.timer = null;
    this.activeProcessing = false;
  }

  /**
   * Start polling loop.
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info({ workerId: this.workerId, pollIntervalMs: this.pollIntervalMs }, 'Logistics Outbox Worker started.');

    this._scheduleNext(0);
  }

  /**
   * Stop worker gracefully.
   */
  async stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    logger.info({ workerId: this.workerId }, 'Logistics Outbox Worker shutdown requested.');

    // Wait if currently processing a batch
    while (this.activeProcessing) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    logger.info({ workerId: this.workerId }, 'Logistics Outbox Worker stopped cleanly.');
  }

  _scheduleNext(delayMs = this.pollIntervalMs) {
    if (!this.isRunning) return;
    this.timer = setTimeout(() => this._poll(), delayMs);
  }

  /**
   * Process a single batch of events immediately.
   * Useful for testing, cron invocations, or CLI runs.
   */
  async processBatch() {
    const events = await outboxService.leasePendingEvents({
      batchSize: this.batchSize,
      workerId: this.workerId,
    });

    if (events.length > 0) {
      logger.info({ count: events.length }, 'Processing leased outbox events');
      for (const event of events) {
        await this._processEvent(event);
      }
    }

    return events.length;
  }

  async _poll() {
    if (!this.isRunning) return;
    this.activeProcessing = true;

    try {
      await this.processBatch();
    } catch (err) {
      logger.error({ err: err.message }, 'Unexpected error in outbox worker poll loop');
    } finally {
      this.activeProcessing = false;
      this._scheduleNext();
    }
  }

  async _processEvent(event) {
    logger.info(
      { eventId: event.id, eventType: event.eventType, aggregateId: event.aggregateId },
      'Processing outbox event'
    );

    try {
      if (event.eventType === OutboxEventTypes.ORDER_CONFIRMED_FOR_SHIPMENT) {
        const orderId = event.aggregateId;

        // Check settings to see if autoCreateShipment is enabled
        const settings = await shippingSettingsRepository.getSettings();
        if (settings.autoCreateShipment === false) {
          logger.info(
            { orderId },
            'autoCreateShipment is disabled; order awaits manual administrative courier assignment'
          );
        } else {
          await logisticsService.processOrderShipment(orderId, {
            correlationId: event.id,
          });
        }
      }

      await outboxService.markSuccess(event.id);
      logger.info({ eventId: event.id }, 'Outbox event successfully processed');
    } catch (err) {
      logger.error(
        { eventId: event.id, retryCount: event.retryCount + 1, err: err.message },
        'Failed to process outbox event'
      );
      await outboxService.markFailure(event.id, err);
    }
  }
}

// Export singleton instance for embedded server runtime
export const shippingOutboxWorker = new OutboxWorker();
