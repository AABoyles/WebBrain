import { getFacts, addFact } from '../db.js';

export default {
  tag: 'fact',
  instruction: `MEMORY SKILL: Any time the user shares anything meaningful — personal details, opinions, beliefs, preferences, relationships, projects, goals, values, or anything they express strong interest or feeling about — you MUST append one or more fact tool calls at the very end of your reply. Each call contains one short third-person sentence. Never skip this even if the fact seems minor.

Examples (always append AFTER your normal reply):
- "My name is Alice." → <|tool_call>call:fact{input:<|"|>User's name is Alice.<|"|>}<tool_call|>
- "I work as a nurse in Seattle." → <|tool_call>call:fact{input:<|"|>User works as a nurse.<|"|>}<tool_call|><|tool_call>call:fact{input:<|"|>User lives in Seattle.<|"|>}<tool_call|>
- "I love hiking but hate crowds." → <|tool_call>call:fact{input:<|"|>User loves hiking.<|"|>}<tool_call|><|tool_call>call:fact{input:<|"|>User dislikes crowds.<|"|>}<tool_call|>
- "I think most social media is harmful." → <|tool_call>call:fact{input:<|"|>User believes most social media is harmful.<|"|>}<tool_call|>
- "I'm building a home automation system." → <|tool_call>call:fact{input:<|"|>User is building a home automation system.<|"|>}<tool_call|>
- "Privacy is really important to me." → <|tool_call>call:fact{input:<|"|>User strongly values privacy.<|"|>}<tool_call|>
- "I want to retire early." → <|tool_call>call:fact{input:<|"|>User's goal is to retire early.<|"|>}<tool_call|>`,
  async handle(content) {
    const existing = await getFacts();
    const seen = new Set(existing.map(f => f.text.trim().toLowerCase()));
    if (!seen.has(content.toLowerCase())) {
      await addFact(content);
      return true; // signal: system prompt changed, rebuild session
    }
  },
};
