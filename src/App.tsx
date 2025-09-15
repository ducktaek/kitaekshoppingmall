import React, { useEffect, useMemo, useState } from 'react';
import {
  ShoppingCart,
  Cpu,
  HardDrive,
  Search,
  Filter,
  SlidersHorizontal,
  X,
  Trash2,
  Check,
  Info,
  ChevronRight,
  LayoutGrid,
  List,
  GitCompare,
  Plus,
  Minus,
  Monitor,
  Gauge,
} from 'lucide-react';

// --- Utilities ---
const KRW = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' });
const cx = (...cls: (string | boolean | undefined)[]) => cls.filter(Boolean).join(' ');

// 아이콘 가시성(어두운 배경에서도 잘 보이도록)
const ICON = 'h-7 w-7 text-emerald-700';
const ICON_DIM = 'h-7 w-7 text-emerald-400';

// --- Data ---
export type Product = {
  id: string;
  name: string; // A, B, ...
  title: string; // "A 컴퓨터"
  price: number; // for sort/total
  priceLabel: string; // "100만원"
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  img: string; // emoji placeholder (replace with image URL if needed)
  tags?: string[];
};

const PRODUCTS: Product[] = [
  {
    id: 'A',
    name: 'A',
    title: 'A 컴퓨터',
    price: 1000000,
    priceLabel: '100만원',
    cpu: '인텔 i9-14900K',
    gpu: 'NVIDIA RTX 5090',
    ram: '128GB DDR5',
    storage: 'NVMe SSD 4TB',
    img: '💻',
  },
  {
    id: 'B',
    name: 'B',
    title: 'B 컴퓨터',
    price: 1000000,
    priceLabel: '100만원',
    cpu: '인텔 i7-14700K',
    gpu: 'NVIDIA RTX 4080 Super',
    ram: '64GB DDR5',
    storage: 'NVMe SSD 2TB',
    img: '💻',
  },
  {
    id: 'C',
    name: 'C',
    title: 'C 컴퓨터',
    price: 1000000,
    priceLabel: '100만원',
    cpu: '인텔 i5-14600K',
    gpu: 'NVIDIA RTX 4070 Ti',
    ram: '32GB DDR5',
    storage: 'NVMe SSD 1TB',
    img: '💻',
  },
  {
    id: 'D',
    name: 'D',
    title: 'D 컴퓨터',
    price: 1000000,
    priceLabel: '100만원',
    cpu: '인텔 i5-13400F',
    gpu: 'NVIDIA RTX 3060',
    ram: '16GB DDR4',
    storage: 'NVMe SSD 512GB',
    img: '💻',
  },
  {
    id: 'E',
    name: 'E',
    title: 'E 컴퓨터',
    price: 1000000,
    priceLabel: '100만원',
    cpu: '인텔 i3-13100',
    gpu: 'Intel UHD Graphics 730',
    ram: '8GB DDR4',
    storage: 'SSD 256GB',
    img: '💻',
  },
  {
    id: 'F',
    name: 'F',
    title: 'F 컴퓨터',
    price: 1000000,
    priceLabel: '100만원',
    cpu: '인텔 Pentium G6400',
    gpu: 'Intel UHD Graphics 610',
    ram: '4GB DDR4',
    storage: 'SSD 128GB',
    img: '💻',
  },
];

// --- Types ---
type SortKey = 'featured' | 'price' | 'cpu' | 'gpu' | 'ram' | 'name';

// --- Helpers for parsing tiers ---
const parseRamGB = (ram: string) => {
  const m = /([0-9]+)GB/i.exec(ram || '');
  return m ? parseInt(m[1], 10) : 0;
};
const tierMap = (value: string, order: string[]): number => {
  const idx = order.findIndex((k) => value?.toLowerCase().includes(k.toLowerCase()));
  return idx === -1 ? order.length : idx;
};
const cpuTier = (cpu: string) => tierMap(cpu, ['i9', 'i7', 'i5', 'i3', 'pentium', 'celeron']);
const gpuTier = (gpu: string) =>
  tierMap(gpu, ['5090', '4090', '4080', '4070', '4060', '3060', 'uhd 7', 'uhd 6', 'intel uhd']);

