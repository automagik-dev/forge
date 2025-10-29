# Automagik Forge Product Roadmap

## Phase 0: Already Completed ✅

- [x] **Multi-agent orchestration** - Support for 8 AI coding agents (Claude, Cursor CLI, Gemini, Codex, Amp, OpenCode, Qwen, Claude Router)
- [x] **Kanban task management** - Persistent task board with visual context and screenshot attachments
- [x] **Git worktree isolation** - Each task attempt in isolated worktree, automatic cleanup
- [x] **MCP server implementation** - Built-in Model Context Protocol server with 6 tools
- [x] **Real-time progress streaming** - SSE for process logs and task diffs
- [x] **Multiple attempts per task** - Try different agents, compare results side-by-side
- [x] **Task templates** - Reusable patterns (code review, bug hunt, feature dev, refactor, documentation)
- [x] **Specialized agent prompts** - Custom prompts that work with any coding agent
- [x] **GitHub OAuth integration** - Device flow authentication and repository management
- [x] **Open-source foundation** - MIT licensed, self-hostable, no vendor lock-in

## Phase 1: Wish System & Genie Integration 🚀

**Goal:** Transform natural language wishes into structured epics with subtasks, add interactive AI assistant for UI navigation

**Success Criteria:**
- Users can create wishes via natural language
- Wishes automatically decompose into task breakdowns
- Genie assistant helps navigate UI and explain features
- Wish fulfillment tracking with progress metrics

### Features
- [ ] **Wish parser** - Natural language → epic decomposition - `Medium effort`
- [ ] **Epic hierarchy** - Parent/child task relationships with dependency management - `Medium effort`
- [ ] **Genie assistant** - Interactive AI guide for Forge UI and workflows - `Large effort`
- [ ] **Wish templates** - Common wish patterns (auth system, dashboard, API, etc.) - `Small effort`
- [ ] **Progress tracking** - Wish fulfillment metrics and completion prediction - `Medium effort`

### Dependencies
- Task hierarchy support in database schema
- React components for epic/subtask visualization
- Chat interface for Genie assistant

## Phase 2: Bilateral Sync & Integrations

**Goal:** Two-way sync with external project management tools

**Success Criteria:**
- Real-time sync with GitHub Issues, Jira, Notion, Linear
- Changes in Forge reflected in external tools and vice versa
- Conflict resolution for concurrent edits
- Webhook-based automation triggers

### Features
- [ ] **GitHub Issues sync** - Bidirectional task sync with GH Issues - `Large effort`
- [ ] **Jira integration** - Two-way sync with Jira tickets - `Large effort`
- [ ] **Notion sync** - Sync with Notion databases - `Medium effort`
- [ ] **Linear integration** - Bidirectional sync with Linear issues - `Medium effort`
- [ ] **Webhook automation** - Trigger external actions on task state changes - `Medium effort`

### Dependencies
- OAuth flows for each platform
- Webhook infrastructure for real-time updates
- Conflict resolution strategies

## Phase 3: Epics & Advanced Task Management

**Goal:** Hierarchical task organization with dependency management

**Success Criteria:**
- Multi-level task hierarchies (epics → stories → tasks → subtasks)
- Visual dependency graphs
- Critical path analysis
- Automatic status propagation

### Features
- [ ] **Task hierarchy** - Multi-level parent/child relationships - `Medium effort`
- [ ] **Dependency management** - Block/blocked-by relationships with cycle detection - `Large effort`
- [ ] **Visual dependency graph** - Interactive graph visualization of task relationships - `Medium effort`
- [ ] **Critical path analysis** - Identify bottlenecks and estimate completion - `Large effort`
- [ ] **Bulk operations** - Multi-select and batch task updates - `Small effort`

### Dependencies
- Graph algorithms for cycle detection
- React Flow or similar for visualization
- Database schema updates for relationships

## Phase 4: Agent Performance Analytics

**Goal:** Data-driven insights into which agents perform best for which task types

**Success Criteria:**
- Success/failure rates per agent and task type
- Performance benchmarks (speed, code quality, test coverage)
- Cost tracking per attempt and agent
- Recommendations for agent selection

