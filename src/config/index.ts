export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiVersion: string;
  database: {
    url: string;
  };
  wompi: {
    baseUrl: string;
    publicKey: string;
    privateKey: string;
    integrityKey: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    paymentMaxRequests: number;
  };
  logging: {
    level: string;
    format: string;
  };
  cors: {
    origin: string;
  };
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvVarAsNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ? parseInt(value, 10) : defaultValue!;
}

export function loadConfig(): AppConfig {
  return {
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
    port: getEnvVarAsNumber('PORT', 3000),
    apiVersion: getEnvVar('API_VERSION', 'v1'),
    database: {
      url: getEnvVar('DATABASE_URL'),
    },
    wompi: {
      baseUrl: getEnvVar('WOMPI_BASE_URL'),
      publicKey: getEnvVar('WOMPI_PUBLIC_KEY'),
      privateKey: getEnvVar('WOMPI_PRIVATE_KEY'),
      integrityKey: getEnvVar('WOMPI_INTEGRITY_KEY'),
    },
    rateLimit: {
      windowMs: getEnvVarAsNumber('RATE_LIMIT_WINDOW_MS', 60000),
      maxRequests: getEnvVarAsNumber('RATE_LIMIT_MAX_REQUESTS', 100),
      paymentMaxRequests: getEnvVarAsNumber('RATE_LIMIT_PAYMENT_MAX_REQUESTS', 10),
    },
    logging: {
      level: getEnvVar('LOG_LEVEL', 'info'),
      format: getEnvVar('LOG_FORMAT', 'json'),
    },
    cors: {
      origin: getEnvVar('CORS_ORIGIN', '*'),
    },
  };
}

export const config = loadConfig();
