"""
Database Base Model

SQLAlchemy declarative base for all models.
"""

from sqlalchemy import MetaData
from sqlalchemy.ext.declarative import declarative_base

# Naming convention for constraints
naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "ux": "ux_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

# Create declarative base
Base = declarative_base()
Base.metadata = MetaData(naming_convention=naming_convention)
