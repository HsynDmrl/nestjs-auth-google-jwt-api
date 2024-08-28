import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { Permission } from 'src/entities/permission.entity';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  // Tüm aktif yetkileri getirir (Soft delete yapılmamış olanlar)
  @Get('active')
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ permissions: Permission[], total: number, totalPages: number }> {
    return this.permissionsService.findAll(page, limit);
  }

  // Tüm pasif yetkileri getirir (Soft delete yapılmış olanlar)
  @Get('inactive')
  findAllInactive(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ permissions: Permission[], total: number, totalPages: number }> {
    return this.permissionsService.findAllInactive(page, limit);
  }

  // Silinmiş yetkiler de dahil olmak üzere tüm yetkileri getirir
  @Get('getAll')
  findAllIncludingDeleted(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ permissions: Permission[], total: number, totalPages: number }> {
    return this.permissionsService.findAllIncludingDeleted(page, limit);
  }

  // Belirli bir yetkiyi getirir
  @Get('getById/:id')
  findOne(@Param('id') id: string): Promise<Permission> {
    return this.permissionsService.findOne(id);
  }

  // Yeni bir yetki oluşturur
  @Post('add')
  create(@Body() permission: Permission): Promise<Permission> {
    return this.permissionsService.create(permission);
  }

  // Belirli bir yetkiyi günceller
  @Put('update/:id')
  update(@Param('id') id: string, @Body() permission: Permission): Promise<Permission> {
    return this.permissionsService.update(id, permission);
  }

  // Belirli bir yetkiyi pasif yapar (soft delete)
  @Delete('soft/:id')
  softRemove(@Param('id') id: string): Promise<{ message: string }> {
    return this.permissionsService.softRemove(id);
  }

  // Soft delete yapılmış bir yetkiyi geri yükler
  @Put('restore/:id')
  restore(@Param('id') id: string): Promise<{ message: string }> {
    return this.permissionsService.restore(id);
  }

  // Belirli bir yetkiyi kalıcı olarak siler (hard delete)
  @Delete('hard/:id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.permissionsService.remove(id);
  }
}
