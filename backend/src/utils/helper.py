"""
도우미 함수들

애플리케이션 전반에서 사용되는 공통 유틸리티 함수들입니다.
"""

import hashlib
import math
import re
import secrets
import string
import time
import uuid
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from urllib.parse import quote, unquote, urlencode, urljoin

import aiofiles
from fastapi import UploadFile


def generate_random_string(length: int = 32, use_alphanumeric: bool = True) -> str:
    """지정된 길이의 무작위 문자열 생성"""
    if use_alphanumeric:
        characters = string.ascii_letters + string.digits
    else:
        characters = string.ascii_letters + string.digits + string.punctuation

    return "".join(secrets.choice(characters) for _ in range(length))


def generate_uuid() -> str:
    """UUID 형태의 문자열 생성"""
    return str(uuid.uuid4())


def generate_secure_token(length: int = 32) -> str:
    """암호학적으로 안전한 토큰 생성"""
    return secrets.token_urlsafe(length)


def generate_numeric_code(length: int = 6) -> str:
    """무작위 숫자 코드 생성"""
    return "".join(secrets.choice(string.digits) for _ in range(length))


def hash_string(text: str, algorithm: str = "sha256") -> str:
    """지정된 알고리즘을 사용하여 문자열 해시화"""
    if algorithm == "md5":
        return hashlib.md5(text.encode()).hexdigest()
    elif algorithm == "sha1":
        return hashlib.sha1(text.encode()).hexdigest()
    elif algorithm == "sha256":
        return hashlib.sha256(text.encode()).hexdigest()
    elif algorithm == "sha512":
        return hashlib.sha512(text.encode()).hexdigest()
    else:
        raise ValueError(f"지원하지 않는 알고리즘: {algorithm}")


def slugify(text: str, max_length: int = 50) -> str:
    """텍스트를 URL 친화적인 슬러그로 변환"""
    # 소문자로 변환
    text = text.lower()

    # 공백과 특수문자를 하이픈으로 치환
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text)

    # 앞뒤 하이픈 제거
    text = text.strip("-")

    # 필요시 길이 제한
    if len(text) > max_length:
        text = text[:max_length].rstrip("-")

    return text


def hash_file_content(content: bytes) -> str:
    """파일 내용의 SHA256 해시 생성"""
    return hashlib.sha256(content).hexdigest()


def validate_email(email: str) -> bool:
    """이메일 주소 형식 검증"""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


def validate_username(username: str) -> Dict[str, Union[bool, str]]:
    """사용자명 형식 검증 및 검증 결과 반환"""
    result = {"is_valid": True, "message": "사용자명이 유효합니다"}

    if len(username) < 3:
        result["is_valid"] = False
        result["message"] = "사용자명은 최소 3자 이상이어야 합니다"
    elif len(username) > 50:
        result["is_valid"] = False
        result["message"] = "사용자명은 50자를 초과할 수 없습니다"
    elif not re.match(r"^[a-zA-Z0-9_]+$", username):
        result["is_valid"] = False
        result["message"] = "사용자명은 문자, 숫자, 밑줄만 포함할 수 있습니다"
    elif username.startswith("_") or username.endswith("_"):
        result["is_valid"] = False
        result["message"] = "사용자명은 밑줄로 시작하거나 끝날 수 없습니다"
    elif "__" in username:
        result["is_valid"] = False
        result["message"] = "사용자명은 연속된 밑줄을 포함할 수 없습니다"

    return result


def validate_phone(phone: str) -> bool:
    """전화번호 형식 검증"""
    # 숫자가 아닌 모든 문자 제거
    digits_only = re.sub(r"\D", "", phone)

    # 유효한 길이인지 확인 (7-15자리)
    return 7 <= len(digits_only) <= 15


def validate_url(url: str) -> bool:
    """URL 형식 검증"""
    pattern = (
        r"^https?://(?:[-\w.])+"
        r"(?:\:[0-9]+)?"
        r"(?:/(?:[\w/_.])*"
        r"(?:\?(?:[\w&=%.])*)?"
        r"(?:\#(?:[\w.])*)?)?$"
    )
    return re.match(pattern, url) is not None


def sanitize_filename(filename: str) -> str:
    """유효하지 않은 문자를 제거/치환하여 파일명 정리"""
    # 경로 구분자 및 기타 위험한 문자 제거
    filename = re.sub(r'[<>:"/\\|?*]', "_", filename)

    # 제어 문자 제거
    filename = "".join(char for char in filename if ord(char) >= 32)

    # 길이 제한
    if len(filename) > 255:
        name, ext = filename.rsplit(".", 1) if "." in filename else (filename, "")
        max_name_length = 255 - len(ext) - 1 if ext else 255
        filename = name[:max_name_length] + ("." + ext if ext else "")

    return filename.strip()


