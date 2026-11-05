require "rails_helper"
require Rails.root.join("db/seeds/reference_data")

RSpec.describe SeedData do
  describe ".salary_for" do
    it "is deterministic for a given rng seed" do
      first = SeedData.salary_for(usd_band: 95_000, country_code: "IN", rng: Random.new(1))
      second = SeedData.salary_for(usd_band: 95_000, country_code: "IN", rng: Random.new(1))
      expect(first).to eq(second)
      expect(first).to be_a(BigDecimal)
    end

    it "pays a higher band more within a country" do
      rng = Random.new(7)
      junior = SeedData.salary_for(usd_band: 60_000, country_code: "IN", rng: rng)
      senior = SeedData.salary_for(usd_band: 135_000, country_code: "IN", rng: rng)
      expect(senior).to be > junior
    end

    it "pays the same band more in the US than in India after conversion" do
      rng = Random.new(7)
      us = SeedData.salary_for(usd_band: 135_000, country_code: "US", rng: rng) * SeedData.usd_rate("US")
      india = SeedData.salary_for(usd_band: 135_000, country_code: "IN", rng: rng) * SeedData.usd_rate("IN")
      expect(us).to be > india
    end

    it "has two decimal places" do
      amount = SeedData.salary_for(usd_band: 95_000, country_code: "GB", rng: Random.new(3))
      expect(amount).to eq(amount.round(2))
    end
  end

  it "defines 8 countries and 10 departments with titles" do
    expect(SeedData::COUNTRIES.size).to eq(8)
    expect(SeedData::DEPARTMENTS.size).to eq(10)
    SeedData::DEPARTMENTS.each_value { |titles| expect(titles).not_to be_empty }
  end
end
