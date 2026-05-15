import { useState, useMemo } from "react";
import { Coffee, Plus, Minus, X, Receipt, ShoppingBag, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCreateOrder } from "@workspace/api-client-react";
import type { Order } from "@workspace/api-client-react/src/generated/api.schemas";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: "Coffee" | "Bakery";
};

type OrderItem = MenuItem & {
  quantity: number;
  lineId: string;
};

const MENU: MenuItem[] = [
  { id: "esp", name: "Espresso", price: 2.50, category: "Coffee" },
  { id: "lat", name: "Latte", price: 3.50, category: "Coffee" },
  { id: "cap", name: "Cappuccino", price: 3.75, category: "Coffee" },
  { id: "ame", name: "Americano", price: 3.00, category: "Coffee" },
  { id: "coo", name: "Cookie", price: 2.00, category: "Bakery" },
  { id: "muf", name: "Muffin", price: 3.00, category: "Bakery" },
  { id: "cro", name: "Croissant", price: 2.75, category: "Bakery" },
];

export default function POS() {
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  
  const createOrder = useCreateOrder();

  const addItem = (item: MenuItem) => {
    setOrder((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1, lineId: Math.random().toString(36).substring(7) }];
    });
  };

  const updateQuantity = (lineId: string, delta: number) => {
    setOrder((prev) =>
      prev.map((item) => {
        if (item.lineId === lineId) {
          const newQ = item.quantity + delta;
          return { ...item, quantity: newQ > 0 ? newQ : 0 };
        }
        return item;
      }).filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (lineId: string) => {
    setOrder((prev) => prev.filter((item) => item.lineId !== lineId));
  };

  const clearOrder = () => {
    setOrder([]);
  };

  const subtotal = useMemo(() => {
    return order.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [order]);

  const tax = subtotal * 0.05;
  const grandTotal = subtotal + tax;

  const handleCheckout = () => {
    if (order.length > 0) {
      createOrder.mutate(
        {
          data: {
            items: order.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
            subtotal,
            tax,
            total: grandTotal
          }
        },
        {
          onSuccess: (savedOrder) => {
            setCompletedOrder(savedOrder);
            setShowReceipt(true);
          }
        }
      );
    }
  };

  const handleNewOrder = () => {
    setShowReceipt(false);
    setCompletedOrder(null);
    clearOrder();
  };

  const handlePrint = () => {
    window.print();
  };

  const categories = Array.from(new Set(MENU.map((i) => i.category)));

  return (
    <div className="flex h-full w-full bg-background overflow-hidden font-sans">
      
      {/* Left side: Menu */}
      <main className="flex-1 flex flex-col h-full bg-background border-r border-border">
        {/* Header */}
        <header className="h-20 px-8 flex items-center border-b border-border/50 bg-white/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-foreground tracking-tight">The Corner Cafe</h1>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Point of Sale</p>
            </div>
          </div>
        </header>

        {/* Menu Grid */}
        <ScrollArea className="flex-1 px-8 py-6">
          <div className="max-w-4xl mx-auto space-y-10 pb-12">
            {categories.map((category) => (
              <section key={category}>
                <h2 className="text-2xl font-serif font-semibold text-foreground mb-6 flex items-center gap-2">
                  {category}
                  <div className="h-px bg-border flex-1 ml-4 opacity-50"></div>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {MENU.filter((i) => i.category === category).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addItem(item)}
                      data-testid={`menu-item-${item.id}`}
                      className="group relative flex flex-col text-left bg-card hover:bg-secondary/50 border border-card-border p-5 rounded-2xl transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <div className="font-semibold text-lg text-card-foreground mb-1 group-hover:text-primary transition-colors">{item.name}</div>
                      <div className="text-muted-foreground font-medium mt-auto pt-4">${item.price.toFixed(2)}</div>
                      
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary text-secondary-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </ScrollArea>
      </main>

      {/* Right side: Order Panel */}
      <aside className="w-[400px] flex flex-col bg-sidebar h-full shrink-0 shadow-2xl z-10 relative">
        <div className="h-20 px-6 flex items-center justify-between border-b border-sidebar-border shrink-0 bg-sidebar">
          <h2 className="text-xl font-serif font-semibold text-sidebar-foreground flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-sidebar-primary" />
            Current Order
          </h2>
          {order.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearOrder}
              data-testid="button-clear-order"
              className="text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Order Items */}
        <ScrollArea className="flex-1 px-4 py-4 bg-sidebar">
          {order.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-sidebar-foreground/40 mt-32 space-y-4">
              <ShoppingBag className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Tap items to add to order</p>
            </div>
          ) : (
            <div className="space-y-3 pb-8">
              {order.map((item) => (
                <div 
                  key={item.lineId} 
                  className="bg-sidebar-accent/50 rounded-xl p-3 flex flex-col gap-3 group border border-sidebar-border/30"
                  data-testid={`order-line-${item.lineId}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-sidebar-foreground">{item.name}</h3>
                      <p className="text-sm text-sidebar-foreground/60">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="font-medium text-sidebar-foreground">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-sidebar-border/50 rounded-lg p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        onClick={() => updateQuantity(item.lineId, -1)}
                        data-testid={`button-dec-${item.lineId}`}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium text-sidebar-foreground">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        onClick={() => updateQuantity(item.lineId, 1)}
                        data-testid={`button-inc-${item.lineId}`}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(item.lineId)}
                      data-testid={`button-remove-${item.lineId}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Totals & Checkout */}
        <div className="p-6 bg-sidebar border-t border-sidebar-border shrink-0">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sidebar-foreground/70 text-sm font-medium">
              <span>Subtotal</span>
              <span data-testid="text-subtotal">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sidebar-foreground/70 text-sm font-medium">
              <span>Tax (5%)</span>
              <span data-testid="text-tax">${tax.toFixed(2)}</span>
            </div>
            <div className="h-px bg-sidebar-border w-full my-2"></div>
            <div className="flex justify-between text-sidebar-foreground text-xl font-serif font-bold">
              <span>Total</span>
              <span data-testid="text-grand-total">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <Button 
            className="w-full h-14 text-lg font-medium rounded-xl shadow-lg transition-transform active:scale-[0.98]" 
            size="lg"
            disabled={order.length === 0 || createOrder.isPending}
            onClick={handleCheckout}
            data-testid="button-checkout"
          >
            {createOrder.isPending ? "Processing..." : "Place Order"}
          </Button>
        </div>
      </aside>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-background border-none shadow-2xl rounded-2xl print-only">
          <div className="bg-primary p-6 text-primary-foreground text-center">
            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-90" />
            <DialogTitle className="text-2xl font-serif font-bold mb-1">Order Confirmed</DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-medium">
              Thank you for visiting The Corner Cafe
              {completedOrder && <div className="mt-1 font-mono text-sm opacity-80">Order #{completedOrder.id.toString().padStart(4, '0')}</div>}
            </DialogDescription>
          </div>
          
          <div className="p-6 bg-white dark:bg-card">
            <ScrollArea className="max-h-[40vh] pr-4 -mr-4">
              <div className="space-y-4 text-sm">
                {order.map((item) => (
                  <div key={item.lineId} className="flex justify-between items-start gap-4" data-testid={`receipt-line-${item.lineId}`}>
                    <div className="flex-1">
                      <span className="font-medium text-foreground">{item.name}</span>
                      <div className="text-muted-foreground mt-0.5 text-xs">
                        {item.quantity} × ${item.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="font-medium text-foreground text-right">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <Separator className="my-6" />
            
            <div className="space-y-2 text-sm font-medium">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (5%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-serif font-bold text-foreground pt-2 mt-2 border-t border-border">
                <span>Grand Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-secondary/30 border-t border-border flex gap-3">
            <Button 
              className="flex-1 h-12 text-base rounded-xl" 
              onClick={handleNewOrder}
              data-testid="button-new-order"
            >
              New Order
            </Button>
            <Button 
              variant="outline"
              className="flex-1 h-12 text-base rounded-xl bg-white" 
              onClick={handlePrint}
              data-testid="button-print-receipt"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}