import os
import json
import re
import asyncio
from google import genai
from dotenv import load_dotenv

load_dotenv()

class SpectraBrain:
    def __init__(self):
        # Initializing the modern Google GenAI Client
        self.client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
        self.model_id = "gemini-2.0-flash"

    def _extract_json(self, raw_text: str):
        """
        Uses Regex to find the JSON object. 
        This prevents crashes if Gemini adds conversational text.
        """
        try:
            # Find everything between the first '{' and the last '}'
            match = re.search(r'(\{.*\})', raw_text, re.DOTALL)
            if match:
                return json.loads(match.group(1))
            return None
        except Exception as e:
            print(f"JSON Extraction Failure: {e}")
            return None

    async def map_architecture(self, file_list):
        """
        Converts raw file structure into a 'Pure Segregation' 3-Tier Tree.
        """
        # 1. SMART FILTERING: Ignore noise to save tokens and focus the AI
        noise = [".png", ".jpg", ".svg", ".json", ".lock", ".md", ".yml", "node_modules", "vendor", ".git"]
        logic_dna = [f["path"] for f in file_list if not any(x in f["path"] for x in noise)]
        
        # Limit to 200 files for high-quality reasoning
        files_summary = "\n".join(logic_dna[:200])
        
        prompt = f"""
        ACT AS: A Senior System Architect & Technical Mentor.
        TASK: Perform a 'PURE SEGREGATION' of this repository DNA for a new developer.
        
        HIERARCHY & NAMING RULES:
        1. NO GENERIC NAMES: Do not use 'Logic Layer', 'Backend', or 'Core'. Use the ACTUAL domain names found in the code (e.g., 'Meshery Adapter', 'Auth Pipeline', 'Stream Handler').
        2. LEVEL 1 (Project Identity): The absolute core purpose. (x=600, y=0)
        3. LEVEL 2 (Segregated Modules): Identify 3-4 distinct sub-systems. (x=spread from 200 to 1000, y=300)
        4. LEVEL 3 (Entry Points): The specific file a student should open to understand each module. (x=align with parent, y=600)

        OUTPUT FORMAT: Strict JSON only.
        {{
          "nodes": [
            {{ "id": "root", "type": "default", "data": {{ "label": "DOMAIN_NAME", "layer": "core", "description": "The mission" }}, "position": {{ "x": 600, "y": 0 }} }},
            {{ "id": "m1", "type": "default", "data": {{ "label": "DOMAIN_MODULE", "layer": "logic", "description": "What it segregates" }}, "position": {{ "x": 200, "y": 300 }} }}
          ],
          "edges": [
            {{ "id": "e1", "source": "root", "target": "m1", "animated": true }}
          ]
        }}

        REPOSITORY DNA:
        {files_summary}
        """

        try:
            # Running the AI call asynchronously to prevent blocking the FastAPI loop
            # We use the 'aio' namespace for true async support
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model_id,
                contents=prompt
            )
            
            revelation = self._extract_json(response.text)
            
            if not revelation:
                raise ValueError("AI returned invalid architectural data")
                
            return revelation

        except Exception as e:
            print(f"Spectra Engine Failure: {str(e)}")
            # Robust Fallback: Returns a simplified structure so the UI never stays blank
            return {
                "nodes": [
                    {"id": "error", "type": "default", "data": {"label": "Engine Busy", "layer": "core", "description": "Gemini is currently recalibrating. Try again in 60s."}, "position": {"x": 600, "y": 0}}
                ],
                "edges": []
            }

spectra_brain = SpectraBrain()