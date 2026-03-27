import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { proofOfWork, propagarANodos } from "@/lib/blockchain"
import type { GradoBloque } from "@/lib/blockchain"

export async function POST(req: Request) {
  try {
    // 1. Consultar transacciones pendientes (hash_actual vacío)
    const { data: pendingData, error: pendingError } = await supabase
      .from("grados")
      .select("*")
      .eq("hash_actual", "")
      .order("creado_en", { ascending: true })

    if (pendingError) {
      return NextResponse.json(
        { error: pendingError.message },
        { status: 500 }
      )
    }

    const transaccionesPendientes: GradoBloque[] = pendingData || []

    // 2. Si no hay transacciones pendientes
    if (transaccionesPendientes.length === 0) {
      return NextResponse.json(
        { error: "No hay transacciones pendientes para minar" },
        { status: 400 }
      )
    }

    // 3. Consultar el último bloque minado (hash_actual no vacío)
    const { data: lastBlockData, error: lastBlockError } = await supabase
      .from("grados")
      .select("*")
      .neq("hash_actual", "")
      .order("creado_en", { ascending: false })
      .limit(1)

    if (lastBlockError) {
      return NextResponse.json(
        { error: lastBlockError.message },
        { status: 500 }
      )
    }

    const lastBlock = lastBlockData?.[0]
    let hashAnterior: string = lastBlock ? lastBlock.hash_actual : "0"

    // 4. Minar cada transacción pendiente
    let bloquesMInados = 0
    for (const transaccion of transaccionesPendientes) {
      const { nonce, hash } = proofOfWork(
        transaccion.persona_id,
        transaccion.institucion_id,
        transaccion.titulo_obtenido,
        transaccion.fecha_fin,
        hashAnterior
      )

      const { error: updateError } = await supabase
        .from("grados")
        .update({
          hash_actual: hash,
          hash_anterior: hashAnterior,
          nonce,
        })
        .eq("id", transaccion.id)

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        )
      }

      hashAnterior = hash
      bloquesMInados++
    }

    // 5. Propagar a otros nodos
    await propagarANodos("/api/mine", {})

    // 6. Retornar resultado
    return NextResponse.json(
      {
        mensaje: "Bloque minado exitosamente",
        bloques_minados: bloquesMInados,
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
