import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordReset } from 'src/entities/password-reset.entity';
import { User } from 'src/entities/user.entity';
import * as dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordReset)
    private passwordResetRepository: Repository<PasswordReset>,
  ) {}

  async createPasswordResetToken(user: User): Promise<PasswordReset> {
    const passwordReset = this.passwordResetRepository.create({
      token: uuidv4(),
      expiresAt: dayjs().add(1, 'hour').toDate(),
      user,
    });

    return this.passwordResetRepository.save(passwordReset);
  }

  async validateResetToken(token: string): Promise<PasswordReset> {
    const passwordReset = await this.passwordResetRepository.findOne({
      where: { token, used: false },
      relations: ['user'],
    });

    if (!passwordReset || passwordReset.expiresAt < new Date()) {
      throw new Error('Invalid or expired reset token');
    }

    return passwordReset;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    const passwordReset = await this.passwordResetRepository.findOne({ where: { token } });

    if (passwordReset) {
      passwordReset.used = true;
      await this.passwordResetRepository.save(passwordReset);
    }
  }
}
