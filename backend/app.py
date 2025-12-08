from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from sqlalchemy.orm import Session
import base64

from database import get_db
from schemas import (
    ClientResponse,
    CreateTaskRequest,
    UpdateTaskStatusRequest,
    TaskResponse,
    PaginatedTasksResponse,
    OverdueCountResponse
)
from models import ClientModel, TaskModel

app = FastAPI(title="Tasks API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok", "message": "Tasks API is running"}

@app.get("/api/clients", response_model=List[ClientResponse])
async def get_clients(db: Session = Depends(get_db)):
    clients = db.query(ClientModel).all()
    return clients

@app.post("/api/tasks", response_model=TaskResponse, status_code=201)
async def create_task(task: CreateTaskRequest, db: Session = Depends(get_db)):
    pass

@app.get("/api/tasks", response_model=PaginatedTasksResponse)
async def list_tasks(
    client_id: UUID,
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = None,
    status: Optional[str] = Query(None, pattern="^(todo|done)$"),
    db: Session = Depends(get_db)
):
    cursor_time = None
    cursor_id = None
    if cursor:
        decoded = base64.b64decode(cursor).decode('utf-8')
        cursor_time, cursor_id = decoded.split('|')
    
    pass

@app.get("/api/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: UUID, db: Session = Depends(get_db)):
    pass

@app.patch("/api/tasks/{task_id}/status", response_model=TaskResponse)
async def update_task_status(task_id: UUID, update: UpdateTaskStatusRequest, db: Session = Depends(get_db)):
    pass

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: UUID, db: Session = Depends(get_db)):
    return {"message": "Task deleted successfully"}

@app.get("/api/tasks/overdue-count", response_model=List[OverdueCountResponse])
async def get_overdue_count(db: Session = Depends(get_db)):
    pass