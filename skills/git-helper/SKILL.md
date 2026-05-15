---
name: git-helper
description: Git operations helper for checking status, viewing commit history, and comparing changes. Use when user needs to work with Git repositories.
version: 1.0.0
author: miniclaw
tags: ["git", "version-control", "development"]
---

# Git Helper Skill

This skill provides essential Git operations for managing version control workflows.

## When to Use

Use this skill when the user needs to:
- Check the current state of a Git repository
- View commit history and logs
- Compare changes between commits or branches
- Understand what has changed in the codebase

## Available Operations

### Check Repository Status
View the current state of the working directory and staging area.

**Example Usage:**
```
git_status(repo_path=".")
```

**Returns:**
- Modified files
- Staged files
- Untracked files
- Current branch

### View Commit History
Display recent commits with messages and authors.

**Example Usage:**
```
git_log(repo_path=".", max_count=10)
```

**Parameters:**
- `repo_path`: Path to the Git repository (default: current directory)
- `max_count`: Number of commits to show (default: 10)

### Compare Changes
Show differences between commits, branches, or files.

**Example Usage:**
```
git_diff(repo_path=".", target="HEAD~1")
git_diff(repo_path=".", target="main..feature-branch")
```

**Common Targets:**
- `HEAD~1`: Previous commit
- `branch1..branch2`: Differences between branches
- `filename`: Changes to a specific file

## Best Practices

1. **Always check status first** before making changes
2. **Use meaningful commit counts** (5-20 is usually sufficient)
3. **Specify clear diff targets** to get relevant changes
4. **Review changes carefully** before committing

## Common Workflows

### Review Recent Changes
```
1. git_status() - See what's modified
2. git_log(max_count=5) - Check recent commits
3. git_diff(target="HEAD~1") - Review last commit's changes
```

### Compare Branches
```
1. git_status() - Ensure clean working directory
2. git_diff(target="main..feature") - See feature branch changes
```

## Error Handling

If Git commands fail:
- Verify the directory is a Git repository
- Check Git is installed and in PATH
- Report specific error messages
- Suggest initializing repo if needed (`git init`)

## Notes

- All operations are read-only (no commits or pushes)
- Works with any Git repository on the local filesystem
- Large diffs may be truncated for readability
- Consider using `--stat` for summary views of large changes
