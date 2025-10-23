# ETH Global Hacker Assistant - Frontend

Documentation management and vector search API for the ETH Global Hacker Assistant multi-agent system. This Next.js application provides the interface for uploading documentation, managing projects, and serves as the search backend for the AI agents.

## Tech Stack

- **Framework**: Next.js 15.5.4 (App Router with Turbopack)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **Vector Search**: Qdrant
- **AI Embeddings**: OpenAI (text-embedding-3-small)
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Package Manager**: Yarn

## Architecture

```
User Interface (Next.js)
    ↓
Documentation Upload → Text Chunking → OpenAI Embeddings → Qdrant Vector DB
    ↓
Project Management → Supabase PostgreSQL (Drizzle ORM)
    ↓
API Endpoints → AI Agents (AgentVerse)
```

## Features

### 📚 Documentation Management
- Upload markdown files with project metadata
- Automatic text chunking and embedding generation
- Vector storage in Qdrant for semantic search
- Project organization with tech stack, domain, and tags

### 🔍 Vector Search API
- Semantic search across multiple projects
- Metadata filtering (tech stack, domain, tags)
- Multi-project search capability
- REST API for agent integration

### 🗄️ Database Schema
- **Projects**: Store project information and metadata
- **Project Documents**: Track uploaded documentation files
- Automatic timestamping and indexing

## Prerequisites

- Node.js 18+
- Yarn package manager
- Supabase account
- Qdrant Cloud account
- OpenAI API key
- **Python 3.9+** (for local agents)
- **ASI-1 API Key** (for local agents)

## Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Copy from example
cp .env.example .env.local
```

Configure the following variables:

```bash
# Qdrant Vector Database
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_URL=https://your-cluster.aws.cloud.qdrant.io

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-your-openai-api-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_PASSWORD=your-database-password

# Database Connection (for Drizzle ORM)
# Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres

# Local Agents (Required for upload/search functionality)
METADATA_AGENT_URL=http://localhost:8002/analyze
QUERY_AGENT_URL=http://localhost:8002/understand
```

### Getting API Keys

**Qdrant:**
1. Sign up at [qdrant.tech](https://qdrant.tech)
2. Create a new cluster
3. Copy API key and URL from cluster details

**OpenAI:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create API key in API Keys section
3. Copy key (starts with `sk-`)

**Supabase:**
1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy `URL` and `service_role` key
4. Go to Settings → Database
5. Copy connection string and extract password

## Installation

```bash
# Install dependencies
yarn install

# Generate database types
yarn types:generate

# Push database schema
yarn db:push
```

## Development

### Step 1: Start Local Agents (Required)

⚠️ **IMPORTANT:** The frontend requires two local agents to be running for upload and search functionality.

**Terminal 1 - Metadata Extractor Agent:**
```bash
cd ../agents/agents/metadata-extractor-agent
pip3 install -r requirements.txt
cp .env.example .env
# Edit .env and add your ASI1_API_KEY
./run_dev.sh
```

This agent will run on **http://localhost:8002** and is used for automatic metadata extraction from uploaded markdown files.

**Terminal 2 - Query Understanding Agent:**
```bash
cd ../agents/agents/query-understanding-agent
pip3 install -r requirements.txt
cp .env.example .env
# Edit .env and add your ASI1_API_KEY
./run_dev.sh
```

This agent will run on **http://localhost:8002** and is used for intelligent query analysis during search.

**Why local agents?**
- ❌ Cannot deploy to Agentverse - they receive direct HTTP POST requests from Next.js
- ✅ Must run locally during development
- ✅ Auto-reload enabled with `run_dev.sh` for easy development

### Step 2: Start Frontend

**Terminal 3 - Next.js:**
```bash
# Run development server (with Turbopack)
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

**Expected Setup:**
- ✅ Port 8000: metadata-extractor-agent
- ✅ Port 8001: query-understanding-agent
- ✅ Port 3000: Next.js frontend

## Database Commands

```bash
# Generate migration files
yarn db:generate

# Apply migrations
yarn db:migrate

# Push schema changes directly
yarn db:push

# Open Drizzle Studio (database GUI)
yarn db:studio
```

## API Endpoints

### POST /api/docs/smart-search

**🔥 Main API for agent queries**. Performs intelligent semantic search across sponsors of the currently active hackathon. Uses ASI1-powered query understanding for automatic filtering.

**Request Body:**
```json
{
  "query": "How to deploy a Chainlink VRF contract?",
  "limit": 10
}
```

