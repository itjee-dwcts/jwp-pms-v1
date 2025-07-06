import { useCallback, useMemo } from 'react';
import type {
  ReportData
} from '../types/report';

interface ChartData {
  pieChartData: any[];
  barChartData: any[];
  lineChartData: any[];
  areaChartData: any[];
}

interface UseReportChartsReturn {
  chartData: ChartData;
  getChartConfig: (type: string) => any;
  formatChartData: (data: any[], type: 'pie' | 'bar' | 'line' | 'area') => any[];
}

export const useReportCharts = (reportData: ReportData | null): UseReportChartsReturn => {
  const chartData = useMemo((): ChartData => {
    if (!reportData) {
      return {
        pieChartData: [],
        barChartData: [],
        lineChartData: [],
        areaChartData: [],
      };
    }

    // Task Status Distribution for Pie Chart
    const pieChartData = reportData.task_status_distribution.map(item => ({
      name: item.status,
      value: item.count,
      percentage: item.percentage,
      fill: item.color || getDefaultColor(item.status),
    }));

    // User Productivity for Bar Chart
    const barChartData = reportData.user_productivity.map(user => ({
      name: user.user_name,
      completedTasks: user.completed_tasks,
      hoursLogged: user.hours_logged,
      efficiency: user.efficiency_score,
    }));

    // Timeline Data for Line Chart
    const lineChartData = reportData.timeline_data.map(item => ({
      date: item.date,
      created: item.created_tasks,
      completed: item.completed_tasks,
      active: item.active_projects,
      hours: item.hours_logged,
    }));

    // Area Chart (same as line but for area visualization)
    const areaChartData = lineChartData;

    return {
      pieChartData,
      barChartData,
      lineChartData,
      areaChartData,
    };
  }, [reportData]);

  const getDefaultColor = useCallback((status: string): string => {
    const colorMap: Record<string, string> = {
      'todo': '#6B7280',
      'in_progress': '#3B82F6',
      'in_review': '#F59E0B',
      'done': '#10B981',
      'low': '#6B7280',
      'medium': '#F59E0B',
      'high': '#EF4444',
      'critical': '#DC2626',
    };
    return colorMap[status] || '#6B7280';
  }, []);

  const getChartConfig = useCallback((type: string) => {
    const configs = {
      pie: {
        dataKey: 'value',
        nameKey: 'name',
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      },
      bar: {
        dataKey: ['completedTasks', 'hoursLogged'],
        nameKey: 'name',
        colors: ['#3B82F6', '#10B981'],
      },
      line: {
        dataKey: ['created', 'completed'],
        nameKey: 'date',
        colors: ['#3B82F6', '#10B981'],
      },
      area: {
        dataKey: ['created', 'completed'],
        nameKey: 'date',
        colors: ['#3B82F6', '#10B981'],
      },
    };
    return configs[type as keyof typeof configs] || configs.bar;
  }, []);

  const formatChartData = useCallback((data: any[], type: 'pie' | 'bar' | 'line' | 'area') => {
    switch (type) {
      case 'pie':
        return data.map(item => ({
          ...item,
          fill: item.fill || getDefaultColor(item.name),
        }));
      case 'bar':
      case 'line':
      case 'area':
        return data;
      default:
        return data;
    }
  }, [getDefaultColor]);

  return {
    chartData,
    getChartConfig,
    formatChartData,
  };
};
