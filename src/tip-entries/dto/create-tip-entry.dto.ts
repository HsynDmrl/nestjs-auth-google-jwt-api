import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateTipEntryDto {
  @IsUUID('4')
  @ApiProperty({
    description: 'Tip kaydının bağlı olacağı oturum ID',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  readonly tipSessionId: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  @ApiProperty({
    description: 'Para birimi kodu (ISO-4217)',
    example: 'EUR',
  })
  readonly currencyCode: string;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  @ApiProperty({
    description:
      'Kutuya giren tutar (en küçük para birimi: kuruş/cent). Float kullanılmaz.',
    example: 1250,
  })
  readonly amountMinorUnit: number;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  @ApiPropertyOptional({
    description: 'Opsiyonel açıklama notu',
    example: 'Gece vardiyası kapanış sayımı',
  })
  readonly note?: string;
}
