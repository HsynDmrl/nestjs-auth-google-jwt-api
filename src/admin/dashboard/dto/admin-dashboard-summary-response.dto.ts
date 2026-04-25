import { ApiProperty } from '@nestjs/swagger';

export class AdminDashboardSummaryResponseDto {
  @ApiProperty({ example: 120 })
  totalUsers: number;

  @ApiProperty({ example: 100 })
  activeUsers: number;

  @ApiProperty({ example: 20 })
  inactiveUsers: number;

  @ApiProperty({ example: 8 })
  totalRoles: number;

  @ApiProperty({ example: 32 })
  totalPermissions: number;

  @ApiProperty({ example: 5 })
  totalCompanies: number;

  @ApiProperty({ example: 18 })
  totalBranches: number;

  @ApiProperty({ example: 27 })
  totalTeams: number;

  @ApiProperty({ example: 245 })
  totalMemberships: number;

  @ApiProperty({ example: 4 })
  activeSubscriptions: number;
}
