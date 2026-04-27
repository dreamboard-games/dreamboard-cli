import {
  BoardEdgeIdOf,
  BoardVertexIdOf,
  type HexGridBoardProps,
  type SquareGridBoardProps,
  useActions,
  useGameView,
  useHexBoard,
  useSquareBoard,
} from "@dreamboard/ui-sdk";

export function BoardTypingSmoke() {
  const view = useGameView();
  const phase = useActions();

  type HexViewEdgeId = BoardEdgeIdOf<typeof view.hexBoard>;
  type HexViewVertexId = BoardVertexIdOf<typeof view.hexBoard>;
  type SquareViewEdgeId = BoardEdgeIdOf<typeof view.squareBoard>;
  type SquareViewVertexId = BoardVertexIdOf<typeof view.squareBoard>;

  const hexBoard = useHexBoard(view.hexBoard);
  const squareBoard = useSquareBoard(view.squareBoard);

  const hexViewEdgeId: HexViewEdgeId = view.hexBoard.edges[0]!.id;
  const hexViewVertexId: HexViewVertexId = view.hexBoard.vertices[0]!.id;
  const squareViewEdgeId: SquareViewEdgeId = view.squareBoard.edges[0]!.id;
  const squareViewVertexId: SquareViewVertexId =
    view.squareBoard.vertices[0]!.id;
  const hexGridProps = {
    board: view.hexBoard,
    renderTile: () => null,
    renderEdge: () => null,
    renderVertex: () => null,
    onInteractiveEdgeClick: (edge) => {
      void phase.commands.claimHexEdge({
        edgeId: edge.id,
      });
    },
    onInteractiveVertexClick: (vertex) => {
      void phase.commands.claimHexVertex({
        vertexId: vertex.id,
      });
    },
  } satisfies HexGridBoardProps<typeof view.hexBoard>;
  const squareGridProps = {
    board: view.squareBoard,
    renderCell: () => null,
    renderPiece: () => null,
    onInteractiveEdgeClick: (edge) => {
      void phase.commands.claimSquareEdge({
        edgeId: edge.id,
      });
    },
    onInteractiveVertexClick: (vertex) => {
      void phase.commands.claimSquareVertex({
        vertexId: vertex.id,
      });
    },
  } satisfies SquareGridBoardProps<typeof view.squareBoard>;

  void hexBoard.getTileAt(0, 0);
  void squareBoard.getCellAt(0, 0);
  void [
    hexViewEdgeId,
    hexViewVertexId,
    squareViewEdgeId,
    squareViewVertexId,
    hexGridProps,
    squareGridProps,
  ];

  return null;
}
