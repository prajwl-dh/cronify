import { Copy } from "lucide-react";
import { Button } from "./ui";
import { useToast } from "../lib/toast";

export function CopyButton({ text, label }: { text: string; label: string }) {
  const { toast } = useToast();

  return (
    <Button
      size="sm"
      variant="ghost"
      icon={<Copy size={12} />}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          toast(`${label} copied.`, "success");
        } catch {
          toast("Could not copy to the clipboard.", "error");
        }
      }}
    >
      Copy {label.toLowerCase()}
    </Button>
  );
}
