# Services Layer

This CLI uses a small layered service architecture:

- `api/` - Thin adapters around generated SDK calls. No file-system side effects.
- `project/` - Local workspace file and sync operations.
- `storage/` - External storage integrations (Supabase).
- `workflows/` - Orchestration that combines API + project concerns for commands.

Guidelines:

- Keep command handlers focused on input/output flow.
- Put endpoint-specific calls in `api/` with typed return values.
- Put cross-cutting orchestration in `workflows/`.
- Keep local file mutations in `project/`.
