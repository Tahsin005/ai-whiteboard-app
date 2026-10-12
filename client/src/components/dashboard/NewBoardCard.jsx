import { Plus } from "lucide-react";

export function NewBoardCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="new-board-card"
    >
      <div className="new-board-icon">
        <Plus size={30} />
      </div>

      <span className="new-board-title">
        New Whiteboard
      </span>

      <span className="new-board-desc">
        Start a new blank canvas with dot matrix, grid, or clean styles
      </span>
    </button>
  );
}

export default NewBoardCard;
