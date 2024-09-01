import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FailedLoginAttempt } from 'src/entities/failed-login-attempt.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FailedLoginAttemptService {
  constructor(
    @InjectRepository(FailedLoginAttempt)
    private readonly failedLoginAttemptRepository: Repository<FailedLoginAttempt>,
  ) {}

  async logFailedAttempt(email: string, ipAddress: string): Promise<void> {
    let attempt = await this.failedLoginAttemptRepository.findOne({
      where: { email, ipAddress },
    });

    if (attempt) {
      // Eğer kayıt varsa, deneme sayısını artır
      attempt.attemptCount += 1;
    } else {
      // Eğer kayıt yoksa, yeni bir giriş oluştur
      attempt = this.failedLoginAttemptRepository.create({
        email,
        ipAddress,
        attemptCount: 1,
      });
    }

    await this.failedLoginAttemptRepository.save(attempt);
  }

  async countFailedAttempts(email: string, ipAddress: string): Promise<number> {
    const attempt = await this.failedLoginAttemptRepository.findOne({
      where: { email, ipAddress },
    });

    return attempt ? attempt.attemptCount : 0;
  }

  async clearFailedAttempts(email: string, ipAddress: string): Promise<void> {
    await this.failedLoginAttemptRepository.delete({ email, ipAddress });
  }
}
