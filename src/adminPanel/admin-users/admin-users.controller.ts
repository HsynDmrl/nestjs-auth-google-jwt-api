import { Controller, Get, Query, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { User } from 'src/entities/user.entity';

@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  // Tüm aktif kullanıcıları getirir
  @Get('active')
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ users: User[], total: number, totalPages: number }> {
    return this.adminUsersService.findAll(page, limit);
  }

  // Tüm pasif kullanıcıları getirir
  @Get('inactive')
  findAllInactive(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ users: User[], total: number, totalPages: number }> {
    return this.adminUsersService.findAllInactive(page, limit);
  }

  // Silinmiş kullanıcılar da dahil olmak üzere tüm kullanıcıları getirir
  @Get('getAll')
  findAllIncludingDeleted(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ users: User[], total: number, totalPages: number }> {
    return this.adminUsersService.findAllIncludingDeleted(page, limit);
  }

  // Belirli bir kullanıcıyı getirir
  @Get('getById/:id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.adminUsersService.findOne(id);
  }

  // Yeni bir kullanıcı oluşturur
  @Post('add')
  create(@Body() userDto: { user: User, roleIds: string[] }): Promise<User> {
    const { user, roleIds } = userDto;
    return this.adminUsersService.create(user, roleIds);
  }

  // Belirli bir kullanıcıyı günceller
  @Put('update/:id')
  update(@Param('id') id: string, @Body() userDto: { user: User, roleIds: string[] }): Promise<User> {
    const { user, roleIds } = userDto;
    return this.adminUsersService.update(id, user, roleIds);
  }

  // Belirli bir kullanıcıyı pasif yapar (soft delete)
  @Delete('soft/:id')
  async softRemove(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminUsersService.softRemove(id);
  }

  // Belirli bir kullanıcıyı geri yükler
  @Put('restore/:id')
  async restore(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminUsersService.restore(id);
  }

  // Belirli bir kullanıcıyı kalıcı olarak siler (hard delete)
  @Delete('hard/:id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminUsersService.remove(id);
  }
}
