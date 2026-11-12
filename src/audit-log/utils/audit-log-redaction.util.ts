const REDACTED_VALUE = '***';
const SENSITIVE_KEYS = new Set(['password', 'accesstoken', 'refreshtoken']);

const normalizeKey = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

const shouldRedactKey = (key: string): boolean =>
  SENSITIVE_KEYS.has(normalizeKey(key));

export const redactSensitiveFields = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => redactSensitiveFields(entry));
  }

  if (value instanceof Date) {
    return value;
  }

  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
      if (shouldRedactKey(key)) {
        result[key] = REDACTED_VALUE;
      } else {
        result[key] = redactSensitiveFields(entry);
      }
    });
    return result;
  }

  return value;
};
