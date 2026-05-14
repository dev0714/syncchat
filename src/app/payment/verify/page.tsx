import { confirmPayment } from '@/app/actions/payment'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle } from 'lucide-react'

export default async function PaymentVerifyPage({
  searchParams,
}: {
  searchParams: { reference?: string; trxref?: string }
}) {
  const reference = searchParams.reference ?? searchParams.trxref
  if (!reference) redirect('/dashboard/billing')

  try {
    const payment = await confirmPayment(reference)

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="card p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Payment successful!</h1>
          <p className="text-slate-500">
            Your SyncChat <span className="font-semibold capitalize">{payment.plan}</span> plan is now active.
            R{(payment.amount / 100).toLocaleString()} charged to {payment.email}.
          </p>
          <Link href="/dashboard/billing" className="btn-primary block py-3 text-center">
            Go to billing →
          </Link>
        </div>
      </div>
    )
  } catch (e) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="card p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Payment failed</h1>
          <p className="text-slate-500">{(e as Error).message}</p>
          <Link href="/dashboard/billing" className="btn-primary block py-3 text-center">
            Back to billing
          </Link>
        </div>
      </div>
    )
  }
}
