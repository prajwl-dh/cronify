import { Dialog, DialogPanel } from '@headlessui/react';
import { CalendarDays, Plus, Repeat, X, Zap } from 'lucide-react';
import { useState } from 'react';
import cronValidator from '../../utils/validator';
import Button from '../common/Button';

export default function ActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  const [name, setName] = useState('');
  const [command, setCommand] = useState('');
  const [scheduleType, setScheduleType] = useState('once');
  const [scheduleValue, setScheduleValue] = useState('');
  const [cronError, setCronError] = useState('');

  return (
    <>
      <Button
        title='Add a new task'
        onClick={() => {
          setName('');
          setCommand('');
          setScheduleType('once');
          setScheduleValue('');
          setCronError('');
          setIsOpen(true);
        }}
        className='text-sm bg-(--themeAccent) text-white cursor-pointer hover:brightness-125 transition-all font-bold'
      >
        + Add Task
      </Button>

      <Dialog
        open={isOpen}
        as='div'
        className={`relative z-50 focus:outline-none font-mono`}
        onClose={() => {}}
      >
        <div
          className={`flex fixed inset-0 z-50 overflow-y-auto items-center justify-center bg-transparent backdrop-blur-sm p-2`}
        >
          <DialogPanel
            transition
            className={`flex flex-col gap-4 p-6 w-full max-w-lg rounded-xl bg-(--foreground) border border-(--border) ease-in-out duration-500`}
          >
            {/* Title */}
            <div className='flex items-center justify-between mb-2 text-(--primaryText)'>
              <div className={`flex items-center gap-2`}>
                <div className='bg-(--bgActive) p-1 rounded-xl'>
                  <Plus className='h-5 w-5 font-bold' />
                </div>
                <span className='font-bold text-lg'>Add A New Task</span>
              </div>

              <button
                className='cursor-pointer'
                title='Close Popup'
                onClick={() => setIsOpen(false)}
              >
                <X className='h-5 w-5 font-bold' />
              </button>
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
                  placeholder='e.g., bun ./home/script.js'
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
                      onClick={() => {
                        if (scheduleType !== type.id) {
                          setScheduleValue('');
                        }
                        setScheduleType(type.id);
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
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

              {scheduleType === 'date' && (
                <div className='flex flex-col gap-2'>
                  <span className='font-semibold text-sm'>
                    Select Date & Time
                  </span>
                  <input
                    type='datetime-local'
                    required
                    value={scheduleValue}
                    onChange={(e) => setScheduleValue(e.target.value)}
                    className='w-full bg-(--background) border-[1.5px] border-(--border) rounded-xl px-4 py-2.5 placeholder:text-(--secondaryText) focus:outline-none focus:border-(--borderActive)'
                  />
                </div>
              )}

              {scheduleType === 'cron' && (
                <div className='flex flex-col gap-2'>
                  <span className='font-semibold text-sm'>Cron Expression</span>
                  <input
                    type='text'
                    required
                    value={scheduleValue}
                    onChange={(e) => {
                      setScheduleValue(e.target.value);
                      if (e.target.value.trim().length === 0) {
                        setCronError('');
                      } else {
                        setCronError(cronValidator(e.target.value));
                      }
                    }}
                    placeholder='* * * * *'
                    className={`w-full bg-(--background) border-[1.5px] rounded-xl px-4 py-2.5 placeholder:text-(--secondaryText) focus:outline-none ${cronError.length > 0 ? 'border-red-500 focus:border-red-500' : 'focus:border-(--borderActive) border-(--border)'}`}
                  />
                  {cronError.length > 0 && (
                    <span className='text-xs text-red-500'>
                      Invalid cron expression
                    </span>
                  )}
                </div>
              )}

              <p
                className={`flex items-center text-xs gap-1.5 ${scheduleType !== 'once' && 'hidden'}`}
              >
                <Zap className='w-3.5 h-3.5' /> Task will execute exactly once
                immediately
              </p>

              <p
                className={`flex items-center text-xs gap-1.5 ${scheduleType !== 'date' && 'hidden'}`}
              >
                <CalendarDays className='w-3.5 h-3.5' /> Task will execute
                exactly once at this date
              </p>

              <p
                className={`flex items-center text-xs gap-1.5 ${scheduleType !== 'cron' && 'hidden'}`}
              >
                <Repeat className='w-3.5 h-3.5' /> E.g., "0 * * * *" will run
                this task every hour
              </p>
            </div>

            {/* Buttons */}
            <div className='flex items-center justify-end gap-2'>
              <Button
                title='Cancel'
                onClick={() => setIsOpen(false)}
                className='min-w-20 text-sm border border-(--border) bg-(--background) text-(--primaryText) cursor-pointer hover:brightness-90 transition-all font-bold'
              >
                Cancel
              </Button>
              <Button
                title='Confirm'
                className='min-w-20 text-sm bg-(--themeAccent) text-white cursor-pointer hover:brightness-125 transition-all font-bold'
              >
                Confirm
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
