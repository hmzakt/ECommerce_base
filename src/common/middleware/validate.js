/**
 * Zod Validation Middleware
 *
 * Wraps a Zod schema and applies it to the incoming request.
 * If validation fails, Zod throws a ZodError which is caught by asyncHandler
 * and formatted nicely by our global errorHandler.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), controller.register);
 */

import { asyncHandler } from '../utils/asyncHandler.js';

export const validate = (schema) =>
  asyncHandler(async (req, res, next) => {
    const validatedData = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Replace request objects with validated (and potentially transformed/stripped) data
    req.body = validatedData.body;
    req.query = validatedData.query;
    req.params = validatedData.params;

    next();
  });
