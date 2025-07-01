
--사용자
DROP TABLE IF EXISTS users;

CREATE TABLE users
(
    id 			uuid 			primary key default gen_random_uuid(),
    created_at 	timestamp 		default now(),
    created_by	uuid,
    updated_at	timestamp,
    updated_by	uuid,
    username 	varchar(100) 	not null unique,
    email 		varchar(255) 	not null unique,
    password 	varchar(255)	not null,
    full_name 	varchar(200),
    is_active	boolean			not null default true,
	is_verified	bool 			not null default false,
	role 		varchar(20)		not null default 'develop',
	status 		varchar(20)		not null default 'pending',
	avatar_url	varchar(500),
	bio			text,
	phone		varchar(20),
	department	varchar(100),
	position	varchar(100),

	google_id	varchar(100),
	github_id	varchar(100),

    last_login	timestamp,
	last_active	timestamp
);

create unique index ux_users__username	on users (username);
create unique index ux_users__email 	on users (email);
create index ix_users__is_active		on users (is_active);
create index ix_users__is_verified		on users (is_verified);
create index ix_users__status			on users (status);
create index ix_users__role				on users (role);


--활동로그
DROP TABLE IF EXISTS user_activity_logs;

CREATE TABLE user_activity_logs
(
    id 				uuid 			primary key default gen_random_uuid(),
    created_at 		timestamp 		default now(),
    created_by		uuid,
    user_id 		uuid 			references users(id) on delete cascade,
    action			varchar(255)	not null,
	resource_type	varchar(50),
	resource_id		varchar(50),
    description		text,
	ip_address		varchar(50),
	user_agent		varchar(500),
	extra_data		text
);

create index ix_user_activity_logs__user_id	on user_activity_logs (user_id);

--세션관리
DROP TABLE IF EXISTS user_sessions;

CREATE TABLE user_sessions
(
    id 				uuid 			primary key default gen_random_uuid(),
    created_at 		timestamp 		default now(),
    created_by		uuid,
    user_id 		uuid 			references users(id) on delete cascade,
    session_token	varchar(255)	not null,
	refresh_token	varchar(255),
	expires_at		timestamp 		not null,
	is_active 		bool 			default true,
	ip_address		varchar(50),
	user_agent		varchar(500)
);

create unique index ux_user_sessions__session_token	on user_sessions (session_token);
create unique index ux_user_sessions__refresh_toekn on user_sessions (refresh_token);
create index ix_user_sessions__user_id	on user_sessions (user_id);

--역할
DROP TABLE IF EXISTS roles;

CREATE TABLE roles
(
	id 				uuid 			primary key default gen_random_uuid(),
    created_at 		timestamp 		default now(),
    created_by		uuid,
    updated_at		timestamp,
    updated_by		uuid,
    name			varchar(50) 	not null unique,
	description		text
);

--사용자, 역할 매핑
DROP TABLE IF EXISTS user_roles;

CREATE TABLE user_roles
(
	id 				uuid 			primary key default gen_random_uuid(),
    created_at 		timestamp 		default now(),
    created_by		uuid,
    updated_at		timestamp,
    updated_by		uuid,
	user_id			uuid 			references users(id) on delete cascade,
    role_id 		uuid 			references roles(id) on delete cascade
);

create unique index ux_user_roles 	on user_roles (user_id, role_id);
create index ix_user_roles__user_id	on user_roles (user_id);
create index ix_user_roles__role_id	on user_roles (role_id);

--사용자 코멘트
DROP TABLE IF EXISTS user_comments;

CREATE TABLE user_comments
(
    id 				uuid 			primary key default gen_random_uuid(),
    created_at 		timestamp 		default current_timestamp,
    created_by		uuid,
    updated_at		timestamp,
    updated_by		uuid,
    user_id 		uuid 			references users(id) on delete cascade,
    author_id 		uuid 			references users(id) on delete set null,
    content 		text 			not null
);

create index ix_user_comments__user_id		on user_comments (user_id);
create index ix_user_comments__author_id	on user_comments (author_id);




--프로젝트 상태
--DROP TYPE IF EXISTS project_status CASCADE;
--CREATE TYPE project_status AS ENUM ('PLANNING', 'ACTIVE', 'ONHOLD', 'COMPLETED', 'CANCELLED');