def get_file_extension(filename: str) -> str:
    """파일명에서 확장자 추출"""
    return Path(filename).suffix.lower()


def is_allowed_file_type(filename: str, allowed_extensions: List[str]) -> bool:
    """파일 형식이 허용되는지 확인"""
    extension = get_file_extension(filename)
    return extension in [ext.lower() for ext in allowed_extensions]


def format_file_size(size_bytes: int) -> str:
    """사람이 읽기 쉬운 형식으로 파일 크기 포맷"""
    if size_bytes == 0:
        return "0 B"

    size_names = ["B", "KB", "MB", "GB", "TB", "PB"]

    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_names[i]}"


def parse_file_size(size_str: str) -> int:
    """파일 크기 문자열을 바이트로 파싱"""
    size_str = size_str.upper().strip()

    units = {
        "B": 1,
        "KB": 1024,
        "MB": 1024**2,
        "GB": 1024**3,
        "TB": 1024**4,
        "PB": 1024**5,
    }

    # 숫자와 단위 추출
    match = re.match(r"^(\d+(?:\.\d+)?)\s*([A-Z]+)$", size_str)
    if not match:
        raise ValueError(f"잘못된 파일 크기 형식: {size_str}")

    number, unit = match.groups()

    if unit not in units:
        raise ValueError(f"알 수 없는 파일 크기 단위: {unit}")

    return int(float(number) * units[unit])


async def save_upload_file(
    upload_file: UploadFile, destination_path: Path
) -> Dict[str, Any]:
    """업로드된 파일을 대상 경로에 저장"""
    try:
        # 대상 디렉토리가 존재하는지 확인
        destination_path.parent.mkdir(parents=True, exist_ok=True)

        # 파일 내용 읽기
        content = await upload_file.read()

        # 파일 저장
        async with aiofiles.open(destination_path, "wb") as f:
            await f.write(content)

        # 파일 해시 및 크기 계산
        file_hash = hash_file_content(content)
        file_size = len(content)

        return {
            "filename": upload_file.filename,
            "saved_path": str(destination_path),
            "file_size": file_size,
            "file_hash": file_hash,
            "content_type": upload_file.content_type,
        }

    except Exception as e:
        raise OSError(f"파일 저장에 실패했습니다: {e}") from e


def calculate_pagination(
    total_items: int, page_no: int, page_size: int
) -> Dict[str, int]:
    """페이지네이션 메타데이터 계산"""
    total_pages = (total_items + page_size - 1) // page_size if total_items > 0 else 0

    return {
        "total_items": total_items,
        "page_no": page_no,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": page_no < total_pages,
        "has_prev": page_no > 1,
    }


def parse_sort_params(sort_param: Optional[str]) -> List[Dict[str, str]]:
    """정렬 매개변수 문자열을 정렬 기준 목록으로 파싱"""
    if not sort_param:
        return []

    sort_criteria = []

    for criterion in sort_param.split(","):
        criterion = criterion.strip()
        if not criterion:
            continue

        if criterion.startswith("-"):
            field = criterion[1:]
            order = "desc"
        else:
            field = criterion
            order = "asc"

        sort_criteria.append({"field": field, "order": order})

    return sort_criteria


def parse_filter_params(filter_param: Optional[str]) -> List[Dict[str, Any]]:
    """필터 매개변수 문자열을 필터 기준 목록으로 파싱"""
    if not filter_param:
        return []

    filters = []

    # 간단한 형식: field:operator:value,field2:operator2:value2
    for filter_str in filter_param.split(","):
        filter_str = filter_str.strip()
        if not filter_str:
            continue

        parts = filter_str.split(":", 2)
        if len(parts) == 3:
            field, operator, value = parts

            # 값을 적절한 타입으로 변환 시도
            if value.lower() == "true":
                value = True
            elif value.lower() == "false":
                value = False
            elif value.isdigit():
                value = int(value)
            elif "." in value and value.replace(".", "").isdigit():
                value = float(value)

            filters.append({"field": field, "operator": operator, "value": value})

    return filters


