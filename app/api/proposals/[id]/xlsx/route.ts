import { getProposal } from "@/lib/storage";
import { buildWorkbook } from "@/lib/xlsx/buildWorkbook";
import { contentDisposition, proposalFileBase } from "@/lib/filename";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const proposal = await getProposal(params.id);
  if (!proposal) {
    return new Response("КП не найдено", { status: 404 });
  }

  // Пересчёт из input делается внутри buildWorkbook (calculate).
  const buffer = await buildWorkbook(proposal);
  const name =
    proposalFileBase(proposal.input.siteName, proposal.createdAt) + ".xlsx";

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": contentDisposition(name),
    },
  });
}