**Response:**
```json
{
  "results": [
    {
      "content": "To deploy a VRF contract...",
      "sponsorId": "uuid",
      "sponsorName": "Chainlink",
      "sponsorCategory": "Oracle",
      "collectionName": "sponsor_chainlink_uuid",
      "type": "code",
      "hasCode": true,
      "score": 0.95
    }
  ],
  "totalResults": 8,
  "hackathon": {
    "id": "uuid",
    "name": "ETH Global Online",
    "location": "Online"
  },
  "sponsorsSearched": 3,
  "sponsorNames": ["Chainlink", "Polygon", "The Graph"]
}
```

### GET /api/hackathons

Get all hackathons.

**Response:**
```json
{
  "hackathons": [
    {
      "id": "uuid",
      "name": "ETH Global Online",
      "location": "Online",
      "isActive": true,
      "startDate": "2024-09-15",
      "endDate": "2024-09-29"
    }
  ]
}
```

### POST /api/hackathons/[id]/activate

Set a hackathon as active (for agent queries).

**Response:**
```json
{
  "success": true,
  "hackathon": {
    "id": "uuid",
    "name": "ETH Global Buenos Aires",
    "isActive": true,
    "sponsorCount": 5
  }
}
```

### GET /api/hackathons/active

Get the currently active hackathon.

**Response:**
```json
{
  "success": true,
  "hackathon": {
    "id": "uuid",
    "name": "ETH Global Online",
    "isActive": true,
    "sponsorCount": 7,
    "indexedSponsorCount": 3
  },
  "sponsors": [
    {
      "id": "uuid",
      "name": "Chainlink",
      "collectionName": "sponsor_chainlink_uuid",
      "documentCount": 15
    }
  ]
}
```

### GET /api/sponsors

Get all sponsors.

**Response:**
```json
{
  "sponsors": [
    {
      "id": "uuid",
      "name": "Chainlink",
      "category": "Oracle",
      "collectionName": "sponsor_chainlink_uuid",
      "documentCount": 15,
      "lastIndexedAt": "2025-01-20T10:00:00Z"
    }
  ]
}
```

### POST /api/sponsors/index

Index sponsor documentation (multipart/form-data).

**Request:**
- `sponsorId`: UUID
- `files[]`: Markdown files

**Response:**
```json
{
  "success": true,
  "filesProcessed": 5,
  "chunksCreated": 127,
  "sponsor": {
    "id": "uuid",
    "name": "Chainlink",
    "documentCount": 15
  }
}
```

## Project Structure

```
front-end/
├── app/
│   ├── api/
│   │   ├── hackathons/
│   │   │   ├── route.ts              # GET hackathons
│   │   │   ├── active/route.ts       # GET active hackathon
│   │   │   └── [id]/
│   │   │       ├── activate/route.ts # POST activate hackathon
│   │   │       └── sponsors/route.ts # Hackathon-sponsor relations
│   │   ├── sponsors/
│   │   │   ├── route.ts              # GET sponsors
│   │   │   └── index/route.ts        # POST index sponsor docs
│   │   └── docs/
│   │       └── smart-search/route.ts # POST smart search (main API)
│   ├── components/
│   │   ├── Navbar.tsx                # Nav with active hackathon badge
│   │   ├── HackathonFlowVisualization.tsx
│   │   ├── SponsorIndexModal.tsx
│   │   └── nodes/                    # React Flow nodes
│   ├── hackathons/                   # Hackathon management page
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Sponsor Tools (home)
│   └── globals.css                   # Global styles
├── lib/
│   ├── db/
│   │   ├── client.ts                 # Drizzle client
│   │   └── schema.ts                 # Database schema
│   ├── agents/                       # Agent HTTP clients
│   ├── qdrant-intelligent.ts         # Qdrant service
│   └── metadata-extractor.ts         # Local metadata extraction
├── scripts/
│   ├── seed.ts                       # Main seed script
│   ├── seed-hackathons.ts
│   ├── seed-sponsors.ts
│   └── verify-seed.ts
├── drizzle/                          # Database migrations
├── .env.local                        # Environment variables (create this)
├── drizzle.config.ts                 # Drizzle configuration
├── next.config.ts                    # Next.js configuration
└── package.json                      # Dependencies
```

## Database Schema

### Hackathons Table

