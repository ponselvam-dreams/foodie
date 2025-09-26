from sqlalchemy import Column, Integer, String, Text
from app.db.database import Base

class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200))
    ingredients = Column(Text)   # comma-separated
    steps = Column(Text)         # pipe-separated
    video_url = Column(String(500), nullable=True)
    author = Column(String(100))