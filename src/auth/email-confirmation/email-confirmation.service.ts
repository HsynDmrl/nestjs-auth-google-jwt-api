import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailConfirmation } from 'src/entities/email-confirmation.entity';
import { User } from 'src/entities/user.entity';
import * as dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EmailConfirmationService {
  constructor(
    @InjectRepository(EmailConfirmation)
    private emailConfirmationRepository: Repository<EmailConfirmation>,
  ) {}

  async generateConfirmation(user: User): Promise<EmailConfirmation> {
    const confirmation = this.emailConfirmationRepository.create({
      token: uuidv4(),
      expiresAt: dayjs().add(1, 'day').toDate(),
      user,
    });

    return this.emailConfirmationRepository.save(confirmation);
  }

  async confirmEmail(token: string): Promise<User> {
    const emailConfirmation = await this.emailConfirmationRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!emailConfirmation || emailConfirmation.expiresAt < new Date() || emailConfirmation.isConfirmed) {
      throw new Error('Invalid or expired confirmation token');
    }

    emailConfirmation.isConfirmed = true;
    await this.emailConfirmationRepository.save(emailConfirmation);

    const user = emailConfirmation.user;
    return user;
  }
}
