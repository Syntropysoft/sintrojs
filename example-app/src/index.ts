/**
 * Example SyntroJS Application
 * Demonstrates all core features
 */

import { HTTPException, NotFoundException, SyntroJS } from 'syntrojs';
import { z } from 'zod';

// Create app instance
const app = new SyntroJS({
  title: 'Users API',
  version: '1.0.0',
  description: 'A simple API for managing users',
});

// Simple health check
app.get('/health', {
  tags: ['health'],
  summary: 'Health check',
  description: 'Returns API health status',
  handler: () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }),
});

// User schema
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(18),
  createdAt: z.string().datetime(),
});

const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true });

// In-memory database
const users = new Map<number, z.infer<typeof UserSchema>>();
let nextId = 1;

// GET /users - List all users
app.get('/users', {
  tags: ['users'],
  summary: 'List all users',
  description: 'Returns a list of all registered users',
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
  }),
  response: z.object({
    users: z.array(UserSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  }),
  handler: ({ query }) => {
    const allUsers = Array.from(users.values());
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit;

    return {
      users: allUsers.slice(start, end),
      total: allUsers.length,
      page: query.page,
      limit: query.limit,
    };
  },
});

// GET /users/:id - Get user by ID
app.get('/users/:id', {
  tags: ['users'],
  summary: 'Get user by ID',
  description: 'Returns a single user by their ID',
  params: z.object({
    id: z.coerce.number(),
  }),
  response: UserSchema,
  handler: ({ params }) => {
    const user = users.get(params.id);

    if (!user) {
      throw new NotFoundException(`User with ID ${params.id} not found`);
    }

    return user;
  },
});

// POST /users - Create user
app.post('/users', {
  tags: ['users'],
  summary: 'Create new user',
  description: 'Creates a new user and returns the created user data',
  body: CreateUserSchema,
  response: UserSchema,
  status: 201,
  handler: ({ body }) => {
    const user: z.infer<typeof UserSchema> = {
      id: nextId++,
      ...body,
      createdAt: new Date().toISOString(),
    };

    users.set(user.id, user);

    return user;
  },
});

// PUT /users/:id - Update user
app.put('/users/:id', {
  tags: ['users'],
  summary: 'Update user',
  description: 'Updates an existing user',
  params: z.object({
    id: z.coerce.number(),
  }),
  body: CreateUserSchema.partial(),
  response: UserSchema,
  handler: ({ params, body }) => {
    const user = users.get(params.id);

    if (!user) {
      throw new NotFoundException(`User with ID ${params.id} not found`);
    }

    const updated = {
      ...user,
      ...body,
    };

    users.set(params.id, updated);

    return updated;
  },
});

// DELETE /users/:id - Delete user
app.delete('/users/:id', {
  tags: ['users'],
  summary: 'Delete user',
  description: 'Deletes a user by ID',
  params: z.object({
    id: z.coerce.number(),
  }),
  response: z.object({
    success: z.boolean(),
    deletedId: z.number(),
  }),
  handler: ({ params }) => {
    if (!users.has(params.id)) {
      throw new NotFoundException(`User with ID ${params.id} not found`);
    }

    users.delete(params.id);

    return {
      success: true,
      deletedId: params.id,
    };
  },
});

// Custom error handling example
class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

app.exceptionHandler(DatabaseError, (context, error) => ({
  status: 503,
  body: {
    detail: 'Database service temporarily unavailable',
    error: error.message,
    path: context.path,
  },
}));

// Start server
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT).then((address) => {
  console.log('\n🚀 SyntroJS Example App');
  console.log(`Server running at ${address}\n`);
  console.log('📖 Interactive Documentation:');
  console.log(`   Swagger UI: ${address}/docs`);
  console.log(`   ReDoc:      ${address}/redoc`);
  console.log(`   OpenAPI:    ${address}/openapi.json\n`);
  console.log('🔗 API Endpoints:');
  console.log(`   GET    ${address}/health`);
  console.log(`   GET    ${address}/users`);
  console.log(`   GET    ${address}/users/:id`);
  console.log(`   POST   ${address}/users`);
  console.log(`   PUT    ${address}/users/:id`);
  console.log(`   DELETE ${address}/users/:id\n`);
  console.log('💡 Try creating a user:');
  console.log(`   curl -X POST ${address}/users \\`);
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"name":"Gaby","email":"gaby@example.com","age":30}\'\n');
});
