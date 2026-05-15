import { Terminal } from 'lucide-react';
import ActionButton from './ActionButton';
import ThemePicker from './ThemePicker';

export default function Navbar() {
  return (
    <div className='w-full flex items-center justify-center bg-(--foreground) border-b border-(--border)'>
      <div className='w-full max-w-416 py-2 px-2 md:p-y4 md:px-6 flex justify-between items-center'>
        {/* Logo */}
        <div
          className='flex items-center gap-1 select-none cursor-pointer'
          onClick={() => window.location.reload()}
        >
          <div className='p-1 rounded-full bg-(--themeAccent)'>
            <Terminal className='w-3 h-3 md:w-5 md:h-5 text-white' />
          </div>
          <span className='text-md md:text-xl font-black tracking-wider text-(--themeAccent)'>
            CRONIFY
          </span>
        </div>

        {/* Theme picker and action button */}
        <div className='flex items-center gap-2 md:gap-4 text-(--primaryText)'>
          <ThemePicker />
          <ActionButton />
        </div>
      </div>
    </div>
  );
}