// --- Main Component ---
export default function PCShop() {
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState<SortKey>('featured');
  const [minRam, setMinRam] = useState(0);
  const [selected, setSelected] = useState<string[]>([]); // compare list
  const [cart, setCart] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('pcshop_cart') || '{}');
    } catch {
      return {};
    }
  });
  const [showFilters, setShowFilters] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);

  useEffect(() => {
    localStorage.setItem('pcshop_cart', JSON.stringify(cart));
  }, [cart]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = PRODUCTS.filter((p) => {
      const text = `${p.title} ${p.cpu} ${p.gpu} ${p.ram} ${p.storage} ${p.tags?.join(' ')}`.toLowerCase();
      const okQ = q ? text.includes(q) : true;
      const okRam = parseRamGB(p.ram) >= minRam;
      return okQ && okRam;
    });

    list = [...list].sort((a, b) => {
      if (sort === 'price') return a.price - b.price;
      if (sort === 'cpu') return cpuTier(a.cpu) - cpuTier(b.cpu);
      if (sort === 'gpu') return gpuTier(a.gpu) - gpuTier(b.gpu);
      if (sort === 'ram') return parseRamGB(b.ram) - parseRamGB(a.ram);
      if (sort === 'name') return a.name.localeCompare(b.name, 'ko');
      return 0; // featured (original order)
    });

    return list;
  }, [query, minRam, sort]);

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = PRODUCTS.find((x) => x.id === id);
    return p ? sum + p.price * qty : sum;
  }, 0);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id]));
  };

  const addToCart = (id: string, qty = 1) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + qty }));
  };
  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const next = { ...prev } as Record<string, number>;
      delete next[id];
      return next;
    });
  };
  const setQty = (id: string, qty: number) => {
    if (qty <= 0) return removeFromCart(id);
    setCart((prev) => ({ ...prev, [id]: qty }));
  };

  return (
    <div className="relative min-h-screen text-emerald-500">
      {/* Global background layer to cover the entire window */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 bg-slate-900/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/20 ring-1 ring-inset ring-indigo-400/40">
              <Cpu className={ICON} />
            </span>
            오기택의 컴퓨터샵
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 rounded-2xl bg-transparent ring-1 ring-white/10 px-3 py-2">
              <Search className={ICON_DIM} />
              <input
                placeholder="검색: i7, 4070, 32GB ..."
                className="bg-transparent outline-none placeholder:text-slate-400 text-sm w-64"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              className="md:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-transparent ring-1 ring-white/10"
              onClick={() => setShowFilters(true)}
            >
              <Filter className={ICON} /> 필터
            </button>
            <CartButton count={totalItems} amount={totalPrice} />
          </div>
        </div>
      </header>
      {/* Toolbar */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center gap-3">
        <div className="hidden md:flex items-center gap-3">
          <SlidersHorizontal className={ICON} />
          <label className="text-sm opacity-80">최소 RAM</label>
          <input
            type="range"
            min={0}
            max={128}
            step={8}
            value={minRam}
            onChange={(e) => setMinRam(parseInt(e.target.value, 10))}
            className="accent-indigo-400"
          />
          <span className="text-sm tabular-nums w-12 text-right">{minRam}GB</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-transparent ring-1 ring-white/10 rounded-xl px-3 py-2 text-sm"
          >
            <option value="featured">정렬: 추천</option>
            <option value="price">가격(낮은순)</option>
            <option value="cpu">CPU 등급</option>
            <option value="gpu">GPU 등급</option>
            <option value="ram">RAM(높은순)</option>
            <option value="name">이름</option>
          </select>
          <div className="flex rounded-xl overflow-hidden ring-1 ring-white/10">
            <button
              className={cx(
                'px-3 py-2 text-sm inline-flex items-center gap-1 bg-transparent',
                layout === 'grid' && 'bg-white/10'
              )}
              onClick={() => setLayout('grid')}
            >
              <LayoutGrid className={ICON} /> 그리드
            </button>
            <button
              className={cx(
                'px-3 py-2 text-sm inline-flex items-center gap-1 bg-transparent',
                layout === 'list' && 'bg-white/10'
              )}
              onClick={() => setLayout('list')}
            >
              <List className={ICON} /> 리스트
            </button>
          </div>
        </div>
      </div>
      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 pb-28">
        {filtered.length === 0 ? (
          <EmptyState
            onReset={() => {
              setQuery('');
              setMinRam(0);
              setSort('featured');
            }}
          />
        ) : layout === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <Card key={p.id}>
                <ProductCard
                  product={p}
                  selected={selected.includes(p.id)}
                  onSelect={() => toggleSelect(p.id)}
                  onAdd={() => addToCart(p.id)}
                  onDetail={() => setDetail(p)}
                />
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <Card key={p.id}>
                <ProductRow
                  product={p}
                  selected={selected.includes(p.id)}
                  onSelect={() => toggleSelect(p.id)}
                  onAdd={() => addToCart(p.id)}
                  onDetail={() => setDetail(p)}
                />
              </Card>
            ))}
          </div>
        )}
      </main>
      {/* Compare Bar */}
      <CompareBar ids={selected} onClear={() => setSelected([])} />
      {/* Floating Filter Drawer for mobile */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-80 max-w-[80%] bg-slate-900/95 backdrop-blur border-r border-white/10 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">필터</div>
              <button className="p-2 hover:bg-transparent rounded-lg" onClick={() => setShowFilters(false)}>
                <X className={ICON} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm opacity-80">검색</label>
                <div className="mt-1 flex items-center gap-2 rounded-xl bg-transparent ring-1 ring-white/10 px-3 py-2">
                  <Search className={ICON_DIM} />
                  <input
                    placeholder="i7, 4070, 32GB ..."
                    className="bg-transparent outline-none placeholder:text-slate-400 text-sm w-full"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm opacity-80">최소 RAM</label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={128}
                    step={8}
                    value={minRam}
                    onChange={(e) => setMinRam(parseInt(e.target.value, 10))}
                    className="accent-indigo-400 w-full"
                  />
                  <span className="text-sm tabular-nums w-14 text-right">{minRam}GB</span>
                </div>
              </div>
              <div>
                <label className="text-sm opacity-80">정렬</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="mt-2 bg-transparent ring-1 ring-white/10 rounded-xl px-3 py-2 text-sm w-full"
                >
                  <option value="featured">추천</option>
                  <option value="price">가격(낮은순)</option>
                  <option value="cpu">CPU 등급</option>
                  <option value="gpu">GPU 등급</option>
                  <option value="ram">RAM(높은순)</option>
                  <option value="name">이름</option>
                </select>
              </div>
            </div>
            <button
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 ring-1 ring-inset ring-indigo-400/50 hover:bg-indigo-500/30"
              onClick={() => setShowFilters(false)}
            >
              적용하기 <ChevronRight className={ICON} />
            </button>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setShowFilters(false)} />
        </div>
      )}
      {/* Detail / Compare Modal */}
      {detail && <DetailModal product={detail} onClose={() => setDetail(null)} onAdd={() => addToCart(detail.id)} />}
      {/* Cart Drawer (state sync) */}
      <CartDrawer cart={cart} onQty={setQty} onRemove={removeFromCart} />
      {/* Footer */}
      <footer className="border-t border-white/10 py-10 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} 오기택 • 쇼핑몰 UI
      </footer>
    </div>
  );
}

