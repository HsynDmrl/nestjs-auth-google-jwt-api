import { Injectable, HttpException, HttpStatus  } from '@nestjs/common';
import * as requestIp from 'request-ip';
import * as geoip from 'geoip-lite';
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
  ) {}

  async validateUser(email: string, pass: string, request: any): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    const ipAddress = requestIp.getClientIp(request) === '::1' ? '127.0.0.1' : requestIp.getClientIp(request);

    if (!request.session) {
        request.session = {};
    }

    if (!request.session.loggedIn) {
        const geo = geoip.lookup(ipAddress) || { country: '', city: '' };
        const country = geo.country || 'Unknown';
        const city = geo.city || 'Unknown';

        if (!user || user.deletedAt) {
            await this.logFailedAttempt(user, ipAddress, country, city, 'User is inactive or not found');
            throw new HttpException('User is inactive or not found', HttpStatus.UNAUTHORIZED);
        }

        if (!user.emailConfirmed) {
            await this.logFailedAttempt(user, ipAddress, country, city, 'Email not confirmed');
            throw new HttpException('Email not confirmed', HttpStatus.FORBIDDEN);
        }

        const isPasswordMatching = await bcrypt.compare(pass, user.password);
        if (!isPasswordMatching) {
            await this.logFailedAttempt(user, ipAddress, country, city, 'Invalid credentials');
            throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
        }

        await this.logSuccessfulAttempt(user, ipAddress, country, city);
        request.session.loggedIn = true;
    }

    const { password, ...result } = user;
    return result;
}


  
  


private async logSuccessfulAttempt(user: any, ipAddress: string, country: string, city: string) {
  ipAddress = ipAddress || '127.0.0.1';  // Null kontrolü
  console.log('logSuccessfulAttempt - IP:', ipAddress, 'Country:', country, 'City:', city, 'User:', user);

  await this.auditLogService.logActivity(
    user,
    'login',
    AuditLogType.SUCCESS,
    ipAddress,
    country,
    city,
  );
}


