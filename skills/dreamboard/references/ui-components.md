# UI components

Browse reusable Dreamboard UI components and generated prop references.

Dreamboard ships generic presentational components in
`@dreamboard/ui-sdk/components`. They are useful building blocks, but they are
not the game contract. Use generated hooks and surfaces to decide what is legal;
use these components to draw the result.

```tsx
import {
  Card,
  Hand,
  HexGrid,
  PhaseIndicator,
} from "@dreamboard/ui-sdk/components";
```

## Runtime shell components

| Component | Use |
| --- | --- |
| `PluginRuntime` | Provides runtime, session, and plugin-state context to authored hooks. Usually scaffolded at the root. |
| `ErrorBoundary` | Keeps authored render failures inside the plugin frame. |
| `GameSkeleton` | Loading and empty-state shell. |
| `ToastProvider` / `useToast` | Local transient UI feedback that is not reducer state. |

Most workspaces receive these through scaffolded local files. Keep them near the
root and render game UI underneath.

## Surface components

| Component | Use |
| --- | --- |
| `GameShell` | Generic composed shell. Most authored workspaces should use the generated `WorkspaceGameShell` from `@dreamboard/ui-contract`. |
| `PanelSurface` | Renders `surface: "panel"` interactions. |
| `InboxSurface` | Renders prompt-kind and inbox interactions. |
| `HandSurface` | Renders zone-backed hands or hand descriptors. |
| `BoardSurface` | Exposes board target routing for custom geometry. |
| `BlockerSurface` | Renders mandatory blocking interactions. |
| `ChromeSurface` | Renders persistent chrome interactions. |
| `DefaultInteractionButton` | Standard fallback button for descriptor renderers. |
| `ExhaustivenessAudit` | Development warning for interactions that fall through to defaults. |

See [WorkspaceGameShell](./game-shell.md) and [Custom renderers](./custom-renderers.md)
before composing these directly.

## Board primitives

| Component | Good fit |
| --- | --- |
| `HexGrid` | Hex maps with spaces, vertices, edges, pan/zoom, custom tile rendering. |
| `SquareGrid` | Square boards, cells, orthogonal edges, vertices, chess-like layouts. |
| `NetworkGraph` | Node-link maps, routes, influence graphs, path games. |
| `TrackBoard` | Score tracks, progress tracks, rondels, race tracks. |
| `ZoneMap` | Area-control maps, Venn zones, regions, abstract areas. |
| `SlotSystem` | Worker placement, tableau slots, market rows, equipment slots. |

These components do not replace manifest topology or board target rules. Feed
them static geometry and projected eligibility from the view or board surfaces.

## Card and action primitives

| Component | Good fit |
| --- | --- |
| `Card` | One card face, selected/disabled/playable state, custom content. |
| `Hand` | Fan or row layout for a list of cards. |
| `PlayArea` | Shared play zones or tableau regions. |
| `ActionButton` / `PrimaryButton` | Local buttons when a surface renderer needs custom framing. |
| `ActionPanel` / `ActionGroup` | Grouped action areas outside the default `PanelSurface`. |

For playable cards, prefer [Hand surfaces](./hand-surfaces.md) so card
eligibility comes from descriptors rather than local checks.

## Status primitives

| Component | Good fit |
| --- | --- |
| `PlayerInfo` | Player badge, color, name, and active status. |
| `PhaseIndicator` | Current phase or step display. |
| `DiceRoller` | Dice result display and roll affordance. |
| `GameEndDisplay` | Winner and score summary. |
| `ResourceCounter` / `CostDisplay` | Resource amounts and costs. |

Status components should receive reducer view data or lobby/session data. They
should not query or mutate gameplay directly.

## Prop reference

### Card

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `card` | `CardItem` | Yes | `card` value |
| `selected` | `boolean` | No | `selected` value |
| `disabled` | `boolean` | No | `disabled` value |
| `size` | `'sm' \| 'md' \| 'lg'` | No | `size` value |
| `faceDown` | `boolean` | No | `faceDown` value |
| `renderContent` | `(card: CardItem) => React.ReactNode` | No | `renderContent` value |
| `onCardClick` | `(cardId: string) => void` | No | `onCardClick` value |

