import os
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok", "mode": "stabilization"}

@app.get("/")
def root():
    return {"message": "BlackWayConnect Core Stabilization Mode"}
