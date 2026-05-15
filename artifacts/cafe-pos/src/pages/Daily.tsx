import { useState } from "react";
import { format } from "date-fns";
import { Receipt, ChevronDown, ChevronUp } from "lucide-react";
import { useGetDailyOrders, getGetDailyOrdersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Daily() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data, isLoading } = useGetDailyOrders(
    { date },
    { query: { enabled: true, queryKey: getGetDailyOrdersQueryKey({ date }) } }
  );

  const summary = data;

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="h-20 px-8 flex items-center justify-between border-b border-border/50 bg-white/50 backdrop-blur-sm shrink-0">
        <div>
          <h1 className="text-xl font-serif font-bold text-foreground tracking-tight">Daily Orders</h1>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue & Activity</p>
        </div>
        <div className="flex items-center gap-3">
          <Input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40 font-medium"
          />
        </div>
      </header>

      <ScrollArea className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
          {isLoading ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground">Loading summary...</div>
          ) : summary ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-serif font-bold">{summary.orderCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-serif font-bold">${summary.totalRevenue.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Tax</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-serif font-bold">${summary.totalTax.toFixed(2)}</div>
                  </CardContent>
                </Card>
              </div>

              <section>
                <h2 className="text-xl font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  Order History
                </h2>
                <div className="space-y-4">
                  {summary.orders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                      No orders found for this date.
                    </div>
                  ) : (
                    summary.orders.map((order) => (
                      <OrderRow key={order.id} order={order} />
                    ))
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
              Could not load data.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function OrderRow({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="bg-card rounded-xl border border-card-border overflow-hidden transition-all">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left"
      >
        <div className="flex items-center gap-6">
          <div className="font-mono text-sm text-muted-foreground bg-secondary px-2 py-1 rounded-md">
            #{order.id.toString().padStart(4, '0')}
          </div>
          <div className="text-sm font-medium text-foreground">
            {format(new Date(order.createdAt), "h:mm a")}
          </div>
          <div className="text-sm text-muted-foreground">
            {order.items.length} items
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-serif font-bold text-lg">${order.total.toFixed(2)}</div>
          {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </div>
      </button>
      
      {expanded && (
        <div className="bg-secondary/20 p-4 border-t border-border">
          <div className="space-y-2">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="font-medium text-foreground">
                  {item.quantity} × {item.name}
                </span>
                <span className="text-muted-foreground">${item.lineTotal.toFixed(2)}</span>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-border/50 flex justify-between text-xs text-muted-foreground">
              <span>Subtotal: ${order.subtotal.toFixed(2)}</span>
              <span>Tax: ${order.tax.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
