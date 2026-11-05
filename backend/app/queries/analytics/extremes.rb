module Analytics
  # Highest and lowest paid employees by USD-converted salary.
  class Extremes
    def self.call(limit: 10)
      {
        top: ordered("DESC", limit),
        bottom: ordered("ASC", limit)
      }
    end

    def self.ordered(direction, limit)
      Base.scope
          .includes(:country, :department, :current_salary)
          .order(Arel.sql("#{Base::USD_EXPRESSION} #{direction}, employees.id #{direction}"))
          .limit(limit)
          .map { |employee| EmployeeSerializer.summary(employee) }
    end
    private_class_method :ordered
  end
end
