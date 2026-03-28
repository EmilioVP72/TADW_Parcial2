import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { url } = body

    // Validar que url está presente
    if (!url) {
      return NextResponse.json(
        { error: "Missing required field: url" },
        { status: 400 }
      )
    }

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
    const peerNodesEnv = process.env.PEER_NODES || ""
    const peers = peerNodesEnv
      .split(",")
      .map((peer) => peer.trim())
      .filter((peer) => peer.length > 0)

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
