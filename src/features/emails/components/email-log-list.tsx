import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { emailCategoryLabels, emailLogStatusLabels } from "@/features/emails/constants";
import type { EmailLogListItem } from "@/features/emails/types";

function getStatusVariant(status: EmailLogListItem["status"]) {
  if (status === "SENT") {
    return "success";
  }

  if (status === "FAILED") {
    return "danger";
  }

  if (status === "QUEUED") {
    return "warning";
  }

  return "outline";
}

export function EmailLogList({ logs }: { logs: EmailLogListItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Recipient</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Related</TableHead>
          <TableHead>Sent</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell>
              <p className="font-semibold">{log.recipientName ?? log.recipientEmail}</p>
              <p className="text-muted-foreground mt-1 text-xs">{log.recipientEmail}</p>
            </TableCell>
            <TableCell className="max-w-xs">
              <p className="truncate font-medium">{log.subject}</p>
              {log.failureReason ? (
                <p className="text-destructive mt-1 line-clamp-2 text-xs">{log.failureReason}</p>
              ) : null}
            </TableCell>
            <TableCell>{emailCategoryLabels[log.category]}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(log.status)}>
                {emailLogStatusLabels[log.status]}
              </Badge>
            </TableCell>
            <TableCell>{log.provider}</TableCell>
            <TableCell>
              <p className="text-sm">{log.shipmentNumber ?? log.templateName ?? "Manual"}</p>
              {log.trackingNumber ? (
                <p className="text-muted-foreground mt-1 text-xs">{log.trackingNumber}</p>
              ) : null}
            </TableCell>
            <TableCell>
              {log.sentAt
                ? new Date(log.sentAt).toLocaleString()
                : new Date(log.createdAt).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
