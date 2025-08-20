'use client'

import { useState } from 'react'
import { TeacherCodeGenerator } from '@/components/classroom/TeacherCodeGenerator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// 임시 조직 데이터 (실제로는 API에서 가져와야 함)
const mockOrgs = [
  { id: '550e8400-e29b-41d4-a716-446655440001', name: '서울고등학교' },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: '부산중학교' },
  { id: '550e8400-e29b-41d4-a716-446655440003', name: '대구초등학교' },
]

export default function TeacherPage() {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [isOrgSelected, setIsOrgSelected] = useState(false)

  const handleOrgSelect = () => {
    if (selectedOrgId) {
      setIsOrgSelected(true)
    }
  }

  const selectedOrg = mockOrgs.find(org => org.id === selectedOrgId)

  if (!isOrgSelected) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              홈으로
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">교사 전용</h1>
        </div>

        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>조직 선택</CardTitle>
            <CardDescription>
              교실 코드를 생성할 조직을 선택하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-select">조직</Label>
              <select
                id="org-select"
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">조직을 선택하세요</option>
                {mockOrgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleOrgSelect}
              disabled={!selectedOrgId}
              className="w-full"
            >
              선택 완료
            </Button>

            <Alert>
              <AlertDescription>
                <strong>개발 모드:</strong> 현재는 모든 사용자가 교사 권한을 가집니다.
                실제 배포 시에는 적절한 인증 시스템이 필요합니다.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOrgSelected(false)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          조직 선택으로
        </Button>
        <h1 className="text-3xl font-bold">교실 코드 생성</h1>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">선택된 조직</h2>
        <p className="text-gray-600">{selectedOrg?.name}</p>
      </div>

      <TeacherCodeGenerator
        orgId={selectedOrgId}
        orgName={selectedOrg?.name || ''}
      />
    </div>
  )
}
