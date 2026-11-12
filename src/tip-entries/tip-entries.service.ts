import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TipEntry } from 'src/entities/tip-entry.entity';
import { TipSession, TipSessionStatus } from 'src/entities/tip-session.entity';
import { Repository } from 'typeorm';
import { CreateTipEntryDto } from './dto/create-tip-entry.dto';

@Injectable()
export class TipEntriesService {
  constructor(
    @InjectRepository(TipEntry)
    private readonly tipEntryRepository: Repository<TipEntry>,
    @InjectRepository(TipSession)
    private readonly tipSessionRepository: Repository<TipSession>,
  ) {}

  async create(createTipEntryDto: CreateTipEntryDto): Promise<TipEntry> {
    const tipSession = await this.tipSessionRepository.findOne({
      where: { id: createTipEntryDto.tipSessionId },
    });

    if (!tipSession) {
      throw new NotFoundException('TipSession bulunamadı.');
    }

    if (tipSession.status !== TipSessionStatus.OPEN) {
      throw new BadRequestException(
        'Kapalı bir oturuma yeni tip girdisi eklenemez.',
      );
    }

    const tipEntry = this.tipEntryRepository.create({
      tipSession,
      currencyCode: createTipEntryDto.currencyCode.toUpperCase(),
      amountMinorUnit: createTipEntryDto.amountMinorUnit,
      note: createTipEntryDto.note?.trim(),
    });

    return this.tipEntryRepository.save(tipEntry);
  }
}
