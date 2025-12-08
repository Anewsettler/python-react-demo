from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class ClientResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CreateTaskRequest(BaseModel):
    client_id: UUID
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    external_id: Optional[str] = None
    
    @validator('title')
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()

class UpdateTaskStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(todo|done)$")

class TaskResponse(BaseModel):
    id: UUID
    client_id: UUID
    title: str
    description: Optional[str]
    status: str
    due_date: Optional[datetime]
    external_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PaginatedTasksResponse(BaseModel):
    items: List[TaskResponse]
    next_cursor: Optional[str]
    has_more: bool

class OverdueCountResponse(BaseModel):
    client_id: UUID
    overdue_count: int