import { Link, useLocation } from "wouter";
import { Coffee, Calendar, BarChart3 } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Coffee, label: "POS" },
    { href: "/daily", icon: Calendar, label: "Daily" },
    { href: "/monthly", icon: BarChart3, label: "Monthly" },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary selection:text-primary-foreground font-sans">
      <nav className="w-20 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-6 gap-6 z-20">
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm mb-4">
          <Coffee className="w-6 h-6" />
        </div>
        
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"}`}>
              <item.icon className="w-6 h-6" />
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <main className="flex-1 h-full overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
