import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PlayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  AcademicCapIcon,
  CogIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/use-auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful_count: number;
  views: number;
}

interface SupportTicket {
  id: number;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

interface HelpArticle {
  id: number;
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
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [supportForm, setSupportForm] = useState({
    subject: '',
    description: '',
    priority: 'medium' as const,
    category: 'general',
  });

  // Mock data - in real app, this would come from API
  const faqItems: FAQItem[] = [
    {
      id: 1,
      question: "How do I create a new project?",
      answer: "To create a new project, navigate to the Projects page and click the 'New Project' button. Fill in the project details including name, description, timeline, and team members. You can also set the project priority and status.",
      category: "Projects",
      tags: ["project", "create", "new"],
      helpful_count: 25,
      views: 150,
    },
    {
      id: 2,
      question: "How do I assign tasks to team members?",
      answer: "When creating or editing a task, use the 'Assignees' section to search and select team members. You can assign multiple people to a single task. Assigned members will receive notifications about the task.",
      category: "Tasks",
      tags: ["task", "assign", "team"],
      helpful_count: 18,
      views: 120,
    },
    {
      id: 3,
      question: "How do I change my password?",
      answer: "Go to your Profile settings by clicking on your avatar in the top right corner. Navigate to the 'Password' tab and enter your current password along with your new password. Click 'Change Password' to save the changes.",
      category: "Account",
      tags: ["password", "security", "account"],
      helpful_count: 32,
      views: 200,
    },
    {
      id: 4,
      question: "Can I export project data?",
      answer: "Yes, you can export project data from the Reports section. Choose the export format (CSV, Excel, or PDF) and select the data range and fields you want to include. Admin users have access to more comprehensive export options.",
      category: "Reports",
      tags: ["export", "data", "reports"],
      helpful_count: 15,
      views: 85,
    },
    {
      id: 5,
      question: "How do I invite new team members?",
      answer: "Admin and Manager roles can invite new team members by going to the Users section and clicking 'Invite User'. Enter their email address, select their role, and they'll receive an invitation email to join the workspace.",
      category: "Users",
      tags: ["invite", "team", "users"],
      helpful_count: 22,
      views: 110,
    },
  ];

  const helpArticles: HelpArticle[] = [
    {
      id: 1,
      title: "Getting Started Guide",
      content: "Complete walkthrough for new users...",
      category: "Getting Started",
      tags: ["tutorial", "basics", "onboarding"],
      last_updated: "2024-01-15",
      views: 500,
      rating: 4.8,
    },
    {
      id: 2,
      title: "Project Management Best Practices",
      content: "Learn effective project management strategies...",
      category: "Best Practices",
      tags: ["project", "management", "tips"],
      last_updated: "2024-01-10",
      views: 300,
      rating: 4.6,
    },
    {
      id: 3,
      title: "Advanced Reporting Features",
      content: "Discover advanced reporting capabilities...",
      category: "Reports",
      tags: ["reports", "analytics", "advanced"],
      last_updated: "2024-01-08",
      views: 200,
      rating: 4.7,
    },
  ];

  const supportCategories = [
    { value: 'general', label: 'General Question' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'billing', label: 'Billing & Subscription' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'bug', label: 'Bug Report' },
  ];

