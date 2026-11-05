require "rails_helper"

RSpec.describe SalaryChange do
  around { |example| travel_to(Date.new(2026, 11, 5)) { example.run } }

  let(:india) { create_country(code: "IN", name: "India", currency_code: "INR", usd_rate: 0.012) }
  let(:employee) { create_employee(country: india) }

  it "appends a row and makes it current" do
    salary = SalaryChange.call(employee: employee, amount: 1_000_000, effective_on: Date.new(2026, 10, 1), by: hr_user)

    expect(employee.reload.current_salary).to eq(salary)
    expect(employee.salaries.count).to eq(1)
  end

  it "copies currency from the employee's country" do
    salary = SalaryChange.call(employee: employee, amount: 1_000_000, effective_on: Date.new(2026, 10, 1), by: hr_user)
    expect(salary.currency_code).to eq("INR")
  end

  it "keeps the newer row current when backdating" do
    newer = SalaryChange.call(employee: employee, amount: 1_200_000, effective_on: Date.new(2026, 10, 1), by: hr_user)
    SalaryChange.call(employee: employee, amount: 1_000_000, effective_on: Date.new(2026, 6, 1), by: hr_user)

    expect(employee.reload.current_salary).to eq(newer)
    expect(employee.salaries.count).to eq(2)
  end

  it "breaks same-day ties by id" do
    SalaryChange.call(employee: employee, amount: 1_000_000, effective_on: Date.new(2026, 10, 1), by: hr_user)
    second = SalaryChange.call(employee: employee, amount: 1_100_000, effective_on: Date.new(2026, 10, 1), by: hr_user)

    expect(employee.reload.current_salary).to eq(second)
  end

  it "rejects a future effective_on without inserting" do
    expect {
      SalaryChange.call(employee: employee, amount: 1_000_000, effective_on: Date.new(2026, 11, 6), by: hr_user)
    }.to raise_error(ActiveRecord::RecordInvalid)
    expect(employee.salaries.count).to eq(0)
  end

  it "records who made the change and the note" do
    salary = SalaryChange.call(employee: employee, amount: 1_000_000, effective_on: Date.new(2026, 10, 1), note: "Annual review", by: hr_user)
    expect(salary.created_by).to eq(hr_user)
    expect(salary.note).to eq("Annual review")
  end
end
