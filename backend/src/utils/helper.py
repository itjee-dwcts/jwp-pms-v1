"""
Helper Functions

Common utility functions used across the application.
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
    """Generate a random string of specified length"""
    if use_alphanumeric:
        characters = string.ascii_letters + string.digits
    else:
        characters = string.ascii_letters + string.digits + string.punctuation

    return "".join(secrets.choice(characters) for _ in range(length))


def generate_uuid() -> str:
    """Generate a UUID-like string"""
    return str(uuid.uuid4())


def generate_secure_token(length: int = 32) -> str:
    """Generate a cryptographically secure token"""
    return secrets.token_urlsafe(length)


def generate_numeric_code(length: int = 6) -> str:
    """Generate a random numeric code"""
    return "".join(secrets.choice(string.digits) for _ in range(length))


def hash_string(text: str, algorithm: str = "sha256") -> str:
    """Hash a string using specified algorithm"""
    if algorithm == "md5":
        return hashlib.md5(text.encode()).hexdigest()
    elif algorithm == "sha1":
        return hashlib.sha1(text.encode()).hexdigest()
    elif algorithm == "sha256":
        return hashlib.sha256(text.encode()).hexdigest()
    elif algorithm == "sha512":
        return hashlib.sha512(text.encode()).hexdigest()
    else:
        raise ValueError(f"Unsupported algorithm: {algorithm}")


def slugify(text: str, max_length: int = 50) -> str:
    """Convert text to URL-friendly slug"""
    # Convert to lowercase
    text = text.lower()

    # Replace spaces and special characters with hyphens
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text)

    # Remove leading/trailing hyphens
    text = text.strip("-")

    # Truncate if necessary
    if len(text) > max_length:
        text = text[:max_length].rstrip("-")

    return text


def hash_file_content(content: bytes) -> str:
    """Generate SHA256 hash of file content"""
    return hashlib.sha256(content).hexdigest()


def validate_email(email: str) -> bool:
    """Validate email address format"""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


def validate_username(username: str) -> Dict[str, Union[bool, str]]:
    """Validate username format and return validation result"""
    result = {"is_valid": True, "message": "Username is valid"}

    if len(username) < 3:
        result["is_valid"] = False
        result["message"] = "Username must be at least 3 characters long"
    elif len(username) > 50:
        result["is_valid"] = False
        result["message"] = "Username must not exceed 50 characters"
    elif not re.match(r"^[a-zA-Z0-9_]+$", username):
        result["is_valid"] = False
        result["message"] = (
            "Username can only contain letters, numbers, and underscores"
        )
    elif username.startswith("_") or username.endswith("_"):
        result["is_valid"] = False
        result["message"] = "Username cannot start or end with underscore"
    elif "__" in username:
        result["is_valid"] = False
        result["message"] = "Username cannot contain consecutive underscores"

    return result


def validate_phone(phone: str) -> bool:
    """Validate phone number format"""
    # Remove all non-digit characters
    digits_only = re.sub(r"\D", "", phone)

    # Check if it's a valid length (7-15 digits)
    return 7 <= len(digits_only) <= 15


def validate_url(url: str) -> bool:
    """Validate URL format"""
    pattern = (
        r"^https?://(?:[-\w.])+"
        r"(?:\:[0-9]+)?"
        r"(?:/(?:[\w/_.])*"
        r"(?:\?(?:[\w&=%.])*)?"
        r"(?:\#(?:[\w.])*)?)?$"
    )
    return re.match(pattern, url) is not None


def sanitize_filename(filename: str) -> str:
    """Sanitize filename by removing/replacing invalid characters"""
    # Remove path separators and other dangerous characters
    filename = re.sub(r'[<>:"/\\|?*]', "_", filename)

    # Remove control characters
    filename = "".join(char for char in filename if ord(char) >= 32)

    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit(".", 1) if "." in filename else (filename, "")
        max_name_length = 255 - len(ext) - 1 if ext else 255
        filename = name[:max_name_length] + ("." + ext if ext else "")

    return filename.strip()


def get_file_extension(filename: str) -> str:
    """Get file extension from filename"""
    return Path(filename).suffix.lower()


def is_allowed_file_type(filename: str, allowed_extensions: List[str]) -> bool:
    """Check if file type is allowed"""
    extension = get_file_extension(filename)
    return extension in [ext.lower() for ext in allowed_extensions]


def format_file_size(size_bytes: int) -> str:
    """Format file size in human-readable format"""
    if size_bytes == 0:
        return "0 B"

    size_names = ["B", "KB", "MB", "GB", "TB", "PB"]

    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_names[i]}"


def parse_file_size(size_str: str) -> int:
    """Parse file size string to bytes"""
    size_str = size_str.upper().strip()

    units = {
        "B": 1,
        "KB": 1024,
        "MB": 1024**2,
        "GB": 1024**3,
        "TB": 1024**4,
        "PB": 1024**5,
    }

    # Extract number and unit
    match = re.match(r"^(\d+(?:\.\d+)?)\s*([A-Z]+)$", size_str)
    if not match:
        raise ValueError(f"Invalid file size format: {size_str}")

    number, unit = match.groups()

    if unit not in units:
        raise ValueError(f"Unknown file size unit: {unit}")

    return int(float(number) * units[unit])


async def save_upload_file(
    upload_file: UploadFile, destination_path: Path
) -> Dict[str, Any]:
    """Save uploaded file to destination path"""
    try:
        # Ensure destination directory exists
        destination_path.parent.mkdir(parents=True, exist_ok=True)

        # Read file content
        content = await upload_file.read()

        # Save file
        async with aiofiles.open(destination_path, "wb") as f:
            await f.write(content)

        # Calculate file hash and size
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
        raise OSError(f"Failed to save file: {e}") from e


def calculate_pagination(
    total_items: int, page_no: int, page_size: int
) -> Dict[str, int]:
    """Calculate pagination metadata"""
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
    """Parse sort parameter string into list of sort criteria"""
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
    """Parse filter parameter string into list of filter criteria"""
    if not filter_param:
        return []

    filters = []

    # Simple format: field:operator:value,field2:operator2:value2
    for filter_str in filter_param.split(","):
        filter_str = filter_str.strip()
        if not filter_str:
            continue

        parts = filter_str.split(":", 2)
        if len(parts) == 3:
            field, operator, value = parts

            # Try to convert value to appropriate type
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
    """Format datetime to string"""
    return dt.strftime(format_str)


def parse_datetime(dt_str: str, format_str: str = "%Y-%m-%d %H:%M:%S") -> datetime:
    """Parse datetime string to datetime object"""
    return datetime.strptime(dt_str, format_str)


def time_ago(dt: datetime) -> str:
    """Get human-readable time ago string"""
    now = datetime.utcnow()
    diff = now - dt

    seconds = diff.total_seconds()

    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        minutes = int(seconds // 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    elif seconds < 86400:
        hours = int(seconds // 3600)
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif seconds < 604800:
        days = int(seconds // 86400)
        return f"{days} day{'s' if days != 1 else ''} ago"
    elif seconds < 2629746:  # ~30.44 days
        weeks = int(seconds // 604800)
        return f"{weeks} week{'s' if weeks != 1 else ''} ago"
    elif seconds < 31556952:  # ~365.24 days
        months = int(seconds // 2629746)
        return f"{months} month{'s' if months != 1 else ''} ago"
    else:
        years = int(seconds // 31556952)
        return f"{years} year{'s' if years != 1 else ''} ago"


def get_age_from_date(birth_date: Union[datetime, date]) -> int:
    """Calculate age from birth date"""
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
    """Mask sensitive data like emails, phone numbers"""
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
    """Truncate text to specified length"""
    if len(text) <= max_length:
        return text

    return text[: max_length - len(suffix)] + suffix


def clean_html(html_text: str) -> str:
    """Remove HTML tags from text"""

    clean = re.compile("<.*?>")
    return re.sub(clean, "", html_text)


def extract_mentions(text: str) -> List[str]:
    """Extract @mentions from text"""
    return re.findall(r"@(\w+)", text)


def extract_hashtags(text: str) -> List[str]:
    """Extract #hashtags from text"""
    return re.findall(r"#(\w+)", text)


