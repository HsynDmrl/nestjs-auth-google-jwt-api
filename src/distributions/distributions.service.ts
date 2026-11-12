import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Distribution } from 'src/entities/distribution.entity';
import { TipSession, TipSessionStatus } from 'src/entities/tip-session.entity';
import { Repository } from 'typeorm';
import { DistributeTipSessionDto } from './dto/distribute-tip-session.dto';

export interface DistributionSummaryItem {
  currencyCode: string;
  totalMinorUnit: number;
  perPersonMinorUnit: number;
  participantCount: number;
  remainderMinorUnit: number;
}

export interface DistributionResult {
  tipSessionId: string;
  status: TipSessionStatus;
  closingCarryOverByCurrency: Record<string, number>;
  summaries: DistributionSummaryItem[];
  createdDistributionCount: number;
}

@Injectable()
export class DistributionsService {
  constructor(
    @InjectRepository(TipSession)
    private readonly tipSessionRepository: Repository<TipSession>,
    @InjectRepository(Distribution)
    private readonly distributionRepository: Repository<Distribution>,
  ) {}

  async distribute(
    distributeTipSessionDto: DistributeTipSessionDto,
  ): Promise<DistributionResult> {
    const tipSession = await this.tipSessionRepository.findOne({
      where: { id: distributeTipSessionDto.tipSessionId },
      relations: ['participants', 'tipEntries'],
    });

    if (!tipSession) {
      throw new NotFoundException('TipSession bulunamadı.');
    }

    if (tipSession.status !== TipSessionStatus.OPEN) {
      throw new BadRequestException(
        'Bu oturum daha önce dağıtılmış veya kapatılmış.',
      );
    }

    const participantCount = tipSession.participants?.length ?? 0;
    if (participantCount === 0) {
      throw new BadRequestException(
        'Dağıtım için en az bir aktif personel tanımlanmalıdır.',
      );
    }

    const currencyPools = this.buildCurrencyPools(tipSession);
    const newDistributions: Distribution[] = [];
    const closingCarryOverByCurrency: Record<string, number> = {};
    const summaries: DistributionSummaryItem[] = [];

    for (const [currencyCode, totalMinorUnit] of Object.entries(
      currencyPools,
    )) {
      if (totalMinorUnit <= 0) {
        continue;
      }

      const perPersonMinorUnit = Math.floor(totalMinorUnit / participantCount);
      const remainderMinorUnit = totalMinorUnit % participantCount;

      if (perPersonMinorUnit > 0) {
        for (const participant of tipSession.participants) {
          const distribution = this.distributionRepository.create({
            tipSession,
            user: participant,
            currencyCode,
            amountMinorUnit: perPersonMinorUnit,
          });

          newDistributions.push(distribution);
        }
      }

      if (remainderMinorUnit > 0) {
        closingCarryOverByCurrency[currencyCode] = remainderMinorUnit;
      }

      summaries.push({
        currencyCode,
        totalMinorUnit,
        perPersonMinorUnit,
        participantCount,
        remainderMinorUnit,
      });
    }

    if (newDistributions.length > 0) {
      await this.distributionRepository.save(newDistributions);
    }

    tipSession.status = TipSessionStatus.CLOSED;
    tipSession.endedAt = new Date();
    tipSession.closingCarryOverByCurrency = closingCarryOverByCurrency;
    await this.tipSessionRepository.save(tipSession);

    return {
      tipSessionId: tipSession.id,
      status: tipSession.status,
      closingCarryOverByCurrency,
      summaries,
      createdDistributionCount: newDistributions.length,
    };
  }

  private buildCurrencyPools(tipSession: TipSession): Record<string, number> {
    const currencyPools: Record<string, number> = {};

    const openingCarryOver = tipSession.openingCarryOverByCurrency ?? {};
    for (const [currencyCode, carryOverMinorUnit] of Object.entries(
      openingCarryOver,
    )) {
      if (!Number.isSafeInteger(carryOverMinorUnit) || carryOverMinorUnit < 0) {
        throw new BadRequestException(
          `Geçersiz devir bakiyesi tespit edildi: ${currencyCode}`,
        );
      }

      currencyPools[currencyCode] =
        (currencyPools[currencyCode] ?? 0) + carryOverMinorUnit;
    }

    for (const entry of tipSession.tipEntries ?? []) {
      if (
        !Number.isSafeInteger(entry.amountMinorUnit) ||
        entry.amountMinorUnit < 0
      ) {
        throw new BadRequestException(
          `Geçersiz tip girdisi tespit edildi: ${entry.id}`,
        );
      }

      const currencyCode = entry.currencyCode.toUpperCase();
      currencyPools[currencyCode] =
        (currencyPools[currencyCode] ?? 0) + entry.amountMinorUnit;
    }

    return currencyPools;
  }
}
