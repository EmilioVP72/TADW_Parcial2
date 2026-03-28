import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { esCAdenaMasLarga, getPeerNodes } from "@/lib/blockchain"
import type { GradoBloque } from "@/lib/blockchain"

export async function GET() {
  try {
    // 1. Leer Nodos
    const peerNodes = getPeerNodes()

    // 2. Consultar cadena local
    const baseUrl = process.env.NODE_URL || "http://localhost:8012"
    const localResponse = await fetch(`${baseUrl}/api/chain`)
    if (!localResponse.ok) {
      return NextResponse.json(
        { error: "Error al consultar cadena local" },
        { status: 500 }
      )
    }
    const cadenaLocal: GradoBloque[] = await localResponse.json()

    // 3. Obtener cadenas de peers
    let cadenaMasLarga: GradoBloque[] = cadenaLocal
    let nodoCadenaMasLarga = "local"

    for (const peerUrl of peerNodes) {
      try {
        const response = await fetch(`${peerUrl}/api/chain`)
        if (response.ok) {
          const cadenaPeer: GradoBloque[] = await response.json()

          // 4. Comparar cadenas usando esCAdenaMasLarga
          if (esCAdenaMasLarga(cadenaMasLarga, cadenaPeer)) {
            cadenaMasLarga = cadenaPeer
            nodoCadenaMasLarga = peerUrl
          }
        }
      } catch (error) {
        // Capturar silenciosamente errores de peers caídos
        console.warn(`Error al consultar cadena de ${peerUrl}:`, error)
      }
    }

    // 5. Verificar si la cadena local es la más larga
    if (nodoCadenaMasLarga === "local") {
      return NextResponse.json(
        {
          mensaje: "La cadena local ya es la más larga",
          reemplazada: false,
        },
        { status: 200 }
      )
    }

    // 6. Reemplazar cadena local si encontramos una más larga
    // Eliminar todos los registros de la tabla grados
    const { error: deleteError } = await supabase.from("grados").delete().neq("id", "")

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    // Insertar bloques de la cadena ganadora
    const { error: insertError } = await supabase
      .from("grados")
      .insert(cadenaMasLarga)

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        mensaje: "Cadena reemplazada por una más larga",
        reemplazada: true,
        bloques: cadenaMasLarga.length,
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
