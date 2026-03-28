import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { calcularHash } from "@/lib/blockchain"
import type { GradoBloque } from "@/lib/blockchain"

export async function POST(req: Request) {
  try {
    const blockData = await req.json() as GradoBloque

    // Consultar el último bloque minado
    const { data: lastBlockData } = await supabase
      .from("grados")
      .select("*")
      .neq("hash_actual", "")
      .order("creado_en", { ascending: false })
      .limit(1)

    const lastBlock = lastBlockData?.[0]
    const ultimoHash = lastBlock ? lastBlock.hash_actual : "0"

    if (blockData.hash_anterior !== ultimoHash) {
      return NextResponse.json(
        { error: "Bloque rechazado (hash anterior incorrecto)" },
        { status: 400 }
      )
    }

    if (!blockData.hash_actual.startsWith("000") && !blockData.hash_actual.startsWith("00")) {
      return NextResponse.json(
        { error: "Bloque rechazado (Proof of Work inválido)" },
        { status: 400 }
      )
    }

    const hashRecalculado = calcularHash(
      blockData.persona_id,
      blockData.institucion_id,
      blockData.titulo_obtenido,
      blockData.fecha_fin,
      blockData.hash_anterior || null,
      blockData.nonce
    )

    if (hashRecalculado !== blockData.hash_actual) {
      return NextResponse.json(
        { error: "Bloque rechazado (hash modificado)" },
        { status: 400 }
      )
    }

    // Insertar el bloque, podríamos resolver pendientes, pero como viene de peer simplemente insertamos.
    const { error: insertError } = await supabase.from("grados").insert(blockData)
    
    if (insertError) {
      return NextResponse.json(
        { error: `Error inserting grado: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "Bloque aceptado" }, { status: 201 })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
