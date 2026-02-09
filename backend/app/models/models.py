import enum
import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text, Float
from sqlalchemy.orm import relationship
from app.db.session import Base

class RoleEnum(str, enum.Enum):
    PARENT = "PARENT"
    CHILD = "CHILD"

class CategoryEnum(str, enum.Enum):
    FAITH = "FAITH"
    SCHOOL = "SCHOOL"
    HOME = "HOME"
    KINDNESS = "KINDNESS"
    OTHER = "OTHER"

class SubmissionStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class RewardType(str, enum.Enum):
    MONEY = "MONEY"
    PRIVILEGE = "PRIVILEGE"
    GIFT = "GIFT"

class RewardRedemptionStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    FULFILLED = "FULFILLED"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    username = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    children = relationship("User")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(Enum(CategoryEnum), nullable=False)
    points = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    submissions = relationship("Submission", back_populates="task")

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.PENDING)
    note = Column(Text, nullable=True)
    bible_reference = Column(String, nullable=True)
    reflection = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    reviewed_by_parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # Deprecated: single file path kept for backward compatibility if needed, but we will move to relation
    evidence_file_path = Column(String, nullable=True)

    task = relationship("Task", back_populates="submissions")
    child = relationship("User", foreign_keys=[child_id])
    evidence = relationship("SubmissionEvidence", back_populates="submission")

class SubmissionEvidence(Base):
    __tablename__ = "submission_evidence"
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=True) # e.g. 'image/jpeg', 'application/pdf'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    submission = relationship("Submission", back_populates="evidence")

class PointsLedger(Base):
    __tablename__ = "points_ledger"
    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    delta_points = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)
    related_submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_by_parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)

class ParentSettings(Base):
    __tablename__ = "parent_settings"
    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    points_per_dollar = Column(Integer, default=100)
    monthly_dollar_cap_per_child = Column(Float, default=10.0)
    show_money_to_children = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Reward(Base):
    __tablename__ = "rewards"
    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(Enum(RewardType), nullable=False)
    cost_points = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class RewardRedemption(Base):
    __tablename__ = "reward_redemptions"
    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reward_id = Column(Integer, ForeignKey("rewards.id"), nullable=False)
    status = Column(Enum(RewardRedemptionStatus), default=RewardRedemptionStatus.REQUESTED)
    cost_points_at_time = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    processed_by_parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    reward = relationship("Reward")
    child = relationship("User", foreign_keys=[child_id])

class Badge(Base):
    __tablename__ = "badges"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    criteria_type = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class ChildBadge(Base):
    __tablename__ = "child_badges"
    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)
    awarded_at = Column(DateTime, default=datetime.datetime.utcnow)
