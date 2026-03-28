import { NextResponse } from "next/server"
import { addPeerNode, getPeerNodes } from "@/lib/blockchain"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { url } = body

    if (!url) {
      return NextResponse.json(
        { error: "Missing required field: url" },
        { status: 400 }
      )
    }

    addPeerNode(url)

    return NextResponse.json(
      {
        mensaje: "Nodo registrado",
        url,
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
