import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailConfirmationService } from './email-confirmation.service';
import { EmailConfirmation } from 'src/entities/email-confirmation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmailConfirmation])],
  providers: [EmailConfirmationService],
  exports: [EmailConfirmationService],
})
export class EmailConfirmationModule {}
