# PMS Frontend

React TypeScript 기반의 프로젝트 관리 시스템 프론트엔드

## 📋 목차

- [프로젝트 개요](#-프로젝트-개요)
- [기술 스택](#-기술-스택)
- [주요 기능](#-주요-기능)
- [설치 및 실행](#-설치-및-실행)
- [프로젝트 구조](#-프로젝트-구조)
- [개발 가이드](#-개발-가이드)
- [빌드 및 배포](#-빌드-및-배포)

## 🎯 프로젝트 개요

PMS Frontend는 React와 TypeScript를 사용하여 구축된 현대적인 프로젝트 관리 시스템 사용자 인터페이스입니다. 직관적인 UI/UX를 통해 효율적인 프로젝트 관리를 지원합니다.

### 주요 특징

- 🎨 **현대적인 UI/UX** - Tailwind CSS 기반의 반응형 디자인
- 🌙 **다크/라이트 모드** - 사용자 선호도에 따른 테마 전환
- 📱 **반응형 디자인** - 모바일, 태블릿, 데스크톱 지원
- ⚡ **고성능** - React 18, TypeScript, 최적화된 번들링
- 🔒 **보안** - JWT 토큰 기반 인증 및 권한 관리
- 🎯 **타입 안전성** - TypeScript 강력한 타입 시스템

## 🛠 기술 스택

### 핵심 기술

- **React 18** - 사용자 인터페이스 라이브러리
- **TypeScript** - 정적 타입 검사
- **Tailwind CSS** - 유틸리티 퍼스트 CSS 프레임워크
- **React Router** - 클라이언트 사이드 라우팅

### 상태 관리 및 데이터

- **Zustand** - 가벼운 상태 관리 라이브러리
- **React Query** - 서버 상태 관리
- **Axios** - HTTP 클라이언트
- **React Hook Form** - 폼 상태 관리

### UI 컴포넌트

- **Headless UI** - 무스타일 UI 컴포넌트
- **Heroicons** - SVG 아이콘 라이브러리
- **React Hot Toast** - 알림 시스템
- **Recharts** - 차트 라이브러리

### 개발 도구

- **Create React App** - 프로젝트 설정
- **ESLint** - 코드 린팅
- **Prettier** - 코드 포매팅

## ✨ 주요 기능

### 🔐 인증 및 보안

- JWT 토큰 기반 로그인/로그아웃
- 회원가입 및 비밀번호 재설정
- 역할 기반 접근 제어 (RBAC)
- 자동 토큰 갱신

### 📊 대시보드

- 프로젝트 현황 요약
- 작업 진행 상황 차트
- 마감 예정 작업 알림
- 최근 활동 피드

### 📁 프로젝트 관리

- 프로젝트 생성, 수정, 삭제
- 프로젝트 멤버 관리
- 프로젝트 상태 및 진행률 추적
- 파일 첨부 및 댓글 기능

### ✅ 작업 관리

- 칸반 보드 스타일 작업 관리
- 작업 할당 및 상태 변경
- 우선순위 및 태그 설정
- 시간 추적 및 로그

### 📅 캘린더

- 월/주/일 뷰 캘린더
- 이벤트 생성 및 관리
- 작업 마감일 시각화
- 일정 공유 기능

### 👥 사용자 관리

- 사용자 목록 및 프로필 관리
- 역할 및 권한 설정
- 사용자 활동 로그
- 팀 멤버 초대

## 🚀 설치 및 실행

### 사전 요구사항

- Node.js 18.0 이상
- npm 또는 yarn

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd pms-frontend
```

### 2. 의존성 설치

```bash
# npm 사용
npm install

# 또는 yarn 사용
yarn install
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
# API 기본 URL
REACT_APP_API_BASE_URL=http://localhost:8001

# 애플리케이션 설정
REACT_APP_APP_NAME=PMS
REACT_APP_APP_VERSION=1.0.0

# 기능 플래그
REACT_APP_ENABLE_DARK_MODE=true
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_CALENDAR=true

# 외부 서비스 (선택사항)
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_SENTRY_DSN=your-sentry-dsn
```

### 4. 개발 서버 실행

```bash
# 개발 서버 시작
npm start

# 브라우저에서 http://localhost:3000 접속
```

### 5. 타입 체크

```bash
# TypeScript 타입 체크
npm run type-check
```

## 📁 프로젝트 구조

```
frontend/
├── public/                    # 정적 파일
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/            # 재사용 가능한 컴포넌트
│   │   ├── ui/               # 기본 UI 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── ...
│   │   ├── layout/           # 레이아웃 컴포넌트
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── auth/             # 인증 관련 컴포넌트
│   │   └── features/         # 기능별 컴포넌트
│   ├── pages/                # 페이지 컴포넌트
│   │   ├── auth/             # 인증 페이지
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── ForgotPasswordPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── TasksPage.tsx
│   │   └── ...
│   ├── store/                # 전역 상태 관리
│   │   ├── authStore.ts
│   │   ├── themeStore.ts
│   │   └── ...
│   ├── lib/                  # 유틸리티 및 설정
│   │   ├── api.ts           # API 클라이언트
│   │   ├── constants.ts     # 상수 정의
│   │   └── utils.ts         # 헬퍼 함수
│   ├── types/                # TypeScript 타입 정의
│   │   └── index.ts
│   ├── hooks/                # 커스텀 훅
│   │   ├── useApi.ts
│   │   ├── useAuth.ts
│   │   └── ...
│   ├── styles/               # 스타일 파일
│   │   └── globals.css
│   ├── App.tsx              # 메인 앱 컴포넌트
│   ├── index.tsx            # 엔트리 포인트
│   └── index.css            # 전역 스타일
├── .env                     # 환경 변수
├── .env.example            # 환경 변수 예제
├── package.json            # 프로젝트 의존성
├── tailwind.config.js      # Tailwind CSS 설정
├── tsconfig.json           # TypeScript 설정
├── Dockerfile              # Docker 설정
├── nginx.conf              # Nginx 설정
└── README.md              # 프로젝트 문서
```

## 🧪 개발 가이드

### 코드 스타일

프로젝트는 다음 코드 스타일 가이드를 따릅니다:

- **TypeScript** 강력한 타입 사용
- **ESLint** 규칙 준수
- **Prettier** 코드 포매팅
- **컴포넌트 기반** 아키텍처

### 컴포넌트 작성 가이드

```typescript
// 좋은 예시
interface ButtonProps {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  onClick,
}) => {
  return (
    <button className={`btn btn-${variant} btn-${size}`} onClick={onClick}>
      {children}
    </button>
  );
};
```

### 상태 관리

```typescript
// Zustand store 예시
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (credentials) => {
    // 로그인 로직
  },
  logout: () => {
    // 로그아웃 로직
  },
}));
```

### API 호출

```typescript
// React Query 사용 예시
const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => apiClient.getProjects(),
    staleTime: 5 * 60 * 1000, // 5분
  });
};
```

### 스타일링 가이드

```typescript
// Tailwind CSS 클래스 사용
const Card = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {children}
    </div>
  );
};
```

### 테스트 작성

```typescript
// 컴포넌트 테스트 예시
import { render, screen } from "@testing-library/react";
import Button from "./Button";

