import { useState } from "react";

export default function UploadBox({ onUpload }) {
  const [image, setImage] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    setImage(URL.createObjectURL(file));
    onUpload(file);
  };

  return (
    <div className="border-2 border-dashed border-gray-400 rounded-2xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer">
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
        id="fileUpload"
      />
      <label htmlFor="fileUpload" className="cursor-pointer text-gray-600">
        {image ? (
          <img src={image} alt="preview" className="w-40 rounded-lg shadow-md" />
        ) : (
          "📸 Upload a dish or ingredients"
        )}
      </label>
    </div>
  );
}
