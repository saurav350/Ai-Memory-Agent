# 🧠 AI Memory Agent (Full-Stack)

A modern full-stack application for storing, categorizing, and synthesizing memories using **ASP.NET Core Web API (C#)**, **Entity Framework Core (Pomelo MySQL)**, **Google Gemini 1.5 Flash AI**, and a responsive **React (Vite)** frontend.

---

## 🌟 Features

- **Backend (ASP.NET Core 10 Web API)**:
  - Entity Framework Core with MySQL (`Pomelo.EntityFrameworkCore.MySql`).
  - **Memory Model**: `Id`, `Content`, `Category`, `CreatedAt`.
  - **CRUD Endpoints**:
    - `POST /api/memories` — Store a new memory note.
    - `GET /api/memories` — List all memories (supports `?category=` filtering).
    - `GET /api/memories/{id}` — Retrieve a memory by ID.
    - `DELETE /api/memories/{id}` — Delete a memory.
  - **AI Summarization Endpoint**:
    - `POST /api/memories/summarize` — Sends stored memories to Google Gemini 1.5 Flash (`generateContent`) to generate high-level insights, category breakdowns, and actionable suggestions.
  - Interactive **Swagger UI** for API testing (`/swagger`).
  - Safe secret management via `appsettings.json` or `GEMINI_API_KEY` environment variable.
  - Automatic table creation with `EnsureCreatedAsync` and fallback offline simulation mode.

- **Frontend (React + Vite)**:
  - Clean Vanilla CSS design system with custom HSL palette, dark theme, and micro-interactions.
  - Live backend connection health indicator.
  - Add memory form with category quick-presets (`Work`, `Personal`, `Learning`, `Ideas`) and custom category support.
  - Filter by category and instant search bar.
  - One-click Gemini AI summarization with markdown rendering, copy-to-clipboard, and refresh controls.

---

## 📁 Project Structure

```
.
├── backend/
│   ├── Controllers/
│   │   └── MemoriesController.cs       # REST endpoints (CRUD + Summarize)
│   ├── Data/
│   │   └── AppDbContext.cs             # EF Core MySQL DbContext
│   ├── Models/
│   │   ├── Memory.cs                   # Database entity
│   │   └── DTOs/
│   │       ├── CreateMemoryDto.cs      # Request payload DTO
│   │       └── SummarizeResponseDto.cs # AI summary response DTO
│   ├── Services/
│   │   ├── IGeminiService.cs           # Gemini service interface
│   │   └── GeminiService.cs            # Google Gemini HTTP client & prompt logic
│   ├── appsettings.json                # Connection string & API key placeholders
│   ├── Program.cs                      # Service registration, CORS, Swagger
│   └── MemoryAgent.Api.csproj          # Dependencies & build configuration
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Header & connection badge
│   │   │   ├── MemoryForm.jsx          # Input form with category selector
│   │   │   ├── MemoryList.jsx          # Search, category filter & grid
│   │   │   ├── MemoryCard.jsx          # Memory card with category badge
│   │   │   └── AiSummaryCard.jsx       # Gemini AI insights card with copy
│   │   ├── services/
│   │   │   └── api.js                  # Frontend API client
│   │   ├── App.jsx                     # Application state & toast notifications
│   │   ├── index.css                   # Vanilla CSS design system
│   │   └── main.jsx                    # Entry point
│   ├── package.json
│   └── vite.config.js                  # Port 5173 & API proxy config
│
├── init.sql                            # MySQL schema & seed data script
└── README.md                           # Documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [.NET SDK 10.0 or 9.0+](https://dotnet.microsoft.com/download)
- [Node.js 18+ and npm](https://nodejs.org/)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) (running on `localhost:3306`)

---

### 2. Configure Backend Secrets

Open `backend/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=MemoryAgentDb;User=root;Password=YOUR_MYSQL_PASSWORD;TreatTinyAsBoolean=true;"
  },
  "Gemini": {
    "ApiKey": "YOUR_GEMINI_API_KEY_HERE",
    "Model": "gemini-1.5-flash"
  }
}
```

> [!TIP]
> **Get a Free Gemini API Key**: Visit [Google AI Studio](https://aistudio.google.com) to generate a free Gemini API key in seconds. You can also set it via the environment variable `GEMINI_API_KEY`.
>
> If you test without a key, the backend gracefully runs in **Simulation Mode**, providing an automatic breakdown so you can explore the UI immediately!

---

### 3. Initialize the Database (Optional)

You can either:
1. Let ASP.NET Core automatically create the tables on boot via `EnsureCreatedAsync`.
2. Or execute `init.sql` directly in MySQL Workbench / CLI:
   ```bash
   mysql -u root -p < init.sql
   ```

---

### 4. Run the Backend API

From the root folder:

```powershell
cd backend
dotnet run
```

- API Base URL: `http://localhost:5113`
- Interactive Swagger UI: [`http://localhost:5113/swagger`](http://localhost:5113/swagger)

---

### 5. Run the Frontend

In a new terminal window from the root folder:

```powershell
cd frontend
npm.cmd install    # (if not already installed)
npm.cmd run dev
```

- Frontend URL: [`http://localhost:5173`](http://localhost:5173)

---

## 🧪 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/memories` | Retrieve all memories (optional: `?category=Work`) |
| `GET` | `/api/memories/{id}` | Retrieve memory by primary key |
| `POST` | `/api/memories` | Store new memory (`{ content, category }`) |
| `DELETE` | `/api/memories/{id}` | Remove memory by ID |
| `POST` | `/api/memories/summarize` | Generate Gemini 1.5 Flash AI summary & insights |

---

## 🛡️ Architecture & Design Decisions

1. **Explicit ServerVersion**: Configured with `MySqlServerVersion(new Version(8, 0, 36))` to prevent blocking network discovery during DI registration.
2. **Resilient Startup**: Database creation is wrapped in a try/catch block so that if MySQL credentials need adjustment, the API still starts and Swagger remains accessible.
3. **Optimized Prompting**: The Gemini prompt aggregates timestamps and categories into structured context and instructs the model to produce an Executive Summary, Category Breakdown, and Actionable Insights in markdown.
