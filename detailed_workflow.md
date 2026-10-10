# SkillConnect AI — Detailed System Workflows

This document outlines the detailed user journeys, system architectures, and execution sequences for the core features of **SkillConnect AI** (Visual AI Suite).

---

## 1. User Journey & Feature Navigation Flow

This flowchart illustrates the navigation paths and page access rules within the SkillConnect AI application, including the authentication check via Clerk.

```mermaid
graph TD
    A[Visitor arrives at Landing Page /] -->|Click Get Started or Sign In| B{Authenticated via Clerk?}
    B -->|No| C[Auth Page /sign-in or /sign-up]
    C -->|Successful Login/Signup| D[Dashboard /dashboard]
    B -->|Yes| D
    
    D -->|Sidebar Menu| E[AI Advisories]
    D -->|Sidebar Menu| F[Career Readiness]
    D -->|Sidebar Menu| G[Progress & Profile]
    
    E --> E1[AI Career Coach /coach]
    E --> E2[Career Recommendations /career-recommendations]
    E --> E3[Interactive Roadmaps /roadmaps]
    
    F --> F1[Resume Analyzer /resumes]
    F --> F2[Mock Interview Simulator /mock-interviews]
    F --> F3[Skill Gap Analysis /skill-gaps]
    F --> F4[Cover Letter Generator /cover-letters]
    F --> F5[Job Search & Match /jobs]
    
    G --> G1[User Profile & Target Role /profile]
    G --> G2[Progress & Gamification /progress]
```

---

## 2. Technical Sequence: AI Career Coach (SSE Streaming)

This sequence diagram illustrates how messages are sent, streamed from the Gemini API (using the OpenAI SDK compatibility layer), stored in the database, and how gamification XP is awarded.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant App as React UI (/coach)
    participant Server as Express Backend (api-server)
    participant DB as PostgreSQL (Drizzle)
    participant Gemini as Google Gemini API (via OpenAI SDK)

    User->>App: Type career question & press send
    App->>App: Append message to local state (optimistic update)
    App->>Server: POST /api/coach/conversations/:id/messages (Content-Type: application/json)
    
    Note over Server: Express verifies Clerk JWT session & extracts userId
    Server->>DB: Select message history for conversationId
    DB-->>Server: Return history list
    Server->>DB: Insert new user message record
    
    Server->>App: Establish Server-Sent Events (SSE) stream (text/event-stream)
    Server->>Gemini: POST ChatCompletion (Stream: true, history + new message)
    
    loop Stream chunks
        Gemini-->>Server: Data chunk (delta text)
        Server-->>App: SSE event: { delta: "text" }
        App->>App: Render text delta in real-time
    end
    
    Gemini-->>Server: Stream end signal
    Server->>DB: Insert assistant response record
    Server->>DB: Award XP (e.g. +5 XP) & update user profile
    Server-->>App: SSE event: { done: true }
    App->>App: Finalize message state & play level-up sound/animations if leveled up
```

---

## 3. Server-Client Boundary: Skill Gap Analysis & Roadmap Generation

This diagram details the server-client data boundary and backend validation flow during a skill analysis request, followed by the generation of a career learning path.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant App as React UI (/skill-gaps)
    participant Server as Express Backend
    participant DB as PostgreSQL (Drizzle)
    participant Gemini as Google Gemini API

    User->>App: Enter Target Role (e.g. "DevOps Engineer") & current skills
    App->>Server: POST /api/skill-gaps (TargetRole, CurrentSkills)
    
    Note over Server: Body payload validated via Zod schema (api-zod)
    
    Server->>Gemini: Call generateJson (System prompt + comparison template)
    Note over Gemini: Compares target role with current skills to find gaps
    Gemini-->>Server: Return structured JSON (Required, Missing, Priority, Recs)
    
    Server->>DB: Save result to skill_gaps table
    Server-->>App: Return analyzed Skill Gap report (JSON)
    App->>App: Render interactive gap analysis dashboard (Radar Chart / Lists)
    
    User->>App: Click "Generate Roadmap" for missing skills
    App->>Server: POST /api/roadmaps (SkillGapId)
    Server->>Gemini: Request step-by-step roadmap JSON (Nodes, descriptions, resources)
    Gemini-->>Server: Return visual node roadmap structure
    Server->>DB: Save roadmap to roadmaps table
    Server-->>App: Return Roadmap JSON
    App->>App: Render interactive SVG/Canvas node roadmap flow
```

---

## 4. Interactive Simulation: Mock Interview Session

This diagram details the multi-turn interactive loops that occur during an AI-driven mock interview simulation.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant App as React UI (/mock-interviews)
    participant Server as Express Backend
    participant DB as PostgreSQL (Drizzle)
    participant Gemini as Google Gemini API

    User->>App: Choose role & click "Start Mock Interview"
    App->>Server: POST /api/mock-interviews (Role, Difficulty)
    Server->>Gemini: Generate initial question for target role
    Gemini-->>Server: First question string
    Server->>DB: Insert interview record (Status: "in_progress") & save first question
    Server-->>App: First question JSON
    App->>User: Display question

    loop For 5 Questions
        User->>App: Type/Submit answer
        App->>Server: POST /api/mock-interviews/:id/answer (UserAnswer)
        Server->>DB: Save user answer
        Server->>Gemini: Evaluate current answer + generate next question
        Gemini-->>Server: Next question + feedback
        Server->>DB: Save next question
        Server-->>App: Next question JSON
        App->>User: Display next question
    end

    Note over Server: After 5 turns, interview completes
    Server->>Gemini: Request final overall evaluation (Overall score, strengths, weak areas)
    Gemini-->>Server: Structured feedback JSON
    Server->>DB: Update interview status to "completed" & save overall feedback
    Server->>DB: Award Completion XP (e.g. +50 XP) & increment daily streak
    Server-->>App: Final Evaluation report JSON
    App->>User: Display feedback charts, strengths list, and XP earned
```
