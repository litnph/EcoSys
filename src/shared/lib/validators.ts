import { z } from "zod";

export const uuidSchema = z.uuid();

export const emailSchema = z
  .string()
  .trim()
  .pipe(z.email());

export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter",
  })
  .regex(/[a-z]/, {
    message: "Password must contain at least one lowercase letter",
  })
  .regex(/[0-9]/, { message: "Password must contain at least one digit" });

/** Vietnamese and general numeric international formats (E.164-friendly). */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{9,15}$/, { message: "Invalid phone number" });

export const amountSchema = z.number().positive();

export const dateSchema = z.coerce.date();