def generate_color_from_string(text: str) -> str:
    """Generate a consistent color hex code from string"""
    # Create hash from string
    hash_object = hashlib.md5(text.encode())
    hex_hash = hash_object.hexdigest()

    # Take first 6 characters for RGB
    return f"#{hex_hash[:6]}"


def url_encode(text: str) -> str:
    """URL encode text"""
    return quote(text)


def url_decode(text: str) -> str:
    """URL decode text"""
    return unquote(text)


def deep_merge_dicts(dict1: Dict[str, Any], dict2: Dict[str, Any]) -> Dict[str, Any]:
    """Deep merge two dictionaries"""
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
    """Flatten nested dictionary"""
    items = []
    for k, v in d.items():
        # Ensure key is str
        if isinstance(k, bytes):
            k = k.decode("utf-8")
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)


def chunk_list(lst: List[Any], chunk_size: int) -> List[List[Any]]:
    """Split list into chunks of specified size"""
    return [lst[i + chunk_size] for i in range(0, len(lst), chunk_size)]


def remove_duplicates(lst: List[Any], key: Optional[str] = None) -> List[Any]:
    """Remove duplicates from list, optionally using a key function"""
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
    """Safely cast value to target type, return default if casting fails"""
    try:
        return target_type(value)
    except (ValueError, TypeError):
        return default


