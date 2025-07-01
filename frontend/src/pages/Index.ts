// src/pages/index.ts
/**
 * Pages Index File
 *
 * Central export file for all page components in the PMS application.
 * This provides a clean import interface for the routing system.
 */

// Authentication pages
export { default as ForgotPassword } from './auth/ForgotPassword';
export { default as Login } from './auth/Login';
export { default as Register } from './auth/Register';
export { default as ResetPassword } from './auth/ResetPassword';

// Main application pages
export { default as Dashboard } from './Dashboard';
export { default as ProjectCreate } from './project/ProjectCreate';
export { default as ProjectDetail } from './project/ProjectDetail';
export { default as ProjectEdit } from './project/ProjectEdit';
export { default as Projects } from './project/Projects';

export { default as TaskCreate } from './task/TaskCreate';
export { default as TaskDetail } from './task/TaskDetail';
export { default as TaskEdit } from './task/TaskEdit';
export { default as Tasks } from './task/Tasks';

export { default as Calendar } from './calendar/Calendar';
export { default as EventCreate } from './calendar/EventCreate';
export { default as EventDetail } from './calendar/EventDetail';
export { default as EventEdit } from './calendar/EventEdit';

// User and profile pages
export { default as Profile } from './common/Profile';
export { default as Settings } from './common/Settings';
export { default as Users } from './user/Users';
export { default as UserDetail } from './UserDetail';

// Utility pages
export { default as Reports } from './reports/Reports';
export { default as Activity } from './utils/Activity';
export { default as Help } from './utils/Help';
export { default as Search } from './utils/Search';

// Error pages
export { default as NotFound } from './error/NotFound';
export { default as ServerError } from './error/ServerError';
export { default as Unauthorized } from './error/Unauthorized';

// Admin pages
export { default as AdminDashboard } from './admin/AdminDashboard';
export { default as AdminProjects } from './admin/AdminProjects';
export { default as AdminSettings } from './admin/AdminSettings';
export { default as AdminUsers } from './admin/AdminUsers';
