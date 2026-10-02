import { HttpError } from "@/lib/server/core";
import { handle, requireUser } from "@/lib/server/auth";
import { getMedia } from "@/lib/server/data";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Uploaded logos and wallpapers. Gated on a session because these are panel
 * configuration, not public assets: without this any visitor holding a media id
 * could read what the owner uploaded. Same-origin <img> requests carry the
 * session cookie, so normal rendering is unaffected.
 */
export async function GET(req: Request, ctx: Ctx) {
  return handle(req, async () => {
    await requireUser();
    const { id: raw } = await ctx.params;
    // saveMedia returns `/api/media/<id>.<ext>` so the client can tell an image
    // wallpaper from a video one; the extension is not part of the id.
    const id = raw.split(".")[0];
    const media = await getMedia(id);
    if (!media) throw new HttpError(404, "Not found");
    const bytes = new Uint8Array(Buffer.from(media.data, "base64"));
    return new Response(bytes, {
      // `private`: these are now auth-gated, so a shared proxy must not keep a
      // copy that a later signed-out visitor could be served.
      headers: { "Content-Type": media.mime, "Cache-Control": "private, max-age=3600" },
    });
  });
}
