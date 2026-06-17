import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Predictions Service - Mundial 2026',
      version: '1.0.0',
      description: 'Prediction submission, scoring, leaderboard, and bonus answers for the World Cup 2026 prediction platform.',
    },
    servers: [{ url: 'http://localhost:3003', description: 'Development' }],
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
        Prediction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            matchId: { type: 'integer' },
            homeScorePredicted: { type: 'integer', example: 2 },
            awayScorePredicted: { type: 'integer', example: 1 },
            pointsEarned: { type: 'integer', example: 3 },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        SubmitPredictionInput: {
          type: 'object',
          required: ['matchId', 'homeScorePredicted', 'awayScorePredicted'],
          properties: {
            matchId: { type: 'integer', example: 1 },
            homeScorePredicted: { type: 'integer', minimum: 0, maximum: 99, example: 2 },
            awayScorePredicted: { type: 'integer', minimum: 0, maximum: 99, example: 1 },
          },
        },
        MyPrediction: {
          type: 'object',
          properties: {
            matchId: { type: 'integer' },
            homeScorePredicted: { type: 'integer' },
            awayScorePredicted: { type: 'integer' },
            pointsEarned: { type: 'integer' },
            match: {
              type: 'object',
              nullable: true,
              properties: {
                homeTeam: { type: 'string' },
                awayTeam: { type: 'string' },
                homeLogoUrl: { type: 'string', nullable: true },
                awayLogoUrl: { type: 'string', nullable: true },
                kickoffTime: { type: 'string', format: 'date-time' },
                homeScoreActual: { type: 'integer', nullable: true },
                awayScoreActual: { type: 'integer', nullable: true },
                status: { type: 'string' },
                stage: { type: 'string', nullable: true },
                group: { type: 'string', nullable: true },
              },
            },
          },
        },
        LeaderboardEntry: {
          type: 'object',
          properties: {
            rank: { type: 'integer' },
            userId: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            name: { type: 'string', nullable: true },
            totalPoints: { type: 'integer' },
          },
        },
        BonusAnswer: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            answer: { type: 'string', nullable: true },
            points: { type: 'integer' },
            tournamentWinner: { type: 'string', nullable: true },
          },
        },
        SubmitBonusAnswerInput: {
          type: 'object',
          required: ['answer'],
          properties: {
            answer: { type: 'string', minLength: 1, maxLength: 100, example: 'Argentina' },
          },
        },
        BonusConfig: {
          type: 'object',
          properties: {
            winner: { type: 'string', nullable: true },
            declaredAt: { type: 'string', nullable: true, format: 'date-time' },
          },
        },
        DeclareWinnerInput: {
          type: 'object',
          required: ['winner'],
          properties: {
            winner: { type: 'string', minLength: 1, maxLength: 100, example: 'Argentina' },
          },
        },
        AdminBonusAnswer: {
          type: 'object',
          properties: {
            userId: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            name: { type: 'string', nullable: true },
            email: { type: 'string' },
            answer: { type: 'string', nullable: true },
            points: { type: 'integer' },
            submittedAt: { type: 'string', nullable: true, format: 'date-time' },
          },
        },
        AdminPrediction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            name: { type: 'string', nullable: true },
            matchId: { type: 'integer' },
            homeScorePredicted: { type: 'integer' },
            awayScorePredicted: { type: 'integer' },
            pointsEarned: { type: 'integer' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AdminPredictionByUser: {
          type: 'object',
          properties: {
            userId: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            name: { type: 'string', nullable: true },
            email: { type: 'string' },
            totalPredictions: { type: 'integer' },
            predictions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  matchId: { type: 'integer' },
                  homeTeam: { type: 'string' },
                  awayTeam: { type: 'string' },
                  homeLogoUrl: { type: 'string', nullable: true },
                  awayLogoUrl: { type: 'string', nullable: true },
                  kickoffTime: { type: 'string', nullable: true, format: 'date-time' },
                  matchStatus: { type: 'string', nullable: true },
                  homeScoreActual: { type: 'integer', nullable: true },
                  awayScoreActual: { type: 'integer', nullable: true },
                  homeScorePredicted: { type: 'integer' },
                  awayScorePredicted: { type: 'integer' },
                  pointsEarned: { type: 'integer' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
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
      '/api/predictions': {
        post: {
          tags: ['Predictions'],
          summary: 'Submit or update a prediction',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SubmitPredictionInput' } } } },
          responses: {
            200: { description: 'Prediction saved', content: { 'application/json': { schema: { $ref: '#/components/schemas/Prediction' } } } },
            400: { description: 'Validation error' },
            403: { description: 'Prediction window closed (10 min before kickoff) or match finished' },
          },
        },
      },
      '/api/predictions/my': {
        get: {
          tags: ['Predictions'],
          summary: 'Get my predictions with match details',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'My predictions', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/MyPrediction' } } } } },
          },
        },
      },
      '/api/predictions/user/{userId}': {
        get: {
          tags: ['Predictions'],
          summary: 'Get public predictions for a user (finished/live matches only)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'User predictions', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/MyPrediction' } } } } },
          },
        },
      },
      '/api/leaderboard': {
        get: {
          tags: ['Leaderboard'],
          summary: 'Get leaderboard (excludes admins)',
          responses: {
            200: { description: 'Leaderboard entries', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/LeaderboardEntry' } } } } },
          },
        },
      },
      '/api/bonus/answer': {
        get: {
          tags: ['Bonus'],
          summary: 'Get my bonus answer',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Bonus answer data', content: { 'application/json': { schema: { $ref: '#/components/schemas/BonusAnswer' } } } },
          },
        },
        post: {
          tags: ['Bonus'],
          summary: 'Submit or update bonus answer',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SubmitBonusAnswerInput' } } } },
          responses: {
            200: { description: 'Bonus answer saved', content: { 'application/json': { schema: { $ref: '#/components/schemas/BonusAnswer' } } } },
            409: { description: 'Winner already declared, cannot change answer' },
          },
        },
      },
      '/api/admin/leaderboard/export': {
        get: {
          tags: ['Admin - Leaderboard'],
          summary: 'Export leaderboard as CSV',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'CSV file download', content: { 'text/csv': { schema: { type: 'string' } } } },
          },
        },
      },
      '/api/admin/leaderboard/{userId}': {
        delete: {
          tags: ['Admin - Leaderboard'],
          summary: 'Remove user from leaderboard',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'User removed from leaderboard' },
            404: { description: 'User not found in leaderboard' },
          },
        },
      },
      '/api/admin/predictions/all': {
        get: {
          tags: ['Admin - Predictions'],
          summary: 'Get all predictions with usernames',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'All predictions', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AdminPrediction' } } } } },
          },
        },
      },
      '/api/admin/predictions/by-user': {
        get: {
          tags: ['Admin - Predictions'],
          summary: 'Get predictions grouped by user',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Predictions by user', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AdminPredictionByUser' } } } } },
          },
        },
      },
      '/api/admin/bonus/config': {
        get: {
          tags: ['Admin - Bonus'],
          summary: 'Get bonus config (winner)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Bonus config', content: { 'application/json': { schema: { $ref: '#/components/schemas/BonusConfig' } } } },
          },
        },
      },
      '/api/admin/bonus/answers': {
        get: {
          tags: ['Admin - Bonus'],
          summary: 'Get all bonus answers with user info',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Bonus answers', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AdminBonusAnswer' } } } } },
          },
        },
      },
      '/api/admin/bonus/winner': {
        post: {
          tags: ['Admin - Bonus'],
          summary: 'Declare tournament winner and score bonus answers',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/DeclareWinnerInput' } } } },
          responses: {
            200: { description: 'Winner declared and answers scored' },
            400: { description: 'Validation error' },
          },
        },
      },
      '/internal/users': {
        post: {
          tags: ['Internal'],
          summary: 'Provision leaderboard row for new user',
          security: [{ internalToken: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { userId: { type: 'string', format: 'uuid' } }, required: ['userId'] } } } },
          responses: { 201: { description: 'Leaderboard row created' } },
        },
      },
      '/internal/users/{userId}': {
        delete: {
          tags: ['Internal'],
          summary: 'Delete all user data (predictions, bonus, leaderboard)',
          security: [{ internalToken: [] }],
          parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'User data deleted' } },
        },
      },
      '/internal/predictions/summary': {
        get: {
          tags: ['Internal'],
          summary: 'Get predictions summary for a user',
          security: [{ internalToken: [] }],
          parameters: [{ name: 'userId', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Predictions array', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Prediction' } } } } },
          },
        },
      },
      '/internal/scoring/{matchId}': {
        post: {
          tags: ['Internal'],
          summary: 'Trigger scoring for a finished match',
          security: [{ internalToken: [] }],
          parameters: [{ name: 'matchId', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Scoring completed' },
            422: { description: 'Match does not have final scores yet' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
