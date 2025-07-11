import React, { useState } from 'react';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  DocumentTextIcon,
  UserGroupIcon,
  PlayIcon,
  ClockIcon,
  LightBulbIcon,
  BoltIcon,
  ChartBarIcon,
  GlobeAsiaAustraliaIcon,
  CogIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

/**
 * Gen AI 채팅 Home 페이지 컴포넌트
 * Goover.ai 스타일의 AI 리서치 에이전트 인터페이스
 */
const ChatHome = () => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 추천 질문 목록
  const suggestedQuestions = [
    "오늘 주요 기술 뉴스를 요약해줘",
    "2025년 AI 트렌드 분석 리포트 만들어줘",
    "최신 마케팅 전략에 대해 연구해줘",
    "글로벌 경제 동향을 분석해줘"
  ];

  // 오늘의 하이라이트 데이터
  const todayHighlights = [
    {
      title: "AI 기술 혁신",
      description: "ChatGPT-5 출시 소식과 업계 영향",
      time: "2시간 전",
      category: "기술",
      trend: "+15%"
    },
    {
      title: "글로벌 시장 분석",
      description: "2025년 Q1 주요 시장 동향",
      time: "4시간 전",
      category: "경제",
      trend: "+8%"
    },
    {
      title: "헬스케어 혁신",
      description: "의료용 AI 로봇 상용화 시작",
      time: "6시간 전",
      category: "의료",
      trend: "+12%"
    }
  ];

  // 오늘의 리포트 데이터
  const todayReports = [
    {
      title: "AI 시장 분석 보고서",
      description: "2025년 AI 시장 전망과 주요 기업 동향",
      readTime: "15분",
      category: "시장분석",
      status: "완료"
    },
    {
      title: "신재생 에너지 동향",
      description: "전 세계 태양광 산업 현황과 전망",
      readTime: "12분",
      category: "에너지",
      status: "진행중"
    }
  ];

  // 오늘의 에이전트 데이터
  const todayAgents = [
    {
      name: "시장 분석가",
      description: "실시간 시장 데이터 분석 및 투자 인사이트",
      icon: <ChartBarIcon className="w-6 h-6" />,
      active: true
    },
    {
      name: "기술 연구원",
      description: "최신 기술 동향 연구 및 트렌드 분석",
      icon: <BoltIcon className="w-6 h-6" />,
      active: true
    },
    {
      name: "글로벌 뉴스 큐레이터",
      description: "전 세계 주요 뉴스 수집 및 요약",
      icon: <GlobeAsiaAustraliaIcon className="w-6 h-6" />,
      active: false
    }
  ];

  // 맞춤 추천 영상 데이터
  const recommendedVideos = [
    {
      title: "AI 혁신의 미래",
      channel: "TechTalk",
      duration: "18:32",
      views: "2.3M",
      thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&h=150&fit=crop"
    },
    {
      title: "스타트업 성공 비법",
      channel: "Business Insider",
      duration: "12:45",
      views: "1.8M",
      thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=150&fit=crop"
    },
    {
      title: "데이터 과학 입문",
      channel: "DataScience Pro",
      duration: "25:18",
      views: "950K",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=150&fit=crop"
    }
  ];

  // 질문 제출 처리
  const handleSubmit = async (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!question.trim()) return;

    setIsLoading(true);
    // 실제 AI 처리 로직
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);

    // 질문 초기화
    setQuestion('');
    alert(`질문 처리됨: ${question}`);
  };

  // 추천 질문 클릭 처리
  const handleSuggestedQuestionClick = (suggestedQuestion: string) => {
    setQuestion(suggestedQuestion);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                PMS AI Research
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="검색"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>
              <button
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="설정"
                aria-label="설정"
              >
                <CogIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            무엇을 연구해드릴까요?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            AI 리서치 에이전트가 깊이 있는 분석과 인사이트를 제공합니다
          </p>
        </div>

        {/* 추천 질문 */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {suggestedQuestions.map((suggestedQuestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestionClick(suggestedQuestion)}
                className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                         rounded-full border border-gray-200 dark:border-gray-600
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                         text-sm font-medium shadow-sm"
              >
                {suggestedQuestion}
              </button>
            ))}
          </div>
        </div>

        {/* 질문 입력 영역 */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-2">
              <div className="flex items-center">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmit();
                    }
                  }}
                  placeholder="궁금한 것을 물어보세요..."
                  className="flex-1 px-4 py-3 bg-transparent text-gray-900 dark:text-white
                           placeholder-gray-500 dark:placeholder-gray-400 border-0
                           focus:outline-none focus:ring-0 text-lg"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!question.trim() || isLoading}
                  className="p-3 bg-gradient-to-r from-blue-500 to-purple-600
                           text-white rounded-xl hover:from-blue-600 hover:to-purple-700
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200 shadow-sm"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent
                                  rounded-full animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 위젯 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 오늘의 하이라이트 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <LightBulbIcon className="w-6 h-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                오늘의 하이라이트
              </h3>
            </div>
            <div className="space-y-4">
              {todayHighlights.map((highlight, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {highlight.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {highlight.description}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {highlight.time}
                        <span className="mx-2">•</span>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                          {highlight.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-green-600 dark:text-green-400 text-sm font-medium">
                      {highlight.trend}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오늘의 리포트 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="w-6 h-6 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                오늘의 리포트
              </h3>
            </div>
            <div className="space-y-4">
              {todayReports.map((report, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {report.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {report.description}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded mr-2">
                          {report.category}
                        </span>
                        <span>{report.readTime}</span>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      report.status === '완료'
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                    }`}>
                      {report.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오늘의 에이전트 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <UserGroupIcon className="w-6 h-6 text-green-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                오늘의 에이전트
              </h3>
            </div>
            <div className="space-y-4">
              {todayAgents.map((agent, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-start">
                    <div className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg mr-3">
                      {agent.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {agent.name}
                        </h4>
                        <div className={`ml-2 w-2 h-2 rounded-full ${
                          agent.active ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {agent.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 맞춤 추천 영상 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <PlayIcon className="w-6 h-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                맞춤 추천 영상
              </h3>
            </div>
            <div className="space-y-4">
              {recommendedVideos.map((video, index) => (
                <div key={index} className="flex items-start p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                  <div className="relative flex-shrink-0 mr-3">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-20 h-14 object-cover rounded"
                    />
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
                      {video.duration}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-tight mb-1">
                      {video.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {video.channel}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      조회수 {video.views}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHome;
