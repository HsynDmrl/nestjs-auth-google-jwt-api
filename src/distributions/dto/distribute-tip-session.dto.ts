import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class DistributeTipSessionDto {
  @IsUUID('4')
  @ApiProperty({
    description: 'Dağıtımı yapılacak tip oturumu ID',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  readonly tipSessionId: string;
}
