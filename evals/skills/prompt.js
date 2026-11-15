// Prompt functions for the skill regression pilot. The runner (scripts/eval-skills.js) writes the previous and current context of
// the skill under evaluation to EVAL_WORKDIR; the same task is sent with each one.
"use strict";
const fs = require("fs");
const path = require("path");

const INSTRUCTION =
  "Resuelve la tarea siguiendo estrictamente las reglas anteriores. Responde solo con el código necesario en bloques ```, " +
  "sin explicaciones fuera de comentarios breves.";

function build(version, vars) {
  const file = path.join(process.env.EVAL_WORKDIR || "", `${process.env.EVAL_SKILL}.${version}.md`);
  const context = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const messages = [];
  if (context.trim()) messages.push({ role: "system", content: context });
  messages.push({ role: "user", content: `${vars.task}\n\n${INSTRUCTION}` });
  return JSON.stringify(messages);
}

module.exports = {
  previous: ({ vars }) => build("previous", vars),
  current: ({ vars }) => build("current", vars),
};
