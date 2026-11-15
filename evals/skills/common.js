// Shared settings for the three skill configurations: provider, prompts (previous vs current version) and assertion helper.
"use strict";
const path = require("path");

const MODEL = process.env.ROS_EVAL_MODEL || "gemini-3.5-flash-lite";

function config(skill, description, tests) {
  return {
    description,
    prompts: [
      { id: `file://${path.join(__dirname, "prompt.js")}:previous`, label: "anterior" },
      { id: `file://${path.join(__dirname, "prompt.js")}:current`, label: "actual" },
    ],
    providers: [{ id: `google:${MODEL}`, config: { temperature: 0 } }],
    tests: tests.map(([description, task, check]) => ({
      description,
      vars: { task },
      assert: [{ type: "javascript", value: `file://${path.join(__dirname, "assertions.js")}:${check}` }],
    })),
  };
}

module.exports = { config, MODEL };
