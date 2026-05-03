type ErrorContext = "auth" | "lookup" | "product" | "stock" | "shopping";

const fallbackMessages: Record<ErrorContext, string> = {
  auth: "We could not start your session. Refresh the app and try again.",
  lookup: "We could not look up this barcode right now. You can still add the product manually.",
  product: "We could not save this product. Check your connection and try again.",
  stock: "We could not save this stock item. Check your connection and try again.",
  shopping: "We could not update the shopping list. Check your connection and try again.",
};

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message.toLowerCase();
  if (typeof error === "string") return error.toLowerCase();
  return "";
}

export function friendlyErrorMessage(error: unknown, context: ErrorContext): string {
  const text = errorText(error);

  if (
    text.includes("permission") ||
    text.includes("unauthorized") ||
    text.includes("insufficient")
  ) {
    return "This household is not ready for saving yet. Refresh the app, then try again.";
  }

  if (
    text.includes("network") ||
    text.includes("offline") ||
    text.includes("unavailable") ||
    text.includes("failed to fetch")
  ) {
    return "Connection looks unstable. Try again when you are back online.";
  }

  if (text.includes("not configured") || text.includes("env")) {
    return "The app is not connected to its database yet. Check the Firebase setup.";
  }

  if (text.includes("quota") || text.includes("resource-exhausted")) {
    return "The app is temporarily busy. Try again in a few minutes.";
  }

  return fallbackMessages[context];
}
