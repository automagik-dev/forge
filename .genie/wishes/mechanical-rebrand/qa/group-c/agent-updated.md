# Updated Upstream Update Agent

## Summary
Incorporated complete upstream sync workflow including fork synchronization, release tag creation, and gitmodule updates.

## Changes Made

### Agent File (.genie/agents/utilities/upstream-update.md)
- **Size**: 398 lines (up from 144 lines)
- **Description**: Updated from "Automate upstream version updates with mechanical rebranding" to "Sync fork, create release tag, update gitmodule, and apply mechanical rebranding"

### Workflow Phases (now 6 phases instead of 4)

#### Original Phases
1. Discovery
2. Update
3. Rebrand
4. Report

#### Updated Phases
1. **Discovery**
   - Verify current versions (upstream, fork, gitmodule)
   - Check for uncommitted changes in automagik-forge
   - Validate prerequisites (remotes, auth, gh CLI)

2. **Fork Sync** (NEW)
   - Setup upstream remote (BloopAI/vibe-kanban)
   - Fetch latest from upstream
   - Identify latest upstream release tag
   - Hard reset fork to upstream/main
   - Force push to namastexlabs/vibe-kanban

3. **Release Creation** (NEW)
   - Determine namastex tag name (e.g., v0.0.106-namastex)
   - Create release on namastexlabs/vibe-kanban
   - Verify release exists

4. **Gitmodule Update** (NEW)
   - Navigate to automagik-forge upstream/ directory
   - Fetch new tags from fork
   - Checkout new namastex tag
   - Return to automagik-forge root

5. **Mechanical Rebrand** (enhanced)
   - Execute rebrand script
   - Verify zero vibe-kanban references
   - Confirm build success

6. **Report** (enhanced)
   - List changes made
   - Provide commit instructions
   - Note any issues

### New Prerequisites Section
- **Upstream remote**: Must point to https://github.com/BloopAI/vibe-kanban.git
- **Fork access**: Push access to namastexlabs/vibe-kanban
- **GitHub CLI**: `gh` must be authenticated
- **Clean working tree**: No uncommitted changes in automagik-forge

### New Command Sections

#### Phase 2: Fork Sync Commands
- Setup upstream remote
- Fetch latest from upstream
- Identify latest upstream release
- Hard reset to upstream main
- Force push to fork

#### Phase 3: Release Creation Commands
- Determine tag name (convert upstream tag to namastex format)
- Create annotated tag
- Push tag to fork
- Create GitHub release with `gh` CLI
- Verify release exists

#### Phase 4: Gitmodule Update Commands
- Navigate to upstream/ submodule
- Fetch new tags from fork
- Checkout namastex tag
- Return to root
- Verify version

### Enhanced Success Criteria

#### Fork Sync
- ✅ Fork exactly mirrors upstream BloopAI/vibe-kanban
- ✅ `git diff upstream/main` shows no differences
- ✅ Force push to namastexlabs/vibe-kanban succeeded

#### Release Creation
- ✅ Namastex tag created (e.g., v0.0.106-namastex)
- ✅ GitHub release exists on namastexlabs/vibe-kanban
- ✅ Release notes reference upstream tag

#### Gitmodule Update
- ✅ automagik-forge upstream/ submodule points to namastex tag
- ✅ `git describe --tags` in upstream/ shows correct tag

#### Mechanical Rebrand
- ✅ Zero vibe-kanban references in upstream/ and frontend/
- ✅ Application builds successfully (cargo check + pnpm check pass)
- ✅ Changes staged and ready for commit

### New Error Handling Sections
- Upstream remote missing (in fork)
- Tag already exists
- GitHub CLI not authenticated

### New Repository Context Section
Explains the two-repository workflow:
- **Fork Repository (namastexlabs/vibe-kanban)**: Unmodified mirror with namastex tags
- **automagik-forge Repository**: Uses fork as submodule, applies rebrand

### Updated Evidence Collection
New artifacts to collect:
- `fork-sync.log` - Fork synchronization output
- `release-created.txt` - Release tag and GitHub release details
- `upstream-version.txt` - Current and target versions
- `rebrand-output.log` - Rebrand script execution
- `verification.log` - Build and reference count checks
- `git-diff.txt` - Changes made by rebrand and submodule update

### Important Notes Section
- **Fork Operations**: Always use `--force` when pushing to namastexlabs/vibe-kanban
- **Tag Format**: Namastex tags follow pattern: `v{VERSION}-namastex`
- **No Local Changes**: Fork should never have local modifications
- **Submodule Pointer**: automagik-forge upstream/ must point to namastex tag, not upstream tag
- **Verification Critical**: Always verify zero vibe-kanban references and build success

### Updated Total Time
- Original: ~2 minutes
- Updated: ~3-5 minutes (more accurate for complete workflow)

## Key Improvements

1. **Complete Workflow**: Now covers entire upstream sync process, not just rebrand
2. **Two-Repository Awareness**: Explicitly handles fork and forge repos
3. **Tag Management**: Creates namastex-tagged releases for tracking
4. **GitHub Integration**: Uses `gh` CLI for release creation
5. **Better Error Handling**: Covers fork-specific scenarios
6. **Repository Context**: Explains the architecture and purpose of each repo
7. **Comprehensive Verification**: Multiple checkpoints across workflow phases

## Verification

✅ Agent file updated to 398 lines
✅ All 6 workflow phases documented with commands
✅ Prerequisites, success criteria, and error handling complete
✅ Repository context explains two-repo architecture
✅ Evidence collection paths updated
✅ Usage examples include full workflow
✅ Time estimate updated to 3-5 minutes
