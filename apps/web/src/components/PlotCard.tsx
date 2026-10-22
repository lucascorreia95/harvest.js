interface Plot {
  index: number;
  isUnlocked: boolean;
  crop?: {
    slug: string;
    plantedAt: string;
  };
}

interface PlotCardProps {
  plot: Plot;
}

export function PlotCard({ plot }: PlotCardProps) {
  // Cálculo do Z-Index baseado na linha (4 colunas por linha)
  const rowIndex = Math.floor(plot.index / 4);
  const zIndex = rowIndex * 10;

  // Função para obter cor baseada no tipo de planta
  const getCropColor = (slug: string) => {
    const colors: Record<string, string> = {
      carrot: 'bg-orange-400',
      wheat: 'bg-yellow-400',
      corn: 'bg-yellow-600',
      tomato: 'bg-red-500',
      lettuce: 'bg-green-400',
      potato: 'bg-amber-600',
      strawberry: 'bg-red-400',
      pumpkin: 'bg-orange-600'
    };
    return colors[slug] || 'bg-green-500';
  };

  // Função para obter cor do fruto
  const getFruitColor = (slug: string) => {
    const colors: Record<string, string> = {
      carrot: 'bg-orange-500',
      wheat: 'bg-yellow-500',
      corn: 'bg-yellow-700',
      tomato: 'bg-red-600',
      lettuce: 'bg-green-500',
      potato: 'bg-amber-700',
      strawberry: 'bg-red-500',
      pumpkin: 'bg-orange-700'
    };
    return colors[slug] || 'bg-red-400';
  };

  // Calcular tempo restante (mock)
  const getTimeRemaining = () => {
    if (!plot.crop) return '';
    const planted = new Date(plot.crop.plantedAt);
    const now = new Date();
    const diff = Math.max(0, 45 - Math.floor((now.getTime() - planted.getTime()) / 1000));
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calcular altura da planta baseada no tempo
  const getPlantHeight = () => {
    if (!plot.crop) return 0;
    const timePassed = (Date.now() - new Date(plot.crop.plantedAt).getTime()) / 1000;
    return Math.min(80, Math.max(20, timePassed * 1.5));
  };

  return (
    <div 
      className="relative w-20 h-20 transition-all duration-300 group"
      style={{ 
        zIndex,
        transformStyle: 'preserve-3d',
        transform: 'translateZ(0px)',
        backfaceVisibility: 'hidden'
      }}
    >
      {/* PLANO 1: TERRENO BASE 3D */}
      <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
        {/* Base principal */}
        <div 
          className={`
            absolute inset-0 rounded-sm border
            ${plot.isUnlocked 
              ? 'bg-gradient-to-br from-amber-600 to-amber-700 border-amber-800 shadow-lg' 
              : 'bg-gradient-to-br from-gray-600 to-gray-700 border-gray-800'
            }
          `}
          style={{
            transform: 'translateZ(0px)',
            boxShadow: plot.isUnlocked 
              ? '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' 
              : '0 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          {/* Textura do terreno */}
          {plot.isUnlocked && (
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-1 left-1 w-2 h-2 bg-amber-800 rounded-full" />
              <div className="absolute bottom-2 right-2 w-1 h-1 bg-amber-900 rounded-full" />
              <div className="absolute top-3 right-3 w-1 h-1 bg-amber-800 rounded-full" />
            </div>
          )}
          
          {/* Ícone de bloqueado */}
          {!plot.isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl text-gray-400">🔒</span>
            </div>
          )}
        </div>

        {/* Sombra do terreno */}
        <div 
          className="absolute inset-0 bg-black/20 rounded-sm"
          style={{
            transform: 'translateZ(-2px)',
            filter: 'blur(2px)'
          }}
        />
      </div>

      {/* PLANO 2: PLANTA COM ALTURA 3D */}
      {plot.crop && plot.isUnlocked && (
        <div 
          className="absolute bottom-0 left-0 right-0 top-0 group cursor-pointer"
          style={{ 
            transformStyle: 'preserve-3d',
            zIndex: 100
          }}
        >
          {/* Container da planta centralizado */}
          <div 
            className="absolute bottom-2 left-1/2 -translate-x-1/2"
            style={{ 
              transformStyle: 'preserve-3d',
              transform: `translateZ(${getPlantHeight() / 2}px)`
            }}
          >
          {/* Caule principal com profundidade */}
          <div 
            className={`
              relative ${getCropColor(plot.crop.slug)} 
              transition-all duration-1000 ease-out
              hover:scale-105
            `}
            style={{
              width: '24px',
              height: `${getPlantHeight()}px`,
              borderRadius: '12px 12px 4px 4px',
              transform: 'rotateX(-65deg)',
              transformStyle: 'preserve-3d',
              boxShadow: '0 8px 16px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)'
            }}
          >
            {/* Detalhes do caule - linhas verticais */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-black/20" />
              <div className="absolute right-2 top-0 bottom-0 w-0.5 bg-black/20" />
            </div>

            {/* PLANO 3: FRUTO NO TOPO */}
            <div 
              className={`
                absolute -top-3 left-1/2 -translate-x-1/2 
                ${getFruitColor(plot.crop.slug)} 
                rounded-full animate-bounce shadow-lg
              `}
              style={{
                width: '16px',
                height: '16px',
                transform: 'translateZ(10px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.3)'
              }}
            />
          </div>

          {/* Sombra projetada da planta no terreno */}
          <div 
            className="absolute bg-black/30 blur-sm"
            style={{
              width: '32px',
              height: '8px',
              bottom: '-4px',
              left: '50%',
              transform: 'translateX(-50%) translateZ(-1px)',
              borderRadius: '50%'
            }}
          />
          </div>
        </div>
      )}

      {/* PLANO 4: UI FLUTUANTE */}
      {plot.crop && plot.isUnlocked && (
        <div 
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black/80 text-[8px] text-white px-1.5 py-0.5 rounded-full z-50 whitespace-nowrap backdrop-blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            transform: 'translateZ(40px) rotateX(-50deg) rotateZ(30deg)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            transformStyle: 'preserve-3d',
            pointerEvents: 'none'
          }}
        >
          {getTimeRemaining()}
        </div>
      )}
    </div>
  );
}
