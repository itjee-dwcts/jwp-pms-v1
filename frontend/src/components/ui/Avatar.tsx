// src/components/ui/Avatar.tsx
import { UserIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { cn } from '../../utils/cn';

export interface AvatarProps {
  /** 이미지 URL */
  src?: string | null;
  /** 대체 텍스트 */
  alt?: string;
  /** 아바타 크기 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** 추가 CSS 클래스 */
  className?: string;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 온라인 상태 표시 */
  isOnline?: boolean;
  /** 커스텀 fallback 컨텐츠 */
  fallback?: React.ReactNode;
}

/**
 * 사용자 아바타를 표시하는 컴포넌트
 * 이미지 로딩 실패 시 이니셜 또는 기본 아이콘으로 fallback
 */
const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  size = 'md',
  className,
  onClick,
  isOnline,
  fallback,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // 크기별 클래스 정의
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  };

  // 온라인 상태 표시용 크기
  const onlineIndicatorSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
  };

  /**
   * 이미지 로딩 에러 처리
   */
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  /**
   * 이미지 로딩 완료 처리
   */
  const handleImageLoad = () => {
    setImageLoading(false);
  };

  /**
   * 이름으로부터 이니셜 생성
   */
  const getInitials = (name: string): string => {
    if (!name) return '';

    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0] && words[0].length > 0 ? words[0].charAt(0).toUpperCase() : '';
    }

    return words
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  };

  /**
   * 배경색 생성 (이름 기반)
   */
  const getBackgroundColor = (name: string): string => {
    if (!name) return 'bg-gray-500';

    const colors = [
      'bg-red-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-cyan-500',
    ];

    // 이름의 첫 글자를 기반으로 색상 선택
    const index = name.charCodeAt(0) % colors.length;
    return colors[index] ?? 'bg-gray-500';
  };

  const baseClasses = cn(
    'relative inline-flex items-center justify-center overflow-hidden rounded-full',
    'bg-gray-100 dark:bg-gray-800',
    'font-medium text-gray-600 dark:text-gray-300',
    'select-none',
    sizeClasses[size],
    onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
    className
  );

  const initials = getInitials(alt);
  const backgroundColorClass = initials ? getBackgroundColor(alt) : '';

  return (
    <div className={baseClasses} onClick={onClick}>
      {/* 이미지 표시 */}
      {src && !imageError ? (
        <>
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 animate-pulse">
              <div className="w-1/2 h-1/2 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          )}
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
            style={{ display: imageLoading ? 'none' : 'block' }}
          />
        </>
      ) : (
        /* Fallback 컨텐츠 */
        <div className={cn(
          'w-full h-full flex items-center justify-center text-white',
          initials ? backgroundColorClass : 'bg-gray-500 dark:bg-gray-600'
        )}>
          {fallback || (
            initials ? (
              <span className="font-semibold">{initials}</span>
            ) : (
              <UserIcon className="w-1/2 h-1/2" />
            )
          )}
        </div>
      )}

      {/* 온라인 상태 표시 */}
      {isOnline !== undefined && (
        <div className={cn(
          'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-800',
          onlineIndicatorSizes[size],
          isOnline ? 'bg-green-400' : 'bg-gray-400'
        )} />
      )}
    </div>
  );
};

export default Avatar;
