# Webflow CMS Integration v2

This repository contains a full-stack Webflow CMS integration built to satisfy the PRD v2 requirements. It provides a guided setup wizard for non-technical users to connect their Webflow account, select a site and collection, map content fields, and push draft articles directly from a mock editor.

## Architecture

The project is split into two parts:
- **Backend**: A Python FastAPI application that handles Webflow OAuth 2.0 authorization, securely proxying Webflow API requests, and storing connection state via an SQLite database.
- **Frontend**: A React application built with Vite and TailwindCSS v4. It precisely replicates the UI and UX flows outlined in the PRD.

## Prerequisites

- Python 3.12+
- Node.js 18+
- A Webflow Developer Account with an App registered (Data Client type).

## Setup & Running Locally

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy the example environment file and add your Webflow Client ID and Secret:
   ```bash
   cp .env.example .env
   # Edit .env and insert your specific Webflow credentials
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload &
   ```
   The backend will run on `http://localhost:8000`.

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev &
   ```
   The frontend will be available at `http://localhost:5173`. API requests and Auth callbacks are automatically proxied to the backend via Vite's configuration.

## Key Features

- **OAuth 2.0 Authentication**: Replaces the old Site Token approach with a secure, 1-click connect flow.
- **5-Step Setup Wizard**:
  1. *Connect*: Initiate OAuth.
  2. *Site Picker*: Choose which Webflow site to sync to.
  3. *Collection Picker*: Select the blog/article CMS collection.
  4. *Field Mapping*: Auto-suggests mapping between internal article fields and Webflow collection schema.
  5. *Test & Activate*: Performs a silent test push to ensure the connection is healthy.
- **Article Editor**: A dummy editor that validates content before pushing to Webflow, checking for unsupported HTML tags, and generating a direct link to the drafted item in the Webflow Designer.

## Notes

- **Database**: Uses SQLite (`webflow.db` created in the `backend/` directory upon start) for storing OAuth tokens, mappings, and sync logs.
- **Security**: In this demonstration, access tokens are stored in plaintext in SQLite. In a production environment, they should be encrypted at rest.
