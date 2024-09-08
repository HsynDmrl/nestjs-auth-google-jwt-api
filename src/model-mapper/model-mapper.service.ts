import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ModelMapperService {
  mapToDto<T, V>(entity: T, dtoClass: new () => V): V {
    return plainToClass(dtoClass, entity);
  }

  mapToEntity<T, V>(dto: T, entityClass: new () => V): V {
    return plainToClass(entityClass, dto);
  }
}

