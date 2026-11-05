# Seeds one HR manager, 8 countries, 10 departments and 10,000 employees
# with salary history. Deterministic (fixed random seed) and idempotent:
# does nothing if employees already exist.
require_relative "seeds/reference_data"

SEED = 42
EMPLOYEE_COUNT = 10_000
BATCH = 1_000

User.find_or_create_by!(email: "hr@acme.example") do |user|
  user.name = "HR Manager"
  user.password = ENV.fetch("SEED_HR_PASSWORD", "acme-hr-2026")
end

SeedData::COUNTRIES.each do |code, name, currency, rate|
  Country.find_or_create_by!(code: code) do |country|
    country.name = name
    country.currency_code = currency
    country.usd_rate = rate
    country.rate_as_of = SeedData::RATE_AS_OF
  end
end

SeedData::DEPARTMENTS.each_key { |name| Department.find_or_create_by!(name: name) }

if Employee.exists?
  puts "Employees already seeded (#{Employee.count}); skipping."
  return
end

started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
rng = Random.new(SEED)
Faker::Config.random = rng

hr = User.find_by!(email: "hr@acme.example")
countries = Country.all.index_by(&:code)
departments = Department.all.index_by(&:name)
department_names = departments.keys
weighted_codes = SeedData::COUNTRY_WEIGHTS.flat_map { |code, weight| [ code ] * (weight * 100).round }
now = Time.current
seed_today = Date.new(2026, 11, 1)

# A weak but fast way to keep emails unique across 10k Faker names.
used_emails = {}
email_for = lambda do |first, last, index|
  base = "#{first}.#{last}".downcase.gsub(/[^a-z.]/, "")
  candidate = "#{base}@acme.example"
  candidate = "#{base}#{index}@acme.example" if used_emails[candidate]
  used_emails[candidate] = true
  candidate
end

employee_rows = Array.new(EMPLOYEE_COUNT) do |i|
  code = weighted_codes[rng.rand(weighted_codes.size)]
  department_name = department_names[rng.rand(department_names.size)]
  title, band = SeedData::DEPARTMENTS[department_name][rng.rand(SeedData::DEPARTMENTS[department_name].size)]
  first = Faker::Name.first_name
  last = Faker::Name.last_name
  {
    first_name: first,
    last_name: last,
    email: email_for.call(first, last, i + 1),
    country_id: countries[code].id,
    department_id: departments[department_name].id,
    job_title: title,
    hired_on: Date.new(2012, 1, 1) + rng.rand(0..(seed_today - Date.new(2012, 1, 1)).to_i),
    created_at: now,
    updated_at: now,
    # not columns; stripped before insert, used to build salaries
    _band: band,
    _code: code
  }
end

employee_rows.each_slice(BATCH) do |slice|
  Employee.insert_all(slice.map { |row| row.except(:_band, :_code) })
end

ids = Employee.order(:id).pluck(:id)
salary_rows = []
employee_rows.each_with_index do |row, i|
  code = row[:_code]
  current = SeedData.salary_for(usd_band: row[:_band], country_code: code, rng: rng)
  currency = countries[code].currency_code
  history_size = rng.rand(1..3)
  # Current salary took effect within the last 18 months (never before hire);
  # earlier rows step back 12-24 months, each 4-12% lower, until the hire date.
  latest_on = [ seed_today - rng.rand(0..540), row[:hired_on] ].max
  amount = current
  effective_on = latest_on
  history_size.times do |n|
    break if n.positive? && effective_on < row[:hired_on]
    salary_rows << { employee_id: ids[i], amount: amount, currency_code: currency, effective_on: effective_on,
                     note: n.zero? ? nil : "Prior salary", created_by_id: hr.id, created_at: now, updated_at: now }
    effective_on -= rng.rand(365..730)
    amount = (amount * BigDecimal((1 - rng.rand(0.04..0.12)).round(4).to_s)).round(2)
  end
end

salary_rows.each_slice(BATCH) { |slice| Salary.insert_all(slice) }

Employee.connection.execute(<<~SQL)
  UPDATE employees SET current_salary_id = (
    SELECT s.id FROM salaries s WHERE s.employee_id = employees.id
    ORDER BY s.effective_on DESC, s.id DESC LIMIT 1
  )
SQL

elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started
puts "Seeded #{Employee.count} employees and #{Salary.count} salary rows in #{elapsed.round(1)}s."
