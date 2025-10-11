# Automagik Forge Mission

## Pitch

Automagik Forge is a Vibe Coding++™ platform that transforms AI-assisted development from chaotic chat sessions into structured, human-controlled task orchestration. It provides a persistent kanban board where developers plan work, experiment with multiple AI coding agents, review changes in isolated git worktrees, and ship code they actually understand.

## Users

### Primary Customers

- **Solo Developers:** Need structured AI assistance without losing control or understanding of their codebase
- **Small Development Teams:** Want to experiment with different AI agents, compare outputs, and maintain code quality
- **AI Power Users:** Seeking freedom from vendor lock-in with support for open-source models and multiple agent platforms

### User Personas

**The Pragmatic Developer**
- **Role:** Solo or small team lead building production applications
- **Context:** Uses AI coding tools but tired of mysterious code that breaks in two weeks
- **Pain Points:** Lost tasks in chat history, no experimentation framework, auto-applied changes without review, vendor lock-in to proprietary platforms
- **Goals:** Maintain kanban task board, try different AI agents per task, review all changes before merge, understand the code being shipped

**The AI Experimenter**
- **Role:** Developer exploring multiple AI coding platforms
- **Context:** Wants to compare Claude, Gemini, Cursor, open-source models on real tasks
- **Pain Points:** Switching between tools is clunky, can't compare outputs side-by-side, no persistence across sessions
- **Goals:** Run multiple attempts per task with different agents, see diffs in parallel, learn which agent works best for which task type

**The Self-Hosting Advocate**
- **Role:** Developer prioritizing control and avoiding vendor lock-in
- **Context:** Prefers open-source solutions, wants to run locally or self-host
- **Pain Points:** Proprietary platforms with usage-based pricing, no access to infrastructure, forced into specific AI models
- **Goals:** 100% open-source tooling, self-hostable on own infrastructure, freedom to use any AI model or API

## The Problem

### Vibe Coding Without Structure Creates Technical Debt

Developers love AI coding tools but suffer from "the 2-week curse" - code that works today mysteriously breaks tomorrow because they didn't understand what the AI built.

**Our Approach:** Vibe Coding++™ adds structure without killing creativity. Developers orchestrate via persistent kanban tasks, experiment with multiple AI agents in isolated worktrees, and review everything before shipping.

### Task Management Lost in Chat History

AI conversations are ephemeral. Tasks get lost, context disappears, and there's no way to track what was built or why.

**Our Approach:** Persistent kanban board where tasks live forever. Create them manually or via MCP from any AI agent. Visual context with screenshot attachments. Real-time progress streaming.

### One AI, One Approach, No Experimentation

Current tools lock you into a single AI agent. If it fails, you're stuck. No way to compare different approaches or learn which agent handles which task type best.

**Our Approach:** 8 AI coding agents (Claude, Cursor CLI, Gemini, Codex, OpenCode, Qwen, Amp, Claude Router) plus specialized agent prompts. Multiple attempts per task, each in isolated worktree. Compare results, choose the best.

### Vendor Lock-In and No Control

Proprietary platforms charge per usage, force specific models, don't allow self-hosting, and make code changes you can't review before they land.

**Our Approach:** 100% open-source, self-hostable, supports open-source AI models, git worktree isolation with human review gates before any merge.

## Differentiators

### Vibe Coding++™ - Human Orchestration, AI Execution

Not "AI automation" but "human control with AI power". You plan tasks, choose agents, experiment with attempts, review results, and decide what ships.

### Multi-Agent Experimentation Framework

Run the same task with Claude, Gemini, Cursor CLI, or open-source models. Compare outputs side-by-side in isolated git worktrees. Learn which agent excels at which task type.

### Persistent Task Kanban with MCP Integration

Tasks live in a real database, not chat history. Create/update tasks via MCP from any AI coding agent (Claude Code, Cursor, Cline, Roo Code, Gemini CLI). Visual context with screenshots attached to tasks.

### Git Worktree Isolation

Every task attempt runs in its own isolated git worktree. No conflicts, no accidental commits. Review diffs before merging. Clean PRs you actually understand.

### 100% Open Source, Self-Hostable, No Vendor Lock-In

MIT licensed. Run locally or self-host on your infrastructure. Use open-source AI models (OpenCode, Qwen) or bring your own API keys. No usage-based pricing, no cloud-only restrictions.

## Key Focus Areas

- **Task Orchestration:** Persistent kanban with visual context, templates, and MCP remote control
- **Multi-Agent Execution:** 8 AI coding agents, specialized prompts, multiple attempts per task
- **Git Worktree Management:** Isolated attempts, automatic cleanup, parallel execution support
- **Human Review Gates:** No commits without approval, understand code before shipping
- **Open Ecosystem:** Support open-source models, self-hosting, extensible architecture
- **Real-Time Visibility:** Live progress streaming, diff previews, agent performance analytics
