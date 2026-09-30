"""Optional: create a demo account so you can log in without registering.

    python seed.py

Email: demo@cloudvault.com   Password: demo123
"""
from auth import hash_password
from database import Base, SessionLocal, engine
from models import User

Base.metadata.create_all(bind=engine)

EMAIL, PASSWORD = "demo@cloudvault.com", "demo123"

db = SessionLocal()
if db.query(User).filter(User.email == EMAIL).first():
    print(f"Demo user already exists: {EMAIL} / {PASSWORD}")
else:
    db.add(User(username="demo", email=EMAIL, hashed_password=hash_password(PASSWORD)))
    db.commit()
    print(f"Created demo user: {EMAIL} / {PASSWORD}")
db.close()
