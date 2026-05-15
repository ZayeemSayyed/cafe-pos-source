import { Router, type IRouter } from "express";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { db, ordersTable, orderItemsTable } from "@workspace/db";
import {
  CreateOrderBody,
  GetDailyOrdersQueryParams,
  GetMonthlyOrdersQueryParams,
  GetOrderParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseOrderRow(order: typeof ordersTable.$inferSelect, items: (typeof orderItemsTable.$inferSelect)[]) {
  return {
    id: order.id,
    subtotal: parseFloat(order.subtotal),
    tax: parseFloat(order.tax),
    total: parseFloat(order.total),
    createdAt: order.createdAt.toISOString(),
    items: items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      name: item.name,
      price: parseFloat(item.price),
      quantity: item.quantity,
      lineTotal: parseFloat(item.lineTotal),
    })),
  };
}

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { items, subtotal, tax, total } = parsed.data;

  const [order] = await db
    .insert(ordersTable)
    .values({
      subtotal: subtotal.toString(),
      tax: tax.toString(),
      total: total.toString(),
    })
    .returning();

  const insertedItems = await db
    .insert(orderItemsTable)
    .values(
      items.map((item) => ({
        orderId: order.id,
        name: item.name,
        price: item.price.toString(),
        quantity: item.quantity,
        lineTotal: (item.price * item.quantity).toString(),
      }))
    )
    .returning();

  req.log.info({ orderId: order.id }, "Order created");
  res.status(201).json(parseOrderRow(order, insertedItems));
});

router.get("/orders/daily", async (req, res): Promise<void> => {
  const query = GetDailyOrdersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const dateStr = query.data.date ?? new Date().toISOString().slice(0, 10);
  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

  const orders = await db
    .select()
    .from(ordersTable)
    .where(and(gte(ordersTable.createdAt, dayStart), lt(ordersTable.createdAt, dayEnd)))
    .orderBy(ordersTable.createdAt);

  const allItems = orders.length > 0
    ? await db
        .select()
        .from(orderItemsTable)
        .where(
          sql`${orderItemsTable.orderId} = ANY(ARRAY[${sql.join(orders.map((o) => sql`${o.id}`), sql`, `)}]::int[])`
        )
    : [];

  const itemsByOrderId = allItems.reduce<Record<number, (typeof orderItemsTable.$inferSelect)[]>>((acc, item) => {
    if (!acc[item.orderId]) acc[item.orderId] = [];
    acc[item.orderId].push(item);
    return acc;
  }, {});

  const parsedOrders = orders.map((o) => parseOrderRow(o, itemsByOrderId[o.id] ?? []));
  const totalRevenue = parsedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalTax = parsedOrders.reduce((sum, o) => sum + o.tax, 0);

  res.json({
    date: dateStr,
    orderCount: parsedOrders.length,
    totalRevenue,
    totalTax,
    orders: parsedOrders,
  });
});

router.get("/orders/monthly", async (req, res): Promise<void> => {
  const query = GetMonthlyOrdersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const now = new Date();
  const year = query.data.year ?? now.getUTCFullYear();
  const month = query.data.month ?? now.getUTCMonth() + 1;

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));

  const orders = await db
    .select()
    .from(ordersTable)
    .where(and(gte(ordersTable.createdAt, monthStart), lt(ordersTable.createdAt, monthEnd)))
    .orderBy(ordersTable.createdAt);

  const allItems = orders.length > 0
    ? await db
        .select()
        .from(orderItemsTable)
        .where(
          sql`${orderItemsTable.orderId} = ANY(ARRAY[${sql.join(orders.map((o) => sql`${o.id}`), sql`, `)}]::int[])`
        )
    : [];

  const itemsByOrderId = allItems.reduce<Record<number, (typeof orderItemsTable.$inferSelect)[]>>((acc, item) => {
    if (!acc[item.orderId]) acc[item.orderId] = [];
    acc[item.orderId].push(item);
    return acc;
  }, {});

  const parsedOrders = orders.map((o) => parseOrderRow(o, itemsByOrderId[o.id] ?? []));
  const totalRevenue = parsedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalTax = parsedOrders.reduce((sum, o) => sum + o.tax, 0);

  const dailyMap = parsedOrders.reduce<Record<string, { orderCount: number; revenue: number }>>((acc, o) => {
    const date = o.createdAt.slice(0, 10);
    if (!acc[date]) acc[date] = { orderCount: 0, revenue: 0 };
    acc[date].orderCount += 1;
    acc[date].revenue += o.total;
    return acc;
  }, {});

  const dailyBreakdown = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  res.json({
    year,
    month,
    orderCount: parsedOrders.length,
    totalRevenue,
    totalTax,
    dailyBreakdown,
    orders: parsedOrders,
  });
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.id));

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, order.id));

  res.json(parseOrderRow(order, items));
});

export default router;
