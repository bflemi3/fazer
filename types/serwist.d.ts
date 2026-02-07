interface SerwistWindow {
  addEventListener(
    type: "controlling",
    listener: (event: Event & { isUpdate?: boolean }) => void
  ): void;
  register(): Promise<void>;
}

interface Window {
  serwist?: SerwistWindow;
}
