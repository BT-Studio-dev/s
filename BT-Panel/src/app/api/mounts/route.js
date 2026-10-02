import { NextResponse } from "next/server";
import { handle, readBody, requireAdmin } from "@/lib/server/auth";
import { createMount, deleteMount, listMounts } from "@/lib/server/data";

/** Mount paths are infrastructure details and are visible to admins only. */
export async function GET(req) {
  return handle(req, async () => {
    await requireAdmin();
    return NextResponse.json({
      mounts: await listMounts(),
    });
  });
}

/** Declaring storage is an admin-only capability. */
export async function POST(req) {
  return handle(req, async () => {
    await requireAdmin();
    return NextResponse.json({
      mount: await createMount(await readBody(req)),
    });
  });
}
export async function DELETE(req) {
  return handle(req, async () => {
    await requireAdmin();
    const body = await readBody(req);
    await deleteMount(typeof body.id === "string" ? body.id : "");
    return NextResponse.json({
      mounts: await listMounts(),
    });
  });
}
