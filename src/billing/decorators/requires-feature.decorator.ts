import { SetMetadata } from '@nestjs/common';
import { PlanFeatureSet } from '../constants/plan-features';

export const REQUIRED_FEATURE_KEY = 'required_feature_key';

export const RequiresFeature = (feature: keyof PlanFeatureSet) =>
  SetMetadata(REQUIRED_FEATURE_KEY, feature);
