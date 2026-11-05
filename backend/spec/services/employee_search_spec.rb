require "rails_helper"

RSpec.describe EmployeeSearch do
  let(:us) { create_country }
  let(:india) { create_country(code: "IN", name: "India", currency_code: "INR", usd_rate: 0.012) }
  let(:engineering) { create_department }
  let(:sales) { create_department(name: "Sales") }

  def ids(params)
    EmployeeSearch.new(params).relation.map(&:id)
  end

  it "matches name and email case-insensitively" do
    ada = create_employee(first_name: "Ada", last_name: "Lovelace", email: "ada@acme.example")
    grace = create_employee(first_name: "Grace", last_name: "Hopper", email: "ghopper@acme.example")

    expect(ids(q: "lovel")).to eq([ ada.id ])
    expect(ids(q: "GHOPPER")).to eq([ grace.id ])
    expect(ids(q: "Ada Lovelace")).to eq([ ada.id ])
  end

  it "treats % and _ in q literally" do
    percent = create_employee(first_name: "50%", last_name: "Off")
    create_employee(first_name: "Plain", last_name: "Name")

    expect(ids(q: "%")).to eq([ percent.id ])
    expect(ids(q: "_")).to eq([])
  end

  it "filters by country and department together" do
    match = create_employee(country: india, department: sales)
    create_employee(country: india, department: engineering)
    create_employee(country: us, department: sales)

    expect(ids(country: "IN", department: sales.id)).to eq([ match.id ])
  end

  it "sorts by USD salary desc across currencies" do
    rich = create_employee(country: india)
    create_salary(employee: rich, amount: 8_000_000)
    rich.update_column(:current_salary_id, rich.salaries.first.id)
    poor = create_employee(country: us)
    create_salary(employee: poor, amount: 90_000)
    poor.update_column(:current_salary_id, poor.salaries.first.id)

    expect(ids(sort: "salary", dir: "desc")).to eq([ rich.id, poor.id ])
    expect(ids(sort: "salary", dir: "asc")).to eq([ poor.id, rich.id ])
  end

  it "sorts by name by default and by hire date on request" do
    older = create_employee(first_name: "Zed", last_name: "Young", hired_on: Date.new(2015, 1, 1))
    newer = create_employee(first_name: "Amy", last_name: "Old", hired_on: Date.new(2022, 1, 1))

    expect(ids({})).to eq([ newer.id, older.id ])
    expect(ids(sort: "hired_on", dir: "asc")).to eq([ older.id, newer.id ])
  end

  it "clamps page and per_page" do
    expect(EmployeeSearch.new(page: "0").page).to eq(1)
    expect(EmployeeSearch.new(page: "-3").page).to eq(1)
    expect(EmployeeSearch.new(per_page: "1000").per_page).to eq(100)
    expect(EmployeeSearch.new(per_page: "abc").per_page).to eq(25)
    expect(EmployeeSearch.new(per_page: "0").per_page).to eq(25)
  end

  it "paginates and reports the total" do
    3.times { create_employee }
    search = EmployeeSearch.new(per_page: "2", page: "2")

    expect(search.total).to eq(3)
    expect(search.relation.size).to eq(1)
  end
end
