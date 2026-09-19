from fastapi import APIRouter
from app.schemas.ask import AskGraphRequest, AskGraphResponse
from app.services.ask_service import ask_graph_service

router = APIRouter()

@router.post('/ask', response_model=AskGraphResponse)
async def ask_graph(payload: AskGraphRequest):
    return await ask_graph_service.ask(payload)
