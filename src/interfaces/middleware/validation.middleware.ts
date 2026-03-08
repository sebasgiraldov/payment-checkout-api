import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { logger } from '../../shared/utils/logger';

/**
 * Validation Middleware
 *
 * Validates request DTOs using class-validator decorators.
 * Returns 400 Bad Request with detailed validation errors if validation fails.
 *
 * **Validates: Requirements 12.1, 12.2, 12.7**
 */
export function validateDto<T extends object>(dtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Transform plain object to class instance
      const dto = plainToClass(dtoClass, req.body);

      // Validate the DTO
      const errors = await validate(dto, {
        whitelist: true, // Strip properties that don't have decorators
        forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
        skipMissingProperties: false, // Don't skip validation for missing properties
        validationError: {
          target: false, // Don't include the target object in error
          value: false, // Don't include the value in error (security)
        },
      });

      if (errors.length > 0) {
        const validationErrors = formatValidationErrors(errors);

        logger.warn('Validation failed', {
          correlationId: req.correlationId,
          method: req.method,
          path: req.path,
          errors: validationErrors,
        });

        res.status(400).json({
          error: 'Validation Failed',
          message: 'Request validation failed',
          details: validationErrors,
          timestamp: new Date().toISOString(),
          correlationId: req.correlationId,
        });
        return;
      }

      // Attach validated DTO to request
      req.body = dto;
      next();
    } catch (error) {
      logger.error('Validation middleware error', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Validation processing failed',
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    }
  };
}

/**
 * Formats validation errors into a user-friendly structure
 *
 * @param errors - Array of ValidationError objects
 * @returns Formatted error details
 */
function formatValidationErrors(errors: ValidationError[]): Array<{
  field: string;
  value: any;
  constraints: string[];
}> {
  const formattedErrors: Array<{
    field: string;
    value: any;
    constraints: string[];
  }> = [];

  function extractErrors(error: ValidationError, parentPath = ''): void {
    const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      formattedErrors.push({
        field: fieldPath,
        value: error.value,
        constraints: Object.values(error.constraints),
      });
    }

    // Handle nested validation errors
    if (error.children && error.children.length > 0) {
      error.children.forEach((child) => extractErrors(child, fieldPath));
    }
  }

  errors.forEach((error) => extractErrors(error));
  return formattedErrors;
}

export default validateDto;