--프로젝트 우선순위
--DROP TYPE IF EXISTS project_priority CASCADE;
--CREATE TYPE project_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

--프로젝트
DROP TABLE IF EXISTS projects;

CREATE TABLE projects
(
    id 					uuid 			primary key default gen_random_uuid(),
    created_at 			timestamp 		default now(),
    created_by			uuid,
    updated_at			timestamp,
    updated_by			uuid,
    name 				varchar(200) 	not null,
    description 		text,
    status 				varchar(20)		default 'planning', -- 예: active, completed, archived
    priority 			varchar(20) 	default 'medium', -- 예: low, medium, high
    start_date 			date,
    end_date 			date,
	actual_start_date	date,
	actual_end_date		date,
	progress			int 			default 0,
	budget				numeric(15,2)	default 0,
	actual_cost			numeric(15,2)	default 0,
    owner_id 			uuid 			references users(id) on delete set null,
	is_active			bool 			default true,
	is_public 			bool 			default false,
	repository_url		varchar(500),
	documentation_url	varchar(500),
	tags				text
);
create index ix_projects__status	on projects (status);
create index ix_projects__name		on projects (name);
create index ix_projects__is_active	on projects (is_active);
create index ix_projects__is_public	on projects (is_public);

--프로젝트 멤버
DROP TABLE IF EXISTS project_members;

CREATE TABLE project_members
(
	id 				uuid 			primary key default gen_random_uuid(),
    created_at 		timestamp 		default now(),
    created_by		uuid,
    updated_at		timestamp,
    updated_by		uuid,
    project_id 		uuid 			references projects(id) on delete cascade,
    user_id 		uuid 			references users(id) 	on delete cascade,
    role			varchar(20),
	joined_at		timestamp		default now(),
	is_active 		bool 			default true
);

create unique index ux_project_members 		on project_members 	(project_id, user_id);
create index ix_project_members__project_id	on project_members 	(project_id);
create index ix_project_members__user_id	on project_members 	(user_id);
create index ix_project_members__is_active	on project_members 	(is_active);

--프로젝트 코멘트
DROP TABLE IF EXISTS project_comments;

CREATE TABLE project_comments
(
    id 				uuid 			primary key default gen_random_uuid(),
    created_at 		timestamp 		default now(),
    created_by		uuid,
    updated_at		timestamp,
    updated_by		uuid,
    project_id 		uuid 			references projects(id) on delete cascade,
    author_id 		uuid 			references users(id) on delete set null,
    content 		text 			not null,
	parent_id		uuid 			references project_comments(id) on delete cascade,
	is_edited		bool 			default false
);

create index ix_project_comments__project_id	on project_comments (project_id);
create index ix_project_comments__author_id		on project_comments (author_id);
create index ix_project_comments__parent_id		on project_comments (parent_id);



--프로젝트 참부파일
DROP TABLE IF EXISTS project_attachments;

CREATE TABLE project_attachments
(
    id 				uuid 			primary key default gen_random_uuid(),
    created_at 		timestamp 		default now(),
    created_by		uuid,
    updated_at		timestamp,
    updated_by		uuid,
    project_id 		uuid 			references projects(id) on delete cascade,
    file_name 		varchar(255)	not null,
    file_path 		varchar(500)	not null,
	file_size		int				not null,
	mime_type		varchar(100),
	description 	text
);

create index ix_project_attachments__project_id	on project_attachments (project_id);


--과업 상태
--DROP TYPE IF EXISTS task_status CASCADE;
--CREATE TYPE task_status AS ENUM ('TODO', 'ISPROGRESS', 'REVIEW', 'DONE');

--과업 우선순위
--DROP TYPE IF EXISTS task_priority CASCADE;
--CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

--과업
DROP TABLE IF EXISTS tasks;

CREATE TABLE tasks
(
	id 					uuid 			primary key default gen_random_uuid(),
    created_at 			timestamp 		default now(),
    created_by			uuid,
    updated_at			timestamp,
    updated_by			uuid,
    title 				varchar(200) 	not null,
    description 		text,
    status 				varchar(20) 	default 'todo', 	-- 예: todo, inprogress, done
    priority 			varchar(20)		default 'medium', 	-- 예: low, medium, high
	task_type			varchar(20)		default 'feature',
    project_id 			uuid 			references projects(id) on delete cascade,
	parent_id			uuid 			references tasks(id)	on delete cascade,
	estimated_hours		int,
	actual_hours		int,
	start_date 			date,
	due_date			date,
	completed_at		timestamp,
    owner_id 			uuid 			references users(id) 	on delete set null,
    story_points		int,
	acceptance_criteria	text,
	external_id			varchar(100)
);

