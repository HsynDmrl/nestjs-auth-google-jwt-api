import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TenancyService } from '../tenancy.service';
import { RequestWithTenantContext } from '../interfaces/tenant-context.interface';

@Injectable()
export class BranchContextGuard implements CanActivate {
  constructor(private readonly tenancyService: TenancyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithTenantContext>();

    const userId = request.user?.id;
    const branchIdHeader = request.headers['x-branch-id'];
    const branchId = Array.isArray(branchIdHeader)
      ? branchIdHeader[0]
      : branchIdHeader;

    if (!userId || !branchId) {
      throw new UnauthorizedException(
        'x-branch-id header ve kullanıcı kimliği gereklidir.',
      );
    }

    request.tenantContext = await this.tenancyService.resolveTenantContext(
      userId,
      branchId,
    );

    return true;
  }
}
