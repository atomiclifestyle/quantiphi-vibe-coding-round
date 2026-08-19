import React, { useRef, useState } from "react";
import { AlertTriangle, Upload, ImageUp, Trash2 } from "lucide-react";

export default function ImageScanner({ onAutofill }) {
  const fileInputRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);

    setTimeout(() => {
      onAutofill({
        name: "white rice",
        weight: "500",
      });

      setIsScanning(false);

      e.target.value = "";
    }, 800);
  };

  const triggerUpload = (e) => {
    e.preventDefault();
    fileInputRef.current.click();
  };

  return (
    <div style={{ width: "100%" }}>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button
        type="button"
        className="secondary"
        onClick={triggerUpload}
        disabled={isScanning}
      >
        {isScanning ? (
          "Analyzing Image..."
        ) : (
          <>
            <ImageUp size={20} />
            Upload Food Photo
          </>
        )}
      </button>
    </div>
  );
}
