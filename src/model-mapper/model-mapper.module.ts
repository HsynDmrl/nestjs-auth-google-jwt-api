import { Module } from '@nestjs/common';
import { ModelMapperService } from './model-mapper.service';

@Module({
  providers: [ModelMapperService],
  exports: [ModelMapperService],
})
export class ModelMapperModule {}
