// ============================================================================
// utils/query-params.ts - URL 쿼리 파라미터 유틸리티
// ============================================================================

/**
 * 객체를 URL 쿼리 스트링으로 변환
 */
export function buildQueryParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        // 배열의 경우 각 요소를 별도로 추가
        value.forEach(item => {
          if (item !== undefined && item !== null && item !== '') {
            searchParams.append(key, String(item));
          }
        });
      } else if (typeof value === 'object') {
        // 객체의 경우 JSON 문자열로 변환
        searchParams.append(key, JSON.stringify(value));
      } else {
        // 일반 값은 문자열로 변환
        searchParams.append(key, String(value));
      }
    }
  });

  return searchParams.toString();
}

/**
 * URL 쿼리 스트링을 객체로 변환
 */
export function parseQueryParams(queryString: string): Record<string, any> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, any> = {};

  params.forEach((value, key) => {
    // 이미 같은 키가 있는 경우 배열로 변환
    if (result[key]) {
      if (Array.isArray(result[key])) {
        result[key].push(parseValue(value));
      } else {
        result[key] = [result[key], parseValue(value)];
      }
    } else {
      result[key] = parseValue(value);
    }
  });

  return result;
}

/**
 * 쿼리 파라미터 값 파싱 (타입 추론)
 */
function parseValue(value: string): any {
  // JSON 문자열인지 확인
  if ((value.startsWith('{') && value.endsWith('}')) ||
      (value.startsWith('[') && value.endsWith(']'))) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  // 불린 값인지 확인
  if (value === 'true') return true;
  if (value === 'false') return false;

  // 숫자인지 확인
  if (!isNaN(Number(value)) && value !== '') {
    return Number(value);
  }

  // null 또는 undefined 확인
  if (value === 'null') return null;
  if (value === 'undefined') return undefined;

  // 기본적으로 문자열 반환
  return value;
}

/**
 * 현재 URL의 쿼리 파라미터 가져오기
 */
export function getCurrentQueryParams(): Record<string, any> {
  if (typeof window === 'undefined') {
    return {};
  }

  return parseQueryParams(window.location.search.substring(1));
}

/**
 * 쿼리 파라미터를 URL에 추가/업데이트
 */
export function updateUrlWithParams(
  baseUrl: string,
  params: Record<string, any>
): string {
  const url = new URL(baseUrl, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        // 기존 파라미터 제거
        url.searchParams.delete(key);
        // 배열의 각 요소 추가
        value.forEach(item => {
          if (item !== undefined && item !== null && item !== '') {
            url.searchParams.append(key, String(item));
          }
        });
      } else if (typeof value === 'object') {
        url.searchParams.set(key, JSON.stringify(value));
      } else {
        url.searchParams.set(key, String(value));
      }
    } else {
      // 값이 없으면 파라미터 제거
      url.searchParams.delete(key);
    }
  });

  return url.toString();
}

/**
 * 특정 쿼리 파라미터 제거
 */
export function removeQueryParams(
  queryString: string,
  keysToRemove: string[]
): string {
  const params = new URLSearchParams(queryString);

  keysToRemove.forEach(key => {
    params.delete(key);
  });

  return params.toString();
}

/**
 * 쿼리 파라미터 필터링 (조건에 맞는 파라미터만 유지)
 */
export function filterQueryParams(
  params: Record<string, any>,
  condition: (key: string, value: any) => boolean
): Record<string, any> {
  const filtered: Record<string, any> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (condition(key, value)) {
      filtered[key] = value;
    }
  });

  return filtered;
}

/**
 * 쿼리 파라미터 정리 (빈 값, null, undefined 제거)
 */
export function cleanQueryParams(params: Record<string, any>): Record<string, any> {
  return filterQueryParams(params, (_, value) => {
    if (value === null || value === undefined || value === '') {
      return false;
    }

    if (Array.isArray(value) && value.length === 0) {
      return false;
    }

    return true;
  });
}

/**
 * 페이지네이션 파라미터 빌드
 */
export function buildPaginationParams(
  page: number = 1,
  limit: number = 10,
  additionalParams: Record<string, any> = {}
): string {
  const params = {
    page_no: page,
    page_size: limit,
    ...additionalParams,
  };

  return buildQueryParams(cleanQueryParams(params));
}

/**
 * 정렬 파라미터 빌드
 */
export function buildSortParams(
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'asc',
  additionalParams: Record<string, any> = {}
): string {
  const params = {
    ...(sortBy && { sort_by: sortBy }),
    sort_order: sortOrder,
    ...additionalParams,
  };

  return buildQueryParams(cleanQueryParams(params));
}

/**
 * 검색 파라미터 빌드
 */
export function buildSearchParams(
  query?: string,
  searchFields: string[] = [],
  additionalParams: Record<string, any> = {}
): string {
  const params = {
    ...(query && { search: query }),
    ...(searchFields.length > 0 && { search_fields: searchFields }),
    ...additionalParams,
  };

  return buildQueryParams(cleanQueryParams(params));
}

/**
 * 날짜 범위 파라미터 빌드
 */
export function buildDateRangeParams(
  startDate?: string | Date,
  endDate?: string | Date,
  additionalParams: Record<string, any> = {}
): string {
  const params = {
    ...(startDate && {
      start_date: startDate instanceof Date ? startDate.toISOString() : startDate
    }),
    ...(endDate && {
      end_date: endDate instanceof Date ? endDate.toISOString() : endDate
    }),
    ...additionalParams,
  };

  return buildQueryParams(cleanQueryParams(params));
}

/**
 * 필터 파라미터 빌드 (대시보드, 리포트 등에서 사용)
 */
export function buildFilterParams(
  filters: Record<string, any>,
  excludeKeys: string[] = []
): string {
  const filteredParams = filterQueryParams(filters, (key) =>
    !excludeKeys.includes(key)
  );

  return buildQueryParams(cleanQueryParams(filteredParams));
}

/**
 * URL 안전한 base64 인코딩 (파라미터에 복잡한 객체 전달시 사용)
 */
export function encodeObjectParam(obj: any): string {
  try {
    const jsonString = JSON.stringify(obj);
    const base64 = btoa(unescape(encodeURIComponent(jsonString)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (error) {
    console.error('Failed to encode object parameter:', error);
    return '';
  }
}

/**
 * URL 안전한 base64 디코딩
 */
export function decodeObjectParam(encoded: string): any {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;
    const paddedBase64 = padding ? base64 + '='.repeat(4 - padding) : base64;
    const jsonString = decodeURIComponent(escape(atob(paddedBase64)));
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to decode object parameter:', error);
    return null;
  }
}
