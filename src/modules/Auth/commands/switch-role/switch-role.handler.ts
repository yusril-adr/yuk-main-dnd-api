import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthService } from '../../services/auth.service';
import { LoginOutput } from '../login/login.output';
import { SwitchRoleCommand } from './switch-role.command';

@CommandHandler(SwitchRoleCommand)
export class SwitchRoleHandler implements ICommandHandler<
  SwitchRoleCommand,
  LoginOutput
> {
  constructor(private readonly authService: AuthService) {}

  async execute(command: SwitchRoleCommand): Promise<LoginOutput> {
    return this.authService.switchRole(command.roleKey, command.currentUser);
  }
}
