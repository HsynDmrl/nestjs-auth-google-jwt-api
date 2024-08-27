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
    const userRoleExists = await this.roleRepository.findOne({ where: { name: 'user' } });

    if (!userRoleExists) {
      const userRole = this.roleRepository.create({ name: 'user' });
      await this.roleRepository.save(userRole);
    }
  }
}
