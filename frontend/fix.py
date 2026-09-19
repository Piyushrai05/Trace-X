import os

# 1. Create vite-env.d.ts
with open("src/vite-env.d.ts", "w", encoding="utf-8") as f:
    f.write('/// <reference types="vite/client" />\n')

# 2. Fix RecallCenterPage.tsx missing Skeleton import
with open("src/pages/RecallCenterPage.tsx", "r", encoding="utf-8") as f:
    rcp = f.read()
rcp = rcp.replace("import { Button } from", "import { Skeleton } from '../components/common/Skeleton'\nimport { Button } from")
with open("src/pages/RecallCenterPage.tsx", "w", encoding="utf-8") as f:
    f.write(rcp)

# 3. Fix cytoscape-dagre any type
with open("src/components/graph/TraceGraph.tsx", "r", encoding="utf-8") as f:
    tg = f.read()
tg = tg.replace("import cytoscapeDagre", "// @ts-ignore\nimport cytoscapeDagre")
with open("src/components/graph/TraceGraph.tsx", "w", encoding="utf-8") as f:
    f.write(tg)

# 4. Remove clsx from Drawer
with open("src/components/common/Drawer.tsx", "r", encoding="utf-8") as f:
    drawer = f.read()
drawer = drawer.replace("import { clsx } from 'clsx'", "")
with open("src/components/common/Drawer.tsx", "w", encoding="utf-8") as f:
    f.write(drawer)

# 5. Remove KitchenDetail from KitchensPage
with open("src/pages/KitchensPage.tsx", "r", encoding="utf-8") as f:
    kp = f.read()
kp = kp.replace("import type { KitchenSummary, KitchenDetail }", "import type { KitchenSummary }")
with open("src/pages/KitchensPage.tsx", "w", encoding="utf-8") as f:
    f.write(kp)

# 6. Remove unused React imports
import re
files = [
  'src/components/common/EmptyState.tsx',
  'src/components/common/ErrorState.tsx',
  'src/components/common/MetricCard.tsx',
  'src/components/common/Skeleton.tsx',
  'src/components/common/StatusBadge.tsx',
  'src/components/common/Tabs.tsx',
  'src/components/common/Toast.tsx',
  'src/components/graph/TraceGraph.tsx',
  'src/components/layout/AppLayout.tsx',
  'src/pages/BatchDetailPage.tsx',
  'src/pages/ComponentGalleryPage.tsx',
  'src/pages/DashboardPage.tsx',
  'src/pages/ForwardTracePage.tsx',
  'src/pages/KitchensPage.tsx',
  'src/pages/RecallCenterPage.tsx',
  'src/pages/SuppliersPage.tsx',
  'src/pages/ReverseInvestigatePage.tsx',
  'src/pages/LoginPage.tsx',
  'src/App.tsx'
]

for file in files:
    if os.path.exists(file):
        with open(file, "r", encoding="utf-8") as f:
            text = f.read()
        text = re.sub(r"^import React from 'react'\r?\n", "", text, flags=re.MULTILINE)
        text = re.sub(r"^import React, ", "import ", text, flags=re.MULTILINE)
        with open(file, "w", encoding="utf-8") as f:
            f.write(text)

# 7. DashboardPage specific unused useEffect, useState
with open("src/pages/DashboardPage.tsx", "r", encoding="utf-8") as f:
    dp = f.read()
dp = dp.replace("import { useEffect, useState } from 'react'\n", "")
with open("src/pages/DashboardPage.tsx", "w", encoding="utf-8") as f:
    f.write(dp)
