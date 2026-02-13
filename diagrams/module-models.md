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

## Tabs Model

Horizontal tab bar. One module visible at a time. Best for 2–4 modules.

```mermaid
flowchart TB
  subgraph Tabs ["Tabs"]
    direction TB
    DesktopT[Desktop Shell]
    TabBar[Tab Bar]
    ContentT[Content Slot]
    Module1T[Module 1<br/>full view]
    Module2T[Module 2<br/>full view]
    CoreT[Core]

    TabBar --> ContentT
    ContentT -.- Module1T
    ContentT -.- Module2T
    DesktopT --> TabBar
    DesktopT --> ContentT
    DesktopT --> CoreT
    Module1T -.->|registers jobs| CoreT
    Module2T -.->|registers jobs| CoreT
  end
```

## Carousel Model

Arrow/dot navigation. One module fills the screen. No persistent nav chrome.

```mermaid
flowchart TB
  subgraph Carousel ["Carousel"]
    direction TB
    DesktopR[Desktop Shell]
    ContentR[Full Screen Content]
    NavR["← ● ○ ○ →"]
    Module1R[Module 1<br/>full view]
    Module2R[Module 2<br/>full view]
    Module3R[Module 3<br/>full view]
    CoreR[Core]

    DesktopR --> ContentR
    DesktopR --> NavR
    NavR -->|prev / next| ContentR
    ContentR -.- Module1R
    ContentR -.- Module2R
    ContentR -.- Module3R
    DesktopR --> CoreR
    Module1R -.->|registers jobs| CoreR
    Module2R -.->|registers jobs| CoreR
    Module3R -.->|registers jobs| CoreR
  end
```

## Model Relationships

```mermaid
flowchart LR
  A["Standalone"] -->|"+ multi-module<br/>loading"| B["Sidebar"]
  B -->|"+ widget grid"| C["Dashboard"]
  B -.->|"swap nav"| D["Tabs"]
  B -.->|"swap nav"| E["Carousel"]
```

Reference: [docs/modules/MODULE_MODELS.md](../docs/modules/MODULE_MODELS.md) and [docs/modules/MODULE_TRANSITION.md](../docs/modules/MODULE_TRANSITION.md).
