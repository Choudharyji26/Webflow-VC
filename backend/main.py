from fastapi import FastAPI, Depends, Request, HTTPException, Form
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from database import get_db, WebflowConnection, WebflowSyncLog
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
import httpx
import uuid
import secrets
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLIENT_ID = os.environ.get("WEBFLOW_CLIENT_ID")
CLIENT_SECRET = os.environ.get("WEBFLOW_CLIENT_SECRET")
REDIRECT_URI = os.environ.get("WEBFLOW_REDIRECT_URI")

# In-memory store for CSRF state tokens. In production use Redis or DB.
state_store = {}

@app.get("/")
def read_root():
    return {"message": "Webflow CMS Integration API"}

@app.get("/auth/webflow/connect")
def webflow_connect(request: Request, user_id: str = "test-user-123"):
    """Initiates the OAuth flow."""
    state = secrets.token_urlsafe(16)
    state_store[state] = user_id

    auth_url = (
        f"https://webflow.com/oauth/authorize?"
        f"client_id={CLIENT_ID}&"
        f"response_type=code&"
        f"redirect_uri={REDIRECT_URI}&"
        f"scope=sites:read%20cms:read%20cms:write&"
        f"state={state}"
    )
    return {"url": auth_url}

@app.get("/auth/webflow/callback")
async def webflow_callback(code: str, state: str, db: Session = Depends(get_db)):
    """Handles the OAuth callback."""
    if state not in state_store:
        raise HTTPException(status_code=400, detail="Invalid state token")

    user_id = state_store.pop(state)

    async with httpx.AsyncClient() as client:
        response = await client.post("https://api.webflow.com/oauth/access_token", json={
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "code": code,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code"
        })

        if response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to get access token: {response.text}")

        token_data = response.json()
        access_token = token_data.get("access_token")

        if not access_token:
             raise HTTPException(status_code=400, detail="No access token returned")

        # Save to DB
        connection_id = str(uuid.uuid4())

        # In a real app we might check if user already has a connection
        existing = db.query(WebflowConnection).filter(WebflowConnection.user_id == user_id).first()
        if existing:
            existing.oauth_access_token = access_token
            existing.status = "active"
            connection_id = existing.id
        else:
            new_connection = WebflowConnection(
                id=connection_id,
                user_id=user_id,
                oauth_access_token=access_token,
                status="active"
            )
            db.add(new_connection)

        db.commit()

    # Redirect back to frontend
    return RedirectResponse(url=f"http://localhost:5173/setup/site?connection_id={connection_id}")

@app.get("/api/connections/{user_id}")
def get_connection(user_id: str, db: Session = Depends(get_db)):
    conn = db.query(WebflowConnection).filter(WebflowConnection.user_id == user_id).first()
    if not conn:
        return {"connection": None}
    return {
        "connection": {
            "id": conn.id,
            "status": conn.status,
            "webflow_site_id": conn.webflow_site_id,
            "site_display_name": conn.site_display_name,
            "collection_id": conn.collection_id,
            "collection_name": conn.collection_name,
            "field_mapping": conn.field_mapping
        }
    }

