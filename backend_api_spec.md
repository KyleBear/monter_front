# 백엔드 API 스펙 - 계정 관리

## 1. 계정 목록 조회 (GET /accounts)

### 요청
- **Method**: GET
- **URL**: `/accounts`
- **Headers**:
  - `Authorization: Bearer {token}` (필수)
  - `Content-Type: application/json`

### 쿼리 파라미터
- `username` (optional): 아이디로 검색
- `keyword` (optional): 전체 검색 (아이디, 소속, 메모)
- `affiliation` (optional): 소속으로 검색
- `memo` (optional): 메모로 검색

### 권한 기반 조회 로직

#### Admin (관리자)
- 모든 계정 조회 가능

#### Total (총판사)
- 자신 아래의 대행사, 광고주만 조회
- 같은 총판사끼리는 서로 조회 불가
- 조회 조건:
  ```sql
  WHERE (parent_user_id = current_user_id 
         OR parent_user_id IN (
             SELECT user_id FROM users 
             WHERE parent_user_id = current_user_id
         ))
  AND role != 'total'  -- 같은 총판사 제외
  ```

#### Agency (대행사)
- 자신의 광고주만 조회
- 같은 대행사끼리는 서로 조회 불가
- 조회 조건:
  ```sql
  WHERE parent_user_id = current_user_id 
  AND role = 'advertiser'
  ```

#### Advertiser (광고주)
- 자신의 계정만 조회
- 조회 조건:
  ```sql
  WHERE user_id = current_user_id
  ```

### 응답
```json
{
  "accounts": [
    {
      "user_id": 1,
      "username": "user001",
      "role": "advertiser",
      "affiliation": "본사",
      "ad_count": 10,
      "active_ad_count": 5,
      "memo": "-",
      "parent_user_id": 2
    }
  ],
  "stats": {
    "total": 10,
    "distributor": 1,
    "agency": 3,
    "advertiser": 6
  }
}
```

### FastAPI 구현 예시

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from typing import Optional

router = APIRouter(prefix="/accounts", tags=["accounts"])

