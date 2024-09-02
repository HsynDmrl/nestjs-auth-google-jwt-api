import { Controller, Get, Query, Post, Body, Param, Delete, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { AdminRolesService } from './admin-roles.service';
import { Role } from 'src/entities/role.entity';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';
import { AuditLogInterceptor } from 'src/audit-log/audit-log.interceptor';

@Controller('admin/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminRolesController {
  constructor(private readonly adminRolesService: AdminRolesService) {}

  // Tüm aktif rolleri getirir
  @Get('active')
  @Permissions('admin_read_roles')
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ roles: Role[], total: number, totalPages: number }> {
    return this.adminRolesService.findAll(page, limit);
  }

  // Tüm pasif rolleri getirir
  @Get('inactive')
  @Permissions('admin_read_roles')
  findAllInactive(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ roles: Role[], total: number, totalPages: number }> {
    return this.adminRolesService.findAllInactive(page, limit);
  }

  // Silinmiş roller de dahil olmak üzere tüm rolleri getirir
  @Get('getAll')
  @Permissions('admin_read_roles')
  findAllIncludingDeleted(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ roles: Role[], total: number, totalPages: number }> {
    return this.adminRolesService.findAllIncludingDeleted(page, limit);
  }

  // Belirli bir rolü getirir
  @Get('getById/:id')
  @Permissions('admin_read_roles')
  findOne(@Param('id') id: string): Promise<Role> {
    return this.adminRolesService.findOne(id);
  }

  // Yeni bir rol oluşturur
  @Post('add')
  @UseInterceptors(AuditLogInterceptor)
  @Permissions('admin_create_role')
  create(
    @Body() role: Role,
    @Body('permissionIds') permissionIds: string[]
  ): Promise<Role> {
    return this.adminRolesService.create(role, permissionIds);
  }

  // Belirli bir rolü günceller
  @Put('update/:id')
  @Permissions('admin_edit_role')
  @UseInterceptors(AuditLogInterceptor)
  update(
    @Param('id') id: string,
    @Body() role: Role,
    @Body('permissionIds') permissionIds: string[]
  ): Promise<Role> {
    return this.adminRolesService.update(id, role, permissionIds);
  }

  // Belirli bir rolü pasif yapar (soft delete)
  @Delete('soft/:id')
  @Permissions('admin_delete_role')
  @UseInterceptors(AuditLogInterceptor)
  softRemove(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminRolesService.softRemove(id);
  }

  // Belirli bir rolü geri yükler
  @Put('restore/:id')
  @Permissions('admin_create_role')
  @UseInterceptors(AuditLogInterceptor)
  restore(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminRolesService.restore(id);
  }

  // Belirli bir rolü kalıcı olarak siler (hard delete)
  @Delete('hard/:id')
  @Permissions('admin_delete_role')
  @UseInterceptors(AuditLogInterceptor)
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminRolesService.remove(id);
  }
}