create index ix_tasks__project_id	on tasks 	(project_id);
create index ix_tasks__owner_id		on tasks 	(owner_id);
create index ix_tasks__status		on tasks 	(status);

--과업 할당
DROP TABLE IF EXISTS task_assignments;

CREATE TABLE task_assignments
(
    id 					uuid 			primary key default gen_random_uuid(),
    created_at 			timestamp 		default now(),
    created_by			uuid,
    updated_at			timestamp,
    updated_by			uuid,
    task_id 			uuid 			references tasks(id) on delete cascade,
    user_id 			uuid 			references users(id) on delete set null,
	is_active			bool 			default true
);

create unique index ux_task_assignments			on task_assignments (task_id, user_id);
create index ix_task_assignments__task_id		on task_assignments (task_id);
create index ix_task_assignments__user_id		on task_assignments (user_id);

--과업 코멘트
DROP TABLE IF EXISTS task_comments;

CREATE TABLE task_comments
(
    id 					uuid 			primary key default gen_random_uuid(),
    created_at 			timestamp 		default now(),
    created_by			uuid,
    updated_at			timestamp,
    updated_by			uuid,
    task_id 			uuid 			references tasks(id) on delete cascade,
    author_id 			uuid 			references users(id) on delete set null,
    content 			text 			not null,
	parent_id 			uuid 			references task_comments(id) on delete cascade,
	is_edited			bool 			default false
);

create index ix_task_comments__task_id		on task_comments (task_id);
create index ix_task_comments__author_id	on task_comments (author_id);
create index ix_task_comments__parent_id	on task_comments (parent_id);

--과업 참부파일
DROP TABLE IF EXISTS task_attachments;

CREATE TABLE task_attachments
(
    id 					uuid 			primary key default gen_random_uuid(),
    created_at 			timestamp 		default now(),
    created_by			uuid,
    updated_at			timestamp,
    updated_by			uuid,
    task_id 			uuid 			references tasks(id) on delete cascade,
    file_name 			varchar(255)	not null,
    file_path 			varchar(500)	not null,
	file_size			int				not null,
	mime_type			varchar(100),
	description			text
);

create index ix_task_attachments__task_id	on task_attachments (task_id);


--과업 타임로그
DROP TABLE IF EXISTS task_time_logs;

CREATE TABLE task_time_logs
(
    id 					uuid 			primary key default gen_random_uuid(),
    created_at 			timestamp 		default now(),
    created_by			uuid,
    updated_at			timestamp,
    updated_by			uuid,
    task_id 			uuid 			references tasks(id) on delete cascade,
    user_id 			uuid 			references users(id) on delete cascade,
	work_date			date			not null,
	hours				int				not null,
	description			text
);

create index ix_task_time_logs__task_id		on task_time_logs (task_id);
create index ix_task_time_logs__user_id		on task_time_logs (user_id);
create index ix_task_time_logs__work_date	on task_time_logs (work_date);

--태그
DROP TABLE IF EXISTS tags;

CREATE TABLE tags
(
    id 					uuid 			primary key default gen_random_uuid(),
    created_at 			timestamp 		default now(),
    created_by			uuid,
    updated_at			timestamp,
    updated_by			uuid,
    name				varchar(50)		not null,
	color 				varchar(7)		default '#3B82F6',
	description			text
);

create unique index ux_tags__name	on tags (name);

--과업 태그
DROP TABLE IF EXISTS task_tags;

CREATE TABLE task_tags
(
    id 					uuid 			primary key default gen_random_uuid(),
    created_at 			timestamp 		default now(),
    created_by			uuid,
    updated_at			timestamp,
    updated_by			uuid,
    task_id 			uuid 			references tasks(id) on delete cascade,
    tag_id 				uuid 			references tags(id) on delete cascade
);

