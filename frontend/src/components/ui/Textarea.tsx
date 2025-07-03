// src/components/ui/Textarea.tsx
import React, { forwardRef, useState } from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** 라벨 텍스트 */
  label?: string;
  /** 에러 메시지 */
  error?: string;
  /** 도움말 텍스트 */
  helpText?: string;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 리사이즈 옵션 */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  /** 자동 높이 조절 */
  autoResize?: boolean;
  /** 최대 글자 수 */
  maxLength?: number;
  /** 글자 수 표시 여부 */
  showCount?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 텍스트 입력을 위한 Textarea 컴포넌트
 * 다양한 옵션과 검증 기능을 제공
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helpText,
  size = 'md',
  resize = 'vertical',
  autoResize = false,
  maxLength,
  showCount = false,
  className,
  value,
  onChange,
  rows = 4,
  ...props
}, ref) => {
  const [internalValue, setInternalValue] = useState('');

  // value가 제어되는지 확인
  const isControlled = value !== undefined;
  const textValue = isControlled ? value : internalValue;
  const textLength = String(textValue).length;

  // 크기별 클래스 정의
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-4 py-4 text-lg',
  };

  // 리사이즈 클래스
  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize',
  };

  /**
   * 텍스트 변경 처리
   */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // 최대 글자 수 제한 확인
    if (maxLength && newValue.length > maxLength) {
      return;
    }

    if (!isControlled) {
      setInternalValue(newValue);
    }

    // 자동 높이 조절
    if (autoResize) {
      const target = e.target;
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
    }

    onChange?.(e);
  };

  const textareaClasses = cn(
    'block w-full rounded-md border transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    'dark:bg-gray-800 dark:border-gray-600 dark:text-white',
    'dark:focus:ring-blue-400 dark:disabled:bg-gray-700',
    sizeClasses[size],
    resizeClasses[resize],
    error
      ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500 dark:bg-red-900/20 dark:border-red-600'
      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 dark:placeholder-gray-500',
    className
  );

  const labelClasses = cn(
    'block text-sm font-medium mb-2',
    error
      ? 'text-red-700 dark:text-red-400'
      : 'text-gray-700 dark:text-gray-300'
  );

  return (
    <div className="w-full">
      {/* 라벨과 글자 수 표시 */}
      {(label || showCount) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <label className={labelClasses}>
              {label}
              {props.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
          )}

          {showCount && (
            <span className={cn(
              'text-xs',
              error
                ? 'text-red-500'
                : textLength === maxLength
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-gray-500 dark:text-gray-400'
            )}>
              {textLength}{maxLength && `/${maxLength}`}
            </span>
          )}
        </div>
      )}

      {/* 텍스트에리어 */}
      <textarea
        ref={ref}
        value={textValue}
        onChange={handleChange}
        rows={rows}
        maxLength={maxLength}
        className={textareaClasses}
        {...props}
      />

      {/* 에러 메시지 또는 도움말 */}
      {(error || helpText) && (
        <div className="mt-2">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </p>
          )}

          {!error && helpText && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {helpText}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

/**
 * 자동 크기 조절이 가능한 Textarea
 */
export const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, Omit<TextareaProps, 'autoResize'>>(
  (props, ref) => {
    return <Textarea {...props} autoResize={true} ref={ref} />;
  }
);

AutoResizeTextarea.displayName = 'AutoResizeTextarea';

/**
 * 글자 수 제한이 있는 Textarea
 */
export const LimitedTextarea = forwardRef<HTMLTextAreaElement, TextareaProps & { maxLength: number }>(
  (props, ref) => {
    return <Textarea {...props} showCount={true} ref={ref} />;
  }
);

LimitedTextarea.displayName = 'LimitedTextarea';

/**
 * 코드 입력용 Textarea
 */
export const CodeTextarea = forwardRef<HTMLTextAreaElement, Omit<TextareaProps, 'resize'>>(
  ({ className, ...props }, ref) => {
    return (
      <Textarea
        {...props}
        resize="none"
        className={cn('font-mono text-sm', className)}
        ref={ref}
      />
    );
  }
);

CodeTextarea.displayName = 'CodeTextarea';

export default Textarea;
