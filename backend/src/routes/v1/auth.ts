import { Router, Request, Response, NextFunction } from 'express';
import * as authService from '../../services/auth/authService';
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema,
  validateRequest 
} from '../../utils/validation';
import { 
  RegisterRequest, 
  LoginRequest, 
  RefreshTokenRequest 
} from '../../types/api';
import { ValidationError } from '../../utils/errors';

const router = Router();

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = validateRequest<RegisterRequest>(registerSchema, req.body);

    const result = await authService.register(
      validatedData.email,
      validatedData.password,
      validatedData.first_name,
      validatedData.last_name
    );

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('[')) {
      try {
        const details = JSON.parse(error.message);
        next(new ValidationError('Validation failed', details));
      } catch {
        next(error);
      }
    } else {
      next(error);
    }
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = validateRequest<LoginRequest>(loginSchema, req.body);

    const result = await authService.login(
      validatedData.email,
      validatedData.password
    );

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('[')) {
      try {
        const details = JSON.parse(error.message);
        next(new ValidationError('Validation failed', details));
      } catch {
        next(error);
      }
    } else {
      next(error);
    }
  }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = validateRequest<RefreshTokenRequest>(refreshTokenSchema, req.body);

    const result = await authService.refreshAccessToken(validatedData.refresh_token);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('[')) {
      try {
        const details = JSON.parse(error.message);
        next(new ValidationError('Validation failed', details));
      } catch {
        next(error);
      }
    } else {
      next(error);
    }
  }
});

export default router;
