import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Gerekli izinleri al
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    console.log('Required Permissions:', requiredPermissions);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Kullanıcıyı request'ten al
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    console.log('User from Request:', user);

    if (!user || !user.id) {
      console.error('User verification failed:', user);
      throw new UnauthorizedException('Kullanıcı doğrulanamadı.');
    }

    // Kullanıcıyı veritabanından al
    const foundUser = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['roles', 'roles.permissions'],
    });
    console.log('Found User in DB:', foundUser);

    if (!foundUser) {
      console.error('User not found in DB');
      throw new UnauthorizedException('Kullanıcı bulunamadı.');
    }

    if (!foundUser.roles || foundUser.roles.length === 0) {
      console.error('User has no roles:', foundUser.roles);
      throw new UnauthorizedException('Kullanıcının rolü bulunamadı.');
    }

    // Kullanıcı izinlerini kontrol et
    const userPermissions = new Set<string>();
    foundUser.roles.forEach((role: Role) => {
      role.permissions.forEach(permission => {
        userPermissions.add(permission.name);
      });
    });
    console.log('User Permissions:', userPermissions);

    const hasPermission = requiredPermissions.every(permission => userPermissions.has(permission));
    if (!hasPermission) {
      console.error('User lacks required permissions:', requiredPermissions);
      throw new UnauthorizedException('Bu işlemi gerçekleştirmek için gerekli izinlere sahip değilsiniz.');
    }

    return true;
  }
}
