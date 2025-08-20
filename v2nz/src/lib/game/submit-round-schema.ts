/**
 * 라운드 제출 API 스키마 정의
 * Zod를 사용한 요청/응답 검증
 */

import { z } from 'zod';

// 라운드 아이템 스키마
export const RoundItemSchema = z.object({
  isCorrect: z.boolean(),
  responseTimeMs: z.number().min(0).max(30000),
  score: z.number().min(0)
});

// 라운드 제출 요청 스키마
export const SubmitRoundRequestSchema = z.object({
  durationSec: z.number().refine(val => [60, 75, 90].includes(val), {
    message: 'Duration must be 60, 75, or 90 seconds'
  }),
  totalQuestions: z.number().min(1).max(50),
  correctAnswers: z.number().min(0),
  items: z.array(RoundItemSchema).min(1).max(50),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  clientCalculatedScore: z.number().optional(),
  roundId: z.string().uuid().optional(), // 멱등성을 위한 ID
  wordItems: z.array(z.object({
    id: z.string().uuid(),
    word: z.string(),
    meaning: z.string()
  })).optional()
});

// 라운드 제출 응답 스키마
export const SubmitRoundResponseSchema = z.object({
  success: z.boolean(),
  roundId: z.string().uuid(),
  metrics: z.object({
    accuracy: z.number(),
    speed: z.number(),
    normalizedSpeed: z.number(),
    totalScore: z.number(),
    maxPossibleScore: z.number(),
    grade: z.string(),
    percentile: z.number().optional(),
    stanine: z.number().optional()
  }),
  percentileStats: z.object({
    percentile: z.number(),
    stanine: z.number(),
    totalPlayers: z.number()
  }).optional(),
  leaderboard: z.object({
    rank: z.number(),
    totalPlayers: z.number(),
    period: z.enum(['daily', 'weekly', 'monthly', 'all_time'])
  }).optional(),
  message: z.string().optional(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional()
  })).optional()
});

// 에러 응답 스키마
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional()
  }))
});

// 타입 추론
export type SubmitRoundRequest = z.infer<typeof SubmitRoundRequestSchema>;
export type SubmitRoundResponse = z.infer<typeof SubmitRoundResponseSchema>;
export type RoundItem = z.infer<typeof RoundItemSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// 검증 함수
export function validateSubmitRoundRequest(data: unknown): SubmitRoundRequest {
  return SubmitRoundRequestSchema.parse(data);
}

export function validateSubmitRoundResponse(data: unknown): SubmitRoundResponse {
  return SubmitRoundResponseSchema.parse(data);
}

// OpenAPI 스키마 (문서화용)
export const OpenAPISchema = {
  openapi: '3.0.0',
  info: {
    title: 'V2NZ Round Submission API',
    version: '1.0.0',
    description: 'API for submitting game round results'
  },
  paths: {
    '/api/submitRound': {
      post: {
        summary: 'Submit a game round',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SubmitRoundRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Round submitted successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SubmitRoundResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid request data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      SubmitRoundRequest: {
        type: 'object',
        required: ['durationSec', 'totalQuestions', 'correctAnswers', 'items', 'startTime', 'endTime'],
        properties: {
          durationSec: {
            type: 'integer',
            enum: [60, 75, 90],
            description: 'Round duration in seconds'
          },
          totalQuestions: {
            type: 'integer',
            minimum: 1,
            maximum: 50,
            description: 'Total number of questions in the round'
          },
          correctAnswers: {
            type: 'integer',
            minimum: 0,
            description: 'Number of correct answers'
          },
          items: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/RoundItem'
            },
            minItems: 1,
            maxItems: 50
          },
          startTime: {
            type: 'string',
            format: 'date-time',
            description: 'Round start time'
          },
          endTime: {
            type: 'string',
            format: 'date-time',
            description: 'Round end time'
          },
          clientCalculatedScore: {
            type: 'number',
            description: 'Client-calculated score for verification'
          },
          roundId: {
            type: 'string',
            format: 'uuid',
            description: 'Round ID for idempotency'
          }
        }
      },
      RoundItem: {
        type: 'object',
        required: ['isCorrect', 'responseTimeMs', 'score'],
        properties: {
          isCorrect: {
            type: 'boolean',
            description: 'Whether the answer was correct'
          },
          responseTimeMs: {
            type: 'integer',
            minimum: 0,
            maximum: 30000,
            description: 'Response time in milliseconds'
          },
          score: {
            type: 'number',
            minimum: 0,
            description: 'Score for this item'
          }
        }
      },
      SubmitRoundResponse: {
        type: 'object',
        required: ['success', 'roundId', 'metrics'],
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the submission was successful'
          },
          roundId: {
            type: 'string',
            format: 'uuid',
            description: 'Generated round ID'
          },
          metrics: {
            $ref: '#/components/schemas/RoundMetrics'
          },
          percentileStats: {
            $ref: '#/components/schemas/PercentileStats'
          },
          leaderboard: {
            $ref: '#/components/schemas/LeaderboardStats'
          },
          message: {
            type: 'string',
            description: 'Optional success message'
          }
        }
      },
      RoundMetrics: {
        type: 'object',
        required: ['accuracy', 'speed', 'normalizedSpeed', 'totalScore', 'maxPossibleScore', 'grade'],
        properties: {
          accuracy: {
            type: 'number',
            description: 'Accuracy percentage (0-100)'
          },
          speed: {
            type: 'number',
            description: 'Average response time in milliseconds'
          },
          normalizedSpeed: {
            type: 'number',
            description: 'Normalized speed score (0-100)'
          },
          totalScore: {
            type: 'number',
            description: 'Total calculated score'
          },
          maxPossibleScore: {
            type: 'number',
            description: 'Maximum possible score'
          },
          grade: {
            type: 'string',
            enum: ['S', 'A', 'B', 'C', 'D', 'F'],
            description: 'Grade based on performance'
          },
          percentile: {
            type: 'number',
            description: 'Percentile rank (0-100)'
          },
          stanine: {
            type: 'number',
            minimum: 1,
            maximum: 9,
            description: 'Stanine score'
          }
        }
      },
      PercentileStats: {
        type: 'object',
        required: ['percentile', 'stanine', 'totalPlayers'],
        properties: {
          percentile: {
            type: 'number',
            description: 'Percentile rank (0-100)'
          },
          stanine: {
            type: 'number',
            minimum: 1,
            maximum: 9,
            description: 'Stanine score'
          },
          totalPlayers: {
            type: 'number',
            description: 'Total number of players in the period'
          }
        }
      },
      LeaderboardStats: {
        type: 'object',
        required: ['rank', 'totalPlayers', 'period'],
        properties: {
          rank: {
            type: 'number',
            description: 'Current rank position'
          },
          totalPlayers: {
            type: 'number',
            description: 'Total number of players'
          },
          period: {
            type: 'string',
            enum: ['daily', 'weekly', 'monthly', 'all_time'],
            description: 'Leaderboard period'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        required: ['success', 'message'],
        properties: {
          success: {
            type: 'boolean',
            enum: [false]
          },
          message: {
            type: 'string',
            description: 'Error message'
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code'
                },
                message: {
                  type: 'string',
                  description: 'Error message'
                },
                details: {
                  type: 'object',
                  description: 'Additional error details'
                }
              }
            }
          }
        }
      }
    }
  }
};
