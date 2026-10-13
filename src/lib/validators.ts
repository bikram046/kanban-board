import { z } from "zod";

export const boardTitleSchema = z.string().trim().min(1, "Board title is required").max(80);
export const columnTitleSchema = z.string().trim().min(1, "Column title is required").max(60);
export const cardTitleSchema = z.string().trim().min(1, "Card title is required").max(120);

export const cardDetailsSchema = z.object({
  title: cardTitleSchema,
  description: z.string().trim().max(2000).nullable(),
  due_date: z.string().nullable()
});
