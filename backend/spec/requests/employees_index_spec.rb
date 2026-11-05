require "rails_helper"

RSpec.describe "GET /api/employees" do
  it "requires login" do
    get "/api/employees"
    expect(response).to have_http_status(:unauthorized)
  end

  it "never 500s on absurd pagination input" do
    sign_in(create_user)
    create_employee

    get "/api/employees", params: { page: "99999999999999999999999", per_page: "-5" }

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["data"]).to eq([])
    expect(response.parsed_body["meta"]).to include("per_page" => 25, "total" => 1)
  end

  it "returns paginated summaries with meta" do
    sign_in(create_user)
    india = create_country(code: "IN", name: "India", currency_code: "INR", usd_rate: 0.012)
    employee = create_employee(first_name: "Ada", last_name: "Lovelace", country: india, hired_on: Date.new(2020, 1, 15))
    salary = create_salary(employee: employee, amount: 8_000_000, effective_on: Date.new(2026, 1, 1))
    employee.update_column(:current_salary_id, salary.id)

    get "/api/employees", params: { per_page: 10 }

    expect(response).to have_http_status(:ok)
    body = response.parsed_body
    expect(body["meta"]).to eq("page" => 1, "per_page" => 10, "total" => 1, "total_pages" => 1)
    expect(body["data"].size).to eq(1)
    expect(body["data"].first).to include(
      "id" => employee.id,
      "full_name" => "Ada Lovelace",
      "country" => { "code" => "IN", "name" => "India", "currency_code" => "INR" },
      "department" => { "id" => employee.department_id, "name" => "Engineering" },
      "job_title" => "Software Engineer",
      "hired_on" => "2020-01-15",
      "salary" => { "amount" => "8000000.0", "currency_code" => "INR", "effective_on" => "2026-01-01", "usd" => "96000.0" }
    )
  end
end
