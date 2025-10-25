# ETH Global Hacker Assistant - Hackathon Pitch Guide

**Video Length:** 2-4 minutes
**Live Demo:** https://agent-eth-global.vercel.app
**Developer:** [@gilbertsahumada](https://x.com/gilbertsahumada)

---

## PROMPT FOR AI ASSISTANCE

> I'm preparing a 2-4 minute hackathon demo video for my project "ETH Global Hacker Assistant". This is an AI-powered documentation assistant that helps hackathon participants search through sponsor documentation using multi-agent AI with ASI-1 LLM and MeTTa symbolic reasoning.
>
> Using the information below, help me create:
> 1. A compelling script with exact timing for each section
> 2. Specific camera/screen recording directions
> 3. Talking points that are concise and impactful
> 4. Transitions between demo sections
> 5. A strong opening hook and closing call-to-action
>
> The judges need to understand the problem, the solution, the technical innovation, and see a live working demo - all in under 4 minutes.

---

## PROJECT SUMMARY

### The Elevator Pitch (15 seconds)
"ETH Global Hacker Assistant is an AI-powered documentation search platform that helps hackathon participants find implementation answers across multiple sponsor docs in seconds using multi-agent AI with ASI-1 LLM and optional MeTTa symbolic reasoning."

### The Problem (30 seconds)
Hackathon participants face several challenges:
- **Information Overload**: Each hackathon has 5-15+ sponsors, each with extensive documentation
- **Time Pressure**: 24-48 hours to build, no time to read hundreds of pages
- **Context Switching**: Constantly jumping between different docs, APIs, and frameworks
- **Implementation Blockers**: Getting stuck on "how do I deploy with Hardhat?" or "what's the syntax for Alchemy webhooks?"
- **Missed Opportunities**: Not knowing which sponsors have relevant tools for their idea

### The Solution (30 seconds)
A multi-agent AI system that:
1. **Automatically indexes** all sponsor documentation with intelligent metadata extraction
2. **Understands context** using query-understanding agents (deployed on Render)
3. **Semantically searches** across all indexed docs using Qdrant vector database
4. **Provides intelligent answers** using ASI-1 LLM with conversation memory
5. **Optional symbolic reasoning** via MeTTa agent for dependency detection

### Unique Value Proposition
- **Multi-Agent Architecture**: 4 specialized agents working together (not just one LLM)
- **Production Ready**: Deployed on Vercel (frontend) + Render (query agent) + Agentverse (chat agents)
- **Hackathon-Focused**: Active hackathon filtering - only shows relevant sponsors
- **Visual Management**: React Flow graph for managing sponsor relationships
- **ASI Alliance Integration**: Uses ASI-1 LLM + Hyperon MeTTa symbolic reasoning
- **Fetch.ai uAgents**: Chat agents deployed to Agentverse with mailbox protocol

---

## DEMO FLOW STRUCTURE (2-4 Minutes)

### Option A: Full Demo (4 minutes)

**[0:00 - 0:30] Opening Hook + Problem**
- Show hackathon sponsor page with 10+ sponsors
- "Imagine you're at a hackathon, 24 hours left, and you need to figure out how to integrate 3 different sponsors. Where do you even start?"
- Quick stats: "Most hackathons have 10-15 sponsors, each with 20-100 pages of docs"

**[0:30 - 1:00] Solution Introduction**
- Show live app: https://agent-eth-global.vercel.app
- "This is ETH Global Hacker Assistant - your AI-powered documentation assistant"
- Quick tour: "Active hackathon selector, indexed sponsors, and AI search"

**[1:00 - 2:00] Live Demo - Search & Chat**
- **Demo 1**: Simple query like "How do I deploy a smart contract with Hardhat?"
  - Show the search happening
  - Show AI response with specific code examples
  - Highlight sponsor attribution: "[Hardhat] Here's how..."
- **Demo 2**: Cross-sponsor query like "How do I use Alchemy with Polygon?"
  - Show it searching multiple sponsor docs
  - Show combined answer
  - "Notice it's pulling from 2 different sponsors seamlessly"

**[2:00 - 2:45] Technical Highlights**
- Show React Flow visualization
  - "Visual hackathon/sponsor management"
  - Show one sponsor card with document count
- Briefly mention architecture:
  - "Multi-agent system: metadata extraction, query understanding, main chat agent, and MeTTa symbolic reasoning"
  - "Deployed on Vercel, Render, and Fetch.ai Agentverse"
  - "Uses ASI-1 LLM and Qdrant vector search"

**[2:45 - 3:15] Document Upload Demo (Optional)**
- "Organizers can add new sponsor docs"
- Upload a markdown file
- Show automatic metadata extraction
- "AI automatically extracts tech stack, keywords, domain"
- Show it being indexed in Qdrant

**[3:15 - 3:45] Technical Innovation**
- Show deployment table with all agents
- "4 specialized agents working together:"
  - metadata-extractor (local/Agentverse)
  - query-understanding (Render + Agentverse)
  - main-agent (Agentverse)
  - metta-agent (Agentverse - symbolic reasoning)
- "This isn't just one LLM - it's an orchestrated multi-agent system"

**[3:45 - 4:00] Closing**
- "Built in [X days/hours] for ETH Global"
- "Powered by ASI Alliance: ASI-1 LLM and MeTTa symbolic AI"
- "Live now at agent-eth-global.vercel.app"
- "Check out the repo and chat with the Agentverse agents"

---

### Option B: Fast Demo (2-3 minutes)

**[0:00 - 0:20] Hook + Problem**
- "Hackathons = 10+ sponsors, 100+ pages of docs, 24 hours to build. Impossible to read everything."

**[0:20 - 0:40] Solution**
- "ETH Global Hacker Assistant - AI-powered multi-agent search across all sponsor docs"

**[0:40 - 1:40] Live Demo - 2 Quick Searches**
- Query 1: "How do I deploy with Hardhat?" (show answer)
- Query 2: "Combine Alchemy and Polygon" (show cross-sponsor answer)

**[1:40 - 2:20] Technical Innovation**
- Show architecture diagram OR deployment table
- "4 specialized AI agents using ASI-1 LLM + MeTTa reasoning"
- "Deployed to Vercel, Render, and Fetch.ai Agentverse"

**[2:20 - 2:30] Quick Upload Demo**
- Upload file, show auto-metadata extraction (10 seconds)

**[2:30 - 3:00] Closing**
- Show React Flow visualization
- "Production ready, live now, built with ASI Alliance"
- URL + CTA

---

## WHAT TO SHOW (High Priority)

### MUST SHOW (Critical)
1. **Live working search** - Minimum 1, ideally 2 queries
2. **AI responses with sponsor attribution** - Show it's not generic, it's contextual
3. **Production deployment** - It's live on Vercel, not localhost
4. **Multi-agent architecture** - Show the deployment table or diagram
5. **React Flow visualization** - Quick visual of sponsor management

### SHOULD SHOW (Important)
6. **Document upload with auto-metadata extraction** - Shows the full flow
7. **Active hackathon filtering** - Explains the UX concept
8. **ASI Alliance branding** - ASI-1 LLM + MeTTa reasoning
9. **Fetch.ai Agentverse** - Show at least one agent profile
10. **Vector search visualization** - Briefly mention Qdrant semantic search

### COULD SHOW (Nice to Have)
11. Code snippets in responses (if time)
12. Conversation memory (if you do multiple queries)
13. Performance metrics (response time)
14. GitHub repo structure

---

## WHAT TO SKIP (Don't Waste Time)

### Definitely Skip
- Database schema details (Drizzle, Supabase config)
- Environment variable setup (.env files)
- Installation/setup process (yarn install, etc.)
- Local development workflow (run_dev.sh scripts)
- Detailed code walkthrough (save for questions)
- Testing scripts (test_agent.sh)
- Error handling details
- Port configuration (8000, 8001, 8002)
- Hot-reload features
- Troubleshooting guide

### Skip Unless Asked
- MeTTa symbolic reasoning details (mention it exists, don't explain)
- OpenAI embeddings process
- Qdrant collection structure
- Supabase database queries
- API endpoint implementation
- Snake_case to camelCase transformation
- Individual agent README files

---

## KEY TALKING POINTS

### For Judges Who Care About Problem/Market Fit
- "Hackathon participants waste 2-4 hours just reading docs instead of building"
- "Every ETH Global event has 10-15 sponsors - that's overwhelming for 24-48h builds"
- "This directly helps hackers build better projects using more sponsor tech"
- "Benefits sponsors too - better integration examples = more prize submissions"

### For Judges Who Care About Technical Innovation
- "Multi-agent architecture with 4 specialized agents, not just one LLM"
- "ASI Alliance integration: ASI-1 for LLM + Hyperon MeTTa for symbolic reasoning"
- "Deployed across 3 platforms: Vercel serverless, Render HTTP API, Fetch.ai Agentverse"
- "Semantic search using Qdrant vector DB with dynamic filtering"
- "Query understanding agent analyzes intent to build smart filters (wants_code, language, etc.)"

### For Judges Who Care About Completeness
- "Fully deployed and production-ready, not a prototype"
- "Live demo at agent-eth-global.vercel.app"
- "Complete documentation for all 4 agents"
- "Visual management interface with React Flow"
- "Automatic metadata extraction from uploaded docs"

### For Judges Who Care About Ecosystem/Integration
- "Built specifically for ETH Global hackathons"
- "Uses Fetch.ai uAgents framework + Agentverse deployment"
- "Powered by ASI Alliance (ASI-1 LLM + MeTTa)"
- "Integrates Supabase, Qdrant, OpenAI, and ASI stack"
- "Can be white-labeled for any hackathon series"

---

## TECHNICAL HIGHLIGHTS (For Q&A)

### Architecture Stack
- **Frontend**: Next.js 15 + React 19 + Tailwind CSS 4 (Vercel)
- **Database**: Supabase PostgreSQL with Drizzle ORM
- **Vector Search**: Qdrant Cloud (collection-per-sponsor)
- **Embeddings**: OpenAI text-embedding-3-small
- **LLM**: ASI-1 (asi1-extended) via ASI Alliance
- **Symbolic Reasoning**: Hyperon MeTTa
- **Agents Framework**: Fetch.ai uAgents + uAgents Core
- **Deployment**: Vercel + Render + Agentverse

### Multi-Agent Flow
1. **User uploads doc** → metadata-extractor-agent (ASI-1) → extracts tech_stack, keywords, domain
2. **User searches** → query-understanding-agent (ASI-1 on Render) → extracts intent, filters
3. **Smart search** → Qdrant vector search with dynamic filters → returns relevant chunks
4. **main-agent** → coordinates search, builds context, calls ASI-1 LLM → generates answer
5. **metta-agent** (optional) → symbolic reasoning for dependency detection → enhances answer

### Performance Metrics
- **With MeTTa**: 7-13 seconds (full reasoning)
- **Without MeTTa**: 5-8 seconds (faster responses)
- **Metadata extraction**: 3-7 seconds per document
- **Query understanding**: 1-3 seconds per query

### Deployment Addresses
- Frontend: https://agent-eth-global.vercel.app
- Query Agent API: https://agent-eth-global.onrender.com/understand
- Query Agent (Agentverse): agent1qfmp9p3pu30dytavsv874nlthn7rstgpqjmvpld0jh6nsduydqxpqqqkynr
- Main Agent: agent1qf264ppnf8qgr7td4rrecg9aqdqdwytswdpdmdjz6z6msxdrwcpjchwcrwt
- MeTTa Agent: agent1q28esldytcauznk5tex8ryx5u5xdcg97p85wcttyk437zz035pl8g0pt8sv

---

## DEMO SCRIPT TEMPLATE

### Camera Setup
- Screen recording in 1920x1080 minimum
- Browser window maximized
- Close unnecessary tabs/apps
- Use incognito mode (clean, no extensions)
- Clear browser console (no errors showing)

### Screen Recording Flow
1. **Start on live app** (agent-eth-global.vercel.app)
2. **Show sponsor list** with active hackathon
3. **Navigate to search** (or chat)
4. **Type first query** slowly enough to read
5. **Show response** (pause 2-3 seconds to let viewers read)
6. **Highlight sponsor attribution** in response
7. **Second query** (optional but recommended)
8. **Quick tab to React Flow** visualization
9. **Quick show of deployment table** (GitHub README or Agentverse)
10. **End on live app** with clear URL visible

### Voiceover Tips
- **Pace**: 140-160 words per minute (conversational, not rushed)
- **Energy**: Enthusiastic but not manic
- **Clarity**: Emphasize key phrases: "multi-agent", "ASI Alliance", "production ready"
- **Pauses**: Let demos breathe - don't talk over every second
- **Confidence**: "This is live and working" not "hopefully this works"

---

## EXAMPLE SEARCH QUERIES (Pre-Test These!)

### Good Demo Queries
- "How do I deploy a smart contract with Hardhat?"
- "Show me how to use Alchemy webhooks"
- "What's the best way to integrate Polygon?"
- "How do I set up a React app with Web3?"
- "Give me code examples for connecting to Ethereum"

### Advanced Queries (Show Multi-Sponsor)
- "How do I use Alchemy with Polygon?"
- "Combine Hardhat and Foundry in one project"
- "Deploy on Polygon using Alchemy API"

### What NOT to Query
- Generic questions like "What is blockchain?" (shows system limitations)
- Questions with no indexed docs (will return empty)
- Overly complex queries (might timeout during live demo)

---

## COMMON JUDGE QUESTIONS (Be Prepared)

### "How is this different from just using ChatGPT?"
**Answer**: "ChatGPT has generic knowledge. This indexes specific sponsor docs with metadata, uses specialized agents for query understanding and metadata extraction, semantically searches the right context, and provides answers with sponsor attribution. It's a purpose-built multi-agent system, not a general chatbot."

### "What if the AI hallucinates?"
**Answer**: "All responses are grounded in the indexed documentation - we're using RAG (Retrieval Augmented Generation). The AI only has access to actual sponsor docs stored in Qdrant, so it can't make things up. Every answer shows which sponsor it came from."

### "How scalable is this?"
**Answer**: "The query-understanding agent is deployed on Render with auto-scaling. Qdrant Cloud handles vector search. Main chat agents are on Fetch.ai Agentverse with mailbox protocol. Each component can scale independently. We use collection-per-sponsor in Qdrant for isolated scaling."

### "How long did this take to build?"
**Answer**: "[Honest answer - probably 3-7 days]. The multi-agent architecture required careful orchestration, and deploying across 3 platforms (Vercel, Render, Agentverse) took integration work."

### "What's MeTTa and why use it?"
**Answer**: "MeTTa is Hyperon's symbolic reasoning engine from the ASI Alliance. It adds dependency detection and logical reasoning on top of the neural LLM. It's optional - you can disable it for 40% faster responses if you prefer pure speed over reasoning depth."

### "Can other hackathons use this?"
**Answer**: "Absolutely. The active hackathon system makes it multi-tenant ready. A hackathon organizer just creates a new hackathon, uploads sponsor docs, activates it. The system handles everything else. It could be white-labeled for other hackathon series."

---

## VISUAL ASSETS TO PREPARE

### Screenshots to Have Ready
1. ✅ Live app homepage (Vercel URL visible)
2. ✅ Sponsor list with active hackathon badge
3. ✅ Search query + AI response with attribution
4. ✅ React Flow visualization (clear, zoomed appropriately)
5. ✅ Deployment table from README.md
6. ✅ Architecture diagram (from main README)
7. ✅ Agentverse agent profile (main-agent or query-agent)

### Code Snippets to Highlight (If Needed)
- Multi-agent communication (agent.py)
- Query understanding logic (extracting intent)
- Qdrant semantic search with filters
- ASI-1 API integration

### Don't Show (Unless Asked)
- Database migrations
- Environment variables
- Package.json dependencies
- Drizzle schema files

---

## COMPETITIVE ADVANTAGES

### vs. Traditional Docs Search (Ctrl+F)
- Semantic search (finds concepts, not just keywords)
- Cross-sponsor search (one query, all docs)
- Natural language (no need to know exact terms)
- AI-generated answers (not just matched text)

### vs. Generic AI Chatbots (ChatGPT, Claude)
- Grounded in specific sponsor docs (no hallucination)
- Multi-agent specialization (not one general model)
- Hackathon-specific UX (active hackathon filtering)
- Sponsor attribution (know where info came from)

### vs. Other Hackathon Tools
- **Devpost**: Project submission, not documentation search
- **MLH Guides**: Generic guides, not sponsor-specific
- **Individual sponsor docs sites**: Fragmented, no cross-search
- **Our Tool**: All sponsor docs in one AI-powered search

---

## CLOSING THOUGHTS FOR PITCH

### The "Why This Matters" Statement
"Every hackathon, thousands of developers waste hours searching through documentation instead of building. This tool gives them back that time. And when developers can find implementation answers in seconds instead of hours, they build better projects, use more sponsor tech, and sponsors see better ROI on their hackathon investments. It's a win-win-win."

### The "What's Next" Statement
"This is production-ready today for ETH Global events. Next steps: add more sponsors, integrate with Devpost for automatic project suggestions, add code snippet extraction, and white-label for other hackathon series like HackMIT or TreeHacks."

### The "Call to Action"
"Try it live at agent-eth-global.vercel.app. Chat with the agents on Fetch.ai Agentverse. Check out the code on GitHub. And if you're organizing a hackathon, let's talk about deploying this for your event."

---

## FINAL CHECKLIST

### Before Recording
- [ ] Test all demo queries on production site
- [ ] Clear browser cache/cookies
- [ ] Close unnecessary tabs/windows
- [ ] Check audio levels
- [ ] Verify screen resolution (1920x1080+)
- [ ] Have backup queries ready in case one fails
- [ ] Time yourself (aim for 3:00-3:30 to stay safe under 4:00)
- [ ] Prepare opening and closing lines

### During Recording
- [ ] Smile (it shows in your voice)
- [ ] Speak clearly and pace yourself
- [ ] Let demos breathe (don't talk over them)
- [ ] Show confidence (this is production-ready)
- [ ] Emphasize unique value props

### After Recording
- [ ] Review for technical errors on screen
- [ ] Check audio clarity
- [ ] Verify all URLs are visible
- [ ] Confirm demo actually worked
- [ ] Add captions if required
- [ ] Export in required format

---

## BACKUP PLAN (If Demo Fails Live)

### If Production Site is Down
- Have screenshots of successful queries pre-recorded
- "Here's what it looks like when running" (show screenshots)
- Explain the architecture while showing visuals

### If Search Returns No Results
- "Let me try a different query" (have 3-4 tested backups)
- Worst case: show React Flow and architecture instead

### If Internet Fails
- Have video recording of successful demo on laptop
- Switch to explaining architecture with diagrams

---

## SUCCESS METRICS TO MENTION (If Applicable)

- "Response time: 5-8 seconds average"
- "Successfully indexed [X] sponsors with [Y] total documents"
- "[Z] chunks searchable across all sponsors"
- "Deployed and tested across 3 cloud platforms"
- "4 specialized agents working in concert"

---

## JUDGE EVALUATION CRITERIA (Tailor Your Pitch)

Most hackathons judge on:

1. **Innovation** → Multi-agent architecture + ASI Alliance integration
2. **Technical Complexity** → 4 agents, 3 deployment platforms, vector search
3. **Completeness** → Production deployed, full documentation, working demo
4. **Design** → React Flow visualization, clean UI
5. **Usefulness** → Solves real hackathon participant pain point
6. **Sponsor Integration** → Uses ASI Alliance (ASI-1 + MeTTa), Fetch.ai Agentverse

Make sure you hit all 6 in your pitch.

---

**Good luck with your pitch! This is a legitimately impressive project - show it with confidence.**

---

## ADDITIONAL NOTES FOR AI HELPER

When helping refine this pitch:
- Optimize for **clarity first, cleverness second**
- Keep technical jargon balanced (enough to impress, not so much it confuses)
- Focus on **live demo** as the centerpiece (seeing is believing)
- Emphasize the **multi-agent innovation** (this is not just another LLM wrapper)
- Make sure **ASI Alliance** sponsorship is clear (ASI-1 + MeTTa)
- End with **clear next steps** and call to action
- Stay authentic to the developer's voice (technical but accessible)

Target judge personas:
1. **Technical Judge** - Cares about architecture, scalability, innovation
2. **Product Judge** - Cares about UX, problem-solving, market fit
3. **Sponsor Judge** - Cares about ecosystem integration, sponsor value
4. **Generalist Judge** - Needs to understand quickly without deep tech knowledge

Pitch should resonate with all 4.