create unique index iu_task_tags		on task_tags (task_id, tag_id);
create index ix_task_tags__task_id		on task_tags (task_id);
create index ix_task_tags__tag_id		on task_tags (tag_id);


--일정 캘린더
DROP TABLE IF EXISTS calendars;

CREATE TABLE calendars
(
   	id 					uuid 			primary key default gen_random_uuid(),
    created_at 			timestamp 		default now(),
    created_by			uuid,
    updated_at			timestamp,
    updated_by			uuid,
	name				varchar(100)	not null,
	description			text,
	color 				varchar(7)		default '#3b82f6',
	owner_id 			uuid 			references users(id) on delete cascade,
	is_default			bool 			default false,
	is_public 			bool 			default false,
	is_active			bool 			default true
);

create index ix_calendars__owner_id		on calendars (owner_id);
create index ix_calendars__is_public	on calendars (is_public);
create index ix_calendars__is_active	on calendars (is_active);

--일정 이벤트
DROP TABLE IF EXISTS events;

CREATE TABLE events
(
   	id 					uuid 			primary key default gen_random_uuid(),
    created_at 			timestamp 		default now(),
    created_by			uuid,
    updated_at			timestamp,
    updated_by			uuid,
	title				varchar(200)	not null,
	description 		TEXT,
	location			varchar(200),
	start_time			timestamp		not null,
	end_time			timestamp		not null,
	is_all_day			bool 			default false,
	time_zone			varchar(50),
	event_type			varchar(20),
	status				varchar(20),
	calendar_id			uuid 			not null references calendars(id) on delete cascade,
	project_id			uuid 			references projects (id) on delete cascade,
	task_id				uuid 			references tasks (id) on delete cascade,
	owner_id			uuid 			references users (id) on delete cascade,
	parent_id 			uuid 			references events (id) on delete cascade,

	recurrence_type		varchar(20)		not null default 'none',
	recurrence_interval int 			not null default 1,
	recurrence_end_date	timestamp,

	reminder_type		varchar(20)		not null default 'none',
	reminder_minutes	int,

	meeting_url			varchar(500),
	meeting_id			varchar(100),
	meeting_password	varchar(100)
);

create index ix_events__calendar_id		on events (calendar_id);
create index ix_events__parent_id		on events (parent_id);
create index ix_events__project_id		on events (project_id);
create index ix_events__task_id			on events (task_id);

--일정 참가자
DROP TABLE IF EXISTS event_attendee;

CREATE TABLE event_attendee
(
   	id 					uuid 			primary key default gen_random_uuid(),
    created_at 			timestamp 		default now(),
    created_by			uuid,
    updated_at			timestamp,
    updated_by			uuid,
	event_id			uuid 			not null references events(id) on delete cascade,
	user_id				uuid 			references users (id) on delete cascade,
	status				varchar(20)		not null default 'invited',
	reponse_at			timestamp,
	is_organizer		bool 			not null default false
);
create unique index ux_event_attendee			on event_attendee (event_id, user_id);
create index ix_event_attendee__event_id		on event_attendee (event_id);
create index ix_event_attendee__user_id			on event_attendee (user_id);


--알림
DROP TABLE IF EXISTS notifications;

CREATE TABLE notifications
(
    id 					uuid 			primary key default gen_random_uuid(),
    created_at 			timestamp 		default now(),
    created_by			uuid,
    updated_at			timestamp,
    updated_by			uuid,
    recipient_id 		uuid 			references users(id) on delete cascade,
    sender_id 			uuid 			references users(id) on delete set null,
    type 				varchar(50), -- 예: 'task_assigned', 'comment', 'event_reminder'
    message 			text 			not null,
    related_url 		text, -- 예: 프론트엔드에서 연결할 링크
    is_read 			boolean 		default false,
    read_at 			timestamp
);

--로그인로그
DROP TABLE IF EXISTS login_logs;

CREATE TABLE login_logs
(
    id 					uuid 			primary key default gen_random_uuid(),
    user_id 			uuid 			references users(id) on delete cascade,
    login_time 			timestamp 		default current_timestamp,
    logout_time 		timestamp,
    ip_address 			varchar(50), -- ipv6까지 고려
    user_agent 			varchar(500),
    login_success 		boolean 		default true
);

-- 업데이트 시간 자동 갱신을 위한 함수
/*
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
*/
