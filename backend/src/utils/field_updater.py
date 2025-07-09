"""
필드 업데이터 함수들
"""

from typing import Optional


class SafeFieldUpdater:
    """
    안전한 필드 업데이터
    """

    def __init__(self, target_object):
        self.target = target_object
        self.updated_fields = []

    def update_string_field(
        self, field_name: str, new_value: Optional[str], max_length: int = 500
    ) -> bool:
        """
        문자열 필드 업데이트
        """
        if new_value is None or not hasattr(self.target, field_name):
            return False

        if not isinstance(new_value, str) or len(new_value) > max_length:
            return False

        if getattr(self.target, field_name) != new_value:
            setattr(self.target, field_name, new_value)
            self.updated_fields.append(field_name)
            return True
        return False

    def update_int_field(
        self,
        field_name: str,
        new_value: Optional[int],
        min_val: int = 0,
        max_val: int = 1000,
    ) -> bool:
        """
        정수 필드 업데이트
        """
        if new_value is None or not hasattr(self.target, field_name):
            return False

        if not isinstance(new_value, int) or not (min_val <= new_value <= max_val):
            return False

        if getattr(self.target, field_name) != new_value:
            setattr(self.target, field_name, new_value)
            self.updated_fields.append(field_name)
            return True
        return False

    def update_enum_field(
        self, field_name: str, new_value: Optional[str], valid_values: list
    ) -> bool:
        """
        열거형 필드 업데이트
        """
        if new_value is None or not hasattr(self.target, field_name):
            return False

        if not isinstance(new_value, str) or new_value not in valid_values:
            return False

        if getattr(self.target, field_name) != new_value:
            setattr(self.target, field_name, new_value)
            self.updated_fields.append(field_name)
            return True
        return False

    def update_boolean_field(self, field_name: str, new_value: Optional[bool]) -> bool:
        """
        불린 필드 업데이트
        """
        if new_value is None or not hasattr(self.target, field_name):
            return False

        if not isinstance(new_value, bool):
            return False

        if getattr(self.target, field_name) != new_value:
            setattr(self.target, field_name, new_value)
            self.updated_fields.append(field_name)
            return True
        return False

    def update_float_field(
        self,
        field_name: str,
        new_value: Optional[float],
        min_val: float = 0.0,
        max_val: float = 1000.0,
    ) -> bool:
        """
        실수 필드 업데이트
        """
        if new_value is None or not hasattr(self.target, field_name):
            return False

        if not isinstance(new_value, (float, int)) or not (
            min_val <= new_value <= max_val
        ):
            return False

        if getattr(self.target, field_name) != new_value:
            setattr(self.target, field_name, new_value)
            self.updated_fields.append(field_name)
            return True
        return False

    def get_updated_fields(self) -> list:
        """
        업데이트된 필드 목록 반환
        """
        return self.updated_fields.copy()

    def has_updates(self) -> bool:
        """
        업데이트된 필드가 있는지 확인
        """
        return len(self.updated_fields) > 0

    def clear_updates(self) -> None:
        """
        업데이트된 필드 목록 초기화
        """
        self.updated_fields.clear()