private async logFailedAttempt(user: any, ipAddress: string, country: string, city: string, reason: string) {
  ipAddress = ipAddress || '127.0.0.1';  // Null kontrolü
  console.log('logFailedAttempt - IP:', ipAddress, 'Country:', country, 'City:', city, 'User:', user);

  await this.auditLogService.logActivity(
    user,
    `login_failed: ${reason}`,
    AuditLogType.FAILURE,
    ipAddress,
    country,
    city,
  );
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
    
    // E-posta gönderme işlemi
    const confirmationUrl = `${process.env.APP_URL}/auth/confirm/${emailConfirmation.token}`;
    await this.emailService.sendEmail(
      savedUser.email,
      'Confirm your email',
      `Please confirm your email by clicking on the following link: ${confirmationUrl}`,
      `<p>Please confirm your email by clicking on the following link: <a href="${confirmationUrl}">Confirm Email</a></p>`
    );
  
    return { message: 'User registered. Please confirm your email.' }; // Sadece onay mesajı döndürülüyor
  }
  

  async confirmEmail(token: string): Promise<any> {
    const user = await this.emailConfirmationService.confirmEmail(token);
  
    // Kullanıcının e-posta onayı yapılmış olarak işaretlenmesi
    user.emailConfirmed = true;
    await this.usersService.save(user);  // Burada save işlemi yapılıyor olmalı
  
    return { message: 'Email confirmed successfully. You can now log in.' };
  }
  
  
  async login(user: any, ip: string, country: string, city: string) {
    if (!user.loggedIn) {
      const payload = { id: user.id, email: user.email, roles: user.roles };
      const accessToken = this.jwtService.sign(payload);
  
      const refreshToken = await this.refreshTokenService.generateRefreshToken(user);
  
      // Başarılı login loglama
      await this.logSuccessfulAttempt(user, ip, country, city);
      user.loggedIn = true;  // Girişin kaydedildiğini işaretleyin
  
      return {
        accessToken,
        refreshToken: refreshToken.token,
      };
    } else {
      throw new HttpException('User already logged in', HttpStatus.BAD_REQUEST);
    }
  }
  
  

  async refreshTokens(refreshToken: string, userId: string, accessToken: string, ip: string, country: string, city: string) {
    // Refresh token'ı doğrula
    const validRefreshToken = await this.refreshTokenService.validateRefreshToken(refreshToken);

    if (!validRefreshToken || validRefreshToken.user.id !== userId) {
      // Başarısız token yenileme loglama
      await this.logFailedAttempt(validRefreshToken?.user, ip, country, city, 'Invalid refresh token');
      throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }

    // Access token'ı doğrula
    try {
      this.jwtService.verify(accessToken, { ignoreExpiration: true });
    } catch (error) {
      // Başarısız token yenileme loglama
      await this.logFailedAttempt(validRefreshToken.user, ip, country, city, 'Invalid access token');
      throw new HttpException('Invalid access token', HttpStatus.UNAUTHORIZED);
    }

    const user = validRefreshToken.user;

    // Refresh token'ı iptal et
    await this.refreshTokenService.revokeRefreshToken(refreshToken);

    // Yeni access ve refresh token döndür
    await this.logSuccessfulAttempt(user, ip, country, city);

    return this.login(user, ip, country, city);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<any> {
    const user = await this.usersService.findOneById(userId);

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const isPasswordMatching = await bcrypt.compare(changePasswordDto.currentPassword, user.password);

    if (!isPasswordMatching) {
      throw new HttpException('Current password is incorrect', HttpStatus.UNAUTHORIZED);
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.password = hashedPassword;
    await this.usersService.save(user);

    // Şifre değişikliği bildirim e-postası gönder
    await this.emailService.sendEmail(
      user.email,
      'Password Change Notification',
      `Dear ${user.name}, your password has been successfully changed.`,
      `<p>Dear ${user.name},</p><p>Your password has been successfully changed.</p><p>If you did not initiate this change, please contact support immediately.</p>`
    );

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(email: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const passwordReset = await this.passwordResetService.createPasswordResetToken(user);

    // Şifre sıfırlama bağlantısını e-posta ile gönder
    const resetUrl = `${process.env.APP_URL}/auth/reset-password/${passwordReset.token}`;
    await this.emailService.sendEmail(
      user.email,
      'Password Reset Request',
      `You requested a password reset. Please click the link to reset your password: ${resetUrl}`,
      `<p>You requested a password reset. Please click the link to reset your password: <a href="${resetUrl}">Reset Password</a></p>`
    );

    return { message: 'Password reset link sent to your email' };
  }

  async resetPassword(token: string, newPassword: string): Promise<any> {
    if (!newPassword) {
      throw new HttpException('New password is required', HttpStatus.BAD_REQUEST);
    }
  
    const passwordReset = await this.passwordResetService.validateResetToken(token);
  
    if (!passwordReset || !passwordReset.user) {
      throw new HttpException('Invalid reset token or user not found', HttpStatus.BAD_REQUEST);
    }
  
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    passwordReset.user.password = hashedPassword;
    await this.usersService.save(passwordReset.user);
  
    await this.passwordResetService.markTokenAsUsed(token);
  
    // Şifre sıfırlama işlemi sonrası bilgi e-postası gönder
    await this.emailService.sendEmail(
      passwordReset.user.email,
      'Password Reset Confirmation',
      `Dear ${passwordReset.user.name}, your password has been successfully reset.`,
      `<p>Dear ${passwordReset.user.name},</p><p>Your password has been successfully reset.</p><p>If you did not initiate this change, please contact support immediately.</p>`
    );
  
    return { message: 'Password reset successful' };
  }

  async googleLogin(req) {
    if (!req.user || !req.user.email) {
      throw new HttpException('Google login failed, email is required', HttpStatus.BAD_REQUEST);
    }
  
    let user = await this.usersService.findOneByEmail(req.user.email);

    // Kullanıcı soft delete yapılmışsa
    if (user && user.deletedAt) {
      throw new HttpException('User is inactive or not found', HttpStatus.UNAUTHORIZED);
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
      message: 'User information from Google',
      user,
      accessToken: this.jwtService.sign({ id: user.id, email: user.email }),
    };
  }
  
  
  
  
  
  

  
}