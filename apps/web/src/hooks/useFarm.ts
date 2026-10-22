import { useState, useEffect } from 'react';

interface Plot {
  index: number;
  isUnlocked: boolean;
  crop?: {
    slug: string;
    plantedAt: string;
  };
}

interface FarmData {
  serverTime: string;
  plots: Plot[];
}

export function useFarm() {
  const [farmData, setFarmData] = useState<FarmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data inicial para demonstração
  const mockFarmData: FarmData = {
    serverTime: new Date().toISOString(),
    plots: Array.from({ length: 28 }, (_, index) => {
      const plot: Plot = {
        index,
        isUnlocked: index < 8 // Primeiros 8 terrenos desbloqueados
      };

      // Adicionar algumas plantações de exemplo
      if (index < 6 && index % 2 === 0) {
        const cropTypes = ['carrot', 'wheat', 'corn', 'tomato', 'lettuce', 'potato'];
        const plantedTime = new Date(Date.now() - Math.random() * 40000); // Plantado há até 40 segundos
        plot.crop = {
          slug: cropTypes[index % cropTypes.length],
          plantedAt: plantedTime.toISOString()
        };
      }

      return plot;
    })
  };

  useEffect(() => {
    // Simular carregamento inicial
    const loadFarm = async () => {
      try {
        setLoading(true);
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 1000));
        setFarmData(mockFarmData);
      } catch (err) {
        setError('Falha ao carregar dados da fazenda');
      } finally {
        setLoading(false);
      }
    };

    loadFarm();
  }, []);

  // Atualizar timers a cada segundo
  useEffect(() => {
    if (!farmData) return;

    const interval = setInterval(() => {
      setFarmData(prev => prev ? {
        ...prev,
        serverTime: new Date().toISOString()
      } : null);
    }, 1000);

    return () => clearInterval(interval);
  }, [farmData]);

  return {
    farmData,
    loading,
    error,
    refetch: () => setFarmData(mockFarmData)
  };
}
