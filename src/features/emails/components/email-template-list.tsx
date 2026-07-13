import Link from "next/link";
import type { Route } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { emailCategoryLabels } from "@/features/emails/constants";
import type { EmailTemplateListItem } from "@/features/emails/types";

export function EmailTemplateList({ templates }: { templates: EmailTemplateListItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.map((template) => (
          <TableRow key={template.id}>
            <TableCell>
              <p className="font-semibold">{template.name}</p>
              <p className="text-muted-foreground mt-1 text-xs">{template.slug}</p>
            </TableCell>
            <TableCell>{emailCategoryLabels[template.category]}</TableCell>
            <TableCell>
              <Badge variant={template.source === "built_in_client_email" ? "info" : "outline"}>
                {template.source === "built_in_client_email" ? "Built-in mail" : "Editable"}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={template.isActive ? "success" : "outline"}>
                {template.isActive ? "Active" : "Draft"}
              </Badge>
            </TableCell>
            <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
            <TableCell>
              {template.source === "built_in_client_email"
                ? "Built in"
                : new Date(template.updatedAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Button asChild size="sm" variant="outline">
                {template.canEdit ? (
                  <Link href={`/admin/emails/templates/${template.id}` as Route}>Edit</Link>
                ) : (
                  <Link
                    href={
                      `/admin/emails/compose?template=${encodeURIComponent(
                        template.composeTemplateId ?? template.id,
                      )}` as Route
                    }
                  >
                    Use
                  </Link>
                )}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
