import { Dialog, DialogPanel } from '@headlessui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { APP_PORT } from '../../config/config';
import { useToast } from '../../store/toast/useToast';
import Button from '../common/Button';

export default function DeleteTask({
  id,
  setShowLog,
}: {
  id: number;
  setShowLog: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(
        `http://127.0.0.1:${APP_PORT}/api/tasks/${id}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      if (!response.ok) throw new Error('Failed to delete task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Task deleted successfully');
      setShowLog(-1);
      setIsOpen(false);
    },
    onError: () => {
      toast.error('An error occurred while deleting the task');
      setIsOpen(false);
    },
  });

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className='cursor-pointer p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/30 rounded-lg transition-colors mx-auto block'
        title='Delete Task'
      >
        <Trash2 className='w-5 h-5' />
      </button>
      <Dialog
        open={isOpen}
        as='div'
        className={`relative z-40 focus:outline-none font-mono`}
        onClose={() => {}}
      >
        <div
          className={`flex fixed inset-0 z-50 overflow-y-auto items-center justify-center bg-transparent backdrop-blur-xl p-2`}
        >
          <DialogPanel
            transition
            className={`flex flex-col items-center justify-center p-6 w-full max-w-lg rounded-2xl bg-(--foreground) border border-(--border) ease-in-out duration-500`}
          >
            {/* Title */}
            <div className='flex flex-col items-center justify-between mb-2 text-(--primaryText) max-w-sm text-center'>
              <div className='w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4'>
                <Trash2 className='w-6 h-6' />
              </div>
              <h3 className='text-lg font-bold text-slate-800 dark:text-slate-100 mb-2'>
                Delete Task?
              </h3>
              <p className='text-sm text-slate-500 dark:text-slate-400 mb-6'>
                This action is permanent. The task will be removed and will no
                longer execute.
              </p>
            </div>

            {/* Buttons */}
            <div className='flex items-center justify-end gap-2'>
              <Button
                disabled={deleteTaskMutation.isPending}
                title='Cancel'
                onClick={() => {
                  setIsOpen(false);
                }}
                className={`min-w-20 text-sm border border-(--border) bg-(--background) text-(--primaryText) cursor-pointer hover:brightness-90 transition-all font-bold ${deleteTaskMutation.isPending && 'hidden'}`}
              >
                Cancel
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTaskMutation.mutate(id);
                }}
                disabled={deleteTaskMutation.isPending}
                type='submit'
                title='Confirm'
                className={`min-w-20 text-sm text-white bg-red-600 hover:bg-red-700 cursor-pointer hover:brightness-125 transition-all font-bold ${deleteTaskMutation.isPending && 'cursor-not-allowed'}`}
              >
                {deleteTaskMutation.isPending ? 'Deleting...' : 'Confirm'}
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
