from app.db.database import engine, Base


def create_all():
    """Create DB tables (dev only). For migrations, use Alembic.
    """
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    create_all()
