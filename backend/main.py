from fastapi import FastAPI
from pymongo import MongoClient
from models.predict import predict_risk
import vertexai.generative_models as gm

app = FastAPI()

client = MongoClient("mongodb+srv://user:pass@cluster.mongodb.net")
db = client.safesteps

@app.get("/api/risk/{lat}/{lng}")
async def get_risk(lat: float, lng: float):
    risk = predict_risk(lat, lng)  # Your trained model
    return {"risk_score": risk}

@app.post("/api/chat")
async def safety_chat(query: str, lat: float, lng: float):
    # Vector search similar accidents
    similar = db.accidents.aggregate([{
        "$vectorSearch": {
            "index": "accident_patterns",
            "path": "factors_embedding",
            "queryVector": get_embedding(query),
            "limit": 3,
            "filter": {"location": {"$near": {"coordinates": [lng, lat]}}}
    }])
    
    # Generate safety tips
    model = gm.GenerativeModel("gemini-pro")
    response = model.generate_content(
        f"Based on these accidents: {list(similar)}\n\nAnswer: {query}"
    )
    
    return {"response": response.text}