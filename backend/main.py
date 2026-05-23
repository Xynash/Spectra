from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from scraper import dna_ingestor
from engine import spectra_brain

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class RepoRequest(BaseModel):
    url: str

@app.post("/analyze")
async def analyze_repo(request: RepoRequest):
    tree = await dna_ingestor.fetch_repo_structure(request.url)
    if isinstance(tree, dict) and "error" in tree:
        raise HTTPException(status_code=400, detail=tree["error"])
    
    graph_data = await spectra_brain.map_architecture(tree)
    return {"status": "success", "graph": graph_data}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)