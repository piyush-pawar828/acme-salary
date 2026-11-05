require "rails_helper"

RSpec.describe "Employee CRUD" do
  around { |example| travel_to(Date.new(2026, 11, 5)) { example.run } }

  let(:user) { create_user }
  let(:us) { create_country }
  let(:engineering) { create_department }
  let(:valid_body) do
    {
      employee: { first_name: "Grace", last_name: "Hopper", email: "grace@acme.example", country_id: us.id,
                  department_id: engineering.id, job_title: "Engineer", hired_on: "2024-03-01" },
      salary: { amount: "50000", effective_on: "2024-03-01", note: "Starting salary" }
    }
  end

  before { sign_in(user) }

  describe "POST /api/employees" do
    it "creates an employee with initial salary" do
      post "/api/employees", params: valid_body, as: :json

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["full_name"]).to eq("Grace Hopper")
      expect(body["salary"]["amount"]).to eq("50000.0")
      expect(body["salary_history"].size).to eq(1)
      expect(body["salary_history"].first).to include("note" => "Starting salary", "created_by" => { "id" => user.id, "name" => "HR Manager" })
    end

    it "returns 422 for a duplicate email" do
      create_employee(email: "grace@acme.example")
      post "/api/employees", params: valid_body, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body["errors"]["email"]).to include("has already been taken")
    end

    it "returns 422 for an invalid salary without creating the employee" do
      post "/api/employees", params: valid_body.deep_merge(salary: { amount: "0" }), as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body["errors"]["salary.amount"]).to include("must be greater than 0")
      expect(Employee.count).to eq(0)
    end

    it "returns 400 when the employee payload is missing" do
      post "/api/employees", params: { salary: { amount: 1 } }, as: :json
      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "GET /api/employees/:id" do
    it "shows history newest first with usd" do
      india = create_country(code: "IN", name: "India", currency_code: "INR", usd_rate: 0.012)
      employee = create_employee(country: india)
      SalaryChange.call(employee: employee, amount: 1_000_000, effective_on: Date.new(2025, 1, 1), by: user)
      SalaryChange.call(employee: employee, amount: 1_200_000, effective_on: Date.new(2026, 1, 1), by: user)

      get "/api/employees/#{employee.id}"

      expect(response).to have_http_status(:ok)
      history = response.parsed_body["salary_history"]
      expect(history.map { |h| h["amount"] }).to eq([ "1200000.0", "1000000.0" ])
      expect(history.first["usd"]).to eq("14400.0")
    end

    it "returns 404 for an unknown id" do
      get "/api/employees/999999"
      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body).to eq("errors" => { "base" => [ "not found" ] })
    end
  end

  describe "PATCH /api/employees/:id" do
    it "updates profile fields" do
      employee = create_employee
      patch "/api/employees/#{employee.id}", params: { employee: { job_title: "Staff Engineer", last_name: "Lovelace-Byron" } }, as: :json

      expect(response).to have_http_status(:ok)
      expect(employee.reload.job_title).to eq("Staff Engineer")
      expect(response.parsed_body["full_name"]).to eq("Ada Lovelace-Byron")
    end

    it "rejects a country change with 422" do
      employee = create_employee
      india = create_country(code: "IN", name: "India", currency_code: "INR", usd_rate: 0.012)
      patch "/api/employees/#{employee.id}", params: { employee: { country_id: india.id } }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body["errors"]["country_id"]).to include("cannot be changed")
      expect(employee.reload.country).to eq(us)
    end
  end

  describe "DELETE /api/employees/:id" do
    it "deletes an employee and its salaries" do
      employee = create_employee
      SalaryChange.call(employee: employee, amount: 100, effective_on: Date.new(2026, 1, 1), by: user)

      delete "/api/employees/#{employee.id}"

      expect(response).to have_http_status(:no_content)
      expect(Employee.exists?(employee.id)).to be(false)
      expect(Salary.where(employee_id: employee.id).count).to eq(0)
    end
  end
end
