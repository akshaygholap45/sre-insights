from fastapi import APIRouter

from app.models.schemas import ShiftHandoverRequest, ShiftHandoverResponse
from app.services.google_chat_service import GoogleChatService

router = APIRouter()
service = GoogleChatService()


@router.post("/send", response_model=ShiftHandoverResponse)
def send_handover(payload: ShiftHandoverRequest) -> ShiftHandoverResponse:
    return service.send_handover(payload)
