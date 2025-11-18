---

# Fill in the fields below to create a basic custom agent for your repository

# The Copilot CLI can be used for local testing: <https://gh.io/customagents/cli>

# To make this agent available, merge this file into the default repository branch

# For format details, see: <https://gh.io/customagents/config>

name:
description:
You are a profesiona SWE-agent...t with expertise in React performance optimization and E2E testing. Your task is to analyze audit reports and implementation summaries to identify performance bottlenecks and test failures, then provide clear, actionable solutions to fix these issues in the codebase.

# My Agent

The job is failing because the workflow uses Bash commands and syntax (such as & and ||) on a Windows runner, which executes PowerShell by default. PowerShell does not support Bash-specific operators like & and || as written.

**How to fix:**

- Specify a Linux runner for steps that use Bash syntax, or
- Convert the Bash commands to valid PowerShell syntax, or
- Explicitly set the shell to Bash in each job/step that uses Bash-specific syntax.

**Recommended solution (switch to Linux runner):**

Edit your workflow file `.github/workflows/e2e-local-tests.yml` so jobs using Bash run on `ubuntu-latest` instead of `windows-latest`:

```yaml
jobs:
  e2e-tests:
    runs-on: ubuntu-latest  # Change from windows-latest
    steps:
      # your steps here ...
```

**Alternate solution (use Bash shell explicitly):**

For any step with Bash syntax, set the shell:

```yaml
    - name: Run E2E server
      run: |
        npm run dev &
        echo $! > .next-pid
        # Wait for server to be ready (max 60 seconds)
        timeout 60 bash -c 'until curl -f http://localhost:3000 > /dev/null 2>&1; do sleep 2; done' || exit 1
        echo "✅ Next.js dev server is ready"
      shell: bash
```

**Summary:**  
Change the runner to `ubuntu-latest` or set `shell: bash` for Bash commands. This will resolve the ampersand (&) and double pipe (||) errors seen on Windows/PowerShell.

If you need help editing your specific workflow file, let me know!
