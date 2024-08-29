import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'src/entities/role.entity';
import { RefreshToken } from 'src/entities/refresh-token.entity';
import { RefreshTokenModule } from './refresh-token/refresh-token.module';
import { EmailConfirmationModule } from './email-confirmation/email-confirmation.module';
import { EmailService } from './email/email.service';
import { PasswordReset } from 'src/entities/password-reset.entity';
import { PasswordResetService } from './password-reset/password-reset.service';
import { GoogleAuthController } from './google-auth/google-auth.controller';
import { GoogleStrategy } from './strategies/google.strategy/google.strategy';
import { AuditLogModule } from 'src/audit-log/audit-log.module';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'google' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
    }),
    TypeOrmModule.forFeature([Role, RefreshToken, PasswordReset]),
    RefreshTokenModule,
    EmailConfirmationModule,
    AuditLogModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, GoogleStrategy, EmailService, PasswordResetService],
  controllers: [AuthController, GoogleAuthController],
  exports: [AuthService], 
})
export class AuthModule {}

