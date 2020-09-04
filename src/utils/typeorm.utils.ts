import { ValueTransformer } from 'typeorm';

function isNullOrUndefined<T>(
  obj: T | null | undefined,
): obj is null | undefined {
  return typeof obj === 'undefined' || obj === null;
}

export class ColumnNumericTransformer implements ValueTransformer {
  to(data?: number | null): number | null {
    if (!isNullOrUndefined(data)) {
      return data;
    }
    return null;
  }

  from(data?: string | null): number | null {
    if (!isNullOrUndefined(data)) {
      const res = parseFloat(data);
      // eslint-disable-next-line no-restricted-globals
      if (isNaN(res)) {
        return null;
      }
      return res;
    }
    return null;
  }
}