test("renders button with text", () => {
  render(<Button>Click me</Button>);
  const buttonElement = screen.getByText(/click me/i);
  expect(buttonElement).toBeInTheDocument();
});
```

### 폴더 구조 규칙

1. **컴포넌트**: 기능별로 폴더 구분
2. **페이지**: 라우트별로 파일 구분
3. **훅**: `use` 접두사 사용
4. **타입**: 인터페이스는 `I` 접두사 없이 명명
5. **상수**: UPPER_SNAKE_CASE 사용

## 🔧 사용 가능한 스크립트

```bash
# 개발 서버 시작
npm start

# 프로덕션 빌드
npm run build

# 테스트 실행
npm test

# 테스트 커버리지
npm run test:coverage

# TypeScript 타입 체크
npm run type-check

# ESLint 실행
npm run lint

# ESLint 자동 수정
npm run lint:fix

# Prettier 포매팅
npm run format

# 의존성 보안 검사
npm audit
```

## 🐳 빌드 및 배포

### Docker를 사용한 빌드

```bash
# Docker 이미지 빌드
docker build -t pms-frontend .

# Docker 컨테이너 실행
docker run -p 3000:3000 pms-frontend
```

### 프로덕션 빌드

```bash
# 프로덕션 빌드 생성
npm run build

