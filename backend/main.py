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

class ChatRequest(BaseModel):
    message: str
    repo_url: str

@app.post("/analyze")
async def analyze_repo(request: RepoRequest):
    tree = await dna_ingestor.fetch_repo_structure(request.url)
    if isinstance(tree, dict) and "error" in tree:
        raise HTTPException(status_code=400, detail=tree["error"])
    graph_data = await spectra_brain.map_architecture(tree, repo_url=request.url)
    if not graph_data: return {"status": "fallback", "graph": None}
    return {"status": "success", "graph": graph_data}

@app.post("/chat")
async def chat_with_sentinel(request: ChatRequest):
    tree = await dna_ingestor.fetch_repo_structure(request.repo_url)
    answer = await spectra_brain.chat_with_repo(request.message, tree)
    return {"answer": answer}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)