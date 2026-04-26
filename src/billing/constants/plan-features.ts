import { PlanCode } from 'src/entities/subscription.entity';

export interface PlanFeatureSet {
  maxMembersPerBranch: number;
  tipboxEnabled: boolean;
  shiftManagementEnabled: boolean;
  reportExportEnabled: boolean;
  readOnlyMode: boolean;
  canCreateBranch: boolean;
  canCreateTeam: boolean;
  canMoveTeam: boolean;
  canManageMembership: boolean;
}

export const PLAN_FEATURES: Record<PlanCode, PlanFeatureSet> = {
  [PlanCode.FREE]: {
    maxMembersPerBranch: 2,
    tipboxEnabled: true,
    shiftManagementEnabled: true,
    reportExportEnabled: false,
    readOnlyMode: false,
    canCreateBranch: false,
    canCreateTeam: true,
    canMoveTeam: false,
    canManageMembership: true,
  },
  [PlanCode.STARTER]: {
    maxMembersPerBranch: 10,
    tipboxEnabled: true,
    shiftManagementEnabled: true,
    reportExportEnabled: false,
    readOnlyMode: false,
    canCreateBranch: false,
    canCreateTeam: true,
    canMoveTeam: false,
    canManageMembership: true,
  },
  [PlanCode.PRO]: {
    maxMembersPerBranch: 25,
    tipboxEnabled: true,
    shiftManagementEnabled: true,
    reportExportEnabled: true,
    readOnlyMode: false,
    canCreateBranch: false,
    canCreateTeam: true,
    canMoveTeam: false,
    canManageMembership: true,
  },
  [PlanCode.ENTERPRISE]: {
    maxMembersPerBranch: 100,
    tipboxEnabled: true,
    shiftManagementEnabled: true,
    reportExportEnabled: true,
    readOnlyMode: false,
    canCreateBranch: true,
    canCreateTeam: true,
    canMoveTeam: true,
    canManageMembership: true,
  },
};
