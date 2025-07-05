import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/use-auth';
import {
  AcademicCapIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  InformationCircleIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  QuestionMarkCircleIcon,
  UserGroupIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

// 자주 묻는 질문 인터페이스
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful_count: number;
  views: number;
}

// 지원 티켓 인터페이스
interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

// 도움말 문서 인터페이스
interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  last_updated: string;
  views: number;
  rating: number;
}

const Help: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'faq' | 'articles' | 'support' | 'contact'>('faq');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [supportForm, setSupportForm] = useState({
    subject: '',
    description: '',
    priority: 'medium' as const,
    category: 'general',
  });

  // 목업 데이터 - 실제 앱에서는 API에서 가져옴
  const faqItems: FAQItem[] = [
    {
      id: "1",
      question: "새 프로젝트를 어떻게 생성하나요?",
      answer: "새 프로젝트를 생성하려면 프로젝트 페이지로 이동하여 '새 프로젝트' 버튼을 클릭하세요. 프로젝트 이름, 설명, 일정, 팀원을 포함한 프로젝트 세부 정보를 입력하세요. 프로젝트 우선순위와 상태도 설정할 수 있습니다.",
      category: "프로젝트",
      tags: ["프로젝트", "생성", "새로운"],
      helpful_count: 25,
      views: 150,
    },
    {
      id: "2",
      question: "팀원에게 작업을 어떻게 할당하나요?",
      answer: "작업을 생성하거나 편집할 때 '할당자' 섹션을 사용하여 팀원을 검색하고 선택하세요. 한 작업에 여러 명을 할당할 수 있습니다. 할당된 구성원은 해당 작업에 대한 알림을 받게 됩니다.",
      category: "작업",
      tags: ["작업", "할당", "팀"],
      helpful_count: 18,
      views: 120,
    },
    {
      id: "3",
      question: "비밀번호를 어떻게 변경하나요?",
      answer: "오른쪽 상단의 아바타를 클릭하여 프로필 설정으로 이동하세요. '비밀번호' 탭으로 이동하여 현재 비밀번호와 새 비밀번호를 입력하세요. '비밀번호 변경'을 클릭하여 변경사항을 저장하세요.",
      category: "계정",
      tags: ["비밀번호", "보안", "계정"],
      helpful_count: 32,
      views: 200,
    },
    {
      id: "4",
      question: "프로젝트 데이터를 내보낼 수 있나요?",
      answer: "네, 보고서 섹션에서 프로젝트 데이터를 내보낼 수 있습니다. 내보낼 형식(CSV, Excel, PDF)을 선택하고 포함할 데이터 범위와 필드를 선택하세요. 관리자 사용자는 더 포괄적인 내보내기 옵션에 액세스할 수 있습니다.",
      category: "보고서",
      tags: ["내보내기", "데이터", "보고서"],
      helpful_count: 15,
      views: 85,
    },
    {
      id: "5",
      question: "새 팀원을 어떻게 초대하나요?",
      answer: "관리자 및 매니저 역할은 사용자 섹션으로 이동하여 '사용자 초대'를 클릭하여 새 팀원을 초대할 수 있습니다. 이메일 주소를 입력하고 역할을 선택하면 작업공간에 참여할 수 있는 초대 이메일을 받게 됩니다.",
      category: "사용자",
      tags: ["초대", "팀", "사용자"],
      helpful_count: 22,
      views: 110,
    },
  ];

  const helpArticles: HelpArticle[] = [
    {
      id: "1",
      title: "시작하기 가이드",
      content: "새 사용자를 위한 완전한 설명서...",
      category: "시작하기",
      tags: ["튜토리얼", "기본", "온보딩"],
      last_updated: "2024-01-15",
      views: 500,
      rating: 4.8,
    },
    {
      id: "2",
      title: "프로젝트 관리 모범 사례",
      content: "효과적인 프로젝트 관리 전략 학습하기...",
      category: "모범 사례",
      tags: ["프로젝트", "관리", "팁"],
      last_updated: "2024-01-10",
      views: 300,
      rating: 4.6,
    },
    {
      id: "3",
      title: "고급 보고서 기능",
      content: "고급 보고서 기능 알아보기...",
      category: "보고서",
      tags: ["보고서", "분석", "고급"],
      last_updated: "2024-01-08",
      views: 200,
      rating: 4.7,
    },
  ];

  const supportCategories = [
    { value: 'general', label: '일반 문의' },
    { value: 'technical', label: '기술적 문제' },
    { value: 'billing', label: '결제 & 구독' },
    { value: 'feature', label: '기능 요청' },
    { value: 'bug', label: '버그 신고' },
  ];

  // 필터링된 FAQ 목록
  const filteredFAQs = faqItems.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 필터링된 문서 목록
  const filteredArticles = helpArticles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 지원 티켓 제출 핸들러
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 목업 API 호출 - 실제 지원 티켓 생성으로 교체 필요
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('지원 티켓이 성공적으로 생성되었습니다! 곧 연락드리겠습니다.');
      setSupportForm({
        subject: '',
        description: '',
        priority: 'medium',
        category: 'general',
      });
    } catch (error) {
      toast.error('지원 티켓 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // FAQ 토글 핸들러
  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  // FAQ 탭 렌더링
  const renderFAQTab = () => (
    <div className="space-y-6">
      {/* 검색 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="자주 묻는 질문을 검색하세요..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* FAQ 카테고리 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['프로젝트', '작업', '계정', '보고서', '사용자'].map((category) => (
          <Card key={category} className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <QuestionMarkCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">{category}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {faqItems.filter(faq => faq.category === category).length}개 질문
            </p>
          </Card>
        ))}
      </div>

      {/* FAQ 목록 */}
      <div className="space-y-4">
        {filteredFAQs.map((faq) => (
          <Card key={faq.id} className="overflow-hidden">
            <button
              onClick={() => toggleFAQ(faq.id)}
              className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {faq.question}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <Badge variant="default">{faq.category}</Badge>
                    <span>{faq.views}번 조회됨</span>
                    <span>{faq.helpful_count}명이 도움됨</span>
                  </div>
                </div>
                <div className="ml-4">
                  {expandedFAQ === faq.id ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </button>

            {expandedFAQ === faq.id && (
              <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
                <div className="pt-4 text-gray-600 dark:text-gray-400">
                  {faq.answer}
                </div>
                <div className="mt-4 flex items-center space-x-4">
                  <Button size="sm" variant="outline">
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Helpful
                  </Button>
                  <Button size="sm" variant="ghost">
                    Share
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );

  // 문서 탭 렌더링
  const renderArticlesTab = () => (
    <div className="space-y-6">
      {/* 검색 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="도움말 문서를 검색하세요..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 추천 문서 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          추천 문서
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpenIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {article.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <Badge variant="default">{article.category}</Badge>
                    <span>★ {article.rating}</span>
                    <span>{article.views}번 조회됨</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    최종 업데이트: {new Date(article.last_updated).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 빠른 링크 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          빠른 링크
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: '동영상 튜토리얼', icon: PlayIcon, count: '12개 동영상' },
            { title: '사용자 가이드', icon: BookOpenIcon, count: '완전한 가이드' },
            { title: 'API 문서', icon: DocumentTextIcon, count: '개발자용' },
            { title: '모범 사례', icon: LightBulbIcon, count: '15개 문서' },
          ].map((link, index) => (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <link.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{link.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{link.count}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  // 지원 탭 렌더링
  const renderSupportTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          지원 티켓 생성
        </h3>
        <form onSubmit={handleSupportSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="select-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                카테고리
              </label>
              <select
                id = "select-category"
                value={supportForm.category}
                onChange={(e) => setSupportForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                {supportCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="select-priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                우선순위
              </label>
              <select
                id = "select-priority"
                value={supportForm.priority}
                onChange={(e) => setSupportForm(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="low">낮음</option>
                <option value="medium">보통</option>
                <option value="high">높음</option>
                <option value="urgent">긴급</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              제목
            </label>
            <Input
              type="text"
              value={supportForm.subject}
              onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="문제에 대한 간단한 설명"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={6}
              value={supportForm.description}
              onChange={(e) => setSupportForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="문제에 대한 자세한 정보를 제공해주세요..."
              required
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                티켓 생성 중...
              </>
            ) : (
              '지원 티켓 생성'
            )}
          </Button>
        </form>
      </Card>

      {/* 응답 시간 정보 */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              예상 응답 시간
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• 긴급: 2시간 이내</li>
              <li>• 높음: 4시간 이내</li>
              <li>• 보통: 24시간 이내</li>
              <li>• 낮음: 48시간 이내</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );

  // 연락처 탭 렌더링
  const renderContactTab = () => (
    <div className="space-y-6">
      {/* Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">실시간 채팅</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            지원팀과 실시간으로 채팅하세요
          </p>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            오전 9시 - 오후 6시 PST 이용 가능
          </Badge>
          <Button className="w-full mt-4">Start Chat</Button>
        </Card>

        <Card className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <EnvelopeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">이메일 지원</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            이메일을 보내주시면 신속하게 답변드리겠습니다
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            support@itjee.com
          </p>
          <Button variant="outline" className="w-full mt-4">이메일 보내기</Button>
        </Card>

        <Card className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <VideoCameraIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">화상 통화</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            복잡한 문제를 위한 화상 통화 예약
          </p>
          <Badge variant="default">예약 필요</Badge>
          <Button variant="outline" className="w-full mt-4">통화 예약</Button>
        </Card>
      </div>

      {/* 운영 시간 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          지원 시간
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">운영 시간</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">월요일 - 금요일</span>
                <span className="text-gray-900 dark:text-white">오전 9:00 - 오후 6:00 PST</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">토요일</span>
                <span className="text-gray-900 dark:text-white">오전 10:00 - 오후 4:00 PST</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">일요일</span>
                <span className="text-gray-900 dark:text-white">휴무</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">긴급 지원</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              운영 환경에 영향을 미치는 중요한 시스템 문제용
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              엔터프라이즈 고객은 24/7 이용 가능
            </p>
          </div>
        </div>
      </Card>

      {/* 커뮤니티 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          커뮤니티 리소스
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <UserGroupIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">커뮤니티 포럼</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">질문하고 지식을 공유하세요</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <AcademicCapIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">교육 센터</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">가이드 튜토리얼로 학습하세요</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          도움말 & 지원
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          질문에 대한 답변을 찾고 필요한 도움을 받으세요
        </p>
      </div>

      {/* 빠른 액션 */}
      <div className="flex flex-wrap justify-center gap-4">
        <Button variant="outline" onClick={() => setActiveTab('faq')}>
          <QuestionMarkCircleIcon className="w-4 h-4 mr-2" />
          FAQ 둘러보기
        </Button>
        <Button variant="outline" onClick={() => setActiveTab('articles')}>
          <BookOpenIcon className="w-4 h-4 mr-2" />
          도움말 문서
        </Button>
        <Button onClick={() => setActiveTab('support')}>
          <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
          지원 요청
        </Button>
      </div>

      {/* 탭 내비게이션 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'faq', label: 'FAQ', icon: QuestionMarkCircleIcon },
            { id: 'articles', label: '도움말 문서', icon: BookOpenIcon },
            { id: 'support', label: '지원 티켓', icon: ChatBubbleLeftRightIcon },
            { id: 'contact', label: '연락처', icon: EnvelopeIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 내용 */}
      <div className="mt-6">
        {activeTab === 'faq' && renderFAQTab()}
        {activeTab === 'articles' && renderArticlesTab()}
        {activeTab === 'support' && renderSupportTab()}
        {activeTab === 'contact' && renderContactTab()}
      </div>
    </div>
  );
};

export default Help;
