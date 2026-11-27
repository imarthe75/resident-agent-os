"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { classifyCommand, filterCommandOutput } = require("../../scripts/hooks/command-filters");

test("pytest filter drops PASSED lines while keeping failures and summary", () => {
  const raw = [
    ...Array.from({ length: 30 }, (_, i) => `tests/test_mod.py::test_ok_${i} PASSED [ 90%]`),
    "tests/test_mod.py::test_broken FAILED [100%]",
    "AssertionError: expected 2 == 3",
    "1 failed, 30 passed in 0.42s",
  ].join("\n");
  const out = filterCommandOutput("pytest -v", raw);
  assert.ok(out.length < raw.length / 2);
  assert.match(out, /test_broken FAILED/);
  assert.match(out, /AssertionError/);
  assert.match(out, /1 failed, 30 passed/);
  assert.doesNotMatch(out, /test_ok_15 PASSED/);
});

test("git status and npm install noise are compacted while | cat stays raw", () => {
  const gitRaw = [
    "On branch main",
    "Changes not staged for commit:",
    '  (use "git add <file>..." to update what will be committed)',
    '  (use "git restore <file>..." to discard changes in working directory)',
    "\tmodified:   agent/cli.py",
  ].join("\n");
  const gitOut = filterCommandOutput("git status", gitRaw);
  assert.doesNotMatch(gitOut, /use "git add/);
  assert.match(gitOut, /agent\/cli\.py/);
  assert.equal(filterCommandOutput("git status | cat", gitRaw), gitRaw);

  const pipRaw = [
    "Collecting pydantic>=2.6.0",
    "Downloading pydantic-2.10.0.whl (500 kB)",
    "Using cached numpy-2.0.whl",
    "ERROR: Could not find a version that satisfies foo",
  ].join("\n");
  const pipOut = filterCommandOutput("pip install -r requirements.txt", pipRaw);
  assert.match(pipOut, /ERROR: Could not find/);
  assert.doesNotMatch(pipOut, /Using cached/);
});

test("ROS_COMPRESS_FILTERS=0 disables command filters", () => {
  assert.equal(classifyCommand("git log"), "git_log");
  process.env.ROS_COMPRESS_FILTERS = "0";
  try {
    const raw = "tests/a.py::test_1 PASSED\n";
    assert.equal(filterCommandOutput("pytest -v", raw), raw);
  } finally {
    delete process.env.ROS_COMPRESS_FILTERS;
  }
});
