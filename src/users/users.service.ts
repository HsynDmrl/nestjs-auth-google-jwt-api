import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/requests/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOneById(id: string): Promise<User | undefined> {
    return this.usersRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'password', 'emailConfirmed'],
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }
  
  async update(id: string, updateUserDto: CreateUserDto): Promise<User> {
    await this.usersRepository.update(id, updateUserDto);
    return this.findOneById(id);
  }

  async softRemove(id: string): Promise<void> {
    await this.usersRepository.softDelete(id);
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password', 'deletedAt', 'emailConfirmed'],
      relations: ['roles'],
      withDeleted: true,
    });
  }
  
  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }
}
