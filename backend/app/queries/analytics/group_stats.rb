module Analytics
  # Pay summary per country or per department, in USD, sorted by total
  # payroll descending. One SQL round-trip; groups with no employees are
  # naturally absent.
  class GroupStats
    DIMENSIONS = {
      "country" => { join: :country, key: "countries.code", label: "countries.name" },
      "department" => { join: :department, key: "departments.id", label: "departments.name" }
    }.freeze

    def self.call(by:)
      dimension = DIMENSIONS[by.to_s] or raise ArgumentError, "unknown dimension: #{by.inspect}"

      rows = Base.scope.joins(dimension[:join])
                 .pluck(Arel.sql(dimension[:key]), Arel.sql(dimension[:label]), Base.usd_sql)

      rows.group_by { |key, label, _| [key, label] }
          .map { |(key, label), group| row(key, label, Stats.summarize(group.map(&:last))) }
          .sort_by { |g| -g[:total_usd] }
    end

    def self.row(key, label, stats)
      {
        key: key,
        label: label,
        headcount: stats[:count],
        total_usd: stats[:total],
        mean_usd: stats[:mean],
        median_usd: stats[:median],
        min_usd: stats[:min],
        max_usd: stats[:max]
      }
    end
    private_class_method :row
  end
end
