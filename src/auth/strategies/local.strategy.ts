import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as requestIp from 'request-ip';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passReqToCallback: true,
    });
  }

  async validate(req: any, email: string, password: string): Promise<any> {
    const ipAddress = requestIp.getClientIp(req);
    const captchaInput = req.body.captchaInput;
    const user = await this.authService.findUserAndCheckAttempts(email, password, ipAddress, captchaInput);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
