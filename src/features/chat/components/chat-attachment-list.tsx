import Image from "next/image";
import { Download, FileText, ImageIcon } from "lucide-react";

import type { ChatAttachmentView } from "@/features/chat/types";
import { cn } from "@/lib/utils";

type ChatAttachmentListProps = {
  accessKey?: string;
  attachments: ChatAttachmentView[];
  className?: string;
  messageId: string;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAttachmentHref(messageId: string, attachmentId: string, accessKey?: string) {
  const href = `/api/chat/public/attachments/${messageId}/${attachmentId}`;

  return accessKey ? `${href}?accessKey=${encodeURIComponent(accessKey)}` : href;
}

export function ChatAttachmentList({
  accessKey,
  attachments,
  className,
  messageId,
}: ChatAttachmentListProps) {
  if (!attachments.length) {
    return null;
  }

  return (
    <div className={cn("mt-3 grid gap-2", className)}>
      {attachments.map((attachment) => {
        const href = getAttachmentHref(messageId, attachment.id, accessKey);

        return attachment.isImage ? (
          <a
            className="border-border bg-background/80 block overflow-hidden rounded-md border"
            href={href}
            key={attachment.id}
            rel="noreferrer"
            target="_blank"
          >
            <Image
              alt={attachment.fileName}
              className="aspect-video w-full object-cover"
              height={202}
              src={href}
              unoptimized
              width={360}
            />
            <span className="flex items-center gap-2 px-3 py-2 text-xs font-medium">
              <ImageIcon aria-hidden="true" className="size-3.5" />
              <span className="min-w-0 flex-1 truncate">{attachment.fileName}</span>
              <span className="opacity-70">{formatFileSize(attachment.fileSizeBytes)}</span>
            </span>
          </a>
        ) : (
          <a
            className="border-border bg-background/80 hover:bg-background flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors"
            href={href}
            key={attachment.id}
            rel="noreferrer"
            target="_blank"
          >
            <FileText aria-hidden="true" className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{attachment.fileName}</span>
            <span className="opacity-70">{formatFileSize(attachment.fileSizeBytes)}</span>
            <Download aria-hidden="true" className="size-3.5 shrink-0" />
          </a>
        );
      })}
    </div>
  );
}
