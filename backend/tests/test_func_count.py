"""
SQLAlchemy func.count() 테스트 및 사용법 가이드

이 문서는 SQLAlchemy의 func.count() 함수를 다양한 시나리오에서
테스트하고 사용하는 방법을 보여줍니다.
"""

import asyncio
from datetime import datetime, timezone
from typing import List, Tuple

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
    select,
)
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

# Base 클래스 정의
Base = declarative_base()


# 테스트용 모델 정의
class User(Base):
    """사용자 모델"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    # 관계 정의
    projects = relationship("Project", back_populates="owner")
    tasks = relationship("Task", back_populates="assignee")


class Project(Base):
    """프로젝트 모델"""

    __tablename__ = "projects"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    description = Column(String(1000))
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    # 관계 정의
    owner = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project")


class Task(Base):
    """작업 모델"""

    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    description = Column(String(1000))
    project_id = Column(Integer, ForeignKey("projects.id"))
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(20), default="TODO")
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    # 관계 정의
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="tasks")


class FuncCountTests:
    """func.count() 테스트 클래스"""

    def __init__(self, async_session: AsyncSession):
        self.session = async_session

    async def test_basic_count(self) -> int:
        """기본 카운트 테스트"""
        print("=== 1. 기본 카운트 테스트 ===")

        # 전체 사용자 수 카운트
        query = select(func.count(User.id))
        result = await self.session.execute(query)
        count = result.scalar()

        print(f"총 사용자 수: {count}")
        return int(str(count))

    async def test_count_with_filter(self) -> int:
        """필터링된 카운트 테스트"""
        print("\n=== 2. 필터링된 카운트 테스트 ===")

        # 특정 상태의 작업 수 카운트
        query = select(func.count(Task.id)).where(Task.status == "TODO")
        result = await self.session.execute(query)
        count = result.scalar()

        print(f"TODO 상태 작업 수: {count}")
        return int(str(count))

    async def test_count_with_join(self) -> List[Tuple[str, int]]:
        """조인을 사용한 카운트 테스트"""
        print("\n=== 3. 조인을 사용한 카운트 테스트 ===")

        # 각 사용자별 프로젝트 수
        query = (
            select(User.name, func.count(Project.id))
            .join(Project, User.id == Project.owner_id)
            .group_by(User.id, User.name)
        )
        result = await self.session.execute(query)
        counts = result.all()

        print("사용자별 프로젝트 수:")
        for name, count in counts:
            print(f"  {name}: {count}개")

        return counts

    async def test_count_with_left_join(self) -> List[Tuple[str, int]]:
        """LEFT JOIN을 사용한 카운트 테스트"""
        print("\n=== 4. LEFT JOIN을 사용한 카운트 테스트 ===")

        # 모든 사용자와 그들의 프로젝트 수 (프로젝트가 없는 사용자도 포함)
        query = (
            select(User.name, func.count(Project.id))
            .outerjoin(Project, User.id == Project.owner_id)
            .group_by(User.id, User.name)
        )
        result = await self.session.execute(query)
        counts = result.all()

        print("모든 사용자의 프로젝트 수 (LEFT JOIN):")
        for name, count in counts:
            print(f"  {name}: {count}개")

        return counts

    async def test_count_distinct(self) -> int:
        """DISTINCT 카운트 테스트"""
        print("\n=== 5. DISTINCT 카운트 테스트 ===")

        # 작업이 할당된 고유 사용자 수
        query = select(func.count(func.distinct(Task.assignee_id))).where(
            Task.assignee_id.is_not(None)
        )
        result = await self.session.execute(query)
        count = result.scalar()

        print(f"작업이 할당된 고유 사용자 수: {count}")
        return count

    async def test_count_with_having(self) -> List[Tuple[str, int]]:
        """HAVING 절을 사용한 카운트 테스트"""
        print("\n=== 6. HAVING 절을 사용한 카운트 테스트 ===")

        # 2개 이상의 프로젝트를 가진 사용자
        query = (
            select(User.name, func.count(Project.id))
            .join(Project, User.id == Project.owner_id)
            .group_by(User.id, User.name)
            .having(func.count(Project.id) >= 2)
        )
        result = await self.session.execute(query)
        counts = result.all()

        print("2개 이상의 프로젝트를 가진 사용자:")
        for name, count in counts:
            print(f"  {name}: {count}개")

        return counts

    async def test_multiple_counts(self) -> Tuple[int, int, int]:
        """여러 카운트를 한 번에 조회"""
        print("\n=== 7. 여러 카운트 동시 조회 테스트 ===")

        query = select(
            func.count(User.id).label("user_count"),
            func.count(Project.id).label("project_count"),
            func.count(Task.id).label("task_count"),
        ).select_from(User.outerjoin(Project).outerjoin(Task))

        result = await self.session.execute(query)
        row = result.first()

        user_count = row.user_count
        project_count = row.project_count
        task_count = row.task_count

        print(f"사용자 수: {user_count}")
        print(f"프로젝트 수: {project_count}")
        print(f"작업 수: {task_count}")

        return user_count, project_count, task_count

    async def test_count_subquery(self) -> List[Tuple[str, int]]:
        """서브쿼리를 사용한 카운트 테스트"""
        print("\n=== 8. 서브쿼리를 사용한 카운트 테스트 ===")

        # 각 프로젝트별 작업 수를 서브쿼리로 조회
        subquery = (
            select(Task.project_id, func.count(Task.id).label("task_count"))
            .group_by(Task.project_id)
            .subquery()
        )

        query = select(Project.name, subquery.c.task_count).join(
            subquery, Project.id == subquery.c.project_id
        )

        result = await self.session.execute(query)
        counts = result.all()

        print("프로젝트별 작업 수 (서브쿼리):")
        for name, count in counts:
            print(f"  {name}: {count}개")

        return counts

    async def test_conditional_count(self) -> Tuple[int, int]:
        """조건부 카운트 테스트"""
        print("\n=== 9. 조건부 카운트 테스트 ===")

        # CASE WHEN을 사용한 조건부 카운트
        from sqlalchemy import case

        query = select(
            func.sum(case((Task.status == "TODO", 1), else_=0)).label("todo_count"),
            func.sum(case((Task.status == "DONE", 1), else_=0)).label("done_count"),
        )

        result = await self.session.execute(query)
        row = result.first()

        todo_count = row.todo_count or 0
        done_count = row.done_count or 0

        print(f"TODO 작업 수: {todo_count}")
        print(f"DONE 작업 수: {done_count}")

        return todo_count, done_count

    async def test_count_with_date_filter(self) -> int:
        """날짜 필터를 사용한 카운트 테스트"""
        print("\n=== 10. 날짜 필터를 사용한 카운트 테스트 ===")

        # 최근 30일 내 생성된 작업 수
        from datetime import timedelta

        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)

        query = select(func.count(Task.id)).where(Task.created_at >= thirty_days_ago)
        result = await self.session.execute(query)
        count = result.scalar()

        print(f"최근 30일 내 생성된 작업 수: {count}")
        return count


class TestDataSeeder:
    """테스트 데이터 생성 클래스"""

    def __init__(self, async_session: AsyncSession):
        self.session = async_session

    async def create_test_data(self):
        """테스트 데이터 생성"""
        print("테스트 데이터 생성 중...")

        # 사용자 생성
        users = [
            User(name="김철수", email="kim@example.com"),
            User(name="이영희", email="lee@example.com"),
            User(name="박민수", email="park@example.com"),
            User(name="최영수", email="choi@example.com"),
        ]

        for user in users:
            self.session.add(user)

        await self.session.commit()

        # 프로젝트 생성
        projects = [
            Project(
                name="웹사이트 개발",
                description="회사 웹사이트 개발",
                owner_id=1,
            ),
            Project(name="모바일 앱", description="모바일 앱 개발", owner_id=1),
            Project(
                name="데이터 분석",
                description="데이터 분석 프로젝트",
                owner_id=2,
            ),
            Project(name="AI 챗봇", description="AI 챗봇 개발", owner_id=2),
            Project(name="보안 강화", description="시스템 보안 강화", owner_id=3),
        ]

        for project in projects:
            self.session.add(project)

        await self.session.commit()

        # 작업 생성
        tasks = [
            Task(
                title="UI 디자인",
                description="사용자 인터페이스 디자인",
                project_id=1,
                assignee_id=1,
                status="TODO",
            ),
            Task(
                title="백엔드 API",
                description="REST API 개발",
                project_id=1,
                assignee_id=2,
                status="IN_PROGRESS",
            ),
            Task(
                title="데이터베이스 설계",
                description="DB 스키마 설계",
                project_id=1,
                assignee_id=1,
                status="DONE",
            ),
            Task(
                title="앱 화면 설계",
                description="모바일 앱 화면 설계",
                project_id=2,
                assignee_id=2,
                status="TODO",
            ),
            Task(
                title="데이터 수집",
                description="분석용 데이터 수집",
                project_id=3,
                assignee_id=3,
                status="DONE",
            ),
            Task(
                title="모델 훈련",
                description="AI 모델 훈련",
                project_id=4,
                assignee_id=2,
                status="IN_PROGRESS",
            ),
            Task(
                title="보안 감사",
                description="시스템 보안 감사",
                project_id=5,
                assignee_id=3,
                status="TODO",
            ),
            Task(
                title="취약점 분석",
                description="보안 취약점 분석",
                project_id=5,
                status="TODO",
            ),  # assignee 없음
        ]

        for task in tasks:
            self.session.add(task)

        await self.session.commit()

        print("테스트 데이터 생성 완료!")


async def main():
    """메인 실행 함수"""
    # 데이터베이스 설정 (SQLite 메모리 DB 사용)
    DATABASE_URL = "sqlite+aiosqlite:///:memory:"

    # 비동기 엔진 생성
    engine = create_async_engine(DATABASE_URL, echo=False)

    # 테이블 생성
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 세션 팩토리 생성
    async_session_factory = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session_factory() as session:
        # 테스트 데이터 생성
        seeder = TestDataSeeder(session)
        await seeder.create_test_data()

        # func.count() 테스트 실행
        tester = FuncCountTests(session)

        print("\n" + "=" * 50)
        print("SQLAlchemy func.count() 테스트 시작")
        print("=" * 50)

        # 모든 테스트 실행
        await tester.test_basic_count()
        await tester.test_count_with_filter()
        await tester.test_count_with_join()
        await tester.test_count_with_left_join()
        await tester.test_count_distinct()
        await tester.test_count_with_having()
        await tester.test_multiple_counts()
        await tester.test_count_subquery()
        await tester.test_conditional_count()
        await tester.test_count_with_date_filter()

        print("\n" + "=" * 50)
        print("모든 테스트 완료!")
        print("=" * 50)


if __name__ == "__main__":
    # 실행
    asyncio.run(main())


# 추가: 실제 프로젝트에서 사용할 수 있는 유틸리티 함수들


class CountQueryBuilder:
    """카운트 쿼리 빌더 유틸리티"""

    @staticmethod
    def build_count_query(model, filters=None, joins=None):
        """동적 카운트 쿼리 빌드"""
        query = select(func.count(model.id))

        if joins:
            for join_model, condition in joins:
                query = query.join(join_model, condition)

        if filters:
            for filter_condition in filters:
                query = query.where(filter_condition)

        return query

    @staticmethod
    def build_group_count_query(model, group_by_columns, filters=None, having=None):
        """그룹별 카운트 쿼리 빌드"""
        query = select(*group_by_columns, func.count(model.id))

        if filters:
            for filter_condition in filters:
                query = query.where(filter_condition)

        query = query.group_by(*group_by_columns)

        if having:
            query = query.having(having)

        return query


# 사용 예제
async def example_usage():
    """유틸리티 함수 사용 예제"""
    # ... (세션 설정 생략)

    # 기본 카운트
    query = CountQueryBuilder.build_count_query(
        model=Task, filters=[Task.status == "TODO"]
    )

    # 그룹별 카운트
    query = CountQueryBuilder.build_group_count_query(
        model=Task,
        group_by_columns=[Task.status],
        having=func.count(Task.id) > 2,
    )
