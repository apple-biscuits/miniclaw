---
name: file-operations
description: Advanced file operations including backup, copy, and move. Use when user needs to backup files, copy files between locations, or move/rename files.
version: 1.0.0
author: miniclaw
tags: ["file", "utility", "operations"]
---

# File Operations Skill

This skill provides advanced file operation capabilities for managing files in the filesystem.

## When to Use

Use this skill when the user needs to:
- Create backups of important files
- Copy files from one location to another
- Move or rename files
- Manage file organization

## Available Operations

### Backup Files
Create a backup copy of a file with a customizable suffix.

**Example Usage:**
```
backup_file(file_path="src/main.ts", backup_suffix=".bak")
```

### Copy Files
Duplicate a file from source to destination.

**Example Usage:**
```
copy_file(source="config.json", destination="config.backup.json")
```

### Move Files
Move or rename a file.

**Example Usage:**
```
move_file(source="old_name.txt", destination="new_name.txt")
```

## Best Practices

1. **Always verify file paths** before performing operations
2. **Use meaningful backup suffixes** (.bak, .backup, .old)
3. **Check if destination exists** before copying/moving
4. **Preserve file permissions** when possible

## Error Handling

If an operation fails:
- Report the specific error
- Suggest alternative approaches
- Verify file permissions and disk space

## Notes

- These operations work on the local filesystem
- Ensure you have write permissions in target directories
- Be cautious with move operations as they modify the original file
