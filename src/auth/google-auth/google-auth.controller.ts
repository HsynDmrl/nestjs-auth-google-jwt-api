import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Google Auth')
@Controller('auth/google')
export class GoogleAuthController {
  constructor(private authService: AuthService) {}

  @Get()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google ile Giriş', description: 'Google kimlik doğrulamasını başlatır.' })
  async googleAuth(@Req() req) {
    // Bu metot sadece yönlendirmeyi başlatır
  }

  @Get('redirect')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google Yönlendirme', description: 'Google kimlik doğrulaması sonrası yönlendirmeyi işler.' })
  @ApiResponse({ status: 200, description: 'Google ile giriş başarılı.' })
  @ApiResponse({ status: 401, description: 'Google kimlik doğrulaması başarısız.' })
  async googleAuthRedirect(@Req() req) {
    return this.authService.googleLogin(req);
  }
}
