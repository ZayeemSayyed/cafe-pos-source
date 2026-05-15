import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;

public class CafePOS {

    public static void main(String[] args) {
        Map<String, Double> menu = new HashMap<>();
        menu.put("Espresso", 2.50);
        menu.put("Latte", 3.50);
        menu.put("Cookie", 2.00);
        menu.put("Muffin", 3.00);
        menu.put("Cappuccino", 3.75);
        menu.put("Croissant", 2.75);

        System.out.println("============================================");
        System.out.println("         Welcome to The Corner Cafe         ");
        System.out.println("============================================");
        System.out.println("                   MENU                     ");
        System.out.println("--------------------------------------------");
        for (Map.Entry<String, Double> entry : menu.entrySet()) {
            System.out.printf("  %-15s $%.2f%n", entry.getKey() + ":", entry.getValue());
        }
        System.out.println("============================================");

        Scanner scanner = new Scanner(System.in);

        System.out.print("\nEnter the item you would like to order: ");
        String itemName = scanner.nextLine().trim();

        String matchedKey = null;
        for (String key : menu.keySet()) {
            if (key.equalsIgnoreCase(itemName)) {
                matchedKey = key;
                break;
            }
        }

        if (matchedKey == null) {
            System.out.println("\nSorry, \"" + itemName + "\" is not on our menu.");
            scanner.close();
            return;
        }

        System.out.print("How many would you like? ");
        int quantity = 0;
        if (scanner.hasNextInt()) {
            quantity = scanner.nextInt();
        }

        if (quantity <= 0) {
            System.out.println("\nInvalid quantity. Please enter a number greater than 0.");
            scanner.close();
            return;
        }

        double price    = menu.get(matchedKey);
        double subtotal = price * quantity;
        double tax      = subtotal * 0.05;
        double total    = subtotal + tax;

        System.out.println("\n============================================");
        System.out.println("                  RECEIPT                   ");
        System.out.println("============================================");
        System.out.printf("  Item:       %-20s%n", matchedKey);
        System.out.printf("  Price:      $%.2f each%n", price);
        System.out.printf("  Quantity:   %d%n", quantity);
        System.out.println("--------------------------------------------");
        System.out.printf("  Subtotal:   $%.2f%n", subtotal);
        System.out.printf("  Tax (5%%):   $%.2f%n", tax);
        System.out.println("--------------------------------------------");
        System.out.printf("  TOTAL:      $%.2f%n", total);
        System.out.println("============================================");
        System.out.println("     Thank you for visiting The Corner Cafe!");
        System.out.println("============================================");

        scanner.close();
    }
}
