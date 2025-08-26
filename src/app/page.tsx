import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Play, Trophy, Users, Target } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation Bar */}
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Word Rush
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            영어 단어 스피드 퀴즈
          </p>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            60~90초 라운드 동안 텍스트 기반 단어 문제를 풀고 정확도 × 속도로
            점수를 산출하는 학습 게임
          </p>
        </header>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                빠른 시작
              </CardTitle>
              <CardDescription>
                즉시 라운드를 시작하고 단어 퀴즈에 도전하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full" size="lg">
                <Link href="/test?duration=60">
                  <Play className="h-4 w-4 mr-2" />
                  60초 라운드
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/test?duration=75">
                  <Play className="h-4 w-4 mr-2" />
                  75초 라운드
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/test?duration=90">
                  <Play className="h-4 w-4 mr-2" />
                  90초 라운드
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                그룹 참여
              </CardTitle>
              <CardDescription>
                교실 코드를 입력하여 그룹 대항전에 참여하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full" size="lg">
                코드 입력
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/teacher">교사용 코드 생성</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">빠른 학습</CardTitle>
              </div>
              <CardDescription>
                3~5분 짧은 세션으로 효율적인 단어 학습
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/leaderboard">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-lg">리더보드</CardTitle>
                </div>
                <CardDescription>
                  글로벌·친구·학교 순위로 경쟁하며 동기부여
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">그룹 대항전</CardTitle>
              </div>
              <CardDescription>
                학교/집단 대항전으로 팀워크와 경쟁
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Status Badge */}
        <div className="text-center mt-12">
          <Badge variant="secondary" className="text-sm">
            개발 중 - MVP 준비
          </Badge>
        </div>
      </div>
    </div>
  );
}
