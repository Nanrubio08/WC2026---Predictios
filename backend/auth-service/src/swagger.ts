import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth Service - Mundial 2026',
      version: '1.0.0',
      description: 'Authentication, user management, and invite code service for the World Cup 2026 prediction platform.',
    },
    servers: [{ url: 'http://localhost:3001', description: 'Development' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        internalToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-internal-token',
          description: 'Internal service-to-service token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            field: { type: 'string', nullable: true },
          },
        },
        RegisterInput: {
          type: 'object',
          required: ['name', 'username', 'email', 'password', 'code'],
          properties: {
            name: { type: 'string', minLength: 5, maxLength: 80, example: 'Juan Pérez' },
            username: { type: 'string', minLength: 3, maxLength: 30, pattern: '^[a-zA-Z0-9_]+$', example: 'juanperez' },
            email: { type: 'string', format: 'email', example: 'juan@example.com' },
            password: { type: 'string', minLength: 8, maxLength: 128, example: 'securepass123' },
            code: { type: 'string', minLength: 6, maxLength: 6, pattern: '^[0-9]{6}$', example: '123456' },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'juan@example.com' },
            password: { type: 'string', example: 'securepass123' },
          },
        },
        GoogleAuthInput: {
          type: 'object',
          required: ['credential'],
          properties: {
            credential: { type: 'string', description: 'Google ID token' },
            code: { type: 'string', description: 'Invite code (required for new non-admin users)' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                username: { type: 'string' },
                email: { type: 'string', format: 'email' },
                role: { type: 'string', enum: ['user', 'admin'] },
              },
            },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            favoriteTeam: { type: 'string', nullable: true },
            avatarUrl: { type: 'string', nullable: true },
            isAdmin: { type: 'boolean' },
            role: { type: 'string', enum: ['user', 'admin'] },
          },
        },
        UpdateProfileInput: {
          type: 'object',
          properties: {
            name: { type: 'string', maxLength: 100 },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', maxLength: 20 },
            favoriteTeam: { type: 'string', maxLength: 100 },
          },
        },
        ChangePasswordInput: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string' },
            newPassword: { type: 'string', minLength: 8, maxLength: 128 },
          },
        },
        AvatarInput: {
          type: 'object',
          required: ['avatar'],
          properties: {
            avatar: { type: 'string', description: 'Base64 data URI (jpeg/png/webp), max ~11M chars' },
          },
        },
        ForgotPasswordInput: {
          type: 'object',
          properties: { email: { type: 'string', format: 'email' } },
        },
        ResetPasswordInput: {
          type: 'object',
          required: ['token', 'newPassword'],
          properties: {
            token: { type: 'string', description: 'Reset token received via email' },
            newPassword: { type: 'string', minLength: 8, maxLength: 128 },
          },
        },
        BatchUsersInput: {
          type: 'object',
          required: ['userIds'],
          properties: {
            userIds: {
              type: 'array',
              items: { type: 'string', format: 'uuid' },
              minItems: 1,
              maxItems: 200,
            },
          },
        },
        BatchUsersResponse: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              username: { type: 'string' },
              name: { type: 'string', nullable: true },
              isAdmin: { type: 'boolean' },
            },
          },
        },
        InternalUserResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            name: { type: 'string', nullable: true },
            email: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        UpdateUserInput: {
          type: 'object',
          properties: {
            username: { type: 'string', minLength: 3, maxLength: 30 },
            name: { type: 'string', nullable: true, maxLength: 80 },
            email: { type: 'string', format: 'email' },
            isAdmin: { type: 'boolean' },
          },
        },
        GenerateCodesInput: {
          type: 'object',
          required: ['count'],
          properties: {
            count: { type: 'integer', minimum: 1, maximum: 500, example: 10 },
          },
        },
        InviteCode: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            status: { type: 'string', enum: ['available', 'used'] },
            username: { type: 'string', nullable: true },
            email: { type: 'string', nullable: true, format: 'email' },
            usedAt: { type: 'string', nullable: true, format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: { 200: { description: 'Service is healthy', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' }, service: { type: 'string' } } } } } } },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } } } },
          responses: {
            201: { description: 'User registered successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            409: { description: 'Username or email already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login with email and password',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } } },
          responses: {
            200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/google': {
        post: {
          tags: ['Auth'],
          summary: 'Login or register with Google',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/GoogleAuthInput' } } } },
          responses: {
            200: { description: 'Google auth successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            400: { description: 'Missing credential or invite code' },
          },
        },
      },
      '/api/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token using httpOnly cookie',
          responses: {
            200: { description: 'New token issued', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' } } } } } },
            401: { description: 'Invalid or expired refresh token' },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout and clear refresh token',
          responses: { 204: { description: 'Logged out successfully' } },
        },
      },
      '/api/auth/profile': {
        get: {
          tags: ['Profile'],
          summary: 'Get current user profile',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Profile data', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserProfile' } } } },
            401: { description: 'Unauthorized' },
          },
        },
        put: {
          tags: ['Profile'],
          summary: 'Update user profile',
          security: [{ bearerAuth: [] }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProfileInput' } } } },
          responses: {
            200: { description: 'Profile updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserProfile' } } } },
            401: { description: 'Unauthorized' },
            409: { description: 'Email already in use' },
          },
        },
      },
      '/api/auth/profile/password': {
        put: {
          tags: ['Profile'],
          summary: 'Change password',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordInput' } } } },
          responses: {
            200: { description: 'Password updated' },
            400: { description: 'Account uses Google Sign-In or validation error' },
            401: { description: 'Current password is incorrect' },
          },
        },
      },
      '/api/auth/profile/avatar': {
        put: {
          tags: ['Profile'],
          summary: 'Upload avatar (base64 data URI)',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AvatarInput' } } } },
          responses: {
            200: { description: 'Avatar updated', content: { 'application/json': { schema: { type: 'object', properties: { avatarUrl: { type: 'string' } } } } } },
            400: { description: 'Invalid image format' },
          },
        },
      },
      '/api/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Request password reset email',
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordInput' } } } },
          responses: { 200: { description: 'Always returns 200 to prevent email enumeration' } },
        },
      },
      '/api/auth/reset-password': {
        post: {
          tags: ['Auth'],
          summary: 'Reset password using token from email',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordInput' } } } },
          responses: {
            200: { description: 'Password reset successful' },
            400: { description: 'Invalid or expired token' },
          },
        },
      },
      '/api/admin/users': {
        get: {
          tags: ['Admin - Users'],
          summary: 'List all users',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'List of users', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/UserProfile' } } } } },
            401: { description: 'Unauthorized' },
            403: { description: 'Admin access required' },
          },
        },
      },
      '/api/admin/users/{userId}': {
        patch: {
          tags: ['Admin - Users'],
          summary: 'Update a user',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUserInput' } } } },
          responses: {
            200: { description: 'User updated' },
            400: { description: 'Cannot edit own account from admin panel' },
            403: { description: 'Admin access required' },
            404: { description: 'User not found' },
          },
        },
        delete: {
          tags: ['Admin - Users'],
          summary: 'Delete a user',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'User deleted' },
            400: { description: 'Cannot delete yourself or an admin' },
            403: { description: 'Admin access required' },
            404: { description: 'User not found' },
          },
        },
      },
      '/api/admin/invite-codes/generate': {
        post: {
          tags: ['Admin - Invite Codes'],
          summary: 'Generate invite codes',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/GenerateCodesInput' } } } },
          responses: {
            201: { description: 'Codes generated', content: { 'application/json': { schema: { type: 'object', properties: { generated: { type: 'integer' }, codes: { type: 'array', items: { type: 'string' } } } } } } },
            400: { description: 'Invalid count' },
          },
        },
      },
      '/api/admin/invite-codes': {
        get: {
          tags: ['Admin - Invite Codes'],
          summary: 'List invite codes with user info',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'List of invite codes', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/InviteCode' } } } } },
          },
        },
      },
      '/api/admin/invite-codes/export': {
        get: {
          tags: ['Admin - Invite Codes'],
          summary: 'Export invite codes as CSV',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'CSV file', content: { 'text/csv': { schema: { type: 'string' } } } },
          },
        },
      },
      '/internal/users/batch': {
        post: {
          tags: ['Internal'],
          summary: 'Batch fetch users by IDs',
          security: [{ internalToken: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/BatchUsersInput' } } } },
          responses: {
            200: { description: 'Users array', content: { 'application/json': { schema: { $ref: '#/components/schemas/BatchUsersResponse' } } } },
          },
        },
      },
      '/internal/users/all': {
        get: {
          tags: ['Internal'],
          summary: 'Get all non-admin users',
          security: [{ internalToken: [] }],
          responses: {
            200: { description: 'Users array', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/InternalUserResponse' } } } } },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
