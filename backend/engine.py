"""
engine.py -- Spectra AI brain. Builds prompts, calls Groq and Gemini,
validates their output, lays out the graph, and (via agent_tools.py)
runs the agentic chat.
"""

import os
import re
import json
import asyncio
import logging

from dotenv import load_dotenv
from groq import Groq
from google import genai

from agent_tools import run_agentic_chat

load_dotenv()

logger = logging.getLogger("engine")


def _paths(file_list):
    """file_list items may be plain strings or {"path": "..."} dicts -- normalize to strings."""
    return [f["path"] if isinstance(f, dict) else f for f in file_list]

TIER_Y = {1: 0, 2: 220, 3: 900, 4: 1300}
NODE_WIDTH = 180
H_GAP = 24
MAX_PER_ROW = 6


def compute_tree_layout(raw_nodes, raw_edges):
    tiers = {}
    for node in raw_nodes:
        tiers.setdefault(node.get("data", {}).get("tier", 1), []).append(node)

    positioned = []
    for tier, nodes in sorted(tiers.items()):
        base_y = TIER_Y.get(tier, tier * 160)
        row_count = (len(nodes) + MAX_PER_ROW - 1) // MAX_PER_ROW
        for row in range(row_count):
            row_nodes = nodes[row * MAX_PER_ROW:(row + 1) * MAX_PER_ROW]
            total_width = len(row_nodes) * (NODE_WIDTH + H_GAP) - H_GAP
            start_x = -total_width / 2
            y = base_y + row * (140)
            for i, node in enumerate(row_nodes):
                node["position"] = {"x": start_x + i * (NODE_WIDTH + H_GAP), "y": y}
                positioned.append(node)
    return positioned


def build_edge_id(source, target, idx):
    return f"e-{source}-{target}-{idx}"


