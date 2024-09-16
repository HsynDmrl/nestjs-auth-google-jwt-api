import { Controller, Get, Query, Post, Body, Param, Delete, Put, UseGuards, UseInterceptors, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { InactiveAllRolesResponseDto } from './responses/concretes/operations/inactive-all-roles-response.dto';
import { ActiveAllRolesResponseDto } from './responses/concretes/operations/active-all-roles-response.dto';
import { FindAllRolesResponseDto } from './responses/concretes/operations/find-all-roles-response.dto';
import { GetByIdRolesResponseDto } from './responses/concretes/operations/getById-roles-resoonse.dto';
import { CreateRolesResponseDto } from './responses/concretes/operations/create-roles-response.dto';
import { UpdateRoleResponseDto } from './responses/concretes/operations/update-role-response.dto';
import { CreateRoleRequestDto } from './requests/concretes/create-role-request.dto';
import { UpdateRoleRequestDto } from './requests/concretes/update-role-request.dto';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';
import { AuditLogInterceptor } from 'src/audit-log/audit-log.interceptor';
import { AdminRolesService } from './admin-roles.service';
import { RestoreRoleResponseDto } from './responses/concretes/status/restore-role-response.dto';

@ApiBearerAuth('access-token')
@ApiTags('Admin-Roles')
@Controller('admin/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminRolesController {
  constructor(private readonly adminRolesService: AdminRolesService) {}

  @Get('active')
  @HttpCode(200)
  @Permissions('admin_read_roles')
  @ApiOperation({ summary: 'Aktif Rolleri Getir', description: 'Soft delete yapılmamış olan tüm aktif rolleri getirir.' })
  @ApiResponse({ status: 200, description: 'Roller başarıyla alındı.', type: [ActiveAllRolesResponseDto] })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ roles: ActiveAllRolesResponseDto[], total: number, totalPages: number }> {
    return this.adminRolesService.findAll(page, limit);
  }

  @Get('inactive')
  @HttpCode(200)
  @Permissions('admin_read_roles')
  @ApiOperation({ summary: 'Pasif Rolleri Getir', description: 'Soft delete yapılmış olan tüm pasif rolleri getirir.' })
  @ApiResponse({ status: 200, description: 'Pasif roller başarıyla alındı.', type: [InactiveAllRolesResponseDto] })
  findAllInactive(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ roles: InactiveAllRolesResponseDto[], total: number, totalPages: number }> {
    return this.adminRolesService.findAllInactive(page, limit);
  }

  @Get('getAll')
  @HttpCode(200)
  @Permissions('admin_read_roles')
  @ApiOperation({ summary: 'Tüm Rolleri Getir', description: 'Soft delete yapılmış olanlar dahil tüm rolleri getirir.' })
  @ApiResponse({ status: 200, description: 'Roller başarıyla alındı.', type: [FindAllRolesResponseDto] })
  findAllIncludingDeleted(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ roles: FindAllRolesResponseDto[], total: number, totalPages: number }> {
    return this.adminRolesService.findAllIncludingDeleted(page, limit);
  }

  @Get('getById/:id')
  @HttpCode(200)
  @Permissions('admin_read_roles')
  @ApiOperation({ summary: 'Rol Detayını Getir', description: 'Belirtilen ID\'ye sahip rolü getirir.' })
  @ApiParam({ name: 'id', description: 'Rol ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 200, description: 'Rol başarıyla alındı.', type: GetByIdRolesResponseDto })
  findOne(@Param('id') id: string): Promise<GetByIdRolesResponseDto> {
    return this.adminRolesService.findOne(id);
  }

  @Post('add')
  @HttpCode(201)
  @UseInterceptors(AuditLogInterceptor)
  @Permissions('admin_create_role')
  @ApiOperation({ summary: 'Yeni Rol Ekle', description: 'Yeni bir rol ekler.' })
  @ApiBody({ type: CreateRoleRequestDto })
  @ApiResponse({ status: 201, description: 'Rol başarıyla oluşturuldu.', type: CreateRolesResponseDto })
  create(@Body() createRoleDto: CreateRoleRequestDto,): Promise<CreateRolesResponseDto> {
    return this.adminRolesService.create(createRoleDto);
  }

  @Put('update/:id')
  @HttpCode(200)
  @Permissions('admin_edit_role')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Rolü Güncelle', description: 'Belirtilen ID\'ye sahip rolü günceller.' })
  @ApiParam({ name: 'id', description: 'Rol ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiBody({ type: UpdateRoleRequestDto })
  @ApiResponse({ status: 200, description: 'Rol başarıyla güncellendi.', type: UpdateRoleRequestDto })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleRequestDto): Promise<UpdateRoleResponseDto> {
    return this.adminRolesService.update(id, updateRoleDto);
  }

  @Delete('soft/:id')
  @HttpCode(204)
  @Permissions('admin_delete_role')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Rolü Soft Delete Yap', description: 'Belirtilen ID\'ye sahip rolü soft delete yapar.' })
  @ApiParam({ name: 'id', description: 'Rol ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 204, description: 'Rol başarıyla pasif hale getirildi.' })
  async softRemove(@Param('id') id: string): Promise<void> {
    await this.adminRolesService.softRemove(id);
  }

  @Put('restore/:id')
  @HttpCode(200)
  @Permissions('admin_create_role')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Pasif Rolü Geri Yükle', description: 'Soft delete yapılmış bir rolü geri yükler.' })
  @ApiParam({ name: 'id', description: 'Rol ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 200, description: 'Rol başarıyla geri yüklendi.' })
  restore(@Param('id') id: string): Promise<RestoreRoleResponseDto> {
    return this.adminRolesService.restore(id);
  }

  @Delete('hard/:id')
  @HttpCode(204)
  @Permissions('admin_delete_role')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Rolü Kalıcı Olarak Sil', description: 'Belirtilen ID\'ye sahip rolü kalıcı olarak siler.' })
  @ApiParam({ name: 'id', description: 'Rol ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 204, description: 'Rol başarıyla kalıcı olarak silindi.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.adminRolesService.remove(id);
  }
}
