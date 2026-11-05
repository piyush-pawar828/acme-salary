require "rails_helper"

RSpec.describe Salary do
  around { |example| travel_to(Date.new(2026, 11, 5)) { example.run } }

  it "rejects a future effective_on" do
    salary = Salary.new(employee: create_employee, amount: 100, currency_code: "USD",
                        effective_on: Date.new(2026, 11, 6), created_by: hr_user)
    expect(salary).not_to be_valid
    expect(salary.errors[:effective_on]).to include("cannot be in the future")
  end

  it "accepts today as effective_on" do
    salary = Salary.new(employee: create_employee, amount: 100, currency_code: "USD",
                        effective_on: Date.new(2026, 11, 5), created_by: hr_user)
    expect(salary).to be_valid
  end

  it "rejects zero and negative amounts" do
    [ 0, -1 ].each do |amount|
      salary = Salary.new(employee: create_employee, amount: amount, currency_code: "USD",
                          effective_on: Date.new(2026, 1, 1), created_by: hr_user)
      expect(salary).not_to be_valid
      expect(salary.errors[:amount]).to include("must be greater than 0")
    end
  end
end
