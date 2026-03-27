'use client'

import { useState, useEffect } from 'react'
import type { GradoBloque } from '@/lib/blockchain'

interface TransactionResponse {
  id: string
  [key: string]: unknown
}

export default function Home() {
  const [bloques, setBloques] = useState<GradoBloque[]>([])
  const [loadingMine, setLoadingMine] = useState(false)
  const [loadingResolve, setLoadingResolve] = useState(false)
  const [loadingChain, setLoadingChain] = useState(false)
  const [loadingTransaction, setLoadingTransaction] = useState(false)
  const [mineMessage, setMineMessage] = useState('')
  const [resolveMessage, setResolveMessage] = useState('')
  const [transactionMessage, setTransactionMessage] = useState('')
  const [formData, setFormData] = useState({
    nombre: '',
    apellido_paterno: '',
    institucion_nombre: '',
    titulo_obtenido: '',
  })

  // Cargar cadena al montar el componente
  useEffect(() => {
    fetchChain()
  }, [])

  const fetchChain = async () => {
    setLoadingChain(true)
    try {
      const response = await fetch('/api/chain')
      if (response.ok) {
        const data = await response.json()
        setBloques(data)
      }
    } catch (error) {
      console.error('Error al cargar cadena:', error)
    } finally {
      setLoadingChain(false)
    }
  }

  const handleMine = async () => {
    setLoadingMine(true)
    setMineMessage('')
    try {
      const response = await fetch('/api/mine', {
        method: 'POST',
      })
      const data = await response.json()
      if (response.ok) {
        setMineMessage(`✓ ${data.mensaje} (${data.bloques_minados} bloque(s))`)
        await fetchChain()
      } else {
        setMineMessage(`✗ ${data.error}`)
      }
    } catch (error) {
      setMineMessage(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoadingMine(false)
    }
  }

  const handleResolveConsensus = async () => {
    setLoadingResolve(true)
    setResolveMessage('')
    try {
      const response = await fetch('/api/nodes/resolve')
      const data = await response.json()
      if (response.ok) {
        setResolveMessage(`✓ ${data.mensaje}`)
        if (data.reemplazada) {
          await fetchChain()
        }
      } else {
        setResolveMessage(`✗ ${data.error}`)
      }
    } catch (error) {
      setResolveMessage(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoadingResolve(false)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingTransaction(true)
    setTransactionMessage('')
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data: TransactionResponse = await response.json()
      if (response.ok) {
        setTransactionMessage('✓ Transacción creada exitosamente')
        setFormData({ nombre: '', apellido_paterno: '', institucion_nombre: '', titulo_obtenido: '' })
        await fetchChain()
      } else {
        setTransactionMessage(`✗ ${(data as Record<string, unknown>).error || 'Error desconocido'}`)
      }
    } catch (error) {
      setTransactionMessage(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoadingTransaction(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Sección 1: Estado y acciones */}
        <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h1 className="text-3xl font-bold text-white mb-6">Nodo Next.js — Puerto 8012</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleMine}
              disabled={loadingMine}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loadingMine && <span className="animate-spin">⚙️</span>}
              Minar bloque
            </button>
            
            <button
              onClick={handleResolveConsensus}
              disabled={loadingResolve}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loadingResolve && <span className="animate-spin">⚙️</span>}
              Resolver consenso
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {mineMessage && (
              <p className={`text-sm py-2 px-3 rounded ${mineMessage.startsWith('✓') ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
                {mineMessage}
              </p>
            )}
            {resolveMessage && (
              <p className={`text-sm py-2 px-3 rounded ${resolveMessage.startsWith('✓') ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
                {resolveMessage}
              </p>
            )}
          </div>
        </section>

        {/* Sección 2: Cadena de bloques */}
        <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Cadena de bloques</h2>
            <button
              onClick={fetchChain}
              disabled={loadingChain}
              className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {loadingChain ? 'Actualizando...' : 'Actualizar cadena'}
            </button>
          </div>

          {bloques.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No hay bloques minados aún</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {bloques.map((bloque, index) => (
                <div key={bloque.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                  <p className="text-sm text-slate-400 mb-2">Bloque #{index}</p>
                  <p className="text-white font-semibold mb-2 break-words">{bloque.titulo_obtenido}</p>
                  <div className="space-y-1 text-xs text-slate-300">
                    <p><span className="text-slate-400">Hash:</span> <code className="bg-slate-800 px-2 py-1 rounded">{bloque.hash_actual.substring(0, 20)}...</code></p>
                    <p><span className="text-slate-400">Hash anterior:</span> <code className="bg-slate-800 px-2 py-1 rounded">{bloque.hash_anterior ? bloque.hash_anterior.substring(0, 20) : '0'}...</code></p>
                    <p><span className="text-slate-400">Nonce:</span> {bloque.nonce}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sección 3: Nueva transacción */}
        <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">Nueva transacción</h2>
          
          <form onSubmit={handleSubmitTransaction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="nombre"
                placeholder="Nombre"
                value={formData.nombre}
                onChange={handleFormChange}
                required
                className="bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                name="apellido_paterno"
                placeholder="Apellido paterno"
                value={formData.apellido_paterno}
                onChange={handleFormChange}
                required
                className="bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                name="institucion_nombre"
                placeholder="Institución"
                value={formData.institucion_nombre}
                onChange={handleFormChange}
                required
                className="bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                name="titulo_obtenido"
                placeholder="Título obtenido"
                value={formData.titulo_obtenido}
                onChange={handleFormChange}
                required
                className="bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <button
              type="submit"
              disabled={loadingTransaction}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loadingTransaction && <span className="animate-spin">⚙️</span>}
              Enviar transacción
            </button>
          </form>

          {transactionMessage && (
            <p className={`mt-4 text-sm py-2 px-3 rounded ${transactionMessage.startsWith('✓') ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
              {transactionMessage}
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
