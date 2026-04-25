import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from '../billing.service';
import { RequiresFeatureGuard } from './requires-feature.guard';

describe('RequiresFeatureGuard', () => {
  let guard: RequiresFeatureGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let billingService: { assertFeatureEnabled: jest.Mock };

  const createContext = (companyId?: string): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          tenantContext: companyId ? { companyId } : undefined,
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    reflector = { getAllAndOverride: jest.fn() };
    billingService = { assertFeatureEnabled: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequiresFeatureGuard,
        { provide: Reflector, useValue: reflector },
        { provide: BillingService, useValue: billingService },
      ],
    }).compile();

    guard = module.get<RequiresFeatureGuard>(RequiresFeatureGuard);
  });

  it('returns true when no feature metadata is defined', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(guard.canActivate(createContext('company-1'))).resolves.toBe(
      true,
    );
    expect(billingService.assertFeatureEnabled).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when company context is missing', async () => {
    reflector.getAllAndOverride.mockReturnValue('tipboxEnabled');

    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(billingService.assertFeatureEnabled).not.toHaveBeenCalled();
  });

  it('checks feature when metadata and company context exist', async () => {
    reflector.getAllAndOverride.mockReturnValue('tipboxEnabled');

    await expect(guard.canActivate(createContext('company-1'))).resolves.toBe(
      true,
    );
    expect(billingService.assertFeatureEnabled).toHaveBeenCalledWith(
      'company-1',
      'tipboxEnabled',
    );
  });
});
