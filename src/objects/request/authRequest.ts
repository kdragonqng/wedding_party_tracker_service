/**
 * RegisterRequest type
 * @typedef {object} RegisterRequest
 * @property {string} email.required - Email address
 * @property {string} password.required - Password (min 6 chars)
 * @property {string} name - Optional display name
 */
export class RegisterRequest {
  public email!: string;
  public password!: string;
  public name?: string;
}

/**
 * LoginRequest type
 * @typedef {object} LoginRequest
 * @property {string} email.required - Email address
 * @property {string} password.required - Password
 */
export class LoginRequest {
  public email!: string;
  public password!: string;
}

