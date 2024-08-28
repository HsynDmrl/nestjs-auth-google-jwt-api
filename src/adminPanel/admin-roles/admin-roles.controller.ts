import { Controller, Get, Query, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { AdminRolesService } from './admin-roles.service';
import { Role } from 'src/entities/role.entity';

@Controller('admin/roles')
export class AdminRolesController {
  constructor(private readonly adminRolesService: AdminRolesService) {}

  // Tüm aktif rolleri getirir
  @Get('active')
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ roles: Role[], total: number, totalPages: number }> {
    return this.adminRolesService.findAll(page, limit);
  }

  // Tüm pasif rolleri getirir
  @Get('inactive')
  findAllInactive(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ roles: Role[], total: number, totalPages: number }> {
    return this.adminRolesService.findAllInactive(page, limit);
  }

  // Silinmiş roller de dahil olmak üzere tüm rolleri getirir
  @Get('getAll')
  findAllIncludingDeleted(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ roles: Role[], total: number, totalPages: number }> {
    return this.adminRolesService.findAllIncludingDeleted(page, limit);
  }

  // Belirli bir rolü getirir
  @Get('getById/:id')
  findOne(@Param('id') id: string): Promise<Role> {
    return this.adminRolesService.findOne(id);
  }

  // Yeni bir rol oluşturur
  @Post('add')
  create(@Body() role: Role): Promise<Role> {
    return this.adminRolesService.create(role);
  }

  // Belirli bir rolü günceller
  @Put('update/:id')
  update(@Param('id') id: string, @Body() role: Role): Promise<Role> {
    return this.adminRolesService.update(id, role);
  }

  // Belirli bir rolü pasif yapar (soft delete)
  @Delete('soft/:id')
  softRemove(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminRolesService.softRemove(id);
  }

  // Belirli bir rolü geri yükler
  @Put('restore/:id')
  restore(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminRolesService.restore(id);
  }

  // Belirli bir rolü kalıcı olarak siler (hard delete)
  @Delete('hard/:id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminRolesService.remove(id);
  }
}
