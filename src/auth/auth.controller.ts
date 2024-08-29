import { Controller, Post, Body, Req, UseGuards, Param, Get, Headers, Ip } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto/create-user.dto';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth-guard/jwt-auth.guard';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { ClientIp } from './decorators/client-ip/client-ip.decorator';
import * as geoip from 'geoip-lite';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Req() req, @ClientIp() ip: string) {
    // IP adresinden coğrafi bilgileri alıyoruz
    const geo = geoip.lookup(ip) || { country: 'Unknown', city: 'Unknown' };
    const country = geo.country || 'Unknown';
    const city = geo.city || 'Unknown';

    return this.authService.login(req.user, ip, country, city);
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refreshTokens(
    @Body('refreshToken') refreshToken: string,
    @Body('userId') userId: string,
    @Body('accessToken') accessToken: string,
    @Ip() ip: string,
    @Headers('x-country') country: string,
    @Headers('x-city') city: string
  ) {
    return this.authService.refreshTokens(refreshToken, userId, accessToken, ip, country, city);
  }

  @Get('confirm/:token')
  async confirmEmail(@Param('token') token: string) {
    return this.authService.confirmEmail(token);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user_change_password')
  async changePassword(@Req() req, @Body() changePasswordDto: ChangePasswordDto) {
    const userId = req.user.id;
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password/:token')
  async resetPassword(@Param('token') token: string, @Body('newPassword') newPassword: string) {
    return this.authService.resetPassword(token, newPassword);
  }
}
