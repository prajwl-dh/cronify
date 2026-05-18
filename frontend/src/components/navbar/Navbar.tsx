import { Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { APP_PORT } from '../../config/config';
import ActionButton from './ActionButton';
import ThemePicker from './ThemePicker';

export default function Navbar({
  setShowLog,
}: {
  setShowLog: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    async function getAppVersion() {
      try {
        const res = await fetch(`http://127.0.0.1:${APP_PORT}/api/version`);
        const data = (await res.json()) as { version: string };

        setAppVersion(data.version);
      } catch (error) {
        console.error('Fetch app version error:', error);
      }
    }

    getAppVersion();
  }, []);

  return (
    <div className='w-full flex items-center justify-center bg-(--foreground) border-b border-(--border)'>
      <div className='w-full max-w-416 py-2 px-2 md:p-y4 md:px-6 flex justify-between items-center'>
        {/* Logo */}
        <div className='flex items-center gap-1 select-none'>
          <div className='p-1 rounded-full bg-(--themeAccent)'>
            <Terminal className='w-3 h-3 md:w-5 md:h-5 text-white' />
          </div>
          <div className='flex flex-col'>
            <span className='text-md md:text-xl font-black tracking-wider text-(--themeAccent)'>
              CRONIFY
            </span>
            {appVersion.length > 0 && (
              <span className='text-xs text-(--secondaryText) tracking-wider -mt-1.5 ml-0.5'>
                v{appVersion}
              </span>
            )}
          </div>
        </div>

        {/* Theme picker and action button */}
        <div className='flex items-center gap-2 md:gap-4 text-(--primaryText)'>
          <ThemePicker />
          <ActionButton setShowLog={setShowLog} />
        </div>
      </div>
    </div>
  );
}
