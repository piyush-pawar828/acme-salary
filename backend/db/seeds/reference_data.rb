# Reference data for the seed: countries with fixed exchange rates,
# departments with job titles and their USD pay bands, and the salary
# generator used to produce realistic, reproducible pay figures.
module SeedData
  RATE_AS_OF = Date.new(2026, 11, 1)

  # code, name, currency, USD per 1 unit of local currency (fixed as of RATE_AS_OF)
  COUNTRIES = [
    [ "US", "United States",  "USD", 1.0 ],
    [ "IN", "India",          "INR", 0.012 ],
    [ "GB", "United Kingdom", "GBP", 1.27 ],
    [ "DE", "Germany",        "EUR", 1.08 ],
    [ "CA", "Canada",         "CAD", 0.72 ],
    [ "AU", "Australia",      "AUD", 0.65 ],
    [ "SG", "Singapore",      "SGD", 0.74 ],
    [ "BR", "Brazil",         "BRL", 0.17 ]
  ].freeze

  # Share of headcount per country; sums to 1.0.
  COUNTRY_WEIGHTS = {
    "US" => 0.30, "IN" => 0.25, "GB" => 0.12, "DE" => 0.10,
    "CA" => 0.08, "AU" => 0.06, "SG" => 0.05, "BR" => 0.04
  }.freeze

  # Local cost-of-labour multiplier applied to the USD band before conversion.
  COST_MULTIPLIER = {
    "US" => 1.0, "GB" => 0.85, "DE" => 0.8, "CA" => 0.8,
    "AU" => 0.85, "SG" => 0.8, "BR" => 0.35, "IN" => 0.25
  }.freeze

  # department => [[job title, USD band], ...]
  DEPARTMENTS = {
    "Engineering" => [ [ "Junior Software Engineer", 60_000 ], [ "Software Engineer", 95_000 ],
                      [ "Senior Software Engineer", 135_000 ], [ "Staff Engineer", 175_000 ],
                      [ "Engineering Manager", 170_000 ] ],
    "Product" => [ [ "Associate Product Manager", 70_000 ], [ "Product Manager", 110_000 ],
                  [ "Senior Product Manager", 145_000 ], [ "Director of Product", 190_000 ] ],
    "Design" => [ [ "Junior Designer", 55_000 ], [ "Product Designer", 90_000 ],
                 [ "Senior Product Designer", 125_000 ], [ "Design Lead", 150_000 ] ],
    "Sales" => [ [ "Sales Development Rep", 50_000 ], [ "Account Executive", 85_000 ],
                [ "Senior Account Executive", 120_000 ], [ "Sales Manager", 140_000 ] ],
    "Marketing" => [ [ "Marketing Coordinator", 48_000 ], [ "Marketing Manager", 85_000 ],
                    [ "Senior Marketing Manager", 115_000 ], [ "Head of Marketing", 160_000 ] ],
    "Finance" => [ [ "Accountant", 60_000 ], [ "Financial Analyst", 80_000 ],
                  [ "Finance Manager", 120_000 ], [ "Controller", 160_000 ] ],
    "Human Resources" => [ [ "HR Coordinator", 50_000 ], [ "HR Business Partner", 85_000 ],
                          [ "Senior HR Business Partner", 110_000 ], [ "HR Director", 150_000 ] ],
    "Operations" => [ [ "Operations Associate", 48_000 ], [ "Operations Analyst", 70_000 ],
                     [ "Operations Manager", 105_000 ], [ "Head of Operations", 150_000 ] ],
    "Customer Support" => [ [ "Support Specialist", 42_000 ], [ "Senior Support Specialist", 58_000 ],
                           [ "Support Team Lead", 75_000 ], [ "Support Manager", 95_000 ] ],
    "Legal" => [ [ "Paralegal", 65_000 ], [ "Legal Counsel", 130_000 ],
                [ "Senior Legal Counsel", 170_000 ], [ "General Counsel", 230_000 ] ]
  }.freeze

  def self.usd_rate(country_code)
    BigDecimal(COUNTRIES.find { |code, *| code == country_code }[3].to_s)
  end

  # Annual salary in the country's local currency for a USD pay band.
  def self.salary_for(usd_band:, country_code:, rng:)
    jitter = BigDecimal(rng.rand(0.85..1.15).round(4).to_s)
    usd = BigDecimal(usd_band.to_s) * BigDecimal(COST_MULTIPLIER.fetch(country_code).to_s) * jitter
    (usd / usd_rate(country_code)).round(2)
  end
end
