module Analytics
  # Shared scope: every employee with a current salary, joined to the
  # country so amounts can be converted to USD inside SQL.
  module Base
    USD_EXPRESSION = "salaries.amount * countries.usd_rate".freeze

    def self.scope
      Employee.joins(:country, :current_salary)
    end

    def self.usd_sql
      Arel.sql(USD_EXPRESSION)
    end
  end
end
