from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Reward, RewardRedemption, User, RoleEnum, RewardRedemptionStatus, PointsLedger
from app.schemas.schemas import RewardOut, RewardBase, RewardRedemptionOut, RewardRedemptionCreate
from app.core.auth import get_current_user

router = APIRouter()

# --- Rewards Management (Parent) ---

@router.post("/", response_model=RewardOut)
def create_reward(
    reward_in: RewardBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != RoleEnum.PARENT:
        raise HTTPException(status_code=403, detail="Only parents can create rewards")
    
    reward = Reward(**reward_in.dict(), parent_id=current_user.id)
    db.add(reward)
    db.commit()
    db.refresh(reward)
    return reward

@router.get("/", response_model=List[RewardOut])
def list_rewards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    parent_id = current_user.id if current_user.role == RoleEnum.PARENT else current_user.parent_id
    if not parent_id:
        return []
    
    query = db.query(Reward).filter(Reward.parent_id == parent_id).filter(Reward.is_active == True)
    
    return query.all()

@router.put("/{reward_id}", response_model=RewardOut)
def update_reward(
    reward_id: int,
    reward_in: RewardBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != RoleEnum.PARENT:
        raise HTTPException(status_code=403, detail="Only parents can update rewards")
        
    reward = db.query(Reward).filter(Reward.id == reward_id, Reward.parent_id == current_user.id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
        
    for field, value in reward_in.dict(exclude_unset=True).items():
        setattr(reward, field, value)
    
    db.commit()
    db.refresh(reward)
    return reward

@router.delete("/{reward_id}")
def delete_reward(
    reward_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != RoleEnum.PARENT:
        raise HTTPException(status_code=403, detail="Only parents can delete rewards")
    
    reward = db.query(Reward).filter(Reward.id == reward_id, Reward.parent_id == current_user.id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    # Soft delete
    reward.is_active = False
    db.commit()
    return {"status": "ok"}

# --- Redemptions ---

@router.get("/redemptions/pending", response_model=List[RewardRedemptionOut])
def list_pending_redemptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != RoleEnum.PARENT:
        raise HTTPException(status_code=403, detail="Parent only")
    
    # Get all redemptions for children owned by this parent where status is REQUESTED
    # Join Reward to check parent_id
    redemptions = (
        db.query(RewardRedemption)
        .join(Reward)
        .filter(Reward.parent_id == current_user.id)
        .filter(RewardRedemption.status == RewardRedemptionStatus.REQUESTED)
        .all()
    )
    return redemptions

@router.post("/{reward_id}/redeem", response_model=RewardRedemptionOut)
def redeem_reward(
    reward_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != RoleEnum.CHILD:
        raise HTTPException(status_code=400, detail="Only children can redeem rewards")
    
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    if not reward or not reward.is_active:
         raise HTTPException(status_code=404, detail="Reward not available")
    
    # Ensure reward belongs to child's parent
    if reward.parent_id != current_user.parent_id:
         raise HTTPException(status_code=403, detail="Not eligible for this reward")
    
    # Check balance
    total_ledger = db.query(PointsLedger).filter(PointsLedger.child_id == current_user.id).all()
    balance = sum(r.delta_points for r in total_ledger)
    
    if balance < reward.cost_points:
         raise HTTPException(status_code=400, detail="Insufficient points")
    
    # Deduct points immediately
    ledger_entry = PointsLedger(
        child_id=current_user.id,
        delta_points=-reward.cost_points,
        reason=f"Reward Redemption: {reward.name}",
        # created_by_parent_id left null as it's system/child action
    )
    db.add(ledger_entry)

    redemption = RewardRedemption(
        child_id=current_user.id,
        reward_id=reward.id,
        status=RewardRedemptionStatus.REQUESTED,
        cost_points_at_time=reward.cost_points
    )
    db.add(redemption)
    db.commit()
    db.refresh(redemption)
    # We might want to link the ledger to redemption if we had a FK, but we don't.
    
    return redemption

@router.post("/redemptions/{redemption_id}/approve")
def approve_redemption(
    redemption_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != RoleEnum.PARENT:
        raise HTTPException(status_code=403, detail="Parent only")
    
    redemption = db.query(RewardRedemption).join(Reward).filter(
        RewardRedemption.id == redemption_id,
        Reward.parent_id == current_user.id
    ).first()
    
    if not redemption:
        raise HTTPException(status_code=404, detail="Redemption not found")
        
    if redemption.status != RewardRedemptionStatus.REQUESTED:
        raise HTTPException(status_code=400, detail="Redemption not pending")

    # Points were already deducted at request time.
    # Just update status.
    
    redemption.status = RewardRedemptionStatus.APPROVED
    redemption.processed_by_parent_id = current_user.id
    import datetime
    redemption.processed_at = datetime.datetime.utcnow()
    
    db.commit()
    return {"status": "approved"}

@router.post("/redemptions/{redemption_id}/reject")
def reject_redemption(
    redemption_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != RoleEnum.PARENT:
        raise HTTPException(status_code=403, detail="Parent only")

    redemption = db.query(RewardRedemption).join(Reward).filter(
        RewardRedemption.id == redemption_id,
        Reward.parent_id == current_user.id
    ).first()

    if not redemption:
        raise HTTPException(status_code=404, detail="Redemption not found")

    if redemption.status != RewardRedemptionStatus.REQUESTED:
        raise HTTPException(status_code=400, detail="Redemption not pending")

    # Refund points
    ledger_entry = PointsLedger(
        child_id=redemption.child_id,
        delta_points=redemption.cost_points_at_time, # Positive value to refund
        reason=f"Refund: Rejected Reward {redemption.reward.name}",
        created_by_parent_id=current_user.id
    )
    db.add(ledger_entry)

    redemption.status = RewardRedemptionStatus.REJECTED
    redemption.processed_by_parent_id = current_user.id
    import datetime
    redemption.processed_at = datetime.datetime.utcnow()
    
    db.commit()
    return {"status": "rejected"}
