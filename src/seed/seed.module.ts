import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Role } from 'src/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  providers: [SeedService],
})
export class SeedModule {}
