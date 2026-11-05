require "rails_helper"

RSpec.describe Employee do
  it "requires first name, last name, job title and hire date" do
    employee = Employee.new(country: create_country, department: create_department, email: "x@acme.example")
    expect(employee).not_to be_valid
    expect(employee.errors.attribute_names).to include(:first_name, :last_name, :job_title, :hired_on)
  end

  it "rejects duplicate email ignoring case" do
    create_employee(email: "A@x.com")
    duplicate = Employee.new(create_employee(email: "unique@x.com").attributes.except("id").merge("email" => "a@x.com"))
    expect(duplicate).not_to be_valid
    expect(duplicate.errors[:email]).to include("has already been taken")
  end

  it "rejects changing country" do
    employee = create_employee
    other = create_country(code: "IN", name: "India", currency_code: "INR", usd_rate: 0.012)
    employee.country = other
    expect(employee).not_to be_valid
    expect(employee.errors[:country_id]).to include("cannot be changed")
  end

  it "exposes a full name" do
    expect(create_employee(first_name: "Grace", last_name: "Hopper").full_name).to eq("Grace Hopper")
  end
end
