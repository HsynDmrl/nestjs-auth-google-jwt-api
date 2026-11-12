import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AccountBlacklist,
  AccountBlacklistReason,
} from 'src/entities/account-blacklist.entity';
import { User } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateUserDto } from './dto/requests/create-user.dto';
import { createHash } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(AccountBlacklist)
    private blacklistRepository: Repository<AccountBlacklist>,
    private readonly dataSource: DataSource,
  ) {}

  private hashEmail(email: string): string {
    return createHash('sha256')
      .update(email.trim().toLowerCase())
      .digest('hex');
  }

  async findOneById(id: string): Promise<User | undefined> {
    return this.usersRepository.findOne({
      where: { id },
      select: ['id', 'name', 'surname', 'email', 'password', 'emailConfirmed'],
      withDeleted: true,
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: CreateUserDto): Promise<User> {
    await this.usersRepository.update(id, updateUserDto);
    return this.findOneById(id);
  }

  async softRemove(id: string): Promise<void> {
    await this.requestAccountDeletion(id);
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({
      where: { email },
      select: [
        'id',
        'name',
        'email',
        'password',
        'deletedAt',
        'emailConfirmed',
      ],
      relations: ['roles'],
      withDeleted: true,
    });
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  async isEmailBlacklisted(email: string): Promise<boolean> {
    const found = await this.blacklistRepository.findOne({
      where: { emailHash: this.hashEmail(email) },
    });
    return !!found;
  }

  async requestAccountDeletion(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    if (user.deletedAt) {
      return user;
    }

    const emailHash = this.hashEmail(user.email);
    const anonymizedEmail = `deleted+${user.id}@redacted.local`;

    return this.dataSource.transaction(async (manager) => {
      const blacklistRepo = manager.getRepository(AccountBlacklist);
      const userRepo = manager.getRepository(User);

      const existing = await blacklistRepo.findOne({
        where: { emailHash },
      });

      if (!existing) {
        await blacklistRepo.save(
          blacklistRepo.create({
            emailHash,
            originalEmail: user.email,
            reason: AccountBlacklistReason.USER_REQUESTED_DELETION,
            legalHold: true,
            metadata: {
              userId: user.id,
              deletedAt: new Date().toISOString(),
            },
          }),
        );
      }

      await userRepo.update(
        { id: user.id },
        {
          name: 'DELETED',
          surname: 'USER',
          email: anonymizedEmail,
          password: null,
          emailConfirmed: false,
        },
      );
      await userRepo.softDelete(user.id);

      return userRepo.findOne({
        where: { id: user.id },
        withDeleted: true,
      }) as Promise<User>;
    });
  }
}
