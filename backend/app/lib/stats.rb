# Descriptive statistics over a plain array of numbers.
# Kept free of ActiveRecord so it is trivially unit-testable and so the
# analytics queries can fetch once and reduce here.
module Stats
  EMPTY = { count: 0, total: 0, mean: nil, median: nil, min: nil, max: nil }.freeze

  def self.summarize(values)
    return EMPTY.dup if values.empty?

    sorted = values.map { |v| BigDecimal(v.to_s) }.sort
    count = sorted.size
    total = sorted.sum

    {
      count: count,
      total: round(total),
      mean: round(total / count),
      median: round(median_of(sorted)),
      min: round(sorted.first),
      max: round(sorted.last)
    }
  end

  def self.median_of(sorted)
    mid = sorted.size / 2
    sorted.size.odd? ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  end
  private_class_method :median_of

  def self.round(value)
    value.round(2)
  end
  private_class_method :round
end
