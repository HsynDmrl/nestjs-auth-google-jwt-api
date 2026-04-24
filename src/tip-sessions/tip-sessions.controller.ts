import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';
import { BranchContextGuard } from 'src/tenancy/guards/branch-context.guard';
import { RequestWithTenantContext } from 'src/tenancy/interfaces/tenant-context.interface';
import { CreateTipSessionDto } from './dto/create-tip-session.dto';
import { TipSessionsService } from './tip-sessions.service';
import { TipSession } from 'src/entities/tip-session.entity';

@ApiBearerAuth('access-token')
@ApiTags('Tip Sessions')
@Controller('tip-sessions')
export class TipSessionsController {
  constructor(private readonly tipSessionsService: TipSessionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, BranchContextGuard)
  @ApiHeader({
    name: 'x-branch-id',
    required: true,
    description: 'Aktif şube kimliği',
  })
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
    @Req() request: RequestWithTenantContext,
  ): Promise<TipSession> {
    if (request.tenantContext?.branchId !== createTipSessionDto.branchId) {
      throw new ForbiddenException(
        'İstek şube contexti ile payload branchId uyuşmuyor.',
      );
    }
    return this.tipSessionsService.create(createTipSessionDto);
  }

  @Get(':sessionId')
  @UseGuards(JwtAuthGuard, BranchContextGuard)
  @ApiOperation({ summary: 'Tip oturumunu detaylarıyla getirir.' })
  findOne(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Req() request: RequestWithTenantContext,
  ): Promise<TipSession> {
    return this.tipSessionsService.findOneById(
      sessionId,
      request.tenantContext?.branchId,
    );
  }
}
