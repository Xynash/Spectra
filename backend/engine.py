import os
import json
import re
import asyncio
from google import genai
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# ─── Layout Engine ────────────────────────────────────────────────────────────
TIER_Y     = { 0: 0, 1: 420, 2: 840, 3: 1260 }
NODE_WIDTH = 340
H_GAP      = 60

def compute_tree_layout(raw_nodes: list, raw_edges: list):
    tiers = {0: [], 1: [], 2: [], 3: []}
    for n in raw_nodes:
        t = int(n.get("data", {}).get("tier", 1))
        if t in tiers:
            tiers[t].append(n)

    children_map = {}
    for e in raw_edges:
        children_map.setdefault(e["source"], []).append(e["target"])

    node_by_id = {n["id"]: n for n in raw_nodes}

    def layout_tier(tier_nodes, tier_idx, parent_positions=None):
        if not tier_nodes:
            return
        total_w = len(tier_nodes) * (NODE_WIDTH + H_GAP) - H_GAP
        start_x = 1000 - total_w / 2

        if parent_positions and tier_idx > 0:
            prev_tier = tiers[tier_idx - 1]
            ordered_children = []
            for parent in prev_tier:
                kids = [
                    node_by_id[cid]
                    for cid in children_map.get(parent["id"], [])
                    if cid in node_by_id
                ]
                ordered_children.extend(kids)
            ordered_children += [n for n in tier_nodes if n not in ordered_children]
            tier_nodes_ordered = ordered_children
        else:
            tier_nodes_ordered = tier_nodes

        x = start_x
        for n in tier_nodes_ordered:
            n["position"] = {"x": round(x), "y": TIER_Y[tier_idx]}
            x += NODE_WIDTH + H_GAP

    parent_pos = None
    for tier_idx in sorted(tiers.keys()):
        layout_tier(tiers[tier_idx], tier_idx, parent_pos)
        parent_pos = {n["id"]: n.get("position", {}) for n in tiers[tier_idx]}

    return raw_nodes


def build_edge_id(source, target, idx):
    return f"e_{source}_{target}_{idx}"


