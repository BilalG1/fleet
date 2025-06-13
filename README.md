# Fleet - Manage a fleet of coding agents

Fleet is a web app that helps you control multiple cloude-based code agents at once. Each agent runs in it's own sandbox and clones your github repo independently.

## Running locally

### Prerequisites
- Docker and Docker Compose installed
- node / npm installed

### Setup
1. **Create environment file:**
   Create a `.env` file in the project root with your configuration:
   ```env
   # Database
   API_DATABASE_URL=user:password@db:5432/db
   
   # Add your API keys and configuration here
   # ANTHROPIC_API_KEY=your_key_here
   # GITHUB_TOKEN=your_token_here
   ```

2. **Start the backend:**
   ```bash
   docker-compose up -d
   ```

3. **Start the frontend:**
  ```bash
  cd client
  npm i
  npm run dev
  ```