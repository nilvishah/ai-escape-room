# AI Escape Room

A browser-based escape room game where the rooms aren't designed by a person — an LLM generates them. Every time you play, you get a new room: a new theme, new objects, new puzzles, new clues. No two playthroughs are the same.

## How it works

When you start a game, a prompt goes out to an LLM (Groq running Llama 3.3) asking it to design a room. It comes back with a full blueprint in JSON — the room's theme, what objects are in it, the puzzles, the clues, and which puzzle unlocks what. That blueprint gets fed into a 3D engine built from scratch in Three.js, which places the furniture, sets the lighting, and builds the room you actually walk around in.

The part I cared about most: making sure the AI's output is actually *solvable*. There's a validation layer that checks the generated JSON for referential integrity — basically making sure every puzzle chain makes logical sense before the room ever renders. If the AI's output fails validation, it doesn't just get thrown away — the model gets its own broken output plus the specific error, and fixes it.

## Features
- 6 room archetypes, 7 interactive puzzle types
- Procedural generation - a new room every time
- Dependency graph validation so puzzle chains are always solvable
- Self-correcting generation when the AI messes up
- Context-aware hint system - hints are based on what you've already solved, so they don't spoil anything
- Built with vanilla Three.js, no game engine

## Stack
Three.js · Groq API (Llama 3.3) · JavaScript · Vite · WebGL

## Running it locally
```bash
git clone https://github.com/nilvishah/ai-escape-room.git
cd ai-escape-room
npm install
npm run dev
```

You'll need a Groq API key — add it to a `.env` file (see `.env.example` if there is one, or check the code for the expected variable name).

## Why I built this
Wanted to explore what it actually takes to make LLM output *reliable* enough to build a real system on top of, not just a chatbot answering questions. The validation + self-correction loop is basically an eval system for making sure the AI's structured output is trustworthy before it hits the user.