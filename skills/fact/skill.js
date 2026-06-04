import { getFacts, addFact } from '../db.js';

export default {
  tag: 'fact',
  instruction: `MEMORY SKILL: Any time the user shares anything meaningful — personal details, opinions, beliefs, preferences, relationships, projects, goals, values, or anything they express strong interest or feeling about — you MUST append one or more <fact> tags at the very end of your reply. Each tag contains one short third-person sentence. Never skip this even if the fact seems minor.

Examples (always append AFTER your normal reply):
- "My name is Alice." → <fact>User's name is Alice.</fact>
- "I work as a nurse in Seattle." → <fact>User works as a nurse.</fact><fact>User lives in Seattle.</fact>
- "I love hiking but hate crowds." → <fact>User loves hiking.</fact><fact>User dislikes crowds.</fact>
- "I think most social media is harmful." → <fact>User believes most social media is harmful.</fact>
- "I'm building a home automation system." → <fact>User is building a home automation system.</fact>
- "Privacy is really important to me." → <fact>User strongly values privacy.</fact>
- "I want to retire early." → <fact>User's goal is to retire early.</fact>`,
  async handle(content) {
    const existing = await getFacts();
    const seen = new Set(existing.map(f => f.text.trim().toLowerCase()));
    if (!seen.has(content.toLowerCase())) {
      await addFact(content);
      return true; // signal: system prompt changed, rebuild session
    }
  },
};
