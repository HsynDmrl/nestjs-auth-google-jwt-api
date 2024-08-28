import { Controller, Get, Query, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { AdminRolesService } from './admin-roles.service';
import { Role } from 'src/entities/role.entity';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';

@Controller('admin/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminRolesController {
  constructor(private readonly adminRolesService: AdminRolesService) {}

  // Tüm aktif rolleri getirir
  @Get('active')
  @Permissions('read')
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ roles: Role[], total: number, totalPages: number }> {
    return this.adminRolesService.findAll(page, limit);
  }

  // Tüm pasif rolleri getirir
  @Get('inactive')
  @Permissions('read', 'create') // Bu endpoint'e sadece 'read' ve 'create' yetkisine sahip kullanıcılar erişebilir
  findAllInactive(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ roles: Role[], total: number, totalPages: number }> {
    return this.adminRolesService.findAllInactive(page, limit);
  }

  // Silinmiş roller de dahil olmak üzere tüm rolleri getirir
  @Get('getAll')
  //@Permissions('read')
  findAllIncludingDeleted(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ roles: Role[], total: number, totalPages: number }> {
    return this.adminRolesService.findAllIncludingDeleted(page, limit);
  }

  // Belirli bir rolü getirir
  @Get('getById/:id')
  @Permissions('read')
  findOne(@Param('id') id: string): Promise<Role> {
    return this.adminRolesService.findOne(id);
  }

  // Yeni bir rol oluşturur
  @Post('add')
  @Permissions('create') // Sadece 'create' yetkisine sahip kullanıcılar rol oluşturabilir
  create(@Body() role: Role): Promise<Role> {
    return this.adminRolesService.create(role);
  }

  // Belirli bir rolü günceller
  @Put('update/:id')
  @Permissions('update') // Sadece 'update' yetkisine sahip kullanıcılar rol güncelleyebilir
  update(@Param('id') id: string, @Body() role: Role): Promise<Role> {
    return this.adminRolesService.update(id, role);
  }

  // Belirli bir rolü pasif yapar (soft delete)
  @Delete('soft/:id')
  @Permissions('delete') // Sadece 'delete' yetkisine sahip kullanıcılar rolü pasif yapabilir
  softRemove(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminRolesService.softRemove(id);
  }

  // Belirli bir rolü geri yükler
  @Put('restore/:id')
  @Permissions('create') // Sadece 'create' yetkisine sahip kullanıcılar rolü geri yükleyebilir
  restore(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminRolesService.restore(id);
  }

  // Belirli bir rolü kalıcı olarak siler (hard delete)
  @Delete('hard/:id')
  @Permissions('delete') // Sadece 'delete' yetkisine sahip kullanıcılar rolü kalıcı olarak silebilir
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminRolesService.remove(id);
  }
}
