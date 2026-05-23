import httpx
import os
from dotenv import load_dotenv

load_dotenv()

class DNAIngestor:
    def __init__(self):
        self.token = os.getenv("GITHUB_TOKEN")
        self.headers = {"Accept": "application/vnd.github.v3+json"}
        if self.token:
            self.headers["Authorization"] = f"token {self.token}"
            print("INFO: GitHub Token Authenticated.")
        else:
            print("WARNING: No GitHub Token found. Rate limits will be restricted (60/hr).")

    def parse_url(self, url: str):
        clean_url = url.replace("https://github.com/", "").strip("/")
        parts = clean_url.split("/")
        if len(parts) < 2:
            raise ValueError("Invalid URL. Use format: owner/repo")
        return parts[0], parts[1]

    async def fetch_repo_structure(self, repo_url: str):
        try:
            owner, name = self.parse_url(repo_url)
            tree_data = None
            async with httpx.AsyncClient(timeout=20.0) as client:
                for branch in ["main", "master"]:
                    api_url = f"https://api.github.com/repos/{owner}/{name}/git/trees/{branch}?recursive=1"
                    response = await client.get(api_url, headers=self.headers)
                    if response.status_code == 200:
                        tree_data = response.json().get("tree", [])
                        break
            
            if not tree_data:
                return {"error": "Repository not found or rate limit exceeded."}
            
            return [{"path": f["path"], "type": f["type"]} for f in tree_data 
                    if not any(x in f["path"] for x in [".git/", "node_modules/", "dist/"])]
        except Exception as e:
            return {"error": str(e)}

dna_ingestor = DNAIngestor()