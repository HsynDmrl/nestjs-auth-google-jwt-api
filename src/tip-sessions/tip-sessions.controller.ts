import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTipSessionDto } from './dto/create-tip-session.dto';
import { TipSessionsService } from './tip-sessions.service';
import { TipSession } from 'src/entities/tip-session.entity';

@ApiTags('Tip Sessions')
@Controller('tip-sessions')
export class TipSessionsController {
  constructor(private readonly tipSessionsService: TipSessionsService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni tip oturumu oluşturur.' })
  create(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    createTipSessionDto: CreateTipSessionDto,
  ): Promise<TipSession> {
    return this.tipSessionsService.create(createTipSessionDto);
  }

  @Get(':sessionId')
  @ApiOperation({ summary: 'Tip oturumunu detaylarıyla getirir.' })
  findOne(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
  ): Promise<TipSession> {
    return this.tipSessionsService.findOneById(sessionId);
  }
}
