"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Target,
  Zap,
  Clock,
  RotateCcw,
  Home,
  TrendingUp,
  Award,
  Star,
} from "lucide-react";
import Link from "next/link";
import { formatTime } from "@/lib/utils/time";
import { calculateGrade } from "@/lib/game/scoring";
import type { GameStats } from "@/lib/game/scoring";
import { BottomBanner } from "@/components/ads/AdBanner";

interface GameResultModalProps {
  stats: GameStats;
  totalTime: number;
  onRestart: () => void;
  isOpen: boolean;
  percentileStats?: {
    percentile: number;
    stanine: number;
    totalPlayers: number;
  };
  leaderboard?: {
    rank: number;
    totalPlayers: number;
    period: string;
  };
}

export function GameResultModal({
  stats,
  totalTime,
  onRestart,
  isOpen,
  percentileStats,
  leaderboard,
}: GameResultModalProps) {
  if (!isOpen) return null;

  const grade = calculateGrade(stats.accuracy);
  const performanceRating = Math.round(
    stats.accuracy * 0.4 +
      (stats.maxCombo / 10) * 100 * 0.3 +
      (totalTime / stats.averageResponseTime) * 100 * 0.3
  );

  // 스테나인 색상 매핑
  const getStanineColor = (stanine: number) => {
    if (stanine >= 8)
      return "text-purple-600 bg-purple-100 dark:bg-purple-900/20";
    if (stanine >= 6) return "text-blue-600 bg-blue-100 dark:bg-blue-900/20";
    if (stanine >= 4) return "text-green-600 bg-green-100 dark:bg-green-900/20";
    if (stanine >= 2)
      return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
    return "text-red-600 bg-red-100 dark:bg-red-900/20";
  };

  // 퍼센타일 등급
  const getPercentileGrade = (percentile: number) => {
    if (percentile >= 95) return { grade: "S", color: "text-purple-600" };
    if (percentile >= 85) return { grade: "A+", color: "text-blue-600" };
    if (percentile >= 75) return { grade: "A", color: "text-green-600" };
    if (percentile >= 60) return { grade: "B+", color: "text-yellow-600" };
    if (percentile >= 40) return { grade: "B", color: "text-orange-600" };
    if (percentile >= 25) return { grade: "C", color: "text-red-600" };
    return { grade: "D", color: "text-gray-600" };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl mx-auto flex flex-col h-[90vh]">
        <Card className="flex-1 overflow-y-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              게임 결과
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Grade & Performance Rating */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {grade}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  성적 등급
                </p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {performanceRating}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  종합 성과 / 100점
                </p>
              </div>
            </div>

            {/* Percentile & Stanine Stats */}
            {percentileStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      퍼센타일
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {percentileStats.percentile.toFixed(1)}%
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      getPercentileGrade(percentileStats.percentile).color
                    }`}
                  >
                    {getPercentileGrade(percentileStats.percentile).grade}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    상위 {percentileStats.totalPlayers.toLocaleString()}명 중
                  </p>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      스테나인
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {percentileStats.stanine}
                  </div>
                  <Badge
                    className={`${getStanineColor(
                      percentileStats.stanine
                    )} border-0`}
                  >
                    {percentileStats.stanine >= 8
                      ? "우수"
                      : percentileStats.stanine >= 6
                      ? "양호"
                      : percentileStats.stanine >= 4
                      ? "보통"
                      : percentileStats.stanine >= 2
                      ? "미흡"
                      : "부족"}
                  </Badge>
                </div>
              </div>
            )}

            {/* Accuracy Donut Chart */}
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  정확도
                </span>
              </div>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 36 * (1 - stats.accuracy / 100)
                    }`}
                    className="text-blue-600 transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.accuracy.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Speed Gauge */}
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-green-600" />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  평균 응답 속도
                </span>
              </div>
              <div className="relative">
                <Progress
                  value={Math.min(
                    100,
                    (1000 / Math.max(stats.averageResponseTime / 1000, 0.5)) *
                      100
                  )}
                  className="h-3 mb-2"
                />
                <div className="text-2xl font-bold text-green-600">
                  {(stats.averageResponseTime / 1000).toFixed(1)}초
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.averageResponseTime < 2000
                    ? "매우 빠름"
                    : stats.averageResponseTime < 4000
                    ? "빠름"
                    : stats.averageResponseTime < 6000
                    ? "보통"
                    : "느림"}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalScore.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  총 점수
                </p>
              </div>

              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.maxCombo}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  최대 콤보
                </p>
              </div>

              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.correctAnswers}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  정답 수
                </p>
              </div>

              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.totalQuestions}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  총 문제
                </p>
              </div>
            </div>

            {/* Leaderboard Info */}
            {leaderboard && (
              <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    리더보드 순위
                  </span>
                </div>
                <div className="text-3xl font-bold text-yellow-600 mb-1">
                  {leaderboard.rank === 0 ? "N/A" : `${leaderboard.rank}위`}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  총 {leaderboard.totalPlayers.toLocaleString()}명 참여
                </p>
              </div>
            )}

            {/* Additional Stats */}
            <div className="space-y-2 text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  총 시간:
                </span>
                <span className="font-medium">{formatTime(totalTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  정답률:
                </span>
                <span className="font-medium">
                  {(
                    (stats.correctAnswers / stats.totalQuestions) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              {stats.maxCombo > 1 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    콤보 횟수:
                  </span>
                  <span className="font-medium">{stats.maxCombo}회</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  홈으로
                </Link>
              </Button>
              <Button onClick={onRestart} className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                다시 시작
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 광고 배너 */}
        <BottomBanner adUnitId="game-result-bottom" className="mt-4" />
      </div>
    </div>
  );
}
