require "rails_helper"

# Fixture: 5 employees, 2 countries, 2 departments, hand-checkable USD figures.
#   us1  US Engineering 100,000 USD → 100,000
#   us2  US Engineering  60,000 USD →  60,000
#   us3  US Sales        80,000 USD →  80,000
#   in1  IN Engineering 5,000,000 INR (rate 0.01) → 50,000
#   in2  IN Sales       3,000,000 INR            → 30,000
RSpec.describe "Analytics" do
  let(:user) { create_user }
  let(:us) { create_country }
  let(:india) { create_country(code: "IN", name: "India", currency_code: "INR", usd_rate: 0.01) }
  let(:engineering) { create_department }
  let(:sales) { create_department(name: "Sales") }

  def hire(name, country, department, amount)
    employee = create_employee(first_name: name, last_name: "X", country: country, department: department)
    SalaryChange.call(employee: employee, amount: amount, effective_on: Date.new(2026, 1, 1), by: user)
    employee
  end

  before do
    create_department(name: "Legal") # empty department, must not appear
    hire("us1", us, engineering, 100_000)
    hire("us2", us, engineering, 60_000)
    hire("us3", us, sales, 80_000)
    hire("in1", india, engineering, 5_000_000)
    hire("in2", india, sales, 3_000_000)
  end

  describe Analytics::Overview do
    it "converts to USD and summarizes the org" do
      result = Analytics::Overview.call
      expect(result).to eq(
        headcount: 5, total_payroll_usd: 320_000, mean_usd: 64_000, median_usd: 60_000,
        min_usd: 30_000, max_usd: 100_000, countries: 2, departments: 2
      )
    end

    it "runs one query" do
      expect(count_queries { Analytics::Overview.call }).to eq(1)
    end
  end

  describe Analytics::GroupStats do
    it "groups by country with per-group median, sorted by total desc" do
      result = Analytics::GroupStats.call(by: "country")
      expect(result.map { |g| g[:label] }).to eq([ "United States", "India" ])
      expect(result.first).to eq(key: "US", label: "United States", headcount: 3, total_usd: 240_000,
                                 mean_usd: 80_000, median_usd: 80_000, min_usd: 60_000, max_usd: 100_000)
      expect(result.last).to include(key: "IN", headcount: 2, median_usd: 40_000)
    end

    it "groups by department and omits empty departments" do
      result = Analytics::GroupStats.call(by: "department")
      expect(result.map { |g| g[:label] }).to eq([ "Engineering", "Sales" ])
      expect(result.first).to include(key: engineering.id, headcount: 3, total_usd: 210_000, median_usd: 60_000)
    end

    it "gives a single-member group median equal to mean" do
      Employee.where(first_name: %w[us2 us3 in1 in2]).find_each(&:destroy!)
      result = Analytics::GroupStats.call(by: "country")
      expect(result).to eq([ { key: "US", label: "United States", headcount: 1, total_usd: 100_000,
                              mean_usd: 100_000, median_usd: 100_000, min_usd: 100_000, max_usd: 100_000 } ])
    end

    it "rejects an unknown dimension" do
      expect { Analytics::GroupStats.call(by: "email") }.to raise_error(ArgumentError)
    end

    it "runs one query" do
      expect(count_queries { Analytics::GroupStats.call(by: "department") }).to eq(1)
    end
  end

  describe Analytics::Extremes do
    it "returns top and bottom by USD" do
      result = Analytics::Extremes.call(limit: 2)
      expect(result[:top].map { |e| e[:first_name] }).to eq(%w[us1 us3])
      expect(result[:bottom].map { |e| e[:first_name] }).to eq(%w[in2 in1])
      expect(result[:top].first[:salary][:usd]).to eq(100_000)
    end
  end
end
