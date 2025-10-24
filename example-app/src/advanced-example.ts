/**
 * Advanced SyntroJS Example
 * Demonstrates: DI, Background Tasks, All Features
 */

import { HTTPException, NotFoundException, SyntroJS, inject } from 'syntrojs';
import { z } from 'zod';

// ============================================
// 1. Setup App
// ============================================

const app = new SyntroJS({
  title: 'Advanced Users API',
  version: '1.0.0',
  description: 'Demonstrates DI, Background Tasks, and all SyntroJS features',
});

// ============================================
// 2. Schemas
// ============================================

const UserSchema = z.object({
  id: z.number(),
  name: z.string().min(3),
  email: z.string().email(),
  age: z.number().min(18).max(120),
  createdAt: z.string().datetime(),
});

const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true });
const UpdateUserSchema = CreateUserSchema.partial();

type User = z.infer<typeof UserSchema>;

// ============================================
// 3. Mock Database (Dependency)
// ============================================

class Database {
  private users = new Map<number, User>();
  private nextId = 1;

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async findById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async create(data: z.infer<typeof CreateUserSchema>): Promise<User> {
    const user: User = {
      id: this.nextId++,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async update(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async close(): Promise<void> {
    console.log('📦 Database connection closed');
  }
}

// ============================================
// 4. Mock Logger (Dependency)
// ============================================

interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error): void;
}

class ConsoleLogger implements Logger {
  constructor(private correlationId: string) {}

  info(message: string, meta?: Record<string, unknown>): void {
    console.log(`[${this.correlationId}] INFO: ${message}`, meta || '');
  }

  error(message: string, error?: Error): void {
    console.error(`[${this.correlationId}] ERROR: ${message}`, error || '');
  }
}

// ============================================
// 5. Dependency Factories
// ============================================

// Singleton: Database shared across all requests
const getDb = () => {
  console.log('🔌 Creating database connection...');
  return new Database();
};

// Request-scoped: Logger with correlation ID
const getLogger = (context: any): Logger => {
  return new ConsoleLogger(context.correlationId);
};

// ============================================
// 6. Routes with DI + Background Tasks
// ============================================

// Health check (no dependencies)
app.get('/health', {
  tags: ['system'],
  summary: 'Health check',
  handler: () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }),
});

// GET /users - List all users (with DI)
app.get('/users', {
  tags: ['users'],
  summary: 'List all users',
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
  }),
  dependencies: {
    db: inject(getDb, { scope: 'singleton' }),
    logger: inject(getLogger),
  },
  handler: async ({ query, dependencies }) => {
    dependencies.logger.info('Fetching users', { page: query.page, limit: query.limit });

    const users = await dependencies.db.findAll();
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit;

    return {
      users: users.slice(start, end),
      page: query.page,
      limit: query.limit,
      total: users.length,
    };
  },
});

// GET /users/:id - Get user by ID (with DI)
app.get('/users/:id', {
  tags: ['users'],
  summary: 'Get user by ID',
  params: z.object({ id: z.coerce.number() }),
  response: UserSchema,
  dependencies: {
    db: inject(getDb, { scope: 'singleton' }),
    logger: inject(getLogger),
  },
  handler: async ({ params, dependencies }) => {
    dependencies.logger.info('Fetching user', { id: params.id });

    const user = await dependencies.db.findById(params.id);

    if (!user) {
      throw new NotFoundException(`User with ID ${params.id} not found`);
    }

    return user;
  },
});

