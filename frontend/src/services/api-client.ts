import { config } from '../lib/config';
import { tokenStorage } from '../utils/token-storage';

/**
 * 백엔드 API와 통신하는 클라이언트 클래스
 * - 토큰 기반 인증 처리
 * - 자동 토큰 갱신
 * - 요청/응답 로깅
 */
export class ApiClient {
    public baseUrl: string;
    private refreshPromise: Promise<string> | null = null;

    constructor(baseUrl: string = config.API_BASE_URL) {
        // Vite 프록시를 사용하므로 빈 문자열로 설정
        this.baseUrl = baseUrl;
        console.log('🔧 [API클라이언트] 초기화 완료:', {
            baseUrl: this.baseUrl || '프록시 사용',
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 저장된 액세스 토큰 반환
     */
    get accessToken(): string | null {
        const token = tokenStorage.getAccessToken();
        console.log('🔑 [API클라이언트] 액세스 토큰 조회:', token ? '존재함' : '없음');
        return token;
    }

    /**
     * 저장된 리프레시 토큰 반환
     */
    get refreshToken(): string | null {
        const token = tokenStorage.getRefreshToken();
        console.log('🔄 [API클라이언트] 리프레시 토큰 조회:', token ? '존재함' : '없음');
        return token;
    }

    /**
     * 토큰 저장
     */
    setTokens(accessToken: string, refreshToken: string): void {
        console.log('💾 [API클라이언트] 토큰 저장 시작');
        tokenStorage.setTokens(accessToken, refreshToken);
        console.log('✅ [API클라이언트] 토큰 저장 완료');
    }

    /**
     * 토큰 삭제
     */
    clearTokens(): void {
        console.log('🗑️ [API클라이언트] 토큰 삭제 시작');
        tokenStorage.clearTokens();
        console.log('✅ [API클라이언트] 토큰 삭제 완료');
    }

    /**
     * 액세스 토큰 갱신
     */
    async refreshAccessToken(): Promise<string> {
        console.log('🔄 [API클라이언트] 토큰 갱신 요청 시작');

        // 중복 갱신 요청 방지
        if (this.refreshPromise) {
            console.log('⏳ [API클라이언트] 이미 진행 중인 토큰 갱신 대기');
            return this.refreshPromise;
        }

        const refreshToken = this.refreshToken;
        if (!refreshToken) {
            console.error('❌ [API클라이언트] 리프레시 토큰이 없음');
            throw new Error('리프레시 토큰이 없습니다');
        }

        this.refreshPromise = this.performTokenRefresh(refreshToken);

        try {
            const newToken = await this.refreshPromise;
            console.log('✅ [API클라이언트] 토큰 갱신 성공');
            return newToken;
        } catch (error) {
            console.error('❌ [API클라이언트] 토큰 갱신 실패:', error);
            this.clearTokens();
            throw error;
        } finally {
            this.refreshPromise = null;
        }
    }

    /**
     * 실제 토큰 갱신 수행
     */
    private async performTokenRefresh(refreshToken: string): Promise<string> {
        console.log('🔄 [API클라이언트] 토큰 갱신 API 호출');

        const refreshUrl = `${this.baseUrl}/api/v1/auth/refresh`;
        console.log('📍 [API클라이언트] 토큰 갱신 URL:', refreshUrl);

        try {
            const response = await fetch(refreshUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh_token: refreshToken,
                }),
            });

            console.log('📡 [API클라이언트] 토큰 갱신 응답:', {
                status: response.status,
                statusText: response.statusText,
                url: response.url
            });

            if (!response.ok) {
                throw new Error(`토큰 갱신 실패: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ [API클라이언트] 새 토큰 수신 완료');

            this.setTokens(data.access_token, data.refresh_token);
            return data.access_token;
        } catch (error) {
            console.error('💥 [API클라이언트] 토큰 갱신 중 오류:', error);
            throw error;
        }
    }

    /**
     * API 요청 수행
     */
    async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        console.log('🚀 [API클라이언트] 요청 시작:', {
            method: options.method || 'GET',
            endpoint,
            fullUrl: url,
            hasBody: !!options.body,
            timestamp: new Date().toISOString()
        });

        console.log('📤 [API클라이언트] 요청 헤더:', options.headers || '기본 헤더 사용');

        if (options.body) {
            console.log('📋 [API클라이언트] 요청 본문:',
                typeof options.body === 'string'
                    ? JSON.parse(options.body)
                    : options.body
            );
        }

        let response = await this.makeRequest(url, options);

        console.log('📡 [API클라이언트] 첫 번째 응답 수신:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        // 401 에러 시 토큰 갱신 후 재시도
        if (response.status === 401 && this.refreshToken) {
            console.log('🔄 [API클라이언트] 401 오류 - 토큰 갱신 후 재시도');

            try {
                await this.refreshAccessToken();
                console.log('🔄 [API클라이언트] 토큰 갱신 완료 - 요청 재시도');
                response = await this.makeRequest(url, options);

                console.log('📡 [API클라이언트] 재시도 응답 수신:', {
                    status: response.status,
                    statusText: response.statusText
                });
            } catch (refreshError) {
                console.error('❌ [API클라이언트] 토큰 갱신 실패:', refreshError);
                this.clearTokens();
                throw new Error('인증에 실패했습니다. 다시 로그인해주세요.');
            }
        }

        if (!response.ok) {
            console.error('❌ [API클라이언트] HTTP 오류:', {
                status: response.status,
                statusText: response.statusText,
                url: response.url
            });

            const errorData = await response.json().catch(() => ({
                detail: `HTTP ${response.status} - ${response.statusText}`
            }));

            console.error('❌ [API클라이언트] 오류 상세:', errorData);

            throw new Error(
                errorData?.message ||
                errorData?.detail ||
                `HTTP 오류! 상태: ${response.status}`
            );
        }

        try {
            const data = await response.json();
            console.log('✅ [API클라이언트] 요청 성공:', {
                endpoint,
                responseType: typeof data,
                hasData: !!data,
                timestamp: new Date().toISOString()
            });

            // 응답 데이터가 큰 경우 일부만 로깅
            if (typeof data === 'object' && data !== null) {
                const keys = Object.keys(data);
                console.log('📋 [API클라이언트] 응답 데이터 키:', keys.slice(0, 5));
                if (keys.length > 5) {
                    console.log(`... 및 ${keys.length - 5}개 추가 키`);
                }
            }

            return data;
        } catch (parseError) {
            console.error('💥 [API클라이언트] JSON 파싱 오류:', parseError);
            throw new Error('서버 응답을 처리할 수 없습니다');
        }
    }

    /**
     * 실제 HTTP 요청 수행
     */
    private async makeRequest(url: string, options: RequestInit): Promise<Response> {
        console.log('🌐 [API클라이언트] HTTP 요청 준비:', {
            url,
            method: options.method || 'GET'
        });

        const headers = new Headers(options.headers);

        // Content-Type 기본 설정
        if (!headers.has('Content-Type') && options.body) {
            headers.set('Content-Type', 'application/json');
            console.log('📋 [API클라이언트] Content-Type 자동 설정: application/json');
        }

        // 인증 토큰 추가
        if (this.accessToken) {
            headers.set('Authorization', `Bearer ${this.accessToken}`);
            console.log('🔑 [API클라이언트] 인증 토큰 추가됨');
        } else {
            console.log('⚠️ [API클라이언트] 인증 토큰 없음');
        }

        const requestConfig = {
            ...options,
            headers
        };

        console.log('📤 [API클라이언트] 최종 요청 헤더:', Object.fromEntries(headers.entries()));

        try {
            console.log('🌐 [API클라이언트] fetch 실행 중...');
            const response = await fetch(url, requestConfig);

            console.log('📡 [API클라이언트] fetch 완료:', {
                status: response.status,
                statusText: response.statusText,
                type: response.type,
                redirected: response.redirected
            });

            return response;
        } catch (fetchError) {
            console.error('💥 [API클라이언트] fetch 오류:', {
                error: fetchError instanceof Error ? fetchError.message : fetchError,
                url,
                method: options.method || 'GET'
            });

            if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
                throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
            }

            throw fetchError;
        }
    }
}

// 싱글톤 인스턴스 생성
console.log('🏭 [API클라이언트] 싱글톤 인스턴스 생성');
export const apiClient = new ApiClient();

console.log('✅ [API클라이언트] 모듈 로드 완료');
