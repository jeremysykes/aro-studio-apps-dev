# Application flow (holistic)

How Core, Desktop, Web, and Modules fit together.

```mermaid
flowchart LR
    subgraph desktop [Desktop]
        direction TB
        DMain[Main Process]
        DIPC[IPC Bridge]
        DRenderer[Renderer]
        DMain --> DIPC --> DRenderer
    end

    subgraph web [Web]
        direction TB
        WBackend[Node Server]
        WAPI[HTTP/WS API]
        WFrontend[Browser SPA]
        WBackend --> WAPI --> WFrontend
    end

    subgraph core [Core Engine]
        createCore[createCore]
    end

    subgraph modules [Modules]
        Init[init]
        MUI[Module UI]
    end

    DMain -->|imports| createCore
    WBackend -->|imports| createCore
    DMain -->|loads| Init
    WBackend -->|loads| Init
    Init -->|registers jobs| createCore
    createCore --> DMain
    createCore --> WBackend
    MUI --> DRenderer
    MUI --> WFrontend
```