// --- Reusable UI ---
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="group rounded-2xl p-4 ring-1 ring-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition shadow-sm hover:shadow-md">
      {children}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-indigo-500/15 ring-1 ring-inset ring-indigo-400/30 text-indigo-200">
      {children}
    </span>
  );
}

function SpecRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="opacity-70">{icon}</span>
      <span className="opacity-70 w-16">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ProductCard({
  product,
  onAdd,
  onDetail,
  selected,
  onSelect,
}: {
  product: Product;
  onAdd: () => void;
  onDetail: () => void;
  selected: boolean;
  onSelect: () => void;
}) {
  const r = parseRamGB(product.ram);
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 ring-1 ring-white/10 flex items-center justify-center text-2xl">
          {product.img}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{product.title}</h3>
            {product.tags?.slice(0, 2).map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
          <div className="text-sm text-slate-400">
            {product.priceLabel} ({KRW.format(product.price)})
          </div>
        </div>
        <button
          className={cx(
            'p-2 rounded-xl ring-1 ring-white/10',
            selected ? 'bg-emerald-500/20 ring-emerald-400/40' : 'bg-transparent'
          )}
          onClick={onSelect}
          title={selected ? '비교에서 제외' : '비교에 추가'}
        >
          <GitCompare className={ICON} />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <SpecRow icon={<Cpu className={ICON} />} label="CPU" value={product.cpu} />
        <SpecRow icon={<Monitor className={ICON} />} label="GPU" value={product.gpu} />
        <SpecRow icon={<Gauge className={ICON} />} label="RAM" value={product.ram} />
        <SpecRow icon={<HardDrive className={ICON} />} label="저장장치" value={product.storage} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/20 ring-1 ring-inset ring-indigo-400/50 hover:bg-indigo-500/30"
          onClick={onAdd}
        >
          <ShoppingCart className={ICON} /> 담기
        </button>
        <button
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-transparent ring-1 ring-white/10 hover:bg-white/10"
          onClick={onDetail}
        >
          <Info className={ICON} /> 상세보기
        </button>
        {r >= 64 && <Tag>메모리 빵빵</Tag>}
      </div>
    </div>
  );
}

