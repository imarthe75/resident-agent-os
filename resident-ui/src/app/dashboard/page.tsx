"use client";

import Console from "@/components/Console";
import LiveTrace from "@/components/LiveTrace";
import { useAgentStore } from "@/store/agentStore";

export default function Dashboard() {
  const { currentTask, phase } = useAgentStore();

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col justify-between">
          <span className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Agent Heartbeat</span>
          <span className="text-2xl font-black text-green-400 mt-2 select-none">ACTIVE</span>
          <span className="text-[10px] text-zinc-500 font-mono mt-1">Docker Container: running</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col justify-between">
          <span className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Cognitive Engine</span>
          <span className="text-2xl font-black text-cyan-400 mt-2">{currentTask}</span>
          <span className="text-[10px] text-zinc-500 font-mono mt-1">OpenSpec Contract: active</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col justify-between">
          <span className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Memory Status</span>
          <span className="text-2xl font-black text-purple-400 mt-2">{phase === "execution" ? "READ/WRITE" : "SYNC"}</span>
          <span className="text-[10px] text-zinc-500 font-mono mt-1">pgvector + Valkey: live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2 flex flex-col">
          <LiveTrace />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col space-y-4">
          <h3 className="text-sm font-bold text-zinc-300 tracking-wide uppercase">System Summary</h3>
          <div className="space-y-3 flex-1 overflow-y-auto text-xs font-mono text-zinc-400">
            <div className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-lg">
              <span className="text-zinc-500">Identity:</span> Principal AI Solutions Architect
            </div>
            <div className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-lg">
              <span className="text-zinc-500">Working Directory:</span> /app/resident-ui
            </div>
            <div className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-lg">
              <span className="text-zinc-500">Sovereignty:</span> Local Host docker volumes
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <Console />
      </div>
    </div>
  );
}
