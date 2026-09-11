## Git Workflow

- **Trigger word / command:** When the user types "commit" or explicitly asks to commit changes, treat this as a directive to stage, commit, and push everything. Requests to document or edit this workflow do not themselves trigger a commit.
- **Safety:** If the secret-scanning hook fails, stop and report the issue. Never bypass the hook. Do not force-add ignored `.env` files.
- **Action:** If safe, automatically execute the following from the repository root:

  ```bash
  git add . && git commit -m "<concise summary of changes>" && git push
  ```

- **Message format:** Keep the summary sharp, imperative (e.g., "Add auth context", not "Added auth context"), and under 60 characters.
- **Confirmation:** Do not ask for user confirmation before pushing unless there are upstream merge conflicts. If a push encounters upstream conflicts, stop and ask the user how to proceed; do not force-push.
