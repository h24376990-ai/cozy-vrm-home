<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Virtual world game
- Game lives in `src/game/`; `VirtualWorld` is the single embeddable entry component (for later chat-app integration).
- Rules (plant growth, chat parsing, move planning, seeded towns) stay in `src/game/logic.ts` with no React/three imports, covered by `logic.test.ts`.
- State is a persisted zustand store (`src/game/store.ts`); visiting/invite permission is simulated client-side until a real backend replaces `seededTown`/`simulateEntry`.
- 3D avatar is swapped via `AvatarModel` (`config.modelUrl` → GLB), so procedural body code is a fallback, not the contract.
- Avatars are VRM (@pixiv/three-vrm) driven via normalized humanoid bones; pose math lives in src/game/vrm/vrmPose.ts and uploaded VRMs persist in IndexedDB — keeps rendering separate from rules and large files out of localStorage.
