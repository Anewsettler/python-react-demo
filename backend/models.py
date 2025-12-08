from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from datetime import datetime
import enum
from database import Base

class TaskStatus(str, enum.Enum):
    todo = "todo"
    done = "done"

class ClientModel(Base):
    __tablename__ = "clients"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, server_default=Text("gen_random_uuid()"))
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=Text("NOW()"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=Text("NOW()"), onupdate=datetime.utcnow)

class TaskModel(Base):
    __tablename__ = "tasks"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, server_default=Text("gen_random_uuid()"))
    client_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(TaskStatus, name="task_status"), nullable=False, default=TaskStatus.todo)
    due_date = Column(DateTime(timezone=True), nullable=True)
    external_id = Column(String(255), nullable=True, unique=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=Text("NOW()"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=Text("NOW()"), onupdate=datetime.utcnow)