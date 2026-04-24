import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { IsCurrencyMinorUnitMap } from 'src/common/validators/is-currency-minor-unit-map.validator';

export class CreateTipSessionDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 150)
  @ApiProperty({
    description: 'Vardiya adı',
    example: 'Akşam Vardiyası - Kasa 1',
  })
  readonly name: string;

  @IsDateString()
  @ApiProperty({
    description: 'Vardiya başlangıç zamanı (ISO-8601)',
    example: '2026-04-24T18:00:00.000Z',
  })
  readonly startedAt: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  @ApiProperty({
    description: 'Vardiyada aktif olan kullanıcı ID listesi',
    example: ['d290f1ee-6c54-4b01-90e6-d701748f0851'],
    type: [String],
  })
  readonly participantUserIds: string[];

  @IsOptional()
  @IsCurrencyMinorUnitMap()
  @ApiPropertyOptional({
    description:
      'Önceki oturumdan devreden küsuratlar. Değerler en küçük para birimindedir (kuruş/cent).',
    example: { TRY: 7, USD: 2 },
  })
  readonly openingCarryOverByCurrency?: Record<string, number>;
}
