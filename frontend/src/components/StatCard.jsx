function StatCard({ title, value, subtitle, icon }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">

      <div className="flex items-start justify-between">

        {/* Information */}
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <h3 className="text-3xl font-bold text-gray-800 mt-2">
            {value}
          </h3>

          <p className="text-sm text-gray-500 mt-2">
            {subtitle}
          </p>
        </div>

        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
          {icon}
        </div>

      </div>

    </div>
  );
}

export default StatCard;