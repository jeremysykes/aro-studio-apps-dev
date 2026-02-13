# Module Models Diagram

## Standalone Model

One module per app. Module owns the renderer content.

```mermaid
flowchart TB
  subgraph ModelA ["Standalone"]
    DesktopA[Desktop Shell]
    ModuleA[Single Active Module]
    CoreA[Core]
    DesktopA --> CoreA
    ModuleA --> DesktopA
    ModuleA -.->|registers jobs| CoreA
  end
```

## Sidebar Model

One app, multiple modules. Sidebar switches between full module views.

```mermaid
flowchart TB
  subgraph ModelB ["Sidebar"]
    direction TB
    DesktopB[Desktop Shell]
    SidebarB[Sidebar Nav]
    ContentB[Content Slot]
    Module1B[Module 1<br/>full view]
    Module2B[Module 2<br/>full view]
    Module3B[Module 3<br/>full view]
    CoreB[Core]

    SidebarB --> ContentB
    ContentB -.- Module1B
    ContentB -.- Module2B
    ContentB -.- Module3B
    DesktopB --> SidebarB
    DesktopB --> ContentB
    DesktopB --> CoreB
    Module1B -.->|registers jobs| CoreB
    Module2B -.->|registers jobs| CoreB
    Module3B -.->|registers jobs| CoreB
  end
```

## Dashboard Model

One app, multiple modules visible simultaneously as tiles. Sidebar still available for full views.

```mermaid
flowchart TB
  subgraph ModelC ["Dashboard"]
    direction TB
    DesktopC[Desktop Shell]
    SidebarC[Sidebar Nav]
    DashboardC[Dashboard Grid]
    Widget1[Module 1<br/>Widget]
    Widget2[Module 2<br/>Widget]
    Widget3[Module 3<br/>Widget]
    ContentC[Content Slot]
    FullView[Full Module View<br/>on click]
    CoreC[Core]

    DesktopC --> SidebarC
    DesktopC --> DashboardC
    DesktopC --> ContentC
    DesktopC --> CoreC
    DashboardC --> Widget1
    DashboardC --> Widget2
    DashboardC --> Widget3
    Widget1 -->|click to expand| ContentC
    SidebarC --> ContentC
    ContentC -.- FullView
    Widget1 -.->|window.aro| CoreC
    Widget2 -.->|window.aro| CoreC
    Widget3 -.->|window.aro| CoreC
  end
```

## Transition Flow

```mermaid
flowchart LR
  A["Standalone"] -->|"+ sidebar shell<br/>+ multi-module loading<br/>+ IPC namespacing"| B["Sidebar"]
  B -->|"+ Widget exports<br/>+ dashboard grid<br/>+ layout engine"| C["Dashboard"]
```

Reference: [docs/modules/MODULE_MODELS.md](../docs/modules/MODULE_MODELS.md) and [docs/modules/MODULE_TRANSITION.md](../docs/modules/MODULE_TRANSITION.md).
