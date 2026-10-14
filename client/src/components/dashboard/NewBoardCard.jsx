import { Plus, PenTool } from "lucide-react";

export function NewBoardCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="new-board-card"
    >
      <div className="new-board-icon">
        <PenTool size={26} />
      </div>

      <span className="new-board-title font-hand">
        + New Whiteboard
      </span>

      <span className="new-board-desc">
        Start a blank canvas with hand-drawn dots, grid, or clean styles
      </span>
    </button>
  );
}

export default NewBoardCard;
