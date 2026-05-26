from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from scraper import dna_ingestor
from engine import spectra_brain

app = FastAPI(title="Spectra Intelligence Engine")

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

class ExplainRequest(BaseModel):
    node_label: str
    node_description: str
    node_layer: str
    node_tier: int
    repo_url: str

@app.post("/analyze")
async def analyze_repo(request: RepoRequest):
    result = await dna_ingestor.fetch_repo_structure(request.url)

    if isinstance(result, dict) and "error" in result:
        code = result["error"]
        if code == "GITHUB_RATE_LIMIT":
            raise HTTPException(status_code=429, detail={"code": code, "message": "GitHub rate limit. Wait ~1hr or add GITHUB_PAT to .env"})
        if code == "REPO_NOT_FOUND":
            raise HTTPException(status_code=404, detail={"code": code, "message": "Repo not found. Check the URL and make sure it's public."})
        raise HTTPException(status_code=400, detail={"code": code, "message": "GitHub fetch failed."})

    file_paths = result["paths"]
    file_list  = [{"path": p} for p in file_paths]

    graph_data = await spectra_brain.map_architecture(file_list, repo_url=request.url)

    if not graph_data:
        fallback = dna_ingestor.build_fallback_map(request.url, file_paths)
        return {"status": "fallback", "graph": fallback}

    return {"status": "success", "graph": graph_data}


@app.post("/explain")
async def explain_node(request: ExplainRequest):
    """
    Called when a user clicks a node on the canvas.
    Returns a rich, newcomer-friendly breakdown of that specific component.
    """
    # Re-fetch the file tree for context (cached by OS in practice)
    result = await dna_ingestor.fetch_repo_structure(request.repo_url)
    file_list = [{"path": p} for p in result.get("paths", [])] if "paths" in result else []

    repo_name = request.repo_url.rstrip("/").split("/")[-1].upper()

    explanation = await spectra_brain.explain_node(
        node_label=request.node_label,
        node_description=request.node_description,
        node_layer=request.node_layer,
        node_tier=request.node_tier,
        repo_name=repo_name,
        file_list=file_list,
    )
    return explanation


@app.post("/chat")
async def chat_with_sentinel(request: ChatRequest):
    result = await dna_ingestor.fetch_repo_structure(request.repo_url)
    file_list = [{"path": p} for p in result.get("paths", [])] if "paths" in result else []
    answer = await spectra_brain.chat_with_repo(request.message, file_list)
    return {"answer": answer}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)