import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import axios from 'axios'

export default function LoginPage() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, pass)
      nav('/', { replace: true })
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.data?.message) {
        setErr(e.response.data.message)
      } else {
        setErr('Falha no login')
      }
    }
  }

  return (
    <Card className="mx-auto mt-24 w-full max-w-sm">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input placeholder="senha" type="password" value={pass} onChange={(e) => setPass(e.target.value)} required />
          {err && <p className="text-destructive text-sm">{err}</p>}
          <Button type="submit">Login</Button>
        </form>
        <p className="mt-4 text-center text-sm">
          Não tem conta?{' '}
          <Link className="underline" to="/register">
            registre-se
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
