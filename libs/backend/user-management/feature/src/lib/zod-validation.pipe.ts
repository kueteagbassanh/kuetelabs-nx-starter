import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/**
 * Validates a payload against the shared zod schema, so the browser and the API
 * enforce the same contract from the same source.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(
        result.error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`),
      );
    }
    return result.data;
  }
}
