import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FailedLoginAttempt } from 'src/entities/failed-login-attempt.entity';
import { Repository } from 'typeorm';
import * as moment from 'moment';
import { CaptchaService } from 'src/captcha/captcha.service';

@Injectable()
export class FailedLoginAttemptService {
  constructor(
    @InjectRepository(FailedLoginAttempt)
    private readonly failedLoginAttemptRepository: Repository<FailedLoginAttempt>,
    private readonly captchaService: CaptchaService,
  ) {}

  async logFailedAttempt(email: string, ipAddress: string): Promise<void> {
    let attempt = await this.failedLoginAttemptRepository.findOne({
        where: { email, ipAddress },
    });

    if (attempt) {
        attempt.attemptCount += 1;
    } else {
        attempt = this.failedLoginAttemptRepository.create({
            email,
            ipAddress,
            attemptCount: 1,
            lockedUntil: null,
        });
    }

    // Eğer 3 veya 4 başarısız deneme varsa captcha zorunlu hale gelir
    if (attempt.attemptCount === 3 || attempt.attemptCount === 4) {
        const captcha = this.captchaService.generateCaptcha();
        attempt.captchaText = captcha.text;
        console.log('Yeni captchaText:', captcha.text);
    }

    //console.log('Güncellenen attempt:', attempt);

    // Engelleme süresini her 5, 10, 15 ve 20. denemede hesapla ve kaydet
    attempt.lockedUntil = this.calculateLockoutTime(attempt.attemptCount);

    await this.failedLoginAttemptRepository.save(attempt);
}


  async countFailedAttempts(email: string, ipAddress: string): Promise<FailedLoginAttempt | undefined> {
    const attempt = await this.failedLoginAttemptRepository.findOne({
      where: { email, ipAddress },
    });

    if (attempt && attempt.lockedUntil && attempt.lockedUntil > new Date()) {
      const timeRemainingInSeconds = moment(attempt.lockedUntil).diff(moment(), 'seconds');
      const timeRemainingText = timeRemainingInSeconds > 60 
        ? `${Math.ceil(timeRemainingInSeconds / 60)} dakika`
        : `${timeRemainingInSeconds} saniye`;

      throw new HttpException(`Çok fazla başarısız giriş denemesi. Lütfen ${timeRemainingText} sonra tekrar deneyin.`, HttpStatus.TOO_MANY_REQUESTS);
    }

    if (attempt && attempt.lockedUntil && attempt.lockedUntil <= new Date()) {
      attempt.lockedUntil = null;
      await this.failedLoginAttemptRepository.save(attempt);
    }

    return attempt;
  }

  async clearFailedAttempts(email: string, ipAddress: string): Promise<void> {
    await this.failedLoginAttemptRepository.delete({ email, ipAddress });
  }

  private calculateLockoutTime(attemptCount: number): Date | null {
    let lockoutDuration = 0; // dakika cinsinden

    if (attemptCount >= 20) {
      lockoutDuration = 1440; // 1440 dakika = 24 saat (1 gün)
    } else if (attemptCount >= 15) {
      lockoutDuration = 60; // 60 dakika = 1 saat
    } else if (attemptCount >= 10) {
      lockoutDuration = 30; // 30 dakika
    } else if (attemptCount >= 5) {
      lockoutDuration = 10; // 10 dakika
    }

    // Sadece 5, 10, 15 ve 20. denemelerde süreyi güncelle
    if (attemptCount === 5 || attemptCount === 10 || attemptCount === 15 || attemptCount === 20) {
      return moment().add(lockoutDuration, 'minutes').toDate();
    }

    return null;
  }
}
