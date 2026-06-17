import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Matches Service - Mundial 2026',
      version: '1.0.0',
      description: 'Match scheduling, live scores, fixture sync from football-data.org, and audit logging for the World Cup 2026 prediction platform.',
    },
    servers: [{ url: 'http://localhost:3002', description: 'Development' }],
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
          properties: { error: { type: 'string' } },
        },
        Match: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            homeTeam: { type: 'string', example: 'Argentina' },
            awayTeam: { type: 'string', example: 'Brazil' },
            homeLogoUrl: { type: 'string', nullable: true },
            awayLogoUrl: { type: 'string', nullable: true },
            kickoffTime: { type: 'string', format: 'date-time' },
            homeScoreActual: { type: 'integer', nullable: true, example: 2 },
            awayScoreActual: { type: 'integer', nullable: true, example: 1 },
            status: { type: 'string', enum: ['scheduled', 'live', 'finished'] },
            stage: { type: 'string', nullable: true, example: 'GROUP_STAGE' },
            group: { type: 'string', nullable: true, example: 'A' },
            matchday: { type: 'integer', nullable: true, example: 1 },
          },
        },
        MatchWithPrediction: {
          allOf: [
            { $ref: '#/components/schemas/Match' },
            {
              type: 'object',
              properties: {
                userPrediction: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    homeScorePredicted: { type: 'integer' },
                    awayScorePredicted: { type: 'integer' },
                    pointsEarned: { type: 'integer' },
                  },
                },
              },
            },
          ],
        },
        UpdateScoreInput: {
          type: 'object',
          required: ['homeScoreActual', 'awayScoreActual'],
          properties: {
            homeScoreActual: { type: 'integer', minimum: 0, maximum: 99, example: 2 },
            awayScoreActual: { type: 'integer', minimum: 0, maximum: 99, example: 1 },
          },
        },
        AuditLogInput: {
          type: 'object',
          required: ['adminUserId', 'action', 'service'],
          properties: {
            adminUserId: { type: 'string', format: 'uuid' },
            service: { type: 'string' },
            action: { type: 'string' },
            matchId: { type: 'integer', nullable: true },
            previousHome: { type: 'integer', nullable: true },
            previousAway: { type: 'integer', nullable: true },
            newHome: { type: 'integer', nullable: true },
            newAway: { type: 'integer', nullable: true },
            detail: { type: 'object', nullable: true },
          },
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            adminUserId: { type: 'string', format: 'uuid' },
            service: { type: 'string' },
            action: { type: 'string' },
            matchId: { type: 'integer', nullable: true },
            previousHome: { type: 'integer', nullable: true },
            previousAway: { type: 'integer', nullable: true },
            newHome: { type: 'integer', nullable: true },
            newAway: { type: 'integer', nullable: true },
            detail: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        SyncResult: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            upserted: { type: 'integer' },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: { 200: { description: 'Service is healthy' } },
        },
      },
      '/api/matches': {
        get: {
          tags: ['Matches'],
          summary: 'Get all matches (optionally enriched with user predictions)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'Authorization', in: 'header', schema: { type: 'string' }, description: 'Bearer token (optional — without it, matches returned without predictions)' },
          ],
          responses: {
            200: { description: 'Array of matches', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/MatchWithPrediction' } } } } },
          },
        },
      },
      '/api/admin/matches': {
        get: {
          tags: ['Admin - Matches'],
          summary: 'List all matches (admin)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Array of matches', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Match' } } } } },
          },
        },
      },
      '/api/admin/matches/{id}/score': {
        post: {
          tags: ['Admin - Matches'],
          summary: 'Update match score and trigger scoring',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateScoreInput' } } } },
          responses: {
            200: { description: 'Match updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Match' } } } },
            400: { description: 'Invalid match id or score' },
            404: { description: 'Match not found' },
          },
        },
      },
      '/api/admin/matches/sync': {
        post: {
          tags: ['Admin - Matches'],
          summary: 'Manually trigger fixture sync from football-data.org',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Sync complete', content: { 'application/json': { schema: { $ref: '#/components/schemas/SyncResult' } } } },
            500: { description: 'Sync failed' },
          },
        },
      },
      '/api/admin/matches/audit': {
        get: {
          tags: ['Admin - Matches'],
          summary: 'Get audit logs (last 500)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Audit logs', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } } } } },
          },
        },
      },
      '/internal/matches': {
        get: {
          tags: ['Internal'],
          summary: 'Get all matches (internal)',
          security: [{ internalToken: [] }],
          responses: {
            200: { description: 'Matches array', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Match' } } } } },
          },
        },
      },
      '/internal/matches/{id}': {
        get: {
          tags: ['Internal'],
          summary: 'Get match by ID (internal)',
          security: [{ internalToken: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Match data', content: { 'application/json': { schema: { $ref: '#/components/schemas/Match' } } } },
            400: { description: 'Invalid match id' },
            404: { description: 'Match not found' },
          },
        },
      },
      '/internal/audit': {
        post: {
          tags: ['Internal'],
          summary: 'Write audit log entry (internal)',
          security: [{ internalToken: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuditLogInput' } } } },
          responses: { 200: { description: 'Audit log created' } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
