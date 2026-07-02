'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/** Minutos de inactividad antes de cerrar sesión automáticamente. */
const TIMEOUT_MIN = 10
const TIMEOUT_MS = TIMEOUT_MIN * 60 * 1000

/**
 * Cierra la sesión automáticamente tras N minutos sin actividad del usuario
 * (movimiento de mouse, teclado, scroll o toque). También cierra la sesión
 * en esta pestaña si el usuario cerró sesión en otra (cross-tab).
 */
export function IdleLogout() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function logout() {
      try {
        await supabase.auth.signOut()
      } catch {
        // ignorar: igual redirigimos al login
      }
      window.location.href = '/login?motivo=inactividad'
    }

    function reset() {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(logout, TIMEOUT_MS)
    }

    // Throttle: no reiniciar el temporizador en cada micro-evento, solo
    // una vez por segundo como máximo.
    let last = 0
    function onActivity() {
      const now = Date.now()
      if (now - last > 1000) {
        last = now
        reset()
      }
    }

    const eventos = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    eventos.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))

    // Cross-tab: si cierran sesión en otra pestaña, salir también aquí.
    const { data: authSub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') window.location.href = '/login'
    })

    reset() // arrancar el conteo

    return () => {
      if (timer.current) clearTimeout(timer.current)
      eventos.forEach((e) => window.removeEventListener(e, onActivity))
      authSub.subscription.unsubscribe()
    }
  }, [])

  return null
}
