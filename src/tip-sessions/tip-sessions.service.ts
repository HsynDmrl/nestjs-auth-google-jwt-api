import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { TipSession, TipSessionStatus } from 'src/entities/tip-session.entity';
import { In, Repository } from 'typeorm';
import { CreateTipSessionDto } from './dto/create-tip-session.dto';
import { Branch } from 'src/entities/branch.entity';
import { Team } from 'src/entities/team.entity';
import { Membership } from 'src/entities/membership.entity';
import { BillingService } from 'src/billing/billing.service';

@Injectable()
export class TipSessionsService {
  constructor(
    @InjectRepository(TipSession)
    private readonly tipSessionRepository: Repository<TipSession>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    private readonly billingService: BillingService,
  ) {}

  async create(createTipSessionDto: CreateTipSessionDto): Promise<TipSession> {
    const branch = await this.branchRepository.findOne({
      where: { id: createTipSessionDto.branchId },
      relations: ['company'],
    });
    if (!branch) {
      throw new NotFoundException('Şube bulunamadı.');
    }

    const team = await this.teamRepository.findOne({
      where: {
        id: createTipSessionDto.teamId,
        branch: { id: branch.id },
      },
      relations: ['branch'],
    });

    if (!team) {
      throw new NotFoundException('Takım bulunamadı veya şubeye ait değil.');
    }

    await this.billingService.assertFeatureEnabled(
      branch.company.id,
      'tipboxEnabled',
    );

    const participants = await this.userRepository.findBy({
      id: In(createTipSessionDto.participantUserIds),
    });

    if (participants.length !== createTipSessionDto.participantUserIds.length) {
      throw new NotFoundException(
        'Katılımcı kullanıcı listesindeki bazı kullanıcılar bulunamadı.',
      );
    }

    const activeMembershipCount = await this.membershipRepository.count({
      where: {
        branch: { id: branch.id },
        isActive: true,
        user: { id: In(createTipSessionDto.participantUserIds) },
      },
    });

    if (activeMembershipCount !== createTipSessionDto.participantUserIds.length) {
      throw new ForbiddenException(
        'Tip session katılımcılarının tamamı şubeye aktif üye olmalıdır.',
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
      company: branch.company,
      branch,
      team,
      name: createTipSessionDto.name.trim(),
      startedAt: new Date(createTipSessionDto.startedAt),
      participants,
      status: TipSessionStatus.OPEN,
      openingCarryOverByCurrency: normalizedCarryOver,
      closingCarryOverByCurrency: {},
    });

    return this.tipSessionRepository.save(tipSession);
  }

  async findOneById(sessionId: string, branchId?: string): Promise<TipSession> {
    const session = await this.tipSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['company', 'branch', 'team', 'participants', 'tipEntries', 'distributions'],
    });

    if (!session) {
      throw new NotFoundException('TipSession bulunamadı.');
    }

    if (branchId && session.branch.id !== branchId) {
      throw new ForbiddenException('Bu tip session farklı bir şubeye ait.');
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
