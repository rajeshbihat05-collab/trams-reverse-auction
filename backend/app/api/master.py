"""
Master data CRUD API: Routes, Materials, Branches, Customers, Users.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.core import hash_password
from app.core.exceptions import NotFoundException, ConflictException
from app.dependencies import get_current_user, get_admin_user
from app.models.user import User
from app.models.master import Route, Material, Branch, Customer
from app.schemas.master import (
    RouteCreate, RouteUpdate, RouteResponse,
    MaterialCreate, MaterialUpdate, MaterialResponse,
    BranchCreate, BranchUpdate, BranchResponse,
    CustomerCreate, CustomerUpdate, CustomerResponse,
)
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/api/master", tags=["Master Data"])


# =================== Routes ===================
@router.get("/routes", response_model=list[RouteResponse])
async def list_routes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    routes = db.query(Route).filter(Route.is_active == True).all()
    return [RouteResponse.model_validate(r) for r in routes]


@router.post("/routes", response_model=RouteResponse)
async def create_route(
    data: RouteCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    route = Route(**data.model_dump())
    db.add(route)
    db.commit()
    db.refresh(route)
    return RouteResponse.model_validate(route)


@router.put("/routes/{route_id}", response_model=RouteResponse)
async def update_route(
    route_id: str, data: RouteUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise NotFoundException("Route not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(route, k, v)
    db.commit()
    db.refresh(route)
    return RouteResponse.model_validate(route)


@router.delete("/routes/{route_id}", response_model=MessageResponse)
async def delete_route(
    route_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise NotFoundException("Route not found")
    db.delete(route)
    db.commit()
    return MessageResponse(message="Route deleted")


# =================== Materials ===================
@router.get("/materials", response_model=list[MaterialResponse])
async def list_materials(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return [MaterialResponse.model_validate(m) for m in db.query(Material).filter(Material.is_active == True).all()]


@router.post("/materials", response_model=MaterialResponse)
async def create_material(
    data: MaterialCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    m = Material(**data.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return MaterialResponse.model_validate(m)


@router.put("/materials/{material_id}", response_model=MaterialResponse)
async def update_material(
    material_id: str, data: MaterialUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    m = db.query(Material).filter(Material.id == material_id).first()
    if not m:
        raise NotFoundException("Material not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)
    return MaterialResponse.model_validate(m)


@router.delete("/materials/{material_id}", response_model=MessageResponse)
async def delete_material(
    material_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    m = db.query(Material).filter(Material.id == material_id).first()
    if not m:
        raise NotFoundException("Material not found")
    db.delete(m)
    db.commit()
    return MessageResponse(message="Material deleted")


# =================== Branches ===================
@router.get("/branches", response_model=list[BranchResponse])
async def list_branches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return [BranchResponse.model_validate(b) for b in db.query(Branch).filter(Branch.is_active == True).all()]


@router.post("/branches", response_model=BranchResponse)
async def create_branch(
    data: BranchCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    b = Branch(**data.model_dump())
    db.add(b)
    db.commit()
    db.refresh(b)
    return BranchResponse.model_validate(b)


@router.put("/branches/{branch_id}", response_model=BranchResponse)
async def update_branch(
    branch_id: str, data: BranchUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    b = db.query(Branch).filter(Branch.id == branch_id).first()
    if not b:
        raise NotFoundException("Branch not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(b, k, v)
    db.commit()
    db.refresh(b)
    return BranchResponse.model_validate(b)


@router.delete("/branches/{branch_id}", response_model=MessageResponse)
async def delete_branch(
    branch_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    b = db.query(Branch).filter(Branch.id == branch_id).first()
    if not b:
        raise NotFoundException("Branch not found")
    db.delete(b)
    db.commit()
    return MessageResponse(message="Branch deleted")


# =================== Customers ===================
@router.get("/customers", response_model=list[CustomerResponse])
async def list_customers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return [CustomerResponse.model_validate(c) for c in db.query(Customer).filter(Customer.is_active == True).all()]


@router.post("/customers", response_model=CustomerResponse)
async def create_customer(
    data: CustomerCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    c = Customer(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return CustomerResponse.model_validate(c)


@router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: str, data: CustomerUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise NotFoundException("Customer not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return CustomerResponse.model_validate(c)


@router.delete("/customers/{customer_id}", response_model=MessageResponse)
async def delete_customer(
    customer_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise NotFoundException("Customer not found")
    db.delete(c)
    db.commit()
    return MessageResponse(message="Customer deleted")


# =================== Users ===================
@router.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if search:
        query = query.filter(or_(User.full_name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%")))
    if role:
        query = query.filter(User.role == role)

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return UserListResponse(
        users=[UserResponse.model_validate(u) for u in users],
        total=total, page=page, page_size=page_size,
    )


@router.post("/users", response_model=UserResponse)
async def create_user(
    data: UserCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise ConflictException("Email already exists")

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str, data: UserUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.delete("/users/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User not found")
    if user.id == current_user.id:
        from app.core.exceptions import BadRequestException
        raise BadRequestException("Cannot delete your own account")
    user.is_active = False
    db.commit()
    return MessageResponse(message="User deactivated")
