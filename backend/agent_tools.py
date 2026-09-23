"""
agent_tools.py -- Phase B: bounded agentic loop on top of Phase A retrieval.
Model decides which tool to call, up to MAX_STEPS. No new fetch/embed logic
lives here -- it all calls back into retrieval.py.
"""

import json
import logging
import asyncio

from retrieval import retrieval_store

logger = logging.getLogger("agent_tools")

MAX_STEPS = 6

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "search_code",
            "description": "Semantic search over the repo's file contents for a concept or question.",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read the full content of one specific file when you already know its exact path.",
            "parameters": {
                "type": "object",
                "properties": {"path": {"type": "string"}},
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_directory",
            "description": "List files under a path prefix to explore repo structure before reading.",
            "parameters": {
                "type": "object",
                "properties": {"prefix": {"type": "string"}},
                "required": ["prefix"],
            },
        },
    },
]


async def _execute_tool(name, args, repo_url, owner, repo, file_list):
    if name == "search_code":
        chunks = await retrieval_store.get_relevant_chunks(repo_url, args.get("query", ""), file_list)
        return "\n\n".join(f"# {p}\n{t}" for p, t in chunks) if chunks else "No relevant code found."

    if name == "read_file":
        path = args.get("path", "")
        content = await retrieval_store.fetch_file_content(owner, repo, path)
        return content if content else f"Could not read {path} (not found or not text)."

    if name == "list_directory":
        prefix = args.get("prefix", "")
        matches = [p for p in file_list if p.startswith(prefix)]
        return "\n".join(matches[:100]) if matches else f"Nothing found under '{prefix}'."

    return f"Unknown tool: {name}"


async def run_agentic_chat(groq_client, question: str, repo_url: str, file_list: list) -> str:
    owner, repo = retrieval_store.parse_owner_repo(repo_url)
    messages = [
        {
            "role": "system",
            "content": (
                "You are Sentinel, a codebase guide. Use tools to look at actual code before "
                "answering. Prefer search_code first; use read_file once you know the exact path; "
                "use list_directory only to explore structure."
            ),
        },
        {"role": "user", "content": question},
    ]

    tool_call_count = 0
    stop_notice_sent = False

    for step in range(MAX_STEPS):
        forced_stop = tool_call_count >= 2

        if forced_stop and not stop_notice_sent:
            messages.append({
                "role": "user",
                "content": (
                    "You have gathered enough context above. Do not call any more tools. "
                    "Answer the original question now, in plain text, using only the tool "
                    "results already shown."
                ),
            })
            stop_notice_sent = True

        try:
            response = await asyncio.to_thread(
                groq_client.chat.completions.create,
                model="qwen/qwen3.8-27b",
                messages=messages,
                tools=TOOL_SCHEMAS,
                tool_choice="none" if forced_stop else "auto",
                temperature=0.3,
            )
        except Exception as e:
            print(f"[DEBUG] step {step} Groq call failed: {type(e).__name__}: {e}")
            if "output_parse_failed" in str(e) and step < MAX_STEPS - 1:
                print(f"[DEBUG] step {step}: retrying once after parse failure")
                continue
            return "Sorry, I couldn't process that question right now -- please try again."

        msg = response.choices[0].message
        tool_calls = getattr(msg, "tool_calls", None)
        print(f"[DEBUG] step {step}: tool_calls={tool_calls}")

        if not tool_calls:
            content = (msg.content or "").strip()
            if forced_stop and content.startswith("<tool_call>"):
                print(f"[DEBUG] step {step}: model faked a tool call as text even when forced_stop, giving up")
                return "I found relevant code but couldn't produce a clean answer -- try rephrasing your question."
            print(f"[DEBUG] step {step}: final answer content={content!r}")
            return content or "I don't have an answer for that."

        messages.append({"role": "assistant", "content": msg.content, "tool_calls": tool_calls})

        for call in tool_calls:
            try:
                args = json.loads(call.function.arguments)
            except Exception as e:
                print(f"[DEBUG] arg parse failed: {e}")
                args = {}
            print(f"[DEBUG] step {step}: calling {call.function.name} with {args}")
            try:
                result = await _execute_tool(call.function.name, args, repo_url, owner, repo, file_list)
            except Exception as e:
                import traceback
                print(f"[DEBUG] tool execution failed: {type(e).__name__}: {e}")
                traceback.print_exc()
                result = f"Tool error: {type(e).__name__}"
            tool_call_count += 1
            print(f"[DEBUG] step {step}: {call.function.name} result length={len(result)}")
            messages.append({"role": "tool", "tool_call_id": call.id, "content": result[:3000]})

    return "I looked through several parts of the repo but couldn't settle on a confident answer -- try rephrasing."
