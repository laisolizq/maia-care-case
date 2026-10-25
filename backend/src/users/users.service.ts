import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  // Inyectamos el repositorio de usuarios en el servicio
  constructor(private readonly usersRepository: UsersRepository) {}

  // Este método permite obtener un usuario de demostración, o crear uno si no existe
  getOrCreateDemoUser() {
    return this.usersRepository.getOrCreate('demo', 'Usuaria de demostración');
  }
}
