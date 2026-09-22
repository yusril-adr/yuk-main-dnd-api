import { TJWTPayload } from '@shared/types/jwt-payload.type';

export type TRequestUser = {
  user: TJWTPayload;
  token: string;
};
