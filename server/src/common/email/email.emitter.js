import { EventEmitter } from 'events';
import { NodemailerProvider } from './providers/nodemailer.provider.js';
import { logger } from '../logger/index.js';

class EmailEmitter extends EventEmitter {}

export const emailEmitter = new EmailEmitter();

// Initialize the concrete provider (decoupled from the listener definition)
const emailProvider = new NodemailerProvider();

// Async processing listener that decouples SMTP network latency from express request cycle
emailEmitter.on('send', (options) => {
  // Use setImmediate to defer processing to the next event loop phase
  setImmediate(async () => {
    try {
      await emailProvider.sendEmail(options);
    } catch (error) {
      logger.error(
        {
          err: {
            message: error.message,
            stack: error.stack,
          },
          to: options.to,
          subject: options.subject,
        },
        '❌ Failed to send background email notification'
      );
    }
  });
});
