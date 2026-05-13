import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { MonitorCog, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../store/theme/useTheme';

export default function ThemePicker() {
  const { theme, setTheme } = useTheme();

  return (
    <Menu>
      <MenuButton
        className={`outline-none text-(--primaryText) p-1 md:p-2 border border-(--border) rounded-xl bg-(--background) hover:bg-(--bgActive) cursor-pointer`}
      >
        {theme === 'light' && <Sun className='w-4 h-4' />}
        {theme === 'dark' && <Moon className='w-4 h-4' />}
        {theme === 'system' && <MonitorCog className='w-4 h-4' />}
      </MenuButton>
      <MenuItems
        anchor='bottom end'
        className={`bg-(--foreground) p-1 flex flex-col gap-1 rounded-xl border border-(--border) outline-none select-none text-(--primaryText)`}
      >
        <MenuItem>
          <div
            className={`px-2 py-0.5 flex items-center gap-4 hover:bg-(--bgActive) hover:text-(--themeAccent) rounded-xl ${theme === 'light' && 'bg-(--bgActive) text-(--themeAccent)'}`}
            onClick={() => setTheme('light')}
          >
            <Sun className='w-4 h-4' />
            <span className='text-sm'>Light</span>
          </div>
        </MenuItem>
        <MenuItem>
          <div
            className={`px-2 py-0.5 flex items-center gap-4 hover:bg-(--bgActive) hover:text-(--themeAccent) rounded-xl ${theme === 'dark' && 'bg-(--bgActive) text-(--themeAccent)'}`}
            onClick={() => setTheme('dark')}
          >
            <Moon className='w-4 h-4' />
            <span className='text-sm'>Dark</span>
          </div>
        </MenuItem>
        <MenuItem>
          <div
            className={`px-2 py-0.5 flex items-center gap-4 hover:bg-(--bgActive) hover:text-(--themeAccent) rounded-xl ${theme === 'system' && 'bg-(--bgActive) text-(--themeAccent)'}`}
            onClick={() => setTheme('system')}
          >
            <MonitorCog className='w-4 h-4' />
            <span className='text-sm'>System</span>
          </div>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
