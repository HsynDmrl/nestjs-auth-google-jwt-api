import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { AdminRolesService } from './admin-roles.service';
import { Role } from 'src/entities/role.entity';

@Controller('admin/roles')
export class AdminRolesController {
  constructor(private readonly adminRolesService: AdminRolesService) {}

  // Tüm aktif rolleri getirir
  @Get('active')
  findAll(): Promise<Role[]> {
    return this.adminRolesService.findAll();
  }

  // Tüm pasif rolleri getirir
  @Get('inactive')
  findAllInactive(): Promise<Role[]> {
    return this.adminRolesService.findAllInactive();
  }

  // Silinmiş roller de dahil olmak üzere tüm rolleri getirir
  @Get('getAll')
  findAllIncludingDeleted(): Promise<Role[]> {
    return this.adminRolesService.findAllIncludingDeleted();
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
    role.id = id;
    return this.adminRolesService.update(role);
  }

  // Belirli bir rolü pasif yapar (soft delete)
  @Delete('soft/:id')
  softRemove(@Param('id') id: string): Promise<void> {
    return this.adminRolesService.softRemove(id);
  }

  // Belirli bir rolü geri yükler
  @Put('restore/:id')
  restore(@Param('id') id: string): Promise<void> {
    return this.adminRolesService.restore(id);
  }

  // Belirli bir rolü kalıcı olarak siler (hard delete)
  @Delete('hard/:id')
  remove(@Param('id') id: string): Promise<void> {
    return this.adminRolesService.remove(id);
  }
}
