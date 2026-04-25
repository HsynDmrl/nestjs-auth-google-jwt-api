import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithTenantContext } from 'src/tenancy/interfaces/tenant-context.interface';
import { PlanFeatureSet } from '../constants/plan-features';
import { REQUIRED_FEATURE_KEY } from '../decorators/requires-feature.decorator';
import { BillingService } from '../billing.service';

@Injectable()
export class RequiresFeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly billingService: BillingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<keyof PlanFeatureSet>(
      REQUIRED_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!feature) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<RequestWithTenantContext>();
    const companyId = request.tenantContext?.companyId;

    if (!companyId) {
      throw new UnauthorizedException(
        'Tenant context bulunamadı. x-branch-id ile doğrulama gerekli.',
      );
    }

    await this.billingService.assertFeatureEnabled(companyId, feature);
    return true;
  }
}
