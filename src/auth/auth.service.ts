import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dto/create-user.dto/create-user.dto';
import { Role } from 'src/entities/role.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshTokenService } from './refresh-token/refresh-token.service';
import { EmailConfirmationService } from './email-confirmation/email-confirmation.service';
import { EmailService } from './email/email.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PasswordResetService } from './password-reset/password-reset.service';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { AuditLogType } from 'src/entities/audit-log.entity';

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
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);

    // Kullanıcı bulunamazsa veya soft delete yapılmışsa
    if (!user || user.deletedAt) {
      if (user) {
        await this.auditLogService.logFailedLogin(user); // Başarısız giriş denemesi kaydediliyor
      }
      throw new HttpException('Kullanıcı pasif durumda veya bulunamadı', HttpStatus.UNAUTHORIZED);
    }

    // E-posta doğrulanmamışsa
    if (!user.emailConfirmed) {
      await this.auditLogService.logFailedLogin(user); // Başarısız giriş denemesi kaydediliyor
      throw new HttpException('E-posta doğrulanmamış', HttpStatus.FORBIDDEN);
    }

    // Şifre yanlışsa
    const isPasswordMatching = await bcrypt.compare(pass, user.password);
    if (!isPasswordMatching) {
      await this.auditLogService.logFailedLogin(user); // Başarısız giriş denemesi kaydediliyor
      throw new HttpException('Geçersiz kimlik bilgileri', HttpStatus.UNAUTHORIZED);
    }

    // Giriş başarılı, şifreyi dışarıda bırakarak kullanıcıyı döndür
    const { password, ...result } = user;
    return result;
  }

  async register(createUserDto: CreateUserDto): Promise<any> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const userRole = await this.roleRepository.findOne({ where: { name: 'user' } });

    const newUser = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });

    newUser.roles = [userRole];
    const savedUser = await this.usersService.save(newUser);

    const emailConfirmation = await this.emailConfirmationService.generateConfirmation(savedUser);

    // Dinamik onay URL'sini oluştur
    const confirmationUrl = `${process.env.APP_URL}/auth/confirm/${emailConfirmation.token}`;

    // E-posta gönderme işlemi
    await this.emailService.sendEmail(
      savedUser.email,
      'E-postanızı doğrulayın',
      'welcome-message', // Şablon adını buraya ekleyin
      { username: savedUser.name, confirmationUrl: confirmationUrl }
    );

    return { message: 'Kullanıcı kaydedildi. Lütfen e-postanızı doğrulayın.' };
  }

  async confirmEmail(token: string): Promise<any> {
    const user = await this.emailConfirmationService.confirmEmail(token);

    // Kullanıcının e-posta onayı yapılmış olarak işaretlenmesi
    user.emailConfirmed = true;
    await this.usersService.save(user);  // Burada save işlemi yapılıyor olmalı

    return { message: 'E-posta başarıyla doğrulandı. Artık giriş yapabilirsiniz.' };
  }

  async login(user: any, request: any) {
    const payload = { id: user.id, email: user.email, roles: user.roles };
    const accessToken = this.jwtService.sign(payload);

    const refreshToken = await this.refreshTokenService.generateRefreshToken(user);

    // Kullanıcı aktivitesini loglama
    await this.auditLogService.logUserActivity(user, request, AuditLogType.SUCCESS);

    return {
      accessToken,
      refreshToken: refreshToken.token,
    };
  }

  async refreshTokens(refreshToken: string, userId: string, accessToken: string, request: any = null): Promise<any> {
    // Refresh token'ı doğrula
    const validRefreshToken = await this.refreshTokenService.validateRefreshToken(refreshToken);

    if (!validRefreshToken || validRefreshToken.user.id !== userId) {
      throw new HttpException('Geçersiz refresh token', HttpStatus.UNAUTHORIZED);
    }

    // Access token'ı doğrula
    try {
      this.jwtService.verify(accessToken, { ignoreExpiration: true });
    } catch (error) {
      throw new HttpException('Geçersiz access token', HttpStatus.UNAUTHORIZED);
    }

    const user = validRefreshToken.user;

    // Refresh token'ı iptal et
    await this.refreshTokenService.revokeRefreshToken(refreshToken);

    // Yeni access ve refresh token döndür, request null olarak geçiliyor
    return this.login(user, request);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<any> {
    const user = await this.usersService.findOneById(userId);

    if (!user) {
      throw new HttpException('Kullanıcı bulunamadı', HttpStatus.NOT_FOUND);
    }

    const isPasswordMatching = await bcrypt.compare(changePasswordDto.currentPassword, user.password);

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
      { username: user.name }
    );

    return { message: 'Şifre başarıyla değiştirildi' };
  }

  async forgotPassword(email: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new HttpException('Kullanıcı bulunamadı', HttpStatus.NOT_FOUND);
    }

    const passwordReset = await this.passwordResetService.createPasswordResetToken(user);

    // Dinamik şifre sıfırlama URL'sini oluştur
    const resetUrl = `${process.env.APP_URL}/auth/reset-password/${passwordReset.token}`;

    // E-posta gönderme işlemi
    await this.emailService.sendEmail(
      user.email,
      'Şifre Sıfırlama Talebi',
      'forgot-password',
      { username: user.name, resetUrl: resetUrl }
    );

    return { message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi' };
  }

  async resetPassword(token: string, newPassword: string): Promise<any> {
    if (!newPassword) {
      throw new HttpException('Yeni şifre gerekli', HttpStatus.BAD_REQUEST);
    }

    const passwordReset = await this.passwordResetService.validateResetToken(token);

    if (!passwordReset || passwordReset.user === null) {
      throw new HttpException('Geçersiz şifre sıfırlama tokenı veya kullanıcı bulunamadı', HttpStatus.BAD_REQUEST);
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
      { username: passwordReset.user.name }
    );

    return { message: 'Şifre sıfırlama başarılı' };
  }

  async googleLogin(req) {
    if (!req.user || !req.user.email) {
      throw new HttpException('Google ile giriş başarısız oldu, e-posta gerekli', HttpStatus.BAD_REQUEST);
    }

    let user = await this.usersService.findOneByEmail(req.user.email);

    // Kullanıcı soft delete yapılmışsa
    if (user && user.deletedAt) {
      throw new HttpException('Kullanıcı pasif durumda veya bulunamadı', HttpStatus.UNAUTHORIZED);
    }

    if (!user) {
      const userRole = await this.roleRepository.findOne({ where: { name: 'user' } });

      const newUser = await this.usersService.create({
        email: req.user.email,
        name: req.user.firstName,
        surname: req.user.lastName,
        password: null,
        emailConfirmed: true,
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
}
