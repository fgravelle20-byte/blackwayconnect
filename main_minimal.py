import os
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    print("Health check requested")
    return {"status": "ok", "port": os.environ.get('PORT')}

@app.get("/")
def root():
    return {"message": "BlackWayConnect Minimal Boot - Port: " + os.environ.get('PORT', 'unknown')}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    print(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
