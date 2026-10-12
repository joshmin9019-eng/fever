# FEVER 개발 기준

- 제품 기준: `docs/FEVER_PRD_v1.1.md`. 작업 전에 읽고 확정 정책과 제안·미확정 정책을 구분한다.
- `docs/FEVER_Codex_Phase1_Prompt.md`는 첫 기반 작업의 지시서다. 현재 상태와 실행·검증 방법은 README를 참고한다.
- 사용자의 현재 요청이 단계 범위를 결정한다. 미확정 비즈니스 정책은 임의로 결정하지 않는다.
- 인증/승인 권한은 서버와 Supabase RLS에서 강제한다. service role 키와 개인정보를 클라이언트/로그에 노출하지 않는다.
- 이 클라우드 작업은 이미 격리되어 있다. 기존 `/workspace/fever` 체크아웃을 사용하고 사용자 요청 없이 worktree를 만들지 않는다.
- 검사: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e`. 시스템 Chromium 사용 시 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`을 설정한다.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
