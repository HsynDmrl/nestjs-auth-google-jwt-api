import {
  ForbiddenException,
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/entities/role.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshTokenService } from './refresh-token/refresh-token.service';
import { EmailConfirmationService } from './email-confirmation/email-confirmation.service';
import { EmailService } from './email/email.service';
import { ChangePasswordDto } from './dto/requests/change-password.dto';
import { PasswordResetService } from './password-reset/password-reset.service';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { AuditLogType } from 'src/entities/audit-log.entity';
import { FailedLoginAttemptService } from 'src/failed-login-attempt/failed-login-attempt.service';
import { CaptchaService } from 'src/captcha/captcha.service';
import { LoginResponseDto } from 'src/users/dto/responses/login-response.dto';
import { RegisterResponseDto } from './dto/responses/register-response.dto';
import { RefreshTokensResponseDto } from './dto/responses/refresh-tokens-response.dto';
import { LoginUserDto } from 'src/users/dto/requests/login-user.dto';
import { ConfirmEmailResponseDto } from './dto/responses/confirm-email-response.dto';
import { ChangePasswordResponseDto } from './dto/responses/change-password-response.dto';
import { ForgotPasswordResponseDto } from './dto/responses/forgot-password-response.dto';
import { ResetPasswordResponseDto } from './dto/responses/reset-password-response.dto';
import { RefreshTokenDto } from './dto/requests/refresh-token.dto';
import { RegisterUserDto } from './dto/requests/register-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
    private emailConfirmationService: EmailConfirmationService,
    private emailService: EmailService,
    private passwordResetService: PasswordResetService,
    private auditLogService: AuditLogService,
    private failedLoginAttemptService: FailedLoginAttemptService,
    private captchaService: CaptchaService,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async login(
    loginRequestDto: LoginUserDto,
    ipAddress: string,
    deviceId: string,
    request?: any,
  ): Promise<LoginResponseDto> {
    if (!deviceId?.trim()) {
      throw new HttpException(
        'x-device-id header zorunludur.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { email, password, captchaInput } = loginRequestDto;
    const user = await this.findUserAndCheckAttempts(
      email,
      password,
      ipAddress,
      captchaInput,
    );
    if (!user) {
      throw new UnauthorizedException('Geçersiz kimlik bilgileri');
    }

    // Access token ve refresh token oluştur
    const payload = { id: user.id, email: user.email, roles: user.roles };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.refreshTokenService.generateRefreshToken(
      user,
      deviceId,
    );

    // Kullanıcı aktivitesini loglama (IP adresi burada loglanıyor)
    await this.auditLogService.logUserActivity(
      user,
      request,
      AuditLogType.SUCCESS,
    );

    return {
      accessToken,
      refreshToken: refreshToken.token,
    };
  }

  async findUserAndCheckAttempts(
    email: string,
    pass: string,
    ipAddress: string,
    captchaInput?: string,
  ): Promise<any> {
    // Rate Limiting ve engelleme durumu kontrolü
    const attempt = await this.failedLoginAttemptService.countFailedAttempts(
      email,
      ipAddress,
    );

    // 3 veya daha fazla başarısız giriş denemesi olduysa, Captcha zorunlu kıl
    if (attempt && attempt.attemptCount >= 3) {
      if (
        !captchaInput ||
        !this.captchaService.verifyCaptcha(captchaInput, attempt.captchaText)
      ) {
        throw new HttpException(
          'Captcha doğrulaması başarısız oldu.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const user = await this.usersService.findOneByEmail(email);

    if (!user || user.deletedAt) {
      if (user) {
        await this.auditLogService.logFailedLogin(user, ipAddress);
        await this.failedLoginAttemptService.logFailedAttempt(email, ipAddress);
      }
      return null;
    }

    if (!user.emailConfirmed) {
      await this.auditLogService.logFailedLogin(user, ipAddress);
      await this.failedLoginAttemptService.logFailedAttempt(email, ipAddress);
      throw new HttpException('E-posta doğrulanmamış', HttpStatus.FORBIDDEN);
    }

    const isPasswordMatching = await bcrypt.compare(pass, user.password);
    if (!isPasswordMatching) {
      await this.auditLogService.logFailedLogin(user, ipAddress);
      await this.failedLoginAttemptService.logFailedAttempt(email, ipAddress);
      throw new HttpException(
        'Geçersiz kimlik bilgileri',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.failedLoginAttemptService.clearFailedAttempts(email, ipAddress);
    return user;
  }

  async register(createUserDto: RegisterUserDto): Promise<RegisterResponseDto> {
    const isBlacklisted = await this.usersService.isEmailBlacklisted(
      createUserDto.email,
    );
    if (isBlacklisted) {
      throw new ForbiddenException(
        'Bu e-posta ile yeni hesap açılamaz. Yasal süreç nedeniyle kara listeye alınmıştır.',
      );
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const userRole = await this.roleRepository.findOne({
      where: { name: 'user' },
    });

    if (!createUserDto.kvkkConsentGiven) {
      throw new HttpException(
        'KVKK açık rızası olmadan kayıt tamamlanamaz.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!createUserDto.kvkkConsentVersion?.trim()) {
      throw new HttpException(
        'KVKK onay metin versiyonu zorunludur.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const newUser = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
      emailConfirmed: false,
      kvkkConsentGiven: true,
      kvkkConsentAt: new Date(),
      kvkkConsentVersion: createUserDto.kvkkConsentVersion.trim(),
      marketingConsentGiven: createUserDto.marketingConsentGiven ?? false,
    });

    newUser.roles = [userRole];
    const savedUser = await this.usersService.save(newUser);

    const emailConfirmation =
      await this.emailConfirmationService.generateConfirmation(savedUser);

    // Dinamik onay URL'sini oluştur
    const confirmationUrl = `${process.env.APP_URL}/auth/confirm/${emailConfirmation.token}`;

    // E-posta gönderme işlemi
    await this.emailService.sendEmail(
      savedUser.email,
      'E-postanızı doğrulayın',
      'welcome-message', // Şablon adını buraya ekleyin
      { username: savedUser.name, confirmationUrl: confirmationUrl },
    );

    return { message: 'Kullanıcı kaydedildi. Lütfen e-postanızı doğrulayın.' };
  }

  async confirmEmail(token: string): Promise<ConfirmEmailResponseDto> {
    const user = await this.emailConfirmationService.confirmEmail(token);

    // Kullanıcının e-posta onayı yapılmış olarak işaretlenmesi
    user.emailConfirmed = true;
    await this.usersService.save(user); // Burada save işlemi yapılıyor olmalı

    return {
      message: 'E-posta başarıyla doğrulandı. Artık giriş yapabilirsiniz.',
    };
  }

  async refreshTokens(
    refreshTokenDto: RefreshTokenDto,
    deviceId: string,
    request: any,
  ): Promise<RefreshTokensResponseDto> {
    if (!request) {
      throw new HttpException(
        'Geçerli bir istek objesi sağlanmadı.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!deviceId?.trim()) {
      throw new HttpException(
        'x-device-id header zorunludur.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const validRefreshToken =
      await this.refreshTokenService.validateRefreshToken(
        refreshTokenDto.refreshToken,
        deviceId,
      );

    if (!validRefreshToken) {
      throw new HttpException(
        'Geçersiz refresh token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = validRefreshToken.user;

    await this.refreshTokenService.markRefreshTokenUsed(validRefreshToken.id);

    const newRefreshToken = await this.refreshTokenService.generateRefreshToken(
      user,
      deviceId,
      validRefreshToken.familyId,
    );
    await this.refreshTokenService.linkReplacementToken(
      validRefreshToken.id,
      newRefreshToken.entity.id,
    );

    const payload = { id: user.id, email: user.email, roles: user.roles };
    const newAccessToken = this.jwtService.sign(payload);

    // Kullanıcı aktivitesini loglama (IP adresi burada loglanıyor)
    await this.auditLogService.logUserActivity(
      user,
      request,
      AuditLogType.SUCCESS,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken.token,
    };
  }

  async revokeAllUserSessions(userId: string): Promise<{ message: string }> {
    await this.refreshTokenService.revokeAllUserTokens(userId);
    return { message: 'Tüm cihaz oturumları kapatıldı.' };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    const user = await this.usersService.findOneById(userId);

    if (!user) {
      throw new HttpException('Kullanıcı bulunamadı', HttpStatus.NOT_FOUND);
    }

    const isPasswordMatching = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordMatching) {
      throw new HttpException('Mevcut şifre yanlış', HttpStatus.UNAUTHORIZED);
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.password = hashedPassword;
    await this.usersService.save(user);

    // Şifre değişikliği bildirim e-postası gönder
    await this.emailService.sendEmail(
      user.email,
      'Şifre Değişikliği Bildirimi',
      'password-changed',
      { username: user.name },
    );

    return { message: 'Şifre başarıyla değiştirildi' };
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponseDto> {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new HttpException('Kullanıcı bulunamadı', HttpStatus.NOT_FOUND);
    }

    const passwordReset =
      await this.passwordResetService.createPasswordResetToken(user);

    // Dinamik şifre sıfırlama URL'sini oluştur
    const resetUrl = `${process.env.APP_URL}/auth/reset-password/${passwordReset.token}`;

    // E-posta gönderme işlemi
    await this.emailService.sendEmail(
      user.email,
      'Şifre Sıfırlama Talebi',
      'forgot-password',
      { username: user.name, resetUrl: resetUrl },
    );

    return {
      message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<ResetPasswordResponseDto> {
    if (!newPassword) {
      throw new HttpException('Yeni şifre gerekli', HttpStatus.BAD_REQUEST);
    }

    const passwordReset =
      await this.passwordResetService.validateResetToken(token);

    if (!passwordReset || passwordReset.user === null) {
      throw new HttpException(
        'Geçersiz şifre sıfırlama tokenı veya kullanıcı bulunamadı',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    passwordReset.user.password = hashedPassword;
    await this.usersService.save(passwordReset.user);

    await this.passwordResetService.markTokenAsUsed(token);

    // Şifre sıfırlama işlemi sonrası bilgi e-postası gönder
    await this.emailService.sendEmail(
      passwordReset.user.email,
      'Şifre Sıfırlama Onayı',
      'password-reset-confirmation',
      { username: passwordReset.user.name },
    );

    return { message: 'Şifre sıfırlama başarılı' };
  }

  async googleLogin(req) {
    if (!req.user || !req.user.email) {
      throw new HttpException(
        'Google ile giriş başarısız oldu, e-posta gerekli',
        HttpStatus.BAD_REQUEST,
      );
    }

    let user = await this.usersService.findOneByEmail(req.user.email);

    // Kullanıcı soft delete yapılmışsa
    if (user && user.deletedAt) {
      throw new HttpException(
        'Kullanıcı pasif durumda veya bulunamadı',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!user) {
      const isBlacklisted = await this.usersService.isEmailBlacklisted(
        req.user.email,
      );
      if (isBlacklisted) {
        throw new ForbiddenException(
          'Bu e-posta ile yeni hesap açılamaz. Yasal süreç nedeniyle kara listeye alınmıştır.',
        );
      }

      const userRole = await this.roleRepository.findOne({
        where: { name: 'user' },
      });

      const newUser = await this.usersService.create({
        email: req.user.email,
        name: req.user.firstName,
        surname: req.user.lastName,
        password: null,
        emailConfirmed: true,
        kvkkConsentGiven: false,
        kvkkConsentAt: undefined,
        kvkkConsentVersion: undefined,
        marketingConsentGiven: false,
        roles: [userRole],
      });

      user = await this.usersService.save(newUser);
    }

    return {
      message: 'Google üzerinden kullanıcı bilgileri',
      user,
      accessToken: this.jwtService.sign({ id: user.id, email: user.email }),
    };
  }

  async deleteOwnAccount(
    userId: string,
  ): Promise<{ message: string; deletedAt: string }> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new HttpException('Kullanıcı bulunamadı', HttpStatus.NOT_FOUND);
    }

    await this.refreshTokenService.revokeAllUserTokens(userId);
    const deletedUser = await this.usersService.requestAccountDeletion(userId);

    this.auditLogService.emitLog(
      'delete_own_account',
      'User',
      userId,
      { email: user.email, name: user.name, surname: user.surname },
      { status: 'SOFT_DELETED_AND_BLACKLISTED' },
      AuditLogType.SUCCESS,
      { id: user.id, email: user.email },
    );

    return {
      message:
        'Hesabınız KVKK uyumlu şekilde silinmiştir ve yasal süreç için kayıt altına alınmıştır.',
      deletedAt:
        deletedUser.deletedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }
}
