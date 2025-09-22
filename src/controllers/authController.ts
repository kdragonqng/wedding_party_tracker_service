import 'reflect-metadata';
import { Request, Response } from 'express';
import { ApiController as BaseController, ApiMethod, ApiRoute, StatusCode } from 'typescript-express-basic';
import { getDb } from '../db/mongo';
import { hashPassword, verifyPassword } from '../utils/password';
import { signJwt } from '../utils/jwt';
import { RegisterRequest, LoginRequest } from '../objects/request/authRequest';
import { AuthSuccess, ErrorResponse } from '../objects/response/authResponse';
import { ObjectId } from 'mongodb';

type UserDoc = {
  _id?: ObjectId;
  email: string;
  name?: string;
  passwordHash: string;
  salt: string;
  iterations: number;
  createdAt: Date;
};

export class AuthController extends BaseController {
  public controllerName = 'auth';

  /**
   * POST /auth/register
   * @summary Register a new user
   * @tags Auth
   * @param {RegisterRequest} request.body.required - Registration payload
   * @return {AuthSuccess} 200 - success
   * @return {ErrorResponse} 400 - bad request
   */
  @ApiRoute({ method: ApiMethod.POST, path: '/register' })
  public async register(req: Request, res: Response): Promise<void> {
    const { email, password, name } = (req.body || {}) as RegisterRequest;
    if (!email || !password || password.length < 6) {
      res.status(StatusCode.BadRequest);
      res.send({ message: 'Email and password (>=6) are required' } as ErrorResponse);
      return;
    }
    const db = getDb();
    const users = db.collection<UserDoc>('users');
    try {
      await users.createIndex({ email: 1 }, { unique: true });
    } catch {}

    const existing = await users.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(StatusCode.BadRequest);
      res.send({ message: 'Email already registered' } as ErrorResponse);
      return;
    }

    const { salt, hash, iterations } = hashPassword(password);
    const doc: UserDoc = {
      email: email.toLowerCase(),
      name,
      passwordHash: hash,
      salt,
      iterations,
      createdAt: new Date(),
    };
    const result = await users.insertOne(doc);
    const userId = (result.insertedId || doc._id || new ObjectId()).toString();

    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
    const token = signJwt({ sub: userId, email: doc.email }, secret);

    const response: AuthSuccess = { token, user: { id: userId, email: doc.email, name: doc.name } };
    res.status(StatusCode.Ok);
    res.send(response);
  }

  /**
   * POST /auth/login
   * @summary Login with email and password
   * @tags Auth
   * @param {LoginRequest} request.body.required - Login payload
   * @return {AuthSuccess} 200 - success
   * @return {ErrorResponse} 401 - invalid credentials
   */
  @ApiRoute({ method: ApiMethod.POST, path: '/login' })
  public async login(req: Request, res: Response): Promise<void> {
    const { email, password } = (req.body || {}) as LoginRequest;
    if (!email || !password) {
      res.status(StatusCode.BadRequest);
      res.send({ message: 'Email and password are required' } as ErrorResponse);
      return;
    }
    const db = getDb();
    const users = db.collection<UserDoc>('users');
    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(StatusCode.Unauthorized);
      res.send({ message: 'Invalid email or password' } as ErrorResponse);
      return;
    }
    const ok = verifyPassword(password, user.salt, user.passwordHash, user.iterations);
    if (!ok) {
      res.status(StatusCode.Unauthorized);
      res.send({ message: 'Invalid email or password' } as ErrorResponse);
      return;
    }
    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
    const token = signJwt({ sub: user._id?.toString(), email: user.email }, secret);
    const response: AuthSuccess = { token, user: { id: user._id!.toString(), email: user.email, name: user.name } };
    res.status(StatusCode.Ok);
    res.send(response);
  }
}

