import { PlotCard } from './PlotCard';

interface Plot {
  index: number;
  isUnlocked: boolean;
  crop?: {
    slug: string;
    plantedAt: string;
  };
}

interface FarmGridProps {
  plots: Plot[];
}

export function FarmGrid({ plots }: FarmGridProps) {
  return (
    <div className="flex flex-col items-center space-y-8">
      {/* Grid Isométrico 3D */}
      <div className="relative" style={{ transformStyle: 'preserve-3d', perspective: '1500px' }}>
        <div 
          className="grid grid-cols-4 gap-2 p-8 bg-gradient-to-br from-green-200 to-green-300 rounded-xl shadow-2xl"
          style={{
            transform: 'rotateX(50deg) rotateZ(-30deg) scale(0.8)',
            transformStyle: 'preserve-3d',
            transformOrigin: 'center center'
          }}
        >
          {plots.map((plot) => (
            <PlotCard key={plot.index} plot={plot} />
          ))}
        </div>
      </div>
    </div>
  );
}
