import { Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { User } from './user.entity';
import { Role } from './role.entity';

@Index('UQ_user_roles_user_role', ['user', 'role'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Entity()
export class UserRole extends BaseEntity {
  @ManyToOne(() => User, (user) => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, (role) => role.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
