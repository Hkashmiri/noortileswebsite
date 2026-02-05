import { z } from 'zod';
import { insertScoreSchema, levels, levelScores } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  levels: {
    list: {
      method: 'GET' as const,
      path: '/api/levels',
      responses: {
        200: z.array(z.custom<typeof levels.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/levels/:id',
      responses: {
        200: z.custom<typeof levels.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  scores: {
    submit: {
      method: 'POST' as const,
      path: '/api/scores',
      input: insertScoreSchema,
      responses: {
        201: z.custom<typeof levelScores.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    listMyScores: {
      method: 'GET' as const,
      path: '/api/scores/me',
      responses: {
        200: z.array(z.custom<typeof levelScores.$inferSelect & { level: typeof levels.$inferSelect }>()),
        401: errorSchemas.unauthorized,
      },
    },
    getLeaderboard: {
      method: 'GET' as const,
      path: '/api/scores/leaderboard/:levelId',
      responses: {
        200: z.array(z.custom<{
          username: string;
          score: number;
          accuracy: number;
          isFullCombo: boolean;
        }>()),
      },
    },
  },
};

// ============================================
// REQUIRED: buildUrl helper
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type ScoreInput = z.infer<typeof api.scores.submit.input>;
export type LevelsListResponse = z.infer<typeof api.levels.list.responses[200]>;
