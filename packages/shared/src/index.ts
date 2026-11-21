/**
 * The contract shared by the API and the web app.
 *
 * Keep this module free of runtime dependencies. It is compiled to CommonJS for
 * the NestJS API and imported as TypeScript source by the Vite web app.
 */

/** Response body of `GET /api/hello`. */
export interface HelloResponse {
  message: string;
}

/** Response body of `GET /api/health`. */
export interface HealthStatus {
  status: 'ok';
  service: string;
}

export const API_PREFIX = 'api';

export const API_ENDPOINTS = {
  hello: `/${API_PREFIX}/hello`,
  health: `/${API_PREFIX}/health`,
} as const;
