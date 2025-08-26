import React, { useRef, useState } from "react";

export default function UploadDropzone({ onFileSelected }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files) => {
    const file = files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      className={`rounded-2xl border-2 border-dashed p-6 cursor-pointer transition
      ${dragOver ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="text-center">
        <div className="text-3xl">📸</div>
        <div className="font-semibold mt-2">Drop your image here</div>
        <div className="text-sm text-gray-500">or click to browse</div>
      </div>
    </div>
  );
}
