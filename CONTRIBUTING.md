# Contributing to Automagik Forge

Thank you for your interest in contributing to Automagik Forge! We welcome contributions from the community and are excited to have you as part of our journey to make AI-assisted development more structured and reliable.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Guidelines](#development-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Communication](#communication)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for everyone. By participating in this project, you agree to:

- Be respectful and considerate in your communications
- Accept constructive criticism gracefully
- Focus on what is best for the community and project
- Show empathy towards other community members

Unacceptable behavior includes harassment, trolling, or any form of discriminatory language or actions. Violations may result in temporary or permanent exclusion from the project.

---

## Getting Started

### Before You Start

1. **Read the Documentation**
   - [README.md](README.md) - Project overview and features
   - [DEVELOPER.md](DEVELOPER.md) - Development setup and architecture
   - [Roadmap](https://github.com/orgs/namastexlabs/projects/9/views/1?filterQuery=project%3Aforge) - Current initiatives and planned features

2. **Set Up Your Development Environment**
   - Follow the instructions in [DEVELOPER.md](DEVELOPER.md)
   - Ensure all tests pass before making changes
   - Familiarize yourself with the codebase structure

3. **Join the Community**
   - [Discord](https://discord.gg/xcW8c7fF3R) - Ask questions and discuss ideas
   - [GitHub Issues](https://github.com/namastexlabs/automagik-forge/issues) - Report bugs and request features

---

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

#### 🐛 Bug Reports
Found a bug? Please report it! Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots or error logs if applicable

#### ✨ Feature Requests
Have an idea? We'd love to hear it! Before requesting:
- Check if it aligns with our [roadmap](https://github.com/orgs/namastexlabs/projects/9/views/1?filterQuery=project%3Aforge)
- Search existing issues to avoid duplicates
- Explain the use case and why it would benefit users

#### 📝 Documentation Improvements
- Fix typos or clarify existing docs
- Add examples or tutorials
- Improve API documentation
- Translate documentation (future)

#### 💻 Code Contributions
- Bug fixes
- Feature implementations
- Performance improvements
- Test coverage improvements
- Refactoring (with clear justification)

#### 🎨 Design Contributions
- UI/UX improvements
- Icon or logo designs
- Mockups for new features

---

## Development Guidelines

### Alignment with Project Vision

**Before starting work**, please ensure your contribution aligns with:

1. **Vibe Coding++™ Philosophy**
   - Human orchestration, not AI automation
   - Structured task management over chat-based workflows
   - Code understanding over code generation

2. **Project Roadmap**
   - Check our [public roadmap](https://github.com/orgs/namastexlabs/projects/9/views/1?filterQuery=project%3Aforge)
   - Discuss larger features in an issue first
   - Ensure your work doesn't conflict with planned initiatives

3. **Simplicity and Maintainability**
   - Prefer simple solutions over complex ones
   - Follow existing code patterns
   - Write self-documenting code with clear naming

### Code Standards

#### Rust Code

- **Format**: Run `cargo fmt --all` before committing
- **Lint**: Ensure `cargo clippy --all --all-targets --all-features -- -D warnings` passes
- **Tests**: Add tests for new functionality
- **Documentation**: Add rustdoc comments for public APIs
- **Error Handling**: Use `Result` and `?` operator appropriately

#### TypeScript/React Code

- **Format**: Run `npm run format:check` before committing
- **Lint**: Ensure `npm run lint` passes
- **Types**: No `any` types (use proper TypeScript types)
- **Components**: Follow existing component patterns
- **Hooks**: Use React hooks appropriately
- **Accessibility**: Ensure components are accessible (ARIA labels, keyboard navigation)

#### General Practices

- **Commits**: Write clear, descriptive commit messages
  ```
  feat: add task filtering by executor
  fix: resolve worktree cleanup race condition
  docs: update MCP integration guide
  refactor: simplify event streaming logic
  ```
- **Comments**: Explain "why", not "what" (code should be self-documenting)
- **Dependencies**: Minimize new dependencies; justify any additions
- **Security**: Never commit secrets, API keys, or sensitive data

---

## Pull Request Process

### 1. Discuss First

For significant changes:
1. **Open an issue** describing the problem and proposed solution
2. **Wait for feedback** from maintainers
3. **Get approval** before starting implementation

This prevents wasted effort on changes that might not align with project direction.

### 2. Create Your Branch

```bash
# Start from dev branch
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. Make Your Changes

- Follow the [Development Guidelines](#development-guidelines)
- Write tests for new functionality
- Update documentation as needed
- Ensure all tests pass locally

### 4. Test Your Changes

```bash
# Run all checks
npm run check

# Test specific areas
cargo test --workspace          # Backend tests
cd frontend && npm run check    # Frontend tests
```

### 5. Commit Your Changes

```bash
git add .
git commit -m "feat: add your feature description"
```

Use conventional commit types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub:
- **Target branch**: `dev` (not `main`)
- **Title**: Clear, concise description
- **Description**: Include:
  - What changes were made
  - Why these changes were needed
  - Any breaking changes
  - Screenshots/GIFs for UI changes
  - Link to related issues

### 7. Code Review

- Respond to feedback promptly and professionally
- Make requested changes in new commits
- Update your PR description if scope changes
- Be patient - reviews may take time

### 8. Merge

Once approved and all checks pass:
- Maintainers will merge your PR
- Your contribution will be included in the next release
- You'll be credited in release notes

---

## Issue Guidelines

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check the roadmap** to see if it's already planned
3. **Try the latest version** - your issue may be fixed

### Creating a Bug Report

Use the bug report template (if available) and include:

```markdown
**Description**
Clear description of the bug

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen

**Actual Behavior**
What actually happened

**Environment**
- OS: [e.g., macOS 13.0, Ubuntu 22.04, Windows 11]
- Node.js version: [e.g., 18.17.0]
- pnpm version: [e.g., 8.6.0]
- Forge version: [e.g., 0.1.0]

**Logs/Screenshots**
Any relevant error messages or screenshots
```

### Creating a Feature Request

```markdown
**Problem**
What problem does this feature solve?

**Proposed Solution**
How would you like this to work?

**Alternatives Considered**
What other approaches did you consider?

**Additional Context**
Any mockups, examples, or additional information
```

---

## Communication

### Where to Communicate

- **GitHub Issues**: Bug reports, feature requests, and discussions
- **Discord**: Real-time chat, questions, and community discussion
- **Pull Requests**: Code review and implementation details
- **Email**: security@namastex.ai for security vulnerabilities (DO NOT open public issues for security issues)

### Communication Guidelines

- **Be respectful**: Treat everyone with kindness and respect
- **Be patient**: Maintainers are often volunteers with limited time
- **Be clear**: Provide context and details in your communications
- **Be constructive**: Focus on solutions, not just problems
- **Stay on topic**: Keep discussions relevant to the issue/PR at hand

---

## Recognition

We value all contributions! Contributors will be:

- Listed in release notes
- Credited in the repository
- Acknowledged in our community

Significant contributors may be invited to join the core team.

---

## Questions?

If you have questions not covered in this guide:

1. Check [DEVELOPER.md](DEVELOPER.md) for technical questions
2. Search [GitHub Issues](https://github.com/namastexlabs/automagik-forge/issues)
3. Ask in [Discord](https://discord.gg/xcW8c7fF3R)
4. Open a new issue with the "question" label

---

## License

By contributing to Automagik Forge, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for contributing to Automagik Forge! Together, we're building a better way for humans and AI to collaborate on code. 🚀
