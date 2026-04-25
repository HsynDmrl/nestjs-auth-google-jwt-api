import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from 'src/entities/refresh-token.entity';
import { User } from 'src/entities/user.entity';
import dayjs from 'dayjs';
import { createHash, randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface RefreshTokenPair {
  token: string;
  entity: RefreshToken;
}

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private createRawToken(): string {
    return randomBytes(64).toString('hex');
  }

  async generateRefreshToken(
    user: User,
    deviceId: string,
    familyId?: string,
  ): Promise<RefreshTokenPair> {
    const rawToken = this.createRawToken();
    const refreshToken = this.refreshTokenRepository.create({
      tokenHash: this.hashToken(rawToken),
      deviceId,
      familyId: familyId ?? uuidv4(),
      expiresAt: dayjs().add(7, 'days').toDate(),
      user,
    });

    const entity = await this.refreshTokenRepository.save(refreshToken);
    return { token: rawToken, entity };
  }

  async validateRefreshToken(
    token: string,
    deviceId: string,
  ): Promise<RefreshToken | null> {
    const tokenHash = this.hashToken(token);
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash, deviceId },
      relations: ['user', 'replacedByToken'],
    });

    if (!refreshToken) {
      return null;
    }

    if (refreshToken.revokedAt || refreshToken.expiresAt < new Date()) {
      return null;
    }

    if (refreshToken.usedAt) {
      await this.revokeTokenFamily(refreshToken.user.id, refreshToken.familyId);
      throw new UnauthorizedException(
        'Refresh token tekrar kullanıldı. Lütfen yeniden giriş yapın.',
      );
    }

    return refreshToken;
  }

  async markRefreshTokenUsed(tokenId: string): Promise<void> {
    await this.refreshTokenRepository.update(tokenId, {
      usedAt: new Date(),
    });
  }

  async linkReplacementToken(
    previousTokenId: string,
    nextTokenId: string,
  ): Promise<void> {
    await this.refreshTokenRepository.update(previousTokenId, {
      replacedByToken: { id: nextTokenId } as RefreshToken,
    });
  }

  async revokeRefreshToken(token: string, deviceId: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await this.refreshTokenRepository.update(
      { tokenHash, deviceId },
      { revokedAt: new Date() },
    );
  }

  async revokeTokenFamily(userId: string, familyId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { user: { id: userId }, familyId },
      { revokedAt: new Date() },
    );
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { user: { id: userId } },
      { revokedAt: new Date() },
    );
  }
}
