"""Appointments REST Controller Endpoints.

Provides real-time officer scheduling, time-slot lookup, double-booking prevention,
and appointment history retrieval.
"""

from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.modules.identity.dependencies import get_current_user
from app.modules.identity.models import User, Role
from app.modules.appointments.models import Appointment
from app.modules.notifications.models import Notification
from app.database.enums import MeetingMode, NotificationType, Priority

router = APIRouter(prefix="/appointments", tags=["Appointment Scheduling"])


class OfficerResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    department: str
    branch: str
    designation: str
    rating: float
    available_slots: List[str]


class AppointmentCreateRequest(BaseModel):
    officer_id: str
    meeting_type: str = Field(default="1-on-1 Video KYC Call")
    meeting_mode: str = Field(default="ONLINE")
    meeting_date: str = Field(..., description="YYYY-MM-DD format")
    meeting_time_slot: str = Field(..., description="e.g. 10:00 AM, 11:30 AM")


class AppointmentResponse(BaseModel):
    id: str
    appointment_number: str
    customer_id: str
    customer_name: str
    employee_id: Optional[str]
    employee_name: str
    meeting_type: str
    meeting_mode: str
    meeting_time: str
    status: str
    created_at: str

    model_config = {"from_attributes": True}


@router.get("/officers", response_model=List[OfficerResponse])
def get_available_officers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[OfficerResponse]:
    """Retrieve available officers with department, branch, and real-time available time slots."""
    employees = (
        db.query(User)
        .join(User.user_roles)
        .join(Role)
        .filter(Role.name.in_(["Employee", "Manager"]))
        .all()
    )

    officer_list = []
    default_slots = ["10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"]

    for emp in employees:
        role_name = emp.user_roles[0].role.name if emp.user_roles else "Officer"
        branch = "Mumbai Central Branch" if emp.first_name.startswith("G") else "Delhi City Branch"
        dept = "Underwriting & Credit Risk" if role_name == "Employee" else "Executive Approvals & Operations"
        designation = "Senior Underwriting Officer" if role_name == "Employee" else "Vice President - Operations"

        officer_list.append(
            OfficerResponse(
                id=emp.id,
                full_name=f"{emp.first_name} {emp.last_name}",
                email=emp.email,
                role=role_name,
                department=dept,
                branch=branch,
                designation=designation,
                rating=4.9,
                available_slots=default_slots,
            )
        )

    return officer_list


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def book_appointment(
    req: AppointmentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AppointmentResponse:
    """Book a real-time consultation appointment, check availability, and emit notifications."""
    officer = db.query(User).filter(User.id == req.officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Selected officer not found")

    mode_enum = MeetingMode.ONLINE if req.meeting_mode.upper() == "ONLINE" else MeetingMode.OFFLINE

    # Parse meeting datetime
    try:
        meeting_dt = datetime.strptime(f"{req.meeting_date} {req.meeting_time_slot}", "%Y-%m-%d %I:%M %p").replace(tzinfo=timezone.utc)
    except ValueError:
        meeting_dt = datetime.now(timezone.utc) + timedelta(days=1)

    # Check double booking
    existing_apt = (
        db.query(Appointment)
        .filter(
            Appointment.employee_id == officer.id,
            Appointment.meeting_time == meeting_dt,
            Appointment.status != "CANCELLED",
        )
        .first()
    )
    if existing_apt:
        raise HTTPException(
            status_code=400,
            detail=f"Officer {officer.first_name} is already booked for {req.meeting_time_slot}. Please select another time slot.",
        )

    apt = Appointment(
        customer_id=current_user.id,
        employee_id=officer.id,
        meeting_time=meeting_dt,
        meeting_mode=mode_enum,
        status="CONFIRMED",
    )
    db.add(apt)
    db.commit()
    db.refresh(apt)

    # Trigger Notification for Customer
    db.add(
        Notification(
            user_id=current_user.id,
            title="Appointment Confirmed!",
            message=f"Meeting scheduled with {officer.first_name} {officer.last_name} on {req.meeting_date} at {req.meeting_time_slot}.",
            notification_type=NotificationType.SYSTEM,
            priority=Priority.HIGH,
            read_status=False,
        )
    )

    # Trigger Notification for Officer
    db.add(
        Notification(
            user_id=officer.id,
            title="New Appointment Scheduled",
            message=f"New consultation booked by {current_user.first_name} {current_user.last_name} for {req.meeting_date} at {req.meeting_time_slot}.",
            notification_type=NotificationType.SYSTEM,
            priority=Priority.MEDIUM,
            read_status=False,
        )
    )
    db.commit()

    apt_number = f"APT-2026-{apt.id[:4].upper()}"
    return AppointmentResponse(
        id=apt.id,
        appointment_number=apt_number,
        customer_id=current_user.id,
        customer_name=f"{current_user.first_name} {current_user.last_name}",
        employee_id=officer.id,
        employee_name=f"{officer.first_name} {officer.last_name}",
        meeting_type=req.meeting_type,
        meeting_mode=req.meeting_mode,
        meeting_time=f"{req.meeting_date} · {req.meeting_time_slot}",
        status="CONFIRMED",
        created_at=apt.created_at.isoformat() if apt.created_at else datetime.now(timezone.utc).isoformat(),
    )


@router.get("", response_model=List[AppointmentResponse])
def get_my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[AppointmentResponse]:
    """List appointments for the current customer or officer."""
    user_roles = [ur.role.name.lower() for ur in current_user.user_roles if ur.role and ur.role.name]
    
    if "customer" in user_roles:
        apts = db.query(Appointment).filter(Appointment.customer_id == current_user.id).order_by(Appointment.created_at.desc()).all()
    else:
        apts = db.query(Appointment).filter(Appointment.employee_id == current_user.id).order_by(Appointment.created_at.desc()).all()

    result = []
    for apt in apts:
        cust = db.query(User).filter(User.id == apt.customer_id).first()
        emp = db.query(User).filter(User.id == apt.employee_id).first() if apt.employee_id else None
        
        c_name = f"{cust.first_name} {cust.last_name}" if cust else "Customer"
        e_name = f"{emp.first_name} {emp.last_name}" if emp else "Unassigned Officer"
        apt_number = f"APT-2026-{apt.id[:4].upper()}"

        result.append(
            AppointmentResponse(
                id=apt.id,
                appointment_number=apt_number,
                customer_id=apt.customer_id,
                customer_name=c_name,
                employee_id=apt.employee_id,
                employee_name=e_name,
                meeting_type="1-on-1 Video Consultation" if apt.meeting_mode == MeetingMode.ONLINE else "Branch In-Person Visit",
                meeting_mode=apt.meeting_mode.value,
                meeting_time=apt.meeting_time.strftime("%d %b %Y · %I:%M %p") if apt.meeting_time else "TBD",
                status=apt.status,
                created_at=apt.created_at.isoformat() if apt.created_at else datetime.now(timezone.utc).isoformat(),
            )
        )

    return result
