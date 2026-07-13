export type OfficialDocumentTemplate = {
  amountDefault?: string;
  amountLabel?: string;
  body: string;
  category: string;
  description: string;
  id: string;
  isActive: boolean;
  paymentInstructions?: string;
  refundTerms?: string;
  slug: string;
  subject: string;
  title: string;
  variables: string[];
};

export type OfficialDocumentActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  status: "error" | "idle" | "success";
};

export const initialOfficialDocumentActionState: OfficialDocumentActionState = {
  status: "idle",
};
