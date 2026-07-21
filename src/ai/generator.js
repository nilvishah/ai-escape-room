import { state } from '../engine/state.js';

// ── Prompt ─────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a procedural escape room designer. Output ONLY raw JSON, no markdown, no explanation.

ZONE RULES — you MUST spread objects across different zones. Available zones:
- "back-center" → paintings, clocks, panels on the back wall
- "back-left" → bookshelves, cabinets on left side of back wall
- "back-right" → safes, display cases on right side of back wall
- "left-wall" → wall-mounted objects on the left wall
- "right-wall" → wall-mounted objects on the right wall
- "floor-left" → desks, chests, barrels on the left floor
- "floor-right" → tables, crates, pedestals on the right floor
- "floor-center" → central floor items ONLY — use sparingly, max 1 object here

NEVER put more than 1 object in the same zone. Spread all 6-8 objects across DIFFERENT zones.

PUZZLE TYPES:
- "combo": solution is EXACTLY 4 digits e.g. "1847"
- "pattern": solution is array of button indices e.g. [2,0,3,1]. patternButtons must be array of 4-6 symbols
- "keylock": solution is item id. Item MUST be findable in room
- "slider": sliderSymbols is array of 8 symbols, sliderClue describes the correct order
- "wires": wireSolution is array of [leftIdx, rightIdx] pairs e.g. [[0,1],[1,2],[2,0]], wireLeftLabels and wireRightLabels are arrays of symbols/words
- "memory": memorySymbols is array of 6-8 symbols, memoryPairs is 3 or 4
- "rotary": rotarySymbols is array of 8 symbols, rotarySolution is array of 2-3 indices to hit in sequence

KEYLOCK RULE — critical: some other object must have "containsItem" set to the keylock solution item id. Otherwise player can never find it.

DEPENDENCY CHAIN:
- First puzzle: requiredPuzzle is null (accessible from start)
- Each solved puzzle sets "unlocks" to another object's id
- Chain: puzzle1 unlocks objectB → objectB has puzzle2 → puzzle2 unlocks objectC → objectC has puzzle3

ARCHETYPE — pick ONE that fits the theme:
- "ship-cabin" → nautical, ocean, pirates, sailors
- "victorian-library" → gothic, occult, Victorian, manor, study, books
- "underground-lab" → science, bunker, experiment, facility, laboratory
- "ancient-tomb" → Egypt, temple, ruins, archaeology, ancient, jungle
- "space-station" → sci-fi, space, alien, futuristic, starship
- "haunted-manor" → ghost, horror, haunted, supernatural, bedroom

OUTPUT this exact JSON structure with ALL fields present:
{
  "id": "room_1",
  "name": "The Obsidian Study",
  "theme": "Victorian occult laboratory",
  "archetype": "victorian-library",
  "atmosphere": "The air smells of sulfur and old parchment. Gas lamps flicker.",
  "themeColors": {
    "ambient": "#1a0a05",
    "wall": "#1e140a",
    "floor": "#0f0a05",
    "ceiling": "#12100a",
    "fog": "#0a0805",
    "accent": "#c87a20"
  },
  "objects": [
    {
      "id": "bookshelf",
      "name": "Old Bookshelf",
      "emoji": "📚",
      "zone": "back-left",
      "floorObject": true,
      "description": "Tall shelves packed with leather-bound tomes. One book is pulled slightly outward.",
      "lockedDescription": "The bookshelf is out of reach until you find a way forward.",
      "clue": "A page falls out: The year the comet fell — MDCCCXLVII",
      "containsItem": null,
      "puzzleId": null,
      "requiredPuzzle": null,
      "color": "#1a1008"
    },
    {
      "id": "iron_safe",
      "name": "Iron Safe",
      "emoji": "🔒",
      "zone": "back-right",
      "floorObject": true,
      "description": "A heavy Victorian safe with four numbered dials.",
      "lockedDescription": "The safe is sealed tight.",
      "clue": null,
      "containsItem": "brass_key",
      "puzzleId": "puzzle_combo",
      "requiredPuzzle": null,
      "color": "#1a1a1a"
    },
    {
      "id": "locked_chest",
      "name": "Locked Chest",
      "emoji": "📦",
      "zone": "floor-left",
      "floorObject": true,
      "description": "A wooden chest with a keyhole.",
      "lockedDescription": "The chest is locked. You need a key.",
      "clue": null,
      "containsItem": null,
      "puzzleId": "puzzle_keylock",
      "requiredPuzzle": "puzzle_combo",
      "color": "#2a1a08"
    }
  ],
  "items": [
    {
      "id": "brass_key",
      "name": "Brass Key",
      "emoji": "🗝️",
      "description": "An ornate key with a lion head."
    }
  ],
  "puzzles": [
    {
      "id": "puzzle_combo",
      "type": "combo",
      "name": "Iron Safe",
      "hostObjectId": "iron_safe",
      "solution": "1847",
      "clueObjectId": "bookshelf",
      "unlocks": "locked_chest",
      "instruction": "Turn the dials to the correct year.",
      "patternButtons": null,
      "cipherAlphabet": null,
      "cipherMessage": null,
      "requiredItem": null
    },
    {
      "id": "puzzle_keylock",
      "type": "keylock",
      "name": "Locked Chest",
      "hostObjectId": "locked_chest",
      "solution": "brass_key",
      "clueObjectId": "iron_safe",
      "unlocks": null,
      "instruction": "Use the key from your inventory.",
      "patternButtons": null,
      "cipherAlphabet": null,
      "cipherMessage": null,
      "requiredItem": "brass_key"
    }
  ],
  "exitRequires": ["puzzle_combo", "puzzle_keylock"]
}

