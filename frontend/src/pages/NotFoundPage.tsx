import { ArrowLeftIcon, HomeIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center mb-6">
            <span className="text-white font-bold text-lg">PMS</span>
          </div>

          <div className="text-9xl font-bold text-primary-600 mb-4">404</div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            페이지를 찾을 수 없습니다
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="primary"
              onClick={() => window.history.back()}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              이전 페이지로
            </Button>

            <Link to="/dashboard">
              <Button variant="secondary">
                <HomeIcon className="h-4 w-4 mr-2" />
                대시보드로 이동
              </Button>
            </Link>
          </div>

          <div className="mt-12">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              문제가 지속되면{' '}
              <a href="mailto:support@pms.com" className="text-primary-600 hover:text-primary-500">
                고객지원팀
              </a>
              에 문의해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
