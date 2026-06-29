import { Role } from "../../domain/models/role";

export interface LoginCommand {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  email: string;
  roles: Set<Role>;
  tokenType: string;
}