def is_valid_url(url: str) -> bool:
    """Check if string is a valid URL"""
    url_pattern = re.compile(
        r"^https?://"  # http:// or https://
        r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"
        r"localhost|"  # localhost...
        r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"  # ...or ip
        r"(?::\d+)?"  # optional port
        r"(?:/?|[/?]\S+)?",  # path
        re.IGNORECASE,
    )

    return bool(url_pattern.match(url))


def generate_pagination_info(
    total_items: int, page_no: int, page_size: int
) -> Dict[str, Any]:
    """Generate pagination information"""
    total_pages = (total_items + page_size - 1) // page_size  # Ceiling division

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
    """Build URL with path and query parameters"""

    url = urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))

    if params:
        # Filter out None values
        filtered_params = {k: v for k, v in params.items() if v is not None}
        if filtered_params:
            url += "?" + urlencode(filtered_params)

    return url


def parse_comma_separated(value: str) -> List[str]:
    """Parse comma-separated string into list"""
    if not value:
        return []

    return [item.strip() for item in value.split(",") if item.strip()]


def to_camel_case(snake_str: str) -> str:
    """Convert snake_case to camelCase"""
    components = snake_str.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


def to_snake_case(camel_str: str) -> str:
    """Convert camelCase to snake_case"""
    s1 = re.sub("(.)([A-Z][a-z]+)", r"\1_\2", camel_str)
    return re.sub("([a-z0-9])([A-Z])", r"\1_\2", s1).lower()


def calculate_password_strength(
    password: str,
) -> Dict[str, Union[int, str, bool, List[str]]]:
    """Calculate password strength score and feedback"""
    score = 0
    feedback = []

    # Length check
    if len(password) >= 8:
        score += 1
    else:
        feedback.append("Use at least 8 characters")

    if len(password) >= 12:
        score += 1

    # Character variety checks
    if re.search(r"[a-z]", password):
        score += 1
    else:
        feedback.append("Include lowercase letters")

    if re.search(r"[A-Z]", password):
        score += 1
    else:
        feedback.append("Include uppercase letters")

    if re.search(r"\d", password):
        score += 1
    else:
        feedback.append("Include numbers")

    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        score += 1
    else:
        feedback.append("Include special characters")

    # Common patterns check
    if not re.search(r"(.)\1{2,}", password):  # No repeating characters
        score += 1
    else:
        feedback.append("Avoid repeating characters")

    # Determine strength level
    if score <= 2:
        strength = "weak"
    elif score <= 4:
        strength = "medium"
    elif score <= 6:
        strength = "strong"
    else:
        strength = "very_strong"

    return {
        "score": score,
        "max_score": 7,
        "strength": strength,
        "is_strong": score >= 5,
        "feedback": feedback,
    }


class RateLimitTracker:
    """Simple in-memory rate limit tracker"""

    def __init__(self):
        self.requests = {}

    def is_allowed(self, key: str, limit: int, window: int) -> bool:
        """Check if request is allowed within rate limit"""

        now = time.time()

        if key not in self.requests:
            self.requests[key] = []

        # Remove old requests outside the window
        self.requests[key] = [
            req_time for req_time in self.requests[key] if now - req_time < window
        ]

        # Check if limit exceeded
        if len(self.requests[key]) >= limit:
            return False

        # Add current request
        self.requests[key].append(now)
        return True

    def get_remaining(self, key: str, limit: int, window: int) -> int:
        """Get remaining requests in current window"""

        now = time.time()

        if key not in self.requests:
            return limit

        # Count requests in current window
        current_requests = [
            req_time for req_time in self.requests[key] if now - req_time < window
        ]

        return max(0, limit - len(current_requests))


# Global rate limit tracker instance
rate_tracker = RateLimitTracker()