@app.delete("/api/connections/{connection_id}")
async def disconnect(connection_id: str, db: Session = Depends(get_db)):
    conn = db.query(WebflowConnection).filter(WebflowConnection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    async with httpx.AsyncClient() as client:
        # Revoke token on Webflow
        try:
            await client.post("https://api.webflow.com/oauth/revoke_authorization", json={
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "access_token": conn.oauth_access_token
            })
        except:
             pass # Ignore if it fails on Webflow's side

    db.delete(conn)
    db.commit()
    return {"status": "success"}

# Proxy endpoints
async def get_wf_headers(connection_id: str, db: Session):
    conn = db.query(WebflowConnection).filter(WebflowConnection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"Authorization": f"Bearer {conn.oauth_access_token}", "Accept": "application/json"}

@app.get("/api/sites")
async def get_sites(connection_id: str, db: Session = Depends(get_db)):
    headers = await get_wf_headers(connection_id, db)
    async with httpx.AsyncClient() as client:
        resp = await client.get("https://api.webflow.com/v2/sites", headers=headers)
        if resp.status_code == 401:
            conn = db.query(WebflowConnection).filter(WebflowConnection.id == connection_id).first()
            if conn:
                conn.status = "needs_reconnect"
                db.commit()
            raise HTTPException(status_code=401, detail="Token revoked or expired")
        resp.raise_for_status()
        return resp.json()

@app.post("/api/connections/{connection_id}/site")
def save_site(connection_id: str, site_data: Dict[str, str], db: Session = Depends(get_db)):
    conn = db.query(WebflowConnection).filter(WebflowConnection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    conn.webflow_site_id = site_data.get("site_id")
    conn.site_display_name = site_data.get("site_name")
    db.commit()
    return {"status": "success"}

@app.get("/api/collections")
async def get_collections(connection_id: str, site_id: str, db: Session = Depends(get_db)):
    headers = await get_wf_headers(connection_id, db)
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"https://api.webflow.com/v2/sites/{site_id}/collections", headers=headers)
        resp.raise_for_status()
        return resp.json()

@app.post("/api/connections/{connection_id}/collection")
def save_collection(connection_id: str, coll_data: Dict[str, str], db: Session = Depends(get_db)):
    conn = db.query(WebflowConnection).filter(WebflowConnection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    conn.collection_id = coll_data.get("collection_id")
    conn.collection_name = coll_data.get("collection_name")
    db.commit()
    return {"status": "success"}

@app.get("/api/collections/{collection_id}")
async def get_collection_details(connection_id: str, collection_id: str, db: Session = Depends(get_db)):
    headers = await get_wf_headers(connection_id, db)
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"https://api.webflow.com/v2/collections/{collection_id}", headers=headers)
        resp.raise_for_status()
        return resp.json()

@app.post("/api/connections/{connection_id}/mapping")
def save_mapping(connection_id: str, mapping_data: Dict[str, Any], db: Session = Depends(get_db)):
    conn = db.query(WebflowConnection).filter(WebflowConnection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    conn.field_mapping = mapping_data
    db.commit()
    return {"status": "success"}


class PushData(BaseModel):
    article_id: str
    title: str
    body: str
    summary: Optional[str] = None
    slug: str
    published_date: Optional[str] = None

@app.post("/api/connections/{connection_id}/push")
async def push_draft(connection_id: str, data: PushData, db: Session = Depends(get_db)):
    conn = db.query(WebflowConnection).filter(WebflowConnection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    mapping = conn.field_mapping or {}

    # Very basic HTML sanitization logic goes here (in a real app use a library like bleach)
    # We will strip img, table, code, pre
    import re
    body = data.body
    body = re.sub(r'<img[^>]*>', '', body)
    body = re.sub(r'<table.*?>.*?</table>', '', body, flags=re.DOTALL)
    body = re.sub(r'<code.*?>.*?</code>', '', body, flags=re.DOTALL)
    body = re.sub(r'<pre.*?>.*?</pre>', '', body, flags=re.DOTALL)
    body = re.sub(r' class=".*?"', '', body)
    body = re.sub(r' style=".*?"', '', body)

    field_data = {
        "name": data.title[:256],
        "slug": data.slug,
    }

    if mapping.get("body"):
        field_data[mapping["body"]] = body

    if mapping.get("summary") and data.summary:
        field_data[mapping["summary"]] = data.summary[:256]

    payload = {
        "isDraft": True,
        "isArchived": False,
        "fieldData": field_data
    }

    headers = await get_wf_headers(connection_id, db)

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://api.webflow.com/v2/collections/{conn.collection_id}/items",
            json=payload,
            headers=headers
        )

        # Simple Sync Log
        sync_log = WebflowSyncLog(
            id=str(uuid.uuid4()),
            connection_id=connection_id,
            article_id=data.article_id,
            status="success" if resp.status_code == 200 else "failed",
            error_code=str(resp.status_code) if resp.status_code != 200 else None,
            error_detail=resp.text if resp.status_code != 200 else None,
        )

        if resp.status_code == 200:
            resp_data = resp.json()
            sync_log.webflow_item_id = resp_data.get("id")
            sync_log.webflow_item_slug = resp_data.get("fieldData", {}).get("slug")
            db.add(sync_log)
            db.commit()
            return {"status": "success", "item": resp_data}
        else:
            db.add(sync_log)
            db.commit()
            raise HTTPException(status_code=resp.status_code, detail=f"Webflow error: {resp.text}")
