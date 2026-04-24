import { PlanCode } from 'src/entities/subscription.entity';

export interface PlanFeatureSet {
  maxMembersPerBranch: number;
  tipboxEnabled: boolean;
  shiftManagementEnabled: boolean;
  reportExportEnabled: boolean;
}

export const PLAN_FEATURES: Record<PlanCode, PlanFeatureSet> = {
  [PlanCode.FREE]: {
    maxMembersPerBranch: 2,
    tipboxEnabled: true,
    shiftManagementEnabled: false,
    reportExportEnabled: false,
  },
  [PlanCode.STARTER]: {
    maxMembersPerBranch: 10,
    tipboxEnabled: true,
    shiftManagementEnabled: true,
    reportExportEnabled: false,
  },
  [PlanCode.PRO]: {
    maxMembersPerBranch: 25,
    tipboxEnabled: true,
    shiftManagementEnabled: true,
    reportExportEnabled: true,
  },
  [PlanCode.ENTERPRISE]: {
    maxMembersPerBranch: 100,
    tipboxEnabled: true,
    shiftManagementEnabled: true,
    reportExportEnabled: true,
  },
};
