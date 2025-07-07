// src/index.tsx - 최소한의 테스트 버전
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// 전역 타입 선언
declare global {
  interface Window {
    hideLoadingScreen?: () => void;
    onReactReady?: () => void;
  }
}

console.log('🚀 React index.tsx 시작...');

// DOM 요소 확인
const container = document.getElementById('root');
if (!container) {
  console.error('❌ 루트 컨테이너를 찾을 수 없습니다!');
  throw new Error('루트 컨테이너를 찾을 수 없습니다!');
}

console.log('✅ 루트 컨테이너 발견');

// React 루트 생성
const root = createRoot(container);
console.log('✅ React 루트 생성 완료');

// 즉시 렌더링 (복잡한 로직 없이)
try {
  console.log('🎯 React 앱 렌더링 시작...');
  
  root.render(
    <React.StrictMode>
      <BrowserRouter>  {/* Router는 최상위에 */}
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
  
  console.log('✅ React 앱 렌더링 요청 완료');
  
  // 렌더링 완료 체크
  setTimeout(() => {
    console.log('🔍 렌더링 완료 체크...');
    const appElement = container.querySelector('div');
    if (appElement) {
      console.log('✅ React 앱이 성공적으로 마운트되었습니다!');
      
      // React 준비 완료 알림
      if (window.onReactReady) {
        window.onReactReady();
      }
    } else {
      console.warn('⚠️ React 앱 마운트 확인 실패');
    }
  }, 100);

} catch (error) {
  console.error('❌ React 앱 렌더링 실패:', error);
  
  // 에러 발생 시 로딩 화면 해제
  if (window.hideLoadingScreen) {
    window.hideLoadingScreen();
  }
  
  // 간단한 에러 페이지 표시
  container.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; padding: 20px;">
      <div style="text-align: center; max-width: 400px;">
        <h1 style="color: #ef4444; margin-bottom: 16px;">⚠️ 앱 로딩 실패</h1>
        <p style="color: #6b7280; margin-bottom: 16px;">React 앱을 시작할 수 없습니다.</p>
        <button onclick="window.location.reload()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
          🔄 새로고침
        </button>
        <details style="margin-top: 16px; text-align: left;">
          <summary style="cursor: pointer;">오류 정보</summary>
          <pre style="background: #f3f4f6; padding: 8px; border-radius: 4px; font-size: 12px; margin-top: 8px;">${error}</pre>
        </details>
      </div>
    </div>
  `;
}