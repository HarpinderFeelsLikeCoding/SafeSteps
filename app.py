from flask import Flask, render_template, request
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import os
from openai import OpenAI

load_dotenv()

app = Flask(__name__,
            static_folder="static",
            template_folder="templates")

client = MongoClient(
    os.getenv("ATLAS_URI"),
    server_api=ServerApi("1")
)

try:
    client.admin.command("ping")
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)

db = client.NYC_Crashes 
collection = db.NYC_Crash_Data 

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_embedding(text):
    if not text:
        return [0.0] * 1536
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

@app.route("/", methods=["GET", "POST"])
def index():
    query = None
    results = []

    if request.method == "POST":
        query = request.form.get("q", "").strip()
        if query:
            vector = get_embedding(query)

            results = list(collection.aggregate([
                {
                    "$search": {
                        "knnBeta": {
                            "vector": vector,
                            "path": "vector_embedding",
                            "k": 10
                        }
                    }
                }
            ]))
    
    return render_template("index.html", 
                          query=query, 
                          results=results)

if __name__ == "__main__":
    app.run(debug=True)
