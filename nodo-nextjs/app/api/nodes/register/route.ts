import { NextResponse } from "next/server"
import { addPeerNode, getPeerNodes } from "@/lib/blockchain"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { url, nodes } = body

    if (!url && (!nodes || !Array.isArray(nodes))) {
      return NextResponse.json(
        { error: "Missing required field: url or nodes array" },
        { status: 400 }
      )
    }

    if (nodes) {
      nodes.forEach((n: string) => addPeerNode(n))
    } else if (url) {
      addPeerNode(url)
    }

    return NextResponse.json(
      {
        mensaje: "Nodos registrados",
        nodes: nodes || [url],
      },
      { status: 201 }
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const peers = getPeerNodes()

    return NextResponse.json(
      {
        peers,
      },
      { status: 200 }
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
