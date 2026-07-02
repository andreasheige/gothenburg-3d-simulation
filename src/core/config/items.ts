import type { Item, ItemId } from '@/core/types';

/** Item catalogue. The HUD shows the icon + a count only. */
export const ITEMS: Record<ItemId, Item> = {
  ticket: { icon: '🎫', label: 'Spårvagnsbiljett', price: 34 },
  kanelbulle: { icon: '🥐', label: 'Kanelbulle', price: 32, food: true },
  korv: { icon: '🌭', label: 'Korv med bröd', price: 45, food: true },
  coffee: { icon: '☕', label: 'Fika-kaffe', price: 39 },
  fish: { icon: '🐟', label: 'Feskekörka-fisk', price: 120, sellable: true },
  wallet: { icon: '👛', label: 'Stulen plånbok', price: 0, sellable: true },
  souvenir: { icon: '🖼️', label: 'Souvenir', price: 80, sellable: true },
  beer: { icon: '🍺', label: 'Stor stark', price: 79 },
  drink: { icon: '🍸', label: 'Drink', price: 129 },
};
