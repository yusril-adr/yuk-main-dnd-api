import { LoginInput } from './login.input';

export class LoginCommand {
  constructor(public readonly payload: LoginInput) {}
}
