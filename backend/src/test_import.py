# test_import.py 파일 생성
try:
    from sqlalchemy.ext.asyncio import AsyncSession

    print("✅ Import 성공! 실제로는 문제없습니다.")
except ImportError as e:
    print(f"❌ 실제 Import 오류: {e}")
