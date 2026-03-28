import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { propagarANodos } from "@/lib/blockchain"
import type { GradoBloque } from "@/lib/blockchain"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      nombre,
      apellido_paterno,
      institucion_nombre,
      titulo_obtenido,
    } = body

    // Validar campos requeridos
    if (!nombre || !apellido_paterno || !institucion_nombre || !titulo_obtenido) {
      return NextResponse.json(
        { error: "Missing required fields: nombre, apellido_paterno, institucion_nombre, titulo_obtenido" },
        { status: 400 }
      )
    }

    // 1. Insertar persona y obtener UUID
    const { data: personaData, error: personaError } = await supabase
      .from("personas")
      .insert({
        nombre,
        apellido_paterno,
      })
      .select("id")

    if (personaError) {
      return NextResponse.json(
        { error: `Error inserting persona: ${personaError.message}` },
        { status: 500 }
      )
    }

    const personaId = personaData?.[0]?.id
    if (!personaId) {
      return NextResponse.json(
        { error: "Failed to get persona ID" },
        { status: 500 }
      )
    }

    // 2. Insertar institución y obtener UUID
    const { data: institucionData, error: institucionError } = await supabase
      .from("instituciones")
      .insert({
        nombre: institucion_nombre,
      })
      .select("id")

    if (institucionError) {
      return NextResponse.json(
        { error: `Error inserting institucion: ${institucionError.message}` },
        { status: 500 }
      )
    }

    const institucionId = institucionData?.[0]?.id
    if (!institucionId) {
      return NextResponse.json(
        { error: "Failed to get institucion ID" },
        { status: 500 }
      )
    }

    // 3. Insertar en grados con los UUIDs obtenidos
    const { data: gradoData, error: gradoError } = await supabase
      .from("grados")
      .insert({
        persona_id: personaId,
        institucion_id: institucionId,
        titulo_obtenido,
        hash_actual: "",
        hash_anterior: null,
        nonce: 0,
      })
      .select()

    if (gradoError) {
      return NextResponse.json(
        { error: `Error inserting grado: ${gradoError.message}` },
        { status: 500 }
      )
    }

    const insertedGrado: GradoBloque = gradoData?.[0]
    if (!insertedGrado) {
      return NextResponse.json(
        { error: "Failed to get inserted grado" },
        { status: 500 }
      )
    }

    // 4. Propagar a otros nodos
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
