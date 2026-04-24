export interface TenantContext {
  userId: string;
  companyId: string;
  branchId: string;
  teamId: string;
  membershipId: string;
  membershipRole: string;
}

export interface RequestWithTenantContext {
  user?: { id?: string };
  headers: Record<string, string | string[] | undefined>;
  tenantContext?: TenantContext;
}
