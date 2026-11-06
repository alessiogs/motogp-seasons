# Coding standards

Read by `/code-review` for the Standards axis. Rules a script can check live in CI instead (`npm run lint:imports` keeps `queries/` and `logic/` apart), so this file holds the judgement calls. Code organization is in [AGENTS.md](./AGENTS.md#code-organization).

## Names speak the glossary

A name built on a [GLOSSARY.md](./GLOSSARY.md) term uses it in its glossary meaning, and only that. A **Step** is a Replay Step, so a place on the Podium is a `PodiumPlace`, not a `PodiumStep`. Where the glossary has no term for a concept, choose a word it doesn't define. When a name needs a new domain term, add it to the glossary in the same PR.