def format_datetime(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """날짜시간을 문자열로 포맷"""
    return dt.strftime(format_str)


def parse_datetime(dt_str: str, format_str: str = "%Y-%m-%d %H:%M:%S") -> datetime:
    """날짜시간 문자열을 datetime 객체로 파싱"""
    return datetime.strptime(dt_str, format_str)


def time_ago(dt: datetime) -> str:
    """사람이 읽기 쉬운 경과 시간 문자열 반환"""
    now = datetime.utcnow()
    diff = now - dt

    seconds = diff.total_seconds()

    if seconds < 60:
        return "방금 전"
    elif seconds < 3600:
        minutes = int(seconds // 60)
        return f"{minutes}분 전"
    elif seconds < 86400:
        hours = int(seconds // 3600)
        return f"{hours}시간 전"
    elif seconds < 604800:
        days = int(seconds // 86400)
        return f"{days}일 전"
    elif seconds < 2629746:  # ~30.44일
        weeks = int(seconds // 604800)
        return f"{weeks}주 전"
    elif seconds < 31556952:  # ~365.24일
        months = int(seconds // 2629746)
        return f"{months}개월 전"
    else:
        years = int(seconds // 31556952)
        return f"{years}년 전"


def get_age_from_date(birth_date: Union[datetime, date]) -> int:
    """생년월일로부터 나이 계산"""
    today = datetime.now().date()
    if isinstance(birth_date, datetime):
        birth_date = birth_date.date()

    age = today.year - birth_date.year

    if today.month < birth_date.month or (
        today.month == birth_date.month and today.day < birth_date.day
    ):
        age -= 1

    return age


def mask_sensitive_data(data: str, mask_char: str = "*", visible_chars: int = 4) -> str:
    """이메일, 전화번호 등 민감한 데이터 마스킹"""
    if len(data) <= visible_chars:
        return mask_char * len(data)

    visible_start = visible_chars // 2
    visible_end = visible_chars - visible_start

    masked_part = mask_char * (len(data) - visible_chars)

    return (
        data[:visible_start] + masked_part + data[-visible_end:]
        if visible_end > 0
        else data[:visible_start] + masked_part
    )


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """지정된 길이로 텍스트 자르기"""
    if len(text) <= max_length:
        return text

    return text[: max_length - len(suffix)] + suffix


def clean_html(html_text: str) -> str:
    """텍스트에서 HTML 태그 제거"""
    clean = re.compile("<.*?>")
    return re.sub(clean, "", html_text)


def extract_mentions(text: str) -> List[str]:
    """텍스트에서 @멘션 추출"""
    return re.findall(r"@(\w+)", text)


def extract_hashtags(text: str) -> List[str]:
    """텍스트에서 #해시태그 추출"""
    return re.findall(r"#(\w+)", text)


def generate_color_from_string(text: str) -> str:
    """문자열로부터 일관된 색상 16진수 코드 생성"""
    # 문자열로부터 해시 생성
    hash_object = hashlib.md5(text.encode())
    hex_hash = hash_object.hexdigest()

    # RGB를 위해 처음 6자리 사용
    return f"#{hex_hash[:6]}"


def url_encode(text: str) -> str:
    """텍스트 URL 인코딩"""
    return quote(text)


def url_decode(text: str) -> str:
    """텍스트 URL 디코딩"""
    return unquote(text)


def deep_merge_dicts(dict1: Dict[str, Any], dict2: Dict[str, Any]) -> Dict[str, Any]:
    """두 딕셔너리를 깊게 병합"""
    result = dict1.copy()

    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge_dicts(result[key], value)
        else:
            result[key] = value

    return result


def flatten_dict(
    d: Dict[str, Any], parent_key: str = "", sep: str = "."
) -> Dict[str, Any]:
    """중첩된 딕셔너리 평면화"""
    items = []
    for k, v in d.items():
        # 키가 문자열인지 확인
        if isinstance(k, bytes):
            k = k.decode("utf-8")
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)


def chunk_list(lst: List[Any], chunk_size: int) -> List[List[Any]]:
    """리스트를 지정된 크기의 청크로 분할"""
    return [lst[i : i + chunk_size] for i in range(0, len(lst), chunk_size)]


def remove_duplicates(lst: List[Any], key: Optional[str] = None) -> List[Any]:
    """리스트에서 중복 제거, 선택적으로 키 함수 사용"""
    if key:
        seen = set()
        result = []
        for item in lst:
            item_key = getattr(item, key) if hasattr(item, key) else item.get(key)
            if item_key not in seen:
                seen.add(item_key)
                result.append(item)
        return result
    else:
        return list(dict.fromkeys(lst))


def safe_cast(value: Any, target_type: type, default: Any = None) -> Any:
    """값을 대상 타입으로 안전하게 캐스팅, 실패시 기본값 반환"""
    try:
        return target_type(value)
    except (ValueError, TypeError):
        return default


def is_valid_url(url: str) -> bool:
    """문자열이 유효한 URL인지 확인"""
    url_pattern = re.compile(
        r"^https?://"  # http:// 또는 https://
        r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"
        r"localhost|"  # localhost...
        r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"  # ...또는 ip
        r"(?::\d+)?"  # 선택적 포트
        r"(?:/?|[/?]\S+)?",  # 경로
        re.IGNORECASE,
    )

    return bool(url_pattern.match(url))


def generate_pagination_info(
    total_items: int, page_no: int, page_size: int
) -> Dict[str, Any]:
    """페이지네이션 정보 생성"""
    total_pages = (total_items + page_size - 1) // page_size  # 올림 나눗셈

    return {
        "total_items": total_items,
        "page_no": page_no,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": page_no < total_pages,
        "has_prev": page_no > 1,
        "next_page": page_no + 1 if page_no < total_pages else None,
        "prev_page": page_no - 1 if page_no > 1 else None,
    }


def build_url(base_url: str, path: str, params: Optional[Dict[str, Any]] = None) -> str:
    """경로와 쿼리 매개변수로 URL 구성"""
    url = urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))

    if params:
        # None 값 필터링
        filtered_params = {k: v for k, v in params.items() if v is not None}
        if filtered_params:
            url += "?" + urlencode(filtered_params)

    return url


def parse_comma_separated(value: str) -> List[str]:
    """쉼표로 구분된 문자열을 리스트로 파싱"""
    if not value:
        return []

    return [item.strip() for item in value.split(",") if item.strip()]


def to_camel_case(snake_str: str) -> str:
    """snake_case를 camelCase로 변환"""
    components = snake_str.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


def to_snake_case(camel_str: str) -> str:
    """camelCase를 snake_case로 변환"""
    s1 = re.sub("(.)([A-Z][a-z]+)", r"\1_\2", camel_str)
    return re.sub("([a-z0-9])([A-Z])", r"\1_\2", s1).lower()


def calculate_password_strength(
    password: str,
) -> Dict[str, Union[int, str, bool, List[str]]]:
    """비밀번호 강도 점수 및 피드백 계산"""
    score = 0
    feedback = []

    # 길이 확인
    if len(password) >= 8:
        score += 1
    else:
        feedback.append("최소 8자 이상 사용하세요")

    if len(password) >= 12:
        score += 1

    # 문자 다양성 확인
    if re.search(r"[a-z]", password):
        score += 1
    else:
        feedback.append("소문자를 포함하세요")

    if re.search(r"[A-Z]", password):
        score += 1
    else:
        feedback.append("대문자를 포함하세요")

    if re.search(r"\d", password):
        score += 1
    else:
        feedback.append("숫자를 포함하세요")

    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        score += 1
    else:
        feedback.append("특수문자를 포함하세요")

    # 일반적인 패턴 확인
    if not re.search(r"(.)\1{2,}", password):  # 반복 문자 없음
        score += 1
    else:
        feedback.append("반복되는 문자를 피하세요")

    # 강도 수준 결정
    if score <= 2:
        strength = "약함"
    elif score <= 4:
        strength = "보통"
    elif score <= 6:
        strength = "강함"
    else:
        strength = "매우 강함"

    return {
        "score": score,
        "max_score": 7,
        "strength": strength,
        "is_strong": score >= 5,
        "feedback": feedback,
    }


class RateLimitTracker:
    """간단한 메모리 내 속도 제한 추적기"""

    def __init__(self):
        self.requests = {}

    def is_allowed(self, key: str, limit: int, window: int) -> bool:
        """요청이 속도 제한 내에서 허용되는지 확인"""
        now = time.time()

        if key not in self.requests:
            self.requests[key] = []

        # 윈도우 밖의 오래된 요청 제거
        self.requests[key] = [
            req_time for req_time in self.requests[key] if now - req_time < window
        ]

        # 제한 초과 여부 확인
        if len(self.requests[key]) >= limit:
            return False

        # 현재 요청 추가
        self.requests[key].append(now)
        return True

    def get_remaining(self, key: str, limit: int, window: int) -> int:
        """현재 윈도우에서 남은 요청 수 반환"""
        now = time.time()

        if key not in self.requests:
            return limit

        # 현재 윈도우의 요청 수 계산
        current_requests = [
            req_time for req_time in self.requests[key] if now - req_time < window
        ]

        return max(0, limit - len(current_requests))


# 전역 속도 제한 추적기 인스턴스
rate_tracker = RateLimitTracker()
