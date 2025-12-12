export interface CreateOrConnectUser {
  fullName?: string;
  email: string;
  password: string;
  confirmPassword?: string;
}