  const filteredFAQs = faqItems.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredArticles = helpArticles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock API call - replace with actual support ticket creation
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Support ticket created successfully! We\'ll get back to you soon.');
      setSupportForm({
        subject: '',
        description: '',
        priority: 'medium',
        category: 'general',
      });
    } catch (error) {
      toast.error('Failed to create support ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const renderFAQTab = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search frequently asked questions..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* FAQ Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Projects', 'Tasks', 'Account', 'Reports', 'Users'].map((category) => (
          <Card key={category} className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <QuestionMarkCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">{category}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {faqItems.filter(faq => faq.category === category).length} questions
            </p>
          </Card>
        ))}
      </div>

      {/* FAQ List */}
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
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <Badge variant="outline">{faq.category}</Badge>
                    <span>{faq.views} views</span>
                    <span>{faq.helpful_count} found helpful</span>
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

  const renderArticlesTab = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search help articles..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Featured Articles */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Featured Articles
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
                    <Badge variant="outline">{article.category}</Badge>
                    <span>★ {article.rating}</span>
                    <span>{article.views} views</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Last updated: {new Date(article.last_updated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Links
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Video Tutorials', icon: PlayIcon, count: '12 videos' },
            { title: 'User Guide', icon: BookOpenIcon, count: 'Complete guide' },
            { title: 'API Documentation', icon: DocumentTextIcon, count: 'For developers' },
            { title: 'Best Practices', icon: LightBulbIcon, count: '15 articles' },
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

  const renderSupportTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Create Support Ticket
        </h3>
        <form onSubmit={handleSupportSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={supportForm.priority}
                onChange={(e) => setSupportForm(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <Input
              type="text"
              value={supportForm.subject}
              onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Brief description of your issue"
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
              placeholder="Please provide detailed information about your issue..."
              required
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating Ticket...
              </>
            ) : (
              'Create Support Ticket'
            )}
          </Button>
        </form>
      </Card>

      {/* Response Time Info */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Expected Response Times
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Urgent: Within 2 hours</li>
              <li>• High: Within 4 hours</li>
              <li>• Medium: Within 24 hours</li>
              <li>• Low: Within 48 hours</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderContactTab = () => (
    <div className="space-y-6">
      {/* Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Live Chat</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Chat with our support team in real-time
          </p>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Available 9 AM - 6 PM PST
          </Badge>
          <Button className="w-full mt-4">Start Chat</Button>
        </Card>

        <Card className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <EnvelopeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Email Support</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Send us an email and we'll respond promptly
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            support@pms.com
          </p>
          <Button variant="outline" className="w-full mt-4">Send Email</Button>
        </Card>

        <Card className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <VideoCameraIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Video Call</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Schedule a video call for complex issues
          </p>
          <Badge variant="outline">By Appointment</Badge>
          <Button variant="outline" className="w-full mt-4">Schedule Call</Button>
        </Card>
      </div>

      {/* Office Hours */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Support Hours
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Business Hours</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Monday - Friday</span>
                <span className="text-gray-900 dark:text-white">9:00 AM - 6:00 PM PST</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Saturday</span>
                <span className="text-gray-900 dark:text-white">10:00 AM - 4:00 PM PST</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Sunday</span>
                <span className="text-gray-900 dark:text-white">Closed</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Emergency Support</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              For critical system issues affecting production environments
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Available 24/7 for Enterprise customers
            </p>
          </div>
        </div>
      </Card>

      {/* Community */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Community Resources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <UserGroupIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Community Forum</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ask questions and share knowledge</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <AcademicCapIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Training Center</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Learn with guided tutorials</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Help & Support
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Find answers to your questions and get the help you need
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap justify-center gap-4">
        <Button variant="outline" onClick={() => setActiveTab('faq')}>
          <QuestionMarkCircleIcon className="w-4 h-4 mr-2" />
          Browse FAQ
        </Button>
        <Button variant="outline" onClick={() => setActiveTab('articles')}>
          <BookOpenIcon className="w-4 h-4 mr-2" />
          Help Articles
        </Button>
        <Button onClick={() => setActiveTab('support')}>
          <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
          Get Support
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'faq', label: 'FAQ', icon: QuestionMarkCircleIcon },
            { id: 'articles', label: 'Help Articles', icon: BookOpenIcon },
            { id: 'support', label: 'Support Tickets', icon: ChatBubbleLeftRightIcon },
            { id: 'contact', label: 'Contact Us', icon: EnvelopeIcon },
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

      {/* Tab Content */}
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
