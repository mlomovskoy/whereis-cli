# whereis

> Cursor tells you where the code is. **whereis** tells you where it is, who knows it, and what you'll break.

This repo starts as specs only. The implementation is generated in Cursor from:
- [specs/requirements.md](specs/requirements.md): what it does + acceptance tests
- [specs/design.md](specs/design.md): modules, algorithms, prompt
- [specs/tasks.md](specs/tasks.md): build order with a check per task

## Kickoff prompt for Cursor Agent
> Read specs/requirements.md, specs/design.md and specs/tasks.md. Implement specs/tasks.md one task at a time starting at T0 (which creates the project and the GitHub repo). After each task run its check, tick the box, commit and push. Stop and tell me if a check fails twice.
