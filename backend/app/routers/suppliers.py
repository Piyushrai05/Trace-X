from fastapi import APIRouter
from app.schemas.suppliers import SupplierSummary, SupplierDetail
from app.services import suppliers_service

router = APIRouter()

@router.get('/suppliers', response_model=list[SupplierSummary])
async def list_suppliers():
    return await suppliers_service.list_suppliers()

@router.get('/suppliers/{supplier_id}', response_model=SupplierDetail)
async def get_supplier(supplier_id: str):
    return await suppliers_service.get_supplier(supplier_id)
