# State & systems

State is split into **three** stores by update frequency, which is the single
most important pattern in the codebase.

## 1. Reactive UI state — `useGame` (zustand) · `src/state/store.ts`

A curried `create<GameState>()(...)` store. Holds everything the **HUD** needs to
re-render on change:

- **World:** `scene` (`'city' | 'interior'`), `interiorId`, `dayT` (day
  fraction), `paused`.
- **Economy:** `wallet` (SEK, starts 320), `score`, `wanted` (0–5),
  `inventory: Partial<Record<ItemId, number>>`, `district`.
- **Interaction/feedback:** `nearby` (the current interactable), `toasts`,
  `riding` (tram line id or `null`).
- **Orientation:** `street`, `guide` (nearest landmark + distance), `mapOpen`,
  `travelOpen`.

Actions live on the same store: money (`earn`/`pay`), items
(`addItem`/`removeItem`/`hasItem`), `addWanted`/`decayWanted`/`clearWanted`,
`toast`, scene transitions (`enterInterior`/`exitInterior`), commerce
(`buyFromShop`/`buyDrink`), `pickpocket`, `giveChange`, `visitLandmark`,
`boardTram`/`exitTram`, and navigation/overlay toggles
(`toggleMap`/`teleport`/`toggleTravel`).

Stores write **minimal patches** (e.g. `setNav` only updates when the street or
distance actually changed) to avoid needless HUD renders.

## 2. Non-reactive player transform — `player` · `src/state/store.ts`

```ts
export const player: PlayerTransform = { x, z, angle, vx, vz, camYaw, onTram, spawn };
```

A plain mutable object **deliberately outside** zustand. It is written every
frame by `Player.tsx` and read by systems, the camera, the minimap and the
compass — mutating it does **not** trigger React renders. `camYaw` is published
here for the compass/minimap; `onTram` holds the `TramRuntime` when riding.

`resolveSpawn()` spiral-searches outward from Brunnsparken for the nearest
non-`blocked()` cell so the player never starts inside a building.

## 3. Runtime registries — `registry` · `src/core/systems/registry.ts`

`{ trams: TramRuntime[], tourists: TouristRuntime[] }` — also outside React.
Entity systems push their live instances here so other systems (proximity
detection, the minimap) can query them without prop-drilling or re-renders.

> **Rule:** anything that changes every frame goes in `player`/`registry`;
> anything the HUD displays goes in `useGame`. Never put per-frame values in
> `useGame`.

## The per-frame gameplay loop — `src/features/systems/Systems.tsx`

A component that **renders `null`** but owns the simulation via `useFrame`:

1. Clamp `dt` to `0.05` (guards against tab-switch spikes).
2. Sync the clock: push `dayT` to the store **only on a minute change** (from
   `realDayT()`), so the HUD clock doesn't re-render every frame.
3. `decayWanted(dt)` and update the current `district` (`nearestHood`).
4. ~3×/sec: refresh orientation readouts (`nearestStreet` + `nearestLandmark`).
5. **Proximity:** find the nearest interactable within reach — static candidates
   (venues, shops, landmarks, precomputed once) plus dynamic tourists and
   open-door trams — and publish it as `nearby` (only when it changes).

### Key bindings (also in `Systems.tsx`, via `useKeyPress`)

| Key   | Action                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `E`   | Context action on `nearby` (enter venue / shop / photo / pickpocket / board tram). While riding, `E` disembarks at an open-door stop. |
| `F`   | Drop food (korv/kanelbulle) — seagulls attack.                                                                                        |
| `M`   | Toggle the big map.                                                                                                                   |
| `T`   | Toggle the fast-travel menu.                                                                                                          |
| `Esc` | Close map/travel overlays.                                                                                                            |

Movement + camera keys (`WASD`, mouse-drag orbit, wheel zoom, `Q/R` yaw, `Z/X`
pitch) are handled in `features/player/Player.tsx`.

## Gameplay & economy summary

- **Money/score:** buying, selling loot at Pantbanken, drinks (night/club
  bonuses), landmark photos (+10), disembarking trams (+6).
- **Wanted (0–5):** rises on crimes — fare-dodging (boarding without a
  `ticket`), pickpocketing (`+1.5`), drunken trouble outside clubs at night;
  decays slowly over time. Good karma (`giveChange`) adds score.
- **Items:** defined in `core/config/items.ts` (`ITEMS`) — price, icon,
  `sellable`. Inventory starts with a `ticket`.
