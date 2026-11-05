require "rails_helper"

RSpec.describe "GET /api/health" do
  it "returns ok" do
    get "/api/health"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq("status" => "ok")
  end
end
