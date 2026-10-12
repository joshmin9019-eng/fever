# FEVER · Phase 2 코드 준비

Next.js App Router / TypeScript / Tailwind / Supabase. 제품 기준은 [PRD v1.1](docs/FEVER_PRD_v1.1.md)이며, 추가 확정 사항은 [Phase 2 정책](docs/PHASE2_DECISIONS.md)입니다.

## 실행

Node.js 24 / npm 11 기준.

```sh
npm ci --cache /tmp/fever-npm-cache
npm run dev
```

3000 포트에서 실행합니다. Supabase 설정이 없으면 홈은 실행되고 가입·로그인은 비활성화되며 보호 경로는 로그인으로 이동합니다. 실제 사용자나 가짜 승인 데이터를 만들지 않습니다.

## Supabase 연결 시 수행

1. `.env.example`을 `.env.local`로 복사하고 URL/publishable key를 설정합니다. service role 키는 사용하지 않습니다.
2. 신규 Supabase 프로젝트에 `supabase/migrations/202610120001_membership.sql`을 SQL editor 또는 migration 도구로 적용합니다. 이미 동일 테이블/bucket이 있는 프로젝트에는 사전 검토 없이 적용하지 마세요.
3. Auth에서 Email provider는 켜고 **Confirm email은 끕니다**. 최신 사용자 결정에 따라 별도 이메일 확인 없이 계정 생성 세션으로 가입정보를 입력합니다. 비밀번호 최소 길이는 8자 이상으로 설정합니다. 기존 미인증 계정은 설정 변경 후에도 로그인에 제한이 있을 수 있으므로 운영자가 Auth 계정 상태를 확인해야 합니다.
4. 가입 확인 이메일을 token hash 방식으로 사용하는 경우 템플릿 링크를 `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`으로 설정합니다. PKCE callback 방식도 제공됩니다. 복구·비밀번호 재설정은 이번 범위에 포함하지 않았습니다.
5. `/terms`, `/privacy`에 기본 안내가 포함되어 있습니다. 계정 생성 단계에서 두 필수 동의 체크박스를 선택합니다. 동의한 문서 버전과 시각을 계정의 본인 신고 동의 정보로 보관하고, 같은 버전이면 프로필 입력 단계에서는 체크박스를 다시 표시하지 않습니다. 과거 계정의 동의 정보가 없거나 문서 버전이 바뀐 경우에만 프로필 단계에서 동의를 받습니다. 동의 메타데이터를 회원 승인이나 관리자 역할 판단에 사용하지 않습니다. 가입 신청에는 문서 버전과 동의 시각이 기록됩니다. 별도 정식 문서를 사용할 경우 `FEVER_*` 변수로 HTTPS URL과 버전을 지정할 수 있습니다. 운영자 연락처·실제 처리 지역 등 추가 고지 사항은 정식 운영 전 보완해야 합니다.
6. 신뢰할 수 있는 운영자 계정으로 사진 포함 가입 신청을 완료한 후 `supabase/bootstrap-super-admin.sql`의 UUID를 실제 계정 UUID로 바꾸고 SQL editor에서 최초 1회 실행합니다. 이미 최고 관리자가 있으면 실패하도록 구성했습니다.
7. 서로 다른 회원·미승인·반려·정지·관리자 계정으로 API/Storage/RLS를 실제 Supabase에서 검증합니다. Confirm email을 끄면 Supabase가 신규 계정을 자동 확인 처리하므로 기존 DB의 인증 상태 검사와 호환됩니다. DB의 `pending_email` 상태명은 하위 호환을 위해 유지하며 UI에서는 프로필 미완료로 표시합니다.

현재 사용자의 요청에 따라 외부 프로젝트 생성, migration 적용, 이메일 발송 또는 배포는 수행하지 않았습니다.

## 구현

- 이메일/비밀번호 로그인·계정 생성, 세션 refresh proxy, 인증 callback, 로그아웃.
- 이메일 인증 없이 계정 생성 후 프로필·사진·동의를 제출하는 가입 신청. nickname 대소문자 중복 차단, private 사진 bucket, 5MB 형식 제한 및 서버 파일 signature 검사.
- 관리자 가입 승인·반려·재신청 허용 화면과 RPC. 가입 승인과 역할/감사 기록을 한 트랜잭션에서 처리합니다.
- 회원·관리자·최고 관리자 서버 guard와 DB RLS. 회원이 상태/역할을 직접 변경할 수 없습니다.
- 최초 최고 관리자 설정은 운영자의 DB 작업으로 분리했습니다. 일반 웹 사용자에게 권한 자체 부여 API가 없습니다.

프로필·질문·벙 페이지는 접근 제어가 적용된 준비 화면입니다. 닉네임 변경, 정지/복구 UI, 역할 변경/마지막 최고 관리자 보호, 탈퇴, 질문 및 벙 로직은 후속 단계입니다. 현재는 이 작업들을 위한 변경 API를 제공하지 않습니다.

## 검증

```sh
npm run build
npm run lint
npm run typecheck
npm run test:db
npm run test:registration
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

시스템 Chromium이 없으면 `npx playwright install chromium` 후 `npm run test:e2e`를 사용하세요. build/typecheck와 dev/E2E 실행은 순서대로 수행하세요. Next.js가 생성하는 `.next` 타입 파일을 동시에 수정하면 검사에 충돌이 생길 수 있습니다.

`test:db`는 PGlite PostgreSQL 엔진에서 migration과 RLS/RPC를 실행합니다. Supabase Auth/Storage의 최소 계약 fixture를 사용하며 실제 서비스 통합 테스트를 대신하지 않습니다. 브라우저 검증은 미연결 상태의 모바일/데스크톱 UI·보호 경로와 권한/파일 검증 함수에 대한 테스트입니다. 실제 가입·사진 저장·관리자 승인 통합은 서비스 연결 후 검증해야 합니다. `test:registration`은 별도 로컬 Next 서버와 Auth/Storage 응답 fixture로 계정 생성→프로필 입력→동의→사진 업로드→승인 대기 전환을 모바일과 데스크톱에서 검증합니다. 실제 회원 계정을 생성하지 않습니다.
