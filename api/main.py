from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import api_router

app = FastAPI(
    title="FastAPI Backend with JWT Authentication",
    version="1.0.0",
    description="Secure FastAPI backend with JWT authentication"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # More restrictive for security
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    try:
        from database.base import Base
        from database.connection import engine
        from models.user import User  # Import to register the model
        
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully!")
    except Exception as e:
        print(f"Error creating database tables: {e}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "FastAPI backend is running"}