import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({ label = "Loading..." }) => {
  return (
    <div className="loading-screen">
      <div className="loading-spinner-box">
        <Loader2 size={26} className="animate-spin-fast" />
      </div>
      <p className="loading-spinner-label">
        {label}
      </p>
    </div>
  );
};

export default LoadingSpinner;
