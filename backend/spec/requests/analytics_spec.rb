require "rails_helper"

RSpec.describe "Analytics endpoints" do
  let(:user) { create_user }

  before do
    sign_in(user)
    employee = create_employee
    SalaryChange.call(employee: employee, amount: 100_000, effective_on: Date.new(2026, 1, 1), by: user)
  end

  it "serves the overview" do
    get "/api/analytics/overview"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include("headcount" => 1, "total_payroll_usd" => "100000.0")
  end

  it "serves group stats" do
    get "/api/analytics/groups", params: { by: "country" }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.first).to include("key" => "US", "headcount" => 1)
  end

  it "returns 400 for an unknown dimension" do
    get "/api/analytics/groups", params: { by: "email" }
    expect(response).to have_http_status(:bad_request)
  end

  it "serves extremes" do
    get "/api/analytics/extremes"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["top"].size).to eq(1)
    expect(response.parsed_body["bottom"].size).to eq(1)
  end

  it "requires login" do
    delete "/api/session"
    get "/api/analytics/overview"
    expect(response).to have_http_status(:unauthorized)
  end
end
