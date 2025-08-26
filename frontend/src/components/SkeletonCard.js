import React from "react";

export default function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white rounded-2xl shadow p-4">
      <div className="h-40 w-full rounded-xl bg-gray-200" />
      <div className="h-4 bg-gray-200 rounded mt-4 w-3/4" />
      <div className="h-3 bg-gray-200 rounded mt-2 w-1/2" />
      <div className="h-3 bg-gray-200 rounded mt-4 w-full" />
      <div className="h-3 bg-gray-200 rounded mt-2 w-5/6" />
    </div>
  );
}
