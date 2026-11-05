require "rails_helper"

RSpec.describe EmployeeCreate do
  around { |example| travel_to(Date.new(2026, 11, 5)) { example.run } }

  let(:attrs) do
    { first_name: "Grace", last_name: "Hopper", email: "grace@acme.example",
      country_id: create_country.id, department_id: create_department.id,
      job_title: "Engineer", hired_on: Date.new(2024, 3, 1) }
  end

  it "creates the employee with a current salary" do
    employee = EmployeeCreate.call(attrs: attrs, salary: { amount: 50_000, effective_on: Date.new(2024, 3, 1) }, by: hr_user)

    expect(employee).to be_persisted
    expect(employee.current_salary.amount).to eq(50_000)
    expect(employee.salaries.count).to eq(1)
  end

  it "rolls back the employee when the salary is invalid" do
    expect {
      EmployeeCreate.call(attrs: attrs, salary: { amount: 0, effective_on: Date.new(2024, 3, 1) }, by: hr_user)
    }.to raise_error(ActiveRecord::RecordInvalid) { |error|
      expect(error.record.errors["salary.amount"]).to include("must be greater than 0")
    }
    expect(Employee.count).to eq(0)
  end

  it "surfaces employee validation errors" do
    expect {
      EmployeeCreate.call(attrs: attrs.merge(email: "not-an-email"), salary: { amount: 50_000, effective_on: Date.new(2024, 3, 1) }, by: hr_user)
    }.to raise_error(ActiveRecord::RecordInvalid) { |error|
      expect(error.record.errors[:email]).to include("is invalid")
    }
  end
end
