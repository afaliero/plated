## Git Workflow

- **Trigger word / command:** When the user types "commit" or explicitly asks to commit changes, treat this as a directive to stage, commit, and push everything. Requests to document or edit this workflow do not themselves trigger a commit.
- **Safety Pre-Check:** Before execution, inspect the existing staged diff, unstaged changes, and untracked files that `git add .` would include. Verify that no sensitive data (e.g., raw API keys, passwords, `.env` file updates, or hardcoded secrets) would be staged. If secrets are detected, abort the process and warn the user without reproducing the secret values. Do not force-add ignored files.
- **Action:** If safe, automatically execute the following from the repository root:

  ```bash
  git add . && git commit -m "<concise summary of changes>" && git push
  ```

- **Message format:** Keep the summary sharp, imperative (e.g., "Add auth context", not "Added auth context"), and under 60 characters.
- **Confirmation:** Do not ask for user confirmation before pushing unless there are upstream merge conflicts. If a push encounters upstream conflicts, stop and ask the user how to proceed; do not force-push.
