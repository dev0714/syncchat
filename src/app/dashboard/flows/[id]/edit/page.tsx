"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import FlowForm from "@/components/dashboard/FlowForm";
import PacmanLoader from "@/components/ui/PacmanLoader";
import type { N8nFlow } from "@/types";

export default function EditFlowPage() {
  const { id } = useParams<{ id: string }>();
  const [flow, setFlow] = useState<N8nFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/flows");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load");
        const found = (data.flows as N8nFlow[]).find(f => f.id === id);
        if (!found) throw new Error("Flow not found");
        setFlow(found);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load flow");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <PacmanLoader size={40} label="Loading flow" />
      </div>
    );
  }

  if (error || !flow) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error || "Flow not found"}
        </div>
      </div>
    );
  }

  return <FlowForm editing={flow} />;
}
