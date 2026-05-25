const REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'PREDICTIONS_SERVICE_URL', 'INTERNAL_SERVICE_TOKEN'] as const;

export function validateEnv(): void {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[auth-service] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}
