export default function Error({ error }: { error: Error }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-(--background) text-(--primaryText)">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold mb-2">Server unavailable</h2>
        <p className="text-sm opacity-80 mb-4">
          Unable to connect to the backend. Make sure the cronify daemon is
          running!
        </p>

        <p className="text-xs opacity-60 mb-4">{error.message}</p>

        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-white text-black rounded-2xl hover:bg-gray-200 transition cursor-pointer select-none"
        >
          Reload
        </button>
      </div>
    </div>
  );
}