class SpectraBrain:
    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        self.keys = [v for k, v in os.environ.items() if k.startswith("GOOGLE_API_KEY_") and v]
        self._key_idx = 0
        self.model_id = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
        self.client = None
        if self.keys:
            self._init_client()

    def _init_client(self):
        self.client = genai.Client(api_key=self.keys[self._key_idx])

    def _rotate_key(self):
        self._key_idx += 1
        if self._key_idx >= len(self.keys):
            return False
        self._init_client()
        return True

    def _extract_json(self, raw_text: str):
        text = re.sub(r"```json|```", "", raw_text).strip()
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise ValueError("No JSON object found in model output")
        return json.loads(match.group(0))

    def _validate_graph(self, raw: dict) -> bool:
        nodes = raw.get("nodes", [])
        edges = raw.get("edges", [])
        if len(nodes) < 3 or len(edges) < 2:
            return False
        for node in nodes:
            if "id" not in node or "data" not in node:
                return False
            if not all(k in node["data"] for k in ("label", "tier")):
                return False
        return True

    def _build_prompt(self, files_summary: str, repo_name: str) -> str:
        return f"""You are a senior engineer explaining the codebase "{repo_name}" to a new hire.

Here is the pruned file list:
{files_summary}

Return ONLY a JSON object with this exact shape:
{{
  "nodes": [
    {{"id": "root", "data": {{"label": "{repo_name}", "tier": 1, "layer": "core", "description": "..."}}}},
    {{"id": "domain_1", "data": {{"label": "...", "tier": 2, "layer": "...", "description": "..."}}}},
    {{"id": "subsystem_1", "data": {{"label": "...", "tier": 3, "layer": "...", "description": "..."}}}},
    {{"id": "file_1", "data": {{"label": "...", "tier": 4, "layer": "...", "description": "..."}}}}
  ],
  "edges": [
    {{"source": "root", "target": "domain_1"}}
  ]
}}

Rules:
- Tier 1: exactly one root node (the whole repo).
- Tier 2: 3-6 major domains.
- Tier 3: subsystems under each domain.
- Tier 4: key entry-point files only, not every file.
- "layer" must be one of: core, logic, api, infra, ui, entry.
- No prose outside the JSON. No markdown fences.
"""

    async def map_architecture(self, file_list, repo_url):
        repo_name = repo_url.rstrip("/").split("/")[-1]
        shallow_files = _paths(file_list)[:150]
        files_summary = "\n".join(shallow_files)
        prompt = self._build_prompt(files_summary, repo_name)

        for attempt in range(2):
            try:
                response = await asyncio.to_thread(
                    self.groq_client.chat.completions.create,
                    model="openai/gpt-oss-120b",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.2,
                    max_tokens=4096,
                )
                choice = response.choices[0]
                logger.info(
                    "Groq attempt %d: finish_reason=%s completion_tokens=%s",
                    attempt + 1,
                    choice.finish_reason,
                    getattr(response.usage, "completion_tokens", "unknown"),
                )
                raw = self._extract_json(choice.message.content)
                if self._validate_graph(raw):
                    return self._process_revelation(raw)
            except Exception as e:
                logger.warning("Groq attempt %d failed: %s", attempt + 1, type(e).__name__)

        if self.client:
            while True:
                try:
                    response = await asyncio.to_thread(
                        self.client.models.generate_content,
                        model=self.model_id,
                        contents=prompt,
                    )
                    raw = self._extract_json(response.text)
                    if self._validate_graph(raw):
                        return self._process_revelation(raw)
                    break
                except Exception as e:
                    msg = str(e)
                    if ("429" in msg or "RESOURCE_EXHAUSTED" in msg) and self._rotate_key():
                        continue
                    logger.warning("Gemini attempt failed: %s", type(e).__name__)
                    break

        return None

    def _process_revelation(self, raw: dict) -> dict:
        nodes = compute_tree_layout(raw["nodes"], raw["edges"])
        edges = [
            {**edge, "id": build_edge_id(edge["source"], edge["target"], idx)}
            for idx, edge in enumerate(raw["edges"])
        ]
        return {"nodes": nodes, "edges": edges}

    async def explain_node(self, node_label, node_description, node_layer, node_tier, repo_name, file_list):
        paths = _paths(file_list)
        normalized = re.sub(r"[-_]", "", node_label.lower())
        matches = [f for f in paths if normalized in re.sub(r"[-_]", "", f.lower())]
        relevant_files = matches if matches else paths[:80]

        prompt = f"""You are explaining one part of the codebase "{repo_name}" to a newcomer.

Node: {node_label}
Existing short description: {node_description}
Layer: {node_layer}
Tier: {node_tier}

Relevant files:
{chr(10).join(relevant_files[:40])}

Return ONLY a JSON object with this exact shape:
{{
  "what_it_does": "...",
  "why_it_exists": "...",
  "how_it_works": "...",
  "who_uses_it": "...",
  "newcomer_start": "...",
  "key_files": ["..."],
  "complexity": "low|medium|high",
  "contribute_tip": "..."
}}
No prose outside the JSON. No markdown fences."""

        try:
            response = await asyncio.to_thread(
                self.groq_client.chat.completions.create,
                model="openai/gpt-oss-120b",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.3,
            )
            return self._extract_json(response.choices[0].message.content)
        except Exception as e:
            logger.warning("explain_node failed: %s", type(e).__name__)
            return {
                "what_it_does": node_description,
                "why_it_exists": "Not available right now.",
                "how_it_works": "Not available right now.",
                "who_uses_it": "Not available right now.",
                "newcomer_start": "Not available right now.",
                "key_files": relevant_files[:5],
                "complexity": "unknown",
                "contribute_tip": "Not available right now.",
            }

    async def chat_with_repo(self, question, file_list, repo_url=None):
        """Phase B: agentic tool-calling chat, grounded in real file content
        via agent_tools.py / retrieval.py."""
        if not repo_url:
            return "Missing repo context for this chat."
        return await run_agentic_chat(self.groq_client, question, repo_url, _paths(file_list))


spectra_brain = SpectraBrain()











