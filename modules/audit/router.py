from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from modules.audit.analyst import generate_prestige_audit

router = APIRouter()

class AuditRequest(BaseModel):
    company_name: str
    website_url: str = None
    industry: str = "Général"

@router.post("/generate")
async def request_audit(req: AuditRequest):
    try:        report = await generate_prestige_audit(req.company_name, req.website_url, req.industry)
        return {"report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
