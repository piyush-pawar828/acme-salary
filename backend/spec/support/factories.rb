# Plain-Ruby factories. Each helper creates a valid record with sensible
# defaults and lets the caller override any attribute.
module Factories
  def create_user(**attrs)
    defaults = { name: "HR Manager", email: "hr@acme.example", password: "password123" }
    User.create!(defaults.merge(attrs))
  end

  # The one user most specs need; created once per example.
  def hr_user
    @hr_user ||= User.find_by(email: "hr@acme.example") || create_user
  end

  def create_country(**attrs)
    defaults = { code: "US", name: "United States", currency_code: "USD", usd_rate: 1.0, rate_as_of: Date.new(2026, 11, 1) }
    Country.find_by(code: attrs[:code] || defaults[:code]) || Country.create!(defaults.merge(attrs))
  end

  def create_department(**attrs)
    defaults = { name: "Engineering" }
    Department.find_by(name: attrs[:name] || defaults[:name]) || Department.create!(defaults.merge(attrs))
  end

  def create_employee(**attrs)
    @employee_sequence = (@employee_sequence || 0) + 1
    defaults = {
      first_name: "Ada",
      last_name: "Lovelace",
      email: "employee#{@employee_sequence}@acme.example",
      country: attrs[:country] || create_country,
      department: attrs[:department] || create_department,
      job_title: "Software Engineer",
      hired_on: Date.new(2020, 1, 15)
    }
    Employee.create!(defaults.merge(attrs))
  end

  def create_salary(employee:, **attrs)
    defaults = {
      amount: 100_000,
      currency_code: employee.country.currency_code,
      effective_on: Date.new(2026, 1, 1),
      created_by: attrs[:created_by] || hr_user
    }
    Salary.create!(defaults.merge(employee: employee).merge(attrs))
  end
end

RSpec.configure do |config|
  config.include Factories
end
