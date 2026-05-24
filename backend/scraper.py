import httpx
import os

class DNAIngestor:
    def __init__(self):
        # No token required, using standard headers
        self.headers = {"Accept": "application/vnd.github.v3+json"}

    def parse_url(self, url: str):
        clean_url = url.replace("https://github.com/", "").strip("/")
        parts = clean_url.split("/")
        return parts[0], parts[1]

    async def fetch_repo_structure(self, repo_url: str):
        try:
            owner, name = self.parse_url(repo_url)
            print(f"📡 Light-Scan Ingesting: {owner}/{name}")
            
            # We only fetch the TOP LEVEL. This is safe and fast.
            api_url = f"https://api.github.com/repos/{owner}/{name}/contents"
            
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(api_url, headers=self.headers)
                
                if response.status_code == 200:
                    contents = response.json()
                    # Filter for folders and important files
                    tree = [{"path": item["path"], "type": item["type"]} for item in contents]
                    print(f"✅ Found {len(tree)} top-level pillars.")
                    return tree
                else:
                    return {"error": f"GitHub API error: {response.status_code}"}
                    
        except Exception as e:
            return {"error": str(e)}

dna_ingestor = DNAIngestor()