# 빌드 파일은 build/ 폴더에 생성됩니다
```

### 환경별 배포

#### 개발 환경

```bash
# 개발 서버 실행
npm start
```

#### 스테이징 환경

```bash
# 스테이징 빌드
REACT_APP_API_BASE_URL=https://staging-api.pms.com npm run build
```

#### 프로덕션 환경

```bash
# 프로덕션 빌드
REACT_APP_API_BASE_URL=https://api.pms.com npm run build
```

## 📊 성능 최적화

### 코드 분할

```typescript
// 라우트 기반 코드 분할
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));

// 컴포넌트 기반 코드 분할
const HeavyComponent = lazy(() => import("./components/HeavyComponent"));
```

### 이미지 최적화

- WebP 포맷 사용
- 적절한 크기로 리사이징
- lazy loading 적용

### 번들 최적화

- Tree shaking 활용
- 미사용 코드 제거
- 의존성 분석 및 최적화

## 🔍 디버깅

### 브라우저 개발자 도구

- React Developer Tools 확장 프로그램 설치
- Redux DevTools (상태 관리 디버깅)
- Network 탭에서 API 호출 모니터링

### 로깅

```typescript
// 개발 환경에서만 로깅
if (process.env.NODE_ENV === "development") {
  console.log("Debug info:", data);
}
```

## 🚨 문제 해결

### 자주 발생하는 문제

1. **CORS 에러**

   ```bash
   # 백엔드 CORS 설정 확인
   # 또는 프록시 설정 사용
   ```

2. **타입 에러**

   ```bash
   # TypeScript 컴파일 확인
   npm run type-check
   ```

3. **빌드 실패**

   ```bash
   # 의존성 재설치
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **느린 개발 서버**
   ```bash
   # Fast Refresh 활성화 확인
   # 불필요한 의존성 제거
   ```

## 📚 추가 리소스

- [React 공식 문서](https://react.dev/)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [React Router 가이드](https://reactrouter.com/docs)
- [Zustand 문서](https://zustand-demo.pmnd.rs/)

## 🤝 기여 가이드

1. **이슈 확인**: GitHub Issues에서 관련 이슈 확인
2. **브랜치 생성**: `feature/기능명` 또는 `fix/버그명`
3. **코드 작성**: 스타일 가이드 준수
4. **테스트 추가**: 새로운 기능에 대한 테스트 작성
5. **PR 생성**: 상세한 설명과 함께 Pull Request 생성

### 커밋 메시지 규칙

```bash
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포매팅, 세미콜론 누락 등
refactor: 코드 리팩토링
test: 테스트 코드 추가
chore: 빌드 프로세스 또는 보조 도구 변경
```

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제가 있거나 질문이 있으시면 다음을 통해 연락해 주세요:

- 이슈 트래커: [GitHub Issues](https://github.com/your-repo/issues)
- 이메일: <frontend-team@pms.com>
- 문서: [프로젝트 위키](https://github.com/your-repo/wiki)

---

**PMS Frontend** - 현대적이고 사용자 친화적인 프로젝트 관리 인터페이스
