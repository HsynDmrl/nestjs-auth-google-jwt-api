import { Controller, Post, Body, Req, UseGuards, Param, Get, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto/create-user.dto';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth-guard/jwt-auth.guard';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { PermissionsGuard } from './guards/permissions/permissions.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Kullanıcı Girişi', description: 'E-posta ve şifre kullanarak kullanıcı girişi yapar.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@admin.com', description: 'Kullanıcı e-posta adresi' },
        password: { type: 'string', example: 'admin', description: 'Kullanıcı şifresi' },
        captchaInput: { type: 'string', example: 'abcd', description: 'Captcha doğrulama kodu (opsiyonel)' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Giriş başarılı.' })
  @ApiResponse({ status: 401, description: 'Geçersiz kimlik bilgileri.' })
  async login(@Req() req, @Body('captchaInput') captchaInput?: string) {
    const ipAddress = req.ip;
    return this.authService.login(req.body.email, req.body.password, ipAddress, captchaInput, req);
  }

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Kullanıcı Kaydı', description: 'Yeni bir kullanıcı kaydı oluşturur.' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Kayıt başarılı.' })
  @ApiResponse({ status: 400, description: 'Geçersiz giriş verileri.' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user_refresh_token')
  @ApiOperation({ summary: 'Token Yenileme', description: 'Refresh token kullanarak access token yeniler.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string', example: 'xyz123', description: 'Refresh token' },
        userId: { type: 'string', example: 'user-id', description: 'Kullanıcı ID' },
        accessToken: { type: 'string', example: 'abc456', description: 'Mevcut access token' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Token yenileme başarılı.' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim.' })
  async refreshTokens(
    @Body('refreshToken') refreshToken: string,
    @Body('userId') userId: string,
    @Body('accessToken') accessToken: string,
  ) {
    return this.authService.refreshTokens(refreshToken, userId, accessToken);
  }

  @Get('confirm/:token')
  @ApiOperation({ summary: 'E-posta Doğrulama', description: 'E-posta doğrulama tokeni ile kullanıcı hesabını doğrular.' })
  @ApiParam({ name: 'token', description: 'E-posta doğrulama tokeni', example: 'token123' })
  @ApiResponse({ status: 200, description: 'E-posta doğrulama başarılı.' })
  @ApiResponse({ status: 400, description: 'Geçersiz veya süresi dolmuş token.' })
  async confirmEmail(@Param('token') token: string) {
    return this.authService.confirmEmail(token);
  }

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user_change_password')
  @ApiOperation({ summary: 'Şifre Değiştirme', description: 'Kullanıcı şifresini değiştirir.' })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Şifre değiştirme için gerekli bilgiler',
  })
  @ApiResponse({ status: 200, description: 'Şifre değiştirme başarılı.' })
  @ApiResponse({ status: 400, description: 'Geçersiz giriş verileri.' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim.' })
  async changePassword(@Req() req, @Body() changePasswordDto: ChangePasswordDto) {
    const userId = req.user.id;
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Şifre Sıfırlama Talebi', description: 'Kullanıcı şifresini sıfırlamak için e-posta gönderir.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com', description: 'Kullanıcı e-posta adresi' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Şifre sıfırlama e-postası gönderildi.' })
  @ApiResponse({ status: 400, description: 'Geçersiz e-posta adresi.' })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password/:token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Şifre Sıfırlama', description: 'Şifre sıfırlama tokeni ile yeni bir şifre belirler.' })
  @ApiParam({ name: 'token', description: 'Şifre sıfırlama tokeni', example: 'resetToken123' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newPassword: { type: 'string', example: 'NewP@ssw0rd', description: 'Yeni şifre' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Şifre sıfırlama başarılı.' })
  @ApiResponse({ status: 400, description: 'Geçersiz veya süresi dolmuş token.' })
  async resetPassword(@Param('token') token: string, @Body('newPassword') newPassword: string) {
    return this.authService.resetPassword(token, newPassword);
  }
}
