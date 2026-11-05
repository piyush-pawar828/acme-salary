module Analytics
  # Whole-organisation pay summary in USD. One SQL round-trip.
  class Overview
    def self.call
      rows = Base.scope.pluck(Base.usd_sql, :country_id, :department_id)
      stats = Stats.summarize(rows.map(&:first))

      {
        headcount: stats[:count],
        total_payroll_usd: stats[:total],
        mean_usd: stats[:mean],
        median_usd: stats[:median],
        min_usd: stats[:min],
        max_usd: stats[:max],
        countries: rows.map { |r| r[1] }.uniq.size,
        departments: rows.map { |r| r[2] }.uniq.size
      }
    end
  end
end
