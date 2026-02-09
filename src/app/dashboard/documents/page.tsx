"use client";

export default function DocumentsPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-black dark:text-white">
        My Documents
      </h1>

      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-dark">
        <p className="text-body-color dark:text-body-color-dark">
          No documents available yet.
        </p>
      </div>
    </div>
  );
}
