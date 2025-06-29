import subprocess
import sys

print("=== SQLAlchemy 진단 ===")
print(f"Python 경로: {sys.executable}")
print(f"Python 버전: {sys.version}")

# 설치된 패키지 확인
try:
    result = subprocess.run(
        [sys.executable, "-m", "pip", "show", "sqlalchemy"],
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        print("✅ SQLAlchemy 설치됨:")
        print(result.stdout)
    else:
        print("❌ SQLAlchemy 설치되지 않음")
except Exception as e:
    print(f"❌ 패키지 확인 오류: {e}")

# Import 테스트
tests = [
    "import sqlalchemy",
    "import sqlalchemy.ext",
    "import sqlalchemy.ext.asyncio",
    "from sqlalchemy.ext.asyncio import AsyncSession",
]

for test in tests:
    try:
        exec(test)
        print(f"✅ {test}")
    except Exception as e:
        print(f"❌ {test}: {e}")
