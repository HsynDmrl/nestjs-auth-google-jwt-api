import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsCurrencyMinorUnitMap', async: false })
export class IsCurrencyMinorUnitMapConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null) {
      return true;
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    const entries = Object.entries(value as Record<string, unknown>);

    return entries.every(([currency, amount]) => {
      if (!/^[A-Z]{3}$/.test(currency)) {
        return false;
      }

      return Number.isSafeInteger(amount) && Number(amount) >= 0;
    });
  }

  defaultMessage(): string {
    return 'Para birimi haritasında anahtarlar ISO-4217 (örn: TRY, USD) ve değerler negatif olmayan tam sayı olmalıdır.';
  }
}

export function IsCurrencyMinorUnitMap(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCurrencyMinorUnitMapConstraint,
    });
  };
}
