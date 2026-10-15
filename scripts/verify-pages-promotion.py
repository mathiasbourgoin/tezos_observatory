#!/usr/bin/env python3
"""Promote only a main-ancestor tree with a successful, same-repository Quality run."""
import json
import os
import re
import subprocess
from pathlib import Path


def inputs(source_sha, run_id):
    if not re.fullmatch(r"[0-9a-fA-F]{40}", source_sha):
        raise ValueError("source_sha must be exactly 40 hexadecimal characters")
    if not re.fullmatch(r"[0-9]+", run_id):
        raise ValueError("quality_run_id must contain only digits")
    return source_sha.lower(), run_id


def quality_head(run, repository, run_id):
    if (run.get("event") != "push" or run.get("id") != int(run_id) or run.get("name") != "Quality"
            or run.get("path") != ".github/workflows/quality.yml"
            or run.get("status") != "completed" or run.get("conclusion") != "success"
            or run.get("repository", {}).get("full_name") != repository
            or run.get("head_repository", {}).get("full_name") != repository
            or run.get("head_repository", {}).get("fork") is not False):
        raise ValueError("Run must be successful push Quality from this repository, without a fork")
    head = run.get("head_sha", "")
    if not isinstance(head, str) or not re.fullmatch(r"[0-9a-fA-F]{40}", head):
        raise ValueError("Quality run has no exact head commit")
    return head.lower()


def git(*args):
    return subprocess.check_output(["git", *args], text=True).strip()


def verify_tree(source, head):
    subprocess.run(["git", "merge-base", "--is-ancestor", source, "origin/main"], check=True)
    tree = git("rev-parse", f"{source}^{{tree}}")
    if tree != git("rev-parse", f"{head}^{{tree}}"):
        raise ValueError("Source and successful Quality run must have identical whole Git trees")
    return tree


def main():
    source, run_id = inputs(os.environ["SOURCE_SHA"], os.environ["QUALITY_RUN_ID"])
    repository = os.environ["GITHUB_REPOSITORY"]
    run = json.loads(subprocess.check_output(
        ["gh", "api", f"repos/{repository}/actions/runs/{run_id}"], text=True))
    head = quality_head(run, repository, run_id)
    subprocess.run(["git", "fetch", "--no-tags", "origin",
                    "+refs/heads/main:refs/remotes/origin/main", source, head], check=True)
    tree = verify_tree(source, head)
    subprocess.run(["git", "checkout", "--detach", source], check=True)
    if git("rev-parse", "HEAD") != source:
        raise ValueError("Build checkout differs from the verified source")
    with Path(os.environ["GITHUB_OUTPUT"]).open("a") as output:
        output.write(f"source_sha={source}\nquality_head={head}\ntree={tree}\n")
    print(f"Verified source {source}; Quality run {run_id}, head {head}, whole tree {tree}")


if __name__ == "__main__":
    main()