Generate a COMPLETE room with exactly 3 puzzles, 6-8 objects spread across DIFFERENT zones, all items reachable. Be creative — gothic, sci-fi, underwater, jungle temple, abandoned lab, haunted ship, ancient tomb. Make clues vivid and atmospheric.`;

// ── Generate room ──────────────────────────────────────────────
export async function generateRoom(roomNumber, onProgress, onTheme) {
  onProgress(0, 'Inventing theme...');

  const userPrompt = `Generate escape room number ${roomNumber}. Use a unique creative theme. Use exactly 3 puzzles of DIFFERENT types chosen from: combo, pattern, keylock, slider, wires, memory, rotary. Spread objects across at least 6 different zones. Remember: the keylock item MUST be findable.`;

  onProgress(1, 'Building room...');

  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    try {
      const raw = await callGroq(userPrompt);
      onProgress(2, 'Designing puzzles...');

      const blueprint = parseJSON(raw);
      onProgress(3, 'Linking clues...');
      if (onTheme && blueprint.name) onTheme(blueprint.name);

      validateBlueprint(blueprint);
      return blueprint;
    } catch (err) {
      if (attempts >= 3) throw new Error(`Room generation failed after 3 attempts: ${err.message}`);
      console.warn(`Attempt ${attempts} failed:`, err.message, '— retrying...');
    }
  }
}

// ── Groq API call ──────────────────────────────────────────────
async function callGroq(userMessage) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.85,
      max_tokens: 4000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// ── JSON parsing with cleanup ──────────────────────────────────
function parseJSON(raw) {
  let clean = raw.trim();
  clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  try {
    return JSON.parse(clean);
  } catch (e) {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse JSON from AI response');
  }
}

// ── Blueprint validation ───────────────────────────────────────
function validateBlueprint(bp) {
  if (!bp.objects || !Array.isArray(bp.objects) || bp.objects.length < 2)
    throw new Error('Missing or insufficient objects array');
  if (!bp.puzzles || !Array.isArray(bp.puzzles) || bp.puzzles.length < 2)
    throw new Error('Missing or insufficient puzzles array');
  if (!bp.exitRequires || !Array.isArray(bp.exitRequires))
    throw new Error('Missing exitRequires array');

  const objectIds = new Set(bp.objects.map(o => o.id));
  const puzzleIds = new Set(bp.puzzles.map(p => p.id));
  const itemIds = new Set((bp.items || []).map(i => i.id));

  bp.puzzles.forEach(p => {
    if (!objectIds.has(p.hostObjectId))
      throw new Error(`Puzzle ${p.id} references missing hostObject: ${p.hostObjectId}`);

    if (p.type === 'combo' && !/^\d{4}$/.test(String(p.solution)))
      throw new Error(`Combo puzzle ${p.id} solution must be exactly 4 digits, got: ${p.solution}`);

    if (p.type === 'pattern' && (!Array.isArray(p.solution) || p.solution.length < 2))
      throw new Error(`Pattern puzzle ${p.id} solution must be an array`);

    if (p.type === 'keylock') {
      if (!itemIds.has(p.solution))
        throw new Error(`Keylock puzzle ${p.id} solution item not found: ${p.solution}`);
      const itemReachable = bp.objects.some(o => o.containsItem === p.solution);
      if (!itemReachable)
        throw new Error(`Keylock item "${p.solution}" exists but no object contains it — player can never find it`);
    }
  });

  bp.exitRequires.forEach(id => {
    if (!puzzleIds.has(id)) throw new Error(`exitRequires references unknown puzzle: ${id}`);
  });

  // Fix invalid zones instead of crashing
  const validZones = ['back-center','back-left','back-right','left-wall','right-wall','floor-left','floor-right','floor-center'];
  bp.objects.forEach(o => {
    if (!validZones.includes(o.zone)) o.zone = 'floor-center';
  });

  if (!bp.items) bp.items = [];

  return true;
}
