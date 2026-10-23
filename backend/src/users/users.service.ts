import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  getOrCreateDemoUser() {
    return this.usersRepository.getOrCreate('demo', 'Usuaria de demostración');
  }
}
