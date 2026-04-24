import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { TipSession, TipSessionStatus } from 'src/entities/tip-session.entity';
import { In, Repository } from 'typeorm';
import { CreateTipSessionDto } from './dto/create-tip-session.dto';

@Injectable()
export class TipSessionsService {
  constructor(
    @InjectRepository(TipSession)
    private readonly tipSessionRepository: Repository<TipSession>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createTipSessionDto: CreateTipSessionDto): Promise<TipSession> {
    const participants = await this.userRepository.findBy({
      id: In(createTipSessionDto.participantUserIds),
    });

    if (participants.length !== createTipSessionDto.participantUserIds.length) {
      throw new NotFoundException(
        'Katılımcı kullanıcı listesindeki bazı kullanıcılar bulunamadı.',
      );
    }

    const latestClosedSession = await this.tipSessionRepository.findOne({
      where: { status: TipSessionStatus.CLOSED },
      order: { endedAt: 'DESC' },
    });

    const normalizedCarryOver = this.normalizeCarryOverMap(
      createTipSessionDto.openingCarryOverByCurrency ??
        latestClosedSession?.closingCarryOverByCurrency ??
        {},
    );

    const tipSession = this.tipSessionRepository.create({
      name: createTipSessionDto.name.trim(),
      startedAt: new Date(createTipSessionDto.startedAt),
      participants,
      status: TipSessionStatus.OPEN,
      openingCarryOverByCurrency: normalizedCarryOver,
      closingCarryOverByCurrency: {},
    });

    return this.tipSessionRepository.save(tipSession);
  }

  async findOneById(sessionId: string): Promise<TipSession> {
    const session = await this.tipSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['participants', 'tipEntries', 'distributions'],
    });

    if (!session) {
      throw new NotFoundException('TipSession bulunamadı.');
    }

    return session;
  }

  private normalizeCarryOverMap(
    rawMap: Record<string, number>,
  ): Record<string, number> {
    return Object.entries(rawMap).reduce(
      (accumulator, [currency, amount]) => {
        if (!Number.isSafeInteger(amount) || amount < 0) {
          throw new BadRequestException(
            `Geçersiz carry-over miktarı: ${currency}`,
          );
        }

        accumulator[currency.toUpperCase()] = Number(amount);
        return accumulator;
      },
      {} as Record<string, number>,
    );
  }
}
