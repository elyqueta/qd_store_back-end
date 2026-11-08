export interface IconCatalogEntry {
  name: string;
  label: string;
  keywords: readonly string[];
}

export const iconCatalog = [
  { name: 'laptop', label: 'Portátil', keywords: ['computador', 'portátil', 'pc'] },
  { name: 'mobile-screen', label: 'Telemóvel', keywords: ['smartphone', 'mobile', 'telefone'] },
  { name: 'headphones', label: 'Auscultadores', keywords: ['áudio', 'som', 'headset'] },
  { name: 'desktop', label: 'Computador de secretária', keywords: ['computador', 'monitor', 'pc'] },
  { name: 'gamepad', label: 'Comando de jogos', keywords: ['jogos', 'gaming', 'consola'] },
  { name: 'bolt', label: 'Raio', keywords: ['energia', 'rápido', 'potência'] },
  {
    name: 'screwdriver-wrench',
    label: 'Ferramentas',
    keywords: ['componentes', 'reparação', 'manutenção'],
  },
  { name: 'keyboard', label: 'Teclado', keywords: ['periféricos', 'escrita', 'pc'] },
  { name: 'mouse', label: 'Rato', keywords: ['periféricos', 'pc', 'gaming'] },
  { name: 'print', label: 'Impressora', keywords: ['impressão', 'escritório'] },
  { name: 'wifi', label: 'Wi-Fi', keywords: ['rede', 'internet', 'conectividade'] },
  { name: 'memory', label: 'Memória', keywords: ['ram', 'componentes', 'hardware'] },
  { name: 'microchip', label: 'Microchip', keywords: ['processador', 'componentes', 'hardware'] },
  { name: 'camera', label: 'Câmara', keywords: ['fotografia', 'vídeo', 'imagem'] },
  { name: 'usb', label: 'USB', keywords: ['cabo', 'conectividade', 'acessórios'] },
  { name: 'brands/whatsapp', label: 'WhatsApp', keywords: ['contacto', 'mensagens', 'marca'] },
] as const satisfies readonly IconCatalogEntry[];

const iconNames = new Set<string>(iconCatalog.map((entry) => entry.name));

export function isCatalogIcon(value: string): boolean {
  return iconNames.has(value);
}
