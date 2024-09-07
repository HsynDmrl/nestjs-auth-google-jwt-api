import { Controller, Get, Query, Post, Body, Param, Delete, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionResponseDto } from './dto/responses/concretes/create-permission-response.dto';
import { FindAllPermissionsResponseDto } from './dto/responses/concretes/find-all-permissions-response.dto';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';
import { AuditLogInterceptor } from 'src/audit-log/audit-log.interceptor';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { UpdatePermissionResponseDto } from './dto/responses/concretes/update-permission-response.dto';
import { CreatePermissionRequestDto } from './dto/requests/concretes/create-permission-request.dto';
import { UpdatePermissionRequestDto } from './dto/requests/concretes/update-permission-request.dto';
import { ActiveAllPermissionsResponseDto } from './dto/responses/concretes/active-all-permissions-response.dto';
import { InactiveAllPermissionsResponseDto } from './dto/responses/concretes/inactive-all-permissions-response.dto';
import { GetByIdPermissionsResponseDto } from './dto/responses/concretes/getById-permissions-resoonse.dto';

@ApiBearerAuth('access-token')
@ApiTags('Admin-Permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('active')
  @Permissions('admin_read_roles')
  @ApiOperation({ summary: 'Aktif Yetkileri Getir', description: 'Soft delete yapılmamış olan tüm aktif yetkileri getirir.' })
  @ApiResponse({ status: 200, description: 'Yetkiler başarıyla alındı.', type: [ActiveAllPermissionsResponseDto] })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ permissions: ActiveAllPermissionsResponseDto[], total: number, totalPages: number }> {
    return this.permissionsService.findAll(page, limit);
  }

  @Get('inactive')
  @Permissions('admin_read_roles')
  @ApiOperation({ summary: 'Pasif Yetkileri Getir', description: 'Soft delete yapılmış olan tüm pasif yetkileri getirir.' })
  @ApiResponse({ status: 200, description: 'Yetkiler başarıyla alındı.', type: [InactiveAllPermissionsResponseDto] })
  findAllInactive(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ permissions: InactiveAllPermissionsResponseDto[], total: number, totalPages: number }> {
    return this.permissionsService.findAllInactive(page, limit);
  }

  @Get('getAll')
  @Permissions('admin_read_roles')
  @ApiOperation({ summary: 'Tüm Yetkileri Getir', description: 'Soft delete yapılmış olanlar dahil tüm yetkileri getirir.' })
  @ApiResponse({ status: 200, description: 'Yetkiler başarıyla alındı.', type: [FindAllPermissionsResponseDto] })
  findAllIncludingDeleted(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ permissions: FindAllPermissionsResponseDto[], total: number, totalPages: number }> {
    return this.permissionsService.findAllIncludingDeleted(page, limit);
  }

  @Get('getById/:id')
  @Permissions('admin_read_roles')
  @ApiOperation({ summary: 'Yetki Detayını Getir', description: 'Belirtilen ID\'ye sahip yetkiyi getirir.' })
  @ApiParam({ name: 'id', description: 'Yetki ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 200, description: 'Yetki başarıyla alındı.', type: GetByIdPermissionsResponseDto })
  findOne(@Param('id') id: string): Promise<GetByIdPermissionsResponseDto> {
    return this.permissionsService.findOne(id);
  }

  @Post('add')
  @UseInterceptors(AuditLogInterceptor)
  @Permissions('admin_create_role')
  @ApiOperation({ summary: 'Yeni Yetki Ekle', description: 'Yeni bir yetki ekler.' })
  @ApiBody({ type: CreatePermissionRequestDto })
  @ApiResponse({ status: 201, description: 'Yetki başarıyla oluşturuldu.', type: CreatePermissionResponseDto })
  create(@Body() createPermissionDto: CreatePermissionRequestDto): Promise<CreatePermissionResponseDto> {
    return this.permissionsService.create(createPermissionDto);
  }

  @Put('update/:id')
  @Permissions('admin_edit_role')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Yetkiyi Güncelle', description: 'Belirtilen ID\'ye sahip yetkiyi günceller.' })
  @ApiParam({ name: 'id', description: 'Yetki ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiBody({ type: UpdatePermissionRequestDto })
  @ApiResponse({ status: 200, description: 'Yetki başarıyla güncellendi.', type: UpdatePermissionRequestDto })
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionRequestDto): Promise<UpdatePermissionResponseDto> {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete('soft/:id')
  @Permissions('admin_delete_role')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Yetkiyi Soft Delete Yap', description: 'Belirtilen ID\'ye sahip yetkiyi soft delete yapar.' })
  @ApiParam({ name: 'id', description: 'Yetki ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 200, description: 'Yetki başarıyla pasif hale getirildi.' })
  softRemove(@Param('id') id: string): Promise<{ message: string }> {
    return this.permissionsService.softRemove(id);
  }

  @Put('restore/:id')
  @Permissions('admin_create_role')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Pasif Yetkiyi Geri Yükle', description: 'Soft delete yapılmış bir yetkiyi geri yükler.' })
  @ApiParam({ name: 'id', description: 'Yetki ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 200, description: 'Yetki başarıyla geri yüklendi.' })
  restore(@Param('id') id: string): Promise<{ message: string }> {
    return this.permissionsService.restore(id);
  }

  @Delete('hard/:id')
  @Permissions('admin_delete_role')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Yetkiyi Kalıcı Olarak Sil', description: 'Belirtilen ID\'ye sahip yetkiyi kalıcı olarak siler.' })
  @ApiParam({ name: 'id', description: 'Yetki ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 200, description: 'Yetki başarıyla kalıcı olarak silindi.' })
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.permissionsService.remove(id);
  }
}
