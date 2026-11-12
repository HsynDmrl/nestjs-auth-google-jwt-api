import { of } from 'rxjs';
import { ClsService } from 'nestjs-cls';
import { ExecutionContext } from '@nestjs/common';
import { AuditLogContextInterceptor } from './audit-log-context.interceptor';
import { AUDIT_LOG_CONTEXT_KEY } from './audit-log-context';

describe('AuditLogContextInterceptor', () => {
  const createHttpContext = (request: unknown): ExecutionContext =>
    ({
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as ExecutionContext;

  it('should bypass non-http contexts', () => {
    const clsService = { set: jest.fn() } as unknown as ClsService;
    const interceptor = new AuditLogContextInterceptor(clsService);
    const handle = jest.fn(() => of('ok'));

    const result$ = interceptor.intercept(
      {
        getType: () => 'rpc',
      } as ExecutionContext,
      { handle } as any,
    );

    result$.subscribe((value) => expect(value).toBe('ok'));
    expect(handle).toHaveBeenCalledTimes(1);
    expect(clsService.set).not.toHaveBeenCalled();
  });

  it('should set audit context using request headers and tenant context', () => {
    const clsService = { set: jest.fn() } as unknown as ClsService;
    const interceptor = new AuditLogContextInterceptor(clsService);
    const handle = jest.fn(() => of('ok'));

    const request = {
      user: { id: 'user-1' },
      headers: {
        'x-branch-id': ['branch-1'],
        'x-device-id': 'device-1',
        'user-agent': 'jest-agent',
        'x-forwarded-for': '203.0.113.7, 10.0.0.1',
      },
      tenantContext: { companyId: 'company-1' },
      ip: '127.0.0.1',
      socket: { remoteAddress: '10.1.1.1' },
    };

    interceptor.intercept(
      createHttpContext(request),
      { handle } as unknown as any,
    );

    expect(clsService.set).toHaveBeenCalledWith(AUDIT_LOG_CONTEXT_KEY, {
      userId: 'user-1',
      companyId: 'company-1',
      branchId: 'branch-1',
      deviceId: 'device-1',
      userAgent: 'jest-agent',
      ipAddress: '203.0.113.7',
    });
    expect(handle).toHaveBeenCalledTimes(1);
  });

  it('should fallback to null values when headers and context are missing', () => {
    const clsService = { set: jest.fn() } as unknown as ClsService;
    const interceptor = new AuditLogContextInterceptor(clsService);

    interceptor.intercept(
      createHttpContext({
        headers: {},
        socket: { remoteAddress: '198.51.100.20' },
      }),
      { handle: () => of('ok') } as any,
    );

    expect(clsService.set).toHaveBeenCalledWith(AUDIT_LOG_CONTEXT_KEY, {
      userId: undefined,
      companyId: null,
      branchId: null,
      deviceId: null,
      userAgent: null,
      ipAddress: '198.51.100.20',
    });
  });
});
