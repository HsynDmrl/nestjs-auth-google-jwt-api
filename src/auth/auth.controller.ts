import { Controller, Post, Body, Req, UseGuards, Param, Get, Headers, Ip } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto/create-user.dto';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth-guard/jwt-auth.guard';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Req() req, @Body('captchaInput') captchaInput?: string) {
    const ipAddress = req.ip;
    return this.authService.login(req.body.email, req.body.password, ipAddress, captchaInput, req);
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user_refresh_token')
  async refreshTokens(
    @Body('refreshToken') refreshToken: string,
    @Body('userId') userId: string,
    @Body('accessToken') accessToken: string,
  ) {
    return this.authService.refreshTokens(refreshToken, userId, accessToken);
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
