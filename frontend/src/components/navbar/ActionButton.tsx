import Button from '../common/Button';

export default function ActionButton() {
  return (
    <Button className='text-sm bg-(--themeAccent) text-white cursor-pointer hover:brightness-110 transition-all font-bold'>
      + Add Task
    </Button>
  );
}
