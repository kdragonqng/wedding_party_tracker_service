/**
 * AuthSuccess type
 * @typedef {object} AuthSuccess
 * @property {string} token.required - JWT token
 * @property {object} user.required - User info
 * @property {string} user.id.required - User id
 * @property {string} user.email.required - Email
 * @property {string} user.name - Name
 */
export class AuthSuccess {
  public token!: string;
  public user!: { id: string; email: string; name?: string };
}

/**
 * ErrorResponse type
 * @typedef {object} ErrorResponse
 * @property {string} message.required - Error message
 */
export class ErrorResponse {
  public message!: string;
}

