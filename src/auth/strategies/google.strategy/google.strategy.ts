import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile, done: Function): Promise<any> {
    const { name, emails } = profile;

    if (!emails || emails.length === 0) {
      return done(new Error('Google login failed, no email provided'), false);
    }

    const user = {
      email: emails[0].value, // İlk email adresini alıyoruz
      firstName: name.givenName, // Verilen adı alıyoruz
      lastName: name.familyName, // Soyadı alıyoruz
      accessToken,
    };

    done(null, user);
  }
}