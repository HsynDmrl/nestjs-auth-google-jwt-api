import { Controller, Get, Query, Post, Body, Param, Delete, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { AdminRolesService } from './admin-roles.service';
import { Role } from 'src/entities/role.entity';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';
import { AuditLogInterceptor } from 'src/audit-log/audit-log.interceptor';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@ApiTags('Roller')
@Controller('admin/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminRolesController {
  constructor(private readonly adminRolesService: AdminRolesService) {}

  @Get('active')
  @Permissions('admin_read_roles')
  @ApiOperation({ summary: 'Aktif Rolleri Getir', description: 'Soft delete yapılmamış olan tüm aktif rolleri getirir.' })
  @ApiResponse({ status: 200, description: 'Roller başarıyla alındı.', type: [Role] })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ roles: Role[], total: number, totalPages: number }> {
    return this.adminRolesService.findAll(page, limit);
  }

  @Get('inactive')
  @Permissions('admin_read_roles')
  @ApiOperation({ summary: 'Pasif Rolleri Getir', description: 'Soft delete yapılmış olan tüm pasif rolleri getirir.' })
  @ApiResponse({ status: 200, description: 'Pasif roller başarıyla alındı.', type: [Role] })
  findAllInactive(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ roles: Role[], total: number, totalPages: number }> {
    return this.adminRolesService.findAllInactive(page, limit);
  }

  @Get('getAll')
  @Permissions('admin_read_roles')
  @ApiOperation({ summary: 'Tüm Rolleri Getir', description: 'Soft delete yapılmış olanlar dahil tüm rolleri getirir.' })
  @ApiResponse({ status: 200, description: 'Roller başarıyla alındı.', type: [Role] })
  findAllIncludingDeleted(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ roles: Role[], total: number, totalPages: number }> {
    return this.adminRolesService.findAllIncludingDeleted(page, limit);
  }

  @Get('getById/:id')
  @Permissions('admin_read_roles')
  @ApiOperation({ summary: 'Rol Detayını Getir', description: 'Belirtilen ID\'ye sahip rolü getirir.' })
  @ApiParam({ name: 'id', description: 'Rol ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 200, description: 'Rol başarıyla alındı.', type: Role })
  findOne(@Param('id') id: string): Promise<Role> {
    return this.adminRolesService.findOne(id);
  }

  @Post('add')
  @UseInterceptors(AuditLogInterceptor)
  @Permissions('admin_create_role')
  @ApiOperation({ summary: 'Yeni Rol Ekle', description: 'Yeni bir rol ekler.' })
  @ApiBody({ schema: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Admin', description: 'Rol adı' },
      permissionIds: { type: 'array', items: { type: 'string' }, example: ['perm1', 'perm2'], description: 'İzin ID\'leri' },
    },
  }})
  @ApiResponse({ status: 201, description: 'Rol başarıyla oluşturuldu.', type: Role })
  create(
    @Body() role: Role,
    @Body('permissionIds') permissionIds: string[]
  ): Promise<Role> {
    return this.adminRolesService.create(role, permissionIds);
  }

  @Put('update/:id')
  @Permissions('admin_edit_role')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Rolü Güncelle', description: 'Belirtilen ID\'ye sahip rolü günceller.' })
  @ApiParam({ name: 'id', description: 'Rol ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiBody({ schema: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Admin', description: 'Rol adı' },
      permissionIds: { type: 'array', items: { type: 'string' }, example: ['perm1', 'perm2'], description: 'İzin ID\'leri' },
    },
  }})
  @ApiResponse({ status: 200, description: 'Rol başarıyla güncellendi.', type: Role })
  update(
    @Param('id') id: string,
    @Body() role: Role,
    @Body('permissionIds') permissionIds: string[]
  ): Promise<Role> {
    return this.adminRolesService.update(id, role, permissionIds);
  }

  @Delete('soft/:id')
  @Permissions('admin_delete_role')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Rolü Soft Delete Yap', description: 'Belirtilen ID\'ye sahip rolü soft delete yapar.' })
  @ApiParam({ name: 'id', description: 'Rol ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 200, description: 'Rol başarıyla pasif hale getirildi.' })
  softRemove(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminRolesService.softRemove(id);
  }

  @Put('restore/:id')
  @Permissions('admin_create_role')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Pasif Rolü Geri Yükle', description: 'Soft delete yapılmış bir rolü geri yükler.' })
  @ApiParam({ name: 'id', description: 'Rol ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 200, description: 'Rol başarıyla geri yüklendi.' })
  restore(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminRolesService.restore(id);
  }

  @Delete('hard/:id')
  @Permissions('admin_delete_role')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Rolü Kalıcı Olarak Sil', description: 'Belirtilen ID\'ye sahip rolü kalıcı olarak siler.' })
  @ApiParam({ name: 'id', description: 'Rol ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 200, description: 'Rol başarıyla kalıcı olarak silindi.' })
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminRolesService.remove(id);
  }
}
