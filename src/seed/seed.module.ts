import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Role } from 'src/entities/role.entity';
import { Permission } from 'src/entities/permission.entity';
import { User } from 'src/entities/user.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, User]),
    UsersModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
