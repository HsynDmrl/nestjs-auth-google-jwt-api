import { Controller, Body, Param, Delete, Put, UseGuards, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto/create-user.dto';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';
import { User } from 'src/entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put(':id')
  @Permissions('user_edit_profile')
  update(@Param('id') id: string, @Body() updateUserDto: CreateUserDto): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete('soft/:id')
  @Permissions('user_delete_profile')
  softRemove(@Param('id') id: string): Promise<void> {
    return this.usersService.softRemove(id);
  }

  @Get('email/:email')
  @Permissions('user_read_profile')
  findOneByEmail(@Param('email') email: string): Promise<User | undefined> {
    return this.usersService.findOneByEmail(email);
  }
}
