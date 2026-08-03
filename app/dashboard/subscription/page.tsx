import { Suspense } from "react";
import SubscriptionContent from "./subscription-content";

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubscriptionContent />
    </Suspense>
  );
}