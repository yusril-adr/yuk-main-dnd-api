export type TJWTPayload = {
  id: string;
  email: string | null;
  displayName: string;
  selectedRole: string | null;
  availableRoles: string[];
  permissions: string[];
};
