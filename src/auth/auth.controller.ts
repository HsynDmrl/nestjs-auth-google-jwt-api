import { Controller, Post, Body, Req, UseGuards, Param, Get, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { ChangePasswordDto } from './dto/requests/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth-guard/jwt-auth.guard';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { PermissionsGuard } from './guards/permissions/permissions.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { LoginResponseDto } from 'src/users/dto/responses/login-response.dto';
import { LoginUserDto } from 'src/users/dto/requests/login-user.dto';
import { RegisterResponseDto } from './dto/responses/register-response.dto';
import { RefreshTokenDto } from './dto/requests/refresh-token.dto';
import { RefreshTokensResponseDto } from './dto/responses/refresh-tokens-response.dto';
import { ConfirmEmailResponseDto } from './dto/responses/confirm-email-response.dto';
import { ChangePasswordResponseDto } from './dto/responses/change-password-response.dto';
import { ForgotPasswordResponseDto } from './dto/responses/forgot-password-response.dto';
import { ForgotPasswordDto } from './dto/requests/forgot-password.dto';
import { ResetPasswordResponseDto } from './dto/responses/reset-password-response.dto';
import { ResetPasswordDto } from './dto/requests/reset-password.dto';
import { RegisterUserDto } from './dto/requests/register-user.dto';

@ApiBearerAuth('access-token')
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Kullanıcı Girişi', description: 'E-posta ve şifre kullanarak kullanıcı girişi yapar.' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({ status: 200, description: 'Giriş başarılı.' })
  @ApiResponse({ status: 401, description: 'Geçersiz kimlik bilgileri.' })
  async login(@Req() req, @Body() loginRequestDto: LoginUserDto): Promise<LoginResponseDto> {
    const ipAddress = req.ip;
    return this.authService.login(loginRequestDto, ipAddress, req);
  }

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Kullanıcı Kaydı', description: 'Yeni bir kullanıcı kaydı oluşturur.' })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({ status: 201, description: 'Kayıt başarılı.' })
  @ApiResponse({ status: 400, description: 'Geçersiz giriş verileri.' })
  async register(@Body() registerUserDto: RegisterUserDto): Promise<RegisterResponseDto> {
    return this.authService.register(registerUserDto);
  }

  @Post('refresh')
  @HttpCode(200)
  @Permissions('user_refresh_token')
  @ApiOperation({ summary: 'Token Yenileme', description: 'Refresh token kullanarak access token yeniler.' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, type: RefreshTokensResponseDto, description: 'Token yenileme başarılı.' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim.' })
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() request: any
  ): Promise<RefreshTokensResponseDto> {
  return this.authService.refreshTokens(refreshTokenDto, request);
  }

  @Get('confirm/:token')
  @HttpCode(200)
  @ApiOperation({ summary: 'E-posta Doğrulama', description: 'E-posta doğrulama tokeni ile kullanıcı hesabını doğrular.' })
  @ApiParam({ name: 'token', description: 'E-posta doğrulama tokeni', example: 'token123' })
  @ApiResponse({ status: 200, description: 'E-posta doğrulama başarılı.' })
  @ApiResponse({ status: 400, description: 'Geçersiz veya süresi dolmuş token.' })
  async confirmEmail(@Param('token') token: string): Promise<ConfirmEmailResponseDto> {
    return this.authService.confirmEmail(token);
  }

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user_change_password')
  @ApiOperation({ summary: 'Şifre Değiştirme', description: 'Kullanıcı şifresini değiştirir.' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, type: ChangePasswordResponseDto, description: 'Şifre değiştirme başarılı.' })
  @ApiResponse({ status: 400, description: 'Geçersiz giriş verileri.' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim.' })
  async changePassword(@Req() req, @Body() changePasswordDto: ChangePasswordDto): Promise<ChangePasswordResponseDto> {
    const userId = req.user.id;
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Şifre Sıfırlama Talebi', description: 'Kullanıcı şifresini sıfırlamak için e-posta gönderir.' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Şifre sıfırlama e-postası gönderildi.' })
  @ApiResponse({ status: 400, description: 'Geçersiz e-posta adresi.' })
  async forgotPassword(@Body('email') email: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    return this.authService.forgotPassword(email.email);
  }

  @Post('reset-password/:token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Şifre Sıfırlama', description: 'Şifre sıfırlama tokeni ile yeni bir şifre belirler.' })
  @ApiParam({ name: 'token', description: 'Şifre sıfırlama tokeni', example: 'resetToken123' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Şifre sıfırlama başarılı.' })
  @ApiResponse({ status: 400, description: 'Geçersiz veya süresi dolmuş token.' })
  async resetPassword(@Param('token') token: string, @Body('newPassword') newPassword: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    return this.authService.resetPassword(token, newPassword.newPassword);
  }
}
