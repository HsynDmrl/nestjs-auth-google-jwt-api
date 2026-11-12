import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TipEntry } from 'src/entities/tip-entry.entity';
import { CreateTipEntryDto } from './dto/create-tip-entry.dto';
import { TipEntriesService } from './tip-entries.service';

@ApiTags('Tip Entries')
@Controller('tip-entries')
export class TipEntriesController {
  constructor(private readonly tipEntriesService: TipEntriesService) {}

  @Post()
  @ApiOperation({ summary: 'Tip kutusuna para girişi ekler.' })
  create(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    createTipEntryDto: CreateTipEntryDto,
  ): Promise<TipEntry> {
    return this.tipEntriesService.create(createTipEntryDto);
  }
}
