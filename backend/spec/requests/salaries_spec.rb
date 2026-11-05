require "rails_helper"

RSpec.describe "POST /api/employees/:id/salaries" do
  around { |example| travel_to(Date.new(2026, 11, 5)) { example.run } }

  let(:user) { create_user }
  let(:employee) { create_employee }

  before do
    sign_in(user)
    SalaryChange.call(employee: employee, amount: 100_000, effective_on: Date.new(2025, 1, 1), by: user)
  end

  it "adds a salary and repoints current" do
    post "/api/employees/#{employee.id}/salaries", params: { salary: { amount: "110000", effective_on: "2026-01-01", note: "Raise" } }, as: :json

    expect(response).to have_http_status(:created)
    expect(response.parsed_body["salary"]["amount"]).to eq("110000.0")
    expect(response.parsed_body["salary_history"].size).to eq(2)
    expect(employee.reload.current_salary.amount).to eq(110_000)
  end

  it "rejects a future salary with 422" do
    post "/api/employees/#{employee.id}/salaries", params: { salary: { amount: "110000", effective_on: "2026-11-06" } }, as: :json

    expect(response).to have_http_status(:unprocessable_entity)
    expect(response.parsed_body["errors"]["effective_on"]).to include("cannot be in the future")
    expect(employee.salaries.count).to eq(1)
  end

  it "requires login" do
    delete "/api/session"
    post "/api/employees/#{employee.id}/salaries", params: { salary: { amount: "1", effective_on: "2026-01-01" } }, as: :json
    expect(response).to have_http_status(:unauthorized)
  end
end
