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
    if (run.get("event") not in ("push", "pull_request") or run.get("id") != int(run_id) or run.get("name") != "Quality"
            or run.get("path") != ".github/workflows/quality.yml"
            or run.get("status") != "completed" or run.get("conclusion") != "success"
            or run.get("repository", {}).get("full_name") != repository
            or run.get("head_repository", {}).get("full_name") != repository
            or run.get("head_repository", {}).get("fork") is not False):
        raise ValueError("Run must be successful push/PR Quality from this repository, without a fork")
    head = run.get("head_sha", "")
    if not isinstance(head, str) or not re.fullmatch(r"[0-9a-fA-F]{40}", head):
        raise ValueError("Quality run has no exact head commit")
    return head.lower()


def git(*args):
    return subprocess.check_output(["git", *args], text=True).strip()


def tested_checkout(log):
    lines = log.splitlines()
    commits = []
    def checkout_line(line):
        parts = line.split("\t", 2)
        if len(parts) != 3 or parts[:2] != ["verify", "Run actions/checkout@v4"]:
            return None
        payload = parts[2].split(" ", 1)
        if len(payload) != 2 or not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]+)?Z", payload[0]):
            return None
        return payload[1]
    for index, line in enumerate(lines):
        if checkout_line(line) == "[command]/usr/bin/git log -1 --format=%H":
            value = checkout_line(lines[index + 1]) if index + 1 < len(lines) else None
            if value is None or not re.fullmatch(r"[0-9a-fA-F]{40}", value):
                raise ValueError("Checkout log has no unambiguous next-line commit")
            commits.append(value.lower())
    if len(commits) != 1:
        raise ValueError("Quality log must contain exactly one trusted checkout commit")
    return commits[0]


def verify_tree(source, tested, head, event):
    if event == "push" and tested != head:
        raise ValueError("Push checkout differs from the Quality head")
    if event == "pull_request":
        parents = git("rev-list", "--parents", "-n", "1", tested).split()[1:]
        if len(parents) != 2 or head not in parents:
            raise ValueError("PR checkout must be a merge with the Quality head as a parent")
    subprocess.run(["git", "merge-base", "--is-ancestor", source, "origin/main"], check=True)
    tree = git("rev-parse", f"{source}^{{tree}}")
    if tree != git("rev-parse", f"{tested}^{{tree}}"):
        raise ValueError("Source and actual tested checkout must have identical whole Git trees")
    return tree


def main():
    source, run_id = inputs(os.environ["SOURCE_SHA"], os.environ["QUALITY_RUN_ID"])
    repository = os.environ["GITHUB_REPOSITORY"]
    run = json.loads(subprocess.check_output(
        ["gh", "api", f"repos/{repository}/actions/runs/{run_id}"], text=True))
    head = quality_head(run, repository, run_id)
    attempt = run.get("run_attempt")
    if type(attempt) is not int or attempt < 1:
        raise ValueError("Quality run has no exact attempt")
    log = subprocess.check_output(["gh", "run", "view", run_id, "--repo", repository,
                                   "--attempt", str(attempt), "--log"], text=True)
    tested = tested_checkout(log)
    subprocess.run(["git", "fetch", "--no-tags", "origin",
                    "+refs/heads/main:refs/remotes/origin/main", source, head, tested], check=True)
    tree = verify_tree(source, tested, head, run["event"])
    subprocess.run(["git", "checkout", "--detach", source], check=True)
    if git("rev-parse", "HEAD") != source:
        raise ValueError("Build checkout differs from the verified source")
    with Path(os.environ["GITHUB_OUTPUT"]).open("a") as output:
        output.write(f"source_sha={source}\nquality_head={head}\ntested_checkout={tested}\nquality_attempt={attempt}\ntree={tree}\n")
    print(f"Verified source {source}; Quality run {run_id}, head {head}, tested checkout {tested}, attempt {attempt}, whole tree {tree}")


if __name__ == "__main__":
    main()
