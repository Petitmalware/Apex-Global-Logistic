"use client";

import { Bold, Italic, LinkIcon, List, ListOrdered, Pilcrow, Underline } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  className?: string;
  id?: string;
  name?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  value: string;
};

function execute(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function RichTextEditor({
  className,
  id,
  name,
  onChange,
  placeholder = "Write the email body...",
  value,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  function sync() {
    onChange?.(editorRef.current?.innerHTML ?? "");
  }

  function addLink() {
    const href = window.prompt("Paste a secure URL");

    if (href && /^https?:\/\//i.test(href)) {
      execute("createLink", href);
      sync();
    }
  }

  return (
    <div className={cn("border-border overflow-hidden rounded-md border", className)}>
      <div className="border-border bg-secondary/60 flex flex-wrap items-center gap-1 border-b p-2">
        <Button onClick={() => execute("bold")} size="icon" type="button" variant="ghost">
          <Bold aria-hidden="true" />
          <span className="sr-only">Bold</span>
        </Button>
        <Button onClick={() => execute("italic")} size="icon" type="button" variant="ghost">
          <Italic aria-hidden="true" />
          <span className="sr-only">Italic</span>
        </Button>
        <Button onClick={() => execute("underline")} size="icon" type="button" variant="ghost">
          <Underline aria-hidden="true" />
          <span className="sr-only">Underline</span>
        </Button>
        <Button
          onClick={() => execute("formatBlock", "p")}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Pilcrow aria-hidden="true" />
          <span className="sr-only">Paragraph</span>
        </Button>
        <Button
          onClick={() => execute("insertUnorderedList")}
          size="icon"
          type="button"
          variant="ghost"
        >
          <List aria-hidden="true" />
          <span className="sr-only">Bulleted list</span>
        </Button>
        <Button
          onClick={() => execute("insertOrderedList")}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ListOrdered aria-hidden="true" />
          <span className="sr-only">Numbered list</span>
        </Button>
        <Button onClick={addLink} size="icon" type="button" variant="ghost">
          <LinkIcon aria-hidden="true" />
          <span className="sr-only">Link</span>
        </Button>
      </div>
      <div
        aria-label={placeholder}
        className="prose prose-sm dark:prose-invert bg-background empty:before:text-muted-foreground min-h-64 max-w-none px-4 py-3 text-sm leading-6 outline-none empty:before:content-[attr(data-placeholder)]"
        contentEditable
        data-placeholder={placeholder}
        id={id}
        onBlur={sync}
        onInput={sync}
        ref={editorRef}
        role="textbox"
        suppressContentEditableWarning
      />
      {name ? <input name={name} type="hidden" value={value} /> : null}
    </div>
  );
}
