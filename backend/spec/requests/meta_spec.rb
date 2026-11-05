require "rails_helper"

RSpec.describe "GET /api/meta" do
  it "returns countries and departments" do
    sign_in(create_user)
    country = create_country
    department = create_department

    get "/api/meta"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq(
      "countries" => [ { "id" => country.id, "code" => "US", "name" => "United States", "currency_code" => "USD",
                        "usd_rate" => "1.0", "rate_as_of" => "2026-11-01" } ],
      "departments" => [ { "id" => department.id, "name" => "Engineering" } ]
    )
  end
end
