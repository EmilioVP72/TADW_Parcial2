import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { propagarANodos } from "@/lib/blockchain"
import type { GradoBloque } from "@/lib/blockchain"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      persona_id,
      institucion_id,
      programa_id,
      fecha_inicio,
      fecha_fin,
      titulo_obtenido,
      numero_cedula,
      titulo_tesis,
      menciones,
      firmado_por,
    } = body

    // Validar campos requeridos
    if (
      !persona_id ||
      !institucion_id ||
      !programa_id ||
      !fecha_inicio ||
      !fecha_fin ||
      !titulo_obtenido ||
      !numero_cedula ||
      !titulo_tesis
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Insertar en la tabla grados
    const { data, error } = await supabase
      .from("grados")
      .insert({
        persona_id,
        institucion_id,
        programa_id,
        fecha_inicio,
        fecha_fin,
        titulo_obtenido,
        numero_cedula,
        titulo_tesis,
        menciones: menciones || null,
        hash_actual: "",
        hash_anterior: null,
        nonce: 0,
        firmado_por: firmado_por || null,
      })
      .select()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const insertedGrado: GradoBloque = data?.[0]

    // Propagar a otros nodos
    await propagarANodos("/api/transactions", body)

    return NextResponse.json(insertedGrado, { status: 201 })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
