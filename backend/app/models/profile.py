from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, Session
from app.db.database import Base
from app.models.users import User


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, index=True)  
    nickname = Column(String, index=True)
    username = Column(String, index=True)
    date_of_birth = Column(String, index=True)
    alt_phone_number = Column(String, index=True)
    alt_email = Column(String, index=True)
    addresses = Column(String, index=True)
    photo = Column(String, index=True)

    user = relationship("User", back_populates="profile")


def get_by_user_id(self, db: Session, user_id: str, user: User):
        query = db.query(self.model).filter(self.model.user_id == user_id, self.model.is_deleted == False)
        data = query.first()
        return data

def create_profile(db: Session, **kwargs):
    profile = UserProfile(**kwargs)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

def update_profile(db: Session, profile: UserProfile, **kwargs):
    for key, value in kwargs.items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile

def delete_profile(db: Session, profile: UserProfile):
    db.delete(profile)
    db.commit()