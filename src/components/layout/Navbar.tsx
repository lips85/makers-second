'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, LogOut, LogIn, UserCheck } from 'lucide-react'
import Link from 'next/link'

export function Navbar() {
  const { user, loading, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <nav className="flex items-center justify-end p-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 animate-pulse bg-gray-200 rounded-full" />
          <div className="w-20 h-4 animate-pulse bg-gray-200 rounded" />
        </div>
      </nav>
    )
  }

  return (
    <nav className="flex items-center justify-end p-4">
      <div className="flex items-center gap-3">
        {user ? (
          <>
            {/* 로그인된 사용자 정보 */}
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">
                  {user.user_metadata?.name || user.email?.split('@')[0] || '게스트 사용자'}
                </span>
                {user.email?.includes('@guest.local') ? (
                  <Badge variant="secondary" className="text-xs">게스트</Badge>
                ) : (
                  <Badge variant="default" className="text-xs">인증됨</Badge>
                )}
              </div>
            </div>

            {/* 로그아웃 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 mr-1" />
              로그아웃
            </Button>
          </>
        ) : (
          <>
            {/* 비로그인 상태 */}
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-5 w-5" />
              <span className="text-sm">로그인하지 않음</span>
            </div>

            {/* 로그인 버튼 */}
            <Button
              asChild
              variant="default"
              size="sm"
            >
              <Link href="/auth/login">
                <LogIn className="h-4 w-4 mr-1" />
                로그인
              </Link>
            </Button>
          </>
        )}
      </div>
    </nav>
  )
}
