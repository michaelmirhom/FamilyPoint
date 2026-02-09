from typing import Optional, List
from pydantic import BaseModel
import datetime
from enum import Enum

class Role(str, Enum):
    PARENT = "PARENT"
    CHILD = "CHILD"

class UserBase(BaseModel):
    name: str
    email: Optional[str] = None
    username: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: Role

class UserOut(UserBase):
    id: int
    role: Role
    parent_id: Optional[int] = None
    class Config:
        orm_mode = True

class ChildCreate(BaseModel):
    name: str
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TaskBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    points: int
    is_active: bool = True

class TaskOut(TaskBase):
    id: int
    parent_id: int
    created_at: datetime.datetime
    class Config:
        orm_mode = True

class SubmissionCreate(BaseModel):
    task_id: int
    note: Optional[str] = None
    bible_reference: Optional[str] = None
    reflection: Optional[str] = None
    evidence_file_path: Optional[str] = None # Deprecated
    evidence_files: Optional[List[str]] = None

class SubmissionEvidenceOut(BaseModel):
    id: int
    file_path: str
    file_type: Optional[str]
    created_at: datetime.datetime
    class Config:
        orm_mode = True

class SubmissionOut(BaseModel):
    id: int
    child_id: int
    task_id: int
    status: str
    note: Optional[str]
    bible_reference: Optional[str]
    reflection: Optional[str]
    evidence_file_path: Optional[str] # Deprecated
    evidence: List[SubmissionEvidenceOut] = []
    created_at: datetime.datetime
    approved_at: Optional[datetime.datetime]
    class Config:
        orm_mode = True

class PointsSummary(BaseModel):
    totalPoints: int
    totalMoneyEquivalent: float
    thisMonthMoneyEquivalent: float

class BadgeOut(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str]
    is_active: bool
    class Config:
        orm_mode = True

class ChildBadgeOut(BaseModel):
    id: int
    child_id: int
    badge: BadgeOut
    awarded_at: datetime.datetime
    class Config:
        orm_mode = True

class ParentSettingsBase(BaseModel):
    points_per_dollar: int = 100
    monthly_dollar_cap_per_child: float = 10.0
    show_money_to_children: bool = True

class ParentSettingsOut(ParentSettingsBase):
    id: int
    parent_id: int
    class Config:
        orm_mode = True

class RewardBase(BaseModel):
    name: str
    type: str
    cost_points: int
    description: Optional[str] = None
    is_active: bool = True

class RewardOut(RewardBase):
    id: int
    parent_id: int
    created_at: datetime.datetime
    class Config:
        orm_mode = True

class RewardRedemptionCreate(BaseModel):
    reward_id: int

class RewardRedemptionOut(BaseModel):
    id: int
    child_id: int
    reward_id: int
    status: str
    cost_points_at_time: int
    created_at: datetime.datetime
    processed_at: Optional[datetime.datetime]
    reward: RewardOut
    class Config:
        orm_mode = True

class ChildFullSummary(BaseModel):
    user: UserOut
    points: PointsSummary
    badges: List[ChildBadgeOut]
    # streaks: dict

