import { Controller, Get, Query, Post, Body, Param, Delete, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { User } from 'src/entities/user.entity';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';
import { AuditLogInterceptor } from 'src/audit-log/audit-log.interceptor';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ActiveAllAdminUsersResponseDto } from './responses/concretes/operations/active-all-admin-users-response.dto';
import { FindAllAdminUsersResponseDto } from './responses/concretes/operations/find-all-admin-users-response.dto';
import { InactiveAllAdminUsersResponseDto } from './responses/concretes/operations/inactive-all-admin-users-response.dto';
import { GetByIdAdminUsersResponseDto } from './responses/concretes/operations/getById-admin-users-resoonse.dto';
import { CreateAdminUserRequestDto } from './requests/concretes/create-admin-users-request.dto';
import { CreateAdminUsersResponseDto } from './responses/concretes/operations/create-admin-users-response.dto';
import { UpdateAdminUserRequestDto } from './requests/concretes/update-admin-users-request.dto';
import { UpdateAdminUserResponseDto } from './responses/concretes/operations/update-admin-users-response.dto';

@ApiBearerAuth('access-token')
@ApiTags('Admin-Users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get('active')
  @Permissions('admin_read_users')
  @ApiOperation({ summary: 'Aktif Kullanıcıları Getir', description: 'Tüm aktif kullanıcıları getirir.' })
  @ApiResponse({ status: 200, description: 'Kullanıcılar başarıyla alındı.', type: [ActiveAllAdminUsersResponseDto] })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ users: ActiveAllAdminUsersResponseDto[], total: number, totalPages: number }> {
    return this.adminUsersService.findAll(page, limit);
  }

  @Get('inactive')
  @Permissions('admin_read_users')
  @ApiOperation({ summary: 'Pasif Kullanıcıları Getir', description: 'Soft delete yapılmış tüm pasif kullanıcıları getirir.' })
  @ApiResponse({ status: 200, description: 'Pasif kullanıcılar başarıyla alındı.', type: [User] })
  findAllInactive(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ users: InactiveAllAdminUsersResponseDto[], total: number, totalPages: number }> {
    return this.adminUsersService.findAllInactive(page, limit);
  }

  @Get('getAll')
  @Permissions('admin_read_users')
  @ApiOperation({ summary: 'Tüm Kullanıcıları Getir', description: 'Tüm kullanıcıları getirir, silinmiş kullanıcılar da dahil.' })
  @ApiResponse({ status: 200, description: 'Tüm kullanıcılar başarıyla alındı.', type: [FindAllAdminUsersResponseDto] })
  findAllIncludingDeleted(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ users: FindAllAdminUsersResponseDto[], total: number, totalPages: number }> {
    return this.adminUsersService.findAllIncludingDeleted(page, limit);
  }

  @Get('getById/:id')
  @Permissions('admin_read_users')
  @ApiOperation({ summary: 'Kullanıcı Detayını Getir', description: 'Belirli bir kullanıcıyı getirir.' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 200, description: 'Kullanıcı başarıyla alındı.', type: GetByIdAdminUsersResponseDto })
  findOne(@Param('id') id: string): Promise<GetByIdAdminUsersResponseDto> {
    return this.adminUsersService.findOne(id);
  }

  @Post('add')
  @Permissions('admin_create_user')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Yeni Kullanıcı Ekle', description: 'Yeni bir kullanıcı oluşturur.' })
  @ApiBody({ type: CreateAdminUserRequestDto })
  @ApiResponse({ status: 201, description: 'Kullanıcı başarıyla oluşturuldu.', type: CreateAdminUsersResponseDto })
  create(@Body() createAdminUserDto: CreateAdminUserRequestDto,): Promise<CreateAdminUsersResponseDto> {
    return this.adminUsersService.create(createAdminUserDto);
  }

  @Put('update/:id')
  @Permissions('admin_edit_user')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Kullanıcıyı Güncelle', description: 'Belirtilen ID\'ye sahip kullanıcıyı günceller.' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiBody({ type: UpdateAdminUserRequestDto })
  @ApiResponse({ status: 200, description: 'Rol başarıyla güncellendi.', type: UpdateAdminUserRequestDto })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateAdminUserRequestDto): Promise<UpdateAdminUserResponseDto> {
    return this.adminUsersService.update(id, updateRoleDto);
  }

  @Delete('soft/:id')
  @Permissions('admin_delete_user')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Kullanıcıyı Soft Delete Yap', description: 'Belirtilen ID\'ye sahip kullanıcıyı soft delete yapar.' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 200, description: 'Kullanıcı başarıyla pasif hale getirildi.' })
  async softRemove(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminUsersService.softRemove(id);
  }

  @Put('restore/:id')
  @Permissions('admin_create_user')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Pasif Kullanıcıyı Geri Yükle', description: 'Soft delete yapılmış kullanıcıyı geri yükler.' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 200, description: 'Kullanıcı başarıyla geri yüklendi.' })
  async restore(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminUsersService.restore(id);
  }

  @Delete('hard/:id')
  @Permissions('admin_delete_user')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Kullanıcıyı Kalıcı Olarak Sil', description: 'Belirtilen ID\'ye sahip kullanıcıyı kalıcı olarak siler.' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 200, description: 'Kullanıcı başarıyla kalıcı olarak silindi.' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminUsersService.remove(id);
  }
}
