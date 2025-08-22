# 아래는 예시입니다
- 예시를 참고해 본인의 아이디어를 구체화해 보세요

# System Footprint & URL Map for PropertyPulse

## 1. 주요 흐름 (Key Flows)
- **Property Onboarding**: 새로운 부동산의 세부 정보와 설정을 추가하는 흐름
- **Tenant Management**: 임대 계약 생성, 세입자 심사, 커뮤니케이션 관리
- **Maintenance Handling**: 이슈 접수, 벤더 할당, 완료까지 추적
- **Financial Tracking**: 수입/지출 기록, 보고서 생성, 계좌 정산
- **Performance Analysis**: 전체 포트폴리오 지표 확인 및 개별 부동산 분석

## 2. 사용자가 방문할 URL/페이지
| Page Name | URL Path | Purpose | Access Level |
|-----------|----------|---------|--------------|
| Dashboard | `/` | 포트폴리오 지표 및 알림 요약 | Owner/Admin |
| Properties List | `/properties` | 모든 부동산 목록 조회 | Owner/Admin |
| Property Detail | `/properties/:id` | 단일 부동산 대시보드 | Owner/Admin/Property Manager |
| Tenant Portal | `/tenant` | 세입자 전용 포털 (임대 정보, 결제, 요청 등) | Tenant |
| Maintenance | `/maintenance` | 모든 유지보수 요청 목록 | Owner/Admin/Property Manager |
| Request Detail | `/maintenance/:id` | 단일 유지보수 요청 상세 | All Users (역할별 액션 제한) |
| Financials | `/financials` | 전체 포트폴리오 재무 요약 | Owner/Admin |
| Property Financials | `/properties/:id/financials` | 개별 부동산 재무 상세 | Owner/Admin/Accountant |
| Documents | `/documents` | 문서 보관 및 관리 | Owner/Admin |
| Settings | `/settings` | 시스템 설정 및 기본 환경설정 | Owner/Admin |
| User Management | `/users` | 사용자 권한 및 팀 구성원 관리 | Owner/Admin |
| Vendor Directory | `/vendors` | 서비스 공급업체 관리 | Owner/Admin/Property Manager |
| Reports | `/reports` | 맞춤형 리포트 생성 및 조회 | Owner/Admin/Accountant |
| Calendar | `/calendar` | 주요 일정 캘린더 | All Users (역할별 필터 적용) |
| Login | `/login` | 로그인 페이지 | Public |
| Signup | `/signup` | 신규 계정 생성 | Public |
| Tenant Application | `/apply/:propertyId` | 예비 세입자 신청 페이지 | Public (고유 링크 접근) |

## 3. 각 페이지에서 허용되는 기능
### Dashboard (`/`)
- 핵심 지표 및 알림 보기
- 상세 페이지로 이동
- 대시보드 환경 설정
- 알림 확인/해제

### Properties List (`/properties`)
- 모든 부동산 및 핵심 지표 조회
- 필터 및 정렬
- 새 부동산 추가
- 커스텀 기준으로 그룹화
- 데이터 내보내기

### Property Detail (`/properties/:id`)
- 부동산 세부 정보 및 설정 편집
- 점유 이력 보기
- 점검 일정 등록
- 사진 및 문서 업로드
- 공실 등록 생성
- 세입자 정보 보기
- 지출 기록

### Tenant Portal (`/tenant`)
- 임대 계약 및 문서 열람
- 유지보수 요청 제출
- 결제 이력 확인
- 임대료 납부
- 연락처 정보 수정
- 관리자와의 커뮤니케이션

### Maintenance (`/maintenance`)
- 전체 유지보수 요청 조회
- 상태, 부동산, 우선순위별 필터링
- 새 요청 생성
- 벤더 할당
- 유지보수 일정 설정
- 유지보수 비용 추적

### Request Detail (`/maintenance/:id`)
- 요청 상태 업데이트
- 이슈 관련 사진/영상 업로드
- 세입자/벤더와 커뮤니케이션
- 견적/청구서 승인
- 점검 일정 예약
- 완료된 요청 종료 처리