@router.get("")
async def get_accounts(
    username: Optional[str] = None,
    keyword: Optional[str] = None,
    affiliation: Optional[str] = None,
    memo: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 권한에 따른 조회 범위 결정
    if current_user.role == "admin":
        # admin: 모든 계정 조회
        base_query = select(User)
    elif current_user.role == "total":  # 총판사
        # 자신 아래의 대행사, 광고주만 조회
        # 직접 하위 (대행사)
        direct_subquery = select(User.user_id).where(
            User.parent_user_id == current_user.user_id
        )
        # 간접 하위 (대행사의 광고주)
        base_query = select(User).where(
            or_(
                User.parent_user_id == current_user.user_id,  # 직접 하위
                User.parent_user_id.in_(direct_subquery)  # 간접 하위
            ),
            User.role != "total"  # 같은 총판사 제외
        )
    elif current_user.role == "agency":  # 대행사
        # 자신의 광고주만 조회
        base_query = select(User).where(
            User.parent_user_id == current_user.user_id,
            User.role == "advertiser"
        )
    elif current_user.role == "advertiser":  # 광고주
        # 자신의 계정만 조회
        base_query = select(User).where(
            User.user_id == current_user.user_id
        )
    else:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    
    # 검색 조건 추가
    if username:
        base_query = base_query.where(User.username.like(f"%{username}%"))
    if keyword:
        base_query = base_query.where(
            or_(
                User.username.like(f"%{keyword}%"),
                User.affiliation.like(f"%{keyword}%"),
                User.memo.like(f"%{keyword}%")
            )
        )
    if affiliation:
        base_query = base_query.where(User.affiliation.like(f"%{affiliation}%"))
    if memo:
        base_query = base_query.where(User.memo.like(f"%{memo}%"))
    
    # 실행
    result = await db.execute(base_query)
    accounts = result.scalars().all()
    
    # 통계 계산
    stats = {
        "total": len(accounts),
        "distributor": sum(1 for a in accounts if a.role == "total"),
        "agency": sum(1 for a in accounts if a.role == "agency"),
        "advertiser": sum(1 for a in accounts if a.role == "advertiser")
    }
    
    return {
        "accounts": [account_to_dict(acc) for acc in accounts],
        "stats": stats
    }
```

## 2. 계정 등록 (POST /accounts)

### 요청
- **Method**: POST
- **URL**: `/accounts`
- **Headers**:
  - `Authorization: Bearer {token}` (필수)
  - `Content-Type: application/json`
- **Body**:
```json
{
  "username": "new_user",
  "password": "password123",
  "role": "advertiser",
  "memo": "메모 내용"
}
```

### 권한 체크
- **Admin**: 모든 role 등록 가능
- **Total (총판사)**: `agency`, `advertiser` 등록 가능
- **Agency (대행사)**: `advertiser`만 등록 가능
- **Advertiser (광고주)**: 등록 불가

### 로직
1. 현재 사용자 권한 확인
2. 등록하려는 role이 허용된 role인지 확인
3. `parent_user_id`를 현재 사용자의 `user_id`로 자동 설정
4. 계정 생성

### 응답
```json
{
  "success": true,
  "message": "계정이 등록되었습니다.",
  "data": {
    "user_id": 10,
    "username": "new_user",
    "role": "advertiser",
    "parent_user_id": 2
  }
}
```

### FastAPI 구현 예시

```python
@router.post("")
async def create_account(
    account_data: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 권한 체크
    allowed_roles = []
    if current_user.role == "admin":
        allowed_roles = ["total", "agency", "advertiser"]
    elif current_user.role == "total":
        allowed_roles = ["agency", "advertiser"]
    elif current_user.role == "agency":
        allowed_roles = ["advertiser"]
    else:
        raise HTTPException(status_code=403, detail="계정 등록 권한이 없습니다.")
    
    if account_data.role not in allowed_roles:
        raise HTTPException(
            status_code=403, 
            detail=f"{current_user.role}은(는) {account_data.role} 계정을 등록할 수 없습니다."
        )
    
    # 중복 체크
    existing = await db.execute(
        select(User).where(User.username == account_data.username)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="이미 존재하는 아이디입니다.")
    
    # 계정 생성
    new_user = User(
        username=account_data.username,
        password_hash=hash_password(account_data.password),
        role=account_data.role,
        parent_user_id=current_user.user_id,  # 자동 설정
        memo=account_data.memo,
        ad_count=0,
        active_ad_count=0,
        is_active=True
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return {
        "success": True,
        "message": "계정이 등록되었습니다.",
        "data": {
            "user_id": new_user.user_id,
            "username": new_user.username,
            "role": new_user.role,
            "parent_user_id": new_user.parent_user_id
        }
    }
```

## 3. 계정 삭제 (DELETE /accounts)

### 요청
- **Method**: DELETE
- **URL**: `/accounts`
- **Headers**:
  - `Authorization: Bearer {token}` (필수)
  - `Content-Type: application/json`
- **Body**:
```json
{
  "account_ids": [1, 2, 3]
}
```

### 권한 체크
- 자신이 조회할 수 있는 계정만 삭제 가능
- 하위 계정이 있는 경우 삭제 불가 (또는 연쇄 삭제)

### 응답
```json
{
  "success": true,
  "message": "선택한 계정이 삭제되었습니다.",
  "deleted_count": 3
}
```

## DB 스키마 확인

`users` 테이블에 다음 컬럼이 필요합니다:

```sql
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,  -- 'admin', 'total', 'agency', 'advertiser'
    parent_user_id BIGINT,  -- 상위 계정 ID (FK)
    affiliation VARCHAR(255),
    memo TEXT,
    ad_count INT DEFAULT 0,
    active_ad_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_user_id) REFERENCES users(user_id)
);
```

## 참고사항

1. **인증**: 모든 API는 JWT 토큰을 통해 현재 사용자를 식별합니다.
2. **권한**: 각 API는 현재 사용자의 role에 따라 다른 동작을 수행합니다.
3. **계층 구조**: `parent_user_id`를 통해 총판사-대행사-광고주 계층 구조를 관리합니다.
4. **검색**: `username`(아이디)로 검색하되, 프론트엔드에서는 "아이디"로 표시합니다.
5. 자신의 소속만 조회 가능함 admin 외에
