// src/utils/cn.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 클래스명을 조건부로 결합하고 Tailwind CSS 클래스 충돌을 해결하는 유틸리티 함수
 *
 * @param inputs - 클래스명 값들 (문자열, 객체, 배열, undefined, null 등)
 * @returns 결합되고 최적화된 클래스명 문자열
 *
 * @example
 * ```typescript
 * // 기본 사용법
 * cn('px-2 py-1', 'text-sm') // "px-2 py-1 text-sm"
 *
 * // 조건부 클래스
 * cn('base-class', {
 *   'active-class': isActive,
 *   'disabled-class': isDisabled
 * }) // "base-class active-class" (isActive가 true일 때)
 *
 * // Tailwind 충돌 해결
 * cn('px-2 py-1', 'px-4') // "py-1 px-4" (px-4가 px-2를 덮어씀)
 *
 * // 복잡한 조건
 * cn(
 *   'base-class',
 *   condition && 'conditional-class',
 *   anotherCondition ? 'true-class' : 'false-class'
 * )
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * 클래스명 조건부 적용을 위한 헬퍼 함수
 *
 * @param condition - 조건
 * @param trueClass - 조건이 true일 때 적용할 클래스
 * @param falseClass - 조건이 false일 때 적용할 클래스 (선택사항)
 * @returns 조건에 따른 클래스명
 *
 * @example
 * ```typescript
 * conditional(isActive, 'bg-blue-500', 'bg-gray-300')
 * conditional(isLoading, 'opacity-50')
 * ```
 */
export function conditional(
  condition: boolean,
  trueClass: string,
  falseClass?: string
): string {
  return condition ? trueClass : (falseClass || '');
}

/**
 * 여러 variant에 따른 클래스명을 반환하는 헬퍼 함수
 *
 * @param base - 기본 클래스명
 * @param variants - variant별 클래스 맵핑
 * @param selectedVariant - 선택된 variant
 * @param additional - 추가 클래스명
 * @returns 결합된 클래스명
 *
 * @example
 * ```typescript
 * const buttonClass = variant({
 *   base: 'px-4 py-2 rounded',
 *   variants: {
 *     primary: 'bg-blue-500 text-white',
 *     secondary: 'bg-gray-200 text-gray-800',
 *     danger: 'bg-red-500 text-white'
 *   },
 *   selectedVariant: 'primary',
 *   additional: 'hover:opacity-80'
 * })
 * ```
 */
export function variant<T extends string>(config: {
  base: string;
  variants: Record<T, string>;
  selectedVariant: T;
  additional?: string;
}): string {
  const { base, variants, selectedVariant, additional } = config;
  return cn(base, variants[selectedVariant], additional);
}

/**
 * 크기별 클래스를 적용하는 헬퍼 함수
 *
 * @param sizes - 크기별 클래스 맵핑
 * @param selectedSize - 선택된 크기
 * @param base - 기본 클래스명
 * @returns 결합된 클래스명
 *
 * @example
 * ```typescript
 * const sizeClass = size({
 *   sm: 'px-2 py-1 text-sm',
 *   md: 'px-4 py-2 text-base',
 *   lg: 'px-6 py-3 text-lg'
 * }, 'md', 'rounded border')
 * ```
 */
export function size<T extends string>(
  sizes: Record<T, string>,
  selectedSize: T,
  base?: string
): string {
  return cn(base, sizes[selectedSize]);
}

/**
 * 테마별 클래스를 적용하는 헬퍼 함수
 *
 * @param lightClass - 라이트 모드 클래스
 * @param darkClass - 다크 모드 클래스
 * @returns 테마별 클래스명
 *
 * @example
 * ```typescript
 * const themeClass = theme('bg-white text-black', 'bg-gray-800 text-white')
 * // "bg-white text-black dark:bg-gray-800 dark:text-white"
 * ```
 */
export function theme(lightClass: string, darkClass: string): string {
  const darkClasses = darkClass
    .split(' ')
    .map(cls => `dark:${cls}`)
    .join(' ');

  return `${lightClass} ${darkClasses}`;
}

/**
 * 상태별 클래스를 적용하는 헬퍼 함수
 *
 * @param states - 상태별 클래스 맵핑
 * @param currentStates - 현재 활성 상태들
 * @param base - 기본 클래스명
 * @returns 결합된 클래스명
 *
 * @example
 * ```typescript
 * const stateClass = states({
 *   hover: 'hover:bg-gray-100',
 *   focus: 'focus:ring-2 focus:ring-blue-500',
 *   disabled: 'disabled:opacity-50 disabled:cursor-not-allowed'
 * }, ['hover', 'focus'], 'px-4 py-2')
 * ```
 */
export function states<T extends string>(
  stateClasses: Record<T, string>,
  currentStates: T[],
  base?: string
): string {
  const appliedStates = currentStates.map(state => stateClasses[state]);
  return cn(base, ...appliedStates);
}

/**
 * 반응형 클래스를 적용하는 헬퍼 함수
 *
 * @param responsive - 브레이크포인트별 클래스 맵핑
 * @param base - 기본 클래스명
 * @returns 결합된 반응형 클래스명
 *
 * @example
 * ```typescript
 * const responsiveClass = responsive({
 *   default: 'block',
 *   sm: 'sm:flex',
 *   md: 'md:grid',
 *   lg: 'lg:grid-cols-3'
 * })
 * ```
 */
export function responsive(responsiveClasses: {
  default?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
}, base?: string): string {
  const { default: defaultClass, ...breakpoints } = responsiveClasses;
  const breakpointClasses = Object.values(breakpoints);
  return cn(base, defaultClass, ...breakpointClasses);
}

/**
 * 애니메이션 관련 클래스를 조건부로 적용하는 헬퍼 함수
 *
 * @param isAnimated - 애니메이션 활성화 여부
 * @param animationClass - 애니메이션 클래스
 * @param base - 기본 클래스명
 * @returns 결합된 클래스명
 *
 * @example
 * ```typescript
 * const animatedClass = animated(
 *   isLoading,
 *   'animate-spin',
 *   'w-4 h-4'
 * )
 * ```
 */
export function animated(
  isAnimated: boolean,
  animationClass: string,
  base?: string
): string {
  return cn(base, isAnimated && animationClass);
}

// 타입 정의 export
export type { ClassValue };

// 기본 export
export default cn;
