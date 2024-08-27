import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { User } from 'src/entities/user.entity';

@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  // Tüm aktif kullanıcıları getirir
  @Get('active')
  findAll(): Promise<User[]> {
    return this.adminUsersService.findAll();
  }

  // Tüm pasif kullanıcıları getirir
  @Get('inactive')
  findAllInactive(): Promise<User[]> {
    return this.adminUsersService.findAllInactive();
  }

  // Silinmiş kullanıcılar da dahil olmak üzere tüm kullanıcıları getirir
  @Get('getAll')
  findAllIncludingDeleted(): Promise<User[]> {
    return this.adminUsersService.findAllIncludingDeleted();
  }

  // Belirli bir kullanıcıyı getirir
  @Get('getById/:id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.adminUsersService.findOne(id);
  }

  // Yeni bir kullanıcı oluşturur
  @Post('add')
  create(@Body() user: User): Promise<User> {
    return this.adminUsersService.create(user);
  }

  // Belirli bir kullanıcıyı günceller
  @Put('update/:id')
  update(@Param('id') id: string, @Body() user: User): Promise<User> {
    user.id = id;
    return this.adminUsersService.create(user); 
  }

  // Belirli bir kullanıcıyı pasif yapar (soft delete)
  @Delete('soft/:id')
  softRemove(@Param('id') id: string): Promise<void> {
    return this.adminUsersService.softRemove(id);
  }

  // Belirli bir kullanıcıyı geri yükler
  @Put('restore/:id')
  restore(@Param('id') id: string): Promise<void> {
    return this.adminUsersService.restore(id);
  }

  // Belirli bir kullanıcıyı kalıcı olarak siler (hard delete)
  @Delete('hard/:id')
  remove(@Param('id') id: string): Promise<void> {
    return this.adminUsersService.remove(id);
  }
}
