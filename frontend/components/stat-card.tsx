interface StatCardProps {
  title: string
  value: string
  change?: string
  changeType?: "positive" | "negative"
}

export function StatCard({ title, value, change, changeType = "positive" }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-white dark:bg-card-dark p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <p className="text-gray-500 dark:text-gray-400 text-base font-medium leading-normal">{title}</p>
      <p className="text-gray-900 dark:text-white tracking-light text-3xl font-bold leading-tight">{value}</p>
      {change && (
        <p
          className={`text-sm font-medium leading-normal ${
            changeType === "positive" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {change}
        </p>
      )}
    </div>
  )
}
