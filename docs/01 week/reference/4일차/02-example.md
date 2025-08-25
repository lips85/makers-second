# 아래는 예시입니다
- 예시를 참고해 본인의 아이디어를 구체화해 보세요

# Data Model Planning Worksheet

## 1. 시스템의 핵심 엔터티(Entities)는 무엇인가요? (3~5개)

- Property
- Tenant
- Lease
- MaintenanceRequest
- Transaction
- User

## 2. 각 엔터티의 필드를 정의하세요:

**Property**
- `id` (UUID)
- `name` (string)
- `address` (string)
- `city` (string)
- `state` (string)
- `zip_code` (string)
- `property_type` (enum: single_family, multi_family, condo, commercial)
- `units` (integer)
- `square_footage` (integer)
- `year_built` (integer)
- `purchase_date` (date)
- `purchase_price` (decimal)
- `current_value` (decimal)
- `owner_id` (foreign key to User)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Tenant**
- `id` (UUID)
- `first_name` (string)
- `last_name` (string)
- `email` (string)
- `phone` (string)
- `date_of_birth` (date)
- `ssn_last_four` (string)
- `credit_score` (integer)
- `emergency_contact_name` (string)
- `emergency_contact_phone` (string)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Lease**
- `id` (UUID)
- `property_id` (foreign key to Property)
- `unit_number` (string)
- `tenant_id` (foreign key to Tenant)
- `start_date` (date)
- `end_date` (date)
- `rent_amount` (decimal)
- `security_deposit` (decimal)
- `status` (enum: active, expired, terminated, renewal_pending)
- `lease_document_url` (string)
- `payment_day` (integer)
- `late_fee_amount` (decimal)
- `late_fee_days` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**MaintenanceRequest**
- `id` (UUID)
- `property_id` (foreign key to Property)
- `unit_number` (string)
- `tenant_id` (foreign key to Tenant)
- `title` (string)
- `description` (text)
- `category` (enum: plumbing, electrical, hvac, appliance, structural, other)
- `priority` (enum: emergency, high, medium, low)
- `status` (enum: submitted, scheduled, in_progress, completed, cancelled)
- `submitted_date` (timestamp)
- `scheduled_date` (timestamp)
- `completed_date` (timestamp)
- `vendor_id` (foreign key to Vendor)
- `cost` (decimal)
- `notes` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Transaction**
- `id` (UUID)
- `property_id` (foreign key to Property)
- `lease_id` (foreign key to Lease)
- `amount` (decimal)
- `date` (date)
- `type` (enum: rent_payment, deposit, expense, owner_draw)
- `category` (enum: maintenance, tax, insurance, utilities, mortgage, etc.)
- `description` (string)
- `payment_method` (enum: ach, check, cash, credit_card, other)
- `reference_number` (string)
- `recurring` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**User**
- `id` (UUID)
- `email` (string)
- `password_hash` (string)
- `first_name` (string)
- `last_name` (string)
- `phone` (string)
- `role` (enum: owner, property_manager, accountant, tenant, vendor, admin)
- `status` (enum: active, inactive)
- `last_login` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)
  
## 3. 어떤 관계들이 존재하나요?
- One User → many Properties (소유 관계)
- One Property → many Leases (과거 및 현재 계약)
- One Property → many MaintenanceRequests
- One Property → many Transactions
- One Tenant → many Leases (히스토리 보존)
- One Tenant → many MaintenanceRequests
- One Lease → one Tenant (현재 계약 기준)
- One Lease → many Transactions (임대료 납부 기록)
- Many Users → many Properties (UserProperty 조인 테이블 통해 위임 관계)
- One Vendor → many MaintenanceRequests

## 4. 어떤 CRUD 작업이 필요한가요?

| Entity | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Property | ✅ (Owner/Admin) | ✅ (권한 있는 사용자) | ✅ (Owner/Admin) | ❌ (아카이브만 가능) |
| Tenant | ✅ (Owner/Admin/Manager) | ✅ (권한 있는 사용자) | ✅ (Owner/Admin/Manager) | ❌ (아카이브만 가능) |
| Lease | ✅ (Owner/Admin/Manager) | ✅ (권한 있는 사용자) | ✅ (Owner/Admin/Manager) | ❌ (아카이브만 가능) |
| MaintenanceRequest | ✅ (모든 사용자) | ✅ (권한 있는 사용자) | ✅ (권한 있는 사용자) | ✅ (Owner/Admin만) |
| Transaction | ✅ (Owner/Admin/Accountant) | ✅ (Owner/Admin/Accountant) | ✅ (Owner/Admin/Accountant) | ❌ (조정만 가능) |
| User | ✅ (Admin) | ✅ (본인/관리자) | ✅ (본인/관리자) | ❌ (비활성화만 가능) |

## 5. 어떤 규칙이나 제약이 존재하나요?

- Property는 활성화된 Lease가 있을 경우 삭제할 수 없음
- Tenant는 활성화된 Lease가 있을 경우 삭제할 수 없음
- Lease는 반드시 Property와 Tenant를 포함해야 함
- Rent Transaction은 반드시 활성화된 Lease에 연결되어야 함
- 적절한 권한이 있는 사용자만 재무 정보에 접근 가능
- MaintenanceRequest는 반드시 Property에 연결되어야 함
- Transaction의 날짜는 해당 회계연도 내에 속해야 함
- User는 소유하거나 명시적으로 권한을 받은 Property만 접근 가능
- 동일 유닛에 대해 Lease 날짜가 겹칠 수 없음
- 보증금은 별도로 추적되어야 하며 계약 종료 시 정산되어야 함
- Property Manager는 할당된 Property만 관리할 수 있음
- 만료된 계약 및 과거 세입자 정보는 규정 준수를 위해 반드시 보존되어야 함