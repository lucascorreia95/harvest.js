# FarmController - Rotas da Fazenda

Este controller implementa as 4 rotas principais para o sistema de fazenda do jogo Harvest.js.

## � Melhorias de Polimento Implementadas

### 1. Sistema de Level Up Automático
- **Método `calculateLevel()`:** Fórmula de 100 XP por nível (ajustável)
- **Método `checkLevelUp()`:** Verifica automaticamente se usuário subiu de nível
- **Atualização instantânea:** Nível é incrementado na colheita sem necessidade de nova requisição

### 2. Prevenção de Race Conditions
- **Plantio:** Validação `where: { coins: { gte: crop.price } }` garante saldo suficiente no momento exato
- **Colheita:** Transações atômicas previnem dados inconsistentes
- **Concorrência:** Múltiplos cliques rápidos são tratados com segurança

### 3. Respostas Enriquecidas
- **Plantio:** Retorna `remainingCoins` para UI atualizada
- **Colheita:** Retorna `newExperience`, `levelUp`, `newLevel` para feedback imediato

## �🗺️ Mapa de Rotas

### 1. GET /farm - O Estado da Terra
**Proteção:** JwtAuthGuard obrigatório

**O que faz:** Busca todos os Plots vinculados ao profileId do usuário logado.

**Response:**
```json
{
  "serverTime": "2026-03-18T15:00:00Z",
  "plots": [
    {
      "index": 0,
      "isUnlocked": true,
      "crop": {
        "slug": "wheat",
        "growthTime": 30,
        "plantedAt": "2026-03-18T14:59:45Z"
      }
    }
  ]
}
```

**Comportamento:**
- Retorna apenas os plots que existem no banco de dados
- Inicialmente serão 6 plots (índices 0-5) criados no signup
- Conforme o usuário for desbloqueando novos terrenos, eles aparecerão na resposta
- O frontend pode usar isso para renderizar apenas os slots disponíveis

**Destaque Técnico:** Usa `include: { crop: true }` do Prisma para enviar o tempo de crescimento e preço de venda em uma única chamada.

---

### 2. POST /farm/unlock - Expansão
**Proteção:** JwtAuthGuard obrigatório

**Payload:**
```json
{
  "plotIndex": 6
}
```

**Regra de Negócio:**
- Verifica se o usuário tem coins suficientes
- Verifica se o index é válido (0-27)
- Preço para desbloquear: 50 + (plotIndex * 20) moedas

**Response:** Plot atualizado ou erro de validação

---

### 3. POST /farm/plant - Ação de Plantar
**Proteção:** JwtAuthGuard obrigatório

**Payload:**
```json
{
  "plotIndex": 0,
  "cropSlug": "wheat"
}
```

**Regra de Negócio:**
1. Verifica se o terreno existe e pertence ao usuário
2. Verifica se o terreno está vazio (cropType === null)
3. Verifica se o usuário tem moedas para comprar a semente
4. Verifica se o usuário tem nível mínimo para plantar

**Ação:** Desconta moedas do Profile e define plantedAt como now()

---

### 4. POST /farm/harvest - Ação de Colher
**Proteção:** JwtAuthGuard obrigatório

**Payload:**
```json
{
  "plotIndex": 0
}
```

**Regra de Negócio (A mais importante):**
- Busca plantedAt e growthTime da Crop
- Validação de Tempo: agora - plantedAt >= growthTime
- Se tentar colher antes do tempo, o Back-end barra

**Ação:** 
- Adiciona sellPrice às moedas
- Soma xpReward ao perfil
- Limpa o Plot (volta para null)

**Response:**
```json
{
  "harvestedCrop": {
    "slug": "wheat",
    "sellPrice": 25,
    "xpReward": 5
  },
  "earnedCoins": 25,
  "earnedXp": 5,
  "plot": {
    "cropType": null,
    "plantedAt": null
  },
  "newExperience": 105,
  "levelUp": true,
  "newLevel": 2
}
```

**Features Avançadas:**
- **Level Up Automático:** Verifica se a nova experiência ultrapassou o limite e incrementa o nível
- **Prevenção de Race Condition:** Usa transações com validações adicionais no momento exato do update
- **Fórmula de Nível:** 100 XP por nível (ajustável via método `calculateLevel`)

## 🔒 Segurança

Todas as rotas são protegidas por `JwtAuthGuard`, garantindo que:
- Um jogador não possa mexer na terra do outro
- Apenas usuários autenticados possam acessar as rotas
- O profileId seja extraído corretamente do token JWT

## 🧱 Transactions

As rotas de desbloquear, plantar e colher usam `this.prisma.$transaction` para garantir consistência dos dados. Se o servidor cair no meio da operação, o jogador não perde recursos.

## 🌱 Crops Disponíveis

As crops são configuradas via seed no banco de dados:

- **wheat**: Custo 10, Venda 25, XP 5, Tempo 30s, Nível 1
- **carrot**: Custo 30, Venda 80, XP 15, Tempo 2min, Nível 2  
- **corn**: Custo 80, Venda 220, XP 40, Tempo 5min, Nível 5

## 🧪 Testes

Use o arquivo `api.http` na raiz do projeto para testar todas as rotas. O arquivo contém exemplos completos de fluxo de jogo.
