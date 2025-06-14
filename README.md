# Fleet - Manage a fleet of coding agents

Fleet is a web app that helps you control multiple cloude-based code agents at once. Each agent runs in it's own sandbox and clones your github repo independently.

## Running locally

### Prerequisites
- Docker and Docker Compose installed
- node / npm installed

### Setup
1. **Create environment file:**
   Copy the example environment file and configure it with your settings:
   ```bash
   cp .env.example .env
   ```
   
   Then edit the `.env` file to add your API keys and configuration values.

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