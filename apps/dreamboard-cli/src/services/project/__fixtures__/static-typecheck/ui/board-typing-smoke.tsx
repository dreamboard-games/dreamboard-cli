import {
  type BoardEdgeIdOf,
  type BoardVertexIdOf,
  type HexGridBoardProps,
  type SquareGridBoardProps,
  useGameView,
  useHexBoard,
  useSeatInbox,
  useSquareBoard,
} from "@dreamboard/ui-sdk";

export function BoardTypingSmoke() {
  const view = useGameView() as {
    hexBoard: Parameters<typeof useHexBoard>[0];
    squareBoard: Parameters<typeof useSquareBoard>[0];
  };
  const inbox = useSeatInbox();

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
    onInteractiveEdgeClick: (_edge) => {},
    onInteractiveVertexClick: (_vertex) => {},
  } satisfies HexGridBoardProps<typeof view.hexBoard>;
  const squareGridProps = {
    board: view.squareBoard,
    renderCell: () => null,
    renderPiece: () => null,
    onInteractiveEdgeClick: (_edge) => {},
    onInteractiveVertexClick: (_vertex) => {},
  } satisfies SquareGridBoardProps<typeof view.squareBoard>;

  void hexBoard.getTileAt(0, 0);
  void squareBoard.getCellAt(0, 0);
  void inbox.bySurface.board;
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
