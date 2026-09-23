export type TJWTPayload = {
  id: string;
  email: string;
  displayName: string;
  selectedRole: string | null;
  availableRoles: string[];
  permissions: string[];
};