### Hand

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `cards` | `readonly CardItem[]` | Yes | `cards` value |
| `selectedIds` | `readonly string[]` | No | `selectedIds` value |
| `disabled` | `boolean` | No | `disabled` value |
| `cardSize` | `CardSize` | No | `cardSize` value |
| `layout` | `HandLayout` | No | `layout` value |
| `renderCard` | `(props: HandCardRenderProps) => ReactNode` | Yes | `renderCard` value |
| `renderDrawer` | `(props: HandDrawerRenderProps) => ReactNode` | Yes | Render function for drawer mode (when cards don't fit on small screens) |
| `renderEmpty` | `(props: HandEmptyRenderProps) => ReactNode` | Yes | `renderEmpty` value |
| `renderContainer` | `(props: HandContainerRenderProps) => ReactNode` | No | `renderContainer` value |
| `className` | `string` | No | `className` value |

### PlayArea

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `cards` | `readonly CardItem[]` | Yes | `cards` value |
| `filter` | `(card: CardItem) => boolean` | No | `filter` value |
| `cardSize` | `CardProps['size']` | No | `cardSize` value |
| `renderCard` | `CardProps['renderContent']` | No | `renderCard` value |
| `layout` | `'grid' \| 'row'` | No | `layout` value |
| `interactive` | `boolean` | No | `interactive` value |
| `onCardClick` | `(cardId: string) => void` | No | `onCardClick` value |
| `className` | `string` | No | `className` value |

### ActionButton

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `label` | `string` | No | `label` value |
| `children` | `ReactNode` | No | `children` value |
| `description` | `string` | No | `description` value |
| `cost` | `Record<string, number>` | No | `cost` value |
| `currentResources` | `Record<string, number>` | No | `currentResources` value |
| `resourceDefs` | `ResourceDefinition[]` | No | `resourceDefs` value |
| `available` | `boolean` | No | `available` value |
| `disabledReason` | `string` | No | Shown as tooltip when disabled |
| `loading` | `boolean` | No | `loading` value |
| `icon` | `ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: string; }>` | No | `icon` value |
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'success'` | No | `variant` value |
| `size` | `'sm' \| 'md' \| 'lg'` | No | `size` value |
| `onClick` | `() => void` | Yes | `onClick` value |
| `className` | `string` | No | `className` value |

### ActionPanel

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | No | `title` value |
| `state` | `string` | No | Current game state/phase for context display |
| `stateLabels` | `Record<string, string>` | No | Human-readable state labels |
| `collapsible` | `boolean` | No | `collapsible` value |
| `defaultExpanded` | `boolean` | No | `defaultExpanded` value |
| `children` | `ReactNode` | Yes | `children` value |
| `className` | `string` | No | `className` value |

### ActionGroup

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | Yes | `title` value |
| `description` | `string` | No | `description` value |
| `visible` | `boolean` | No | `visible` value |
| `variant` | `'default' \| 'warning' \| 'danger' \| 'success'` | No | Highlight style for special phases |
| `children` | `ReactNode` | Yes | `children` value |
| `className` | `string` | No | `className` value |

### PlayerInfo

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `playerId` | `PlayerId` | Yes | `playerId` value |
| `name` | `string` | No | `name` value |
| `isActive` | `boolean` | No | `isActive` value |
| `isCurrentPlayer` | `boolean` | No | `isCurrentPlayer` value |
| `isHost` | `boolean` | No | `isHost` value |
| `color` | `string` | No | Used for avatar background |
| `score` | `number` | No | `score` value |
| `metadata` | `Record<string, unknown>` | No | `metadata` value |
| `size` | `'sm' \| 'md' \| 'lg'` | No | `size` value |
| `orientation` | `'horizontal' \| 'vertical'` | No | `orientation` value |
| `avatar` | `React.ReactNode` | No | `avatar` value |
| `className` | `string` | No | `className` value |

### DiceRoller

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `values` | `Array<number \| undefined>` | No | `values` value |
| `diceCount` | `number` | No | Used when values not provided |
| `render` | `(props: DiceRollerRenderProps) => ReactNode` | Yes | `render` value |
| `className` | `string` | No | `className` value |

### PhaseIndicator

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `currentPhase` | `string` | Yes | `currentPhase` value |
| `phaseLabels` | `Record<string, string>` | No | `phaseLabels` value |
| `isMyTurn` | `boolean` | No | `isMyTurn` value |
| `activePlayerNames` | `string[]` | No | `activePlayerNames` value |
| `variant` | `'badge' \| 'bar' \| 'minimal'` | No | `variant` value |
| `className` | `string` | No | `className` value |

### GameEndDisplay

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `isGameOver` | `boolean` | Yes | `isGameOver` value |
| `scores` | `PlayerScore[]` | Yes | Sorted by rank |
| `winnerMessage` | `string` | No | `winnerMessage` value |
| `showDetails` | `boolean` | No | `showDetails` value |
| `onReturnToLobby` | `() => void` | No | `onReturnToLobby` value |
| `className` | `string` | No | `className` value |

### TrackBoard

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `spaces` | `TrackSpace[]` | Yes | `spaces` value |
| `pieces` | `TrackPiece[]` | Yes | `pieces` value |
| `type` | `'linear' \| 'circular' \| 'branching'` | No | `type` value |
| `renderSpace` | `(space: TrackSpace, pieces: TrackPiece[]) => ReactNode` | Yes | `renderSpace` value |
| `renderConnection` | `(from: { x: number; y: number }, to: { x: number; y: number }, fromSpace: TrackSpace, toSpace: TrackSpace) => ReactNode` | No | `renderConnection` value |
| `renderJump` | `(from: { x: number; y: number }, to: { x: number; y: number }, fromSpace: TrackSpace, toSpace: TrackSpace, isUp: boolean) => ReactNode` | No | `renderJump` value |
| `width` | `number \| string` | No | `width` value |
| `height` | `number \| string` | No | `height` value |
| `enablePanZoom` | `boolean` | No | `enablePanZoom` value |
| `initialZoom` | `number` | No | `initialZoom` value |
| `minZoom` | `number` | No | `minZoom` value |
| `maxZoom` | `number` | No | `maxZoom` value |
| `className` | `string` | No | `className` value |

### SquareGrid

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `rows` | `number` | No | `rows` value |
| `cols` | `number` | No | `cols` value |
| `cells` | `readonly GridCell[]` | No | `cells` value |
| `spaces` | `Readonly<Record<string, GeneratedSquareSpaceStateLike>>` | No | `spaces` value |
| `pieces` | `readonly GridPiece[]` | No | `pieces` value |
| `edges` | `readonly SquareGridEdge[]` | No | `edges` value |
| `vertices` | `readonly SquareGridVertex[]` | No | `vertices` value |
| `cellSize` | `number` | No | `cellSize` value |
| `renderCell` | `(row: number, col: number) => ReactNode` | Yes | Receives row/col with transform centered at cell position |
| `renderPiece` | `(piece: GridPiece) => ReactNode` | Yes | Receives piece with transform centered at cell center |
| `renderEdge` | `(edge: SquareGridEdge, position: SquareEdgePosition) => ReactNode` | No | `renderEdge` value |
| `renderVertex` | `(vertex: SquareGridVertex, position: SquareVertexPosition) => ReactNode` | No | `renderVertex` value |
| `showCoordinates` | `boolean` | No | `showCoordinates` value |
| `coordinateStyle` | `'algebraic' \| 'numeric' \| 'none'` | No | `coordinateStyle` value |
| `width` | `number \| string` | No | `width` value |
| `height` | `number \| string` | No | `height` value |
| `enablePanZoom` | `boolean` | No | `enablePanZoom` value |
| `initialZoom` | `number` | No | `initialZoom` value |
| `minZoom` | `number` | No | `minZoom` value |
| `maxZoom` | `number` | No | `maxZoom` value |
| `className` | `string` | No | `className` value |
| `interactiveEdges` | `InteractiveTargetLayer` | No | `interactiveEdges` value |
| `interactiveVertices` | `InteractiveTargetLayer` | No | `interactiveVertices` value |
| `renderInteractiveEdge` | `(edge: InteractiveSquareEdge, position: SquareEdgePosition, state: InteractiveTargetRenderState) => ReactNode` | No | `renderInteractiveEdge` value |
| `renderInteractiveVertex` | `(vertex: InteractiveSquareVertex, position: SquareVertexPosition, state: InteractiveTargetRenderState) => ReactNode` | No | `renderInteractiveVertex` value |

### HexGrid

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `tiles` | `readonly HexTileState[]` | No | `tiles` value |
| `spaces` | `Readonly<Record<string, GeneratedHexSpaceStateLike>>` | No | `spaces` value |
| `edges` | `readonly (HexEdgeState \| GeneratedTiledEdgeStateLike)[]` | No | `edges` value |
| `vertices` | `readonly (HexVertexState \| GeneratedTiledVertexStateLike)[]` | No | `vertices` value |
| `orientation` | `HexOrientation` | No | `orientation` value |
| `hexSize` | `number` | No | Hex radius in pixels |
| `renderTile` | `(tile: HexTileState) => ReactNode` | Yes | Receives tile data centered at (0,0) |
| `renderEdge` | `(edge: HexEdgeState, position: EdgePosition) => ReactNode` | Yes | Receives edge geometry in absolute SVG coordinates. Use `position.edgeAngle` to align artwork with the visible edge. |
| `renderVertex` | `(vertex: HexVertexState, position: { x: number; y: number }) => ReactNode` | Yes | `renderVertex` value |
| `width` | `number \| string` | No | `width` value |
| `height` | `number \| string` | No | `height` value |
| `enablePanZoom` | `boolean` | No | `enablePanZoom` value |
| `initialZoom` | `number` | No | `initialZoom` value |
| `minZoom` | `number` | No | `minZoom` value |
| `maxZoom` | `number` | No | `maxZoom` value |
| `className` | `string` | No | `className` value |
| `interactiveVertices` | `InteractiveTargetLayer` | No | Reducer-aware vertex target layer from `board.targetLayers.vertex(...)`. |
| `interactiveEdges` | `InteractiveTargetLayer` | No | Reducer-aware edge target layer from `board.targetLayers.edge(...)`. |
| `renderInteractiveVertex` | `(vertex: InteractiveVertex, position: { x: number; y: number }, state: InteractiveTargetRenderState) => ReactNode` | No | Receives vertex geometry in absolute SVG coordinates. |
| `renderInteractiveEdge` | `(edge: InteractiveEdge, position: EdgePosition, state: InteractiveTargetRenderState) => ReactNode` | No | Receives edge geometry in the same absolute SVG coordinates as `renderEdge`. |
| `interactiveVertexSize` | `number` | No | `interactiveVertexSize` value |
| `interactiveEdgeSize` | `number` | No | `interactiveEdgeSize` value |

### NetworkGraph

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `nodes` | `NetworkNode[]` | Yes | `nodes` value |
| `edges` | `NetworkEdge[]` | Yes | `edges` value |
| `pieces` | `NetworkPiece[]` | Yes | `pieces` value |
| `renderNode` | `(node: NetworkNode, pieces: NetworkPiece[]) => ReactNode` | Yes | Receives node centered at its position |
| `renderEdge` | `(edge: NetworkEdge, fromNode: NetworkNode, toNode: NetworkNode) => ReactNode` | Yes | `renderEdge` value |
| `renderPiece` | `(piece: NetworkPiece, position: { x: number; y: number }) => ReactNode` | Yes | `renderPiece` value |
| `width` | `number \| string` | No | `width` value |
| `height` | `number \| string` | No | `height` value |
| `nodeRadius` | `number` | No | `nodeRadius` value |
| `enablePanZoom` | `boolean` | No | `enablePanZoom` value |
| `initialZoom` | `number` | No | `initialZoom` value |
| `minZoom` | `number` | No | `minZoom` value |
| `maxZoom` | `number` | No | `maxZoom` value |
| `padding` | `number` | No | `padding` value |
| `className` | `string` | No | `className` value |

### ZoneMap

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `zones` | `ZoneDefinition[]` | Yes | `zones` value |
| `pieces` | `ZonePiece[]` | Yes | `pieces` value |
| `renderZone` | `(zone: ZoneDefinition, pieces: ZonePiece[]) => ReactNode` | Yes | `renderZone` value |
| `backgroundImage` | `string` | No | `backgroundImage` value |
| `width` | `number \| string` | No | `width` value |
| `height` | `number \| string` | No | `height` value |
| `enablePanZoom` | `boolean` | No | `enablePanZoom` value |
| `initialZoom` | `number` | No | `initialZoom` value |
| `minZoom` | `number` | No | `minZoom` value |
| `maxZoom` | `number` | No | `maxZoom` value |
| `className` | `string` | No | `className` value |

### SlotSystem

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `slots` | `readonly SlotDefinition[]` | Yes | `slots` value |
| `occupants` | `readonly SlotOccupant[]` | Yes | `occupants` value |
| `renderSlot` | `(slot: SlotDefinition, occupants: SlotOccupant[]) => ReactNode` | Yes | `renderSlot` value |
| `layout` | `'grid' \| 'list' \| 'grouped'` | No | `layout` value |
| `width` | `number \| string` | No | `width` value |
| `height` | `number \| string` | No | `height` value |
| `minSlotWidth` | `number` | No | Minimum slot width for responsive grid |
| `className` | `string` | No | `className` value |
