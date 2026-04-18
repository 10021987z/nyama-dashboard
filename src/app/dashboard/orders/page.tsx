"use client";

import dynamic from "next/dynamic";

const OrdersClient = dynamic(() => import("./orders-client"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
      Chargement…
    </div>
  ),
});

export default function Page() {
  return <OrdersClient />;
}
