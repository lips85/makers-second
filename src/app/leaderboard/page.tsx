"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useLeaderboardQuery,
  useMyRankQuery,
} from "@/hooks/useLeaderboardQuery";
import { useLeaderboardRealtime } from "@/hooks/useLeaderboardRealtime";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { MyRankBar } from "@/components/leaderboard/MyRankBar";
import { ScopeToggle } from "@/components/leaderboard/ScopeToggle";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

// 임시 조직 데이터 (나중에 API로 대체)
const mockOrgs = [
  { id: "1", name: "서울고등학교" },
  { id: "2", name: "부산중학교" },
  { id: "3", name: "대구초등학교" },
];

function LeaderboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터에서 상태 읽기
  const scopeFromUrl =
    (searchParams.get("scope") as "global" | "school") || "global";
  const orgIdFromUrl = searchParams.get("orgId") || undefined;

  // 로컬 상태
  const [scope, setScope] = useState<"global" | "school">(scopeFromUrl);
  const [orgId, setOrgId] = useState<string | undefined>(orgIdFromUrl);
  const [viewerUserId, setViewerUserId] = useState<string | undefined>();

  // URL 상태 동기화
  useEffect(() => {
    const params = new URLSearchParams();
    if (scope !== "global") {
      params.set("scope", scope);
    }
    if (orgId) {
      params.set("orgId", orgId);
    }

    const newUrl = params.toString() ? `?${params.toString()}` : "/leaderboard";
    console.log("URL 업데이트:", newUrl, "scope:", scope);
    router.replace(newUrl, { scroll: false });
  }, [scope, orgId, router]);

  // URL 파라미터 변경 감지
  useEffect(() => {
    const newScope =
      (searchParams.get("scope") as "global" | "school") || "global";
    const newOrgId = searchParams.get("orgId") || undefined;

    console.log("URL 파라미터 감지:", {
      newScope,
      newOrgId,
      currentScope: scope,
      currentOrgId: orgId,
    });

    if (newScope !== scope) {
      console.log("Scope 변경:", scope, "->", newScope);
      setScope(newScope);
    }
    if (newOrgId !== orgId) {
      console.log("OrgId 변경:", orgId, "->", newOrgId);
      setOrgId(newOrgId);
    }
  }, [searchParams]);

  // 임시 사용자 ID 설정 (나중에 인증 시스템으로 대체)
  useEffect(() => {
    // 로컬 스토리지에서 사용자 ID 가져오기 또는 임시 생성
    const storedUserId = localStorage.getItem("Word Rush_user_id");
    if (storedUserId) {
      setViewerUserId(storedUserId);
    } else {
      const tempUserId = `temp_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      localStorage.setItem("Word Rush_user_id", tempUserId);
      setViewerUserId(tempUserId);
    }
  }, []);

  // 리더보드 데이터 쿼리
  const {
    data: leaderboardData,
    isLoading: isLeaderboardLoading,
    error: leaderboardError,
    refetch: refetchLeaderboard,
  } = useLeaderboardQuery({
    scope,
    orgId,
    limit: 50,
    viewerUserId,
    enabled: true,
  });

  // 내 순위 쿼리
  const {
    data: myRank,
    isLoading: isMyRankLoading,
    error: myRankError,
  } = useMyRankQuery({
    scope,
    orgId,
    viewerUserId,
    enabled: !!viewerUserId,
  });

  // 실시간 업데이트
  const { isConnected } = useLeaderboardRealtime({
    scope,
    orgId,
    onUpdate: () => {
      refetchLeaderboard();
    },
    debounceMs: 1000,
  });

  // 스코프 변경 핸들러
  const handleScopeChange = (newScope: "global" | "school") => {
    console.log("handleScopeChange 호출됨:", newScope, "현재 scope:", scope);
    setScope(newScope);
    if (newScope === "global") {
      setOrgId(undefined);
    }
  };

  // 조직 변경 핸들러
  const handleOrgChange = (newOrgId: string) => {
    setOrgId(newOrgId === "all" ? undefined : newOrgId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                홈으로
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">리더보드</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchLeaderboard()}
              disabled={isLeaderboardLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  isLeaderboardLoading ? "animate-spin" : ""
                }`}
              />
              새로고침
            </Button>
            {isConnected && (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                실시간
              </div>
            )}
          </div>
        </div>

        {/* 컨트롤 패널 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <ScopeToggle
            scope={scope}
            onScopeChange={handleScopeChange}
            disabled={isLeaderboardLoading}
          />

          {scope === "school" && (
            <Select
              value={orgId || "all"}
              onValueChange={handleOrgChange}
              disabled={isLeaderboardLoading}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="학교 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 학교</SelectItem>
                {mockOrgs.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* 내 순위 바 */}
        <div className="mb-6">
          <MyRankBar myRank={myRank} isLoading={isMyRankLoading} />
        </div>

        {/* 리더보드 테이블 */}
        <LeaderboardTable
          data={leaderboardData || []}
          isLoading={isLeaderboardLoading}
          error={leaderboardError}
        />

        {/* 디버그 정보 (개발 중에만 표시) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm">
            <h3 className="font-medium mb-2">디버그 정보</h3>
            <div className="space-y-1">
              <div>Scope: {scope}</div>
              <div>Org ID: {orgId || "none"}</div>
              <div>Viewer ID: {viewerUserId || "none"}</div>
              <div>Realtime Connected: {isConnected ? "Yes" : "No"}</div>
              <div>Data Count: {leaderboardData?.length || 0}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LeaderboardContent />
    </Suspense>
  );
}
