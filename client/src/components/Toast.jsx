import { useEffect } from "react";
import "./Toast.css";

export default function Toast({ message, image, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="toast-box">
      {image && <img src={image} className="toast-img" />}
      <div className="toast-text">{message}</div>
    </div>
  );
}
