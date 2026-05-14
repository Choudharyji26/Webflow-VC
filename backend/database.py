from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, JSON
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func

SQLALCHEMY_DATABASE_URL = "sqlite:///./webflow.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class WebflowConnection(Base):
    __tablename__ = "webflow_connections"

    id = Column(String, primary_key=True, index=True) # UUID
    user_id = Column(String, index=True) # UUID
    oauth_access_token = Column(String) # EncryptedString in real app, plain for now
    webflow_site_id = Column(String, nullable=True)
    site_display_name = Column(String, nullable=True)
    collection_id = Column(String, nullable=True)
    collection_name = Column(String, nullable=True)
    field_mapping = Column(JSON, nullable=True)
    content_types = Column(JSON, nullable=True)
    status = Column(String, default="active")
    schema_cache = Column(JSON, nullable=True)
    schema_cached_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class WebflowSyncLog(Base):
    __tablename__ = "webflow_sync_log"

    id = Column(String, primary_key=True, index=True) # UUID
    connection_id = Column(String, index=True) # UUID
    article_id = Column(String, index=True) # UUID
    webflow_item_id = Column(String, nullable=True)
    webflow_item_slug = Column(String, nullable=True)
    status = Column(String, default="pending")
    error_code = Column(String, nullable=True)
    error_detail = Column(String, nullable=True)
    retry_count = Column(Integer, default=0)
    pushed_at = Column(DateTime(timezone=True), nullable=True)
    last_attempted_at = Column(DateTime(timezone=True), nullable=True)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
