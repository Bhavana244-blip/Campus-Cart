# CampusCart Architecture Documentation

This document outlines the technical architecture of **CampusCart**, a student-to-student marketplace designed for SRM KTR. The project follows a modern **Serverless (Backend-as-a-Service)** model to ensure rapid development, security, and scalability.

---

## 1. Application Architecture: Serverless (BaaS)

CampusCart utilizes a **Serverless Architecture** by leveraging **Supabase** as its core platform. Instead of maintaining a dedicated server environment (like a Node.js or Python backend), the application interacts directly with managed cloud services.

### Why Serverless?
- **Reduced Overhead**: The student team does not need to manage server infrastructure, OS updates, or scaling logic.
- **Security by Design**: Row Level Security (RLS) is handled at the database layer, ensuring that even if the client-side code is compromised, data access is restricted to authenticated users.
- **Real-time Capabilities**: Built-in support for WebSockets (Supabase Realtime) allows for instantaneous chat and notification updates without custom socket management.

### Deployment Diagram
This diagram shows the system hosted across the **Client Tier** (Expo) and the **Service Tier** (Supabase).

```mermaid
graph TD
    subgraph "Client Tier (Expo / React Native)"
        A["Mobile App (iOS/Android)"]
        B["Web Interface"]
    end

    subgraph "Service Tier (Supabase Cloud)"
        C["Auth (GoTrue)"]
        D["API (PostgREST)"]
        E["Images (Storage)"]
        F["Realtime (WebSockets)"]
    end

    A --> C
    A --> D
    A --> E
    A --> F
    B --> C
    B --> D
    B --> E
    B --> F
```

### Component Diagram
This diagram outlines the internal logical components of the system.

```mermaid
graph TB
    subgraph "Frontend Component"
        FE[Expo Router App]
        Z[Zustand Stores]
        SDK[Supabase-js SDK]
    end
    
    subgraph "Backend Services"
        DB[(PostgreSQL)]
        ST[Storage Bucket]
        RT[Realtime Engine]
    end
    
    FE --> Z
    Z --> SDK
    SDK --> DB
    SDK --> ST
    SDK --> RT
```

---

## 2. Behavioral & Logical Design

### 2.1 Use Case Diagram
This diagram details the core interactions between students and the system.

```mermaid
graph TD
    Student((Student))
    
    subgraph "Seller Actions"
        UC1((Create Listing))
        UC2((Mark as Sold))
        UC3((Upload Photos))
    end

    subgraph "Buyer Actions"
        UC4((Search Items))
        UC5((Save to Wishlist))
        UC6((Chat with Seller))
    end

    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4
    Student --> UC5
    Student --> UC6
```

### 2.2 Data Flow Diagram (DFD Level 1)
This diagram maps how data travels through the system during a "Listing Creation" flow.

```mermaid
graph LR
    User((Student)) --"Item Details"--> App[Mobile App]
    App --"Insert Record"--> API[PostgREST API]
    API --"Write"--> DB[(PostgreSQL)]
    App --"Upload Image"--> Store[Storage API]
    Store --"Save Blob"--> S3[S3 Bucket]
    Store --"URL"--> App
```

---

## 3. Database Design

### 3.1 ER Diagram
The database is structured as a relational schema with strictly enforced referential integrity.

```mermaid
erDiagram
    USERS ||--o{ LISTINGS : "posts"
    USERS ||--o{ CONVERSATIONS : "participates"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ WISHLIST : "saves"
    LISTINGS ||--o{ CONVERSATIONS : "context for"
    LISTINGS ||--o{ WISHLIST : "contained in"
    CONVERSATIONS ||--o{ MESSAGES : "contains"
    
    USERS {
        uuid id PK
        uuid auth_user_id FK
        text email
        text full_name
    }
    
    LISTINGS {
        uuid id PK
        uuid seller_id FK
        text title
        int price
        boolean is_sold
    }
    
    CONVERSATIONS {
        uuid id PK
        uuid listing_id FK
        uuid buyer_id FK
        uuid seller_id FK
    }
    
    MESSAGES {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        text content
    }
```

### 3.2 Class Diagram
This diagram represents the logical object model used in the frontend application.

```mermaid
classDiagram
    class User {
        +UUID id
        +String fullName
        +String email
        +getProfile()
    }
    class Listing {
        +UUID id
        +String title
        +Number price
        +Boolean isSold
        +toggleSold()
    }
    class ChatThread {
        +UUID id
        +Message[] messages
        +sendMessage()
    }
    class Wishlist {
        +UUID[] listingIds
        +toggleItem()
    }

    User "1" -- "*" Listing : sells
    User "1" -- "*" ChatThread : participates
    User "1" -- "1" Wishlist : owns
    Listing "1" -- "*" ChatThread : discusses
```

### 3.3 Schema Design Key Features
- **UUIDs**: All primary keys use `gen_random_uuid()` for global uniqueness across distributed environments.
- **RLS Policies**: Data access is governed by SQL policies (e.g., [(storage.foldername(name))[1] = auth.uid()::text](file:///c:/Users/BHAVANA/.gemini/antigravity/scratch/campuscart/stores/authStore.ts#27-32)), ensuring users can only modify their own data.
- **Triggers**: Automatic logic increments `sold_count` on the `users` table whenever a listing's `is_sold` flag is updated.

---

## 4. Data Exchange Contract

### 4.1 Frequency of Data Exchanges
- **On-Demand (Pull)**: Triggered by user interaction (e.g., refreshing the home feed, searching for a product, opening a profile).
- **Real-time (Push)**: Triggered by database events. When a message is inserted into the `messages` table, it is broadcasted via WebSockets to the recipient's active session.

### 4.2 Data Sets
1. **User Identity**: Metadata relating to student verification (SRM email domains) and contact info.
2. **Product Catalog**: Multi-tier data including category tagging, condition status, and location labels (UB, Tech Park, etc.).
3. **Communication Blobs**: Text-based chat history and chronological notification events.

### 4.3 Mode of Exchanges
- **RESTful API (JSON)**: Standard CRUD operations (Create, Read, Update, Delete) are performed via HTTPS POST/GET requests to the Supabase PostgREST endpoint.
- **WebSockets (Realtime)**: Used specifically for the **Chat System** and **Notifications** to provide a "live" feel.
- **Multipart/Form-Data**: Used for the **Storage API** to handle binary image uploads for listings.

---

## 5. Sequence Diagram: Student Inquiry Flow
This diagram demonstrates the flow of data when a buyer messages a seller.

```mermaid
sequenceDiagram
    participant B as Buyer (App)
    participant RT as Realtime Service
    participant D as PostgreSQL
    participant S as Seller (App)

    B->>D: INSERT Message (Content, Thread_ID)
    D-->>RT: Trigger Broadcast
    RT-->>S: WebSocket "New Message" Event
    S->>S: Update UI with Message
    D-->>B: Confirmation (Sent)
```
