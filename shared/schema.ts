import { sql } from "drizzle-orm";
import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Rounds ────────────────────────────────────────────────────────────────────
export const rounds = pgTable("rounds", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertRoundSchema = createInsertSchema(rounds);
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type Round = typeof rounds.$inferSelect;

// ── Actives ───────────────────────────────────────────────────────────────────
export const actives = pgTable("actives", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const insertActiveSchema = createInsertSchema(actives);
export type InsertActive = z.infer<typeof insertActiveSchema>;
export type Active = typeof actives.$inferSelect;

// ── PNMs ──────────────────────────────────────────────────────────────────────
export const pnms = pgTable("pnms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  idNumber: text("id_number").notNull(),
  roundId: text("round_id").notNull().references(() => rounds.id, { onDelete: "cascade" }),
  matchedWith: text("matched_with"),
  secondMatch: text("second_match"),
});

export const insertPnmSchema = createInsertSchema(pnms);
export type InsertPnm = z.infer<typeof insertPnmSchema>;
export type Pnm = typeof pnms.$inferSelect;

// ── Snapshots ─────────────────────────────────────────────────────────────────
export const snapshots = pgTable("snapshots", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  payload: jsonb("payload").notNull(),
});

export const insertSnapshotSchema = createInsertSchema(snapshots).omit({ createdAt: true });
export type InsertSnapshot = z.infer<typeof insertSnapshotSchema>;
export type Snapshot = typeof snapshots.$inferSelect;