// POST /users - Create user (with DI + Background Tasks)
app.post('/users', {
  tags: ['users'],
  summary: 'Create new user',
  body: CreateUserSchema,
  response: UserSchema,
  status: 201,
  dependencies: {
    db: inject(getDb, { scope: 'singleton' }),
    logger: inject(getLogger),
  },
  handler: async ({ body, dependencies, background }) => {
    dependencies.logger.info('Creating user', { email: body.email });

    const user = await dependencies.db.create(body);

    // Background task: Send welcome email (I/O ligero)
    background.addTask(
      async () => {
        console.log(`📧 Sending welcome email to ${user.email}...`);
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate email send
        console.log(`✅ Welcome email sent to ${user.email}`);
      },
      {
        name: 'send-welcome-email',
        onComplete: () => {
          dependencies.logger.info('Welcome email sent', { userId: user.id });
        },
        onError: (error) => {
          dependencies.logger.error('Failed to send welcome email', error);
        },
      },
    );

    // Background task: Log event (I/O ligero)
    background.addTask(() => {
      dependencies.logger.info('User created event', { userId: user.id });
    });

    return user;
  },
});

// PUT /users/:id - Update user (with DI)
app.put('/users/:id', {
  tags: ['users'],
  summary: 'Update user',
  params: z.object({ id: z.coerce.number() }),
  body: UpdateUserSchema,
  response: UserSchema,
  dependencies: {
    db: inject(getDb, { scope: 'singleton' }),
    logger: inject(getLogger),
  },
  handler: async ({ params, body, dependencies }) => {
    dependencies.logger.info('Updating user', { id: params.id });

    const updated = await dependencies.db.update(params.id, body);

    if (!updated) {
      throw new NotFoundException(`User with ID ${params.id} not found`);
    }

    return updated;
  },
});

// DELETE /users/:id - Delete user (with DI + Background Tasks)
app.delete('/users/:id', {
  tags: ['users'],
  summary: 'Delete user',
  params: z.object({ id: z.coerce.number() }),
  dependencies: {
    db: inject(getDb, { scope: 'singleton' }),
    logger: inject(getLogger),
  },
  handler: async ({ params, dependencies, background }) => {
    dependencies.logger.info('Deleting user', { id: params.id });

    const user = await dependencies.db.findById(params.id);

    if (!user) {
      throw new NotFoundException(`User with ID ${params.id} not found`);
    }

    const deleted = await dependencies.db.delete(params.id);

    // Background task: Clean up user data
    background.addTask(
      async () => {
        console.log(`🧹 Cleaning up data for user ${params.id}...`);
        // Simulate cleanup (cache, files, etc.)
        await new Promise((resolve) => setTimeout(resolve, 50));
        console.log(`✅ Cleanup completed for user ${params.id}`);
      },
      { name: 'cleanup-user-data' },
    );

    return {
      deleted,
      id: params.id,
      message: 'User deleted successfully',
    };
  },
});

// ============================================
// 7. Custom Exception Handler
// ============================================

class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

app.exceptionHandler(ValidationError, (context, error) => ({
  status: 400,
  body: {
    detail: 'Custom validation error',
    field: error.field,
    message: error.message,
    path: context.path,
  },
}));

// ============================================
// 8. Start Server
// ============================================

const PORT = Number.parseInt(process.env['PORT'] || '3000', 10);

app
  .listen(PORT)
  .then((address) => {
    console.log('');
    console.log('🚀 SyntroJS Advanced Example');
    console.log('');
    console.log(`✅ Server: ${address}`);
    console.log(`📚 Docs: ${address}/docs`);
    console.log(`📖 ReDoc: ${address}/redoc`);
    console.log(`📄 OpenAPI: ${address}/openapi.json`);
    console.log('');
    console.log('Features demonstrated:');
    console.log('  ✨ Dependency Injection (singleton + request scope)');
    console.log('  ✨ Background Tasks (with warnings)');
    console.log('  ✨ Zod validation');
    console.log('  ✨ OpenAPI docs');
    console.log('  ✨ Custom exception handlers');
    console.log('  ✨ All HTTP methods (GET, POST, PUT, DELETE)');
    console.log('');
    console.log('Try it:');
    console.log(`  curl ${address}/health`);
    console.log(`  curl ${address}/users`);
    console.log(
      `  curl -X POST ${address}/users -H "Content-Type: application/json" -d '{"name":"Gaby","email":"gaby@example.com","age":30}'`,
    );
    console.log('');
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
