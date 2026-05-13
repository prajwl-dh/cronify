import { Dialog, DialogPanel } from '@headlessui/react';
import { CalendarDays, Plus, Repeat, Zap } from 'lucide-react';
import { useState } from 'react';
import Button from '../common/Button';

export default function ActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  const [name, setName] = useState('');
  const [command, setCommand] = useState('');
  const [scheduleType, setScheduleType] = useState('once');
  const [scheduleValue, setScheduleValue] = useState('');

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
        onClose={() => {
          setIsOpen(false);
          setName('');
          setCommand('');
          setScheduleType('once');
          setScheduleValue('');
        }}
      >
        <div
          className={`flex fixed inset-0 z-50 overflow-y-auto items-center justify-center bg-transparent backdrop-blur-sm p-2`}
        >
          <DialogPanel
            transition
            className={`flex flex-col gap-4 p-6 w-full max-w-lg rounded-xl bg-(--foreground) border border-(--border) duration-100 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0`}
          >
            {/* Title */}
            <div
              className={`flex items-center gap-3 text-(--primaryText) mb-2`}
            >
              <div className='bg-(--bgActive) p-1 rounded-xl'>
                <Plus className='h-5 w-5 font-bold' />
              </div>
              <span className='font-bold text-lg'>Add A New Task</span>
            </div>

            {/* Form */}
            <div className='flex flex-col gap-5 text-(--primaryText)'>
              <div className='flex flex-col gap-2'>
                <span className='font-semibold text-sm'>Task Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='w-full bg-(--background) border-[1.5px] border-(--border) rounded-xl px-4 py-2.5 placeholder:text-(--secondaryText) focus:outline-none focus:border-(--borderActive)'
                  type='text'
                  placeholder='eg., Daily DB Backup'
                  required
                />
              </div>

              <div className='flex flex-col gap-2'>
                <span className='font-semibold text-sm'>
                  Command to Execute
                </span>
                <input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  className='w-full bg-(--background) border-[1.5px] border-(--border) rounded-xl px-4 py-2.5 placeholder:text-(--secondaryText) focus:outline-none focus:border-(--borderActive)'
                  type='text'
                  placeholder="e.g., node script.js or echo 'Hello'"
                  required
                />
              </div>

              <div className='flex flex-col gap-2'>
                <span className='font-semibold text-sm'>Schedule Type</span>
                <div className='grid grid-cols-3 gap-3'>
                  {[
                    { id: 'once', icon: Zap, label: 'Immediate' },
                    { id: 'date', icon: CalendarDays, label: 'Specific Time' },
                    { id: 'cron', icon: Repeat, label: 'Recurring' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type='button'
                      onClick={() => setScheduleType(type.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-[1.5px] transition-all ${
                        scheduleType === type.id
                          ? 'bg-(--bgActive) border-(--borderActive) text-(--themeAccent) shadow-sm'
                          : 'bg-(--foreground) border-(--border) hover:bg-(--bgActive) hover:border-(--bgActive)'
                      }`}
                    >
                      <type.icon
                        className={`w-5 h-5 mb-1.5 ${scheduleType === type.id ? 'animate-bounce-short' : ''}`}
                      />
                      <span className='text-xs font-semibold'>
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Buttons */}
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
