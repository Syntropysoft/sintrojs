/**
 * Security Example
 * Demonstrates OAuth2, JWT, HTTPBearer, HTTPBasic, and APIKey authentication
 */

import type { FastifyRequest } from 'fastify';
import { HTTPException, TinyApi, inject } from 'tinyapi';
import {
  APIKeyHeader,
  APIKeyQuery,
  HTTPBasic,
  HTTPBearer,
  type JWTPayload,
  OAuth2PasswordBearer,
  signJWT,
  verifyJWT,
} from 'tinyapi';
import { z } from 'zod';

const app = new TinyApi();

// ============================================
// Mock Database (replace with real DB)
// ============================================

const USERS_DB = {
  admin: { password: 'secret', role: 'admin' },
  user: { password: 'pass', role: 'user' },
};

const API_KEYS_DB = {
  sk_live_abc123: { user: 'admin', scopes: ['read', 'write'] },
  sk_live_xyz789: { user: 'user', scopes: ['read'] },
};

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

// ============================================
// Security Schemes
// ============================================

const oauth2Scheme = new OAuth2PasswordBearer('/token', {
  'read:user': 'Read user data',
  'write:user': 'Write user data',
});

const bearerScheme = new HTTPBearer();
const basicScheme = new HTTPBasic();
const apiKeyHeaderScheme = new APIKeyHeader('X-API-Key');
const apiKeyQueryScheme = new APIKeyQuery('api_key');

// ============================================
// Helper: Get user from JWT
// ============================================

async function getUserFromJWT(request: FastifyRequest): Promise<JWTPayload> {
  const token = await oauth2Scheme.validate(request);
  const payload = verifyJWT(token, { secret: JWT_SECRET });
  return payload;
}

// ============================================
// Authentication Endpoints
// ============================================

// OAuth2 Token endpoint (issues JWT)
app.post('/token', {
  body: z.object({
    username: z.string(),
    password: z.string(),
  }),
  handler: ({ body }) => {
    // Verify credentials
    const user = USERS_DB[body.username as keyof typeof USERS_DB];
    if (!user || user.password !== body.password) {
      throw new HTTPException(401, 'Invalid credentials');
    }

    // Create JWT
    const token = signJWT(
      {
        sub: body.username,
        role: user.role,
      },
      {
        secret: JWT_SECRET,
        expiresIn: '1h',
      },
    );

    return {
      access_token: token,
      token_type: 'bearer',
      expires_in: 3600,
    };
  },
});

// ============================================
// Protected Endpoints - OAuth2 + JWT
// ============================================

app.get('/me', {
  dependencies: {
    user: inject(getUserFromJWT),
  },
  handler: ({ dependencies }) => {
    return {
      username: dependencies.user.sub,
      role: dependencies.user.role,
    };
  },
});

app.get('/admin/users', {
  dependencies: {
    user: inject(getUserFromJWT),
  },
  handler: ({ dependencies }) => {
    // Check admin role
    if (dependencies.user.role !== 'admin') {
      throw new HTTPException(403, 'Insufficient permissions');
    }

    return {
      users: Object.keys(USERS_DB),
    };
  },
});

// ============================================
// Protected Endpoints - HTTP Bearer (generic)
// ============================================

app.get('/bearer/resource', {
  dependencies: {
    token: inject(async (req: FastifyRequest) => bearerScheme.validate(req)),
  },
  handler: ({ dependencies }) => {
    // Verify token against your token storage
    // (this is a simplified example)
    return {
      message: 'Bearer authenticated',
      token: dependencies.token,
    };
  },
});

// ============================================
// Protected Endpoints - HTTP Basic
// ============================================

app.get('/basic/resource', {
  dependencies: {
    credentials: inject(async (req: FastifyRequest) => basicScheme.validate(req)),
  },
  handler: ({ dependencies }) => {
    const { username, password } = dependencies.credentials;

    // Verify against database
    const user = USERS_DB[username as keyof typeof USERS_DB];
    if (!user || user.password !== password) {
      throw new HTTPException(401, 'Invalid credentials');
    }

    return {
      message: 'Basic authenticated',
      username,
      role: user.role,
    };
  },
});

// ============================================
// Protected Endpoints - API Key (Header)
// ============================================

app.get('/api/resource', {
  dependencies: {
    apiKey: inject(async (req: FastifyRequest) => apiKeyHeaderScheme.validate(req)),
  },
  handler: ({ dependencies }) => {
    // Verify API key against database
    const keyData = API_KEYS_DB[dependencies.apiKey as keyof typeof API_KEYS_DB];
    if (!keyData) {
      throw new HTTPException(403, 'Invalid API key');
    }

    return {
      message: 'API Key authenticated',
      user: keyData.user,
      scopes: keyData.scopes,
    };
  },
});

// ============================================
// Protected Endpoints - API Key (Query)
// ============================================

app.get('/public/resource', {
  dependencies: {
    apiKey: inject(async (req: FastifyRequest) => apiKeyQueryScheme.validate(req)),
  },
  handler: ({ dependencies }) => {
    // Verify API key against database
    const keyData = API_KEYS_DB[dependencies.apiKey as keyof typeof API_KEYS_DB];
    if (!keyData) {
      throw new HTTPException(403, 'Invalid API key');
    }

    return {
      message: 'API Key authenticated (query)',
      user: keyData.user,
      scopes: keyData.scopes,
    };
  },
});

// ============================================
// Start Server
// ============================================

const PORT = Number.parseInt(process.env.PORT || '3000', 10);

app.listen({ port: PORT }).then(() => {
  console.log(`
🔐 Security Example Server running at http://localhost:${PORT}

Try these commands:

1. Get JWT token:
   curl -X POST http://localhost:${PORT}/token \\
     -H "Content-Type: application/json" \\
     -d '{"username":"admin","password":"secret"}'

2. Access protected endpoint with JWT:
   curl http://localhost:${PORT}/me \\
     -H "Authorization: Bearer <token>"

3. Access admin endpoint:
   curl http://localhost:${PORT}/admin/users \\
     -H "Authorization: Bearer <token>"

4. HTTP Basic authentication:
   curl http://localhost:${PORT}/basic/resource \\
     -u admin:secret

5. API Key (header):
   curl http://localhost:${PORT}/api/resource \\
     -H "X-API-Key: sk_live_abc123"

6. API Key (query):
   curl "http://localhost:${PORT}/public/resource?api_key=sk_live_abc123"
  `);
});
