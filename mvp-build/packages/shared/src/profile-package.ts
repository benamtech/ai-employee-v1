import { z } from "zod";

export const ProfilePackage = z.object({
  key: z.string().min(1),
  display_name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  supported_business_kinds: z.array(z.string()).default([]),
  default_skills: z.array(z.string()).default([]),
  context_slots: z.array(z.object({
    key: z.string().min(1),