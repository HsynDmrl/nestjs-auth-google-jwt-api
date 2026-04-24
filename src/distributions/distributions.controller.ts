import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DistributeTipSessionDto } from './dto/distribute-tip-session.dto';
import {
  DistributionResult,
  DistributionsService,
} from './distributions.service';

@ApiTags('Distributions')
@Controller('distributions')
export class DistributionsController {
  constructor(private readonly distributionsService: DistributionsService) {}

  @Post('run')
  @ApiOperation({ summary: 'Tip oturumunu dağıtır ve oturumu kapatır.' })
  distribute(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    distributeTipSessionDto: DistributeTipSessionDto,
  ): Promise<DistributionResult> {
    return this.distributionsService.distribute(distributeTipSessionDto);
  }
}
