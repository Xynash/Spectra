import os
import json
import re
import asyncio
from google import genai
from dotenv import load_dotenv

load_dotenv()

class SpectraBrain:
    def __init__(self):
        self.keys = [os.getenv(f"GOOGLE_API_KEY_{i}") for i in range(1, 10) if os.getenv(f"GOOGLE_API_KEY_{i}")]
        self.current_key_index = 0
        self.model_id = "gemini-2.0-flash"
        self._init_client()

    def _init_client(self):
        if not self.keys: return
        self.client = genai.Client(api_key=self.keys[self.current_key_index])

    def _extract_json(self, raw_text: str):
        try:
            match = re.search(r'(\{.*\})', raw_text, re.DOTALL)
            return json.loads(match.group(1)) if match else None
        except: return None

    async def map_architecture(self, file_list, repo_url=""):
        # We give the AI deeper folder paths to ensure granularity
        logic_dna = [f["path"] for f in file_list if f["path"].count('/') <= 2]
        files_summary = "\n".join(logic_dna[:150])
        
        prompt = f"""
        ACT AS: A Senior Solutions Architect.
        TASK: Perform a DEEP GRANULAR DECOMPOSITION of this repository.
        
        ARCHITECTURE RULES:
        1. HIERARCHY: Construct a 4-Tier Vertical Tree.
        2. TIER 1 (ROOT): Project Core Mission. (y=0, x=1000)
        3. TIER 2 (DOMAINS): Find 4-5 distinct functional pillars (e.g. 'Mesh-Adapters', 'Server-Runtime', 'UI-Console', 'API-Gateway'). (y=400, spread x wide)
        4. TIER 3 (SUB-MODULES): For each Pillar, find 2 granular sub-components. (y=800, align with parents)
        5. TIER 4 (DNA): Specific code entry points. (y=1200)

        OUTPUT RULES:
        - NEVER use words like 'Logic' or 'Silo'. Use the REAL names from the files.
        - Total nodes must be between 14-20.

        OUTPUT FORMAT: Strict JSON only.
        {{
          "nodes": [ {{ "id": "r", "data": {{ "label": "NAME", "layer": "core", "description": "Goal" }}, "position": {{ "x": 1000, "y": 0 }} }} ],
          "edges": [ {{ "id": "e1", "source": "r", "target": "m1", "label": "ORCHESTRATES", "animated": true }} ]
        }}

        FILES:
        {files_summary}
        """

        for _ in range(len(self.keys)):
            try:
                response = await asyncio.to_thread(self.client.models.generate_content, model=self.model_id, contents=prompt)
                return self._extract_json(response.text)
            except Exception as e:
                if "429" in str(e) and self.current_key_index < len(self.keys) - 1:
                    self.current_key_index += 1
                    self._init_client()
                    continue
                return None
        return None

spectra_brain = SpectraBrain()