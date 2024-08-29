import { Controller, Get, Query, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { Permission } from 'src/entities/permission.entity';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  // Tüm aktif yetkileri getirir (Soft delete yapılmamış olanlar)
  @Get('active')
  @Permissions('admin_read_roles')  // Rol ve izinleri okuma yetkisi
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ permissions: Permission[], total: number, totalPages: number }> {
    return this.permissionsService.findAll(page, limit);
  }

  // Tüm pasif yetkileri getirir (Soft delete yapılmış olanlar)
  @Get('inactive')
  @Permissions('admin_read_roles')
  findAllInactive(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ permissions: Permission[], total: number, totalPages: number }> {
    return this.permissionsService.findAllInactive(page, limit);
  }

  // Silinmiş yetkiler de dahil olmak üzere tüm yetkileri getirir
  @Get('getAll')
  @Permissions('admin_read_roles')
  findAllIncludingDeleted(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ permissions: Permission[], total: number, totalPages: number }> {
    return this.permissionsService.findAllIncludingDeleted(page, limit);
  }

  // Belirli bir yetkiyi getirir
  @Get('getById/:id')
  @Permissions('admin_read_roles')
  findOne(@Param('id') id: string): Promise<Permission> {
    return this.permissionsService.findOne(id);
  }

  // Yeni bir yetki oluşturur
  @Post('add')
  @Permissions('admin_create_role')
  create(@Body() permission: Permission): Promise<Permission> {
    return this.permissionsService.create(permission);
  }

  // Belirli bir yetkiyi günceller
  @Put('update/:id')
  @Permissions('admin_edit_role')
  update(@Param('id') id: string, @Body() permission: Permission): Promise<Permission> {
    return this.permissionsService.update(id, permission);
  }

  // Belirli bir yetkiyi pasif yapar (soft delete)
  @Delete('soft/:id')
  @Permissions('admin_delete_role')
  softRemove(@Param('id') id: string): Promise<{ message: string }> {
    return this.permissionsService.softRemove(id);
  }

  // Soft delete yapılmış bir yetkiyi geri yükler
  @Put('restore/:id')
  @Permissions('admin_create_role')
  restore(@Param('id') id: string): Promise<{ message: string }> {
    return this.permissionsService.restore(id);
  }

  // Belirli bir yetkiyi kalıcı olarak siler (hard delete)
  @Delete('hard/:id')
  @Permissions('admin_delete_role')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.permissionsService.remove(id);
  }
}