function ProductRow({
  product,
  onAdd,
  onDetail,
  selected,
  onSelect,
}: {
  product: Product;
  onAdd: () => void;
  onDetail: () => void;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 ring-1 ring-white/10 flex items-center justify-center text-xl">
        {product.img}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold truncate">{product.title}</h3>
          {product.tags?.slice(0, 2).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <SpecRow icon={<Cpu className={ICON} />} label="CPU" value={product.cpu} />
          <SpecRow icon={<Monitor className={ICON} />} label="GPU" value={product.gpu} />
          <SpecRow icon={<Gauge className={ICON} />} label="RAM" value={product.ram} />
          <SpecRow icon={<HardDrive className={ICON} />} label="저장장치" value={product.storage} />
        </div>
      </div>
      <div className="hidden md:flex flex-col items-end gap-2 w-48">
        <div className="text-sm text-slate-400">{product.priceLabel}</div>
        <div className="text-base font-semibold">{KRW.format(product.price)}</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded-xl bg-transparent ring-1 ring-white/10 hover:bg-white/10"
            onClick={onDetail}
          >
            상세
          </button>
          <button
            className="px-3 py-2 rounded-xl bg-indigo-500/20 ring-1 ring-inset ring-indigo-400/50 hover:bg-indigo-500/30"
            onClick={onAdd}
          >
            담기
          </button>
          <button
            className={cx(
              'px-3 py-2 rounded-xl ring-1',
              selected ? 'bg-emerald-500/20 ring-emerald-400/40' : 'bg-transparent ring-white/10'
            )}
            onClick={onSelect}
            title={selected ? '비교에서 제외' : '비교에 추가'}
          >
            <GitCompare className={ICON} />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-2xl ring-1 ring-white/10 bg-white/[0.03] py-16 text-center">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-transparent ring-1 ring-white/10 flex items-center justify-center">
        <Search className={'h-7 w-7 text-slate-400'} />
      </div>
      <h3 className="mt-4 text-lg font-semibold">조건에 맞는 상품이 없어요</h3>
      <p className="mt-1 text-slate-400">필터를 조정하거나 검색어를 바꿔보세요.</p>
      <button
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent ring-1 ring-white/10 hover:bg-white/10"
        onClick={onReset}
      >
        초기화 <ChevronRight className={ICON} />
      </button>
    </div>
  );
}

function CompareBar({ ids, onClear }: { ids: string[]; onClear: () => void }) {
  if (ids.length === 0) return null;
  const items = PRODUCTS.filter((p) => ids.includes(p.id));
  return (
    <div
      className={
        'absolute right-0 top-0 bottom-0 w-[min(420px,95vw)] ' +
        'bg-slate-900/95 backdrop-blur border-l border-white/10 ' +
        'transform transition-transform duration-300 ' +
        'translate-x-full'
      }
    >
      <div className="h-full flex flex-col rounded-tl-2xl bg-slate-900/95 backdrop-blur ring-1 ring-white/10 p-3 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <GitCompare className={ICON} />
          <div className="text-sm font-medium">비교</div>
          <div className="ml-auto">
            <button
              className="px-2 py-1 rounded-lg bg-transparent ring-1 ring-white/10 hover:bg-white/10"
              onClick={onClear}
            >
              초기화
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((p) => (
            <div key={p.id} className="px-2 py-1 rounded-lg bg-transparent ring-1 ring-white/10 text-xs">
              {p.title}
            </div>
          ))}
        </div>
        <div className="mt-auto pt-3">
          <CompareDialog products={items} />
        </div>
      </div>
    </div>
  );
}

function TableRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="grid grid-cols-[120px_repeat(3,minmax(0,1fr))] gap-3 py-2 px-3 text-sm">
      <div className="opacity-70">{label}</div>
      {values.map((v, i) => (
        <div key={i} className="font-medium">
          {v}
        </div>
      ))}
    </div>
  );
}

function CompareDialog({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="px-3 py-2 rounded-xl bg-indigo-500/20 ring-1 ring-inset ring-indigo-400/50 hover:bg-indigo-500/30"
        onClick={() => setOpen(true)}
      >
        비교하기
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="m-auto w-[min(900px,95vw)] rounded-2xl bg-slate-900/95 backdrop-blur ring-1 ring-white/10 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="font-semibold">상품 비교</div>
              <button className="p-2 hover:bg-transparent rounded-lg" onClick={() => setOpen(false)}>
                <X className={ICON} />
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-[120px_repeat(3,minmax(0,1fr))] gap-3 py-2 px-3 text-sm font-semibold">
                <div />
                {products.map((p) => (
                  <div key={p.id}>{p.title}</div>
                ))}
              </div>
              <div className="divide-y divide-white/10">
                <TableRow label="가격" values={products.map((p) => `${p.priceLabel} (${KRW.format(p.price)})`)} />
                <TableRow label="CPU" values={products.map((p) => p.cpu)} />
                <TableRow label="GPU" values={products.map((p) => p.gpu)} />
                <TableRow label="RAM" values={products.map((p) => p.ram)} />
                <TableRow label="저장장치" values={products.map((p) => p.storage)} />
                <TableRow label="특징" values={products.map((p) => (p.tags || []).join(', '))} />
              </div>
            </div>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

function DetailModal({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="m-auto w-[min(720px,95vw)] rounded-2xl bg-slate-900/95 backdrop-blur ring-1 ring-white/10 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="font-semibold">{product.title} 상세 정보</div>
          <button className="p-2 hover:bg-transparent rounded-lg" onClick={onClose}>
            <X className={ICON} />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6">
          <div className="h-40 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 ring-1 ring-white/10 flex items-center justify-center text-5xl">
            {product.img}
          </div>
          <div>
            <div className="text-2xl font-semibold">{KRW.format(product.price)}</div>
            <div className="text-sm text-slate-400">표기 가격: {product.priceLabel}</div>
            <div className="mt-4 space-y-2">
              <SpecRow icon={<Cpu className={ICON} />} label="CPU" value={product.cpu} />
              <SpecRow icon={<Monitor className={ICON} />} label="GPU" value={product.gpu} />
              <SpecRow icon={<Gauge className={ICON} />} label="RAM" value={product.ram} />
              <SpecRow icon={<HardDrive className={ICON} />} label="저장장치" value={product.storage} />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 ring-1 ring-inset ring-indigo-400/50 hover:bg-indigo-500/30"
                onClick={onAdd}
              >
                <ShoppingCart className={ICON} /> 장바구니 담기
              </button>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent ring-1 ring-white/10 hover:bg-white/10"
                onClick={onClose}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 bg-black/50" onClick={onClose} />
    </div>
  );
}

// --- Cart ---
function CartButton({ count, amount }: { count: number; amount: number }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = () => setOpen((prev) => prev); // placeholder to mount drawer
    window.addEventListener('pcshop_cart_refresh', handler);
    return () => window.removeEventListener('pcshop_cart_refresh', handler);
  }, []);
  return (
    <>
      <button
        className="relative inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-transparent ring-1 ring-white/10 hover:bg-white/10"
        onClick={() => setOpen(true)}
        title="장바구니 열기"
      >
        <ShoppingCart className={ICON} />
        <span className="text-sm tabular-nums">{count}</span>
        {amount > 0 && <span className="text-xs text-slate-400">{KRW.format(amount)}</span>}
      </button>
      {open && <CartDrawerOpen onClose={() => setOpen(false)} />}
    </>
  );
}