# ─── Spectra Brain ─────────────────────────────────────────────────────────────
class SpectraBrain:
    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        # Load all GOOGLE_API_KEY_1 … GOOGLE_API_KEY_N from .env
        self.keys = [
            os.getenv(f"GOOGLE_API_KEY_{i}")
            for i in range(1, 10)
            if os.getenv(f"GOOGLE_API_KEY_{i}")
        ]
        self.current_key_index = 0
        self.model_id = "gemini-2.0-flash"

        if self.keys:
            self._init_client()
        else:
            print("⚠️  No Gemini keys found. Groq-only mode.")
            self.client = None

    def _init_client(self):
        self.client = genai.Client(api_key=self.keys[self.current_key_index])

    def _rotate_key(self):
        """Advance to next Gemini key. Returns True if a new key is available."""
        if self.current_key_index < len(self.keys) - 1:
            self.current_key_index += 1
            self._init_client()
            print(f"🔄 Rotated to Gemini key {self.current_key_index + 1}/{len(self.keys)}")
            return True
        return False

    def _extract_json(self, raw_text: str):
        """Pull the first {...} block out of a response, even if wrapped in markdown."""
        try:
            # Strip ```json fences if present
            clean = re.sub(r"```(?:json)?", "", raw_text).strip("` \n")
            match = re.search(r"(\{.*\})", clean, re.DOTALL)
            return json.loads(match.group(1)) if match else None
        except Exception:
            return None

    def _validate_graph(self, raw: dict) -> bool:
        """Ensure the graph has the minimum valid shape before accepting it."""
        if not isinstance(raw, dict):
            return False
        nodes = raw.get("nodes", [])
        edges = raw.get("edges", [])
        if not isinstance(nodes, list) or len(nodes) < 3:
            return False
        if not isinstance(edges, list) or len(edges) < 2:
            return False
        # Every node must have id + data.label + data.tier
        for n in nodes:
            d = n.get("data", {})
            if not n.get("id") or not d.get("label") or d.get("tier") is None:
                return False
        return True

    def _build_prompt(self, files_summary: str, repo_name: str) -> str:
        return f"""You are a senior software architect. Analyze the file tree below and return ONLY a valid JSON object — no markdown, no explanation, no backticks.

REPO: {repo_name}
FILES:
{files_summary}

Return EXACTLY this JSON shape (fill in real values from the file tree):
{{
  "nodes": [
    {{"id": "root", "data": {{"label": "{repo_name}", "layer": "core",  "tier": 0, "description": "One sentence: what this repo does."}}}},
    {{"id": "d1",   "data": {{"label": "DOMAIN_ONE",  "layer": "logic", "tier": 1, "description": "What this domain handles."}}}},
    {{"id": "d2",   "data": {{"label": "DOMAIN_TWO",  "layer": "api",   "tier": 1, "description": "What this domain handles."}}}},
    {{"id": "s1",   "data": {{"label": "SUBSYSTEM_A", "layer": "api",   "tier": 2, "description": "What this subsystem does."}}}},
    {{"id": "s2",   "data": {{"label": "SUBSYSTEM_B", "layer": "infra", "tier": 2, "description": "What this subsystem does."}}}},
    {{"id": "e1",   "data": {{"label": "main.py",     "layer": "entry", "tier": 3, "description": "Entry point role."}}}},
    {{"id": "e2",   "data": {{"label": "server.py",   "layer": "entry", "tier": 3, "description": "Entry point role."}}}}
  ],
  "edges": [
    {{"source": "root", "target": "d1", "label": "CONTAINS"}},
    {{"source": "root", "target": "d2", "label": "CONTAINS"}},
    {{"source": "d1",   "target": "s1", "label": "USES"}},
    {{"source": "d2",   "target": "s2", "label": "MANAGES"}},
    {{"source": "s1",   "target": "e1", "label": "EXECUTES"}},
    {{"source": "s2",   "target": "e2", "label": "RUNS"}}
  ]
}}

Hard rules:
- Tier 0 → exactly 1 root node (the repo itself)
- Tier 1 → 3 to 5 major domains derived from actual top-level folders
- Tier 2 → 4 to 8 subsystems from real subfolders or logical groupings
- Tier 3 → 4 to 8 real entry-point files (main, index, server, app, cli, etc.)
- Labels must be UPPERCASE and use REAL names from the file tree
- "layer" must be one of: core · logic · api · infra · ui · entry
- Every edge source and target must match an existing node id
- Return ONLY the JSON object. Nothing else."""

    async def map_architecture(self, file_list: list, repo_url: str = "") -> dict | None:
        # ── Prepare file summary ──────────────────────────────────────────────
        # Only paths ≤ 2 levels deep to stay inside token limits
        logic_dna = [
            f["path"] for f in file_list
            if isinstance(f.get("path"), str) and f["path"].count("/") <= 2
        ]
        files_summary = "\n".join(logic_dna[:150])

        repo_name = (
            repo_url.rstrip("/").split("/")[-1].upper()
            if repo_url else "REPOSITORY"
        )

        prompt = self._build_prompt(files_summary, repo_name)

        # ── 1. Try Groq first ─────────────────────────────────────────────────
        try:
            completion = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=2048,
            )
            raw = json.loads(completion.choices[0].message.content)
            if self._validate_graph(raw):
                print(f"✅ Groq success — {len(raw['nodes'])} nodes, {len(raw['edges'])} edges")
                return self._process_revelation(raw)
            else:
                print("⚠️  Groq returned invalid shape — falling through to Gemini")
        except Exception as e:
            print(f"⚠️  Groq fail: {e}")

        # ── 2. Gemini key rotation ────────────────────────────────────────────
        if not self.client:
            print("❌ No Gemini keys configured — returning None")
            return None

        for attempt in range(len(self.keys)):
            try:
                print(f"🔮 Trying Gemini key {self.current_key_index + 1}/{len(self.keys)} …")
                response = await asyncio.to_thread(
                    self.client.models.generate_content,
                    model=self.model_id,
                    contents=prompt,
                )
                raw = self._extract_json(response.text)
                if raw and self._validate_graph(raw):
                    print(f"✅ Gemini key {self.current_key_index + 1} success — {len(raw['nodes'])} nodes")
                    return self._process_revelation(raw)
                else:
                    print(f"⚠️  Gemini key {self.current_key_index + 1} returned invalid shape")

            except Exception as e:
                err_str = str(e)
                print(f"⚠️  Gemini key {self.current_key_index + 1} error: {err_str}")
                is_quota = "429" in err_str or "RESOURCE_EXHAUSTED" in err_str
                if is_quota and self._rotate_key():
                    continue   # retry with next key
                # Non-quota error or no more keys
                break

        print("❌ All AI engines exhausted — returning None for smart fallback")
        return None

    def _process_revelation(self, raw: dict) -> dict:
        """Apply layout positions and canonical edge IDs."""
        raw["nodes"] = compute_tree_layout(raw["nodes"], raw.get("edges", []))
        for i, e in enumerate(raw.get("edges", [])):
            e["id"] = build_edge_id(e["source"], e["target"], i)
        return raw

    # ── Chat ──────────────────────────────────────────────────────────────────
    async def chat_with_repo(self, question: str, file_list: list) -> str:
        files_summary = "\n".join([f["path"] for f in file_list[:80]])
        prompt = (
            f"Repo context:\n{files_summary}\n\n"
            f"User Question: {question}\n"
            "Rules: technical, concise (2–3 sentences), helpful mentor tone."
        )
        try:
            completion = self.groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
            )
            return completion.choices[0].message.content
        except Exception as e:
            return f"The Sentinel is currently recalibrating its frequency. ({e})"


spectra_brain = SpectraBrain()