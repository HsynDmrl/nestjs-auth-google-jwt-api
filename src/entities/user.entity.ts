import { Entity, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Role } from './role.entity';
import { RefreshToken } from './refresh-token.entity';
import { EmailConfirmation } from './email-confirmation.entity';
import { PasswordReset } from './password-reset.entity';
import { UserActivity } from './user-activity.entity';

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

  @OneToMany(() => RefreshToken, refreshToken => refreshToken.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => EmailConfirmation, emailConfirmation => emailConfirmation.user)
  emailConfirmations: EmailConfirmation[];

  @Column({ default: false })
  emailConfirmed: boolean;

  @OneToMany(() => PasswordReset, passwordReset => passwordReset.user)
  passwordResets: PasswordReset[];

  @OneToMany(() => UserActivity, activity => activity.user) 
  activities: UserActivity[];
}
