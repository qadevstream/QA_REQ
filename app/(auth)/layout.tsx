export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#08111F] text-white antialiased selection:bg-[#2563EB]/30">
      {children}
    </div>
  )
}
