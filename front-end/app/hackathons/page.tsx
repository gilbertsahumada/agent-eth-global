import HackathonFlowVisualization from '@/app/components/HackathonFlowVisualization';

export default function HackathonsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
            Hackathon Relationship Map
          </h1>
          <p className="mt-3 text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Explore how ETH Global hackathons connect with current sponsors. Drag from a hackathon to a sponsor
            to create a new relationship, or click existing edges to manage them.
          </p>
        </div>

        <div className="relative h-[70vh] rounded-3xl border border-slate-200 bg-white/80 backdrop-blur shadow-sm">
          <HackathonFlowVisualization />
        </div>
      </div>
    </div>
  );
}