```typescript
{
  id: uuid (PK),
  name: text (unique),
  location: text,
  startDate: timestamp,
  endDate: timestamp,
  description: text,
  website: text,
  isActive: boolean,    // Only ONE can be true at a time
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Sponsors Table

```typescript
{
  id: uuid (PK),
  name: text (unique),
  collectionName: text (unique),  // Qdrant collection
  description: text,
  website: text,
  logo: text,
  docUrl: text,
  techStack: text[],
  category: text,
  tags: text[],
  documentCount: integer,
  lastIndexedAt: timestamp,
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Hackathon-Sponsors Relationship (Many-to-Many)

```typescript
{
  id: uuid (PK),
  hackathonId: uuid (FK → hackathons.id, CASCADE),
  sponsorId: uuid (FK → sponsors.id, CASCADE),
  tier: text,           // e.g., 'Gold', 'Silver', 'Partner'
  prizeAmount: integer,
  createdAt: timestamp
}
```

### Sponsor Documents Table

```typescript
{
  id: uuid (PK),
  sponsorId: uuid (FK → sponsors.id, CASCADE),
  fileName: text,
  fileSize: integer,
  contentPreview: text,
  indexedAt: timestamp
}
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

**Current deployment:** https://agent-eth-global.vercel.app

### Environment Variables on Vercel

Make sure to add all variables from `.env.example` to your Vercel project settings:
- Settings → Environment Variables
- Add each variable from `.env.example`
- Redeploy after adding variables

## Usage with AI Agents

The frontend API is consumed by the AI agents. The system automatically filters searches by the **active hackathon**.

**Main Agent:**
```python
# Smart search (automatically uses active hackathon)
response = requests.post(
    f"{NEXT_API_BASE_URL}/docs/smart-search",
    json={"query": "How to deploy Chainlink VRF?", "limit": 10}
)
data = response.json()

# Results are automatically filtered by active hackathon's sponsors
results = data["results"]
hackathon = data["hackathon"]  # {"name": "ETH Global Online", ...}
sponsors = data["sponsorNames"]  # ["Chainlink", "Polygon", ...]

# Get active hackathon info
response = requests.get(f"{NEXT_API_BASE_URL}/hackathons/active")
active = response.json()
print(f"Active: {active['hackathon']['name']}")
print(f"Sponsors: {len(active['sponsors'])}")
```

**Key Feature:** The agent doesn't need to specify which hackathon or sponsors to search. The system automatically filters by the active hackathon set in the UI.

## Vector Search Details

**Embedding Model:** OpenAI `text-embedding-3-small`
- Dimensions: 1536
- Cost-effective for documentation search
- Fast inference time

**Chunking Strategy:**
- Maximum chunk size: 1000 characters
- Overlap: 200 characters
- Preserves context across chunks

**Qdrant Collections:**
- One collection per sponsor (e.g., `sponsor_chainlink_uuid`)
- Parallel search across multiple sponsor collections
- Metadata stored with each vector (sponsor, category, tech stack)
- Automatic filtering by active hackathon

## Development Tips

1. **Hot Reload**: Turbopack enables instant feedback
2. **Database GUI**: Use `yarn db:studio` to explore database
3. **Type Safety**: Generate types after schema changes
4. **API Testing**: Test endpoints at http://localhost:3000/api/*

## Common Issues

### "Cannot connect to database"
- Verify `DATABASE_URL` is correct
- Check Supabase project is running
- Ensure IP is whitelisted in Supabase

### "Qdrant API error"
- Verify `QDRANT_API_KEY` and `QDRANT_URL`
- Check cluster is running
- Ensure collections exist

### "OpenAI API error"
- Verify `OPENAI_API_KEY` is valid
- Check API credits/billing
- Rate limits may apply

## Scripts Reference

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development server |
| `yarn build` | Build for production |
| `yarn start` | Start production server |
| `yarn lint` | Run ESLint |
| `yarn db:generate` | Generate migrations |
| `yarn db:migrate` | Apply migrations |
| `yarn db:push` | Push schema directly |
| `yarn db:studio` | Open database GUI |
| `yarn db:seed` | Seed hackathons + sponsors |
| `yarn db:seed:hackathons` | Seed only hackathons |
| `yarn types:generate` | Generate TypeScript types |

## Performance

- **Turbopack**: 5x faster than Webpack
- **App Router**: Server components for better performance
- **Vector Search**: <100ms average response time
- **Edge Functions**: Deploy API routes to edge network

## Security

- Service role key stored server-side only
- API routes protected with proper validation
- Database access via secure connections
- Environment variables never exposed to client

## Contributing

When adding new features:
1. Update schema in `lib/db/schema.ts`
2. Run `yarn db:push` to apply changes
3. Run `yarn types:generate` for type safety
4. Test endpoints locally before deploying

## Credits

**Developed by [@gilbertsahumada](https://x.com/gilbertsahumada)**

Built for ETH Global Hackathon | Powered by ASI Alliance
