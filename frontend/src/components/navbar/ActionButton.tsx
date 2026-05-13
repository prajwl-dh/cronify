import { Dialog, DialogPanel } from '@headlessui/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import Button from '../common/Button';

export default function ActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className='text-sm bg-(--themeAccent) text-white cursor-pointer hover:brightness-110 transition-all font-bold'
      >
        + Add Task
      </Button>

      <Dialog
        open={isOpen}
        as='div'
        className={`relative z-50 focus:outline-none font-mono`}
        onClose={() => setIsOpen(false)}
      >
        <div
          className={`flex fixed inset-0 z-50 overflow-y-auto items-center justify-center bg-transparent backdrop-blur-sm p-2`}
        >
          <DialogPanel
            transition
            className={`flex flex-col gap-4 p-6 w-full max-w-lg rounded-md bg-(--foreground) border border-(--border) duration-100 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0`}
          >
            {/* Title */}
            <div className={`flex items-center gap-2 text-(--primaryText)`}>
              <div className='bg-(--bgActive) p-1 rounded-md'>
                <Plus className='h-5 w-5' />
              </div>
              <span className='font-bold'>New Task</span>
            </div>

            {/* Form */}
            <div className='h-30'>Form</div>
            {/* Buttons */}
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