### Financials (`/financials`)
- 전체 포트폴리오 재무 지표 보기
- 수입/지출 비교
- 재무 리포트 생성
- 세금 신고용 데이터 내보내기
- 은행 거래 정산
- 소유주 분배금 관리

### Property Financials (`/properties/:id/financials`)
- 임대료 수납 기록
- 개별 지출 입력
- 해당 부동산의 손익 보기
- 정기 거래 등록
- 개별 부동산 전용 리포트 생성

### Documents (`/documents`)
- 문서 업로드 및 정리
- 폴더 및 분류 생성
- 문서 검색
- 접근 권한 설정
- 문서 템플릿 생성
- 템플릿 기반 자동 문서 생성

### Settings (`/settings`)
- 알림 설정 구성
- 회사 정보 입력
- 구독 및 결제 설정
- 신규 부동산의 기본 설정 구성
- 외부 서비스와의 연동 설정

### User Management (`/users`)
- 팀원 초대
- 사용자 권한 설정
- 특정 부동산에 사용자 할당
- 사용자 계정 비활성화
- 사용자 활동 로그 확인

### Vendor Directory (`/vendors`)
- 벤더 정보 등록
- 서비스 유형별 분류
- 벤더 성과 평가
- 보험/면허 추적
- 벤더 이력 및 문서 열람

### Reports (`/reports`)
- 맞춤형 리포트 생성
- 자동 리포트 예약
- 다양한 형식으로 내보내기
- 리포트 템플릿 저장
- 팀과 공유

### Calendar (`/calendar`)
- 임대 갱신 일정 확인
- 점검 및 유지보수 일정 등록
- 중요 일정에 대한 알림 설정
- 외부 캘린더와 동기화
- 부동산/이벤트 유형별 필터 적용

## 4. 사용자 역할 및 권한
- **Owner/Admin**: 전체 접근 권한 (부동산 및 시스템 설정 포함)
- **Property Manager**: 할당된 부동산에 대한 세입자 및 유지보수 관리 가능
- **Accountant/Bookkeeper**: 재무 정보만 접근 가능, 부동산 관리 권한 없음
- **Maintenance Coordinator**: 유지보수 모듈만 접근 가능
- **Tenant**: 본인의 임대 정보 및 유지보수 요청만 접근 가능
- **Vendor**: 본인에게 할당된 유지보수 요청만 제한적 접근
- **Viewer**: 투자자 또는 파트너용 읽기 전용 권한
- **Prospective Tenant**: 신청 페이지 접근만 가능

## 5. 예외 상황 및 에러 처리
- **404 Not Found**: 유효하지 않은 주소에 대한 커스텀 안내 페이지 제공
- **401 Unauthorized**: 로그인 필요 안내 후 로그인 페이지로 리디렉션
- **403 Forbidden**: 접근 불가 사유 명시
- **Offline Access**: 핵심 데이터는 오프라인에서도 접근 가능하도록 캐싱
- **Data Validation**: 잘못된 입력에 대해 명확하고 친절한 오류 메시지 제공
- **Duplicate Prevention**: 중복 부동산/세입자 등록 방지
- **Partial Payments**: 세입자가 일부 금액만 납부하는 경우 처리 지원
- **Multiple Tenants**: 하나의 유닛에 여러 세입자가 존재할 수 있도록 지원
- **Property Transfer**: 소유주 변경 시 데이터 이력 유지
- **Account Merging**: 중복 계정/부동산 병합 기능
- **Sensitive Data Handling**: 민감한 세입자 정보에 대한 강화된 보호 조치
- **Failed Payments**: 결제 실패 시 알림 및 재시도 기능
- **Emergency Maintenance**: 긴급 유지보수의 우선 처리 시스템
- **Mobile Limitations**: 모바일 화면에 맞춘 기능 간소화 및 최적화