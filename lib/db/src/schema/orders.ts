import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({ id: true });

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItemsTable.$inferSelect;
