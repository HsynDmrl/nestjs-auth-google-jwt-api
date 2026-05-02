import { Entity, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Role } from './role.entity';
import { RefreshToken } from './refresh-token.entity';
import { EmailConfirmation } from './email-confirmation.entity';
import { PasswordReset } from './password-reset.entity';
import { UserActivity } from './user-activity.entity';
import { Membership } from './membership.entity';
import { Notification } from './notification.entity';
import { NotificationPreference } from './notification-preference.entity';

@Entity()
export class User extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  surname: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ nullable: true })
  password: string;

  @ManyToMany(() => Role)
  @JoinTable()
  roles: Role[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  @OneToMany(
    () => EmailConfirmation,
    (emailConfirmation) => emailConfirmation.user,
  )
  emailConfirmations: EmailConfirmation[];

  @Column({ default: false })
  emailConfirmed: boolean;

  @Column({ default: false })
  kvkkConsentGiven: boolean;

  @Column({ type: 'datetime', nullable: true })
  kvkkConsentAt?: Date;

  @Column({ length: 50, nullable: true })
  kvkkConsentVersion?: string;

  @Column({ default: false })
  marketingConsentGiven: boolean;

  @OneToMany(() => PasswordReset, (passwordReset) => passwordReset.user)
  passwordResets: PasswordReset[];

  @OneToMany(() => UserActivity, (activity) => activity.user)
  activities: UserActivity[];

  @OneToMany(() => Membership, (membership) => membership.user)
  memberships: Membership[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(
    () => NotificationPreference,
    (notificationPreference) => notificationPreference.user,
  )
  notificationPreferences: NotificationPreference[];
}
