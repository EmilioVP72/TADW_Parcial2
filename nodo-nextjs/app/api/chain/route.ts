import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import type { GradoBloque } from "@/lib/blockchain"

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("grados")
      .select("*")
      .order("creado_en", { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const grados: GradoBloque[] = data || []

    return NextResponse.json(grados, { status: 200 })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
