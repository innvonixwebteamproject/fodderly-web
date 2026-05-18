import { Plus, Pencil, Trash2, Eye, Search, X, Check, Save } from "lucide-react";

/**
 * Standard Action Icons for the application to ensure consistency.
 * Use these instead of importing directly from lucide-react for common actions.
 */
export const ActionIcon = {
  Add: Plus,
  Edit: Pencil,
  Delete: Trash2,
  View: Eye,
  Search: Search,
  Close: X,
  Cancel: X,
  Confirm: Check,
  Save: Save,
} as const;

export type ActionIconType = typeof ActionIcon;
