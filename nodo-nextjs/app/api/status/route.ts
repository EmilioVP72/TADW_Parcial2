import { NextResponse } from "next/server"

export async function GET() {
  const peerNodesEnv = process.env.PEER_NODES || ""
  const peers = peerNodesEnv
    .split(",")
    .map((peer) => peer.trim())
    .filter((peer) => peer.length > 0)

  return NextResponse.json(
    {
      nodo: "nodo-nextjs",
      puerto: 8012,
      framework: "Next.js",
      peers,
    },
    { status: 200 }
  )
}
