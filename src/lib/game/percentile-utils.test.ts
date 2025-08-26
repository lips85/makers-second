import { PercentileCalculator } from './percentile-utils';

// Supabase 클라이언트 모킹
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    rpc: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            then: jest.fn()
          }))
        }))
      }))
    }))
  }))
}));

describe('PercentileCalculator', () => {
  let calculator: PercentileCalculator;
  let mockSupabase: any;

  beforeEach(() => {
    calculator = new PercentileCalculator('test-url', 'test-key');
    mockSupabase = (calculator as any).supabase;
  });

  describe('정적 메서드', () => {
    describe('getPercentileGrade', () => {
      it('퍼센타일에 따른 올바른 등급을 반환해야 한다', () => {
        expect(PercentileCalculator.getPercentileGrade(95)).toBe('상위 5%');
        expect(PercentileCalculator.getPercentileGrade(90)).toBe('상위 10%');
        expect(PercentileCalculator.getPercentileGrade(80)).toBe('상위 20%');
        expect(PercentileCalculator.getPercentileGrade(70)).toBe('상위 30%');
        expect(PercentileCalculator.getPercentileGrade(60)).toBe('상위 40%');
        expect(PercentileCalculator.getPercentileGrade(50)).toBe('상위 50%');
        expect(PercentileCalculator.getPercentileGrade(40)).toBe('상위 60%');
        expect(PercentileCalculator.getPercentileGrade(30)).toBe('상위 70%');
        expect(PercentileCalculator.getPercentileGrade(20)).toBe('상위 80%');
        expect(PercentileCalculator.getPercentileGrade(10)).toBe('상위 90%');
        expect(PercentileCalculator.getPercentileGrade(5)).toBe('상위 100%');
      });
    });

    describe('getStanineGrade', () => {
      it('스테나인에 따른 올바른 등급을 반환해야 한다', () => {
        expect(PercentileCalculator.getStanineGrade(9)).toBe('매우 우수');
        expect(PercentileCalculator.getStanineGrade(8)).toBe('우수');
        expect(PercentileCalculator.getStanineGrade(7)).toBe('양호');
        expect(PercentileCalculator.getStanineGrade(6)).toBe('보통');
        expect(PercentileCalculator.getStanineGrade(5)).toBe('평균');
        expect(PercentileCalculator.getStanineGrade(4)).toBe('보통');
        expect(PercentileCalculator.getStanineGrade(3)).toBe('미흡');
        expect(PercentileCalculator.getStanineGrade(2)).toBe('부족');
        expect(PercentileCalculator.getStanineGrade(1)).toBe('매우 부족');
        expect(PercentileCalculator.getStanineGrade(0)).toBe('평가 불가');
      });
    });
  });

  describe('calculatePercentileStats', () => {
    it('Supabase 함수 호출 성공 시 올바른 결과를 반환해야 한다', async () => {
      const mockData = [{
        percentile: 75,
        stanine: 6,
        total_players: 100
      }];

      mockSupabase.rpc.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await calculator.calculatePercentileStats(1000, 'daily', 60);

      expect(result).toEqual({
        percentile: 75,
        stanine: 6,
        totalPlayers: 100
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_percentile_and_stanine', {
        target_score: 1000,
        period_type: 'daily',
        duration_sec: 60
      });
    });

    it('Supabase 함수 호출 실패 시 폴백 계산을 사용해야 한다', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      // 폴백 계산을 위한 모킹
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({
          data: [{ score: 800 }, { score: 900 }, { score: 1000 }],
          error: null
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await calculator.calculatePercentileStats(950, 'daily');

      expect(result.percentile).toBeDefined();
      expect(result.stanine).toBeDefined();
      expect(result.totalPlayers).toBe(3);
    });

    it('예외 발생 시 기본값을 반환해야 한다', async () => {
      mockSupabase.rpc.mockRejectedValue(new Error('Network error'));

      // 폴백 계산도 실패하도록 모킹
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Fallback failed' }
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await calculator.calculatePercentileStats(1000);

      expect(result).toEqual({
        percentile: 0,
        stanine: 1,
        totalPlayers: 0
      });
    }, 10000); // 타임아웃 증가
  });

  describe('getUserPercentileStats', () => {
    it('사용자 통계 조회 성공 시 올바른 결과를 반환해야 한다', async () => {
      const mockData = [{
        user_id: 'user-123',
        score: 1000,
        percentile: 75,
        stanine: 6,
        rank_position: 25,
        total_players: 100
      }];

      mockSupabase.rpc.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await calculator.getUserPercentileStats('user-123', 'daily');

      expect(result).toEqual({
        userId: 'user-123',
        score: 1000,
        percentile: 75,
        stanine: 6,
        rankPosition: 25,
        totalPlayers: 100
      });
    });

    it('사용자 데이터가 없을 때 null을 반환해야 한다', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await calculator.getUserPercentileStats('user-123');

      expect(result).toBeNull();
    });

    it('에러 발생 시 null을 반환해야 한다', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      });

      const result = await calculator.getUserPercentileStats('user-123');

      expect(result).toBeNull();
    });
  });

  describe('calculateBatchPercentiles', () => {
    it('여러 점수에 대한 퍼센타일을 일괄 계산해야 한다', async () => {
      const mockData = [
        { percentile: 75, stanine: 6, total_players: 100 },
        { percentile: 90, stanine: 8, total_players: 100 }
      ];

      mockSupabase.rpc
        .mockResolvedValueOnce({
          data: [mockData[0]],
          error: null
        })
        .mockResolvedValueOnce({
          data: [mockData[1]],
          error: null
        });

      const results = await calculator.calculateBatchPercentiles([1000, 1200], 'daily');

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        percentile: 75,
        stanine: 6,
        totalPlayers: 100
      });
      expect(results[1]).toEqual({
        percentile: 90,
        stanine: 8,
        totalPlayers: 100
      });
    });
  });

  describe('폴백 계산', () => {
    it('기간별 필터링이 올바르게 작동해야 한다', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({
          data: [{ score: 1000 }],
          error: null
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await calculator.calculatePercentileStats(1000, 'weekly');

      expect(mockSupabase.from).toHaveBeenCalledWith('leaderboards');
      expect(mockQuery.eq).toHaveBeenCalledWith('period', 'weekly');
    });

    it('durationSec 필터가 적용되어야 한다', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({
          data: [{ score: 1000 }],
          error: null
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await calculator.calculatePercentileStats(1000, 'daily', 60);

      expect(mockQuery.eq).toHaveBeenCalledWith('period', 'daily');
      expect(mockQuery.eq).toHaveBeenCalledWith('duration_sec', 60);
    });
  });
});
