---
name: backend-auth-architecture
description: Explains how this app bridges NextAuth (frontend Google login) with the NestJS backend's own JWT auth, and the mandatory rule that every backend resource must be scoped by userId. Use when adding a new backend resource/model, adding a new API route, wiring a new frontend query hook, or debugging login/session/authFetch/401 issues.
---

# 인증 아키텍처 (Google 로그인 ↔ 백엔드 JWT 브릿지)

## 구조

* **프론트**: NextAuth.js(Auth.js v5) — `auth.ts`(루트)에 Google Provider 설정. 로그인 안 한 상태로 접근하면 `proxy.ts`(Next.js 16의 middleware)가 `/login`으로 리다이렉트 (`/login`, `/api/auth/*`는 예외)
* **브릿지**: NextAuth의 `jwt` 콜백에서 최초 로그인 시 Google이 내려준 `account.id_token`을 백엔드 `POST /auth/google`에 전달 → 백엔드가 `google-auth-library`로 idToken을 직접 검증하고(공유 비밀키 방식이 아님), 기존 `AuthService`가 이메일/비밀번호 로그인 때 쓰던 것과 동일한 형식의 JWT(`{ sub, email }`)를 발급 → 이 토큰을 `session.backendToken`에 실어 프론트로 전달
* **API 호출**: 프론트의 모든 쿼리 훅은 `features/shared/lib/authFetch.ts`의 `useAuthedFetch()`로 `Authorization: Bearer <backendToken>` 헤더를 붙여서 호출 (새 쿼리 파일을 추가할 때도 반드시 이 훅을 통해서 fetch할 것). `useQuery`는 `enabled: isReady && !!token`으로 토큰이 준비되기 전에는 요청하지 않도록 함
* **백엔드**: `JwtAuthGuard`가 `APP_GUARD`로 전역 등록되어 있어 기본적으로 모든 라우트가 인증 필요. 예외는 `@Public()` 데코레이터로 표시 (`auth/register`, `auth/login`, `auth/google`, 그리고 공용 참조 데이터인 `DrugController` 전체). 컨트롤러에서 로그인한 사용자 정보는 `@CurrentUser() user: CurrentUserPayload`로 꺼내 씀 (`src/auth/current-user.decorator.ts`)

## 필수 규칙

새 리소스(모델)를 추가할 때는 반드시 `userId` 필드를 넣고, 서비스의 조회/생성/수정/삭제 로직에 `@CurrentUser()`로 받은 `user.id`를 스코프로 사용할 것. 패턴:

* `create`: `data: { ...dto, userId }`
* 조회: `where: { userId, ...기존조건 }`
* 수정/삭제: 먼저 `findFirst({ where: { id, userId } })`로 소유권 확인 후 `update`/`delete` (`deleteMany({ where: { id, userId } })`로 한 번에 처리해도 됨)

이걸 빠뜨리면 다른 사용자의 데이터가 섞여 보인다.

## 단축어/자동화용 장기 토큰

일반 로그인 토큰은 7일 만료라 iOS 단축어 같은 자동화에는 부적합. `GET /auth/device-token`(로그인된 상태에서만 호출 가능)이 만료 10년짜리 토큰을 발급하며, 프론트 `/settings` 페이지에서 발급/복사할 수 있다.
