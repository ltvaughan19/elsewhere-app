import { z } from "zod";

export const partnerApplicationSchema = z.object({
  businessName: z.string().min(2),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  countriesServed: z.array(z.string()).min(1),
  citiesServed: z.array(z.string()).optional(),
  serviceCategory: z.string().min(2),
  description: z.string().min(20),
  consentToVerification: z.literal(true),
});

export type PartnerApplicationInput = z.infer<typeof partnerApplicationSchema>;
