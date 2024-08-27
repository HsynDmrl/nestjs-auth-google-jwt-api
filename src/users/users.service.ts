import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: string): Promise<User> {
    return this.usersRepository.findOne({ where: { id } });
  }
  
  async findOneById(id: string): Promise<User | undefined> {
    return this.usersRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'password', 'emailConfirmed'], // Şifreyi de seçiyoruz
    });
  }
  
  
  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: CreateUserDto): Promise<User> {
    await this.usersRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password', 'deletedAt', 'emailConfirmed'], // emailConfirmed alanını da sorgulamaya dahil edin
      relations: ['roles'],
      withDeleted: true,
    });
  }
  
  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }
  
}