function CartDrawerOpen({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* right panel */}
      <div
        className={
          'absolute right-0 top-0 bottom-0 w-[min(420px,95vw)] ' +
          'bg-slate-900/95 backdrop-blur border-l border-white/10 ' +
          'transform transition-transform duration-300 ' +
          (mounted ? 'translate-x-110' : 'translate-x-full')
        }
      >
        <CartPanel onClose={onClose} />
      </div>
    </div>
  );
}

function CartDrawer({
  cart,
  onQty,
  onRemove,
}: {
  cart: Record<string, number>;
  onQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  // Hidden persistent drawer container (keeps state in sync & provides API)
  useEffect(() => {
    (window as any).pcshop_setQty = onQty;
    (window as any).pcshop_remove = onRemove;
    window.dispatchEvent(new Event('pcshop_cart_refresh'));
  }, [onQty, onRemove, cart]);
  return null;
}

function CartPanel({ onClose }: { onClose: () => void }) {
  const [cart, setCartState] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('pcshop_cart') || '{}');
    } catch {
      return {};
    }
  });
  useEffect(() => {
    const sync = () => setCartState(JSON.parse(localStorage.getItem('pcshop_cart') || '{}'));
    window.addEventListener('storage', sync);
    window.addEventListener('pcshop_cart_refresh', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('pcshop_cart_refresh', sync);
    };
  }, []);

  const setQty = (id: string, qty: number) => {
    (window as any).pcshop_setQty?.(id, qty);
    setTimeout(() => window.dispatchEvent(new Event('pcshop_cart_refresh')), 0);
  };
  const remove = (id: string) => {
    (window as any).pcshop_remove?.(id);
    setTimeout(() => window.dispatchEvent(new Event('pcshop_cart_refresh')), 0);
  };

  const entries = Object.entries(cart);
  const total = entries.reduce((sum, [id, q]) => {
    const p = PRODUCTS.find((x) => x.id === id);
    return p ? sum + p.price * q : sum;
  }, 0);

  return (
    <div className="h-[50dvh] flex min-h-0 flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="font-semibold">장바구니</div>
        <button className="p-2 hover:bg-transparent rounded-lg" onClick={onClose}>
          <X className={ICON} />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {entries.length === 0 ? (
          <div className="text-sm text-slate-400">담긴 상품이 없습니다.</div>
        ) : (
          entries.map(([id, q]) => {
            const p = PRODUCTS.find((x) => x.id === id)!;
            return (
              <div key={id} className="flex items-center gap-3 p-3 rounded-xl bg-transparent ring-1 ring-white/10">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 ring-1 ring-white/10 flex items-center justify-center text-xl">
                  {p.img}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{p.title}</div>
                  <div className="text-xs text-slate-400">
                    {p.priceLabel} · {KRW.format(p.price)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 rounded-lg bg-transparent ring-1 ring-white/10"
                    onClick={() => setQty(id, Math.max(0, q - 1))}
                  >
                    <Minus className={ICON} />
                  </button>
                  <span className="w-6 text-center tabular-nums">{q}</span>
                  <button
                    className="p-2 rounded-lg bg-transparent ring-1 ring-white/10"
                    onClick={() => setQty(id, q + 1)}
                  >
                    <Plus className={ICON} />
                  </button>
                </div>
                <button className="p-2 rounded-lg bg-transparent ring-1 ring-white/10" onClick={() => remove(id)}>
                  <Trash2 className={ICON} />
                </button>
              </div>
            );
          })
        )}
      </div>
      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="opacity-80">총액</span>
          <span className="font-semibold">{KRW.format(total)}</span>
        </div>
        <button
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/20 ring-1 ring-inset ring-emerald-400/50 hover:bg-emerald-500/30 disabled:opacity-50"
          disabled={entries.length === 0}
        >
          <Check className={ICON} /> 결제 진행 (데모)
        </button>
      </div>
    </div>
  );
}
