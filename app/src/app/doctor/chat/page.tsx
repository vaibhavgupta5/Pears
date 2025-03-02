'use client'
import { useRouter } from 'next/navigation'
import React from 'react'

function Page() {
  const router = useRouter();

  React.useEffect(() => {
    router.push('http://localhost:3000')
  }, [router])

  return (
    <div>page</div>
  )
}

export default Page