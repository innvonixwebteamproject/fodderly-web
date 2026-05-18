import { useState, useEffect } from "react";
import { Mail, Phone, Users } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { FormattesPhoneNumber, cn } from "@/lib/utils";
import { IClient, ContactPersonType } from "../types";

interface ContactPersonsCellProps {
  row: IClient;
}

export const ContactPersonsCell = ({ row }: ContactPersonsCellProps) => {
  const [contacts, setContacts] = useState(row.contact_persons || []);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setContacts(row.contact_persons || []);
  }, [row.contact_persons]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="flex flex-wrap gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
          {contacts.slice(0, 3).map((c, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              size="sm"
              appearance="light"
              className="text-[11px] font-semibold px-2 py-0 h-5 bg-muted/80 text-foreground border border-border rounded-[4px] hover:bg-muted transition-colors shadow-sm"
            >
              {c.name}
            </Badge>
          ))}
          {contacts.length > 3 && (
            <Badge
              variant="outline"
              size="sm"
              className="text-[11px] font-semibold px-2 py-0 h-5 border border-border rounded-[4px] bg-background text-foreground shadow-sm"
            >
              +{contacts.length - 3}
            </Badge>
          )}
          {contacts.length === 0 && (
            <span className="text-muted-foreground text-xs italic">-</span>
          )}
        </div>
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl w-full p-0 gap-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-4 flex flex-row items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Users className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-semibold">
              {row.client_name} - Contact Persons
            </DialogTitle>
          </div>
        </DialogHeader>
        <Separator />
        <DialogBody className="p-0">
          <Table wrapperClassName="max-h-[450px]">
            <TableHeader className="bg-muted/10 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent border-b">
                <TableCell className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground py-3">
                  Name
                </TableCell>
                <TableCell className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground py-3">
                  Type
                </TableCell>
                <TableCell className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground py-3">
                  Email
                </TableCell>
                <TableCell className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground py-3 border-r-0">
                  Phone
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c, idx) => (
                <TableRow
                  key={idx}
                  className="group hover:bg-muted/40 transition-colors"
                >
                  <TableCell className="py-4 font-medium text-sm">
                    {c.name}
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      variant={
                        c.type === ContactPersonType.TECHNICAL
                          ? "primary"
                          : "info"
                      }
                      size="md"
                      appearance="light"
                      className={cn(
                        "capitalize px-2 rounded-md font-semibold",
                        c.type === ContactPersonType.TECHNICAL
                          ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400"
                          : "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/30 dark:text-violet-400",
                      )}
                    >
                      {c.type.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      <Mail className="h-3.5 w-3.5 text-primary/60" />
                      <span className="truncate max-w-[180px]">{c.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 border-r-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      <Phone className="h-3.5 w-3.5 text-primary/60" />
                      {FormattesPhoneNumber(c.phone, c.country_code)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {contacts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-32 text-center text-muted-foreground italic text-sm"
                  >
                    No contact persons available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
