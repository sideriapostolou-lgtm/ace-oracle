import { Crown } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500">
          <Crown className="h-7 w-7 text-black" />
        </div>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
