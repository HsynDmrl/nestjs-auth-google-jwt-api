import { Controller, Body, Param, Delete, Put, UseGuards, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto/create-user.dto';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';
import { User } from 'src/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put(':id')
  @Permissions('user_edit_profile')
  @ApiOperation({ summary: 'Kullanıcı Profilini Güncelle', description: 'Belirtilen ID\'ye sahip kullanıcı profilini günceller.' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 200, description: 'Kullanıcı başarıyla güncellendi.', type: User })
  update(@Param('id') id: string, @Body() updateUserDto: CreateUserDto): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete('soft/:id')
  @Permissions('user_delete_profile')
  @ApiOperation({ summary: 'Kullanıcıyı Soft Delete Yap', description: 'Belirtilen ID\'ye sahip kullanıcıyı soft delete yapar.' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 200, description: 'Kullanıcı başarıyla soft delete yapıldı.' })
  softRemove(@Param('id') id: string): Promise<void> {
    return this.usersService.softRemove(id);
  }

  @Get('email/:email')
  @Permissions('user_read_profile')
  @ApiOperation({ summary: 'Kullanıcıyı E-posta ile Getir', description: 'Belirtilen e-posta adresine sahip kullanıcıyı getirir.' })
  @ApiParam({ name: 'email', description: 'Kullanıcı E-posta adresi', example: 'user@example.com' })
  @ApiResponse({ status: 200, description: 'Kullanıcı başarıyla getirildi.', type: User })
  findOneByEmail(@Param('email') email: string): Promise<User | undefined> {
    return this.usersService.findOneByEmail(email);
  }
}
