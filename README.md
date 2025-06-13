# Fleet - AI-Powered Coding Task Management

Fleet is a full-stack web application that helps developers manage coding tasks using AI agents. It provides an intelligent interface for creating projects, running automated coding tasks, and tracking progress through an intuitive chat-based interface.

## Features

- **Project Management**: Connect your GitHub repositories and manage coding projects
- **AI Agents**: Deploy intelligent agents that can perform coding tasks autonomously
- **Chat Interface**: Communicate with agents through a modern chat interface
- **Task Tracking**: Monitor the progress of tasks with status updates (running, pending review, completed)
- **Code Execution**: Integrated with E2B code interpreter for safe code execution
- **GitHub Integration**: Seamlessly work with your GitHub repositories

## Tech Stack

### Backend
- **Python 3.13** with FastAPI
- **PostgreSQL** database with SQLModel/SQLAlchemy
- **Alembic** for database migrations
- **AsyncPG** for async database operations
- **Anthropic API** integration for AI capabilities
- **E2B Code Interpreter** for code execution

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **shadcn/ui** component library
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **React Router** for navigation

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- npm installed

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

4. **Access the application:**
   - Frontend: http://localhost:5173

### Stopping the Application

```bash
docker-compose down
```