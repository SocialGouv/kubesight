import { main } from "@/lib/kube"

export default async function Home() {
  const { namespaces } = await main()

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <p>Hello World!</p>
      <ul>
        {namespaces.map((ns) => (
          <li key={ns.name}>{ns.name}</li>
        ))}
      </ul>
    </main>
  )
}
