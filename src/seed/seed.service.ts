import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/entities/role.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    // User rolü mevcut mu kontrol et
    const userRoleExists = await this.roleRepository.findOne({ where: { name: 'user' } });

    // User rolü yoksa ekle
    if (!userRoleExists) {
      const userRole = this.roleRepository.create({ name: 'user' });
      await this.roleRepository.save(userRole);
    }

    // Admin rolü mevcut mu kontrol et
    const adminRoleExists = await this.roleRepository.findOne({ where: { name: 'admin' } });

    // Admin rolü yoksa ekle
    if (!adminRoleExists) {
      const adminRole = this.roleRepository.create({ name: 'admin' });
      await this.roleRepository.save(adminRole);
    }
  }
}
