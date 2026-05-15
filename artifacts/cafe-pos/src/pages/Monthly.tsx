import { useState } from "react";
import { BarChart3, Receipt, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { useGetMonthlyOrders, getGetMonthlyOrdersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function Monthly() {
  const today = new Date();
  const [month, setMonth] = useState((today.getMonth() + 1).toString());
  const [year, setYear] = useState(today.getFullYear().toString());

  const { data, isLoading } = useGetMonthlyOrders(
    { month: parseInt(month), year: parseInt(year) },
    { query: { enabled: true, queryKey: getGetMonthlyOrdersQueryKey({ month: parseInt(month), year: parseInt(year) }) } }
  );

  const summary = data;

  const currentYear = today.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="h-20 px-8 flex items-center justify-between border-b border-border/50 bg-white/50 backdrop-blur-sm shrink-0">
        <div>
          <h1 className="text-xl font-serif font-bold text-foreground tracking-tight">Monthly Report</h1>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Earnings Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Day-by-Day Breakdown
                </h2>
                <div className="bg-card rounded-xl border border-card-border overflow-hidden">
                  <div className="grid grid-cols-3 bg-secondary/50 p-3 text-sm font-medium text-muted-foreground border-b border-border">
                    <div>Date</div>
                    <div className="text-center">Orders</div>
                    <div className="text-right">Revenue</div>
                  </div>
                  {summary.dailyBreakdown.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">No activity for this month.</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {summary.dailyBreakdown.map((day) => (
                        <div key={day.date} className="grid grid-cols-3 p-3 text-sm hover:bg-secondary/20 transition-colors">
                          <div className="font-medium text-foreground">{format(new Date(day.date), "MMM d, yyyy")}</div>
                          <div className="text-center text-muted-foreground">{day.orderCount}</div>
                          <div className="text-right font-serif font-semibold">${day.revenue.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  All Orders
                </h2>
                <div className="space-y-4">
                  {summary.orders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                      No orders found for this month.
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
            {format(new Date(order.createdAt), "MMM d - h:mm a")}
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
