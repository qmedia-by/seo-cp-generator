import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getProposal } from "@/lib/storage";
import { ProposalDocument } from "@/lib/pdf/ProposalPdf";
import { loadProposalPhotos } from "@/lib/pdf/photos";
import { contentDisposition, proposalFileBase } from "@/lib/filename";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const proposal = await getProposal(id);
  if (!proposal) {
    return new Response("КП не найдено", { status: 404 });
  }

  // Фото менеджеров лежат в отдельной таблице и грузятся асинхронно — сам
  // документ синхронный, поэтому забираем их здесь и отдаём пропсом.
  const photos = await loadProposalPhotos(
    proposal.manager,
    proposal.projectManager,
  );

  // Пересчёт из input выполняется внутри ProposalDocument (calculateSchedule).
  const element = React.createElement(ProposalDocument, {
    proposal,
    photos,
  }) as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(element);
  const name =
    proposalFileBase(proposal.input.siteName, proposal.createdAt) + ".pdf";

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDisposition(name, "inline"),
    },
  });
}
