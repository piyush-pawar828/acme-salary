require "rails_helper"

RSpec.describe "GET /api/meta" do
  it "returns the server's current date so the UI and the API agree on 'today'" do
    sign_in(create_user)
    travel_to Time.utc(2026, 11, 5, 23, 30) do
      get "/api/meta"
      expect(response.parsed_body["today"]).to eq("2026-11-05")
    end
  end

  it "returns countries and departments" do
    sign_in(create_user)
    country = create_country
    department = create_department

    get "/api/meta"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.except("today")).to eq(
      "countries" => [ { "id" => country.id, "code" => "US", "name" => "United States", "currency_code" => "USD",
                        "usd_rate" => "1.0", "rate_as_of" => "2026-11-01" } ],
      "departments" => [ { "id" => department.id, "name" => "Engineering" } ]
    )
  end
end
