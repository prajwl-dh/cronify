import { Dialog, DialogPanel } from '@headlessui/react';
import { CalendarDays, Plus, Repeat, X, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { APP_PORT } from '../../config/config';
import { useToast } from '../../store/toast/useToast';
import type { Task } from '../../types/taskType';
import { formatDateTimeLocal } from '../../utils/converter';
import cronValidator from '../../utils/validator';
import Button from '../common/Button';

export default function ActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  const [name, setName] = useState('');
  const [command, setCommand] = useState('');
  const [scheduleType, setScheduleType] = useState('once');
  const [scheduleValue, setScheduleValue] = useState('');
  const [cronError, setCronError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  async function addANewTask(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    //Prevent empty values or just spaces
    if (name.trim().length === 0 || command.trim().length === 0) {
      toast.error('Oops! Empty fields not allowed');
      return;
    }

    // Prevent invalid cron submission
    if (scheduleType === 'cron') {
      const error = cronValidator(scheduleValue);

      if (scheduleValue.trim().length === 0 || error.length > 0) {
        setCronError(error || 'Invalid cron expression');
        toast.error('Please enter a valid cron expression');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name,
        command: command,
        schedule:
          scheduleType === 'once'
            ? '@once'
            : scheduleType === 'date'
              ? formatDateTimeLocal(scheduleValue)
              : scheduleValue,
      } as Task;

      const response = await fetch(`http://localhost:${APP_PORT}/api/tasks`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      setIsOpen(false);

      toast.success('Task added successfully');
    } catch {
      toast.error('An error occured while adding the task');
    } finally {
      setIsSubmitting(false);
    }
  }

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
        className={`relative z-40 focus:outline-none font-mono`}
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
                disabled={isSubmitting}
                className={`cursor-pointer ${isSubmitting && 'cursor-not-allowed'}`}
                title='Close Popup'
                onClick={() => setIsOpen(false)}
              >
                <X
                  className={`h-5 w-5 font-bold ${isSubmitting && 'cursor-not-allowed'}`}
                />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={addANewTask}>
              <div className='flex flex-col gap-5 text-(--primaryText)'>
                <div className='flex flex-col gap-2'>
                  <span className='font-semibold text-sm'>Task Name</span>
                  <input
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                      {
                        id: 'date',
                        icon: CalendarDays,
                        label: 'Specific Time',
                      },
                      { id: 'cron', icon: Repeat, label: 'Recurring' },
                    ].map((type) => (
                      <button
                        disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                    <span className='font-semibold text-sm'>
                      Cron Expression
                    </span>
                    <input
                      disabled={isSubmitting}
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
                  disabled={isSubmitting}
                  title='Cancel'
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  className={`min-w-20 text-sm border border-(--border) bg-(--background) text-(--primaryText) cursor-pointer hover:brightness-90 transition-all font-bold ${isSubmitting && 'cursor-not-allowed'}`}
                >
                  Cancel
                </Button>
                <Button
                  disabled={isSubmitting}
                  type='submit'
                  title='Confirm'
                  className={`min-w-20 text-sm bg-(--themeAccent) text-white cursor-pointer hover:brightness-125 transition-all font-bold ${isSubmitting && 'cursor-not-allowed'}`}
                >
                  Confirm
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
