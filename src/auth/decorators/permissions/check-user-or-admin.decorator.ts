import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';

@Injectable()
export class CheckUserOrAdminGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const currentUser = request.user;

    // Kullanıcının doğrulanmış olup olmadığını kontrol ediyoruz
    if (!currentUser || !currentUser.id) {
      throw new ForbiddenException('Kullanıcı doğrulanamadı.');
    }

    // Veritabanından kullanıcıyı ve rollerini çekiyoruz
    const foundUser = await this.userRepository.findOne({
      where: { id: currentUser.id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!foundUser || !foundUser.roles || foundUser.roles.length === 0) {
      throw new ForbiddenException('Kullanıcı rolleri bulunamadı.');
    }

    const isAdmin = foundUser.roles.some(role => role.name === 'admin'); // Kullanıcının admin olup olmadığını kontrol ediyoruz

    // `userId` parametresini URL'den alıyoruz
    const resourceUserId = request.params.userId;
    const isCurrentUser = foundUser.id === resourceUserId; // Kullanıcının kendi kaydına mı erişmeye çalıştığını kontrol ediyoruz

    // Eğer kullanıcı admin değilse ve kendi kaydına erişmeye çalışmıyorsa hata fırlatıyoruz
    if (!isAdmin && !isCurrentUser) {
      throw new ForbiddenException('Bu bilgilere erişim izniniz yok.');
    }

    return true;
  }
}