### Features
- [ ] **Performance metrics** - Track success rate, duration, code quality per agent - `Large effort`
- [ ] **Cost tracking** - Monitor API usage and costs per agent/attempt - `Medium effort`
- [ ] **Agent recommendations** - Suggest best agent for task type based on history - `Large effort`
- [ ] **Visualization dashboard** - Charts and graphs for performance trends - `Medium effort`
- [ ] **Quality scoring** - Automated code quality assessment (lint, tests, coverage) - `Large effort`

### Dependencies
- Metrics collection infrastructure
- Cost calculation logic per AI provider
- ML model for agent recommendations (optional)

## Phase 5: Team Collaboration

**Goal:** Multi-user support with roles, permissions, and collaboration features

**Success Criteria:**
- Multiple users per project
- Role-based access control (admin, developer, viewer)
- Real-time collaboration features
- Activity feed and notifications

### Features
- [ ] **User management** - Invite/remove team members, role assignment - `Large effort`
- [ ] **Permissions system** - RBAC for projects, tasks, and settings - `Large effort`
- [ ] **Real-time collaboration** - See who's viewing/editing tasks live - `Medium effort`
- [ ] **Activity feed** - Timeline of project changes and updates - `Medium effort`
- [ ] **Notifications** - Task mentions, status changes, assignment alerts - `Medium effort`

### Dependencies
- Multi-user authentication system
- WebSocket infrastructure for real-time updates
- Database schema for permissions

## Phase 6: Community & Ecosystem

**Goal:** Build ecosystem of templates, extensions, and community contributions

**Success Criteria:**
- Template marketplace for common workflows
- Plugin system for custom executors and specialized agents
- Community template submissions and ratings
- Integration with third-party tools

### Features
- [ ] **Template marketplace** - Browse/install community task templates - `Large effort`
- [ ] **Plugin system** - Custom executor and agent extensions - `Large effort`
- [ ] **Template ratings** - Community voting and reviews - `Medium effort`
- [ ] **Third-party integrations** - Slack, Discord, email, SMS notifications - `Medium effort`
- [ ] **Community portal** - Share templates, discuss workflows, get help - `Large effort`

### Dependencies
- Plugin architecture and sandboxing
- Template packaging and distribution
- Community platform (forum, Discord)

## Phase 7: CI/CD Integration

**Goal:** Seamless integration with continuous integration and deployment pipelines

**Success Criteria:**
- Automatic task creation from CI failures
- Deploy task attempts to staging environments
- Integration with GitHub Actions, GitLab CI, CircleCI, Jenkins
- PR preview environments

### Features
- [ ] **CI failure detection** - Auto-create tasks from failing CI builds - `Medium effort`
- [ ] **Staging deployment** - Deploy task attempts to preview environments - `Large effort`
- [ ] **GitHub Actions integration** - Trigger workflows from Forge events - `Medium effort`
- [ ] **GitLab CI support** - Integration with GitLab pipelines - `Medium effort`
- [ ] **PR previews** - Automatic preview deploys for task attempts - `Large effort`

### Dependencies
- Webhook handlers for CI events
- Deployment infrastructure
- Provider-specific API integrations

## Success Metrics (Ongoing)

- **User Retention:** 70%+ monthly active user retention
- **Task Completion:** 80%+ tasks completed within planned timeframe
- **Agent Diversity:** Users try average 3+ different agents per week
- **Code Quality:** 90%+ task attempts pass quality gates before merge
- **Community Growth:** 100+ community-contributed templates within 6 months

## Risk Log (Actively Monitored)

- **Complexity creep:** Too many features may overwhelm users → mitigate with progressive disclosure and onboarding flows
- **Performance degradation:** Real-time features may slow down at scale → mitigate with caching, pagination, background jobs
- **Integration fragility:** External API changes may break syncs → mitigate with versioned APIs and graceful degradation
- **Community quality:** Low-quality templates may pollute marketplace → mitigate with rating system and moderation
- **Cost management:** High API usage from agents → mitigate with cost tracking, rate limits, and budget alerts
