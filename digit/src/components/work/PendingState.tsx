import { Clock, ShieldX } from "lucide-react";
import type { VetStatus } from "@/lib/types";

export function PendingState({ vetStatus }: { vetStatus: VetStatus }) {
  const rejected = vetStatus === "rejected";
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center max-w-lg mx-auto space-y-3">
      <div
        className={`inline-flex p-3 rounded-2xl ${
          rejected ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
        }`}
      >
        {rejected ? (
          <ShieldX className="w-7 h-7" />
        ) : (
          <Clock className="w-7 h-7" />
        )}
      </div>
      <h1 className="text-xl font-bold text-slate-800">
        {rejected ? "Application not approved" : "Vetting in progress"}
      </h1>
      <p className="text-sm text-slate-500 leading-relaxed">
        {rejected
          ? "An administrator did not approve your specialist application. Contact support if you believe this is a mistake."
          : "Your specialist account is awaiting admin approval. Once vetted, broadcast jobs that match your skills will appear here."}
      </p>
    </div>
  );
}
