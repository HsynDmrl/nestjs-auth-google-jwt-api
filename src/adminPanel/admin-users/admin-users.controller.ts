import { Controller, Get, Query, Post, Body, Param, Delete, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { User } from 'src/entities/user.entity';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';
import { AuditLogInterceptor } from 'src/audit-log/audit-log.interceptor';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  // Tüm aktif kullanıcıları getirir
  @Get('active')
  @Permissions('admin_read_users')
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ users: User[], total: number, totalPages: number }> {
    return this.adminUsersService.findAll(page, limit);
  }

  // Tüm pasif kullanıcıları getirir
  @Get('inactive')
  @Permissions('admin_read_users')
  findAllInactive(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ users: User[], total: number, totalPages: number }> {
    return this.adminUsersService.findAllInactive(page, limit);
  }

  // Silinmiş kullanıcılar da dahil olmak üzere tüm kullanıcıları getirir
  @Get('getAll')
  @Permissions('admin_read_users')
  findAllIncludingDeleted(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ users: User[], total: number, totalPages: number }> {
    return this.adminUsersService.findAllIncludingDeleted(page, limit);
  }

  // Belirli bir kullanıcıyı getirir
  @Get('getById/:id')
  @Permissions('admin_read_users')
  findOne(@Param('id') id: string): Promise<User> {
    return this.adminUsersService.findOne(id);
  }

  // Yeni bir kullanıcı oluşturur
  @Post('add')
  @Permissions('admin_create_user')
  @UseInterceptors(AuditLogInterceptor)
  create(@Body() userDto: { user: User, roleIds: string[] }): Promise<User> {
    const { user, roleIds } = userDto;
    return this.adminUsersService.create(user, roleIds);
  }

  // Belirli bir kullanıcıyı günceller
  @Put('update/:id')
  @Permissions('admin_edit_user')
  @UseInterceptors(AuditLogInterceptor)
  update(@Param('id') id: string, @Body() userDto: { user: User, roleIds: string[] }): Promise<User> {
    const { user, roleIds } = userDto;
    return this.adminUsersService.update(id, user, roleIds);
  }

  // Belirli bir kullanıcıyı pasif yapar (soft delete)
  @Delete('soft/:id')
  @Permissions('admin_delete_user')
  @UseInterceptors(AuditLogInterceptor)
  async softRemove(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminUsersService.softRemove(id);
  }

  // Belirli bir kullanıcıyı geri yükler
  @Put('restore/:id')
  @Permissions('admin_create_user')
  @UseInterceptors(AuditLogInterceptor)
  async restore(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminUsersService.restore(id);
  }

  // Belirli bir kullanıcıyı kalıcı olarak siler (hard delete)
  @Delete('hard/:id')
  @Permissions('admin_delete_user')
  @UseInterceptors(AuditLogInterceptor)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminUsersService.remove(id);
  }
}
