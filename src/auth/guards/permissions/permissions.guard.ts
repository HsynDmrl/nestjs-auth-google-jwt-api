import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('Kullanıcı doğrulanamadı.');
    }

    const foundUser = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!foundUser || !foundUser.roles || foundUser.roles.length === 0) {
      throw new UnauthorizedException('Kullanıcının rolü bulunamadı.');
    }

    const userPermissions = new Set<string>();
    foundUser.roles.forEach((role) => {
      role.permissions.forEach((permission) => {
        userPermissions.add(permission.name);
      });
    });

    // İzin kontrolü yapıyoruz
    const hasPermission = requiredPermissions.every(permission => userPermissions.has(permission));

    if (!hasPermission) {
      // Kullanıcının kendi kaydına erişmeye çalışıp çalışmadığını kontrol ediyoruz
      const resourceUserId = request.params.userId || request.params.id; // userId veya id'yi URL parametresinden alıyoruz

      if (resourceUserId && resourceUserId === user.id) {
        return true; // Kullanıcı kendi kaydına erişmeye çalışıyorsa izin veriyoruz
      }

      throw new ForbiddenException('Bu işlemi gerçekleştirmek için gerekli izinlere sahip değilsiniz.');
    }

    return true;
  }
}
