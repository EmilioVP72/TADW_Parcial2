import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { calcularHash } from "@/lib/blockchain"
import type { GradoBloque } from "@/lib/blockchain"

export async function POST(req: Request) {
  try {
    const blockData = await req.json() as GradoBloque

    // 1. Validar Proof of Work
    if (!blockData.hash_actual || (!blockData.hash_actual.startsWith("00"))) {
      return NextResponse.json(
        { error: "Bloque rechazado (Proof of Work inválido)" },
        { status: 400 }
      )
    }

    // 2. Recalcular el hash para verificar integridad
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

    // 3. Intentar actualizar si existe como pendiente (hash_actual = "")
    const { data: existing } = await supabase
      .from("grados")
      .select("id")
      .eq("persona_id", blockData.persona_id)
      .eq("titulo_obtenido", blockData.titulo_obtenido)
      .eq("hash_actual", "")
      .limit(1)

    if (existing && existing.length > 0) {
      // Actualizar el pendiente con los datos minados
      const { error: updateError } = await supabase
        .from("grados")
        .update({
          hash_actual: blockData.hash_actual,
          hash_anterior: blockData.hash_anterior,
          nonce: blockData.nonce,
        })
        .eq("id", existing[0].id)

      if (updateError) {
        return NextResponse.json(
          { error: `Error actualizando grado: ${updateError.message}` },
          { status: 500 }
        )
      }
    } else {
      // Insertar el bloque recibido directamente
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { is_broadcast: _, ...blockToInsert } = blockData as GradoBloque & { is_broadcast?: boolean }
      const { error: insertError } = await supabase.from("grados").insert(blockToInsert)

      if (insertError) {
        // Si ya existe (duplicate), ignorar silenciosamente
        if (insertError.code === "23505") {
          return NextResponse.json({ message: "Bloque ya existe" }, { status: 200 })
        }
        return NextResponse.json(
          { error: `Error insertando grado: ${insertError.message}` },
          { status: 500 }
        )
      }
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
