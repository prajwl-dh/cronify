export default function Loading() {
  return (
    <div className='fixed inset-0 flex items-center justify-center bg-(--background) text-(--primaryText)'>
      <div className='text-center'>
        <div className='animate-spin h-10 w-10 border-4 border-(--primaryText) border-t-transparent rounded-full mx-auto mb-4' />
        <p>Trying to connect to the server...</p>
        <p className='text-sm opacity-80 pt-4'>
          Make sure the cronify daemon is running!
        </p>

        <button
          onClick={() => window.location.reload()}
          className='mt-6 px-4 py-2 bg-white text-black rounded-2xl hover:bg-gray-200 transition shadow-md cursor-pointer select-none'
        >
          Reload
        </button>
      </div>
    </div>
  );
}
