import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getProposal } from "@/lib/storage";
import { ProposalDocument } from "@/lib/pdf/ProposalPdf";
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

  // Пересчёт из input выполняется внутри ProposalDocument (calculate).
  const element = React.createElement(ProposalDocument, {
    proposal,
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
