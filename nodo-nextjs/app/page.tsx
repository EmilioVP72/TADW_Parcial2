'use client'

import { useState, useEffect } from 'react'
import type { GradoBloque } from '@/lib/blockchain'

interface TransactionResponse {
  id: string
  [key: string]: unknown
}

export default function Home() {
  const [bloques, setBloques] = useState<GradoBloque[]>([])
  const [transaccionesPendientes, setTransaccionesPendientes] = useState<GradoBloque[]>([])
  const [loadingMine, setLoadingMine] = useState(false)
  const [loadingResolve, setLoadingResolve] = useState(false)
  const [loadingChain, setLoadingChain] = useState(false)
  const [loadingTransaction, setLoadingTransaction] = useState(false)
  const [loadingPendingTransactions, setLoadingPendingTransactions] = useState(false)
  const [mineMessage, setMineMessage] = useState('')
  const [resolveMessage, setResolveMessage] = useState('')
  const [transactionMessage, setTransactionMessage] = useState('')
  const [formData, setFormData] = useState({
    nombre: '',
    apellido_paterno: '',
    institucion_nombre: '',
    titulo_obtenido: '',
  })

  useEffect(() => {
    fetchChain()
    fetchPendingTransactions()
  }, [])

  const fetchChain = async () => {
    setLoadingChain(true)
    try {
      const response = await fetch('/api/blockchain')
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

  const fetchPendingTransactions = async () => {
    setLoadingPendingTransactions(true)
    try {
      const response = await fetch('/api/transactions')
      if (response.ok) {
        const data = await response.json()
        setTransaccionesPendientes(data)
      }
    } catch (error) {
      console.error('Error al cargar transacciones pendientes:', error)
    } finally {
      setLoadingPendingTransactions(false)
    }
  }

  const handleMine = async () => {
    setLoadingMine(true)
    setMineMessage('')
    try {
      const response = await fetch('/api/blockchain/mine', {
        method: 'POST',
      })
      const data = await response.json()
      if (response.ok) {
        setMineMessage(`✓ ${data.mensaje} (${data.bloques_minados} bloque(s))`)
        await fetchChain()
        await fetchPendingTransactions()
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
      const response = await fetch('/api/blockchain/resolve')
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
        await fetchPendingTransactions()
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
    <main className="min-h-screen relative overflow-hidden bg-[#0A0F1C] text-slate-200 font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-[150px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-block p-1 px-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4 shadow-lg shadow-indigo-500/10">
            <span className="text-sm font-medium tracking-wide text-indigo-300">BLOCKCHAIN NODE 8012</span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 drop-shadow-sm">
            TADW Blockchain Explorer
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light">
            Interfaz distribuida peer-to-peer. Transacciona, mina bloques y resuelve el consenso de la cadena global.
          </p>
        </header>

        {/* Action Center - Control Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:bg-white/[0.04]">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-white">
              <span className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">⚡</span>
              Centro de Operaciones
            </h2>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleMine}
                disabled={loadingMine}
                className="group relative w-full overflow-hidden rounded-xl bg-indigo-600 px-6 py-4 text-white shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] transition-all hover:bg-indigo-500 hover:shadow-[0_0_60px_-15px_rgba(79,70,229,0.7)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="relative flex items-center justify-center gap-3 font-semibold text-lg tracking-wide">
                  {loadingMine ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <span className="text-xl">⛏️</span>
                  )}
                  MINAR BLOQUES PENDIENTES
                </div>
              </button>

              <button
                onClick={handleResolveConsensus}
                disabled={loadingResolve}
                className="group relative w-full overflow-hidden rounded-xl bg-slate-800 border border-slate-700 px-6 py-4 text-slate-200 transition-all hover:bg-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="relative flex items-center justify-center gap-3 font-medium text-lg tracking-wide">
                  {loadingResolve ? (
                    <span className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <span className="text-xl text-emerald-400">🔄</span>
                  )}
                  Sincronizar Red (Consenso)
                </div>
              </button>
            </div>

            {/* Notifications */}
            <div className="mt-6 flex flex-col gap-2">
              {mineMessage && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium border backdrop-blur-sm shadow-lg ${mineMessage.startsWith('✓') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
                  {mineMessage}
                </div>
              )}
              {resolveMessage && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium border backdrop-blur-sm shadow-lg ${resolveMessage.startsWith('✓') ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
                  {resolveMessage}
                </div>
              )}
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:bg-white/[0.04]">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-white">
              <span className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">➕</span>
              Registrar Título
            </h2>
            <form onSubmit={handleSubmitTransaction} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="nombre"
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChange={handleFormChange}
                  required
                  className="w-full bg-slate-900/50 border border-slate-700/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder-slate-500"
                />
                <input
                  type="text"
                  name="apellido_paterno"
                  placeholder="Ap. Paterno"
                  value={formData.apellido_paterno}
                  onChange={handleFormChange}
                  required
                  className="w-full bg-slate-900/50 border border-slate-700/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder-slate-500"
                />
              </div>
              <input
                type="text"
                name="institucion_nombre"
                placeholder="Institución Educativa"
                value={formData.institucion_nombre}
                onChange={handleFormChange}
                required
                className="w-full bg-slate-900/50 border border-slate-700/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder-slate-500"
              />
              <input
                type="text"
                name="titulo_obtenido"
                placeholder="Grado o Título Obtenido"
                value={formData.titulo_obtenido}
                onChange={handleFormChange}
                required
                className="w-full bg-slate-900/50 border border-slate-700/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={loadingTransaction}
                className="w-full bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingTransaction ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Enviar a Mempool'}
              </button>
            </form>
            {transactionMessage && (
              <p className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium border backdrop-blur-sm ${transactionMessage.startsWith('✓') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
                {transactionMessage}
              </p>
            )}
          </div>
        </div>

        {/* Ledger and Mempool Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEDGER */}
          <section className="backdrop-blur-xl bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></span>
                Ledger (Cadena Aprobada)
              </h2>
              <button onClick={fetchChain} className="text-slate-400 hover:text-white transition-colors">
                <span className={loadingChain ? 'animate-spin inline-block' : ''}>↻</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {bloques.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 font-light italic">
                  Bloque génesis pendiente...
                </div>
              ) : (
                bloques.map((bloque, idx) => (
                  <div key={bloque.id} className="relative pl-6">
                    {/* Linha conectora */}
                    {idx !== bloques.length - 1 && (
                      <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-indigo-500/30"></div>
                    )}
                    {/* Dot */}
                    <div className="absolute left-0 top-3 w-[24px] h-[24px] bg-[#0A0F1C] border-2 border-indigo-500 rounded-full z-10 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                    </div>
                    
                    <div className="bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-700/50 rounded-xl p-4 ml-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-indigo-300 font-semibold text-sm tracking-widest">BLOQUE #{idx}</span>
                        <span className="text-slate-500 text-xs">{new Date(bloque.creado_en).toLocaleTimeString()}</span>
                      </div>
                      <h3 className="text-lg text-white font-medium mb-3">{bloque.titulo_obtenido}</h3>
                      <div className="space-y-1.5 font-mono text-[11px]">
                        <div className="flex items-center bg-slate-900/80 rounded px-2 py-1.5">
                          <span className="text-slate-500 w-16">Hash:</span>
                          <span className="text-emerald-400 truncate ml-2">{bloque.hash_actual}</span>
                        </div>
                        <div className="flex items-center bg-slate-900/80 rounded px-2 py-1.5">
                          <span className="text-slate-500 w-16">Prev:</span>
                          <span className="text-amber-400/80 truncate ml-2">{bloque.hash_anterior || 'GENESIS'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-2 px-1">
                          <span className="text-slate-400">Nonce: <span className="text-blue-300">{bloque.nonce}</span></span>
                          <span className="text-slate-500 uppercase tracking-widest">POW ✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* MEMPOOL */}
          <section className="backdrop-blur-xl bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 animate-pulse"></span>
                Mempool (Pendientes)
              </h2>
              <button onClick={fetchPendingTransactions} className="text-slate-400 hover:text-white transition-colors">
                <span className={loadingPendingTransactions ? 'animate-spin inline-block' : ''}>↻</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {transaccionesPendientes.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 font-light italic">
                  No hay transacciones pendientes
                </div>
              ) : (
                transaccionesPendientes.map((tx) => (
                  <div key={tx.id} className="bg-slate-800/40 border-l-2 border-rose-500/50 rounded-r-xl p-4 hover:bg-slate-800/60 transition-colors">
                    <h3 className="text-white font-medium mb-2">{tx.titulo_obtenido}</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-slate-400">UUID: <span className="text-slate-300 font-mono">{tx.id.substring(0, 13)}...</span></div>
                      <div className="text-slate-400">Persona: <span className="text-slate-300 font-mono">{tx.persona_id.substring(0, 8)}...</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </div>
      
      {/* Scrollbar CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </main>
  )
}
