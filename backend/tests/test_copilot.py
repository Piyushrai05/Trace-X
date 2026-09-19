import pytest
from app.services.ai_copilot_service import ai_copilot_service
from app.schemas.copilot import RegulatoryNoticeRequest, ContainmentDispatchRequest

def test_generate_regulatory_package():
    req = RegulatoryNoticeRequest(batch_code='PNR-2047', language='English')
    res = ai_copilot_service.generate_regulatory_package(req)
    
    assert res.batch_code == 'PNR-2047'
    assert 'FSSAI' in res.fssai_notice_markdown
    assert 'PNR-2047' in res.customer_sms_template
    assert len(res.executive_summary_bullets) >= 3
    assert res.brand_financial_savings['net_savings_usd'] > 0
    assert res.brand_financial_savings['blind_blanket_loss'] == 520000

def test_dispatch_emergency_containment():
    req = ContainmentDispatchRequest(
        batch_code='PNR-2047',
        channels=['pos_delisting', 'courier_recall', 'customer_broadcast', 'instant_refund']
    )
    res = ai_copilot_service.dispatch_emergency_containment(req)
    
    assert res.batch_code == 'PNR-2047'
    assert 'CONTAINED' in res.status
    assert res.containment_percentage >= 95.0
    assert len(res.channels_dispatched) == 4
