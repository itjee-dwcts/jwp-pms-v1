"""
데이터베이스 기본 모델

모든 모델을 위한 SQLAlchemy 선언적 기본 클래스입니다.
"""

from sqlalchemy import MetaData
from sqlalchemy.ext.declarative import declarative_base

# 제약 조건을 위한 명명 규칙
naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "ux": "ux_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

# 선언적 기본 클래스 생성
Base = declarative_base()
Base.metadata = MetaData(naming_convention=naming_convention)
