/* src/utils/singleToast.ts */
import { toast } from 'sonner'
import type { JSX } from 'react'

export function singleToast(message: string | JSX.Element, options?: Parameters<typeof toast>[1]) {
  toast.dismiss()
  return toast(message, options)
}

export function singleToastSuccess(message: string | JSX.Element, options?: Parameters<typeof toast.success>[1]) {
  toast.dismiss()
  return toast.success(message, options)
}

export function singleToastError(message: string | JSX.Element, options?: Parameters<typeof toast.error>[1]) {
  toast.dismiss()
  return toast.error(message, options)
}
