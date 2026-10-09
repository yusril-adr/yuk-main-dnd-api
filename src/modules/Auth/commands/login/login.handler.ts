import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthService } from '../../services/auth.service';
import { LoginCommand } from './login.command';
import { LoginOutput } from './login.output';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<
  LoginCommand,
  LoginOutput
> {
  constructor(private readonly authService: AuthService) {}

  async execute(command: LoginCommand): Promise<LoginOutput> {
    return this.authService.loginByPassword(command.payload);
  }
}
