from flask import Flask, render_template, request
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import os

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

db=client.NYC_Crashes #might be a differen tname
collection=db.NYC_Crash_Data #might be a different name

@app.route("/", methods=["GET", "POST"])
def index():
    query = None
    results = []

    if request.method == "POST":
        query = request.form.get("q", "").strip()
        # simple text search but i need to do this on Mongo DB Atlas too
        results = list(collection.find({"$text": {"$search": query}}))
    return render_template("index.html", 
                          query=query, 
                          results=results)

if __name__ == "__main__":
    app.run(debug=True)
