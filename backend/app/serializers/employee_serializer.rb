# JSON shapes for employees. Plain methods, no serializer gem.
module EmployeeSerializer
  module_function

  def summary(employee)
    {
      id: employee.id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      full_name: employee.full_name,
      email: employee.email,
      country: { code: employee.country.code, name: employee.country.name, currency_code: employee.country.currency_code },
      department: { id: employee.department.id, name: employee.department.name },
      job_title: employee.job_title,
      hired_on: employee.hired_on,
      salary: employee.current_salary && salary(employee.current_salary, employee.country)
    }
  end

  def salary(salary, country)
    {
      amount: salary.amount,
      currency_code: salary.currency_code,
      effective_on: salary.effective_on,
      usd: usd(salary.amount, country)
    }
  end

  def usd(amount, country)
    (amount * country.usd_rate).round(2)
  end
end
