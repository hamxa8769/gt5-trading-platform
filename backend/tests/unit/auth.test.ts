import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyToken,
  generateTokenPair 
} from '../../src/utils/jwt';
import { AuthenticationError } from '../../src/utils/errors';

describe('JWT Utilities', () => {
  const mockUserId = 1;
  const mockEmail = 'test@example.com';
  const mockRole = 'user';

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockUserId, mockEmail, mockRole);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe(mockUserId);
      expect(decoded.email).toBe(mockEmail);
      expect(decoded.role).toBe(mockRole);
      expect(decoded.type).toBe('access');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockUserId, mockEmail, mockRole);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe(mockUserId);
      expect(decoded.email).toBe(mockEmail);
      expect(decoded.role).toBe(mockRole);
      expect(decoded.type).toBe('refresh');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(mockUserId, mockEmail, mockRole);
      const payload = verifyToken(token, 'access');
      
      expect(payload.userId).toBe(mockUserId);
      expect(payload.email).toBe(mockEmail);
      expect(payload.role).toBe(mockRole);
      expect(payload.type).toBe('access');
    });

    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(mockUserId, mockEmail, mockRole);
      const payload = verifyToken(token, 'refresh');
      
      expect(payload.userId).toBe(mockUserId);
      expect(payload.email).toBe(mockEmail);
      expect(payload.role).toBe(mockRole);
      expect(payload.type).toBe('refresh');
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      expect(() => verifyToken(invalidToken, 'access')).toThrow(AuthenticationError);
    });

    it('should throw error for mismatched token type', () => {
      const accessToken = generateAccessToken(mockUserId, mockEmail, mockRole);
      expect(() => verifyToken(accessToken, 'refresh')).toThrow(AuthenticationError);
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokenPair(mockUserId, mockEmail, mockRole);
      
      expect(tokens.access_token).toBeDefined();
      expect(tokens.refresh_token).toBeDefined();
      
      const accessPayload = verifyToken(tokens.access_token, 'access');
      const refreshPayload = verifyToken(tokens.refresh_token, 'refresh');
      
      expect(accessPayload.userId).toBe(mockUserId);
      expect(refreshPayload.userId).toBe(mockUserId);
    });
  });
});

describe('Password Hashing', () => {
  const password = 'TestPassword123!';
  
  it('should hash password correctly', async () => {
    const hash = await bcrypt.hash(password, 10);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should verify correct password', async () => {
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare('WrongPassword', hash);
    expect(isValid).toBe(false);
  });

  it('should generate different hashes for same password', async () => {
    const hash1 = await bcrypt.hash(password, 10);
    const hash2 = await bcrypt.hash(password, 10);
    expect(hash1).not.toBe(hash2);
  });
});
