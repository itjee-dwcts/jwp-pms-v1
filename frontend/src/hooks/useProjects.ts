// hooks/useProjects.ts (기존 파일 교체)
export { useProjects as default, useProjects } from './use-projects';

// 새로운 특화된 훅들
export { useProjectAttachments } from './use-project-attachments';
export { useProjectMembers } from './use-project-members';
export { useProjectSearch } from './use-project-search';

// 서비스 및 타입들
export { projectService } from '@/services/project-service';
export type * from '@/types/project';
